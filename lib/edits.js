// dsh-curate - message edit helpers (host half).
//
// Adapted from dsh-edit-turn 0.3.1 (MIT, (c) 2025 DDDMUC): the patch record and
// message projection contract, the block readers, and the prompt carrier
// composition. dsh-curate uses them so the curation workbench can rewrite one
// message in place without replaying a turn:
//
// - a human prompt is replaced by a `user/message` surface replacement. A
//   replacement carrier is not an append, so the platform does not answer it;
//   the revised wording simply takes the old prompt's place in the model
//   context, and the later conversation is untouched.
// - an assistant reply cannot be a replacement carrier (the format forbids
//   `sourceEventSeqs` on `assistant/message`), so it is patched by one log-only
//   plugin record plus the message projection registered from
//   `patchProjection()`. Nothing leaves the surface and there is no replay.
//
// Everything in this module is pure. The host routes own session access and the
// browser half owns the editor; this file owns the grammar both sides agree on.
import {
  isHumanPrompt,
  isTextBlock,
  readMessageBlocks,
  readMessageText,
  roleOf,
} from './surface.js'

/** The plugin record type. The grammar requires the `plugin:` namespace. */
export const PATCH_TYPE = 'plugin:dsh-curate/patch'

/** Patch payload version. */
export const PATCH_VERSION = 1

/** Longest text one edit may carry (UTF-16 code units). */
export const MAX_EDIT_TEXT = 500_000

/** Block kinds this plugin can edit, mapped to the recorded block types. */
const KIND_TO_TYPES = {
  text: ['text'],
  reasoning: ['reasoning', 'thinking'],
}

/**
 * The editable kind of one content block.
 * @param block - one message content block.
 * @returns 'text' | 'reasoning' | null.
 */
export function kindOfBlock(block) {
  if (!block || typeof block !== 'object') return null
  if (block.type === 'text' && typeof block.text === 'string') return 'text'
  if ((block.type === 'reasoning' || block.type === 'thinking') && typeof block.text === 'string') return 'reasoning'
  return null
}

/**
 * Every block of a message an editor may target, in message order.
 * @param message - a message payload with a `content` array.
 * @returns `[{ index, kind, text }]`.
 */
export function editableBlocks(input) {
  // Accept both a message object and a bare content array. `classifyEditTarget`
  // reads blocks through `readMessageBlocks`, which already returns the array;
  // passing that array here used to produce an empty list and marked every
  // assistant reply as "no-editable-block".
  const content = Array.isArray(input)
    ? input
    : (input && Array.isArray(input.content) ? input.content : [])
  const out = []
  for (let index = 0; index < content.length; index += 1) {
    const block = content[index]
    const kind = kindOfBlock(block)
    if (kind === null) continue
    out.push({ index, kind, text: block.text })
  }
  return out
}

/** A non-negative safe integer, matching the host's seq/blockIndex checks. */
function isIndex(value) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0)
}

/**
 * Validate one patch payload (shape and target grammar).
 * @param data - the record payload.
 * @returns the same payload when valid.
 * @throws when malformed.
 */
export function validatePatchData(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${PATCH_TYPE}: data must be an object`)
  }
  if (data.version !== PATCH_VERSION) {
    throw new Error(`${PATCH_TYPE}: unsupported version ${String(data.version)}`)
  }
  if (!Array.isArray(data.targets) || data.targets.length === 0) {
    throw new Error(`${PATCH_TYPE}: targets must be a nonempty array`)
  }
  for (const target of data.targets) {
    if (target === null || typeof target !== 'object' || Array.isArray(target)) {
      throw new Error(`${PATCH_TYPE}: each target must be an object`)
    }
    if (!isIndex(target.seq)) throw new Error(`${PATCH_TYPE}: target seq must be a non-negative safe integer`)
    if (!isIndex(target.blockIndex)) throw new Error(`${PATCH_TYPE}: target blockIndex must be a non-negative safe integer`)
    if (!(target.kind in KIND_TO_TYPES)) throw new Error(`${PATCH_TYPE}: target kind must be text or reasoning`)
    if (typeof target.text !== 'string') throw new Error(`${PATCH_TYPE}: target text must be a string`)
  }
  return data
}

/**
 * Build a validated patch payload.
 * @param targets - `[{ seq, blockIndex, kind, text }]`.
 * @returns the payload for `appendPluginRecord`.
 */
export function buildPatchData(targets) {
  const data = {
    version: PATCH_VERSION,
    targets: targets.map((target) => ({
      seq: target.seq,
      blockIndex: target.blockIndex,
      kind: target.kind,
      text: target.text,
    })),
  }
  validatePatchData(data)
  return data
}

/**
 * Apply the targets that belong to one seq to one message.
 *
 * A target whose block is gone (or changed kind) is skipped; the rest still
 * apply. Editing a reasoning block drops its signature: the signature signs the
 * original text and some providers reject the whole request otherwise.
 *
 * @param message - the base message payload.
 * @param targets - validated targets, all for this message.
 * @returns a patched message copy.
 */
export function applyTargetsToMessage(message, targets) {
  const content = Array.isArray(message.content) ? message.content.slice() : []
  for (const target of targets) {
    const block = content[target.blockIndex]
    const kind = kindOfBlock(block)
    if (kind === null || kind !== target.kind) continue
    const patched = { ...block, text: target.text }
    if (kind === 'reasoning') {
      delete patched.signature
      delete patched.thinkingSignature
    }
    content[target.blockIndex] = patched
  }
  return { ...message, content }
}

/**
 * The message payload one surface event derives to, when it carries one.
 *
 * `user/message` stores the message itself in `data`; every other message
 * producing type stores it in `data.message`. This is the shape
 * `deriveEventMessage` reads, so a projection must return exactly this payload.
 *
 * @param event - one event from the log.
 * @returns the message payload, or undefined for a non-message event.
 */
export function messagePayloadOf(event) {
  if (!event || typeof event !== 'object') return undefined
  if (event.type === 'user/message') return event.data
  if (
    event.type === 'system/message' ||
    event.type === 'developer/message' ||
    event.type === 'assistant/message' ||
    event.type === 'tool/result'
  ) {
    return event.data && event.data.message
  }
  return undefined
}

/**
 * A copy of one event with a patched message in the slot its type uses.
 * @param event - one event from the log.
 * @param targets - validated patch targets, all for this seq.
 * @returns the patched event, or the original when it carries no message.
 */
export function patchedEventWithTargets(event, targets) {
  const base = messagePayloadOf(event)
  if (!base || !Array.isArray(base.content)) return event
  const patched = applyTargetsToMessage(base, targets)
  if (event.type === 'user/message') return { ...event, data: patched }
  return { ...event, data: { ...event.data, message: patched } }
}

/** Whether a projection may rewrite this event's message. */
function patchableSource(event) {
  if (!event || typeof event !== 'object') return false
  if (event.type === 'system/message') return false
  if (event.type === 'user/message' && isHumanPrompt(event)) return false
  return messagePayloadOf(event) !== undefined
}

/**
 * The message projection for this plugin's record type.
 *
 * Pure and never throws: a projection error fails the whole session fold, which
 * would make the session unreadable. A malformed record or a target that is no
 * longer on the surface is simply skipped. Several records compose because the
 * base for one target is the message the previous projections already produced
 * (`context.messages`), falling back to the recorded message.
 *
 * @returns `{ type, project(event, context) }` for the host registry.
 */
export function patchProjection() {
  return {
    type: PATCH_TYPE,
    project(event, context) {
      const out = new Map()
      let data
      try {
        data = validatePatchData(event && event.data)
      } catch {
        return out
      }
      const nodes = new Set(Array.isArray(context && context.nodes) ? context.nodes : [])
      const events = Array.isArray(context && context.events) ? context.events : []
      const baseSeq = typeof (context && context.baseSeq) === 'number' ? context.baseSeq : 0
      const messages = context && context.messages
      const groups = new Map()
      for (const target of data.targets) {
        if (!nodes.has(target.seq)) continue
        const group = groups.get(target.seq)
        if (group === undefined) groups.set(target.seq, [target])
        else group.push(target)
      }
      for (const [seq, targets] of groups) {
        const source = events[seq - baseSeq]
        if (!patchableSource(source)) continue
        const previous = messages && typeof messages.get === 'function' ? messages.get(seq) : undefined
        const base = previous && typeof previous === 'object' ? previous : messagePayloadOf(source)
        if (!base || !Array.isArray(base.content)) continue
        try {
          out.set(seq, applyTargetsToMessage(base, targets))
        } catch {
          // Keep the rest of the record; a broken target must not take the
          // session's whole fold down.
        }
      }
      return out
    },
  }
}

/**
 * Read every landed patch from the log, latest per (seq, blockIndex).
 * @param events - complete contiguous event log.
 * @returns `Map<seq, Map<blockIndex, { kind, text }>>`.
 */
export function patchesOf(events) {
  const out = new Map()
  for (const event of events) {
    if (!event || event.type !== PATCH_TYPE) continue
    let data
    try {
      data = validatePatchData(event.data)
    } catch {
      continue
    }
    for (const target of data.targets) {
      let byBlock = out.get(target.seq)
      if (byBlock === undefined) {
        byBlock = new Map()
        out.set(target.seq, byBlock)
      }
      byBlock.set(target.blockIndex, { kind: target.kind, text: target.text })
    }
  }
  return out
}

/**
 * The latest patch per block as a flat list for the browser half.
 * @param patches - `patchesOf(events)`.
 * @returns `[{ seq, blockIndex, kind, text }]`.
 */
export function patchList(patches) {
  const out = []
  for (const [seq, byBlock] of patches) {
    for (const [blockIndex, patch] of byBlock) {
      out.push({ seq, blockIndex, kind: patch.kind, text: patch.text })
    }
  }
  return out.sort((a, b) => a.seq - b.seq || a.blockIndex - b.blockIndex)
}

/**
 * One message's blocks with the landed patch text applied.
 * @param message - the recorded message payload.
 * @param seq - the event seq that carries the message.
 * @param patches - `patchesOf(events)`.
 * @returns `[{ index, kind, text, original, patched }]`.
 */
export function projectedBlocks(message, seq, patches) {
  const byBlock = patches instanceof Map ? patches.get(seq) : undefined
  return editableBlocks(message).map((block) => {
    const patch = byBlock && byBlock.get(block.index)
    const applied = patch !== undefined && patch.kind === block.kind ? patch.text : block.text
    return {
      index: block.index,
      kind: block.kind,
      text: applied,
      original: block.text,
      patched: applied !== block.text,
    }
  })
}

/**
 * A prompt's content blocks with the revised text inserted.
 *
 * Non-text blocks (images, files, tool calls, future types) are copied verbatim
 * and stay in their original order. The first text block is replaced by a single
 * text block; any further text blocks are folded into it, so a message with
 * several text segments becomes one editable paragraph. A prompt that had no
 * text block (only attachments) gets the text appended.
 *
 * @param blocks - the original content blocks.
 * @param text - the revised text (already validated non-empty by the caller).
 * @returns a new content block list.
 */
export function composePromptContent(blocks, text) {
  const source = Array.isArray(blocks) ? blocks : []
  const out = []
  let placed = false
  for (const block of source) {
    if (isTextBlock(block)) {
      if (!placed) {
        out.push({ type: 'text', text })
        placed = true
      }
      continue
    }
    out.push(block)
  }
  if (!placed) out.push({ type: 'text', text })
  return out
}

/**
 * Whether one surface event is editable, and how.
 * @param event - a surface event.
 * @returns `{ mode: 'prompt'|'reply'|null, reason, editableBlocks }`.
 */
export function classifyEditTarget(event) {
  if (!event || typeof event !== 'object') {
    return { mode: null, reason: 'not-editable', editableBlocks: [] }
  }
  if (event.type === 'system/message') {
    return { mode: null, reason: 'system', editableBlocks: [] }
  }
  if (isHumanPrompt(event)) {
    return {
      mode: 'prompt',
      reason: '',
      editableBlocks: editableBlocks(readMessageBlocks(event)),
    }
  }
  if (event.type === 'assistant/message') {
    const blocks = editableBlocks(readMessageBlocks(event))
    if (blocks.length === 0) {
      return { mode: 'reply', reason: 'no-editable-block', editableBlocks: [] }
    }
    return { mode: 'reply', reason: '', editableBlocks: blocks }
  }
  if (event.type === 'tool/result') {
    const blocks = editableBlocks(readMessageBlocks(event)).filter((block) => block.kind === 'text')
    return { mode: 'tool', reason: blocks.length === 0 ? 'no-editable-block' : '', editableBlocks: blocks }
  }
  if (event.type === 'developer/message' || (event.type === 'user/message' && !isHumanPrompt(event))) {
    const blocks = editableBlocks(readMessageBlocks(event)).filter((block) => block.kind === 'text')
    return { mode: 'context', reason: blocks.length === 0 ? 'no-editable-block' : '', editableBlocks: blocks }
  }
  const role = roleOf(event)
  const reason = role === 'tool' ? 'tool-result' : role === 'context' ? 'context' : 'not-editable'
  return { mode: null, reason, editableBlocks: [] }
}

/**
 * A message payload with every landed patch for this seq applied.
 *
 * The returned event keeps its identity; only `data.message.content` is a fresh
 * copy with patched text. Events without a patch are returned unchanged (the
 * same object), which keeps the state route cheap on long logs.
 *
 * @param event - one event from the log.
 * @param patches - `patchesOf(events)`.
 * @returns the effective event for description and summary purposes.
 */
export function projectEvent(event, patches) {
  if (!event || !(patches instanceof Map)) return event
  if (!patchableSource(event)) return event
  const byBlock = patches.get(event.seq)
  if (!byBlock || byBlock.size === 0) return event
  const message = messagePayloadOf(event)
  if (!message || !Array.isArray(message.content)) return event
  const targets = []
  for (const [blockIndex, patch] of byBlock) {
    targets.push({ seq: event.seq, blockIndex, kind: patch.kind, text: patch.text })
  }
  targets.sort((a, b) => a.blockIndex - b.blockIndex)
  return patchedEventWithTargets(event, targets)
}

/**
 * The plain text of a message for the editor, with patches applied.
 * @param event - one surface event.
 * @param patches - `patchesOf(events)`.
 * @returns the joined text blocks.
 */
export function effectiveText(event, patches) {
  return readMessageText(projectEvent(event, patches)).text
}
