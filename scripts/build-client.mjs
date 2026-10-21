// Assemble lib/client.js from src/client.js plus the Markdown vendor bundle.
//
// The client half is a classic client-modules factory; the vendor IIFE is pasted
// inside that factory (at `__DSHCURATE_VENDOR__`) so it stays factory-local.
//
// The plugin version is single-sourced from package.json: src/client.js carries
// the literal marker `__DSH_CURATE_VERSION__` and this script substitutes it in
// the generated bundle. A missing/duplicated marker or a non-semver version
// fails the build instead of shipping a stale or malformed version string.
import { readFile, writeFile } from 'node:fs/promises'

const VERSION_MARKER = '__DSH_CURATE_VERSION__'
const VENDOR_MARKER = '    /* __DSHCURATE_VENDOR__ */'
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const version = String(pkg.version || '')
if (!SEMVER.test(version)) {
  throw new Error(`package.json version is not semver: ${JSON.stringify(version)}`)
}

const client = await readFile('src/client.js', 'utf8')
const versionMarkers = client.split(VERSION_MARKER).length - 1
if (versionMarkers !== 1) {
  throw new Error(`expected exactly one ${VERSION_MARKER} marker in src/client.js, found ${versionMarkers}`)
}
const vendorMarkers = client.split(VENDOR_MARKER).length - 1
if (vendorMarkers !== 1) {
  throw new Error(`expected exactly one vendor marker in src/client.js, found ${vendorMarkers}`)
}

const vendor = await readFile('src/vendor.bundle.js', 'utf8')
const withVersion = client.replace(VERSION_MARKER, version)
const out = withVersion.replace(VENDOR_MARKER, '    ' + vendor.trim() + '\n')
if (out.includes(VERSION_MARKER)) throw new Error('version marker survived the build')
if (out.length === withVersion.length - VENDOR_MARKER.length) throw new Error('vendor marker was not replaced')
await writeFile('lib/client.js', out)
console.log(`lib/client.js written: ${out.length} bytes (version ${version})`)
