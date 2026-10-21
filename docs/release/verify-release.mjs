#!/usr/bin/env node
/**
 * Offline release-readiness check for dsh-curate (marketplace + npm packaging).
 *
 * Usage (from the repository root):
 *   node docs/release/verify-release.mjs            # print every check, exit 0
 *   node docs/release/verify-release.mjs --strict   # exit 1 on any failure
 *   node docs/release/verify-release.mjs --pack     # also inspect `npm pack --dry-run --json`
 *
 * Checks the rules documented in docs/release/publish-checklist.md against the
 * files on disk. It does not touch the network, git, or npm config.
 */
import { readFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { relative, isAbsolute, resolve } from 'node:path'

const STRICT = process.argv.includes('--strict')
const PACK = process.argv.includes('--pack')
const results = []
const pass = (message) => results.push(['PASS', message])
const fail = (message) => results.push(['FAIL', message])
const warn = (message) => results.push(['WARN', message])
const info = (message) => results.push(['INFO', message])

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

const pkg = await readJson('package.json')
if (pkg.name !== 'dsh-curate') fail(`package.json name is ${pkg.name}, expected dsh-curate`)

// --- bundle manifest -------------------------------------------------------
const patch = pkg.dsh?.bundle?.patch
if (typeof patch === 'string' && existsSync(patch)) {
  pass(`dsh.bundle.patch declares ${patch}, and the file exists`)
} else {
  fail('dsh.bundle.patch is missing or does not point at an existing file')
}
const patchText = existsSync('cordis.patch.yml') ? await readFile('cordis.patch.yml', 'utf8') : ''
if (/id:\s*dsh-curate/.test(patchText) && /name:\s*['"]?dsh-curate['"]?/.test(patchText)) {
  pass('cordis.patch.yml inserts id/name dsh-curate')
} else {
  fail('cordis.patch.yml does not insert the dsh-curate row')
}
if (pkg.dsh?.client?.platform === 'web') pass('dsh.client.platform is web')
else warn('dsh.client.platform is not "web"')

// --- dsh requirement placement --------------------------------------------
if (typeof pkg.engines?.dsh === 'string') {
  pass(`top-level engines.dsh = ${pkg.engines.dsh} (read by dsh-app-boot and dsh-market)`)
} else {
  fail('top-level engines.dsh is missing; the host gate falls back to @deepseek-ai/dsh-* peers')
}
if (pkg.dsh?.engines !== undefined) {
  warn('dsh.engines is present; dsh-app-boot ignores it (dsh-market reads it only as a fallback)')
}

// --- official peers need an explicit prerelease branch ---------------------
const official = Object.entries(pkg.peerDependencies ?? {}).filter(([name]) => name.startsWith('@deepseek-ai/'))
if (official.length === 0) warn('no @deepseek-ai/* peerDependencies declared')
for (const [name, range] of official) {
  if (/-rc\.\d+|-alpha\.\d+|-beta\.\d+/.test(range)) pass(`peer ${name} has an explicit prerelease branch: ${range}`)
  else fail(`peer ${name} has no explicit prerelease comparator: ${range}`)
}
for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
  if (name.startsWith('@deepseek-ai/')) fail(`official package ${name} is a dependency; it must be a peerDependency (${range})`)
}

// --- repository link (npm <-> GitHub) -------------------------------------
const repoUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
if (typeof repoUrl === 'string' && /github\.com[:/][^/]+\/dsh-curate(?:\.git)?$/.test(repoUrl)) {
  if (repoUrl.includes('OWNER')) fail('repository still contains the OWNER placeholder')
  else pass(`repository points at GitHub: ${repoUrl}`)
} else {
  fail('repository is missing or does not point at a GitHub dsh-curate repository')
}
if (typeof pkg.homepage === 'string' && pkg.homepage.includes('github.com')) pass('homepage points at GitHub')
else fail('homepage is missing or not a GitHub URL')
if (pkg.bugs?.url) pass('bugs.url is declared')
else fail('bugs.url is missing')
if (typeof pkg.author === 'string' && !pkg.author.includes('OWNER')) pass(`author: ${pkg.author}`)
else fail('author is missing or still the OWNER placeholder')

// --- display metadata: icon + locale --------------------------------------
const icon = pkg.icon
if (typeof icon === 'string') {
  const iconPath = resolve(icon)
  const insideRoot = !relative(process.cwd(), iconPath).startsWith('..') && !isAbsolute(relative(process.cwd(), iconPath))
  const size = existsSync(iconPath) ? statSync(iconPath).size : -1
  const ext = icon.toLowerCase().slice(icon.lastIndexOf('.'))
  if (size < 0) fail(`icon file does not exist: ${icon}`)
  else if (!insideRoot) fail(`icon must stay inside the package directory: ${icon}`)
  else if (!['.svg', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) fail(`icon must be SVG/PNG/JPEG/WebP: ${icon}`)
  else if (size > 256 * 1024) fail(`icon exceeds 256 KiB: ${size} bytes`)
  else pass(`icon ${icon} is ${size} bytes (limit 256 KiB)`)
  if (!(pkg.files ?? []).includes(icon)) fail(`files does not include the icon path ${icon}`)
} else {
  fail('package.json icon is missing; DSH cannot show a plugin icon')
}

const localeFiles = ['locale/en.json', 'locale/zh.json']
for (const file of localeFiles) {
  if (!existsSync(file)) {
    fail(`${file} is missing (copy it from docs/release/locale/)`)
    continue
  }
  try {
    const json = await readJson(file)
    if (typeof json.meta?.title === 'string' && json.meta.title.trim() !== '' &&
        typeof json.meta.description === 'string' && json.meta.description.trim() !== '') {
      pass(`${file} declares meta.title and meta.description`)
    } else {
      fail(`${file} must have non-empty meta.title and meta.description`)
    }
  } catch (error) {
    fail(`${file} is not valid JSON: ${error.message}`)
  }
}
if (pkg.exports?.['./locale/*.json']) pass('exports declares ./locale/*.json')
else fail('exports does not declare ./locale/*.json; the host cannot resolve locale files')
if ((pkg.files ?? []).includes('locale/*.json')) pass('files includes locale/*.json')
else fail('files does not include locale/*.json')

// --- npm packaging ---------------------------------------------------------
const files = pkg.files ?? []
for (const required of ['cordis.patch.yml', 'README.md', 'LICENSE', 'NOTICE.md']) {
  if (files.includes(required)) pass(`files includes ${required}`)
  else fail(`files does not include ${required}`)
}
for (const runtime of ['lib/index.js', 'lib/client.js', 'lib/surface.js', 'lib/edits.js', 'lib/backup.js']) {
  if (!existsSync(runtime)) fail(`runtime file is missing: ${runtime}`)
  else if (!files.includes(runtime)) fail(`files does not include ${runtime}`)
}
if (files.some((entry) => entry.startsWith('test') || entry.startsWith('src') || entry.startsWith('scripts'))) {
  warn('files lists development paths; confirm no dev leakage in the tarball')
} else {
  pass('files lists no src/, test/ or scripts/ paths')
}
if (pkg.publishConfig?.access === 'public') pass('publishConfig.access is public')
else warn('publishConfig.access is not "public" (unscoped packages default to public anyway)')

// --- screenshots -----------------------------------------------------------
if (!existsSync('screenshots.json')) {
  warn('screenshots.json is missing; storefronts will fall back to README images')
} else {
  try {
    const raw = await readJson('screenshots.json')
    const list = Array.isArray(raw) ? raw : raw.screenshots
    if (!Array.isArray(list)) {
      fail('screenshots.json must be an array or {"screenshots": [...]}')
    } else if (list.length < 1 || list.length > 8) {
      fail(`screenshots.json has ${list.length} entries; the catalog accepts 1-8`)
    } else {
      for (const entry of list) {
        if (typeof entry !== 'string') { fail('screenshots.json entries must be strings'); continue }
        if (entry.startsWith('/') || entry.includes('..')) { fail(`screenshot path must stay inside the plugin dir: ${entry}`); continue }
        if (!/^https:\/\//.test(entry) && !existsSync(entry)) { fail(`screenshot file does not exist: ${entry}`); continue }
        pass(`screenshot ${entry} exists`)
      }
      if (list.length) pass(`screenshots.json lists ${list.length} image(s) (limit 8)`)
    }
  } catch (error) {
    fail(`screenshots.json is not valid JSON: ${error.message}`)
  }
}

// --- README portability ----------------------------------------------------
if (existsSync('README.md')) {
  const readme = await readFile('README.md', 'utf8')
  if (/\/home\/[^\s`)]+/.test(readme) || /\/Users\/[^\s`)]+/.test(readme)) {
    warn('README.md contains absolute local paths; replace them with portable commands before publishing')
  } else {
    pass('README.md contains no absolute local paths')
  }
}

// --- optional tarball inspection ------------------------------------------
if (PACK) {
  try {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const parsed = JSON.parse(output)
    const entry = Object.values(parsed)[0]
    const entries = entry.files.map((file) => file.path)
    const required = ['package.json', 'cordis.patch.yml', 'lib/index.js', 'lib/client.js', 'README.md', 'LICENSE']
    for (const file of required) {
      if (entries.includes(file)) pass(`tarball contains ${file}`)
      else fail(`tarball is missing ${file}`)
    }
    for (const leaked of ['src/client.js', 'test/client.test.mjs', 'scripts/build-client.mjs', 'node_modules/']) {
      if (entries.some((file) => file.startsWith(leaked))) fail(`tarball leaks ${leaked}`)
    }
    info(`tarball: ${entry.entryCount} files, ${entry.size} bytes packed, ${entry.unpackedSize} bytes unpacked`)
  } catch (error) {
    fail(`npm pack --dry-run failed: ${error.message}`)
  }
}

// --- report ----------------------------------------------------------------
for (const [status, message] of results) console.log(`${status.padEnd(4)}  ${message}`)
const failures = results.filter(([status]) => status === 'FAIL').length
const warnings = results.filter(([status]) => status === 'WARN').length
console.log(`\n${results.length - failures - warnings} pass, ${warnings} warn, ${failures} fail`)
if (STRICT && failures > 0) process.exit(1)
