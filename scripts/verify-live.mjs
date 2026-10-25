// Read-only live check of the dsh-curate workbench over CDP (0.4.1+ UI).
//
// Requires: a Chrome/Chromium DevTools endpoint at CDP_URL (default
// http://127.0.0.1:9333), the running DSH web at DSH_URL (default
// http://127.0.0.1:3080), and DSH_TOKEN for the page URL. The token is read at
// run time from `journalctl --user -u dsh-web.service` by the caller; this
// script never writes it to disk and never prints it.
//
// Strictly read-only with respect to the session: it never calls /apply, /edit
// or /compact and asserts afterwards that none of those routes was requested.
// It opens the workbench on an IDLE session, checks the 0.4.1+ footer
// (apply / compress / save / undo), triages a card, expands the full text,
// opens and cancels the message editor, stages an edit only to exercise the
// footer and then undoes it, inspects the compression dialog without
// confirming it, and closes the workbench. Drafts written to localStorage by
// the workbench are snapshotted and restored.
//
// Usage:
//   DSH_TOKEN=$(journalctl --user -u dsh-web.service --no-pager \
//     | grep 'dsh web: http' | tail -1 \
//     | sed -E 's/.*[?&]token=([^ &]+).*/\1/') node scripts/verify-live.mjs
//
// Env overrides: CDP_URL, DSH_URL, DSH_TOKEN (required), DSH_SESSION_TITLE
// (force one sidebar session title), SHOT (screenshot path).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const CDP_URL = (process.env.CDP_URL || 'http://127.0.0.1:9333').replace(/\/$/, '')
const APP_URL = (process.env.DSH_URL || 'http://127.0.0.1:3080').replace(/\/$/, '')
const TOKEN = process.env.DSH_TOKEN || ''
const FORCED_TITLE = (process.env.DSH_SESSION_TITLE || '').trim() || null
const SHOT = process.env.SHOT || 'docs/workbench-preview.png'
const ROOT = process.cwd()
// A page load plus the biggest session transcript can take a few seconds; the
// per-step waits below are short and poll, so normal runs stay fast.
const PAGE_LOAD_TIMEOUT = 20_000
const SESSION_SWITCH_TIMEOUT = 10_000
const PANEL_READY_TIMEOUT = 12_000

const sleep = (ms) => new Promise((resolveTimeout) => setTimeout(resolveTimeout, ms))

let passed = 0
let failures = 0
let warnings = 0
let currentGroup = ''

function group(name) {
  currentGroup = name
  console.log(`\n## ${name}`)
}
function check(label, condition, detail) {
  if (condition) {
    passed += 1
    console.log(`  PASS ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}`)
  }
  return condition === true
}
function warn(label, detail) {
  warnings += 1
  console.log(`  WARN ${label}${detail === undefined ? '' : ` — ${detail}`}`)
}
function info(label, value) {
  console.log(`  INFO ${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
}
function clip(value, limit = 220) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

// Bilingual label fragments (the host renders zh or en depending on the page
// locale). Kept as regex sources so they can be embedded in page expressions.
const LABEL = {
  open: '整理上下文|Curate context',
  panelTitle: '上下文整理|Context curation',
  apply: '^应用到上下文$|^Apply to context$',
  applyEdits: '修改并应用到上下文|Apply edits to context',
  compress: '^压缩上下文$|^Compress context$',
  save: '保存当前内容|Save current content',
  undo: '^撤销$|^Undo$',
  keep: '^重要$|^Important$',
  normal: '^默认$|^Default$',
  minor: '^次要$|^Minor$',
  expand: '查看完整原文|Read full text',
  collapse: '收起完整原文|Hide full text',
  edit: '^编辑$|^Edit$',
  source: '^源码$|^Source$',
  rendered: '^渲染$|^Rendered$',
  editorCancel: '^取消$|^Cancel$',
  editorSave: '保存修改|Save edit',
  viewAll: '全部内容|All content',
  viewText: '仅对话文本|Dialogue text only',
  compressCancel: '再检查一下|Keep reviewing',
  compressConfirm: '^确认压缩$|^Compress$',
  targetDirect: '直接压缩上下文|Compress the current context',
  targetModified: '压缩修改后的上下文|Compress the modified context',
  curated: '按整理结果压缩|Compress the curated blocks',
  official: '官方 /compact|Official /compact',
  pendingEdit: '处修改待应用|pending edit',
  staged: '已修改（待应用）|Edited \\(pending\\)',
  undoDone: '已撤销上一步|Undid the last change',
  draftSaved: '草稿已保存到本地|Draft saved locally',
  busy: '会话正在工作|session is working',
  tokens: 'tokens',
  saved: '节省|Saved',
  segments: '段 ·|segments? ·',
}
const patternSource = (name) => {
  const source = LABEL[name]
  if (source === undefined) throw new Error(`no label pattern ${name}`)
  return source
}

// --- bundle versions (read at runtime so a version bump does not break us) ---
function readVersion(relativePath, pattern) {
  try {
    const source = readFileSync(resolve(ROOT, relativePath), 'utf8')
    const match = source.match(pattern)
    return match === null ? '' : match[1]
  } catch {
    return ''
  }
}
let PACKAGE_VERSION = ''
try {
  PACKAGE_VERSION = String(JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).version || '')
} catch {}
// The host half reads package.json at runtime since 0.5.0 (single source of
// truth); older builds carry a literal. Prefer the literal when present so the
// check still notices a stale checkout, otherwise fall back to package.json.
const HOST_SOURCE_VERSION = readVersion('lib/index.js', /PLUGIN_VERSION\s*=\s*['"]([^'"]+)['"]/) || PACKAGE_VERSION
const CLIENT_SOURCE_VERSION = readVersion('lib/client.js', /PLUGIN_VERSION\s*=\s*['"]([^'"]+)['"]/)
const SRC_CLIENT_LITERAL = readVersion('src/client.js', /PLUGIN_VERSION\s*=\s*['"]([^'"]+)['"]/)
// src/client.js carries the build-injection marker; its effective version is
// package.json's.
const SRC_CLIENT_VERSION = SRC_CLIENT_LITERAL === '__DSH_CURATE_VERSION__' ? PACKAGE_VERSION : SRC_CLIENT_LITERAL

// --- CDP plumbing ----------------------------------------------------------
async function pageTarget() {
  let list = await (await fetch(`${CDP_URL}/json/list`)).json()
  let pages = list.filter((target) => target.type === 'page' && !target.url.startsWith('chrome-extension://'))
  if (pages.length === 0) {
    // Chrome may have been started without about:blank (or the page was closed).
    await fetch(`${CDP_URL}/json/new?about:blank`, { method: 'PUT' }).catch(() => {})
    await sleep(400)
    list = await (await fetch(`${CDP_URL}/json/list`)).json()
    pages = list.filter((target) => target.type === 'page' && !target.url.startsWith('chrome-extension://'))
  }
  if (pages.length === 0) throw new Error(`no page target at ${CDP_URL}; is headless Chrome running?`)
  return pages.find((target) => target.url.startsWith(APP_URL)) ?? pages[0]
}

async function connect() {
  const page = await pageTarget()
  const socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true })
    socket.addEventListener('error', rejectOpen, { once: true })
  })
  let id = 0
  const pending = new Map()
  const events = []
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (message.method !== undefined) events.push(message)
    if (message.id !== undefined && pending.has(message.id)) {
      const resolvePending = pending.get(message.id)
      pending.delete(message.id)
      resolvePending(message)
    }
  })
  const send = (method, params) => new Promise((resolveSend) => {
    id += 1
    pending.set(id, resolveSend)
    socket.send(JSON.stringify({ id, method, params }))
  })
  await send('Page.enable', {})
  await send('Runtime.enable', {})
  await send('Network.enable', {})
  return { send, socket, events }
}

function evaluate(send, expression) {
  return send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    .then((message) => {
      if (message.result && message.result.exceptionDetails) {
        throw new Error(message.result.exceptionDetails.exception?.description ?? message.result.exceptionDetails.text ?? 'evaluate failed')
      }
      return message.result && message.result.result ? message.result.result.value : undefined
    })
}

// Poll a page expression until it is truthy. A throwing evaluate (e.g. the DOM
// is between two renders) is treated as "not yet".
async function waitFor(send, expression, label, timeout = 5000, interval = 150) {
  const deadline = Date.now() + timeout
  let last
  for (;;) {
    try {
      last = await evaluate(send, expression)
      if (last) return last
    } catch {}
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${label}`)
    await sleep(interval)
  }
}

// Path-only rendering so a URL that carries the auth token never reaches logs.
function safePath(url) {
  try {
    return new URL(String(url)).pathname
  } catch {
    return String(url).split('?')[0]
  }
}

async function shot(send) {
  const target = resolve(ROOT, SHOT)
  const result = await send('Page.captureScreenshot', { format: 'png' })
  if (result.result && result.result.data) {
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, Buffer.from(result.result.data, 'base64'))
    console.log(`  SHOT ${target}`)
    return target
  }
  return null
}

// --- page-side helpers -----------------------------------------------------
const DRAFT_PREFIX = 'dsh-curate:draft:'

function draftsSnapshotExpression() {
  return `(() => {
    const out = {}
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key !== null && key.startsWith(${JSON.stringify(DRAFT_PREFIX)})) out[key] = localStorage.getItem(key)
    }
    return out
  })()`
}

function draftsRestoreExpression(snapshot) {
  return `(() => {
    const prefix = ${JSON.stringify(DRAFT_PREFIX)}
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (key !== null && key.startsWith(prefix)) localStorage.removeItem(key)
    }
    const snapshot = ${JSON.stringify(snapshot || {})}
    for (const key of Object.keys(snapshot)) localStorage.setItem(key, snapshot[key])
    return true
  })()`
}

function sessionCandidatesExpression() {
  return `(() => Array.from(document.querySelectorAll('[role="treeitem"]')).map((node) => {
    const lines = (node.innerText || '').split('\\n').map((line) => line.trim()).filter(Boolean)
    const className = String(node.className)
    return {
      lines,
      className,
      title: lines.length >= 2 ? lines[lines.length - 2] : (lines[0] || ''),
      time: lines.length >= 1 ? lines[lines.length - 1] : '',
      session: /sessionRow/.test(className) || /sessionRow/.test(String(node.parentElement && node.parentElement.className)),
      running: /Running|运行中/.test(lines.join(' ')),
      selected: node.getAttribute('aria-selected') === 'true' || /(^|[\\s_-])selected([\\s_-]|$)/.test(className),
    }
  }).filter((row) => row.session
    && row.lines.length >= 2
    && !row.running
    && !/^New Session$|^新会话$/.test(row.title)
    && /^\\d+\\s*(min|h|d|分钟|小时|天)$/i.test(row.time)
    && row.title !== ''))()`
}

function clickSessionExpression(title) {
  return `(() => {
    const title = ${JSON.stringify(title)}
    const row = Array.from(document.querySelectorAll('[role="treeitem"]')).find((node) => {
      const lines = (node.innerText || '').split('\\n').map((line) => line.trim()).filter(Boolean)
      return lines.includes(title) && !/Running|运行中/.test(node.innerText || '')
    })
    if (row === undefined) return 'missing'
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
      row.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0 }))
    }
    row.click()
    return 'clicked'
  })()`
}

function selectedSessionExpression(title) {
  return `(() => {
    const title = ${JSON.stringify(title)}
    const selected = Array.from(document.querySelectorAll('[role="treeitem"]')).find((node) =>
      node.getAttribute('aria-selected') === 'true' || /(^|[\\s_-])selected([\\s_-]|$)/.test(String(node.className)))
    const lines = selected === undefined ? [] : (selected.innerText || '').split('\\n').map((line) => line.trim()).filter(Boolean)
    return { active: lines.includes(title), rows: document.querySelectorAll('[data-chat-flow-key]').length, lines }
  })()`
}

function clickByTextExpression(selector, patternName) {
  return `(() => {
    const matcher = new RegExp(${JSON.stringify(patternSource(patternName))}, 'i')
    const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
    const node = nodes.find((candidate) => matcher.test((candidate.textContent || '').trim()))
    if (node === undefined) return { clicked: false, options: nodes.map((candidate) => (candidate.textContent || '').trim()).slice(0, 10) }
    node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
    node.click()
    return { clicked: true, text: (node.textContent || '').trim(), disabled: node.disabled === true }
  })()`
}

function clickInCardExpression(cardIndex, selector, patternName) {
  return `(() => {
    const matcher = new RegExp(${JSON.stringify(patternSource(patternName))}, 'i')
    const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${Number(cardIndex)}]
    if (card === undefined) return { clicked: false, error: 'no card' }
    const nodes = Array.from(card.querySelectorAll(${JSON.stringify(selector)}))
    const node = nodes.find((candidate) => matcher.test((candidate.textContent || '').trim()))
    if (node === undefined) return { clicked: false, options: nodes.map((candidate) => (candidate.textContent || '').trim()).slice(0, 12) }
    node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
    node.click()
    return { clicked: true, text: (node.textContent || '').trim(), disabled: node.disabled === true }
  })()`
}

function panelShapeExpression() {
  return `(() => {
    const panel = document.querySelector('.dshcurate-panel')
    if (panel === null) return null
    const rect = panel.getBoundingClientRect()
    const buttonShape = (button) => ({
      text: (button.textContent || '').trim(),
      disabled: button.disabled === true,
      primary: /(^|\\s)primary(\\s|$)/.test(String(button.className)),
    })
    const cardIndex = (card) => Array.from(panel.querySelectorAll('.dshcurate-card:not(.locked)')).indexOf(card)
    return {
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      dock: document.querySelectorAll('.dshcurate-dock').length,
      layer: document.querySelectorAll('.dshcurate-layer').length,
      title: (panel.querySelector('.dshcurate-title')?.textContent || '').trim(),
      help: panel.querySelectorAll('.dshcurate-help').length,
      close: Array.from(panel.querySelectorAll('.dshcurate-icon')).filter((button) => /close|关闭/i.test(String(button.getAttribute('aria-label') || button.getAttribute('title') || ''))).length,
      refresh: Array.from(panel.querySelectorAll('.dshcurate-icon')).filter((button) => /refresh|刷新/i.test(String(button.getAttribute('aria-label') || button.getAttribute('title') || ''))).length,
      refreshVisible: (() => {
        const button = Array.from(panel.querySelectorAll('.dshcurate-icon')).find((candidate) => /refresh|刷新/i.test(String(candidate.getAttribute('aria-label') || candidate.getAttribute('title') || '')))
        if (button === undefined) return false
        const box = button.getBoundingClientRect()
        return box.width > 4 && box.height > 4 && box.right <= panel.getBoundingClientRect().right + 1
      })(),
      stats: (panel.querySelector('.dshcurate-stats')?.textContent || '').trim(),
      statSpans: panel.querySelectorAll('.dshcurate-stats > span').length,
      scope: (panel.querySelector('.dshcurate-scope')?.textContent || '').trim(),
      preserveOptions: panel.querySelectorAll('.dshcurate-scope select option').length,
      views: Array.from(panel.querySelectorAll('.dshcurate-view button')).map((button) => ({
        text: (button.textContent || '').trim(),
        active: /(^|\\s)active(\\s|$)/.test(String(button.className)),
      })),
      flags: panel.querySelectorAll('.dshcurate-flag input[type=checkbox]').length,
      cards: panel.querySelectorAll('.dshcurate-card').length,
      groups: panel.querySelectorAll('.dshcurate-card:not(.locked)').length,
      locked: panel.querySelectorAll('.dshcurate-card.locked').length,
      chips: panel.querySelectorAll('.dshcurate-card:not(.locked) .dshcurate-tone').length,
      cardTones: Array.from(panel.querySelectorAll('.dshcurate-card:not(.locked) .dshcurate-tones')).map((toneGroup) =>
        Array.from(toneGroup.querySelectorAll('.dshcurate-tone')).map((button) => (button.textContent || '').trim())),
      cardMeta: Array.from(panel.querySelectorAll('.dshcurate-card:not(.locked) .dshcurate-card-meta')).map((node) =>
        (node.textContent || '').trim().slice(0, 140)),
      footer: Array.from(panel.querySelectorAll('.dshcurate-foot button')).map(buttonShape),
      notes: Array.from(panel.querySelectorAll('.dshcurate-foot .note')).map((node) => (node.textContent || '').trim()),
      version: (panel.querySelector('.dshcurate-foot .note:last-child')?.textContent || '').trim(),
      alerts: Array.from(panel.querySelectorAll('.dshcurate-alert')).map((node) => (node.textContent || '').trim()),
      banners: Array.from(panel.querySelectorAll('.dshcurate-version-banner')).map((node) => (node.textContent || '').trim().slice(0, 180)),
      empty: (panel.querySelector('.dshcurate-empty')?.textContent || '').trim(),
      toast: (panel.querySelector('.dshcurate-toast')?.textContent || '').trim(),
      segments: panel.querySelectorAll('.dshcurate-card:not(.locked) .dshcurate-segment').length,
      snippets: panel.querySelectorAll('.dshcurate-snippet').length,
      detailCounts: Array.from(panel.querySelectorAll('.dshcurate-card:not(.locked)')).map((card) => ({
        index: cardIndex(card),
        detail: card.querySelectorAll('.dshcurate-detail').length,
        messages: card.querySelectorAll('.dshcurate-message').length,
        msgTones: card.querySelectorAll('.dshcurate-msg-tones').length,
        editors: card.querySelectorAll('.dshcurate-editor').length,
      })),
      clientVersion: document.documentElement.dataset.dshCurateVersion ?? null,
    }
  })()`
}

function panelQuickShapeExpression() {
  return `(() => {
    const panel = document.querySelector('.dshcurate-panel')
    if (panel === null) return { panel: false }
    const stats = panel.querySelector('.dshcurate-stats')
    const empty = panel.querySelector('.dshcurate-empty')
    const alerts = Array.from(panel.querySelectorAll('.dshcurate-alert')).map((node) => (node.textContent || '').trim())
    const statsText = (stats?.textContent || '').trim()
    const selected = statsText.match(/(\\d+)\\s*(?:segments?|段)/i)
    return {
      panel: true,
      ready: stats !== null,
      stats: statsText,
      selectedSegments: selected === null ? null : Number(selected[1]),
      empty: (empty?.textContent || '').trim(),
      alerts,
      busy: alerts.some((text) => /正在工作|is working/i.test(text)),
      groups: panel.querySelectorAll('.dshcurate-card:not(.locked)').length,
      cards: panel.querySelectorAll('.dshcurate-card').length,
    }
  })()`
}

// --- workflow helpers ------------------------------------------------------
async function loadPage(send) {
  const url = TOKEN === '' ? APP_URL : `${APP_URL}/?token=${encodeURIComponent(TOKEN)}`
  await send('Page.navigate', { url })
  await waitFor(
    send,
    `document.readyState === 'complete' && document.querySelectorAll('[role="treeitem"]').length > 0`,
    'DSH web app boot',
    PAGE_LOAD_TIMEOUT,
  )
  // The conversation shell may still be mounting; give the plugin rows a moment.
  await sleep(1200)
}

async function conversationState(send) {
  return evaluate(send, `({
    rows: document.querySelectorAll('[data-chat-flow-key]').length,
    opens: document.querySelectorAll('.dshcurate-open').length,
    panel: document.querySelectorAll('.dshcurate-panel').length,
  })`)
}

async function selectSession(send, title) {
  const clicked = await evaluate(send, clickSessionExpression(title))
  if (clicked !== 'clicked') return { ok: false, reason: `session row missing (${clicked})` }
  try {
    await waitFor(
      send,
      `(() => { const value = ${selectedSessionExpression(title)}; return value.active && value.rows > 0 })()`,
      `session "${title}" to become active`,
      SESSION_SWITCH_TIMEOUT,
    )
  } catch (error) {
    return { ok: false, reason: error.message }
  }
  // Let the transcript (and the session header slots) settle: the workbench
  // reads its session id from the header slot, so clicking while the previous
  // session is still unmounting can open the panel for the wrong session.
  let rows = -1
  let stable = 0
  for (let attempt = 0; attempt < 14; attempt += 1) {
    await sleep(300)
    const current = await conversationState(send)
    if (current.rows === rows && current.rows > 0) stable += 1
    else stable = 0
    rows = current.rows
    if (stable >= 2 && current.opens === 1) break
  }
  const state = await conversationState(send)
  if (state.rows === 0) return { ok: false, reason: 'transcript did not render' }
  if (state.opens === 0) return { ok: false, reason: 'header entry did not render' }
  if (state.opens > 1) return { ok: false, reason: `ambiguous header entries (${state.opens})` }
  return { ok: true, rows: state.rows, opens: state.opens }
}

async function openWorkbench(send) {
  // One header entry per session; wait for a single mount so the click cannot
  // target the previous session's entry mid-transition.
  await waitFor(send, `document.querySelectorAll('.dshcurate-open').length === 1`, 'single header entry', 5000).catch(() => {})
  const clicked = await evaluate(send, `(() => {
    const nodes = Array.from(document.querySelectorAll('.dshcurate-open'))
    const button = nodes[nodes.length - 1]
    if (button === undefined) return { clicked: false }
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
    button.click()
    return { clicked: true, text: (button.textContent || '').trim() }
  })()`)
  if (!clicked || clicked.clicked !== true) throw new Error('header entry (.dshcurate-open) is missing')
  await waitFor(send, `document.querySelectorAll('.dshcurate-panel').length > 0`, 'workbench panel mount', 6000)
  // The panel mounts in a loading phase; wait for the stats bar (ready) and
  // fall back to the rendered state if the host answers with an error/busy shell.
  const ready = await waitFor(
    send,
    `(() => { const value = ${panelQuickShapeExpression()}; return value.panel === true && value.ready === true ? value : null })()`,
    'workbench stats bar',
    PANEL_READY_TIMEOUT,
  ).catch(() => null)
  await sleep(500)
  const quick = await evaluate(send, panelQuickShapeExpression())
  return { clicked: clicked.text || '', ready: ready !== null, quick }
}

async function closeWorkbench(send) {
  const result = await evaluate(send, `(() => {
    const panel = document.querySelector('.dshcurate-panel')
    if (panel === null) return 'absent'
    const button = Array.from(panel.querySelectorAll('.dshcurate-icon'))
      .find((candidate) => /close|关闭/i.test(String(candidate.getAttribute('aria-label') || candidate.getAttribute('title') || '')))
    if (button === undefined) return 'no-close'
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
    button.click()
    return 'clicked'
  })()`)
  if (result === 'clicked') {
    try {
      await waitFor(send, `document.querySelectorAll('.dshcurate-panel').length === 0`, 'workbench to close', 4000)
    } catch {}
  }
  await sleep(250)
  return result
}

async function readStatePayload(send, events) {
  const requests = events.filter((event) =>
    event.method === 'Network.requestWillBeSent' && String(event.params.request.url).includes('/dsh-curate/state'))
  if (requests.length === 0) return null
  const requestId = requests[requests.length - 1].params.requestId
  for (const delay of [120, 400, 900]) {
    await sleep(delay)
    const body = await send('Network.getResponseBody', { requestId }).catch(() => null)
    const text = body && body.result ? body.result.body : ''
    if (typeof text !== 'string' || text === '') continue
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {}
  }
  return null
}

async function pickCandidateSession(send, candidates, forcedTitle) {
  const attempts = []
  let best = null
  const ordered = forcedTitle === null ? candidates : [{ title: forcedTitle, forced: true }, ...candidates]
  for (const candidate of ordered.slice(0, 6)) {
    const selection = await selectSession(send, candidate.title)
    if (!selection.ok) {
      attempts.push({ title: candidate.title, skipped: selection.reason })
      continue
    }
    let opened
    try {
      opened = await openWorkbench(send)
      // A ready shell with zero cards usually means the panel mounted during a
      // session transition; retry once on a settled page before rejecting.
      if (opened.ready === true && opened.quick.groups === 0 && opened.quick.busy !== true) {
        await closeWorkbench(send)
        await sleep(500)
        opened = await openWorkbench(send)
      }
    } catch (error) {
      attempts.push({ title: candidate.title, skipped: error.message })
      await closeWorkbench(send)
      continue
    }
    const shape = opened.quick
    const usable = opened.ready === true
      && shape.busy !== true
      && shape.groups >= 1
      && shape.selectedSegments !== null
      && shape.selectedSegments > 0
    attempts.push({
      title: candidate.title,
      ready: opened.ready,
      groups: shape.groups,
      cards: shape.cards,
      selectedSegments: shape.selectedSegments,
      busy: shape.busy === true,
      empty: opened.ready === true ? undefined : clip(shape.empty, 80),
      usable,
    })
    await closeWorkbench(send)
    if (usable && shape.groups >= 2) return { title: candidate.title, attempts, chosen: shape }
    if (usable && (best === null || shape.groups > best.groups)) best = { title: candidate.title, groups: shape.groups }
  }
  if (best !== null) return { title: best.title, attempts, fallback: true }
  return { title: null, attempts }
}

// --- main ------------------------------------------------------------------
async function main() {
  if (TOKEN === '') {
    console.error('DSH_TOKEN is required (the token is printed by `journalctl --user -u dsh-web.service`).')
    console.error('  DSH_TOKEN=$(journalctl --user -u dsh-web.service --no-pager | grep \'dsh web: http\' | tail -1 | sed -E \'s/.*[?&]token=([^ &]+).*/\\1/\') node scripts/verify-live.mjs')
    process.exit(2)
  }
  console.log(`verify-live: ${APP_URL} (read-only; never POSTs /apply, /edit or /compact)`)
  console.log(`source versions: host=${HOST_SOURCE_VERSION || '?'} client=${CLIENT_SOURCE_VERSION || '?'} package=${PACKAGE_VERSION || '?'}`)
  if (SRC_CLIENT_VERSION !== '' && SRC_CLIENT_VERSION !== CLIENT_SOURCE_VERSION) {
    warn('src/client.js is newer than lib/client.js', `src=${SRC_CLIENT_VERSION} built=${CLIENT_SOURCE_VERSION}; run npm run build:client`)
  }

  const { send, socket, events } = await connect()
  let drafts = null
  const earlyConsoleErrors = []
  const earlyPageErrors = []

  const collectEarly = () => {
    for (const event of events) {
      if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') {
        earlyConsoleErrors.push((event.params.args || []).map((arg) => arg.value ?? arg.description ?? '').join(' '))
      }
      if (event.method === 'Runtime.exceptionThrown') {
        earlyPageErrors.push(event.params.exceptionDetails?.text ?? 'page exception')
      }
    }
  }

  try {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
    await loadPage(send)
    drafts = await evaluate(send, draftsSnapshotExpression())

    // --- pick an idle session -------------------------------------------------
    group('session selection')
    const allCandidates = await evaluate(send, sessionCandidatesExpression())
    const candidateTitles = Array.isArray(allCandidates) ? allCandidates.map((row) => row.title) : []
    info('sidebar idle sessions', candidateTitles.length > 0 ? candidateTitles : '(none)')
    check('at least one idle session is listed in the sidebar', candidateTitles.length > 0, clip(candidateTitles, 160))
    if (candidateTitles.length === 0) throw new Error('no idle session in the sidebar; cannot verify the workbench')

    const picked = await pickCandidateSession(send, allCandidates, FORCED_TITLE)
    info('session candidates tried', picked.attempts)
    if (picked.title === null) throw new Error(`no idle session exposes a usable workbench: ${JSON.stringify(picked.attempts)}`)
    check('an idle session with group cards was found', picked.title !== null, picked.title)
    if (picked.fallback === true) warn('using a session with only one group card', picked.title)

    const selection = await selectSession(send, picked.title)
    check('session transcript is visible', selection.ok === true, selection.reason)
    if (!selection.ok) throw new Error(`could not open session "${picked.title}": ${selection.reason}`)
    info('session under test', picked.title)
    info('transcript rows', selection.rows)

    for (const error of earlyConsoleErrors) warn('console error during page load', clip(error))
    for (const error of earlyPageErrors) warn('page error during load', clip(error))

    // --- header entry ---------------------------------------------------------
    group('header entry')
    const entry = await evaluate(send, `(() => {
      const nodes = Array.from(document.querySelectorAll('.dshcurate-open'))
      const button = nodes[0]
      if (button === undefined) return null
      const rect = button.getBoundingClientRect()
      return {
        count: nodes.length,
        text: (button.textContent || '').trim(),
        visible: rect.width > 0 && rect.height > 0,
        width: Math.round(rect.width),
      }
    })()`)
    check('header entry is rendered', entry !== null && entry.visible === true, entry === null ? 'missing .dshcurate-open' : clip(entry))
    check('header entry shows the curation label', entry !== null && new RegExp(patternSource('open'), 'i').test(entry.text || ''), entry === null ? 'missing' : entry.text)
    check('exactly one header entry is mounted', entry !== null && entry.count === 1, entry === null ? 'missing' : `count=${entry.count}`)

    // --- open the workbench ---------------------------------------------------
    group('workbench panel')
    const opened = await openWorkbench(send)
    info('open button', opened.clicked)
    const panel = await waitFor(send, panelShapeExpression(), 'workbench DOM', 6000)
    check('workbench panel exists', panel !== null)
    if (panel === null) throw new Error('workbench panel did not render after clicking the header entry')

    // The panel is normally docked into the official right sidebar; the overlay
    // layer is the documented fallback for compositions without that sidebar.
    check(
      'panel is docked into the sidebar or overlaid once',
      (panel.dock === 1 && panel.layer === 0) || (panel.layer === 1 && panel.dock === 0),
      `dock=${panel.dock} layer=${panel.layer}`,
    )
    check('panel is visible and sized', panel.rect.width >= 320 && panel.rect.height >= 400, JSON.stringify(panel.rect))
    check('panel title is present', new RegExp(patternSource('panelTitle'), 'i').test(panel.title), panel.title)
    check('help affordance is present', panel.help === 1, `help=${panel.help}`)
    check('close affordance is present', panel.close === 1, `close=${panel.close}`)
    check('refresh affordance is present and visible', panel.refresh === 1 && panel.refreshVisible === true, `refresh=${panel.refresh} visible=${panel.refreshVisible}`)
    check('panel finished loading (no stuck loading state)', panel.empty === '', panel.empty)
    check('idle session shows no busy/error alert', panel.alerts.length === 0, clip(panel.alerts))
    check('stats bar shows token accounting', panel.statSpans >= 3 && /tokens/i.test(panel.stats) && new RegExp(patternSource('saved'), 'i').test(panel.stats), clip(panel.stats))
    check('scope bar offers the recent-turn control', panel.preserveOptions >= 7, `options=${panel.preserveOptions}`)
    check(
      'view switch offers all-content and dialogue-text modes',
      panel.views.length === 2
        && new RegExp(patternSource('viewAll'), 'i').test(panel.views[0]?.text || '')
        && new RegExp(patternSource('viewText'), 'i').test(panel.views[1]?.text || ''),
      clip(panel.views),
    )
    check('dialogue-text-only summary flag is offered', panel.flags === 1, `checkboxes=${panel.flags}`)
    check('group cards are listed', panel.groups >= 1 && panel.cards >= panel.groups, `groups=${panel.groups} cards=${panel.cards}`)
    check('recent locked cards are marked', panel.locked >= 1, `locked=${panel.locked}`)
    check('each unlocked card offers three tone buttons', panel.chips >= panel.groups * 3, `chips=${panel.chips} groups=${panel.groups}`)
    info('card meta', panel.cardMeta)

    // Footer (0.4.1+): apply / compress / save / undo, no obsolete Draft button.
    const footerTexts = panel.footer.map((button) => button.text)
    const footerBy = (name) => footerTexts.findIndex((text) => new RegExp(patternSource(name), 'i').test(text))
    const applyIndex = footerBy('apply')
    const compressIndex = footerBy('compress')
    const saveIndex = footerBy('save')
    const undoIndex = footerBy('undo')
    check('footer offers exactly the four 0.4.1 actions', panel.footer.length === 4, `footer=${clip(footerTexts)}`)
    check('footer offers apply to context', applyIndex >= 0, `footer=${clip(footerTexts)}`)
    check('footer offers compress context', compressIndex >= 0, `footer=${clip(footerTexts)}`)
    check('footer offers save current content', saveIndex >= 0, `footer=${clip(footerTexts)}`)
    check('footer offers undo', undoIndex >= 0, `footer=${clip(footerTexts)}`)
    check('obsolete Draft footer button is gone', !footerTexts.some((text) => /Draft|生成/.test(text)), clip(footerTexts))
    check('apply is disabled before any edit', panel.footer[applyIndex]?.disabled === true, clip(panel.footer[applyIndex]))
    check('undo is disabled before any change', panel.footer[undoIndex]?.disabled === true, clip(panel.footer[undoIndex]))
    check('footer notes stay quiet before any edit', !panel.notes.some((note) => new RegExp(patternSource('pendingEdit'), 'i').test(note)), clip(panel.notes))

    // Version marker comes from the built client bundle, not a hardcoded value.
    check('client bundle version is exposed on the page', typeof panel.clientVersion === 'string' && panel.clientVersion !== '', String(panel.clientVersion))
    if (typeof panel.clientVersion === 'string' && CLIENT_SOURCE_VERSION !== '' && panel.clientVersion !== CLIENT_SOURCE_VERSION) {
      check('client bundle version matches lib/client.js', false, `page=${panel.clientVersion} lib=${CLIENT_SOURCE_VERSION} (rebuild + hard refresh)`)
    } else {
      check('client bundle version matches lib/client.js', true)
      check('client bundle version is readable from lib/client.js', CLIENT_SOURCE_VERSION !== '')
    }
    check('version marker is rendered', new RegExp(`^v?${String(CLIENT_SOURCE_VERSION || '').replace(/\./g, '\\.')}$`).test(panel.version), `marker="${panel.version}" expected="v${CLIENT_SOURCE_VERSION}"`)

    // --- /state payload -------------------------------------------------------
    group('host /state payload')
    await sleep(400)
    const state = await readStatePayload(send, events)
    check('/dsh-curate/state was requested', state !== null)
    if (state === null) throw new Error('could not read the /dsh-curate/state response body over CDP')
    const capabilities = state.capabilities && typeof state.capabilities === 'object' ? state.capabilities : {}
    info('host version', state.version)
    info('capabilities', capabilities)
    info('busy', state.busy)
    info('nodes / lastSeq / live', `${Array.isArray(state.nodes) ? state.nodes.length : '?'} / ${state.lastSeq} / ${state.live}`)
    check('state payload carries a host version', typeof state.version === 'string' && state.version !== '', String(state.version))
    check('state payload carries capabilities', capabilities !== null && capabilities.edit === true, clip(capabilities))
    check('state reports edit capability', capabilities.edit === true, String(capabilities.edit))
    check('state reports patch (message projection) capability', capabilities.patch === true, String(capabilities.patch))
    check('state reports official /compact capability', capabilities.compaction === true, String(capabilities.compaction))
    check('picked session is idle according to the host', state.busy === false, String(state.busy))
    check('state surface is non-empty', Array.isArray(state.nodes) && state.nodes.length > 0, `nodes=${Array.isArray(state.nodes) ? state.nodes.length : '?'}`)
    check('state preserves recent turns', Number.isFinite(state.preserveRecentTurns), String(state.preserveRecentTurns))

    // The version banner is expected only when the running host and the loaded
    // client disagree (e.g. right after a bump, before DSH web is restarted).
    const expectedBanner = state.version !== panel.clientVersion || capabilities.patch === false
    check(
      'version banner state matches host/client versions and capabilities',
      (panel.banners.length > 0) === expectedBanner,
      `banners=${clip(panel.banners)} expected=${expectedBanner} host=${state.version} client=${panel.clientVersion}`,
    )
    if (state.version !== CLIENT_SOURCE_VERSION) {
      warn('running host version differs from the built plugin', `host=${state.version} built=${CLIENT_SOURCE_VERSION}; restart DSH web to serve the new host half`)
    }
    if (PACKAGE_VERSION !== '' && PACKAGE_VERSION !== HOST_SOURCE_VERSION) {
      warn('package.json version differs from lib/index.js', `package=${PACKAGE_VERSION} host=${HOST_SOURCE_VERSION}`)
    }

    // --- screenshot before touching any state ---------------------------------
    group('screenshot')
    const shotPath = await shot(send)
    check('workbench screenshot saved', shotPath !== null, shotPath || 'capture failed')

    // --- help popover ---------------------------------------------------------
    group('help')
    const helpToggle = await evaluate(send, `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const button = document.querySelector('.dshcurate-help')
      if (button === null) return { error: 'missing' }
      button.click(); await wait(250)
      const opened = document.querySelectorAll('.dshcurate-help-pop').length
      button.click(); await wait(250)
      return { opened, closed: document.querySelectorAll('.dshcurate-help-pop').length }
    })()`)
    check('help popover toggles open and closed', helpToggle.error === undefined && helpToggle.opened === 1 && helpToggle.closed === 0, clip(helpToggle))

    // --- view switch ----------------------------------------------------------
    group('view switch')
    const viewSwitch = await evaluate(send, `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const buttons = () => Array.from(document.querySelectorAll('.dshcurate-view button'))
      const snippets = () => document.querySelectorAll('.dshcurate-snippet').length
      if (buttons().length < 2) return { error: 'missing buttons' }
      const before = snippets()
      buttons()[1].click(); await wait(450)
      const textOnly = { snippets: snippets(), active: buttons().map((button) => /active/.test(String(button.className))) }
      buttons()[0].click(); await wait(450)
      return { before, textOnly, all: { snippets: snippets(), active: buttons().map((button) => /active/.test(String(button.className))) } }
    })()`)
    check(
      'text-only view filters the preview and all-content restores it',
      viewSwitch.error === undefined
        && viewSwitch.textOnly.snippets <= viewSwitch.before
        && viewSwitch.all.snippets === viewSwitch.before
        && viewSwitch.textOnly.active[1] === true
        && viewSwitch.all.active[0] === true,
      clip(viewSwitch),
    )

    // --- group tone buttons ---------------------------------------------------
    group('card triage')
    const groupTone = await evaluate(send, `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const stats = () => (document.querySelector('.dshcurate-stats')?.textContent || '').trim()
      const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[0]
      if (card === undefined) return { error: 'no card' }
      const chips = (matcher) => Array.from(card.querySelectorAll('.dshcurate-tones .dshcurate-tone'))
        .filter((button) => matcher.test((button.textContent || '').trim()))
      const before = stats()
      const keep = chips(/^(重要|Important)$/i)[0]
      const normal = chips(/^(默认|Default)$/i)[0]
      if (keep === undefined || normal === undefined) return { error: 'tone chips missing', before }
      keep.click(); await wait(400)
      const afterKeep = stats()
      normal.click(); await wait(400)
      return { before, afterKeep, afterNormal: stats() }
    })()`)
    check('group Important deselects the card from compression', groupTone.error === undefined && groupTone.afterKeep !== groupTone.before, clip(groupTone))
    check('group Default restores the selection', groupTone.error === undefined && groupTone.afterNormal === groupTone.before, clip(groupTone))

    // --- full-text expansion --------------------------------------------------
    group('full text expansion')
    let expanded = null
    let expandedIndex = -1
    for (let index = 0; index < Math.min(panel.groups, 4); index += 1) {
      const click = await evaluate(send, clickInCardExpression(index, '.dshcurate-snippet-tools button', 'expand'))
      if (click.clicked !== true) continue
      try {
        await waitFor(
          send,
          `(() => { const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${index}]; return card !== undefined && card.querySelectorAll('.dshcurate-detail').length > 0 })()`,
          `card ${index} full text`,
          8000,
        )
      } catch {
        const toast = await evaluate(send, `(document.querySelector('.dshcurate-toast')?.textContent || '').trim()`)
        info(`card ${index} expansion`, `failed${toast === '' ? '' : ` (${clip(toast, 120)})`}`)
        continue
      }
      expanded = await evaluate(send, `(() => {
        const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${index}]
        const messages = card.querySelectorAll('.dshcurate-message')
        const editButtons = Array.from(card.querySelectorAll('.dshcurate-message button'))
        return {
          messages: messages.length,
          msgTones: card.querySelectorAll('.dshcurate-msg-tones').length,
          toneButtons: card.querySelectorAll('.dshcurate-msg-tones .dshcurate-tone').length,
          editButtons: editButtons.filter((button) => /^(编辑|Edit)$/i.test((button.textContent || '').trim())).length,
          toolBlocks: card.querySelectorAll('.dshcurate-block-chip, .dshcurate-tool-text').length,
          expandLabel: (card.querySelector('.dshcurate-snippet-tools button')?.textContent || '').trim(),
        }
      })()`)
      expandedIndex = index
      break
    }
    check('full text expansion renders message details', expanded !== null && expanded.messages > 0, expanded === null ? 'no card expanded' : clip(expanded))
    if (expanded !== null) {
      check('expanded detail offers per-message tone controls', expanded.msgTones > 0 && expanded.toneButtons > 0, clip(expanded))
      check('expanded detail offers message editing', expanded.editButtons > 0, clip(expanded))
      check('expanded card offers collapse control', new RegExp(patternSource('collapse'), 'i').test(expanded.expandLabel), expanded.expandLabel)
    }

    // --- per-message tone -----------------------------------------------------
    group('per-message triage')
    if (expandedIndex >= 0) {
      const msgTone = await evaluate(send, `(async () => {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
        const stats = () => (document.querySelector('.dshcurate-stats')?.textContent || '').trim()
        const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${expandedIndex}]
        if (card === undefined) return { error: 'no card' }
        const toneGroup = card.querySelector('.dshcurate-msg-tones')
        if (toneGroup === null) return { error: 'no per-message tones' }
        const before = stats()
        const minor = Array.from(toneGroup.querySelectorAll('.dshcurate-tone')).find((button) => /^(次要|Minor)$/i.test((button.textContent || '').trim()))
        if (minor === undefined) return { error: 'minor tone missing' }
        minor.click(); await wait(400)
        const active = Array.from(toneGroup.querySelectorAll('.dshcurate-tone')).map((button) => ({
          text: (button.textContent || '').trim(),
          active: /active/.test(String(button.className)),
        }))
        const after = stats()
        const normal = Array.from(card.querySelectorAll('.dshcurate-tones .dshcurate-tone')).find((button) => /^(默认|Default)$/i.test((button.textContent || '').trim()))
        if (normal !== undefined) { normal.click(); await wait(450) }
        return { before, after, restored: stats(), active }
      })()`)
      check('per-message Minor tone activates on that message', msgTone.error === undefined && msgTone.active.some((button) => button.active === true && /次要|Minor/i.test(button.text)), clip(msgTone))
      check('per-message tone changes the compression selection', msgTone.error === undefined && msgTone.after !== msgTone.before, clip(msgTone))
      check('group Default restores the default selection after per-message triage', msgTone.error === undefined && msgTone.restored === msgTone.before, clip(msgTone))
    } else {
      check('per-message tone buttons are reachable', false, 'no card expanded')
    }

    // --- message editor -------------------------------------------------------
    group('message editor')
    let editorTried = false
    if (expandedIndex >= 0) {
      const openEdit = await evaluate(send, clickInCardExpression(expandedIndex, '.dshcurate-message button', 'edit'))
      if (openEdit.clicked === true) {
        editorTried = true
        try {
          await waitFor(
            send,
            `(() => { const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${expandedIndex}]; return card !== undefined && card.querySelector('.dshcurate-editor') !== null })()`,
            'message editor',
            6000,
          )
        } catch {}
        const editor = await evaluate(send, `(() => {
          const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${expandedIndex}]
          const editor = card === undefined ? null : card.querySelector('.dshcurate-editor')
          if (editor === null) return { open: false }
          return {
            open: true,
            modes: Array.from(editor.querySelectorAll('.dshcurate-modes button')).map((button) => (button.textContent || '').trim()),
            modeActive: Array.from(editor.querySelectorAll('.dshcurate-modes button')).map((button) => /active/.test(String(button.className))),
            rendered: editor.querySelectorAll('.dshcurate-rendered').length,
            source: editor.querySelectorAll('textarea.dshcurate-source').length,
            save: Array.from(editor.querySelectorAll('.dshcurate-editor-foot button')).map((button) => (button.textContent || '').trim()),
          }
        })()`)
        check('editable message opens the editor', editor.open === true, clip(editor))
        if (editor.open) {
          check(
            'editor offers source and rendered views',
            editor.modes.length === 2
              && new RegExp(patternSource('source'), 'i').test(editor.modes[0] || '')
              && new RegExp(patternSource('rendered'), 'i').test(editor.modes[1] || ''),
            clip(editor.modes),
          )
          const switchView = await evaluate(send, `(async () => {
            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
            const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${expandedIndex}]
            const modes = () => Array.from(card.querySelectorAll('.dshcurate-editor .dshcurate-modes button'))
            const rendered = () => card.querySelectorAll('.dshcurate-editor .dshcurate-rendered').length
            const source = () => card.querySelectorAll('.dshcurate-editor textarea.dshcurate-source').length
            const sourceButton = modes().find((button) => /^(源码|Source)$/i.test((button.textContent || '').trim()))
            const renderedButton = modes().find((button) => /^(渲染|Rendered)$/i.test((button.textContent || '').trim()))
            if (sourceButton === undefined || renderedButton === undefined) return { error: 'mode buttons missing' }
            sourceButton.click(); await wait(300)
            const afterSource = { source: source(), rendered: rendered() }
            renderedButton.click(); await wait(300)
            return { afterSource, afterRendered: { source: source(), rendered: rendered() } }
          })()`)
          check('editor switches to the Markdown source view', switchView.error === undefined && switchView.afterSource.source === 1, clip(switchView))
          check('editor switches back to the rendered view', switchView.error === undefined && switchView.afterRendered.rendered === 1 && switchView.afterRendered.source === 0, clip(switchView))
          const cancelEdit = await evaluate(send, clickInCardExpression(expandedIndex, '.dshcurate-editor-foot button', 'editorCancel'))
          await sleep(350)
          const closedEditor = await evaluate(send, `(() => { const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${expandedIndex}]; return card === undefined ? false : card.querySelector('.dshcurate-editor') === null })()`)
          check('editor closes without saving', cancelEdit.clicked === true && closedEditor === true, `${clip(cancelEdit)} closed=${closedEditor}`)
        }
      }
    }
    if (!editorTried) check('editable message opens the editor', false, 'no editable message button found in the expanded card')

    // --- stage a rewrite, inspect footer, undo --------------------------------
    group('staged edit and undo (no write)')
    if (expandedIndex >= 0) {
      const stage = await evaluate(send, `(async () => {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
        const card = Array.from(document.querySelectorAll('.dshcurate-card:not(.locked)'))[${expandedIndex}]
        if (card === undefined) return { error: 'no card' }
        const edit = Array.from(card.querySelectorAll('.dshcurate-message button')).find((button) => /^(编辑|Edit)$/i.test((button.textContent || '').trim()))
        if (edit === undefined) return { error: 'no edit button' }
        edit.click(); await wait(800)
        const sourceButton = Array.from(card.querySelectorAll('.dshcurate-editor .dshcurate-modes button')).find((button) => /^(源码|Source)$/i.test((button.textContent || '').trim()))
        if (sourceButton !== undefined) { sourceButton.click(); await wait(250) }
        const textarea = card.querySelector('.dshcurate-editor textarea.dshcurate-source')
        if (textarea === null) return { error: 'no source textarea' }
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
        setter.call(textarea, (textarea.value || '') + ' [dsh-curate verify]')
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        await wait(250)
        const save = Array.from(card.querySelectorAll('.dshcurate-editor-foot button')).find((button) => /保存修改|Save edit/i.test((button.textContent || '').trim()))
        if (save === undefined) return { error: 'no save button' }
        save.click(); await wait(700)
        const buttons = () => Array.from(document.querySelectorAll('.dshcurate-foot button'))
        const footer = buttons().map((button) => ({ text: (button.textContent || '').trim(), disabled: button.disabled === true, primary: /(^|\\s)primary(\\s|$)/.test(String(button.className)) }))
        const notes = Array.from(document.querySelectorAll('.dshcurate-foot .note')).map((node) => (node.textContent || '').trim())
        return {
          footer,
          notes,
          staged: document.querySelectorAll('.dshcurate-message.staged').length,
          toast: (document.querySelector('.dshcurate-toast')?.textContent || '').trim(),
        }
      })()`)
      check('staging an edit succeeds without a write', stage.error === undefined && stage.staged > 0, clip(stage))
      if (stage.error === undefined) {
        const stagedApply = stage.footer.find((button) => new RegExp(patternSource('applyEdits'), 'i').test(button.text))
        const stagedUndo = stage.footer.find((button) => new RegExp(patternSource('undo'), 'i').test(button.text))
        check('footer switches to "modify and apply to context"', stagedApply !== undefined, clip(stage.footer))
        check('apply becomes enabled once an edit is staged', stagedApply !== undefined && stagedApply.disabled === false, clip(stagedApply))
        check('undo becomes enabled once an edit is staged', stagedUndo !== undefined && stagedUndo.disabled === false, clip(stagedUndo))
        check('footer reports the pending edit count', stage.notes.some((note) => new RegExp(patternSource('pendingEdit'), 'i').test(note)), clip(stage.notes))
        check('staged message is badged as pending', /已修改|Edited|pending/i.test(stage.toast) || stage.staged > 0, clip(stage.toast))

        const undo = await evaluate(send, `(async () => {
          const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
          const button = Array.from(document.querySelectorAll('.dshcurate-foot button')).find((candidate) => /^(撤销|Undo)$/i.test((candidate.textContent || '').trim()))
          if (button === undefined) return { error: 'no undo' }
          button.click(); await wait(500)
          return {
            text: (button.textContent || '').trim(),
            footer: Array.from(document.querySelectorAll('.dshcurate-foot button')).map((candidate) => (candidate.textContent || '').trim()),
            staged: document.querySelectorAll('.dshcurate-message.staged').length,
            toast: (document.querySelector('.dshcurate-toast')?.textContent || '').trim(),
          }
        })()`)
        check('undo reverts the staged edit', undo.error === undefined && undo.staged === 0, clip(undo))
        const backToApply = undo.error === undefined && undo.footer.some((text) => new RegExp(patternSource('apply'), 'i').test(text))
        check('footer returns to plain "apply to context" after undo', backToApply, clip(undo))
        check('undo shows its confirmation toast', undo.error === undefined && new RegExp(patternSource('undoDone'), 'i').test(undo.toast), clip(undo))
      }
    }

    // --- save current content (local draft only) ------------------------------
    group('save current content')
    const saveDraft = await evaluate(send, `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const button = Array.from(document.querySelectorAll('.dshcurate-foot button')).find((candidate) => /保存当前内容|Save current content/i.test((candidate.textContent || '').trim()))
      if (button === undefined) return { error: 'no save button' }
      button.click(); await wait(400)
      return {
        toast: (document.querySelector('.dshcurate-toast')?.textContent || '').trim(),
        drafts: Object.keys(localStorage).filter((key) => key.startsWith(${JSON.stringify(DRAFT_PREFIX)})).length,
      }
    })()`)
    check('save current content writes a local draft, not the session', saveDraft.error === undefined && new RegExp(patternSource('draftSaved'), 'i').test(saveDraft.toast), clip(saveDraft))
    check('save current content leaves a restorable local draft', saveDraft.error === undefined && Number(saveDraft.drafts) >= 1, clip(saveDraft.drafts))

    // --- compression dialog (inspect only, never confirm) ---------------------
    group('compression dialog')
    const dialog = await evaluate(send, `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const open = Array.from(document.querySelectorAll('.dshcurate-foot button')).find((candidate) => /压缩上下文|Compress context/i.test((candidate.textContent || '').trim()))
      if (open === undefined) return { error: 'no compress button' }
      open.click(); await wait(650)
      const panel = document.querySelector('.dshcurate-compress')
      if (panel === null) return { error: 'dialog missing' }
      const foot = () => Array.from(panel.querySelectorAll('.dshcurate-compress-foot button')).map((button) => ({ text: (button.textContent || '').trim(), disabled: button.disabled === true }))
      const before = foot()
      const checkbox = panel.querySelector('input[type=checkbox]')
      if (checkbox !== null) { checkbox.click(); await wait(300) }
      const after = foot()
      const cancel = Array.from(panel.querySelectorAll('.dshcurate-compress-foot button')).find((button) => /再检查一下|Keep reviewing/i.test((button.textContent || '').trim()))
      if (cancel !== undefined) { cancel.click(); await wait(400) }
      return {
        title: (panel.querySelector('h4')?.textContent || '').trim(),
        labels: Array.from(panel.querySelectorAll('.dshcurate-compress-label')).map((node) => (node.textContent || '').trim()),
        options: Array.from(panel.querySelectorAll('.dshcurate-option')).map((node) => ({
          text: (node.querySelector('.t')?.textContent || '').trim(),
          disabled: /(^|\\s)disabled(\\s|$)/.test(String(node.className)),
          active: /(^|\\s)active(\\s|$)/.test(String(node.className)),
        })),
        radios: panel.querySelectorAll('input[type=radio]').length,
        checkboxes: panel.querySelectorAll('input[type=checkbox]').length,
        confirmBefore: before,
        confirmAfter: after,
        closed: document.querySelectorAll('.dshcurate-compress').length,
      }
    })()`)
    check('compression dialog opens from the footer', dialog.error === undefined && dialog.title !== '', clip(dialog))
    if (dialog.error === undefined) {
      check('compression dialog titles itself', /压缩上下文|Compress context/i.test(dialog.title), dialog.title)
      check('compression dialog groups target and method', dialog.labels.length === 2, clip(dialog.labels))
      const optionTexts = dialog.options.map((option) => option.text)
      const optionBy = (name) => optionTexts.findIndex((text) => new RegExp(patternSource(name), 'i').test(text))
      check(
        'compression dialog offers both targets',
        optionBy('targetDirect') >= 0 && optionBy('targetModified') >= 0,
        clip(optionTexts),
      )
      check(
        'compression dialog offers curated and official methods',
        optionBy('curated') >= 0 && optionBy('official') >= 0,
        clip(optionTexts),
      )
      check('compression dialog uses four radio choices', dialog.radios === 4, `radios=${dialog.radios}`)
      check('irreversible-compression acknowledgement is required', dialog.confirmBefore.some((button) => button.disabled === true && new RegExp(patternSource('compressConfirm'), 'i').test(button.text)), clip(dialog.confirmBefore))
      const confirmEnabledAfter = dialog.confirmAfter.some((button) => button.disabled === false && new RegExp(patternSource('compressConfirm'), 'i').test(button.text))
      check('acknowledgement enables the compress button', confirmEnabledAfter, clip(dialog.confirmAfter))
      check('dialog closes via "keep reviewing" without compressing', dialog.closed === 0, `open=${dialog.closed}`)
    }

    // --- close the panel ------------------------------------------------------
    group('panel close')
    const closed = await closeWorkbench(send)
    const afterClose = await evaluate(send, `({
      panels: document.querySelectorAll('.dshcurate-panel').length,
      docks: document.querySelectorAll('.dshcurate-dock').length,
      layers: document.querySelectorAll('.dshcurate-layer').length,
    })`)
    check('close button removes the workbench', closed === 'clicked' && afterClose.panels === 0 && afterClose.docks === 0 && afterClose.layers === 0, `${closed} ${clip(afterClose)}`)

    // --- network discipline ---------------------------------------------------
    group('network discipline')
    const curateEvents = events.filter((event) =>
      event.method === 'Network.requestWillBeSent' && String(event.params.request.url).includes('/dsh-curate/'))
    const byRoute = (route) => curateEvents.filter((event) => safePath(event.params.request.url) === `/dsh-curate/${route}`)
    const stateCalls = byRoute('state').length
    const contentCalls = byRoute('content').length
    const messageCalls = byRoute('message').length
    const applyCalls = byRoute('apply').length
    const editCalls = byRoute('edit').length
    const compactCalls = byRoute('compact').length
    const nonGet = curateEvents.filter((event) => event.params.request.method !== 'GET')
    const responses = events.filter((event) =>
      event.method === 'Network.responseReceived' && String(event.params.response.url).includes('/dsh-curate/'))
    const badResponses = responses.filter((event) => event.params.response.status >= 400)
    info('requests', `state=${stateCalls} content=${contentCalls} message=${messageCalls} apply=${applyCalls} edit=${editCalls} compact=${compactCalls}`)
    check('read-only GET /state was used', stateCalls >= 1, `state=${stateCalls}`)
    check('read-only GET /content was used for the expansion', contentCalls >= 1, `content=${contentCalls}`)
    check('read-only GET /message was used for the editor', messageCalls >= 1, `message=${messageCalls}`)
    check('no POST /dsh-curate/apply was sent', applyCalls === 0, `apply=${applyCalls}`)
    check('no POST /dsh-curate/edit was sent', editCalls === 0, `edit=${editCalls}`)
    check('no POST /dsh-curate/compact was sent', compactCalls === 0, `compact=${compactCalls}`)
    check('every /dsh-curate request was GET', nonGet.length === 0, clip(nonGet.map((event) => `${event.params.request.method} ${safePath(event.params.request.url)}`)))
    check('every /dsh-curate response was successful', badResponses.length === 0, clip(responses.map((event) => `${event.params.response.status} ${safePath(event.params.response.url)}`).filter((text) => !text.startsWith('2'))))

    // --- console and page errors ---------------------------------------------
    group('console and network cleanliness')
    const consoleErrors = events
      .filter((event) => event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error')
      .map((event) => (event.params.args || []).map((arg) => arg.value ?? arg.description ?? '').join(' '))
    const pageErrors = events
      .filter((event) => event.method === 'Runtime.exceptionThrown')
      .map((event) => event.params.exceptionDetails?.exception?.description ?? event.params.exceptionDetails?.text ?? 'page exception')
    const requestPaths = new Map()
    for (const event of events) {
      if (event.method === 'Network.requestWillBeSent') {
        requestPaths.set(event.params.requestId, safePath(event.params.request.url))
      }
    }
    const failedRequests = events
      .filter((event) => event.method === 'Network.loadingFailed' && event.params.canceled !== true && event.params.blockedReason === undefined)
      .map((event) => `${requestPaths.get(event.params.requestId) ?? 'request'} ${event.params.errorText}`)
    check('no page console errors', consoleErrors.length === 0, clip(consoleErrors))
    check('no uncaught page errors', pageErrors.length === 0, clip(pageErrors))
    check('no failed network requests', failedRequests.length === 0, clip(failedRequests))
    info('console errors', consoleErrors.length)
    info('page errors', pageErrors.length)
  } finally {
    try {
      if (drafts !== null) await evaluate(send, draftsRestoreExpression(drafts))
    } catch {}
    try {
      await evaluate(send, `(() => { const panel = document.querySelector('.dshcurate-panel'); if (panel === null) return true; const button = Array.from(panel.querySelectorAll('.dshcurate-icon')).find((candidate) => /close|关闭/i.test(String(candidate.getAttribute('aria-label') || candidate.getAttribute('title') || ''))); if (button !== undefined) button.click(); return true })()`)
    } catch {}
    try {
      socket.close()
    } catch {}
  }

  console.log(`\nSUMMARY: ${passed} passed, ${failures} failed, ${warnings} warning(s)`)
  if (failures > 0) console.log(`VERDICT: FAIL (${failures} check(s) failed) — screenshot: ${resolve(ROOT, SHOT)}`)
  else console.log(`VERDICT: PASS — screenshot: ${resolve(ROOT, SHOT)}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(`VERDICT: FAIL — verify-live crashed: ${error && error.message ? error.message : error}`)
  process.exit(1)
})
