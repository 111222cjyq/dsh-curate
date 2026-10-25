// Chat-row decoration tests: the real transcript must show the applied text,
// keep an always-visible badge, switch back to the original, and restore every
// DOM mutation when it is torn down.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

function loadClient() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://127.0.0.1:3080/' })
  const win = dom.window
  let definition = null
  win.__ModuleLoader__ = { load: (value) => { definition = value } }
  const code = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  const run = new Function(
    'window', 'document', 'navigator', 'localStorage', 'fetch', 'URL', 'setTimeout', 'clearTimeout', 'console',
    code,
  )
  run(win, win.document, win.navigator, win.localStorage, () => Promise.reject(new Error('no fetch')), win.URL, setTimeout, clearTimeout, console)
  assert.ok(definition, 'client bundle must register itself')
  const mod = definition.factory((id) => {
    if (id === 'react') return React
    if (id === 'react/jsx-runtime') return require('react/jsx-runtime')
    throw new Error(`unexpected require: ${id}`)
  })
  return { dom, win, mod }
}

/** The two live Chat rows the decoration layer has to handle. */
function chatDom(win) {
  win.document.body.innerHTML = `
    <div data-chat-flow-key="14:assistant-step1:1" data-chat-flow-kind="assistant-step">
      <div class="assistant-body"><p>original answer</p></div>
      <div class="_actions"><button type="button">copy</button></div>
    </div>
    <div data-chat-flow-key="13:input-messageu1" data-chat-flow-kind="user">
      <div class="user-bubble"><p>original prompt</p></div>
    </div>
    <div data-chat-flow-key="20:turn-tail1" data-chat-flow-kind="turn-tail"><span>tail</span></div>
  `
}

function snapshotFixture() {
  const nodes = new Map([
    ['14:assistant-step1:1', { kind: 'assistant-step', anchorSeq: 14, data: { finalNode: { seq: 18, messageId: 'a1' } } }],
    ['13:input-messageu1', { kind: 'user', anchorSeq: 13, data: { seq: 13 } }],
    ['20:turn-tail1', { kind: 'turn-tail', anchorSeq: 20, data: { closing: { finalNode: { seq: 18, messageId: 'a1' } } } }],
  ])
  return { chat: { nodes: { get: (key) => nodes.get(key) } } }
}

const CHANGES = [
  {
    seq: 18,
    messageId: 'a1',
    role: 'assistant',
    kind: 'reply',
    blocks: [{ blockIndex: 1, blockKind: 'text', original: 'original answer', applied: 'patched **answer**' }],
  },
  {
    seq: 13,
    messageId: 'u1',
    role: 'user',
    kind: 'prompt',
    blocks: [{ blockIndex: 0, blockKind: 'text', original: 'original prompt', applied: 'patched prompt' }],
  },
]

test('applied mode replaces edited text, adds one badge per message and is idempotent', () => {
  const { win, mod } = loadClient()
  chatDom(win)
  const opened = []
  const first = mod.__internals.applyChatDisplay({
    document: win.document,
    sessionId: 'session-display-1',
    snapshot: snapshotFixture(),
    changes: CHANGES,
    mode: 'applied',
    onOpen: (sessionId, seqs) => opened.push([sessionId, seqs]),
  })
  assert.deepEqual(first, { rows: 2, elements: 2, badges: 2 })
  const assistant = win.document.querySelector('.assistant-body')
  assert.equal(assistant.querySelector('mark.dshcurate-inline-add').textContent, 'patched')
  assert.equal(assistant.querySelector('del.dshcurate-inline-del'), null,
    'a replacement shows the applied word marked, not old and new glued together')
  assert.equal(assistant.textContent, 'patched answer')
  assert.equal(win.document.querySelector('.user-bubble mark.dshcurate-inline-add').textContent, 'patched')
  assert.equal(win.document.querySelector('.user-bubble').textContent, 'patched prompt')
  assert.equal(win.document.querySelectorAll('.dshcurate-edited-badge').length, 2)
  assert.match(win.document.querySelector('.dshcurate-edited-badge').textContent, /已修改|Edited/)
  assert.match(win.document.querySelector('.dshcurate-edited-badge').textContent, /1/)
  assert.equal(win.document.querySelectorAll('.dshcurate-changed-row').length, 2)
  assert.equal(win.document.querySelector('[data-chat-flow-kind="turn-tail"] .dshcurate-edited-badge'), null,
    'the turn tail is not a message row')

  // A second pass must not double-badge or re-capture the already patched HTML.
  const second = mod.__internals.applyChatDisplay({
    document: win.document,
    sessionId: 'session-display-1',
    snapshot: snapshotFixture(),
    changes: CHANGES,
    mode: 'applied',
    onOpen: (sessionId, seqs) => opened.push([sessionId, seqs]),
  })
  assert.deepEqual(second, { rows: 2, elements: 2, badges: 2 })
  assert.equal(win.document.querySelectorAll('.dshcurate-edited-badge').length, 2)

  // The badge opens the comparison for its own message seqs.
  win.document.querySelector('.dshcurate-edited-badge').click()
  assert.deepEqual(opened, [['session-display-1', [18]]])
})

test('original mode restores the host HTML while keeping the badges', () => {
  const { win, mod } = loadClient()
  chatDom(win)
  const options = { document: win.document, sessionId: 'session-display-2', snapshot: snapshotFixture(), changes: CHANGES }
  mod.__internals.applyChatDisplay({ ...options, mode: 'applied' })
  assert.ok(win.document.querySelector('.assistant-body mark.dshcurate-inline-add'))

  mod.__internals.applyChatDisplay({ ...options, mode: 'original' })
  assert.equal(win.document.querySelector('.assistant-body').innerHTML, '<p>original answer</p>')
  assert.equal(win.document.querySelector('.user-bubble').innerHTML, '<p>original prompt</p>')
  assert.equal(win.document.querySelectorAll('.dshcurate-inline-add, .dshcurate-inline-del-note').length, 0)
  assert.equal(win.document.querySelectorAll('.dshcurate-edited-badge').length, 2)

  mod.__internals.applyChatDisplay({ ...options, mode: 'applied' })
  assert.ok(win.document.querySelector('.assistant-body mark.dshcurate-inline-add'))
  assert.equal(win.document.querySelectorAll('.dshcurate-edited-badge').length, 2)
})

test('restoreChatDisplay removes every marker and restores the original markup', () => {
  const { win, mod } = loadClient()
  chatDom(win)
  mod.__internals.applyChatDisplay({
    document: win.document,
    sessionId: 'session-display-3',
    snapshot: snapshotFixture(),
    changes: CHANGES,
    mode: 'applied',
  })
  mod.__internals.restoreChatDisplay('session-display-3')
  assert.equal(win.document.querySelector('.assistant-body').innerHTML, '<p>original answer</p>')
  assert.equal(win.document.querySelector('.user-bubble').innerHTML, '<p>original prompt</p>')
  assert.equal(win.document.querySelectorAll('.dshcurate-edited-badge').length, 0)
  assert.equal(win.document.querySelectorAll('.dshcurate-changed-row').length, 0)
})

test('a change with no rendered row is skipped without throwing', () => {
  const { win, mod } = loadClient()
  chatDom(win)
  const result = mod.__internals.applyChatDisplay({
    document: win.document,
    sessionId: 'session-display-4',
    snapshot: snapshotFixture(),
    changes: [{
      seq: 99,
      messageId: 'missing',
      role: 'assistant',
      kind: 'reply',
      blocks: [{ blockIndex: 0, blockKind: 'text', original: 'not there', applied: 'never' }],
    }],
    mode: 'applied',
  })
  assert.deepEqual(result, { rows: 0, elements: 0, badges: 0 })
  assert.equal(win.document.querySelectorAll('.dshcurate-edited-badge').length, 0)
})

test('an appended reply without original text still gets the badge and modal data', () => {
  const { win, mod } = loadClient()
  chatDom(win)
  mod.__internals.applyChatDisplay({
    document: win.document,
    sessionId: 'session-display-5',
    snapshot: snapshotFixture(),
    changes: [{
      seq: 18,
      messageId: 'a1',
      role: 'assistant',
      kind: 'reply',
      blocks: [{ blockIndex: -1, blockKind: 'text', append: true, original: '', applied: 'added answer' }],
    }],
    mode: 'applied',
  })
  assert.equal(win.document.querySelectorAll('.dshcurate-edited-badge').length, 1)
  assert.equal(win.document.querySelector('.assistant-body').textContent, 'original answer',
    'no original anchor: inline replacement stays off, the dialog/badge still works')
})

test('a pure deletion leaves a visible note in the applied text', () => {
  const { win, mod } = loadClient()
  chatDom(win)
  win.document.querySelector('.assistant-body').innerHTML = '<p>keep this and remove the tail</p>'
  mod.__internals.applyChatDisplay({
    document: win.document,
    sessionId: 'session-display-delete',
    snapshot: snapshotFixture(),
    changes: [{
      seq: 18,
      messageId: 'a1',
      role: 'assistant',
      kind: 'reply',
      blocks: [{ blockIndex: 1, blockKind: 'text', original: 'keep this and remove the tail', applied: 'keep this' }],
    }],
    mode: 'applied',
  })
  const row = win.document.querySelector('.assistant-body')
  assert.equal(row.textContent.includes('keep this'), true)
  assert.equal(row.textContent.includes('remove the tail'), false)
  const note = row.querySelector('.dshcurate-inline-del-note')
  assert.ok(note, 'deleted-only text is summarized instead of rendered inline')
  assert.match(note.textContent, /\d+/)
})

test('seqsForNode maps every chat row kind the wrapper can decorate', () => {
  const { mod } = loadClient()
  const seqs = mod.__internals.seqsForNode
  assert.deepEqual(seqs({ kind: 'user', anchorSeq: 12, data: { seq: 13 } }), [13])
  assert.deepEqual(seqs({ kind: 'assistant-step', anchorSeq: 14, data: { finalNode: { seq: 18 } } }), [14, 18])
  assert.deepEqual(seqs({ kind: 'context', data: { seq: 30 } }), [30])
  assert.deepEqual(seqs({ kind: 'tool-call', data: { root: { seq: 40 } } }), [40])
  assert.deepEqual(seqs({ kind: 'turn-tail', anchorSeq: 20, data: { closing: { finalNode: { seq: 18 } } } }), [20, 18])
})

test('findDisplayTarget prefers the deepest exact element and ignores chrome', () => {
  const { win, mod } = loadClient()
  win.document.body.innerHTML = '<div class="row"><div class="md"><p>target text</p></div><button>target text</button></div>'
  const row = win.document.querySelector('.row')
  const target = mod.__internals.findDisplayTarget(row, 'target text')
  assert.equal(target.tagName, 'P')
  assert.equal(mod.__internals.normalizeDisplayText(' a\n b '), 'a b')
})

test('ChangeToggle and ChangeDetail render the count and the applied full text', () => {
  const { mod } = loadClient()
  const entry = mod.__internals.changeSessionFor('session-detail')
  entry.changes = [{
    seq: 18,
    messageId: 'a1',
    role: 'assistant',
    kind: 'reply',
    blocks: [{ blockIndex: 1, blockKind: 'text', original: 'original answer', applied: 'patched answer' }],
  }]
  const toggle = renderToStaticMarkup(React.createElement(mod.__internals.ChangeToggle, { sessionId: 'session-detail' }))
  assert.match(toggle, /修改后 1|Applied 1/)
  assert.match(toggle, /dshcurate-display-toggle/)

  mod.__internals.openChangeDetail('session-detail', [18])
  const html = renderToStaticMarkup(React.createElement(mod.__internals.ChangeDetail, { sessionId: 'session-detail' }))
  assert.match(html, /dshcurate-change-panel/)
  assert.match(html, /patched answer/)
  assert.match(html, /写入上下文|In context/)
  assert.match(html, /原文|Original/)
  assert.match(html, /复制全文|Copy full text/)
  assert.match(html, /改动|Changes/)
  mod.__internals.closeChangeDetail()
})

test('computeInlineDiff marks only the changed runs and keeps both sides', () => {
  const { mod } = loadClient()
  const diff = mod.__internals.computeInlineDiff('凌晨三点，天色很暗。', '凌晨六点，天色很暗。')
  assert.equal(diff.filter((segment) => segment.type === 'delete').map((segment) => segment.text).join(''), '三')
  assert.equal(diff.filter((segment) => segment.type === 'insert').map((segment) => segment.text).join(''), '六')
  assert.equal(diff.filter((segment) => segment.type === 'equal').map((segment) => segment.text).join(''), '凌晨点，天色很暗。')
  assert.equal(mod.__internals.countDiffHunks(diff), 1)

  const multiple = mod.__internals.computeInlineDiff('甲一乙二丙', '甲三乙四丙')
  assert.equal(mod.__internals.countDiffHunks(multiple), 2)
  assert.equal(multiple.filter((segment) => segment.type === 'insert').map((segment) => segment.text).join(''), '三四')

  assert.equal(mod.__internals.countDiffHunks(mod.__internals.computeInlineDiff('a\n  b\n', 'a\n    b\n')), 0,
    'indentation-only changes are formatting noise, not counted edits')
  assert.deepEqual(mod.__internals.computeInlineDiff('same', 'same'), [{ type: 'equal', text: 'same' }])
  assert.deepEqual(mod.__internals.computeInlineDiff('', 'added'), [{ type: 'insert', text: 'added' }])
  assert.deepEqual(mod.__internals.computeInlineDiff('removed', ''), [{ type: 'delete', text: 'removed' }])
})

test('a changed line is diffed down to the changed token', () => {
  const { mod } = loadClient()
  const before = '第一段\n很久以前，有个写小说的人习惯在凌晨三点写东西。\n第三段'
  const after = '第一段\n很久以前，有个写小说的人习惯在凌晨六点写东西。\n第三段'
  const diff = mod.__internals.computeInlineDiff(before, after)
  assert.equal(mod.__internals.countDiffHunks(diff), 1)
  assert.match(diff.map((segment) => segment.text).join(''), /凌晨/)
  assert.equal(diff.filter((segment) => segment.type === 'delete').map((segment) => segment.text).join(''), '三')
  assert.equal(diff.filter((segment) => segment.type === 'insert').map((segment) => segment.text).join(''), '六')
})

test('a projection-invalidated host error tells the user to restart', () => {
  const { mod } = loadClient()
  const text = mod.__internals.hostErrorText(
    new Error('session message projection "plugin:dsh-curate/patch" was removed or replaced; restore the session with its owning plugin'),
    'edit',
  )
  assert.match(text, /restart dsh web|重启 dsh web/i)
})

test('markdown matching ignores emphasis markers and unwraps them for display', () => {
  const { mod } = loadClient()
  assert.equal(mod.__internals.matchDisplayText('**1。** 下一句'), mod.__internals.matchDisplayText('1。下一句'))
  assert.equal(mod.__internals.displayTextForChat('**粗体** 和 `code`'), '粗体 和 code')
})
