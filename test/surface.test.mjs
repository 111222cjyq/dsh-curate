import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  foldSurface,
  isBusy,
  openTurn,
  turnIndex,
  turnOfEvent,
  validatePlan,
  frameSummary,
  dropMarker,
  describeNode,
  previewNode,
  estimateTokens,
  roleOf,
  eventText,
  readMessageText,
} from '../lib/surface.js'
import { backupRoot, writeBackup } from '../lib/backup.js'

function textMessage(id, text) {
  return { id, content: [{ type: 'text', text }] }
}

function makeLog() {
  return [
    { seq: 0, type: 'turn/start', data: { turn: 1 } },
    { seq: 1, type: 'system/message', surfaceOp: 'append', data: { turn: 1, step: 0, message: { id: 'sys', role: 'system', content: [{ type: 'text', text: '系统的规则' }] } } },
    { seq: 2, type: 'user/message', surfaceOp: 'append', data: { id: 'u1', role: 'user', content: [{ type: 'text', text: '开始任务' }], source: { kind: 'user' } } },
    { seq: 3, type: 'assistant/message', surfaceOp: 'append', data: { turn: 1, step: 1, message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: '收到' }] } } },
    { seq: 4, type: 'user/message', surfaceOp: 'append', data: { id: 'u2', role: 'user', content: [{ type: 'text', text: '继续' }], source: { kind: 'user' } } },
    { seq: 5, type: 'assistant/message', surfaceOp: 'append', data: { turn: 1, step: 2, message: { id: 'a2', role: 'assistant', content: [{ type: 'tool-call', id: 'call_1', name: 'bash', arguments: '{"cmd":"pwd"}' }] } } },
    { seq: 6, type: 'tool/result', surfaceOp: 'append', data: { turn: 1, step: 2, message: { toolCallId: 'call_1', content: [{ type: 'text', text: '/home/user' }] } } },
    { seq: 7, type: 'assistant/message', surfaceOp: 'append', data: { turn: 1, step: 3, message: { id: 'a3', role: 'assistant', content: [{ type: 'text', text: '目录是 /home/user' }] } } },
    { seq: 8, type: 'developer/message', surfaceOp: 'append', data: { turn: 1, step: 3, message: { id: 'd1', role: 'developer', content: [{ type: 'text', text: '注入的上下文' }] } } },
    { seq: 9, type: 'user/message', surfaceOp: 'append', data: { id: 'u3', role: 'user', content: [{ type: 'text', text: '最后一条' }], source: { kind: 'user' } } },
    { seq: 10, type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } },
  ]
}

test('foldSurface keeps every surface node, including developer messages', () => {
  const folded = foldSurface(makeLog())
  assert.deepEqual(folded.nodes, [1, 2, 3, 4, 5, 6, 7, 8, 9])
  assert.deepEqual(folded.replacements, [])
})

test('turnIndex and openTurn describe the log', () => {
  const log = makeLog()
  const turns = turnIndex(log)
  assert.equal(turnOfEvent(turns, log[3]), 1)
  assert.equal(turnOfEvent(turns, log[8]), 1)
  assert.equal(openTurn(log), null)
  assert.equal(isBusy(log), false)
  assert.equal(isBusy([...log, { seq: 11, type: 'turn/start', data: { turn: 2 } }]), true)
})

test('validatePlan accepts a window while keeping the tail and tool pairs intact', () => {
  const log = makeLog()
  const one = validatePlan(log, [{ kind: 'summary', startSeq: 2, endSeq: 3, text: '摘要' }])
  assert.equal(one.ok, true)
  assert.deepEqual(one.ops[0].shadowed, [2, 3])
  const pair = validatePlan(log, [{ kind: 'summary', startSeq: 5, endSeq: 6, text: '工具输出摘要' }])
  assert.equal(pair.ok, true)
  assert.deepEqual(pair.ops[0].shadowed, [5, 6])
})

test('validatePlan carries the tone and can defer summary text to the host', () => {
  const log = makeLog()
  const empty = validatePlan(log, [{ kind: 'summary', startSeq: 2, endSeq: 3 }])
  assert.equal(empty.code, 'missing-summary')
  const deferred = validatePlan(log, [{ kind: 'summary', startSeq: 2, endSeq: 3, tone: 'minor' }], { allowEmptySummary: true })
  assert.equal(deferred.ok, true)
  assert.equal(deferred.ops[0].tone, 'minor')
  assert.equal(deferred.ops[0].text, '')
})

test('validatePlan rejects a broken tool pair, the tail, system nodes and overlaps', () => {
  const log = makeLog()
  assert.equal(validatePlan(log, [{ kind: 'summary', startSeq: 5, endSeq: 5, text: 'x' }]).code, 'tool-pair')
  assert.equal(validatePlan(log, [{ kind: 'summary', startSeq: 6, endSeq: 7, text: 'x' }]).code, 'tool-pair')
  assert.equal(validatePlan(log, [{ kind: 'summary', startSeq: 8, endSeq: 9, text: 'x' }]).code, 'tail-locked')
  assert.equal(validatePlan(log, [{ kind: 'summary', startSeq: 1, endSeq: 2, text: 'x' }]).code, 'system-locked')
  assert.equal(validatePlan(log, [
    { kind: 'summary', startSeq: 2, endSeq: 3, text: 'x' },
    { kind: 'summary', startSeq: 3, endSeq: 4, text: 'y' },
  ]).code, 'overlap')
  assert.equal(validatePlan(log, [{ kind: 'summary', startSeq: 2, endSeq: 3, text: '   ' }]).code, 'missing-summary')
  assert.equal(validatePlan(log, [{ kind: 'summary', startSeq: 2, endSeq: 3 }]).code, 'missing-summary')
})

test('foldSurface replays a replacement', () => {
  const log = makeLog()
  log.push({
    seq: 11,
    type: 'user/message',
    surfaceOp: { op: 'replace', startSeq: 2, endSeq: 3 },
    data: { id: 's1', role: 'user', content: [{ type: 'text', text: '【整理摘要】' }], source: { kind: 'plugin:dsh-curate', plugin: 'dsh-curate' } },
  })
  const folded = foldSurface(log)
  assert.deepEqual(folded.nodes, [1, 11, 4, 5, 6, 7, 8, 9])
  assert.equal(folded.replacements.length, 1)
  assert.deepEqual(folded.replacements[0].shadowed, [2, 3])
  const check = validatePlan(log, [{ kind: 'summary', startSeq: 4, endSeq: 4, text: 'ok' }])
  assert.equal(check.ok, true)
})

test('frameSummary and dropMarker record provenance', () => {
  const log = makeLog()
  const plan = validatePlan(log, [{ kind: 'summary', startSeq: 5, endSeq: 6, text: '运行了 pwd，结果是 /home/user。' }])
  const records = plan.ops[0].shadowed.map((seq) => describeNode(log.find((event) => event.seq === seq), 10, 1))
  const framed = frameSummary(plan.ops[0], records, '')
  assert.match(framed, /^【上下文整理摘要】/)
  assert.match(framed, /5–6/)
  assert.match(framed, /\/home\/user/)
  assert.match(dropMarker({ startSeq: 2, endSeq: 3 }), /2–3/)
})

test('describeNode/previewNode keep the browser payload small', () => {
  const log = makeLog()
  const record = describeNode(log[5], 42, 1)
  assert.equal(record.role, 'assistant')
  assert.deepEqual(record.toolCalls, ['bash'])
  assert.equal(record.tokens, 42)
  const preview = previewNode({ ...record, text: 'x'.repeat(900) })
  assert.equal(preview.text, undefined)
  assert.equal(preview.preview.length, 600)
  assert.equal(preview.truncated, true)
})

test('roleOf and eventText make tool results readable', () => {
  const log = makeLog()
  assert.equal(roleOf(log[6]), 'tool')
  assert.equal(roleOf(log[8]), 'context')
  assert.match(eventText(log[5]), /tool call bash/)
  assert.match(eventText(log[6]), /tool result call_1/)
  assert.ok(estimateTokens(log[5]) > 10)
})

test('writeBackup writes JSON under the configured root', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-curate-test-'))
  const previous = process.env.DSH_CURATE_BACKUP_DIR
  process.env.DSH_CURATE_BACKUP_DIR = root
  try {
    assert.equal(backupRoot(), root)
    const file = await writeBackup('session-1234', { version: 1, hello: 'world' })
    assert.ok(file.startsWith(root))
    const parsed = JSON.parse(await readFile(file, 'utf8'))
    assert.deepEqual(parsed, { version: 1, hello: 'world' })
  } finally {
    if (previous === undefined) delete process.env.DSH_CURATE_BACKUP_DIR
    else process.env.DSH_CURATE_BACKUP_DIR = previous
  }
})


test('readMessageText counts only image/file blocks as attachments', () => {
  const event = {
    type: 'assistant/message',
    data: {
      message: {
        role: 'assistant',
        content: [
          { type: 'reasoning', text: 'thinking' },
          { type: 'text', text: 'answer' },
          { type: 'image', attachmentId: 'img-1' },
          { type: 'file', attachmentId: 'file-1' },
          { type: 'tool-call', id: 'call-1', name: 'bash', arguments: '{}' },
        ],
      },
    },
  }
  assert.deepEqual(readMessageText(event), { text: 'answer', attachments: 2 })
})

test('validatePlan accepts multiple non-overlapping ranges with a kept gap', () => {
  const log = makeLog()
  const result = validatePlan(log, [
    { kind: 'summary', startSeq: 2, endSeq: 3, text: '第一段摘要' },
    { kind: 'summary', startSeq: 7, endSeq: 8, text: '第二段摘要' },
  ])
  assert.equal(result.ok, true)
  assert.deepEqual(result.ops.map((op) => op.shadowed), [[2, 3], [7, 8]])
})

test('validatePlan still rejects a tool pair split across ranges', () => {
  const log = makeLog()
  const split = validatePlan(log, [
    { kind: 'summary', startSeq: 5, endSeq: 5, text: 'call only' },
    { kind: 'summary', startSeq: 6, endSeq: 6, text: 'result only' },
  ])
  assert.equal(split.ok, false)
  assert.equal(split.code, 'tool-pair')
})

test('validatePlan rejects overlapping ranges', () => {
  const log = makeLog()
  const overlap = validatePlan(log, [
    { kind: 'summary', startSeq: 2, endSeq: 3, text: 'a' },
    { kind: 'summary', startSeq: 3, endSeq: 4, text: 'b' },
  ])
  assert.equal(overlap.ok, false)
  assert.equal(overlap.code, 'overlap')
})
