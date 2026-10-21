// dsh-curate - pure surface helpers.
//
// Everything in this module is a pure function of a complete event log plus,
// where useful, a seq -> token-count map. The host routes use it to describe the
// current surface, validate a curation plan, and build the text handed to the
// model; the tests drive it without a host. The surface fold mirrors the
// official one exactly: `append` pushes a node, `replace` swaps an inclusive
// window for the replacing event.
//
// The surface vocabulary, the fold and the message readers are adapted from
// dsh-edit-turn 0.3.1 (MIT, (c) DDDMUC) so this plugin agrees with the official
// fold byte for byte. See NOTICE.md.

/** Plugin id shared by the host and browser halves. */
export const PLUGIN_ID = 'dsh-curate'

/** Event types that participate in the model-visible surface. */
const SURFACE_TYPES = new Set([
  'system/message',
  'developer/message',
  'user/message',
  'assistant/message',
  'tool/result',
])

/** Hard limits the host enforces on one plan. */
export const PLAN_LIMITS = {
  /** Maximum number of replacement operations in one apply. */
  maxOps: 200,
  /** Maximum messages one operation may cover. */
  maxRangeMessages: 400,
  /** Maximum summary text length (UTF-16 code units) per operation. */
  maxSummaryChars: 100_000,
  /** Maximum size of one summarize source, in characters, before chunking. */
  summarizeChunkChars: 40_000,
}

/** Whether one event participates in the model-visible surface. */
export function isSurfaceEvent(event) {
  const type = event && event.type
  return typeof type === 'string' && SURFACE_TYPES.has(type)
}

/**
 * Replay the surface operations of a complete log.
 * @param events - complete contiguous raw event log in seq order.
 * @returns `{ nodes, replacements }`, nodes being current surface seqs in model order.
 */
export function foldSurface(events) {
  const nodes = []
  const replacements = []
  for (const event of events) {
    const op = event.surfaceOp
    if (op === undefined) continue
    if (op === 'append') {
      nodes.push(event.seq)
      continue
    }
    if (op === null || typeof op !== 'object' || op.op !== 'replace') continue
    const startIdx = nodes.indexOf(op.startSeq)
    const endIdx = nodes.indexOf(op.endSeq)
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) continue
    const shadowed = nodes.slice(startIdx, endIdx + 1)
    nodes.splice(startIdx, endIdx - startIdx + 1, event.seq)
    replacements.push({ seq: event.seq, startSeq: op.startSeq, endSeq: op.endSeq, shadowed })
  }
  return { nodes, replacements }
}

/** Map every event seq to the turn that encloses it. */
export function turnIndex(events) {
  const turnOf = new Map()
  let current
  for (const event of events) {
    if (event.type === 'turn/start') {
      current = event.data && event.data.turn
      turnOf.set(event.seq, current)
      continue
    }
    if (event.type === 'turn/end') {
      turnOf.set(event.seq, current)
      current = undefined
      continue
    }
    const data = event.data
    const explicit =
      data && typeof data.turn === 'number' &&
      (event.type === 'assistant/message' || event.type === 'tool/result' || event.type === 'tool/call')
        ? data.turn
        : undefined
    turnOf.set(event.seq, explicit !== undefined ? explicit : current)
  }
  return turnOf
}

/** The turn an event belongs to, when the log says so. */
export function turnOfEvent(turnOf, event) {
  const direct = turnOf.get(event.seq)
  if (typeof direct === 'number') return direct
  const data = event && event.data
  return data && typeof data.turn === 'number' ? data.turn : undefined
}

/** Whether an operation is in flight that will still write the surface. */
export function openTurn(events) {
  let open = null
  for (const event of events) {
    if (event.type === 'turn/start') open = event.data && event.data.turn
    else if (event.type === 'turn/end' && (open === null || event.data.turn === open)) open = null
  }
  return open
}

/** Whether an operation is in flight that will still write the surface. */
export function isBusy(events) {
  if (openTurn(events) !== null) return true
  let compaction = false
  for (const event of events) {
    if (event.type === 'compaction/start') compaction = true
    else if (event.type === 'compaction/end') compaction = false
  }
  return compaction
}

/** Durable message identity of one surface event. */
export function messageIdOf(event) {
  const data = event && event.data
  if (!data || typeof data !== 'object') return undefined
  if (event.type === 'user/message') return typeof data.id === 'string' ? data.id : undefined
  if (event.type === 'assistant/message' || event.type === 'tool/result' || event.type === 'system/message' || event.type === 'developer/message') {
    const message = data.message
    return message && typeof message.id === 'string' ? message.id : undefined
  }
  return undefined
}

/** Whether one content block carries editable text. */
export function isTextBlock(block) {
  return Boolean(block) && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string'
}

/** The content blocks of a message payload, in message order. */
export function readMessageBlocks(event) {
  const data = (event && event.data) || {}
  const message = data.message && typeof data.message === 'object' ? data.message : data
  return Array.isArray(message.content) ? message.content : []
}

/** Whether one content block is a user attachment (not reasoning/tool data). */
export function isAttachmentBlock(block) {
  return Boolean(block) && typeof block === 'object' && (block.type === 'image' || block.type === 'file')
}

/** Read the plain text of a message payload plus its attachment block count. */
export function readMessageText(event) {
  let text = ''
  let attachments = 0
  for (const block of readMessageBlocks(event)) {
    if (!block || typeof block !== 'object') continue
    if (isTextBlock(block)) text += (text === '' ? '' : '\n') + block.text
    else if (isAttachmentBlock(block)) attachments += 1
  }
  return { text, attachments }
}

/** Whether one event is a human-authored prompt. */
export function isHumanPrompt(event) {
  if (!event || event.type !== 'user/message') return false
  const data = event.data
  return Boolean(data && data.source && data.source.kind === 'user')
}

/** The model-facing role of one surface event. */
export function roleOf(event) {
  if (!event) return 'unknown'
  if (event.type === 'user/message') return isHumanPrompt(event) ? 'user' : 'context'
  if (event.type === 'developer/message') return 'context'
  if (event.type === 'assistant/message') return 'assistant'
  if (event.type === 'tool/result') return 'tool'
  if (event.type === 'system/message') return 'system'
  return 'unknown'
}

/**
 * Tool-call ids an assistant message announces, with their names.
 * @param event - a surface event.
 * @returns `[{ id, name }]`.
 */
export function toolCallsOf(event) {
  const out = []
  for (const block of readMessageBlocks(event)) {
    if (!block || typeof block !== 'object' || block.type !== 'tool-call') continue
    if (typeof block.id !== 'string' || block.id === '') continue
    out.push({ id: block.id, name: typeof block.name === 'string' ? block.name : '' })
  }
  return out
}

/** The tool-call id a tool result answers, when it names one. */
export function toolResultCallOf(event) {
  if (!event || event.type !== 'tool/result') return undefined
  const data = event.data || {}
  const message = data.message && typeof data.message === 'object' ? data.message : data
  if (typeof message.toolCallId === 'string' && message.toolCallId !== '') return message.toolCallId
  if (typeof data.toolCallId === 'string' && data.toolCallId !== '') return data.toolCallId
  return undefined
}

/** Whether one tool result is an error result. */
export function toolResultIsError(event) {
  const data = event && event.data
  const message = data && data.message && typeof data.message === 'object' ? data.message : data
  return Boolean(message && message.isError === true)
}

/** A cheap token estimate for one surface event (used when no meter is mounted). */
export function estimateTokens(event) {
  const { text, attachments } = readMessageText(event)
  let tokens = Math.ceil(text.length / 3.2) + 8
  for (const block of readMessageBlocks(event)) {
    if (!block || typeof block !== 'object') continue
    if (block.type === 'tool-call') {
      const args = typeof block.arguments === 'string' ? block.arguments : JSON.stringify(block.arguments || {})
      tokens += Math.ceil(args.length / 3.2) + 12
    } else if (block.type === 'image' || block.type === 'file') {
      tokens += 256
    }
  }
  return tokens + attachments * 4
}

/**
 * The text handed to the summarizer for one surface event.
 * Text blocks lead; tool calls follow as `name(args)`; tool results are labelled
 * so the model keeps call/result pairing visible.
 * @param event - a surface event.
 * @returns plain text.
 */
export function eventText(event) {
  if (!event) return ''
  const role = roleOf(event)
  const blocks = readMessageBlocks(event)
  const parts = []
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    if (isTextBlock(block)) {
      if (block.text !== '') parts.push(block.text)
      continue
    }
    if (block.type === 'tool-call') {
      const name = typeof block.name === 'string' && block.name !== '' ? block.name : 'tool'
      const args = typeof block.arguments === 'string' ? block.arguments : JSON.stringify(block.arguments || {})
      parts.push(`[tool call ${name}] ${args}`)
      continue
    }
    if (block.type === 'image') parts.push('[image attached]')
    else if (block.type === 'file') parts.push('[file attached]')
  }
  if (role === 'tool') {
    const call = toolResultCallOf(event)
    const flag = toolResultIsError(event) ? 'error ' : ''
    parts.unshift(`[${flag}tool result ${call || ''}]`.trim())
  }
  const text = parts.join('\n').trim()
  return text === '' ? `[${role} message with no text]` : text
}

/**
 * One node description for the browser half.
 * @param event - surface event.
 * @param tokens - measured or estimated token count.
 * @param turn - enclosing turn number, when known.
 * @returns a compact, structured node record.
 */
export function describeNode(event, tokens, turn) {
  // `text` drives the human-facing preview: include tool calls and tool-result
  // flags, not just plain text blocks, so an assistant step that only called a
  // tool does not render as a blank line.
  const { text: plainText, attachments } = readMessageText(event)
  const text = eventText(event)
  const role = roleOf(event)
  const calls = toolCallsOf(event)
  const resultCall = toolResultCallOf(event)
  const isError = toolResultIsError(event)
  const messageId = messageIdOf(event)
  return {
    seq: event.seq,
    type: event.type,
    role,
    turn: typeof turn === 'number' ? turn : null,
    messageId: messageId || null,
    tokens: Math.max(0, Math.round(tokens)),
    blocks: Array.isArray(readMessageBlocks(event)) ? readMessageBlocks(event).length : 0,
    attachments,
    toolCalls: calls.map((call) => call.name || call.id),
    toolCallIds: calls.map((call) => call.id),
    toolResultFor: resultCall || null,
    isError,
    text,
    plainText,
  }
}

/** Build the preview record published by /state (text trimmed to `previewChars`). */
export function previewNode(described, previewChars = 600) {
  const raw = typeof described.text === 'string' ? described.text : ''
  const trimmed = raw.length > previewChars ? raw.slice(0, previewChars) : raw
  const plainRaw = typeof described.plainText === 'string' ? described.plainText : ''
  const plainTrimmed = plainRaw.length > previewChars ? plainRaw.slice(0, previewChars) : plainRaw
  return {
    ...described,
    text: undefined,
    plainText: undefined,
    preview: trimmed,
    previewPlain: plainTrimmed,
    truncated: raw.length > previewChars,
  }
}

/**
 * Validate a list of requested operations against the current surface.
 *
 * The rules are deliberately conservative because a replacement is permanent:
 * - every endpoint must still be on the surface;
 * - no operation may touch a system node, and the final surface node is always
 *   left in place (the plugin never compresses away the message being answered);
 * - tool calls and their results must cross the window boundary together, or a
 *   tool result would reference a call the model can no longer see (and vice
 *   versa);
 * - operations may not overlap.
 *
 * @param events - complete raw event log.
 * @param requested - `[{ kind, startSeq, endSeq, tone? }]`; `kind` is 'summary'|'drop'.
 * @param options - `{ allowEmptySummary }`; the host's auto-summary path fills
 *   `op.text` after validation, so it may submit ranges before any text exists.
 * @returns `{ ok: true, ops, nodes }` or `{ ok: false, error, code }`.
 */
export function validatePlan(events, requested, options = {}) {
  const allowEmptySummary = options.allowEmptySummary === true
  const folded = foldSurface(events)
  const nodes = folded.nodes
  if (!Array.isArray(requested) || requested.length === 0) {
    return { ok: false, code: 'invalid-plan', error: '请先选择要压缩的内容。' }
  }
  if (requested.length > PLAN_LIMITS.maxOps) {
    return { ok: false, code: 'too-many-ops', error: `一次最多应用 ${PLAN_LIMITS.maxOps} 个压缩块。` }
  }
  const bySeq = new Map()
  for (const event of events) bySeq.set(event.seq, event)
  const positions = new Map(nodes.map((seq, index) => [seq, index]))
  const lastIdx = nodes.length - 1
  const ops = []
  for (const raw of requested) {
    if (!raw || typeof raw !== 'object') {
      return { ok: false, code: 'invalid-plan', error: '压缩计划里有无法识别的项目。' }
    }
    const kind = raw.kind === 'drop' ? 'drop' : raw.kind === 'summary' ? 'summary' : null
    if (kind === null) return { ok: false, code: 'invalid-plan', error: '压缩项目缺少类型。' }
    const startSeq = Number(raw.startSeq)
    const endSeq = Number(raw.endSeq)
    if (!Number.isSafeInteger(startSeq) || !Number.isSafeInteger(endSeq)) {
      return { ok: false, code: 'invalid-plan', error: '压缩范围缺少有效的消息序号。' }
    }
    const startIdx = positions.get(startSeq)
    const endIdx = positions.get(endSeq)
    if (startIdx === undefined || endIdx === undefined) {
      return { ok: false, code: 'stale', error: '会话已经发生变化，请刷新后重新选择。' }
    }
    if (startIdx > endIdx) {
      return { ok: false, code: 'invalid-range', error: '压缩范围的起点在终点之后。' }
    }
    if (endIdx > lastIdx) {
      return { ok: false, code: 'invalid-range', error: '压缩范围越过了会话末尾。' }
    }
    if (endIdx - startIdx + 1 > PLAN_LIMITS.maxRangeMessages) {
      return { ok: false, code: 'range-too-large', error: `一个压缩块最多覆盖 ${PLAN_LIMITS.maxRangeMessages} 条消息。` }
    }
    if (endIdx === lastIdx) {
      return { ok: false, code: 'tail-locked', error: '最后一条消息不能被压缩，请至少保留它。' }
    }
    const shadowed = nodes.slice(startIdx, endIdx + 1)
    for (const seq of shadowed) {
      const event = bySeq.get(seq)
      if (!event) return { ok: false, code: 'stale', error: '会话已经发生变化，请刷新后重新选择。' }
      if (event.type === 'system/message') {
        return { ok: false, code: 'system-locked', error: '系统提示不能被压缩。' }
      }
    }
    const callIds = new Set()
    const resultIds = new Set()
    for (const seq of shadowed) {
      const event = bySeq.get(seq)
      for (const call of toolCallsOf(event)) callIds.add(call.id)
      const result = toolResultCallOf(event)
      if (result !== undefined) resultIds.add(result)
    }
    for (const callId of callIds) {
      if (!resultIds.has(callId)) {
        return {
          ok: false,
          code: 'tool-pair',
          error: `第 ${startSeq}–${endSeq} 条消息里的工具调用没有包含对应的工具结果，请把范围扩大。`,
        }
      }
    }
    for (const resultId of resultIds) {
      if (!callIds.has(resultId)) {
        return {
          ok: false,
          code: 'tool-pair',
          error: `第 ${startSeq}–${endSeq} 条消息里的工具结果没有包含对应的调用，请把范围扩大。`,
        }
      }
    }
    const text = typeof raw.text === 'string' ? raw.text : ''
    if (kind === 'summary' && text.trim() === '' && !allowEmptySummary) {
      return { ok: false, code: 'missing-summary', error: '还有压缩块没有摘要，请先生成或填写摘要。' }
    }
    if (text.length > PLAN_LIMITS.maxSummaryChars) {
      return { ok: false, code: 'summary-too-long', error: '摘要太长了，请精简后再应用。' }
    }
    const tone = raw.tone === 'minor' ? 'minor' : 'normal'
    ops.push({ kind, startSeq, endSeq, startIdx, endIdx, shadowed, text, tone })
  }
  ops.sort((a, b) => a.startIdx - b.startIdx)
  for (let index = 1; index < ops.length; index += 1) {
    if (ops[index].startIdx <= ops[index - 1].endIdx) {
      return { ok: false, code: 'overlap', error: '压缩块之间重叠了，请拆分或合并后重试。' }
    }
  }
  return { ok: true, ops, nodes }
}

/** Frame one summary for the model, with provenance the transcript can show. */
export function frameSummary(op, nodeRecords, label) {
  const counts = { user: 0, assistant: 0, tool: 0, context: 0, system: 0 }
  for (const record of nodeRecords) {
    if (record && Object.prototype.hasOwnProperty.call(counts, record.role)) counts[record.role] += 1
  }
  const stats = [`用户 ${counts.user}`, `助手 ${counts.assistant}`, `工具 ${counts.tool}`]
  if (counts.context > 0) stats.push(`上下文 ${counts.context}`)
  const title = label && label.trim() !== '' ? label.trim() : '上下文整理摘要'
  return [
    `【${title}】`,
    `> 这里是用户整理后保留的上下文摘要（原始范围 ${op.startSeq}–${op.endSeq}，约 ${stats.join(' · ')}）。继续任务时以本节为准；需要更多细节时向用户确认，不要臆测。`,
    '',
    op.text.trim(),
  ].join('\n')
}

/** The default marker written in place of deliberately dropped messages. */
export function dropMarker(op) {
  return `【上下文整理：用户判断第 ${op.startSeq}–${op.endSeq} 条消息为次要内容，已省略。】`
}
