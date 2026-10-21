// Vendor entry: Markdown <-> editable HTML for the summary editor.
//
// Bundled by scripts/build-vendor.mjs into an IIFE and injected at the
// `__DSHCURATE_VENDOR__` marker inside lib/client.js.
import { marked } from 'marked'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import DOMPurify from 'dompurify'

marked.setOptions({ gfm: true, breaks: false })

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
})
turndown.use(gfm)

export { marked, turndown, DOMPurify }
