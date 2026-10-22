import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PATCH_TYPE,
  applyTargetsToMessage,
  buildPatchData,
  classifyEditTarget,
  composePromptContent,
  editableBlocks,
  kindOfBlock,
  patchProjection,
  patchesOf,
  projectEvent,
  validatePatchData,
} from '../lib/edits.js'

function promptEvent(seq = 3, content = [{ type: 'text', text: '你好' }]) {
  return {
    seq,
    type: 'user/message',
    data: { id: `user-${seq}`, role: 'user', source: { kind: 'user' }, content },
  }
}

function replyEvent(seq = 4, content = [
  { type: 'text', text: '回答' },
  { type: 'reasoning', text: '思考', signature: 'sig-1' },
]) {
  return {
    seq,
    type: 'assistant/message',
    data: { turn: 1, step: 1, message: { id: `reply-${seq}`, role: 'assistant', content } },
  }
}

test('classifyEditTarget allows prompts, replies, tool results and injected context', () => {
  assert.equal(classifyEditTarget(promptEvent()).mode, 'prompt')
  assert.equal(classifyEditTarget(replyEvent()).mode, 'reply')
  assert.equal(classifyEditTarget({ seq: 5, type: 'tool/result', data: { message: { role: 'tool', content: [{ type: 'text', text: 'out' }] } } }).mode, 'tool')
  assert.equal(classifyEditTarget({ seq: 2, type: 'developer/message', data: { message: { role: 'developer', content: [{ type: 'text', text: 'ctx' }] } } }).mode, 'context')
  const contextualUser = {
    seq: 3,
    type: 'user/message',
    data: { id: 'c1', role: 'user', source: { kind: 'plugin:dsh-curate' }, content: [{ type: 'text', text: 'summary' }] },
  }
  assert.equal(classifyEditTarget(contextualUser).mode, 'context')
  assert.equal(classifyEditTarget({ seq: 5, type: 'tool/result', data: { message: { role: 'tool', content: [] } } }).reason, 'no-editable-block')
  assert.equal(classifyEditTarget({ seq: 2, type: 'developer/message', data: { message: { role: 'developer', content: [] } } }).reason, 'no-editable-block')
  assert.equal(classifyEditTarget({ seq: 1, type: 'system/message', data: { message: { role: 'system', content: [] } } }).reason, 'system')
  assert.equal(classifyEditTarget(replyEvent(4, [])).reason, 'no-editable-block')
})

test('kindOfBlock and editableBlocks see text and reasoning only', () => {
  assert.equal(kindOfBlock({ type: 'text', text: 'a' }), 'text')
  assert.equal(kindOfBlock({ type: 'thinking', text: 'b' }), 'reasoning')
  assert.equal(kindOfBlock({ type: 'tool-call', id: 'x' }), null)
  assert.deepEqual(editableBlocks({ content: [
    { type: 'text', text: 'a' },
    { type: 'image', attachmentId: 'i1' },
    { type: 'reasoning', text: 'r' },
  ] }), [
    { index: 0, kind: 'text', text: 'a' },
    { index: 2, kind: 'reasoning', text: 'r' },
  ])
})

test('composePromptContent keeps non-text blocks and folds text blocks', () => {
  const image = { type: 'image', attachmentId: 'att-1', fileName: 'a.png' }
  const file = { type: 'file', attachmentId: 'att-2', fileName: 'b.txt' }
  assert.deepEqual(composePromptContent([
    { type: 'text', text: '旧一' },
    image,
    { type: 'text', text: '旧二' },
    file,
  ], '新文本'), [
    { type: 'text', text: '新文本' },
    image,
    file,
  ])
  assert.deepEqual(composePromptContent([image], '只有附件'), [
    image,
    { type: 'text', text: '只有附件' },
  ])
  assert.deepEqual(composePromptContent([{ type: 'text', text: '旧' }], '新'), [{ type: 'text', text: '新' }])
})

test('patch payload validates and rejects malformed targets', () => {
  const data = buildPatchData([{ seq: 4, blockIndex: 0, kind: 'text', text: '改了' }])
  assert.equal(data.version, 1)
  assert.equal(validatePatchData(data), data)
  assert.throws(() => validatePatchData({ version: 1, targets: [] }), /nonempty/)
  assert.throws(() => validatePatchData({ version: 1, targets: [{ seq: -1, blockIndex: 0, kind: 'text', text: 'x' }] }), /seq/)
  assert.throws(() => validatePatchData({ version: 1, targets: [{ seq: 1, blockIndex: 0, kind: 'image', text: 'x' }] }), /kind/)
  assert.throws(() => validatePatchData({ version: 1, targets: [{ seq: 1, blockIndex: 0, kind: 'text', text: 1 }] }), /string/)
})

test('applyTargetsToMessage rewrites one block and drops a stale reasoning signature', () => {
  const message = replyEvent().data.message
  const patched = applyTargetsToMessage(message, [
    { seq: 4, blockIndex: 0, kind: 'text', text: '改了正文' },
    { seq: 4, blockIndex: 1, kind: 'reasoning', text: '改了思维链' },
    { seq: 4, blockIndex: 9, kind: 'text', text: '不存在的块' },
  ])
  assert.equal(patched.content[0].text, '改了正文')
  assert.equal(patched.content[1].text, '改了思维链')
  assert.equal(patched.content[1].signature, undefined)
  assert.equal(message.content[0].text, '回答', 'the base message is not mutated')
})

test('patchProjection projects only live assistant replies and composes records', () => {
  const events = []
  events[4] = replyEvent(4)
  const projection = patchProjection()
  const first = projection.project({
    type: PATCH_TYPE,
    data: { version: 1, targets: [{ seq: 4, blockIndex: 0, kind: 'text', text: '第一改' }] },
  }, { nodes: [4], events, baseSeq: 0, messages: new Map() })
  assert.equal(first.get(4).content[0].text, '第一改')

  const second = projection.project({
    type: PATCH_TYPE,
    data: { version: 1, targets: [{ seq: 4, blockIndex: 1, kind: 'reasoning', text: '第二改' }] },
  }, { nodes: [4], events, baseSeq: 0, messages: first })
  assert.equal(second.get(4).content[0].text, '第一改', 'earlier edit survives')
  assert.equal(second.get(4).content[1].text, '第二改')

  const retired = projection.project({
    type: PATCH_TYPE,
    data: { version: 1, targets: [{ seq: 4, blockIndex: 0, kind: 'text', text: '退役' }] },
  }, { nodes: [99], events, baseSeq: 0, messages: new Map() })
  assert.equal(retired.size, 0)
})

test('patchesOf keeps the latest patch per block and projectEvent overlays it', () => {
  const events = [
    replyEvent(4),
    { seq: 5, type: PATCH_TYPE, data: { version: 1, targets: [{ seq: 4, blockIndex: 0, kind: 'text', text: '第一改' }] } },
    { seq: 6, type: PATCH_TYPE, data: { version: 1, targets: [{ seq: 4, blockIndex: 0, kind: 'text', text: '第二改' }] } },
  ]
  const patches = patchesOf(events)
  assert.equal(patches.get(4).get(0).text, '第二改')
  const effective = projectEvent(events[0], patches)
  assert.equal(effective.data.message.content[0].text, '第二改')
  assert.equal(events[0].data.message.content[0].text, '回答')
  assert.equal(projectEvent(events[0], new Map()), events[0], 'no patch returns the same event')
})

test('patchProjection rewrites tool results without touching pairing metadata', () => {
  const events = []
  events[5] = {
    seq: 5,
    type: 'tool/result',
    data: {
      message: {
        id: 'tool-5',
        role: 'tool',
        toolCallId: 'call-1',
        isError: false,
        content: [{ type: 'text', text: 'old output' }],
      },
    },
  }
  const projection = patchProjection()
  const projected = projection.project({
    type: PATCH_TYPE,
    data: { version: 1, targets: [{ seq: 5, blockIndex: 0, kind: 'text', text: 'new output' }] },
  }, { nodes: [5], events, baseSeq: 0, messages: new Map() })
  const message = projected.get(5)
  assert.equal(message.content[0].text, 'new output')
  assert.equal(message.toolCallId, 'call-1')
  assert.equal(message.isError, false)
  assert.equal(message.role, 'tool')
})

test('patchProjection preserves developer tool-change blocks', () => {
  const events = []
  events[6] = {
    seq: 6,
    type: 'developer/message',
    data: {
      message: {
        id: 'dev-6',
        role: 'developer',
        content: [
          { type: 'text', text: 'old context' },
          { type: 'tool-addition', toolName: 'bash' },
        ],
      },
    },
  }
  const projection = patchProjection()
  const projected = projection.project({
    type: PATCH_TYPE,
    data: { version: 1, targets: [{ seq: 6, blockIndex: 0, kind: 'text', text: 'new context' }] },
  }, { nodes: [6], events, baseSeq: 0, messages: new Map() })
  const message = projected.get(6)
  assert.equal(message.content[0].text, 'new context')
  assert.deepEqual(message.content[1], { type: 'tool-addition', toolName: 'bash' })
})

test('patchProjection rewrites injected user context and keeps its source', () => {
  const events = []
  events[7] = {
    seq: 7,
    type: 'user/message',
    data: {
      id: 'ctx-7',
      role: 'user',
      source: { kind: 'plugin:dsh-curate' },
      content: [{ type: 'text', text: 'old summary' }],
    },
  }
  const projection = patchProjection()
  const projected = projection.project({
    type: PATCH_TYPE,
    data: { version: 1, targets: [{ seq: 7, blockIndex: 0, kind: 'text', text: 'new summary' }] },
  }, { nodes: [7], events, baseSeq: 0, messages: new Map() })
  const message = projected.get(7)
  assert.equal(message.content[0].text, 'new summary')
  assert.deepEqual(message.source, { kind: 'plugin:dsh-curate' })
  assert.equal(message.role, 'user')
})

test('projectEvent overlays tool and context patches', () => {
  const events = [
    { seq: 5, type: 'tool/result', data: { message: { id: 't5', role: 'tool', content: [{ type: 'text', text: 'old' }] } } },
    { seq: 6, type: 'user/message', data: { id: 'u6', role: 'user', source: { kind: 'plugin:dsh-curate' }, content: [{ type: 'text', text: 'old' }] } },
    { seq: 8, type: PATCH_TYPE, data: { version: 1, targets: [{ seq: 5, blockIndex: 0, kind: 'text', text: 'new-tool' }] } },
    { seq: 9, type: PATCH_TYPE, data: { version: 1, targets: [{ seq: 6, blockIndex: 0, kind: 'text', text: 'new-context' }] } },
  ]
  const patches = patchesOf(events)
  assert.equal(projectEvent(events[0], patches).data.message.content[0].text, 'new-tool')
  assert.equal(projectEvent(events[1], patches).data.content[0].text, 'new-context')
  assert.equal(events[0].data.message.content[0].text, 'old', 'base event unchanged')
})


test('editableBlocks accepts both a content array and a message object', () => {
  const content = [{ type: 'text', text: 'a' }, { type: 'reasoning', text: 'b' }]
  assert.deepEqual(editableBlocks(content), editableBlocks({ content }))
  assert.equal(editableBlocks(content).length, 2)
})

test('classifyEditTarget finds the reasoning+text blocks of a real reply shape', () => {
  const event = {
    seq: 60,
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 5,
      message: {
        id: 'reply-60',
        role: 'assistant',
        content: [
          { type: 'reasoning', text: 'thinking about the answer' },
          { type: 'text', text: 'the final answer' },
        ],
      },
    },
  }
  const target = classifyEditTarget(event)
  assert.equal(target.mode, 'reply')
  assert.equal(target.reason, '')
  assert.equal(target.editableBlocks.length, 2)
  assert.deepEqual(target.editableBlocks.map((block) => block.kind), ['reasoning', 'text'])
})

// --- 0.5.2: appending the missing reply text --------------------------------

function reasoningOnlyReplyEvent(seq = 12) {
  return {
    seq,
    type: 'assistant/message',
    data: { turn: 3, step: 1, message: { id: `reply-${seq}`, role: 'assistant', content: [{ type: 'reasoning', text: '思考但被中断', signature: 'sig-2' }] } },
  }
}

test('patch grammar accepts an append target for a text-less reply', () => {
  const data = buildPatchData([{ seq: 12, append: true, kind: 'text', text: '补充的正文' }])
  assert.deepEqual(data, { version: 1, targets: [{ seq: 12, append: true, kind: 'text', text: '补充的正文' }] })
  assert.throws(() => validatePatchData({ version: 1, targets: [{ seq: 12, append: true, kind: 'reasoning', text: 'x' }] }), /appended target must be text/)
  assert.throws(() => validatePatchData({ version: 1, targets: [{ seq: 12, append: true, kind: 'text', blockIndex: 0, text: 'x' }] }), /must not carry a blockIndex/)
})

test('applyTargetsToMessage appends a text block after the reasoning', () => {
  const patched = applyTargetsToMessage(reasoningOnlyReplyEvent().data.message, [
    { seq: 12, append: true, kind: 'text', text: '补充的正文' },
  ])
  assert.deepEqual(patched.content.map((block) => block.type), ['reasoning', 'text'])
  assert.equal(patched.content[1].text, '补充的正文')
  assert.equal(patched.content[0].signature, 'sig-2', 'append leaves the reasoning block untouched')
})

test('patchProjection exposes an appended reply text to the model', () => {
  const event = { seq: 13, type: PATCH_TYPE, data: buildPatchData([{ seq: 12, append: true, kind: 'text', text: '补充的正文' }]) }
  const projected = patchProjection().project(event, {
    nodes: [12],
    events: [reasoningOnlyReplyEvent(12)],
    baseSeq: 12,
    messages: new Map(),
  })
  assert.ok(projected.has(12))
  assert.deepEqual(projected.get(12).content.map((block) => block.type), ['reasoning', 'text'])
})
