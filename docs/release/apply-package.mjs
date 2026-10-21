#!/usr/bin/env node
/**
 * Deterministic packaging-field update for dsh-curate.
 *
 * The release engineer does not own package.json; this script is the exact,
 * reviewable form of the proposed edits in docs/release/apply.md, so whoever
 * owns package.json can apply them in one command instead of hand-merging JSON.
 *
 * Usage (from the repository root):
 *   OWNER=<github-user-or-org> node docs/release/apply-package.mjs
 *   OWNER=<github-user-or-org> node docs/release/apply-package.mjs --check
 *
 * OWNER is inferred from `git remote get-url origin` when omitted, which works
 * only after the GitHub repository exists. `--check` never writes: it prints
 * the fields that would change and exits 1 while the proposal is unapplied.
 *
 * What it changes (and nothing else):
 *   - repository / homepage / bugs / author        (npm -> GitHub link)
 *   - icon: assets/icon.svg                        (DSH display metadata)
 *   - exports: + "./locale/*.json"                 (localized title/description)
 *   - files: + "assets/icon.svg", "locale/*.json"  (ship display metadata)
 *   - keywords: + session, summarization
 *   - publishConfig: access public
 *   - engines.dsh at the TOP level                 (read by dsh-app-boot and dsh-market)
 *   - dsh.engines removed                          (not read by the host; the market
 *                                                   reads it only as a fallback)
 *   - dsh.manifestVersion: 1
 *   - peerDependencies["@deepseek-ai/dsh-session"] explicit prerelease branch
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const CHECK = process.argv.includes('--check')
const PACKAGE_ORDER = [
  'name', 'version', 'description', 'icon', 'author', 'type', 'main', 'exports',
  'files', 'keywords', 'license', 'repository', 'homepage', 'bugs', 'engines',
  'scripts', 'dependencies', 'devDependencies', 'peerDependencies', 'dsh',
  'publishConfig',
]

function fail(message) {
  console.error(`apply-package: ${message}`)
  process.exit(1)
}

function ownerFromGit() {
  try {
    const raw = execFileSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const match = raw.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

if (!existsSync('package.json')) fail('run this from the dsh-curate repository root')
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
if (pkg.name !== 'dsh-curate') fail(`unexpected package name: ${pkg.name}`)

const owner = process.env.OWNER?.trim() || ownerFromGit()
if (owner === null && !CHECK) fail('set OWNER=<github-user-or-org> (or add the git origin remote)')
const repoUrl = owner === null ? 'https://github.com/OWNER/dsh-curate' : `https://github.com/${owner}/dsh-curate`

const next = structuredClone(pkg)

next.icon = 'assets/icon.svg'
next.repository = { type: 'git', url: `git+${repoUrl}.git` }
next.homepage = `${repoUrl}#readme`
next.bugs = { url: `${repoUrl}/issues` }
next.author = `${owner ?? 'OWNER'} (${repoUrl})`

next.exports = { ...pkg.exports, './locale/*.json': './locale/*.json' }
const droppedFiles = new Set(['assets/icon.svg', 'locale/*.json', 'screenshots.json'])
next.files = [
  ...(pkg.files ?? []).filter((entry) => !droppedFiles.has(entry)),
  'assets/icon.svg',
  'locale/*.json',
]

next.keywords = [...new Set([...(pkg.keywords ?? []), 'session', 'summarization'])]

next.publishConfig = { access: 'public' }

// Top-level engines.dsh is what dsh-app-boot's compatibility gate reads
// (dsh.engines.dsh is ignored there); dsh-market reads top-level first too.
next.engines = { ...(pkg.engines ?? {}), dsh: '>=0.2.1-rc.2' }
// Keep the public dsh fields in a stable, reviewable order and drop the
// non-standard dsh.engines (the host reads the top-level engines.dsh above).
const dsh = { manifestVersion: 1 }
for (const key of ['bundle', 'profile', 'client', 'compatibility']) {
  if (pkg.dsh?.[key] !== undefined) dsh[key] = pkg.dsh[key]
}
next.dsh = dsh

next.peerDependencies = {
  ...(pkg.peerDependencies ?? {}),
  // Explicit prerelease branch on the 0.2.1 tuple: matches 0.2.1-rc.* and
  // later 0.2.x, and does not pretend the untested 0.2.0 line is supported.
  '@deepseek-ai/dsh-session': '^0.2.1-rc.2',
}

const ordered = {}
for (const key of PACKAGE_ORDER) if (key in next) ordered[key] = next[key]
for (const key of Object.keys(next)) if (!(key in ordered)) ordered[key] = next[key]

const before = `${JSON.stringify(pkg, null, 2)}\n`
const after = `${JSON.stringify(ordered, null, 2)}\n`
const changed = Object.keys(ordered).filter(
  (key) => JSON.stringify(ordered[key]) !== JSON.stringify(pkg[key]),
)
const removed = Object.keys(pkg).filter((key) => !(key in ordered))

if (CHECK) {
  const metadata = [
    ['assets/icon.svg', existsSync('assets/icon.svg')],
    // screenshots.json is optional and intentionally absent: the current live
    // capture contains a personal session and must not be published.
    ['locale/en.json', existsSync('locale/en.json')],
    ['locale/zh.json', existsSync('locale/zh.json')],
  ]
  console.log('package.json proposal status:')
  console.log(before === after ? '  PASS  package.json already matches the proposal' : `  PENDING  fields to change: ${changed.join(', ')}${removed.length ? `; fields to remove: ${removed.join(', ')}` : ''}`)
  for (const [file, present] of metadata) {
    console.log(`  ${present ? 'PASS' : 'MISSING'}  ${file}`)
  }
  const done = before === after && metadata.every(([, present]) => present)
  process.exit(done ? 0 : 1)
}

if (before === after) {
  console.log('package.json already matches the proposal; nothing written')
} else {
  await writeFile('package.json', after)
  console.log(`package.json updated (fields: ${changed.join(', ')}${removed.length ? `; removed: ${removed.join(', ')}` : ''})`)
}
console.log(`repository: ${repoUrl}`)
console.log('next: copy docs/release/locale/*.json to locale/ and run')
console.log('      node docs/release/verify-release.mjs')
console.log('      npm pack --dry-run --json')
