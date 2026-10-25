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
  assert.equal(definition.id, 'dsh-curate')
  const mod = definition.factory((id) => {
    if (id === 'react') return React
    if (id === 'react/jsx-runtime') return require('react/jsx-runtime')
    if (id === '@deepseek-ai/dsh-client-ui-primitives') return {}
    throw new Error(`unexpected require: ${id}`)
  })
  return { dom, win, mod }
}

test('client bundle registers a header entry, a modal layer and a right-Sidebar tab', () => {
  const { mod, win } = loadClient()
  assert.equal(typeof mod.apply, 'function')
  const registrations = []
  const sidebarTabs = []
  const slots = {
    inject: (name, fn) => fn(),
    register: (definition, component) => registrations.push({ definition, component }),
  }
  const fakeCtx = {
    slots,
    locale: { register: () => {}, bind: () => (key) => key },
    effect: (fn) => fn(),
    get: (name) => (name === 'sidebarRight'
      ? { openTab: () => {}, active: () => undefined, close: () => {} }
      : undefined),
    inject: (deps, fn) => {
      if (Array.isArray(deps) && deps.includes('sidebarRightTabs')) {
        fn({
          sidebarRightTabs: { register: (definition) => { sidebarTabs.push(definition); return () => {} } },
          slots,
          locale: fakeCtx.locale,
          get: fakeCtx.get,
        })
        return
      }
      if (typeof deps === 'function') deps()
    },
  }
  mod.apply(fakeCtx)
  assert.deepEqual(registrations.map((entry) => entry.definition.name), [
    'conversation.session.header.actions',
    'conversation.session.header.actions',
    'conversation.input.overlay',
    'conversation.input.overlay',
    'sidebar.right.pane.tab',
    'sidebar.right.pane.tab.title',
  ])
  assert.deepEqual(sidebarTabs.map((entry) => entry.kind), ['dsh-curate'])
  assert.ok(registrations.every((entry) => typeof entry.component === 'function'))
  assert.ok(win.document.getElementById('dsh-curate-styles'), 'styles injected once')
  const html = renderToStaticMarkup(React.createElement(registrations[0].component, { sessionId: 'session-1' }))
  assert.match(html, /dshcurate-open/)
  assert.match(html, /Curate context|整理上下文/)
})

test('buildGroups slices by turn, locks recent turns and keeps the latest message', () => {
  const { mod } = loadClient()
  const groups = mod.__internals.buildGroups({
    nodes: [
      { seq: 1, role: 'system', turn: null, tokens: 90 },
      { seq: 2, role: 'user', turn: 1, tokens: 10 },
      { seq: 3, role: 'assistant', turn: 1, tokens: 20 },
      { seq: 4, role: 'user', turn: 2, tokens: 10 },
      { seq: 5, role: 'assistant', turn: 2, tokens: 20 },
      { seq: 6, role: 'user', turn: 3, tokens: 10 },
      { seq: 7, role: 'assistant', turn: 3, tokens: 8 },
    ],
  }, 1)
  assert.deepEqual(groups.surface.map((node) => node.seq), [2, 3, 4, 5, 6, 7])
  assert.deepEqual(groups.groups.map((group) => [group.startIndex, group.endIndex, group.turn, group.tone, group.locked]), [
    [0, 1, 1, 'normal', false],
    [2, 3, 2, 'normal', false],
    [4, 4, 3, 'keep', true],
  ])
  assert.equal(groups.groups.length, 3)
})

test('middleCut refuses to split inside a tool pair', () => {
  const { mod } = loadClient()
  const surface = [
    { seq: 1, role: 'user', turn: 1 },
    { seq: 2, role: 'assistant', turn: 1, toolCalls: ['bash'] },
    { seq: 3, role: 'tool', turn: 1 },
    { seq: 4, role: 'assistant', turn: 1, toolCalls: [] },
  ]
  assert.equal(mod.__internals.middleCut(surface, 1, 2), null)
  assert.equal(mod.__internals.middleCut(surface, 0, 3), 2)
  const surface2 = [
    { seq: 1, role: 'user', turn: 1 },
    { seq: 2, role: 'assistant', turn: 1, toolCalls: [] },
    { seq: 3, role: 'user', turn: 2 },
    { seq: 4, role: 'assistant', turn: 2, toolCalls: [] },
  ]
  assert.equal(mod.__internals.middleCut(surface2, 0, 3), 1)
})

test('markdown renderer sanitizes HTML and round-trips basic GFM', () => {
  const { mod } = loadClient()
  const html = mod.__internals.markdownToHtml('**加粗** 和 <script>alert(1)</script>\n\n- a\n- b')
  assert.match(html, /<strong>加粗<\/strong>/)
  assert.doesNotMatch(html, /<script>/)
  const back = mod.__internals.htmlToMarkdown(html)
  assert.match(back, /\*\*加粗\*\*/)
  assert.match(back, /-\s+a/)
})

test('rendered Markdown resolves workspace-relative images through api/file', () => {
  const { mod, win } = loadClient()
  const container = win.document.createElement('div')
  container.innerHTML = '<img src="img/a.png"><img src="https://example.com/x.png">'
  mod.__internals.resolveRenderedImages(container, '/work/project')
  const images = container.querySelectorAll('img')
  assert.equal(images[0].getAttribute('src'), 'http://127.0.0.1:3080/api/file?path=%2Fwork%2Fproject%2Fimg%2Fa.png')
  assert.equal(images[1].getAttribute('src'), 'https://example.com/x.png')
})

test('estimatedReplacementTokens accounts for Default summaries and Minor drops', () => {
  const { mod } = loadClient()
  assert.equal(mod.__internals.estimatedReplacementTokens({ tone: 'normal', tokens: 10_000 }), 1_200)
  assert.equal(mod.__internals.estimatedReplacementTokens({ tone: 'minor', tokens: 10_000 }), 20, 'a dropped segment leaves only a short marker')
  assert.equal(mod.__internals.estimatedReplacementTokens({ tone: 'normal', tokens: 10 }), 120, 'the estimate has a floor')
})

test('editKeyFor is stable per message and block', () => {
  const { mod } = loadClient()
  assert.equal(mod.__internals.editKeyFor('prompt', 12), 'p:12')
  assert.equal(mod.__internals.editKeyFor('reply', 12, 3), 'reply:12:3')
})

test('MessageEditor renders the staged editor in source mode', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.MessageEditor, {
    editing: { seq: 3, mode: 'prompt', value: '改后的文本', viewMode: 'source', original: '原文' },
    message: { editableBlocks: [], attachments: 2 },
    cwd: '/work/project',
    disabled: false,
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(html, /dshcurate-editor/)
  assert.match(html, /改后的文本/)
  assert.match(html, /dshcurate-source/)
  assert.match(html, /2 attachment|2 个附件/)
})

test('MessageDetail renders tool output read-only and compact', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.MessageDetail, {
    node: { seq: 7, role: 'tool', text: '命令输出在这里', isError: true, attachments: 0, editable: false },
    full: null,
    nodeEdits: [],
    editing: null,
    cwd: '/work/project',
    busy: false,
    onEdit: () => {},
    onUndo: () => {},
    onLoadFull: () => {},
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(html, /dshcurate-tool-text error/)
  assert.match(html, /命令输出在这里/)
  assert.match(html, /#7/)
  assert.doesNotMatch(html, /Edit<\/button>|编辑<\/button>/)
})

test('MessageDetail offers an edit action and shows the staged badge', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.MessageDetail, {
    node: { seq: 3, role: 'user', preview: '原文', editable: true, editKind: 'prompt', editReason: '', attachments: 0 },
    full: null,
    nodeEdits: [{ key: 'p:3', seq: 3, mode: 'prompt', text: '改后' }],
    editing: null,
    cwd: '/work/project',
    busy: false,
    onEdit: () => {},
    onUndo: () => {},
    onLoadFull: () => {},
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(html, /Edited \(pending\)|已修改（待应用）/)
  assert.match(html, /Edit|编辑/)
  assert.match(html, /Undo edit|撤销修改/)
})

test('MessageDetail renders reply reasoning in a collapsed block', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.MessageDetail, {
    node: { seq: 4, role: 'assistant', editable: true, editKind: 'reply', editReason: '', attachments: 0, preview: '' },
    full: {
      editable: true,
      editKind: 'reply',
      editReason: '',
      attachments: 0,
      promptText: '',
      text: '正文',
      truncated: false,
      blocks: [
        { index: 0, type: 'text', kind: 'text', text: '正文' },
        { index: 1, type: 'reasoning', kind: 'reasoning', text: '思考过程' },
        { index: 2, type: 'tool-call', label: 'bash' },
      ],
      editableBlocks: [
        { index: 0, kind: 'text', text: '正文' },
        { index: 1, kind: 'reasoning', text: '思考过程' },
      ],
    },
    nodeEdits: [],
    editing: null,
    cwd: '/work/project',
    busy: false,
    onEdit: () => {},
    onUndo: () => {},
    onLoadFull: () => {},
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(html, /dshcurate-reasoning/)
  assert.match(html, /思考过程/)
  assert.match(html, /dshcurate-block-chip/)
  assert.match(html, /bash/)
})

test('Workbench starts in its loading state', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.Workbench, {
    sessionId: 'session-1',
    onClose: () => {},
  }))
  assert.match(html, /Context curation|上下文整理/)
  assert.match(html, /Reading the session context|正在读取会话上下文/)
})

test('editKeyFor distinguishes every editable mode', () => {
  const { mod } = loadClient()
  assert.equal(mod.__internals.editKeyFor('prompt', 3), 'p:3')
  assert.equal(mod.__internals.editKeyFor('reply', 4, 0), 'reply:4:0')
  assert.equal(mod.__internals.editKeyFor('tool', 5, 0), 'tool:5:0')
  assert.equal(mod.__internals.editKeyFor('context', 6, 1), 'context:6:1')
})

test('MessageEditor labels tool and context edits and defaults tool to source', () => {
  const { mod } = loadClient()
  const tool = renderToStaticMarkup(React.createElement(mod.__internals.MessageEditor, {
    editing: { seq: 5, mode: 'tool', value: 'tool output', viewMode: 'source', original: 'tool output' },
    message: { editableBlocks: [{ index: 0, kind: 'text', text: 'tool output' }], attachments: 0 },
    cwd: '/work/project',
    disabled: false,
    textOnlyView: false,
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(tool, /Edit the tool result|编辑工具结果/)
  assert.match(tool, /dshcurate-source/)

  const context = renderToStaticMarkup(React.createElement(mod.__internals.MessageEditor, {
    editing: { seq: 6, mode: 'context', value: 'context text', viewMode: 'rendered', original: 'context text' },
    message: { editableBlocks: [{ index: 0, kind: 'text', text: 'context text' }], attachments: 0 },
    cwd: '/work/project',
    disabled: false,
    textOnlyView: false,
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(context, /Edit the injected context|编辑注入上下文/)
  assert.match(context, /dshcurate-rendered/)
})

test('editable tool results expose an edit action', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.MessageDetail, {
    node: { seq: 5, role: 'tool', text: 'old output', isError: false, attachments: 0, editable: true, editKind: 'tool', editReason: '' },
    full: null,
    nodeEdits: [],
    editing: null,
    cwd: '/work/project',
    busy: false,
    textOnlyView: false,
    onEdit: () => {},
    onUndo: () => {},
    onLoadFull: () => {},
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(html, />Edit<|>编辑</)
  assert.match(html, /dshcurate-tool-text/)
})

test('isConversationNode keeps user/assistant text and hides tool/context', () => {
  const { mod } = loadClient()
  assert.equal(mod.__internals.isConversationNode({ role: 'user', previewPlain: '' }, true), true)
  assert.equal(mod.__internals.isConversationNode({ role: 'assistant', previewPlain: 'answer' }, true), true)
  assert.equal(mod.__internals.isConversationNode({ role: 'assistant', previewPlain: '', preview: '[tool call bash]' }, true), false)
  assert.equal(mod.__internals.isConversationNode({ role: 'tool', previewPlain: 'out' }, true), false)
  assert.equal(mod.__internals.isConversationNode({ role: 'context', previewPlain: 'ctx' }, true), false)
  assert.equal(mod.__internals.isConversationNode({ role: 'tool', previewPlain: 'out' }, false), true)
})

test('buildToneUnits joins assistant tool calls with their results', () => {
  const { mod } = loadClient()
  const nodes = [
    { seq: 1, role: 'user', toolCallIds: [] },
    { seq: 2, role: 'assistant', toolCallIds: ['call-1', 'call-2'] },
    { seq: 3, role: 'tool', toolResultFor: 'call-1' },
    { seq: 4, role: 'tool', toolResultFor: 'call-2' },
    { seq: 5, role: 'assistant', toolCallIds: [] },
  ]
  const units = mod.__internals.buildToneUnits(nodes)
  assert.deepEqual(units.unitOf(1), [1, 2, 3], 'the assistant message and both results form one unit')
  assert.deepEqual(units.unitOf(4), [4], 'a reply without calls is its own unit')
})

test('segmentsForGroup keeps important messages verbatim and never splits a tool pair', () => {
  const { mod } = loadClient()
  const surface = [
    { seq: 10, role: 'user', tokens: 5, toolCallIds: [] },
    { seq: 11, role: 'assistant', tokens: 10, toolCallIds: ['call-9'] },
    { seq: 12, role: 'tool', tokens: 20, toolResultFor: 'call-9', toolCallIds: [] },
    { seq: 13, role: 'assistant', tokens: 30, toolCallIds: [] },
  ]
  const group = { startIndex: 0, endIndex: 3, turn: 1, locked: false }
  const units = mod.__internals.buildToneUnits(surface)
  const tones = { 10: 'normal', 11: 'keep', 12: 'normal', 13: 'normal' }
  const toneAt = (index) => tones[surface[index].seq] || 'normal'
  const segments = mod.__internals.segmentsForGroup(group, surface, toneAt, units)
  assert.deepEqual(segments.map((segment) => [segment.tone, segment.startSeq, segment.endSeq]), [
    ['normal', 10, 10],
    ['keep', 11, 12],
    ['normal', 13, 13],
  ], 'the keep tone on the call promotes its tool result instead of splitting the pair')
  assert.equal(segments[1].count, 2)
})

test('groupToneOf reports a mixed bulk tone', () => {
  const { mod } = loadClient()
  assert.equal(mod.__internals.groupToneOf([{ tone: 'normal' }, { tone: 'normal' }]), 'normal')
  assert.equal(mod.__internals.groupToneOf([{ tone: 'normal' }, { tone: 'minor' }]), 'mixed')
  assert.equal(mod.__internals.groupToneOf([{ tone: 'keep' }]), 'keep')
})

test('MessageDetail renders per-message tone buttons', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.MessageDetail, {
    node: { seq: 60, role: 'assistant', text: 'answer', attachments: 0, editable: true, editKind: 'reply', editReason: '' },
    full: null,
    nodeEdits: [],
    editing: null,
    cwd: '/work/project',
    busy: false,
    textOnlyView: false,
    tone: 'normal',
    toneDisabled: false,
    showTone: true,
    onTone: () => {},
    onEdit: () => {},
    onUndo: () => {},
    onLoadFull: () => {},
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(html, /dshcurate-msg-tones/)
  assert.match(html, /Important|重要/)
  assert.match(html, /Default|默认/)
  assert.match(html, /Minor|次要/)
})

// --- 0.5.0 client-half regressions -----------------------------------------

test('built client version is injected from package.json at build time', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const source = readFileSync(new URL('../src/client.js', import.meta.url), 'utf8')
  const built = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.equal((source.match(/__DSH_CURATE_VERSION__/g) || []).length, 1, 'the source keeps exactly one version marker')
  assert.doesNotMatch(built, /__DSH_CURATE_VERSION__/, 'the built bundle has no marker left')
  assert.match(String(pkg.version), /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'package.json version is semver')
  const match = built.match(/const PLUGIN_VERSION = '([^']+)'/)
  assert.ok(match, 'the built bundle declares PLUGIN_VERSION')
  assert.equal(match[1], pkg.version, 'built client version equals package.json version')
  const { mod } = loadClient()
  assert.equal(mod.PLUGIN_VERSION, pkg.version)
})

test('markdown fallback escapes instead of returning unsanitized marked HTML', () => {
  const { mod } = loadClient()
  // No DOMPurify in the fake vendor: raw <script> must never be returned.
  const html = mod.__internals.sanitizeMarkdownHtml('<p><strong>x</strong></p><script>alert(1)</script>', '<script>alert(1)</script>', {})
  assert.match(html, /&lt;script&gt;/)
  assert.doesNotMatch(html, /<script>/)
  // A real sanitizer path still sanitizes.
  const sanitized = mod.__internals.sanitizeMarkdownHtml('<b onclick="x()">x</b><script>alert(1)</script>', 'x', {
    DOMPurify: { sanitize: (raw) => raw.replace(/<script>[\s\S]*?<\/script>/g, '') },
  })
  assert.doesNotMatch(sanitized, /<script>/)
})

test('host error codes map to localized panel copy and unknown codes stay raw', () => {
  const { mod } = loadClient()
  const { hostErrorText } = mod.__internals
  assert.match(hostErrorText({ code: 'busy', message: '这条会话还在工作' }, 'edit'), /session is working|会话正在工作/)
  assert.match(hostErrorText({ code: 'busy', message: '这条会话还在工作' }, 'compress'), /session is working|会话正在工作/)
  assert.match(hostErrorText({ code: 'stale', message: '有新消息' }, 'edit'), /session grew|有了新消息/)
  assert.match(hostErrorText({ code: 'stale', message: '有新消息' }, 'compress'), /Refresh and curate|刷新后重新整理/)
  assert.match(hostErrorText({ code: 'tool-pair', message: '工具调用' }, 'compress'), /tool call|工具调用/)
  assert.match(hostErrorText({ code: 'tail-locked', message: 'x' }, 'compress'), /latest message|cannot be compressed|最后一条/)
  assert.match(hostErrorText({ code: 'range-too-large', message: 'x' }, 'compress'), /too many messages|消息太多了/)
  assert.match(hostErrorText({ code: 'not-editable', message: 'x' }, 'edit'), /cannot be edited|不可编辑/)
  assert.match(hostErrorText({ code: 'unsupported', message: 'x' }, 'edit'), /does not support|不支持/)
  assert.match(hostErrorText({ code: 'cancelled', message: 'x' }, 'compress'), /cancelled|已取消/)
  assert.match(hostErrorText({ code: 'compaction-summary', message: 'x' }, 'compress'), /no valid summary|没有生成有效摘要/)
  assert.equal(hostErrorText({ code: 'something-new', message: '宿主原话' }, 'compress'), null, 'unknown codes fall back to the wrapper + host prose')
})

test('draft scope and payload validation reject tampered values', () => {
  const { mod } = loadClient()
  const { normalizePreserveTurns, draftHasContent } = mod.__internals
  for (const value of [0, 1, 2, 3, 4, 5, 6]) assert.equal(normalizePreserveTurns(value), value)
  for (const value of [-1, 7, 2.5, '2', null, undefined, NaN]) assert.equal(normalizePreserveTurns(value), null)
  assert.equal(draftHasContent({ tones: [], edits: [] }), false)
  assert.equal(draftHasContent({ tones: [{ seq: 1, tone: 'minor' }], edits: [] }), true)
  assert.equal(draftHasContent({ tones: [], edits: [{ seq: 2 }] }), true)
})

test('segmentsForGroup keeps a tool unit that the group only partially contains', () => {
  const { mod } = loadClient()
  // Repro from the review: the last compressible group ends on an assistant
  // call whose tool result is the kept tail. Compressing it would make the
  // host reject the plan with code "tool-pair".
  const surface = [
    { seq: 1, role: 'user', turn: 1, tokens: 5, toolCallIds: [] },
    { seq: 2, role: 'assistant', turn: 1, tokens: 10, toolCallIds: ['c1'] },
    { seq: 3, role: 'tool', turn: 1, tokens: 20, toolResultFor: 'c1', toolCallIds: [] },
    { seq: 4, role: 'user', turn: 2, tokens: 5, toolCallIds: [] },
    { seq: 5, role: 'assistant', turn: 2, tokens: 10, toolCallIds: ['c2'] },
    { seq: 6, role: 'tool', turn: 2, tokens: 20, toolResultFor: 'c2', toolCallIds: [] },
  ]
  const state = { nodes: surface, preserveRecentTurns: 0 }
  const built = mod.__internals.buildGroups(state, 0)
  assert.equal(built.groups.length, 2)
  const group = built.groups[1]
  assert.deepEqual([group.startIndex, group.endIndex], [3, 4])
  const units = mod.__internals.buildToneUnits(built.surface)
  const toneAt = () => 'normal'
  const segments = mod.__internals.segmentsForGroup(group, built.surface, toneAt, units)
  assert.deepEqual(segments.map((segment) => [segment.tone, segment.startSeq, segment.endSeq]), [
    ['normal', 4, 4],
    ['keep', 5, 5],
  ], 'the call with a result outside the group is forced to keep')
})

test('workbench dialog, icon buttons and toggles expose accessible names and state', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.Workbench, {
    sessionId: 'session-1',
    onClose: () => {},
  }))
  const dialogMatch = html.match(/role="dialog"[^>]*aria-labelledby="([^"]+)"/)
  assert.ok(dialogMatch, 'the overlay is a labelled dialog')
  assert.match(html, new RegExp(`id="${dialogMatch[1]}"`), 'aria-labelledby points at the title')
  assert.match(html, /aria-label="(?:Close|关闭)"/, 'the icon-only close button has a name')
  assert.match(html, /aria-label="(?:Keep recent|最近保留)"/, 'the scope select is labelled')
  assert.match(html, /aria-pressed="(?:true|false)"/, 'view toggles expose their pressed state')
  assert.match(html, /(?:Refresh context|刷新上下文)/, 'the refresh control is rendered')
})

test('MessageEditor asks for block switching inline instead of window.confirm', () => {
  const { mod } = loadClient()
  const html = renderToStaticMarkup(React.createElement(mod.__internals.MessageEditor, {
    editing: {
      seq: 3,
      mode: 'reply',
      value: 'changed text',
      original: 'original text',
      blockIndex: 0,
      pendingBlock: 1,
      viewMode: 'source',
    },
    message: { editableBlocks: [{ index: 0, kind: 'text', text: 'a' }, { index: 1, kind: 'reasoning', text: 'b' }], attachments: 0 },
    cwd: '/work/project',
    disabled: false,
    textOnlyView: false,
    onValue: () => {},
    onMode: () => {},
    onBlock: () => {},
    onBlockConfirm: () => {},
    onBlockCancel: () => {},
    onCancel: () => {},
    onSave: () => {},
  }))
  assert.match(html, /Switching blocks discards|切换编辑块会丢弃/)
  assert.match(html, /Discard and switch|放弃修改并切换/)
  assert.match(html, /aria-label="(?:Block|编辑块)"/, 'the block picker select is labelled')
  assert.match(html, /aria-pressed="true"/, 'the editor mode toggle exposes its pressed state')
})

test('apply installs and disposes the stylesheet and the version marker', () => {
  const { mod, win } = loadClient()
  const slots = { inject: (name, fn) => fn(), register: () => () => {} }
  const ctx = {
    slots,
    locale: { register: () => {}, bind: () => (key) => key },
    effect: (fn) => fn(),
    get: () => undefined,
    inject: (deps, fn) => {
      if (typeof deps === 'function') deps()
    },
  }
  const dispose = mod.apply(ctx)
  assert.equal(typeof dispose, 'function', 'apply returns a disposer')
  assert.ok(win.document.getElementById('dsh-curate-styles'), 'styles are injected')
  assert.equal(win.document.documentElement.dataset.dshCurateVersion, mod.PLUGIN_VERSION)
  dispose()
  assert.equal(win.document.getElementById('dsh-curate-styles'), null, 'unload removes the stylesheet')
  assert.equal(win.document.documentElement.dataset.dshCurateVersion, undefined, 'unload removes the version marker')
})

test('panel copy follows the host locale service instead of navigator.language', () => {
  const { mod } = loadClient()
  const ctx = {
    slots: { inject: (name, fn) => fn(), register: () => () => {} },
    locale: {
      register: () => {},
      bind: () => (key) => key,
      getLocale: () => ({ active: 'zh', revision: 1, locales: [] }),
    },
    effect: (fn) => fn(),
    get: () => undefined,
    inject: (deps, fn) => {
      if (typeof deps === 'function') deps()
    },
  }
  mod.apply(ctx)
  // jsdom's navigator.language is en-US, so a Chinese header proves the host
  // locale service wins over the browser language.
  const html = renderToStaticMarkup(React.createElement(mod.__internals.HeaderEntry, { sessionId: 'session-1' }))
  assert.match(html, /整理上下文/)
  assert.doesNotMatch(html, /Curate context/)
})
