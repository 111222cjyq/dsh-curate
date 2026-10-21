// Build the Markdown vendor bundle embedded into lib/client.js.
import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'

const result = await build({
  entryPoints: ['src/vendor.js'],
  bundle: true,
  format: 'iife',
  globalName: '__DSHCURATE_VENDOR__',
  platform: 'browser',
  target: ['chrome110', 'safari16'],
  minify: true,
  legalComments: 'none',
  write: false,
})

const output = result.outputFiles && result.outputFiles[0] ? result.outputFiles[0].text : ''
if (output === '') throw new Error('esbuild produced no vendor output')
await mkdir('src', { recursive: true })
await writeFile('src/vendor.bundle.js', output)
console.log(`vendor bundle written: ${output.length} bytes`)
