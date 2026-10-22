import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'

const require = createRequire(import.meta.url)
const React = require('react')

// The client bundle injects the package version at build time; the fake host
// payload must match it so the happy path shows no version banner.
const PACKAGE_VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version

function loadClient(fetchImpl) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://127.0.0.1:3080/' })
  const win = dom.window
  let definition = null
  win.__ModuleLoader__ = { load: (value) => { definition = value } }
  const code = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  const run = new Function(
    'window', 'document', 'navigator', 'localStorage', 'fetch', 'URL', 'setTimeout', 'clearTimeout', 'console',
    code,
  )
  run(win, win.document, win.navigator, win.localStorage, fetchImpl, win.URL, setTimeout, clearTimeout, console)
  assert.ok(definition, 'client bundle must register itself')
  const mod = definition.factory((id) => {
    if (id === 'react') return React
    if (id === 'react/jsx-runtime') return require('react/jsx-runtime')
    throw new Error(`unexpected require: ${id}`)
  })
  return { dom, win, mod }
}

function statePayload(version = PACKAGE_VERSION) {
  const typeOf = (role) => (role === 'assistant' ? 'assistant/message' : role === 'tool' ? 'tool/result' : 'user/message')
  const node = (seq, role, turn, preview, editable, editKind) => ({
    seq, type: typeOf(role), role, turn,
    messageId: `m${seq}`, tokens: 10, blocks: 1, attachments: 0, toolCalls: [], toolResultFor: null,
    isError: false, preview, previewPlain: role === 'tool' ? '' : preview, truncated: false,
    editable, editKind, editReason: '', patched: false,
  })
  return {
    ok: true, version, sessionId: 'session-1', cwd: '/work', live: true, busy: false, lastSeq: 6,
    nodes: [
      node(1, 'user', 1, '你好', true, 'prompt'),
      node(2, 'assistant', 1, '回答', true, 'reply'),
      node(3, 'tool', 1, 'tool-out', true, 'tool'),
      node(4, 'user', 2, '第二问', true, 'prompt'),
      node(5, 'assistant', 2, '第二答', true, 'reply'),
      node(6, 'user', 3, '最新', true, 'prompt'),
    ],
    totalTokens: 60, surfaceTokens: 60, preserveRecentTurns: 2,
    limits: {}, capabilities: { edit: true, patch: true, compaction: true }, config: {},
  }
}

test('Workbench ready state renders cards, the tail and all four footer actions', async () => {
  const payload = statePayload()
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { dom, win, mod } = loadClient(fetchImpl)
  globalThis.window = win
  globalThis.document = win.document
  Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true, writable: true })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const ReactDOMClient = require('react-dom/client')
  const container = win.document.getElementById('root')
  const root = ReactDOMClient.createRoot(container)
  try {
    const { act } = React
    await act(async () => {
      root.render(React.createElement(mod.__internals.Workbench, { sessionId: 'session-1', onClose: () => {} }))
    })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })

    assert.equal(container.querySelectorAll('.dshcurate-card').length, 3, 'turn 1, locked turn 2 and the tail')
    assert.equal(container.querySelectorAll('.dshcurate-card.locked').length, 2, 'the locked recent turn and the tail')
    const footer = Array.from(container.querySelectorAll('.dshcurate-foot button')).map((button) => button.textContent.trim())
    assert.equal(footer.length, 4, JSON.stringify(footer))
    assert.match(footer[0], /Apply to context|应用到上下文/)
    assert.match(footer[1], /Compress context|压缩上下文/)
    assert.match(footer[2], /Save current content|保存当前内容/)
    assert.match(footer[3], /Undo|撤销/)
    const apply = container.querySelectorAll('.dshcurate-foot button')[0]
    assert.equal(apply.disabled, true, 'apply is disabled without staged edits')
    const compress = container.querySelectorAll('.dshcurate-foot button')[1]
    assert.equal(compress.disabled, false)
    assert.ok(container.querySelector('.dshcurate-card.locked .dshcurate-message'), 'the tail renders as a message detail')
    assert.equal(container.querySelectorAll('.dshcurate-version-banner').length, 0, 'matching versions show no banner')
    assert.equal(container.querySelectorAll('.dshcurate-snippet').length, 5, 'turn 1 has 3, turn 2 has 2')
    assert.match(container.textContent, /tool-out/)
    assert.ok(container.querySelectorAll('.dshcurate-snippet-pencil').length > 0, 'editable previews expose a pencil')
    assert.ok(container.querySelectorAll('.dshcurate-segment').length > 0, 'compressible groups expose segment summaries')

    const textOnly = Array.from(container.querySelectorAll('.dshcurate-view button'))
      .find((button) => /Dialogue text only|仅对话文本/.test(button.textContent))
    assert.ok(textOnly, 'the text-only view switch is rendered')
    await act(async () => { textOnly.click() })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
    assert.equal(container.querySelectorAll('.dshcurate-snippet').length, 4, 'the tool result is hidden')
    assert.doesNotMatch(container.textContent, /tool-out/)
    assert.match(container.textContent, /已隐藏 1 条工具\/上下文|1 tool\/context item\(s\) hidden/)

    const help = container.querySelector('.dshcurate-help')
    assert.ok(help, 'the help button is in the header')
    await act(async () => { help.click() })
    assert.ok(container.querySelector('.dshcurate-help-pop'), 'the help popover opens')
    assert.match(container.textContent, /最后一条消息永远保留|final message is always kept/)
    await act(async () => { help.click() })

    const saveButton = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /Save current content|保存当前内容/.test(button.textContent))
    assert.ok(saveButton, 'the save button is rendered')
    await act(async () => { saveButton.click() })
    assert.match(container.textContent, /Draft saved locally|草稿已保存到本地/)

    const compressButton = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /Compress context|压缩上下文/.test(button.textContent))
    assert.ok(compressButton, 'the compress button is rendered')
    await act(async () => { compressButton.click() })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
    const modifiedTarget = Array.from(container.querySelectorAll('.dshcurate-compress .dshcurate-option'))
      .find((option) => /Compress the modified context|压缩修改后的上下文/.test(option.textContent))
    assert.ok(modifiedTarget, 'the modified-context target is rendered')
    assert.equal(modifiedTarget.querySelector('input').disabled, true, 'the modified target is disabled without staged edits')
    const curatedMethod = Array.from(container.querySelectorAll('.dshcurate-compress .dshcurate-option'))
      .find((option) => /Compress the curated blocks|按整理结果压缩/.test(option.textContent))
    assert.ok(curatedMethod, 'the curated compression method is rendered')
    assert.equal(curatedMethod.querySelector('input').disabled, false, 'curated compression no longer needs drafted summaries')
    assert.equal(container.querySelectorAll('.dshcurate-segment input, .dshcurate-segment textarea').length, 0, 'segment cards expose no summary editor')
    const closeCompress = Array.from(container.querySelectorAll('.dshcurate-compress button'))
      .find((button) => /Keep reviewing|再检查一下/.test(button.textContent))
    assert.ok(closeCompress, 'the compression panel can be closed')
    await act(async () => { closeCompress.click() })

    const important = Array.from(container.querySelectorAll('.dshcurate-card .dshcurate-tones .dshcurate-tone'))
      .find((button) => /Important|重要/.test(button.textContent))
    assert.ok(important, 'the group bulk tone control is rendered')
    await act(async () => { important.click() })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
    assert.ok(container.querySelectorAll('.dshcurate-segment.keep').length > 0, 'bulk Important keeps the turn verbatim')

    const undoButton = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /Undo|撤销/.test(button.textContent))
    assert.ok(undoButton, 'the undo button is rendered')
    assert.equal(undoButton.disabled, false, 'undo becomes available after a tone change')
    await act(async () => { undoButton.click() })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
    assert.equal(undoButton.disabled, true, 'undo is disabled once the stack is empty')

    const lockedToneHost = container.querySelector('.dshcurate-card.locked .dshcurate-tones')
    assert.ok(lockedToneHost, 'recent turns keep their bulk tone controls')
    const lockedNormal = Array.from(lockedToneHost.querySelectorAll('.dshcurate-tone'))
      .find((button) => /Normal|一般/.test(button.textContent))
    assert.ok(lockedNormal, 'recent turns allow an override tone')
    await act(async () => { lockedNormal.click() })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
    assert.ok(
      Array.from(container.querySelectorAll('.dshcurate-card.locked .dshcurate-badge'))
        .some((badge) => /Overridden|已覆盖/.test(badge.textContent)),
      'overriding a recent turn is marked',
    )
    // Let the debounced draft timer settle before unmounting; otherwise React
    // schedules an update after the test has ended.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)) })
    await act(async () => { root.unmount() })
  } catch (error) {
    try { root.unmount() } catch {}
    throw error
  }
})


test('Workbench applies staged edits, then compresses with auto-generated summaries', async () => {
  const payload = statePayload()
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const path = String(url)
    calls.push({ path, body: options.body ? JSON.parse(options.body) : null })
    if (path.includes('/dsh-curate/state')) {
      const compressed = calls.some((call) => call.path.includes('/apply'))
      return { ok: true, json: async () => ({ ...payload, lastSeq: compressed ? 8 : 6 }) }
    }
    if (path.endsWith('/edit')) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          applied: [{ seq: 2, mode: 'reply', blockIndex: 0, kind: 'text' }],
          unchanged: [],
          nodes: {},
          lastSeq: 7,
          backupFile: '/tmp/edit.json',
        }),
      }
    }
    if (path.endsWith('/apply')) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          applied: [{ kind: 'summary', startSeq: 1, endSeq: 1, replacementSeq: 20, shadowed: [1] }],
          lastSeq: 8,
          backupFile: '/tmp/apply.json',
        }),
      }
    }
    throw new Error(`unexpected fetch: ${path}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  win.localStorage.setItem('dsh-curate:draft:session-1', JSON.stringify({
    version: 3,
    lastSeq: 6,
    preserveTurns: 2,
    tones: [
      { seq: 1, tone: 'minor' },
      { seq: 2, tone: 'minor' },
      { seq: 3, tone: 'minor' },
      { seq: 4, tone: 'normal' },
      { seq: 5, tone: 'normal' },
    ],
    edits: [{ seq: 2, messageId: 'm2', mode: 'reply', blockIndex: 0, kind: 'text', text: '改过的回答', original: '回答' }],
  }))
  globalThis.window = win
  globalThis.document = win.document
  Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true, writable: true })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const ReactDOMClient = require('react-dom/client')
  const container = win.document.getElementById('root')
  const root = ReactDOMClient.createRoot(container)
  try {
    const { act } = React
    await act(async () => {
      root.render(React.createElement(mod.__internals.Workbench, { sessionId: 'session-1', onClose: () => {} }))
    })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })

    const compressButton = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /Compress context|压缩上下文/.test(button.textContent))
    assert.ok(compressButton)
    await act(async () => { compressButton.click() })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })

    const modified = Array.from(container.querySelectorAll('.dshcurate-compress .dshcurate-option'))
      .find((option) => /Compress the modified context|压缩修改后的上下文/.test(option.textContent))
    assert.ok(modified)
    assert.equal(modified.querySelector('input').disabled, false, 'staged edits enable the modified target')
    await act(async () => { modified.querySelector('input').click() })

    const checkbox = container.querySelector('.dshcurate-compress input[type="checkbox"]')
    assert.ok(checkbox, 'the irreversible confirmation checkbox is rendered')
    await act(async () => { checkbox.click() })

    const confirmButton = Array.from(container.querySelectorAll('.dshcurate-compress-foot button'))
      .find((button) => /Compress|确认压缩/.test(button.textContent))
    assert.ok(confirmButton)
    assert.equal(confirmButton.disabled, false, 'the confirm button is enabled')
    await act(async () => { confirmButton.click() })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 80)) })

    const editIndex = calls.findIndex((call) => call.path.endsWith('/edit'))
    const applyIndex = calls.findIndex((call) => call.path.endsWith('/apply'))
    assert.ok(editIndex >= 0, 'the staged edit is applied first')
    assert.ok(applyIndex > editIndex, 'the compression plan is applied after the edits')
    const applyBody = calls[applyIndex].body
    assert.equal(applyBody.autoSummarize, true, 'the host writes summaries at compression time')
    assert.equal(applyBody.expectedLastSeq, 7, 'the plan targets the post-edit session head')
    assert.ok(applyBody.ops.length > 0)
    assert.ok(applyBody.ops.every((op) => op.kind === 'summary' && (op.tone === 'normal' || op.tone === 'minor')))
    assert.ok(!('text' in applyBody.ops[0]), 'the client sends no hand-written summary text')

    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)) })
    await act(async () => { root.unmount() })
  } catch (error) {
    try { root.unmount() } catch {}
    throw error
  }
})


test('Workbench shows a reload banner when host and client versions differ', async () => {
  const payload = statePayload('0.2.0')
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { dom, win, mod } = loadClient(fetchImpl)
  globalThis.window = win
  globalThis.document = win.document
  Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true, writable: true })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const ReactDOMClient = require('react-dom/client')
  const container = win.document.getElementById('root')
  const root = ReactDOMClient.createRoot(container)
  try {
    const { act } = React
    await act(async () => {
      root.render(React.createElement(mod.__internals.Workbench, { sessionId: 'session-1', onClose: () => {} }))
    })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })
    assert.equal(container.querySelectorAll('.dshcurate-version-banner').length, 1)
    assert.match(container.textContent, /0\.2\.0/)
    assert.match(container.textContent, /Reload page|重新加载页面/)
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)) })
    await act(async () => { root.unmount() })
  } catch (error) {
    try { root.unmount() } catch {}
    throw error
  }
})

// --- 0.5.0 client-half interaction regressions ------------------------------

/** Minimal surface node for synthetic session payloads. */
function typedNode(seq, role, turn, preview, editable = false, editKind = null) {
  const type = role === 'assistant' ? 'assistant/message' : role === 'tool' ? 'tool/result' : 'user/message'
  return {
    seq, type, role, turn, messageId: `m${seq}`, tokens: 10, blocks: 1, attachments: 0,
    toolCalls: [], toolResultFor: null, isError: false, preview,
    previewPlain: role === 'tool' ? '' : preview, truncated: false,
    editable, editKind, editReason: '', patched: false,
  }
}

/** Mount the workbench body in jsdom and wait for its first load. */
async function mountWorkbench(win, mod, props = {}) {
  globalThis.window = win
  globalThis.document = win.document
  Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true, writable: true })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const ReactDOMClient = require('react-dom/client')
  const container = win.document.getElementById('root')
  const root = ReactDOMClient.createRoot(container)
  const act = React.act
  let closeCalls = 0
  const onClose = () => {
    closeCalls += 1
    if (typeof props.onClose === 'function') props.onClose()
  }
  await act(async () => {
    root.render(React.createElement(mod.__internals.Workbench, { sessionId: 'session-1', onClose, ...props, onClose }))
  })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })
  return { root, container, act, closeCalls: () => closeCalls }
}

async function settle(act, ms = 30) {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)) })
}

async function unmountQuietly(act, root) {
  try {
    await act(async () => { root.unmount() })
  } catch {}
}

test('Workbench restores a saved draft after the session grew and keeps it in the autosave', async () => {
  const payload = { ...statePayload(), lastSeq: 7 }
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  win.localStorage.setItem('dsh-curate:draft:session-1', JSON.stringify({
    version: 3,
    lastSeq: 6,
    preserveTurns: 1,
    textOnlyView: false,
    summaryTextOnly: false,
    tones: [{ seq: 1, tone: 'minor' }, { seq: 2, tone: 'minor' }],
    edits: [{ seq: 4, messageId: 'm4', mode: 'prompt', text: '改过的问题' }],
  }))
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    assert.match(container.textContent, /Restored the draft you saved earlier|已恢复你上次保存的草稿/,
      'the panel warns that an earlier draft was restored')
    await settle(act, 450)
    const stored = JSON.parse(win.localStorage.getItem('dsh-curate:draft:session-1'))
    assert.equal(stored.version, 4, 'new drafts use schema v4')
    assert.equal(stored.lastSeq, 7, 'the salvaged draft is rebound to the new session head')
    assert.deepEqual(stored.tones.map((item) => item.seq).sort((a, b) => a - b), [1, 2],
      'tones whose seq still exists are restored')
    assert.equal(stored.edits.length, 1, 'staged edits on surviving messages are restored')
    assert.equal(stored.preserveTurns, 1, 'the draft scope is still applied')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('Workbench keeps a non-restorable saved draft instead of overwriting it empty', async () => {
  const payload = { ...statePayload(), lastSeq: 6 }
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const original = JSON.stringify({
    version: 3,
    lastSeq: 5,
    preserveTurns: 2,
    textOnlyView: false,
    summaryTextOnly: false,
    tones: [{ seq: 90, tone: 'minor' }],
    edits: [],
  })
  win.localStorage.setItem('dsh-curate:draft:session-1', original)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    assert.match(container.textContent, /None of the messages marked|无法恢复/)
    await settle(act, 450)
    assert.equal(win.localStorage.getItem('dsh-curate:draft:session-1'), original,
      'an empty autosave never replaces a non-empty saved draft')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('save current content reports a storage failure instead of claiming success', async () => {
  const payload = statePayload()
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    Object.defineProperty(win.Storage.prototype, 'setItem', {
      configurable: true,
      writable: true,
      value() { throw new win.DOMException('quota', 'QuotaExceededError') },
    })
    const save = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /Save current content|保存当前内容/.test(button.textContent))
    await act(async () => { save.click() })
    assert.match(container.textContent, /Could not save the draft|草稿保存失败/)
    assert.doesNotMatch(container.textContent, /Draft saved locally|草稿已保存到本地/)
  } finally {
    await unmountQuietly(act, root)
  }
})

test('closing the panel inside the draft debounce still flushes the last change', async () => {
  const payload = statePayload()
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  const minor = Array.from(container.querySelectorAll('.dshcurate-card:not(.locked) .dshcurate-tones .dshcurate-tone'))
    .find((button) => /Minor|次要/.test(button.textContent))
  assert.ok(minor, 'an unlocked card exposes its tone buttons')
  await act(async () => { minor.click() })
  // Unmount well inside the 350 ms debounce window.
  await unmountQuietly(act, root)
  const stored = JSON.parse(win.localStorage.getItem('dsh-curate:draft:session-1'))
  assert.ok(stored, 'unmount must flush the pending draft')
  assert.ok(Array.isArray(stored.tones) && stored.tones.length > 0, 'the last tone change survives a quick close')
})

test('the dialog is named, focusable, Escape-dismissable and exposes toggle state', async () => {
  const payload = statePayload()
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act, closeCalls } = await mountWorkbench(win, mod)
  try {
    const dialog = container.querySelector('[role="dialog"]')
    assert.ok(dialog, 'the overlay exposes role=dialog')
    assert.equal(dialog.getAttribute('aria-modal'), 'true')
    const labelId = dialog.getAttribute('aria-labelledby')
    const title = labelId ? container.querySelector(`#${labelId}`) : null
    assert.ok(title, 'aria-labelledby resolves to the dialog title')
    assert.match(title.textContent, /Context curation|上下文整理/)
    const close = dialog.querySelector('.dshcurate-icon')
    assert.ok(close.getAttribute('aria-label'), 'the icon-only close button has an accessible name')
    assert.ok(container.querySelector('.dshcurate-scope select').getAttribute('aria-label'), 'the scope select is labelled')
    for (const button of container.querySelectorAll('.dshcurate-view button')) {
      assert.ok(button.hasAttribute('aria-pressed'), 'view toggles expose aria-pressed')
    }
    assert.equal(win.document.activeElement, container.querySelector('.dshcurate-panel'), 'the dialog receives initial focus')
    await act(async () => {
      dialog.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    assert.equal(closeCalls(), 1, 'Escape closes the workbench')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('workbench copy follows the host locale service and re-renders on a locale switch', async () => {
  const payload = statePayload()
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  let active = 'en'
  const listeners = new Set()
  const locale = {
    register: () => {},
    bind: () => (key) => key,
    getLocale: () => ({ active, revision: 0, locales: [] }),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  mod.apply({
    slots: { inject: (name, fn) => fn(), register: () => () => {} },
    locale,
    effect: (fn) => fn(),
    get: () => undefined,
    inject: (deps, fn) => {
      if (typeof deps === 'function') deps()
    },
  })
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    assert.match(container.textContent, /Context curation/)
    active = 'zh'
    await act(async () => { for (const listener of [...listeners]) listener() })
    assert.match(container.textContent, /上下文整理/, 'the open panel follows the host locale switch')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('the stats bar refresh control reloads the context', async () => {
  const payload = statePayload()
  let stateCalls = 0
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) {
      stateCalls += 1
      return { ok: true, json: async () => payload }
    }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    assert.equal(stateCalls, 1)
    const refresh = Array.from(container.querySelectorAll('.dshcurate-stats button, .dshcurate-head button'))
      .find((button) => /Refresh context|刷新上下文/.test(button.getAttribute('aria-label') || button.textContent))
    assert.ok(refresh, 'the refresh control is rendered')
    await act(async () => { refresh.click() })
    await settle(act, 60)
    assert.equal(stateCalls, 2, 'refresh calls load() again')
    assert.ok(container.querySelectorAll('.dshcurate-card').length >= 3, 'the workbench is still ready')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('a partial compression apply reloads the surface instead of leaving it stale', async () => {
  const payload = statePayload()
  let stateCalls = 0
  const fetchImpl = async (url) => {
    const path = String(url)
    if (path.includes('/dsh-curate/state')) {
      stateCalls += 1
      return { ok: true, json: async () => payload }
    }
    if (path.endsWith('/apply')) {
      return {
        ok: false,
        json: async () => ({
          ok: false,
          error: '会话写入中断',
          code: 'partial',
          applied: [{ kind: 'summary', startSeq: 2, endSeq: 3, replacementSeq: 20 }],
          lastSeq: 7,
        }),
      }
    }
    throw new Error(`unexpected fetch: ${path}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    const compress = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /Compress context|压缩上下文/.test(button.textContent))
    await act(async () => { compress.click() })
    await settle(act, 30)
    const checkbox = container.querySelector('.dshcurate-compress input[type="checkbox"]')
    await act(async () => { checkbox.click() })
    const confirm = Array.from(container.querySelectorAll('.dshcurate-compress-foot button'))
      .find((button) => /Compress$|确认压缩/.test(button.textContent))
    assert.ok(confirm, 'the compression dialog confirm button is rendered')
    await act(async () => { confirm.click() })
    await settle(act, 80)
    assert.ok(stateCalls >= 2, 'a partial apply triggers a full reload')
    assert.match(container.textContent, /Apply stopped partway|写入中断/)
    assert.ok(container.querySelector('.dshcurate-alert[role="alert"]'), 'the partial failure is announced')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('a superseded context load cannot overwrite a newer one', async () => {
  const pending = []
  const fetchImpl = (url) => new Promise((resolve) => { pending.push({ url: String(url), resolve }) })
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    assert.equal(pending.length, 1, 'the mount starts one /state request')
    const refresh = Array.from(container.querySelectorAll('.dshcurate-stats button, .dshcurate-head button'))
      .find((button) => /Refresh context|刷新上下文/.test(button.getAttribute('aria-label') || button.textContent))
    await act(async () => { refresh.click() })
    assert.equal(pending.length, 2, 'refresh supersedes the in-flight load')
    const newer = statePayload()
    newer.lastSeq = 9
    newer.nodes = [
      ...statePayload().nodes,
      typedNode(7, 'user', 3, '第三问', true, 'prompt'),
      typedNode(8, 'assistant', 3, '第三答', true, 'reply'),
      typedNode(9, 'user', 3, '最新', true, 'prompt'),
    ]
    await act(async () => { pending[1].resolve({ ok: true, json: async () => newer }) })
    await settle(act, 40)
    const cardsAfterNewer = container.querySelectorAll('.dshcurate-card').length
    assert.equal(cardsAfterNewer, 4, 'the newer response renders three turn cards plus the tail')
    // The stale first response lands last and must be ignored.
    await act(async () => { pending[0].resolve({ ok: true, json: async () => statePayload() }) })
    await settle(act, 40)
    assert.equal(container.querySelectorAll('.dshcurate-card').length, cardsAfterNewer,
      'the superseded response is ignored')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('undo restores the view toggles as well as the tones', async () => {
  const payload = statePayload()
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    const textView = Array.from(container.querySelectorAll('.dshcurate-view button'))
      .find((button) => /Dialogue text only|仅对话文本/.test(button.textContent))
    await act(async () => { textView.click() })
    assert.equal(textView.getAttribute('aria-pressed'), 'true')
    const summaryFlag = container.querySelector('.dshcurate-scope input[type="checkbox"]')
    await act(async () => { summaryFlag.click() })
    assert.equal(summaryFlag.checked, true, 'the summary-source toggle changed')
    const undo = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /^Undo$|^撤销$/.test(button.textContent.trim()))
    assert.equal(undo.disabled, false, 'the summary toggle pushed an undo snapshot')
    await act(async () => { undo.click() })
    assert.equal(summaryFlag.checked, false, 'undo restored the summary toggle')
    assert.equal(textView.getAttribute('aria-pressed'), 'true', 'undo restored the text-only view')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('large detail expansions render incrementally with a show-more control', async () => {
  const nodes = []
  for (let seq = 1; seq <= 120; seq += 1) {
    nodes.push(typedNode(seq, seq % 2 === 0 ? 'assistant' : 'user', 1, `消息 ${seq}`))
  }
  const payload = {
    ...statePayload(),
    lastSeq: 120,
    nodes,
    surfaceTokens: 1200,
    preserveRecentTurns: 0,
  }
  const detailNodes = nodes.slice(0, 119)
  const fetchImpl = async (url) => {
    const path = String(url)
    if (path.includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    if (path.includes('/dsh-curate/content')) return { ok: true, json: async () => ({ ok: true, nodes: detailNodes }) }
    throw new Error(`unexpected fetch: ${path}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    const expand = Array.from(container.querySelectorAll('.dshcurate-snippet-tools button'))
      .find((button) => /Read full text|查看完整原文/.test(button.textContent))
    assert.ok(expand, 'the big group offers full-text expansion')
    await act(async () => { expand.click() })
    await settle(act, 60)
    const list = container.querySelector('.dshcurate-detail-list')
    assert.ok(list, 'the detail list rendered')
    assert.equal(list.querySelectorAll('.dshcurate-message').length, 80, 'only the first page of detail messages renders')
    const showMore = Array.from(container.querySelectorAll('.dshcurate-snippets-wrap .dshcurate-snippet-tools button'))
      .find((button) => /Show 39 more|再显示 39 条/.test(button.textContent))
    assert.ok(showMore, 'the deferred count is offered as a show-more control')
    await act(async () => { showMore.click() })
    assert.equal(list.querySelectorAll('.dshcurate-message').length, 119, 'show more renders the remaining messages')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('merging into a locked block explains the refusal and pushes no undo step', async () => {
  const payload = statePayload()
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    const merge = Array.from(container.querySelectorAll('.dshcurate-card:not(.locked) .dshcurate-tools button'))
      .find((button) => /Merge next|合并下一段/.test(button.textContent))
    assert.ok(merge, 'the unlocked first card offers merge')
    await act(async () => { merge.click() })
    assert.match(container.textContent, /cannot be merged|不能合并/)
    const undo = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /^Undo$|^撤销$/.test(button.textContent.trim()))
    assert.equal(undo.disabled, true, 'a refused merge does not create a no-op undo step')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('opening the compression sheet scrolls it into view when the body is scrolled', async () => {
  const payload = statePayload()
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    const body = container.querySelector('.dshcurate-body')
    assert.ok(body, 'the workbench has a scrollable body')
    // Simulate a user who scrolled down the card list before pressing the
    // footer button: without the fix the sheet opens far above the viewport.
    body.scrollTop = 400
    const compress = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /Compress context|压缩上下文/.test(button.textContent))
    assert.ok(compress, 'the footer offers compress')
    await act(async () => { compress.click() })
    await settle(act, 80)
    assert.equal(container.querySelectorAll('.dshcurate-compress').length, 1, 'the sheet opens')
    assert.equal(body.scrollTop, 0, 'the body scrolls to the sheet at the top')
    assert.ok(container.querySelector('.dshcurate-compress input[type="radio"]'), 'the target choices render')
    const focused = win.document.activeElement
    assert.ok(focused && focused.closest && focused.closest('.dshcurate-compress'), 'focus moves into the sheet')
  } finally {
    await unmountQuietly(act, root)
  }
})

test('a busy session explains why compression cannot start instead of a dead button', async () => {
  const payload = { ...statePayload(), busy: true }
  const fetchImpl = async (url) => {
    if (String(url).includes('/dsh-curate/state')) return { ok: true, json: async () => payload }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const { win, mod } = loadClient(fetchImpl)
  const { root, container, act } = await mountWorkbench(win, mod)
  try {
    const compress = Array.from(container.querySelectorAll('.dshcurate-foot button'))
      .find((button) => /Compress context|压缩上下文/.test(button.textContent))
    assert.ok(compress, 'the footer offers compress')
    assert.equal(compress.disabled, false, 'the button is not a dead disabled control')
    assert.match(compress.getAttribute('title') || '', /working|工作/)
    await act(async () => { compress.click() })
    await settle(act, 60)
    assert.equal(container.querySelectorAll('.dshcurate-compress').length, 0, 'no sheet opens while busy')
    assert.match(container.textContent, /session is working|会话正在工作/, 'a toast explains the busy state')
  } finally {
    await unmountQuietly(act, root)
  }
})
