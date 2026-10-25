// dsh-curate - host half.
//
// Seven loopback-only JSON routes:
//
//   GET  /dsh-curate/state?sessionId=<id>
//   GET  /dsh-curate/changes?sessionId=<id>  (feeds the transcript display)
//        and its inline diff view; a draft-only edit never appears here.
//   GET  /dsh-curate/content?sessionId=<id>&startSeq=&endSeq=
//   GET  /dsh-curate/message?sessionId=<id>&seq=<seq>
//   POST /dsh-curate/apply      { sessionId, expectedLastSeq, confirm, ops[], autoSummarize?, textOnly? }
//   POST /dsh-curate/edit       { sessionId, expectedLastSeq, confirm, edits[] }
//   POST /dsh-curate/compact    { sessionId, expectedLastSeq, confirm }
//
// The workflow is deliberately human-first:
//
//   1. the browser half shows the surface as turn-sized cards;
//   2. the human marks each card important (keep verbatim), default
//      (summarize) or minor (drop);
//   3. the human may rewrite any human prompt or assistant reply (text and
//      reasoning blocks) in the same cards; the editor exposes "save edit" at
//      both its top and footer, edits are staged first and then written by
//      /edit, without calling the model;
//   4. "compress" either asks the model to summarize the selected windows at
//      compression time and replaces them with curated user messages, or
//      delegates the whole older history to the official `/compact` command;
//      either way the workbench reloads and shows the compressed surface;
//   5. the final surface node is never compressed and unbalanced tool windows
//      are refused.
//
// Official compaction is mounted per agent preset (a scoped Cordis group), so
// it is reached through the agent-scoped `/compact` command rather than a root
// service lookup. Every write is preceded by a JSON backup on disk and recorded
// in the session log as a plugin record. The raw events stay in the append-only
// log, exactly as official compaction leaves them, but the model-visible
// surface or projection is rewritten.
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import * as sessionApi from '@deepseek-ai/dsh-session'
import { removeBackup, writeBackup } from './backup.js'
import {
  MAX_EDIT_TEXT,
  PATCH_TYPE,
  buildPatchData,
  classifyEditTarget,
  composePromptContent,
  editableBlocks,
  kindOfBlock,
  messagePayloadOf,
  patchProjection,
  patchesOf,
  projectEvent,
} from './edits.js'
import {
  PLAN_LIMITS,
  PLUGIN_ID,
  describeNode,
  dropMarker,
  estimateTokens,
  eventText,
  foldSurface,
  frameSummary,
  isBusy,
  isSurfaceEvent,
  isTextBlock,
  messageIdOf,
  previewNode,
  readMessageBlocks,
  readMessageText,
  roleOf,
  toolCallsOf,
  toolResultCallOf,
  turnIndex,
  turnOfEvent,
  validatePlan,
} from './surface.js'

// The package version is the single source of truth for the host half. The
// browser half gets the same string injected by scripts/build-client.mjs; the
// workbench compares the two and offers a reload banner when they differ.
// Read the file instead of require()-ing it: on a plugin hot reload Node's
// require cache can still hold the pre-upgrade manifest, which made the host
// report a stale version until DSH restarted.
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

/** Keep in sync with package.json and the built lib/client.js. */
export const PLUGIN_VERSION = typeof packageJson.version === 'string' && packageJson.version !== ''
  ? packageJson.version
  : '0.0.0'

/** Cordis plugin name. */
export const name = PLUGIN_ID

const ROUTE_PREFIX = '/dsh-curate'
const SESSION_ID_RE = /^(session-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BODY_BYTES = 4 * 1024 * 1024
const FLUSH_DEADLINE_MS = 5_000
/** Per-node cap when a message is handed to the model. */
const NODE_TEXT_CAP = 12_000
/** Per-node cap for the browser's on-demand full-text view. */
const CONTENT_NODE_CAP = 6_000
/** Hard cap on how many surface nodes one content request may return. */
const CONTENT_MAX_NODES = 400
/** Hard cap on how many message edits one request may carry. */
const MAX_EDITS = 100
/** Hard cap on how many changed messages /changes returns. */
const CHANGE_LIMIT = 200
/** Cap on the full text one /message response may carry. */
const MESSAGE_TEXT_CAP = MAX_EDIT_TEXT
/** How many recent turns the browser keeps out of compression by default. */
const PRESERVE_RECENT_TURNS = 2
/** Upper bound for the wait on one manual official compaction. */
const COMPACT_DEADLINE_MS = 15 * 60 * 1000

const SUMMARY_SYSTEM = [
  '你是上下文整理助手。用户正在手动压缩自己的 AI 对话历史：用户挑选要压缩的范围，你负责把范围写成一份可以替代原文的摘要。',
  '要求：',
  '1. 摘要将直接进入模型上下文，取代原文。必须保留后续任务还需用到的信息：任务目标与用户约束、关键技术决策及理由、文件路径与行号、命令与错误原文、接口签名、已确认的事实、未完成的 TODO。',
  '2. 删除寒暄、重复确认、已失效的猜测和冗余工具输出；工具输出只保留结论与关键行，工具错误只保留错误类型和关键行。',
  '3. 不要编造原文没有的信息，不要写“被压缩”“摘要”之类的元话术。',
  '4. 用原文的主要语言输出 Markdown；用小标题和列表组织，便于阅读。',
  '5. 只输出摘要正文，不要输出解释或前后缀。',
].join('\n')

class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

function requireExpectedLastSeq(body) {
  const value = body && body.expectedLastSeq
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new HttpError(400, 'invalid', 'expectedLastSeq must be a non-negative integer')
  }
  return value
}

/**
 * Append one audit record, translating a cross-module `Session` instance
 * mismatch into a clear 409. A linked/profile plugin can resolve a second copy
 * of `@deepseek-ai/dsh-session`; the official `appendPluginRecord` then fails
 * with a private-field TypeError instead of a usable capability error.
 */
function appendRecordOrThrow(session, type, data) {
  try {
    return sessionApi.appendPluginRecord(session, type, data)
  } catch (error) {
    const message = String((error && error.message) || error)
    if (/instance of class Session|appendPluginRecord is not a function/i.test(message)) {
      throw new HttpError(409, 'unsupported', '宿主加载了多个 Harness 模块副本，无法写入插件记录；请重启 DSH web 后重试。')
    }
    throw new HttpError(500, 'record-failed', `无法写入审计记录：${message}`)
  }
}

// --- session access ----------------------------------------------------------

function idVariants(sessionId) {
  const out = new Set([sessionId])
  if (sessionId.startsWith('session-')) out.add(sessionId.slice('session-'.length))
  else out.add(`session-${sessionId}`)
  return [...out]
}

function findLiveSession(ctx, sessionId) {
  const sessions = ctx.get('sessions')
  if (!sessions || typeof sessions.get !== 'function') return undefined
  for (const variant of idVariants(sessionId)) {
    const found = sessions.get(variant)
    if (found) return found
  }
  return undefined
}

async function resolveSession(ctx, sessionId) {
  const live = findLiveSession(ctx, sessionId)
  if (live) return live
  // NOTE: writes deliberately do not resume a cold session (see applyCuration /
  // applyEdits): resuming would spawn an agent as a side effect of a stale tab.
  return undefined
}

/**
 * Read the committed events of a live session.
 *
 * `Session.snapshotEvents()` is marked deprecated in DSH 0.2.1-rc.2 ("new calls
 * are prohibited") in favour of the session-query/surface services. It is still
 * the only synchronous read of the exact live log, so the host keeps using it
 * behind this single helper; migrating the plugin to the allowed seam is tracked
 * as a future compatibility task.
 */
function snapshotEvents(session) {
  if (session && typeof session.snapshotEvents === 'function') {
    try {
      const events = session.snapshotEvents()
      if (Array.isArray(events)) return events
    } catch {
      // fall through to the query service
    }
  }
  return undefined
}

/**
 * Read a cold (not currently live) session through the query service.
 *
 * The snapshot keeps the session header, so a cold workbench can still show the
 * real working directory and the edit/summary previews can resolve relative
 * image paths. Callers that only need the log use `readEvents`.
 */
async function readSessionSnapshot(ctx, sessionId) {
  const query = ctx.get('sessionQuery')
  if (query && typeof query.readSession === 'function') {
    try {
      const snapshot = await query.readSession(sessionId)
      if (snapshot && Array.isArray(snapshot.events)) {
        const header = snapshot.session && typeof snapshot.session === 'object' ? snapshot.session : {}
        return { events: snapshot.events, cwd: typeof header.cwd === 'string' ? header.cwd : null }
      }
    } catch {
      // fall through to the live snapshot (if any)
    }
  }
  const live = findLiveSession(ctx, sessionId)
  const events = snapshotEvents(live)
  if (!events) return undefined
  return { events, cwd: live && live.header && typeof live.header.cwd === 'string' ? live.header.cwd : null }
}

async function readEvents(ctx, sessionId) {
  const snapshot = await readSessionSnapshot(ctx, sessionId)
  return snapshot ? snapshot.events : null
}

// Live-first for writes: a query snapshot may lag the live log by one append.
async function eventsForWrite(ctx, sessionId, live) {
  return snapshotEvents(live) ?? (await readEvents(ctx, sessionId))
}

async function flushSession(ctx, session) {
  const errors = []
  const timedOut = Symbol('flush-timeout')
  const run = async (label, call) => {
    const outcome = await Promise.race([
      call(),
      new Promise((resolve) => setTimeout(() => resolve(timedOut), FLUSH_DEADLINE_MS)),
    ])
    if (outcome === timedOut) {
      errors.push(`${label} timed out`)
      return false
    }
    // `sessions.flush` resolves false when no flush handler is mounted: the
    // append was still observed eagerly, but durability is not confirmed.
    if (outcome === false) {
      errors.push(`${label} reported no flush handler`)
      return false
    }
    return true
  }
  const sessions = ctx.get('sessions')
  if (sessions && typeof sessions.flush === 'function') {
    try {
      if (await run('sessions.flush', () => sessions.flush(session))) return { flushed: true }
    } catch (error) {
      errors.push(String((error && error.message) || error))
    }
  } else {
    errors.push('sessions.flush unavailable')
  }
  const persistence = ctx.get('sessionPersistence')
  if (persistence && typeof persistence.flush === 'function') {
    try {
      if (await run('sessionPersistence.flush', () => persistence.flush())) return { flushed: true }
    } catch (error) {
      errors.push(String((error && error.message) || error))
    }
  } else {
    errors.push('sessionPersistence.flush unavailable')
  }
  return { flushed: false, flushError: errors.join(' | ') }
}

// --- model-visible state -----------------------------------------------------

function measuredTokens(ctx, live, events) {
  const tokens = new Map()
  if (live) {
    try {
      const meter = ctx.get('tokenMeter')
      if (meter && typeof meter.measure === 'function') {
        const measurement = meter.measure(live)
        for (const node of measurement && Array.isArray(measurement.nodes) ? measurement.nodes : []) {
          if (node && Number.isFinite(node.seq) && Number.isFinite(node.tokens)) tokens.set(node.seq, node.tokens)
        }
      }
    } catch {
      // estimation is a perfectly good fallback
    }
  }
  for (const event of events) {
    if (isSurfaceEvent(event) && !tokens.has(event.seq)) tokens.set(event.seq, estimateTokens(event))
  }
  return tokens
}

/**
 * Official compaction is mounted by the agent preset inside a scoped Cordis
 * group (`isolate: { compaction: true }`), so the root context cannot see the
 * `compaction` service. The preset does expose the agent-scoped `/compact`
 * command, which is the supported route into that same service.
 */
function compactionCommandOf(ctx, agent) {
  if (!agent) return null
  try {
    const commands = ctx.get('commands')
    if (!commands || typeof commands.find !== 'function' || typeof commands.execute !== 'function') return null
    return commands.find(agent, 'compact') || null
  } catch {
    return null
  }
}

/** What this deployment can do right now, probed per request. */
async function capabilitiesOf(ctx, sessionId, patchSupported, live) {
  let compaction = false
  if (live) {
    const agent = await resolveAgentFor(ctx, sessionId)
    compaction = compactionCommandOf(ctx, agent) !== null
  }
  return {
    edit: true,
    patch: patchSupported === true,
    compaction,
  }
}

/**
 * One effective node description: the landed reply patches are overlaid before
 * the text is described, so /state, /content and /message all show what the
 * model actually reads.
 */
function describeEffective(event, tokens, turns, patches, patchSupported) {
  const effective = projectEvent(event, patches)
  const described = describeNode(effective, tokens, turnOfEvent(turns, effective))
  const target = classifyEditTarget(effective)
  // Reply/tool/context edits need the plugin-record + projection seam. Without
  // it the browser must not offer an edit that the host will refuse.
  const patchBlocked = target.mode !== null && target.mode !== 'prompt' && patchSupported !== true
  return {
    ...described,
    editable: target.mode !== null && target.reason === '' && !patchBlocked,
    editKind: target.mode,
    editReason: patchBlocked ? 'patch-unavailable' : target.reason,
    patched: effective !== event,
  }
}

async function stateOf(ctx, sessionId, patchSupported) {
  const live = findLiveSession(ctx, sessionId)
  let snapshot
  if (live) {
    const liveEvents = snapshotEvents(live)
    if (liveEvents) {
      snapshot = { events: liveEvents, cwd: live.header && typeof live.header.cwd === 'string' ? live.header.cwd : null }
    }
  }
  if (snapshot === undefined) snapshot = await readSessionSnapshot(ctx, sessionId)
  const events = snapshot && snapshot.events
  if (!events) throw new HttpError(404, 'session-not-found', 'no session log for this id')
  const folded = foldSurface(events)
  const bySeq = new Map(events.map((event) => [event.seq, event]))
  const tokens = measuredTokens(ctx, live, events)
  const turns = turnIndex(events)
  const patches = patchesOf(events)
  // Very long sessions would otherwise ship megabytes of previews. The
  // workbench keeps working; the full text stays available through /content.
  const previewChars = folded.nodes.length > 800 ? 240 : 600
  const nodes = []
  for (const seq of folded.nodes) {
    const event = bySeq.get(seq)
    if (!event) continue
    nodes.push(previewNode(describeEffective(event, tokens.get(seq) ?? 0, turns, patches, patchSupported), previewChars))
  }
  const cwd = snapshot && typeof snapshot.cwd === 'string' ? snapshot.cwd : null
  return {
    version: PLUGIN_VERSION,
    sessionId,
    cwd,
    live: Boolean(live),
    busy: isBusy(events),
    lastSeq: events.length > 0 ? events[events.length - 1].seq : -1,
    nodes,
    totalTokens: nodes.reduce((sum, node) => sum + node.tokens, 0),
    surfaceTokens: nodes.filter((node) => node.role !== 'system').reduce((sum, node) => sum + node.tokens, 0),
    preserveRecentTurns: PRESERVE_RECENT_TURNS,
    limits: PLAN_LIMITS,
    capabilities: await capabilitiesOf(ctx, sessionId, patchSupported, live),
    config: {},
  }
}

/**
 * Full-ish text for one surface window, fetched on demand by the browser. The
 * turn cards only need short previews for triage; when the human wants to read
 * a block in detail this route returns every node with a generous per-node cap.
 */
async function contentOf(ctx, sessionId, startSeq, endSeq, patchSupported) {
  const live = findLiveSession(ctx, sessionId)
  const events = snapshotEvents(live) ?? (await readEvents(ctx, sessionId))
  if (!events) throw new HttpError(404, 'session-not-found', 'no session log for this id')
  const folded = foldSurface(events)
  const startIndex = folded.nodes.indexOf(startSeq)
  const endIndex = folded.nodes.indexOf(endSeq)
  if (startIndex < 0) throw new HttpError(422, 'invalid-range', `start seq ${startSeq} is not on the surface`)
  if (endIndex < 0) throw new HttpError(422, 'invalid-range', `end seq ${endSeq} is not on the surface`)
  if (startIndex > endIndex) throw new HttpError(422, 'invalid-range', 'start seq is after end seq')
  if (endIndex - startIndex + 1 > CONTENT_MAX_NODES) {
    throw new HttpError(422, 'too-large', `a content window may contain at most ${CONTENT_MAX_NODES} messages`)
  }
  const bySeq = new Map(events.map((event) => [event.seq, event]))
  const tokens = measuredTokens(ctx, live, events)
  const turns = turnIndex(events)
  const patches = patchesOf(events)
  const nodes = []
  for (let index = startIndex; index <= endIndex; index += 1) {
    const seq = folded.nodes[index]
    const event = bySeq.get(seq)
    if (!event) continue
    const described = describeEffective(event, tokens.get(seq) ?? 0, turns, patches, patchSupported)
    const truncated = described.text.length > CONTENT_NODE_CAP
    nodes.push({
      ...described,
      text: truncated ? `${described.text.slice(0, CONTENT_NODE_CAP)}\n…` : described.text,
      truncated,
    })
  }
  return {
    version: PLUGIN_VERSION,
    sessionId,
    startSeq,
    endSeq,
    live: Boolean(live),
    lastSeq: events.length > 0 ? events[events.length - 1].seq : -1,
    nodes,
  }
}

/**
 * Read-only view of every visible message change in one session: prompt
 * replacements (surface events) and reply/tool/context patches (plugin
 * records). The browser decorates the real Chat rows with this list and opens
 * the exact original / applied text, so the workbench and the transcript never
 * disagree about what is actually in the model context.
 *
 * Prompt edits are chained: editing the same prompt twice replaces the first
 * carrier again. The returned `seq` is always the original message seq that
 * owns the Chat row; `replacementSeq` names the latest carrier.
 */
async function changesOf(ctx, sessionId, patchSupported) {
  const live = findLiveSession(ctx, sessionId)
  const events = snapshotEvents(live) ?? (await readEvents(ctx, sessionId))
  if (!events) throw new HttpError(404, 'session-not-found', 'no session log for this id')
  const bySeq = new Map(events.map((event) => [event.seq, event]))
  const changes = []
  const seen = new Set()

  const capText = (value) => {
    const text = typeof value === 'string' ? value : ''
    const truncated = text.length > MAX_EDIT_TEXT
    return { text: truncated ? text.slice(0, MAX_EDIT_TEXT) : text, truncated }
  }

  // Prompt replacement carriers carry `source.editedBy`; the surface op points
  // at the previous prompt, which may itself be one of our carriers.
  const promptRoots = new Map()
  for (const event of events) {
    const op = event && event.surfaceOp
    const source = event && event.data && event.data.source
    if (!event || event.type !== 'user/message' || !op || op.op !== 'replace') continue
    if (!source || source.editedBy !== PLUGIN_ID) continue
    let root = op.startSeq
    let cursor = bySeq.get(root)
    const visited = new Set()
    while (
      cursor &&
      cursor.type === 'user/message' &&
      cursor.surfaceOp &&
      cursor.surfaceOp.op === 'replace' &&
      cursor.data &&
      cursor.data.source &&
      cursor.data.source.editedBy === PLUGIN_ID &&
      !visited.has(root)
    ) {
      visited.add(root)
      root = cursor.surfaceOp.startSeq
      cursor = bySeq.get(root)
    }
    promptRoots.set(event.seq, root)
  }
  const latestPrompt = new Map()
  for (const [replacementSeq, rootSeq] of promptRoots) {
    const previous = latestPrompt.get(rootSeq)
    if (!previous || replacementSeq > previous) latestPrompt.set(rootSeq, replacementSeq)
  }
  for (const [rootSeq, replacementSeq] of latestPrompt) {
    const rootEvent = bySeq.get(rootSeq)
    const replacement = bySeq.get(replacementSeq)
    if (!rootEvent || !replacement) continue
    const original = readMessageText(rootEvent)
    const applied = readMessageText(replacement)
    if (original.text === '' && applied.text === '') continue
    const originalPart = capText(original.text)
    const appliedPart = capText(applied.text)
    if (seen.has(rootSeq)) continue
    seen.add(rootSeq)
    changes.push({
      seq: rootSeq,
      replacementSeq,
      messageId: messageIdOf(rootEvent),
      role: 'user',
      kind: 'prompt',
      blocks: [{
        blockIndex: 0,
        blockKind: 'text',
        original: originalPart.text,
        applied: appliedPart.text,
        truncated: originalPart.truncated || appliedPart.truncated,
      }],
    })
  }

  if (patchSupported) {
    const patches = patchesOf(events)
    for (const [seq, byBlock] of patches) {
      if (seen.has(seq)) continue
      const event = bySeq.get(seq)
      if (!event) continue
      const blocks = []
      for (const [blockIndex, patch] of byBlock) {
        if (blockIndex === undefined) {
          // Append mode repairs a reply that stopped before visible text.
          const original = readMessageText(event)
          const appliedText = original.text === '' ? patch.text : `${original.text}\n${patch.text}`
          const originalPart = capText(original.text)
          const appliedPart = capText(appliedText)
          blocks.push({
            blockIndex: -1,
            blockKind: 'text',
            append: true,
            original: originalPart.text,
            applied: appliedPart.text,
            truncated: originalPart.truncated || appliedPart.truncated,
          })
          continue
        }
        const rawBlock = readMessageBlocks(event)[blockIndex]
        const blockKind = kindOfBlock(rawBlock)
        if (blockKind === null) continue
        const originalPart = capText(rawBlock.text)
        const appliedPart = capText(patch.text)
        blocks.push({
          blockIndex,
          blockKind,
          original: originalPart.text,
          applied: appliedPart.text,
          truncated: originalPart.truncated || appliedPart.truncated,
        })
      }
      if (blocks.length === 0) continue
      const role = roleOf(event)
      changes.push({
        seq,
        messageId: messageIdOf(event),
        role,
        kind: role === 'assistant' ? 'reply' : role,
        blocks,
      })
    }
  }

  changes.sort((left, right) => left.seq - right.seq)
  const overflow = changes.length > CHANGE_LIMIT
  return {
    version: PLUGIN_VERSION,
    sessionId,
    live: Boolean(live),
    lastSeq: events.length > 0 ? events[events.length - 1].seq : -1,
    changes: overflow ? changes.slice(0, CHANGE_LIMIT) : changes,
    truncated: overflow,
  }
}

/**
 * Everything the editor needs for one message: its complete effective text, the
 * content blocks (so the browser can pick a text or reasoning block), and the
 * editability verdict. Kept separate from /content because the full text must
 * not be truncated and must not ride along with every card refresh.
 */
async function messageOf(ctx, sessionId, seq, patchSupported) {
  const live = findLiveSession(ctx, sessionId)
  const events = snapshotEvents(live) ?? (await readEvents(ctx, sessionId))
  if (!events) throw new HttpError(404, 'session-not-found', 'no session log for this id')
  const folded = foldSurface(events)
  const index = folded.nodes.indexOf(seq)
  if (index < 0) throw new HttpError(422, 'invalid-range', `seq ${seq} is not on the surface`)
  const bySeq = new Map(events.map((event) => [event.seq, event]))
  const event = bySeq.get(seq)
  if (!event) throw new HttpError(422, 'invalid-range', `seq ${seq} has no event`)
  const tokens = measuredTokens(ctx, live, events)
  const turns = turnIndex(events)
  const patches = patchesOf(events)
  const effective = projectEvent(event, patches)
  const described = describeNode(effective, tokens.get(seq) ?? 0, turnOfEvent(turns, effective))
  const target = classifyEditTarget(effective)
  const patchUnavailable = target.mode !== null && target.mode !== 'prompt' && patchSupported !== true
  const content = readMessageBlocks(effective)
  const blocks = content.map((block, blockIndex) => {
    if (!block || typeof block !== 'object') {
      return { index: blockIndex, type: 'unknown', label: 'unknown' }
    }
    const kind = kindOfBlock(block)
    if (kind !== null) {
      return { index: blockIndex, type: block.type, kind, text: block.text }
    }
    if (block.type === 'tool-call') {
      return { index: blockIndex, type: 'tool-call', label: typeof block.name === 'string' ? block.name : 'tool-call' }
    }
    if (block.type === 'image') {
      return { index: blockIndex, type: 'image', label: typeof block.fileName === 'string' ? block.fileName : 'image' }
    }
    if (block.type === 'file') {
      const label = typeof block.fileName === 'string' ? block.fileName : typeof block.name === 'string' ? block.name : 'file'
      return { index: blockIndex, type: 'file', label }
    }
    return { index: blockIndex, type: typeof block.type === 'string' ? block.type : 'block', label: 'block' }
  })
  const editableBlocks = blocks
    .filter((block) => block.kind === 'text' || (block.kind === 'reasoning' && target.mode === 'reply'))
    .map((block) => ({ index: block.index, kind: block.kind, text: block.text }))
  const textBlockCount = blocks.filter((block) => block.kind === 'text').length
  // Compute the cap result before the append verdict: `canAppendText` reads
  // `truncated`, and evaluating it before the declaration used to trigger a
  // temporal-dead-zone ReferenceError on every /message request.
  const text = described.text
  const truncated = text.length > MESSAGE_TEXT_CAP
  const shownText = truncated ? `${text.slice(0, MESSAGE_TEXT_CAP)}\n…` : text
  // A reply that was stopped before producing visible text has a reasoning
  // block but no text block. The editor may then append a text block (a
  // projection that makes the model see the repaired answer) instead of only
  // being able to rewrite the reasoning.
  const canAppendText = target.mode === 'reply'
    && target.reason === ''
    && !truncated
    && !patchUnavailable
    && textBlockCount === 0
    && editableBlocks.length > 0
  const editable = target.mode !== null && target.reason === '' && !truncated && !patchUnavailable
  const editReason = truncated
    ? 'too-long'
    : patchUnavailable
      ? 'patch-unavailable'
      : target.reason !== ''
        ? target.reason
        : target.mode === 'reply' && editableBlocks.length === 0
          ? 'no-editable-block'
          : ''
  return {
    version: PLUGIN_VERSION,
    sessionId,
    seq,
    turn: described.turn,
    messageId: described.messageId,
    role: described.role,
    type: described.type,
    tokens: described.tokens,
    text: shownText,
    promptText: truncated ? '' : readMessageText(effective).text,
    blocks,
    editableBlocks,
    canAppendText,
    editable,
    editKind: target.mode,
    editReason,
    attachments: described.attachments,
    patched: effective !== event,
    truncated,
    lastSeq: events.length > 0 ? events[events.length - 1].seq : -1,
  }
}

// --- summarization -----------------------------------------------------------

function clampText(text, cap) {
  if (typeof text !== 'string') return ''
  if (text.length <= cap) return text
  const half = Math.floor((cap - 40) / 2)
  return `${text.slice(0, half)}\n\n[... 已截断 ${text.length - half * 2} 字符 ...]\n\n${text.slice(-half)}`
}

function nodeHeading(event, turn) {
  const role = roleOf(event)
  const labels = { user: '用户', assistant: '助手', tool: '工具结果', context: '注入上下文', system: '系统' }
  return `### [seq ${event.seq}] ${labels[role] || role}${typeof turn === 'number' ? ` · 第 ${turn} 轮` : ''}`
}

function sourceTextFor(events, bySeq, turns, shadowed, patches, textOnly) {
  const parts = []
  for (const seq of shadowed) {
    const event = bySeq.get(seq)
    if (!event) continue
    const effective = projectEvent(event, patches)
    const heading = nodeHeading(effective, turnOfEvent(turns, effective))
    if (textOnly === true) {
      // Conversation-only summaries: user prompts and assistant text blocks,
      // without tool results, injected context, reasoning or tool calls.
      const role = roleOf(effective)
      if (role !== 'user' && role !== 'assistant') continue
      const text = readMessageBlocks(effective)
        .filter((block) => isTextBlock(block))
        .map((block) => block.text)
        .join('\n')
      if (text.trim() === '') continue
      parts.push(`${heading}\n${clampText(text, NODE_TEXT_CAP)}`)
      continue
    }
    const body = clampText(eventText(effective), NODE_TEXT_CAP)
    parts.push(`${heading}\n${body}`)
  }
  return parts.join('\n\n')
}

function chunkSource(source, size) {
  if (source.length <= size) return [source]
  const blocks = source.split('\n\n')
  const chunks = []
  let current = ''
  for (const block of blocks) {
    if (current !== '' && current.length + block.length + 2 > size) {
      chunks.push(current)
      current = ''
    }
    if (block.length > size) {
      // A single oversized message: cut it, keeping both ends.
      const head = block.slice(0, Math.floor(size * 0.6))
      const tail = block.slice(-Math.floor(size * 0.3))
      if (current !== '') chunks.push(current)
      chunks.push(`${head}\n\n[... 中间省略 ...]\n\n${tail}`)
      current = ''
      continue
    }
    current = current === '' ? block : `${current}\n\n${block}`
  }
  if (current !== '') chunks.push(current)
  return chunks
}

function toneInstruction(tone) {
  if (tone === 'minor') {
    return '用户把这个范围标记为“次要”：只保留后续仍可能需要的事实、决定和错误，目标长度约为原文的 5%，宁短勿长。'
  }
  return '用户把这个范围标记为“默认”：按常规压缩力度保留后续任务需要的关键细节，目标长度约为原文的 12%，可以压缩工具输出与重复叙述。'
}

async function resolveRoute(ctx, config, live) {
  const llm = ctx.get('llm')
  if (!llm || typeof llm.stream !== 'function') throw new HttpError(503, 'llm-unavailable', '当前部署没有可用的模型服务。')
  if (typeof config.provider === 'string' && config.provider !== '' && typeof config.model === 'string' && config.model !== '') {
    return { llm, provider: config.provider, model: config.model }
  }
  // Prefer the route this session already uses, exactly like compaction does:
  // it keeps the summarizer on the same provider and model as the conversation.
  try {
    const header = live && typeof live.requestHeader === 'function' ? live.requestHeader() : null
    const route = header && header.config && typeof header.config.provider === 'string' && typeof header.config.model === 'string'
      ? header.config
      : null
    if (route !== null && route.provider !== '' && route.model !== '') return { llm, provider: route.provider, model: route.model }
  } catch {
    // fall through to provider discovery
  }
  let providers = []
  try {
    providers = typeof llm.listProviders === 'function' ? llm.listProviders() : []
  } catch {
    providers = []
  }
  for (const provider of Array.isArray(providers) ? providers : []) {
    const id = provider && typeof provider.id === 'string' ? provider.id : ''
    if (id === '') continue
    try {
      const models = typeof llm.listModels === 'function' ? await llm.listModels(id) : []
      const first = Array.isArray(models) ? models.find((model) => model && typeof model.id === 'string' && model.id !== '') : undefined
      if (first) return { llm, provider: id, model: first.id }
    } catch {
      // try the next provider
    }
  }
  throw new HttpError(503, 'llm-unavailable', '没有找到可用于生成摘要的模型路由。')
}

async function streamSummary(route, prompt, maxTokens, sessionId) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 180_000)
  let text = ''
  try {
    const stream = route.llm.stream({
      provider: route.provider,
      model: route.model,
      system: SUMMARY_SYSTEM,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      maxTokens,
      sessionId,
      signal: controller.signal,
    })
    let finish = null
    for await (const chunk of stream) {
      if (!chunk || typeof chunk !== 'object') continue
      // StreamChunk uses `type`; text deltas carry `text`; the terminal finish
      // chunk carries `reason` ({kind: 'stop' | 'max-tokens' | 'aborted' | 'error', ...}).
      if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
      else if (chunk.type === 'finish') finish = chunk.reason && typeof chunk.reason === 'object' ? chunk.reason : { kind: 'stop' }
    }
    if (finish !== null && (finish.kind === 'error' || finish.kind === 'aborted')) {
      const failure = finish.failure || {}
      throw new HttpError(502, 'llm-failed', `摘要生成失败：${String(failure.message || failure.code || finish.kind)}`)
    }
    if (finish !== null && finish.kind === 'max-tokens') {
      throw new HttpError(502, 'llm-truncated', '摘要在 token 上限处被截断，请让该段更短或重试。')
    }
  } finally {
    clearTimeout(timer)
  }
  const trimmed = text.trim()
  if (trimmed === '') throw new HttpError(502, 'llm-empty', '模型没有返回摘要内容，请重试。')
  return trimmed
}

/**
 * Write one replacement summary for an already-validated range. This runs at
 * compression time: the human decided which ranges stop being sent verbatim,
 * and the model only writes their replacement text (no draft/review round).
 */
async function summarizeOperation(ctx, config, live, events, op, options = {}) {
  const tone = op.tone === 'minor' ? 'minor' : 'normal'
  const bySeq = new Map(events.map((event) => [event.seq, event]))
  const turns = turnIndex(events)
  // The model-visible text is what a summary has to describe: reply edits are a
  // projection, so the raw event alone would summarize wording the model no
  // longer reads.
  const textOnly = options.textOnly === true
  const source = sourceTextFor(events, bySeq, turns, op.shadowed, patchesOf(events), textOnly)
  if (source.trim() === '') {
    throw new HttpError(400, 'empty-range', textOnly ? '这个范围没有用户/助手的对话文本可摘要。' : '这个范围没有可摘要的文字。')
  }
  const route = await resolveRoute(ctx, config, live)
  const chunks = chunkSource(source, PLAN_LIMITS.summarizeChunkChars)
  const targetMax = tone === 'minor' ? 900 : 1_600
  const requestSessionId = live && typeof live.id === 'string' && live.id !== '' ? live.id : PLUGIN_ID
  const partials = []
  for (let index = 0; index < chunks.length; index += 1) {
    const partNote = chunks.length > 1 ? `\n\n这是第 ${index + 1}/${chunks.length} 段原文，只为这一段写摘要；不要重复其他段的内容。` : ''
    const prompt = [
      toneInstruction(tone),
      textOnly ? '本次只总结用户与助手的对话文本；不要臆测工具输出或注入上下文。' : '',
      `目标长度：不超过约 ${Math.max(120, Math.round(targetMax / Math.max(1, chunks.length)))} tokens。${partNote}`,
      '',
      '原文开始',
      chunks[index],
      '原文结束',
    ].filter((line) => line !== '').join('\n')
    partials.push(await streamSummary(route, prompt, targetMax, requestSessionId))
  }
  return partials.join('\n\n')
}

// --- apply -------------------------------------------------------------------

async function applyCuration(ctx, config, sessionId, body) {
  // Writes require the session to be open in this process. Never resume a cold
  // session just because a stale browser tab still holds its id: that would
  // spawn a hidden agent as a side effect.
  const live = findLiveSession(ctx, sessionId)
  if (!live || typeof live.append !== 'function') {
    throw new HttpError(409, 'session-not-active', '这条会话当前没有打开，无法写入。')
  }
  const events = await eventsForWrite(ctx, sessionId, live)
  if (!events) throw new HttpError(404, 'session-not-found', 'no session log for this id')
  if (isBusy(events)) throw new HttpError(409, 'busy', '这条会话还在工作，等它停下来再整理。')
  if (body.confirm !== true) throw new HttpError(400, 'confirm-required', '请先阅读并确认不可撤销提示。')
  const requested = Array.isArray(body.ops) ? body.ops : []
  const autoSummarize = body.autoSummarize === true
  const lastSeq = events.length > 0 ? events[events.length - 1].seq : -1
  // Staleness is checked before plan validation: a client that lost the race
  // must see 409 stale, not a misleading range error for the old surface.
  if (requireExpectedLastSeq(body) !== lastSeq) {
    throw new HttpError(409, 'stale', '打开工作台后会话又有了新消息，请刷新后再应用。')
  }
  const check = validatePlan(events, requested, { allowEmptySummary: autoSummarize })
  if (!check.ok) throw new HttpError(check.code === 'stale' ? 409 : 400, check.code, check.error)
  if (autoSummarize) {
    // The workbench no longer drafts per-block summaries. The model writes each
    // replacement just before the plan is committed, so a slow summary can
    // still race a new user message; re-check the surface head before writing.
    for (const op of check.ops) {
      if (op.kind !== 'summary') continue
      op.text = await summarizeOperation(ctx, config, live, events, op, { textOnly: body.textOnly === true })
      if (op.text.length > PLAN_LIMITS.maxSummaryChars) {
        throw new HttpError(400, 'summary-too-long', '摘要太长了，请缩小压缩范围或标记为次要后重试。')
      }
    }
    const latest = snapshotEvents(live) ?? (await readEvents(ctx, sessionId))
    const latestSeq = latest && latest.length > 0 ? latest[latest.length - 1].seq : -1
    if (latestSeq !== lastSeq) {
      throw new HttpError(409, 'stale', '压缩期间会话又有了新消息，已取消写入；请刷新后重试。')
    }
  }
  const bySeq = new Map(events.map((event) => [event.seq, event]))
  const turns = turnIndex(events)
  const tokens = measuredTokens(ctx, live, events)
  const patches = patchesOf(events)
  for (const op of check.ops) {
    op.shadowedEvents = op.shadowed.map((seq) => bySeq.get(seq))
    op.nodeRecords = op.shadowedEvents.map((event) => {
      const effective = projectEvent(event, patches)
      return describeNode(effective, tokens.get(event.seq) ?? 0, turnOfEvent(turns, effective))
    })
  }
  if (typeof sessionApi.appendPluginRecord !== 'function') {
    throw new HttpError(409, 'unsupported', '当前 Harness 版本不支持插件记录，无法安全地写入整理计划。')
  }

  const planId = randomUUID()
  const createdAt = new Date().toISOString()
  const label = typeof body.label === 'string' ? clampText(body.label.trim(), 200) : ''
  let backupFile
  try {
    backupFile = await writeBackup(sessionId, {
      version: 1,
      kind: 'dsh-curate-apply',
      planId,
      createdAt,
      sessionId,
      label,
      surfaceBefore: foldSurface(events).nodes,
      lastSeq,
      ops: check.ops.map((op) => ({
        kind: op.kind,
        startSeq: op.startSeq,
        endSeq: op.endSeq,
        shadowed: op.shadowed,
        summary: op.text,
        events: op.shadowedEvents,
      })),
    })
  } catch (error) {
    throw new HttpError(500, 'backup-failed', `无法写入备份，已取消：${String((error && error.message) || error)}`)
  }

  const planRecordSeq = appendRecordOrThrow(live, `plugin:${PLUGIN_ID}/plan`, {
    version: 1,
    planId,
    createdAt,
    expectedLastSeq: lastSeq,
    label,
    ops: check.ops.map((op) => ({ kind: op.kind, startSeq: op.startSeq, endSeq: op.endSeq, text: op.text })),
  })

  const applied = []
  try {
    for (const op of check.ops) {
      const text = op.kind === 'drop' ? op.text.trim() === '' ? dropMarker(op) : op.text.trim() : frameSummary(op, op.nodeRecords, label)
      const carrier = {
        type: 'user/message',
        data: {
          id: randomUUID(),
          role: 'user',
          content: [{ type: 'text', text }],
          source: { kind: `plugin:${PLUGIN_ID}`, plugin: PLUGIN_ID },
        },
      }
      const event = live.append(carrier.type, carrier.data, {
        surfaceOp: { op: 'replace', startSeq: op.startSeq, endSeq: op.endSeq },
        sourceEventSeqs: [planRecordSeq, ...op.shadowed],
      })
      applied.push({
        kind: op.kind,
        startSeq: op.startSeq,
        endSeq: op.endSeq,
        replacementSeq: event.seq,
        shadowed: op.shadowed,
      })
    }
    const flush = await flushSession(ctx, live)
    let appliedRecordSeq = null
    try {
      appliedRecordSeq = sessionApi.appendPluginRecord(live, `plugin:${PLUGIN_ID}/applied`, {
        version: 1,
        planId,
        planRecordSeq,
        backupFile,
        applied,
      })
    } catch {
      // The surface is already committed; a missing audit record must not fail the apply.
    }
    return {
      ok: true,
      planId,
      planRecordSeq,
      appliedRecordSeq,
      applied,
      backupFile,
      flushed: flush.flushed,
      flushError: flush.flushError || null,
    }
  } catch (error) {
    return {
      __partial: {
        ok: false,
        code: 'apply-failed',
        error: String((error && error.message) || error),
        planId,
        planRecordSeq,
        backupFile,
        applied,
        remaining: check.ops.slice(applied.length).map((op) => ({ kind: op.kind, startSeq: op.startSeq, endSeq: op.endSeq })),
      },
    }
  }
}

// --- message edits -----------------------------------------------------------
//
// A staged edit is written in one of two ways, never by replaying a turn:
//
//   prompt  -> a `user/message` replacement carrier. The replacement stands in
//              the old prompt's position, so the model reads the revised wording
//              and the platform does NOT answer it (append would).
//   reply   -> one log-only plugin record interpreted by `patchProjection()`.
//              The surface does not move, so no turn number changes and nothing
//              after the edited reply is touched.
//
// Both are preceded by a JSON backup and one audit record. An unchanged save
// writes nothing at all.

/** Human-readable reason for an uneditable target. */
function editReasonText(reason) {
  const labels = {
    system: '系统提示不可编辑。',
    'tool-result': '这条工具结果没有可编辑的文本块。',
    context: '这条上下文消息没有可编辑的文本块。',
    'no-editable-block': '这条消息没有可编辑的文本块。',
    'too-long': '这条消息太长，无法在工作台里安全地编辑。',
    'patch-unavailable': '当前宿主没有消息投影能力，无法就地修改这条消息。',
    'not-editable': '这条消息不可编辑。',
  }
  return labels[reason] || labels['not-editable']
}

/**
 * Turn the browser's staged edits into validated operations against the current
 * log. Every endpoint must still be on the surface; every target is classified
 * again here, so a stale or hand-crafted request cannot edit a tool result.
 */
function planEdits(events, requested, patches) {
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new HttpError(400, 'invalid', '请先暂存至少一处修改。')
  }
  if (requested.length > MAX_EDITS) {
    throw new HttpError(400, 'too-many-edits', `一次最多应用 ${MAX_EDITS} 处修改。`)
  }
  const folded = foldSurface(events)
  const positions = new Map(folded.nodes.map((seq, index) => [seq, index]))
  const bySeq = new Map(events.map((event) => [event.seq, event]))
  const seen = new Set()
  const ops = []
  for (const raw of requested) {
    if (!raw || typeof raw !== 'object') {
      throw new HttpError(400, 'invalid', '修改计划里有无法识别的项目。')
    }
    const seq = Number(raw.seq)
    if (!Number.isSafeInteger(seq)) {
      throw new HttpError(400, 'invalid', '修改目标缺少有效的消息序号。')
    }
    const event = bySeq.get(seq)
    if (!event || !positions.has(seq)) {
      throw new HttpError(409, 'stale', '会话已经发生变化，请刷新后重新暂存修改。')
    }
    const target = classifyEditTarget(event)
    if (target.mode === null) {
      throw new HttpError(400, 'not-editable', editReasonText(target.reason))
    }
    const mode = raw.mode === 'prompt' || raw.mode === 'reply' || raw.mode === 'tool' || raw.mode === 'context'
      ? raw.mode
      : null
    if (mode !== target.mode) {
      throw new HttpError(400, 'not-editable', '修改目标与当前消息类型不匹配，请刷新后重试。')
    }
    const text = typeof raw.text === 'string' ? raw.text : ''
    if (text.trim() === '') {
      throw new HttpError(400, 'empty-edit', '修改后的内容不能为空。')
    }
    if (text.length > MAX_EDIT_TEXT) {
      throw new HttpError(400, 'edit-too-long', '修改后的内容太长了。')
    }
    const messageId = messageIdOf(event) || null
    if (mode === 'prompt') {
      const key = `prompt:${seq}`
      if (seen.has(key)) throw new HttpError(400, 'duplicate-edit', '同一条消息被修改了两次。')
      seen.add(key)
      const original = readMessageText(event).text
      ops.push({
        mode,
        seq,
        messageId,
        text,
        original,
        blocks: readMessageBlocks(event),
        unchanged: text === original,
      })
      continue
    }
    const effective = projectEvent(event, patches)
    if (raw.append === true) {
      // Append repair for a reply stopped after reasoning: add the missing
      // text block. Only allowed on replies that have no text block yet.
      if (mode !== 'reply') throw new HttpError(400, 'invalid', '只有助手回复可以补充正文。')
      const existing = editableBlocks(messagePayloadOf(effective))
      if (existing.some((block) => block.kind === 'text')) {
        throw new HttpError(400, 'not-editable', '这条消息已经有正文，不能再用“补充正文”。')
      }
      const key = `reply:${seq}:append`
      if (seen.has(key)) throw new HttpError(400, 'duplicate-edit', '同一条消息被补充了两次。')
      seen.add(key)
      ops.push({
        mode: 'reply',
        seq,
        messageId,
        text,
        original: '',
        blockIndex: null,
        blockKind: 'text',
        append: true,
        unchanged: false,
      })
      continue
    }
    const blocks = editableBlocks(messagePayloadOf(effective)).filter((block) => (
      block.kind === 'text' || (mode === 'reply' && block.kind === 'reasoning')
    ))
    if (blocks.length === 0) {
      throw new HttpError(400, 'not-editable', editReasonText('no-editable-block'))
    }
    let block
    if (raw.blockIndex !== undefined && raw.blockIndex !== null) {
      const index = Number(raw.blockIndex)
      block = blocks.find((candidate) => candidate.index === index)
    } else {
      block = blocks.find((candidate) => candidate.kind === 'text') ?? blocks[0]
    }
    if (!block) {
      throw new HttpError(400, 'not-editable', '要修改的文本块不存在，请重新打开编辑器。')
    }
    if (typeof raw.kind === 'string' && raw.kind !== block.kind) {
      throw new HttpError(400, 'not-editable', '要修改的文本块已经变化，请重新打开编辑器。')
    }
    const key = `${mode}:${seq}:${block.index}`
    if (seen.has(key)) throw new HttpError(400, 'duplicate-edit', '同一个文本块被修改了两次。')
    seen.add(key)
    ops.push({
      mode,
      seq,
      messageId,
      text,
      original: block.text,
      blockIndex: block.index,
      blockKind: block.kind,
      unchanged: text === block.text,
    })
  }
  return ops
}

async function applyEdits(ctx, sessionId, body, patchSupported) {
  const live = findLiveSession(ctx, sessionId)
  if (!live || typeof live.append !== 'function') {
    throw new HttpError(409, 'session-not-active', '这条会话当前没有打开，无法写入。')
  }
  const events = await eventsForWrite(ctx, sessionId, live)
  if (!events) throw new HttpError(404, 'session-not-found', 'no session log for this id')
  if (isBusy(events)) throw new HttpError(409, 'busy', '这条会话还在工作，等它停下来再整理。')
  if (body.confirm !== true) throw new HttpError(400, 'confirm-required', '请先确认这次修改会写入会话上下文。')
  const lastSeq = events.length > 0 ? events[events.length - 1].seq : -1
  if (requireExpectedLastSeq(body) !== lastSeq) {
    throw new HttpError(409, 'stale', '打开工作台后会话又有了新消息，请刷新后再应用修改。')
  }
  const patches = patchesOf(events)
  const ops = planEdits(events, Array.isArray(body.edits) ? body.edits : [], patches)
  const changed = ops.filter((op) => !op.unchanged)
  const unchanged = ops
    .filter((op) => op.unchanged)
    .map((op) => ({ mode: op.mode, seq: op.seq, messageId: op.messageId, ...(op.blockIndex === undefined ? {} : { blockIndex: op.blockIndex }) }))
  if (changed.length === 0) {
    return { ok: true, applied: [], unchanged, nodes: {}, lastSeq, backupFile: null, flushed: false, flushError: null }
  }
  if (changed.some((op) => op.mode !== 'prompt') && patchSupported !== true) {
    throw new HttpError(409, 'unsupported', '当前宿主没有消息投影能力，无法就地修改助手回复、工具结果或上下文；只能修改用户消息。')
  }
  if (changed.some((op) => op.mode !== 'prompt') && typeof sessionApi.appendPluginRecord !== 'function') {
    throw new HttpError(409, 'unsupported', '当前 Harness 版本不支持插件记录，无法就地修改非用户消息。')
  }

  const planId = randomUUID()
  const createdAt = new Date().toISOString()
  let backupFile
  try {
    backupFile = await writeBackup(sessionId, {
      version: 1,
      kind: 'dsh-curate-edit',
      planId,
      createdAt,
      sessionId,
      lastSeq,
      surfaceBefore: foldSurface(events).nodes,
      edits: changed.map((op) => ({
        mode: op.mode,
        seq: op.seq,
        messageId: op.messageId,
        blockIndex: op.blockIndex,
        blockKind: op.blockKind,
        original: op.original,
        text: op.text,
      })),
    }, 'edit')
  } catch (error) {
    throw new HttpError(500, 'backup-failed', `无法写入备份，已取消修改：${String((error && error.message) || error)}`)
  }

  let planRecordSeq = null
  if (typeof sessionApi.appendPluginRecord === 'function') {
    try {
      planRecordSeq = sessionApi.appendPluginRecord(live, `plugin:${PLUGIN_ID}/edit-plan`, {
        version: 1,
        planId,
        createdAt,
        expectedLastSeq: lastSeq,
        edits: changed.map((op) => ({
          mode: op.mode,
          seq: op.seq,
          blockIndex: op.blockIndex,
          blockKind: op.blockKind,
        })),
      })
    } catch {
      // The plan record is audit only; the edits themselves do not depend on it.
    }
  }

  const applied = []
  try {
    for (const op of changed) {
      if (op.mode === 'prompt') {
        const content = composePromptContent(op.blocks, op.text)
        const carrier = {
          type: 'user/message',
          data: {
            id: randomUUID(),
            role: 'user',
            content,
            // A prompt this plugin merely rewrote is still a human prompt: the
            // platform and every prompt consumer key on `kind: 'user'`. The
            // provenance rides in `editedBy` instead.
            source: { kind: 'user', editedBy: PLUGIN_ID },
          },
        }
        const event = live.append(carrier.type, carrier.data, {
          surfaceOp: { op: 'replace', startSeq: op.seq, endSeq: op.seq },
          sourceEventSeqs: [op.seq],
        })
        applied.push({
          mode: 'prompt',
          seq: op.seq,
          messageId: op.messageId,
          replaced: op.original,
          replacementSeq: event.seq,
        })
        continue
      }
      const patchTarget = op.append === true
        ? { seq: op.seq, append: true, kind: 'text', text: op.text }
        : { seq: op.seq, blockIndex: op.blockIndex, kind: op.blockKind, text: op.text }
      const recordSeq = sessionApi.appendPluginRecord(live, PATCH_TYPE, buildPatchData([patchTarget]))
      applied.push({
        mode: 'reply',
        seq: op.seq,
        messageId: op.messageId,
        blockIndex: op.blockIndex,
        blockKind: op.blockKind,
        ...(op.append === true ? { append: true } : {}),
        replaced: op.original,
        recordSeq,
      })
    }
    const flush = await flushSession(ctx, live)
    try {
      sessionApi.appendPluginRecord(live, `plugin:${PLUGIN_ID}/edit-applied`, {
        version: 1,
        planId,
        planRecordSeq,
        backupFile,
        applied: applied.map((item) => ({
          mode: item.mode,
          seq: item.seq,
          replacementSeq: item.replacementSeq,
          blockIndex: item.blockIndex,
          ...(item.append === true ? { append: true } : {}),
          recordSeq: item.recordSeq,
        })),
      })
    } catch {
      // The edits are already committed; a missing audit record must not fail them.
    }

    // Describe the resulting nodes once, from the log that now contains them, so
    // the browser can update its cards without a second round trip.
    const afterEvents = snapshotEvents(live) ?? events
    const afterFolded = foldSurface(afterEvents)
    const afterBySeq = new Map(afterEvents.map((event) => [event.seq, event]))
    const afterPatches = patchesOf(afterEvents)
    const afterTurns = turnIndex(afterEvents)
    const afterTokens = measuredTokens(ctx, live, afterEvents)
    const nodes = {}
    for (const item of applied) {
      const seq = item.mode === 'prompt' ? item.replacementSeq : item.seq
      if (!afterFolded.nodes.includes(seq)) continue
      const event = afterBySeq.get(seq)
      if (!event) continue
      nodes[seq] = previewNode(describeEffective(event, afterTokens.get(seq) ?? 0, afterTurns, afterPatches, patchSupported))
    }
    return {
      ok: true,
      planId,
      planRecordSeq,
      applied,
      unchanged,
      nodes,
      backupFile,
      lastSeq: afterEvents.length > 0 ? afterEvents[afterEvents.length - 1].seq : lastSeq,
      flushed: flush.flushed,
      flushError: flush.flushError || null,
    }
  } catch (error) {
    return {
      __partial: {
        ok: false,
        code: 'edit-failed',
        error: String((error && error.message) || error),
        planId,
        planRecordSeq,
        backupFile,
        applied,
        remaining: changed.slice(applied.length).map((op) => ({
          mode: op.mode,
          seq: op.seq,
          blockIndex: op.blockIndex,
          blockKind: op.blockKind,
          ...(op.append === true ? { append: true } : {}),
        })),
      },
    }
  }
}

// --- official compaction -----------------------------------------------------

async function resolveAgentFor(ctx, sessionId) {
  const controller = ctx.get('sessionController')
  if (!controller || typeof controller.resolveAgent !== 'function') return undefined
  try {
    const result = await controller.resolveAgent(sessionId)
    if (result && result.agent) return result.agent
  } catch {
    // fall through to the explicit failure at the call site
  }
  return undefined
}

function compactionFailure(error, aborted) {
  const code = error && typeof error.code === 'string' ? error.code : ''
  const message = String((error && error.message) || error)
  if (aborted) return new HttpError(409, 'cancelled', '官方 /compact 超时或已取消，会话没有被修改。')
  if (code === 'busy') return new HttpError(409, 'busy', '这条会话还在工作，等它停下来再压缩。')
  if (code === 'cancelled') return new HttpError(409, 'cancelled', '官方 /compact 已取消，会话没有被修改。')
  if (code === 'changed') return new HttpError(409, 'stale', '官方 /compact 期间历史发生了变化，会话未被修改；请刷新后重试。')
  if (code === 'summary') return new HttpError(502, 'compaction-summary', '官方 /compact 没有生成有效摘要，会话未被修改。')
  if (code === 'commit' || code === 'persistence') {
    return new HttpError(500, code, `官方 /compact 没有完整落盘，请检查会话。${message}`)
  }
  return new HttpError(500, 'compaction-failed', `官方 /compact 失败：${message}`)
}

/**
 * Map the official `/compact` command's human-facing error text back onto
 * stable codes. `dsh-command-compact` converts every ManualCompactionError into
 * a `{ kind: 'error', text }` result, so the original code would otherwise be
 * lost and every failure would surface as one generic 409.
 */
const OFFICIAL_COMPACT_ERRORS = [
  [/compaction is unavailable/i, 409, 'busy', '这条会话还在工作或已有压缩在进行，等它停下来再压缩。'],
  [/compaction cancelled/i, 409, 'cancelled', '官方 /compact 已取消，会话没有被修改。'],
  [/history selected for compaction changed/i, 409, 'stale', '官方 /compact 期间历史发生了变化，会话未被修改；请刷新后重试。'],
  [/could not produce a useful summary/i, 502, 'compaction-summary', '官方 /compact 没有生成有效摘要，会话未被修改。'],
  [/did not finish cleanly/i, 500, 'compaction-partial', '官方 /compact 没有完整结束；请检查会话状态后再重试。'],
  [/could not be saved/i, 500, 'compaction-persistence', '压缩已完成，但会话保存失败；请检查磁盘和会话状态。'],
  [/^usage:/i, 400, 'invalid', '官方 /compact 不接受参数。'],
]

function officialCompactError(text) {
  const message = typeof text === 'string' ? text.trim() : ''
  for (const [pattern, status, code, error] of OFFICIAL_COMPACT_ERRORS) {
    if (pattern.test(message)) return new HttpError(status, code, error)
  }
  return new HttpError(409, 'compaction-failed', message === '' ? '官方 /compact 失败。' : message)
}

async function compactSession(ctx, sessionId, body) {
  const live = findLiveSession(ctx, sessionId)
  if (!live) throw new HttpError(409, 'session-not-active', '这条会话当前没有打开，无法压缩。')
  const events = snapshotEvents(live) ?? (await readEvents(ctx, sessionId))
  if (!events) throw new HttpError(404, 'session-not-found', 'no session log for this id')
  if (isBusy(events)) throw new HttpError(409, 'busy', '这条会话还在工作，等它停下来再压缩。')
  if (body.confirm !== true) throw new HttpError(400, 'confirm-required', '请先确认官方压缩会改写模型可见历史。')
  const lastSeq = events.length > 0 ? events[events.length - 1].seq : -1
  if (requireExpectedLastSeq(body) !== lastSeq) {
    throw new HttpError(409, 'stale', '打开工作台后会话又有了新消息，请刷新后再压缩。')
  }
  const agent = await resolveAgentFor(ctx, sessionId)
  if (!agent || typeof agent.runMaintenance !== 'function') {
    throw new HttpError(409, 'session-not-active', '这条会话当前没有活动的 agent，无法执行官方 /compact；请先在界面打开它。')
  }
  // The compaction backend lives in the agent preset's scoped group. The
  // preset's `/compact` command is the supported door into that same service.
  const commands = ctx.get('commands')
  const compactCommand = compactionCommandOf(ctx, agent)
  if (compactCommand === null || !commands || typeof commands.execute !== 'function') {
    throw new HttpError(409, 'compaction-unavailable', '当前 agent 预设没有挂载官方 /compact，只能用「按整理结果压缩」。')
  }
  let backupFile
  try {
    backupFile = await writeBackup(sessionId, {
      version: 1,
      kind: 'dsh-curate-compact',
      createdAt: new Date().toISOString(),
      sessionId,
      lastSeq,
      surfaceBefore: foldSurface(events).nodes,
      surfaceEvents: events.filter((event) => isSurfaceEvent(event)),
    }, 'compact')
  } catch (error) {
    throw new HttpError(500, 'backup-failed', `无法写入备份，已取消压缩：${String((error && error.message) || error)}`)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), COMPACT_DEADLINE_MS)
  try {
    const settled = await commands.execute(agent, '/compact', [], controller.signal)
    if (!settled) {
      await removeBackup(backupFile)
      throw new HttpError(409, 'compaction-unavailable', '官方 /compact 命令没有执行。')
    }
    if (controller.signal.aborted) {
      throw new HttpError(409, 'cancelled', '官方 /compact 超时或已取消，会话没有被修改。')
    }
    if (!settled.result || settled.result.kind !== 'success') {
      throw officialCompactError(settled.result && settled.result.text)
    }
    if (typeof settled.result.text === 'string' && /^No compactable history/i.test(settled.result.text)) {
      // Nothing was replaced: a full-history backup would be pure noise.
      await removeBackup(backupFile)
      return { ok: true, compacted: false, lastSeq, backupFile: null }
    }
    const afterEvents = snapshotEvents(live) ?? (await readEvents(ctx, sessionId))
    const beforeNodes = foldSurface(events).nodes
    const afterNodes = foldSurface(afterEvents || events).nodes
    const afterSet = new Set(afterNodes)
    const beforeSet = new Set(beforeNodes)
    const shadowedSeqs = beforeNodes.filter((seq) => !afterSet.has(seq))
    // The surface carrier the official compactor appended: the new node the
    // workbench should focus. `summarySeq` is the log-only summary event.
    const addedNodes = afterNodes.filter((seq) => !beforeSet.has(seq))
    const replacementSeq = addedNodes.length > 0 ? addedNodes[addedNodes.length - 1] : null
    let shadowedTokenCount = 0
    if (shadowedSeqs.length > 0) {
      const tokens = measuredTokens(ctx, live, events)
      for (const seq of shadowedSeqs) shadowedTokenCount += tokens.get(seq) ?? 0
    }
    const summarySeq = typeof settled.result.sourceEventSeq === 'number' ? settled.result.sourceEventSeq : null
    try {
      appendRecordOrThrow(live, `plugin:${PLUGIN_ID}/compact`, {
        version: 1,
        commandId: settled.commandId,
        summarySeq,
        replacementSeq,
        shadowedSeqs,
        shadowedTokenCount,
        backupFile,
      })
    } catch {
      // Compaction itself succeeded; a missing audit record is not a failure.
    }
    return {
      ok: true,
      compacted: true,
      commandId: settled.commandId,
      summarySeq,
      replacementSeq,
      shadowedSeqs,
      shadowedTokenCount,
      lastSeq: afterEvents && afterEvents.length > 0 ? afterEvents[afterEvents.length - 1].seq : lastSeq,
      backupFile,
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw compactionFailure(error, controller.signal.aborted)
  } finally {
    clearTimeout(timer)
  }
}

// --- HTTP plumbing -----------------------------------------------------------

function isLoopbackAddress(address) {
  if (typeof address !== 'string' || address.length === 0) return false
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1' || address.startsWith('127.')
}

function isLocalHostHeader(host) {
  if (typeof host !== 'string' || host.length === 0) return false
  const trimmed = host.trim().toLowerCase()
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']')
    if (end === -1) return false
    const rest = trimmed.slice(end + 1)
    if (rest !== '' && !/^:[0-9]+$/.test(rest)) return false
    return trimmed.slice(1, end) === '::1'
  }
  const match = /^([^:]*)(?::([0-9]+))?$/.exec(trimmed)
  if (match === null) return false
  return match[1] === 'localhost' || match[1] === '127.0.0.1' || match[1] === '::1'
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

/**
 * Read one request body as UTF-8 text.
 *
 * Buffers are collected and decoded once at the end: decoding per chunk splits
 * multi-byte characters at TCP boundaries and silently writes U+FFFD into the
 * session log. The limit is enforced on bytes (the decoded string can be up to
 * three times shorter for CJK text).
 */
function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let refused = false
    req.on('data', (chunk) => {
      if (refused) return
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += buffer.length
      if (size > limit) {
        refused = true
        reject(new HttpError(413, 'too-large', 'the request body is too large'))
        return
      }
      chunks.push(buffer)
    })
    req.on('end', () => {
      if (!refused) resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', (error) => {
      if (!refused) reject(error)
    })
    req.on('aborted', () => {
      if (!refused) reject(new Error('aborted'))
    })
  })
}

function guard(req, res) {
  if (!isLoopbackAddress(req.socket && req.socket.remoteAddress)) {
    sendJson(res, 403, { ok: false, code: 'forbidden', error: 'loopback only' })
    return false
  }
  const host = req.headers.host
  if (!isLocalHostHeader(host)) {
    sendJson(res, 403, { ok: false, code: 'forbidden', error: 'unexpected host' })
    return false
  }
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin.length > 0) {
    let originHost = null
    try {
      originHost = new URL(origin).host
    } catch {
      originHost = null
    }
    if (originHost !== host) {
      sendJson(res, 403, { ok: false, code: 'forbidden', error: 'cross-origin request' })
      return false
    }
  }
  return true
}

function decodeQueryPart(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    // `%zz` used to escape as an uncaught URIError and become HTTP 500.
    throw new HttpError(400, 'invalid', 'malformed query string')
  }
}

function queryParam(rawUrl, name) {
  const query = String(rawUrl || '')
  const start = query.indexOf('?')
  if (start < 0) return ''
  for (const pair of query.slice(start + 1).split('&')) {
    const index = pair.indexOf('=')
    const key = index < 0 ? pair : pair.slice(0, index)
    if (decodeQueryPart(key) !== name) continue
    return index < 0 ? '' : decodeQueryPart(pair.slice(index + 1))
  }
  return ''
}

function parseSeq(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, 'invalid', `${name} must be a non-negative integer`)
  }
  const seq = Number(value)
  if (!Number.isInteger(seq) || seq < 0) throw new HttpError(400, 'invalid', `${name} must be a non-negative integer`)
  return seq
}

function sessionIdFromQuery(url) {
  try {
    return (new URL(url, 'http://localhost').searchParams.get('sessionId') || '').trim()
  } catch {
    return ''
  }
}

function requireSessionId(value) {
  if (!value) throw new HttpError(400, 'invalid', 'sessionId required')
  if (!SESSION_ID_RE.test(value)) throw new HttpError(400, 'invalid', 'invalid session id')
  return value
}

function failure(res, error) {
  const status = error instanceof HttpError ? error.status : 500
  const code = error instanceof HttpError ? error.code : 'internal'
  sendJson(res, status, { ok: false, code, error: String((error && error.message) || error) })
}

async function readJsonBody(req, limit) {
  const raw = await readBody(req, limit)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'invalid', 'malformed JSON body')
  }
}

// --- plugin ------------------------------------------------------------------

export function apply(ctx, config) {
  const resolved = {
    provider: config && typeof config.provider === 'string' ? config.provider : '',
    model: config && typeof config.model === 'string' ? config.model : '',
    patch: false,
  }

  // The in-place edit path needs two host seams: a plugin record with the
  // `ignorable` envelope, and a message projection registry. Probe lazily on
  // every request, not just at load: a plugin can be mounted before the
  // sessions service (or before a hot reload settles), and a one-shot probe
  // would then disable assistant/tool/context editing for the whole process.
  let patchSupported = false
  function ensurePatchProjection() {
    if (patchSupported) return true
    try {
      const sessionsService = ctx.get('sessions')
      if (
        typeof sessionApi.appendPluginRecord !== 'function' ||
        !sessionsService ||
        typeof sessionsService.registerMessageProjection !== 'function'
      ) {
        return false
      }
      // A live reload leaves the previous registration in place: the registry
      // rejects a second definition of the same type. The projection is a pure
      // function, so reusing the old instance is exactly as good as a fresh one.
      const registry = sessionsService.messageProjections
      const existing = Array.isArray(registry) ? registry.find((entry) => entry && entry.type === PATCH_TYPE) : undefined
      if (existing === undefined) sessionsService.registerMessageProjection(patchProjection())
      patchSupported = true
    } catch (error) {
      console.error('[dsh-curate] message projection registration failed:', error)
      patchSupported = false
    }
    return patchSupported
  }
  ensurePatchProjection()

  const registerRoutes = (webServer, fiber) => {
    fiber.effect(() =>
      webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/state`,
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method !== 'GET') {
            sendJson(res, 405, { ok: false, code: 'method', error: 'GET only' })
            return
          }
          try {
            const sessionId = requireSessionId(sessionIdFromQuery(req.url))
            sendJson(res, 200, { ok: true, ...(await stateOf(ctx, sessionId, ensurePatchProjection())) })
          } catch (error) {
            failure(res, error)
          }
        },
      }),
    )

    fiber.effect(() =>
      webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/changes`,
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method !== 'GET') {
            sendJson(res, 405, { ok: false, code: 'method', error: 'GET only' })
            return
          }
          try {
            const sessionId = requireSessionId(sessionIdFromQuery(req.url))
            sendJson(res, 200, { ok: true, ...(await changesOf(ctx, sessionId, ensurePatchProjection())) })
          } catch (error) {
            failure(res, error)
          }
        },
      }),
    )

    fiber.effect(() =>
      webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/content`,
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method !== 'GET') {
            sendJson(res, 405, { ok: false, code: 'method', error: 'GET only' })
            return
          }
          try {
            const sessionId = requireSessionId(queryParam(req.url, 'sessionId').trim())
            const startSeq = parseSeq(queryParam(req.url, 'startSeq'), 'startSeq')
            const endSeq = parseSeq(queryParam(req.url, 'endSeq'), 'endSeq')
            sendJson(res, 200, { ok: true, ...(await contentOf(ctx, sessionId, startSeq, endSeq, ensurePatchProjection())) })
          } catch (error) {
            failure(res, error)
          }
        },
      }),
    )

    // Full text and block grammar for one message: the editor's precise source.
    fiber.effect(() =>
      webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/message`,
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method !== 'GET') {
            sendJson(res, 405, { ok: false, code: 'method', error: 'GET only' })
            return
          }
          try {
            const sessionId = requireSessionId(queryParam(req.url, 'sessionId').trim())
            const seq = parseSeq(queryParam(req.url, 'seq'), 'seq')
            sendJson(res, 200, { ok: true, ...(await messageOf(ctx, sessionId, seq, ensurePatchProjection())) })
          } catch (error) {
            failure(res, error)
          }
        },
      }),
    )

    fiber.effect(() =>
      webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/apply`,
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method !== 'POST') {
            sendJson(res, 405, { ok: false, code: 'method', error: 'POST only' })
            return
          }
          try {
            const body = await readJsonBody(req, MAX_BODY_BYTES)
            const sessionId = requireSessionId(typeof body.sessionId === 'string' ? body.sessionId.trim() : '')
            const result = await applyCuration(ctx, resolved, sessionId, body)
            if (result && result.__partial) sendJson(res, 500, result.__partial)
            else sendJson(res, 200, result)
          } catch (error) {
            failure(res, error)
          }
        },
      }),
    )

    fiber.effect(() =>
      webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/edit`,
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method !== 'POST') {
            sendJson(res, 405, { ok: false, code: 'method', error: 'POST only' })
            return
          }
          try {
            const body = await readJsonBody(req, MAX_BODY_BYTES)
            const sessionId = requireSessionId(typeof body.sessionId === 'string' ? body.sessionId.trim() : '')
            const result = await applyEdits(ctx, sessionId, body, ensurePatchProjection())
            if (result && result.__partial) sendJson(res, 500, result.__partial)
            else sendJson(res, 200, result)
          } catch (error) {
            failure(res, error)
          }
        },
      }),
    )

    fiber.effect(() =>
      webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/compact`,
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method !== 'POST') {
            sendJson(res, 405, { ok: false, code: 'method', error: 'POST only' })
            return
          }
          try {
            const body = await readJsonBody(req, 64 * 1024)
            const sessionId = requireSessionId(typeof body.sessionId === 'string' ? body.sessionId.trim() : '')
            const result = await compactSession(ctx, sessionId, body)
            sendJson(res, 200, result)
          } catch (error) {
            failure(res, error)
          }
        },
      }),
    )
  }

  const webServer = ctx.get('webServer')
  if (webServer) registerRoutes(webServer, ctx)
  else ctx.inject(['webServer'], (sub) => registerRoutes(sub.webServer, sub))
}

export const __internals = {
  planEdits,
  editReasonText,
  describeEffective,
  sourceTextFor,
  summarizeOperation,
  capabilitiesOf,
  compactionCommandOf,
  stateOf,
  changesOf,
  readBody,
  readSessionSnapshot,
  queryParam,
  parseSeq,
  requireExpectedLastSeq,
  officialCompactError,
  appendRecordOrThrow,
  flushSession,
}

export default apply
