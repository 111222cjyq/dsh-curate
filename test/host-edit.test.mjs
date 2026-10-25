import { test } from 'node:test'
import assert from 'node:assert/strict'
import { __internals, PLUGIN_VERSION, apply } from '../lib/index.js'
import { readFileSync } from 'node:fs'

const PACKAGE = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
import { PATCH_TYPE, patchesOf } from '../lib/edits.js'

function surfaceEvents() {
  return [
    { seq: 0, type: 'system/message', data: { message: { id: 's1', role: 'system', content: [{ type: 'text', text: 'sys' }] } }, surfaceOp: 'append' },
    { seq: 1, type: 'turn/start', data: { turn: 1 } },
    { seq: 2, type: 'user/message', data: { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'hi' }] }, surfaceOp: 'append' },
    { seq: 3, type: 'assistant/message', data: { turn: 1, step: 1, message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: 'hello' }, { type: 'reasoning', text: 'think', signature: 'sig' }] } }, surfaceOp: 'append' },
    { seq: 4, type: 'tool/result', data: { message: { id: 't1', role: 'tool', content: [{ type: 'text', text: 'out' }] } }, surfaceOp: 'append' },
    { seq: 5, type: 'turn/end', data: { turn: 1 } },
  ]
}

test('host version is the package version', () => {
  assert.equal(PLUGIN_VERSION, PACKAGE.version)
})

test('planEdits accepts a prompt and an unmodified save reports unchanged', () => {
  const edits = __internals.planEdits(surfaceEvents(), [
    { seq: 2, mode: 'prompt', text: 'hi there' },
  ], new Map())
  assert.equal(edits.length, 1)
  assert.equal(edits[0].mode, 'prompt')
  assert.equal(edits[0].original, 'hi')
  assert.equal(edits[0].unchanged, false)

  const same = __internals.planEdits(surfaceEvents(), [
    { seq: 2, mode: 'prompt', text: 'hi' },
  ], new Map())
  assert.equal(same[0].unchanged, true)
})

test('planEdits picks a reply block and honours blockIndex/kind', () => {
  const plain = __internals.planEdits(surfaceEvents(), [
    { seq: 3, mode: 'reply', text: 'hello2' },
  ], new Map())
  assert.equal(plain[0].blockIndex, 0)
  assert.equal(plain[0].blockKind, 'text')
  assert.equal(plain[0].original, 'hello')

  const reasoning = __internals.planEdits(surfaceEvents(), [
    { seq: 3, mode: 'reply', blockIndex: 1, kind: 'reasoning', text: 'think2' },
  ], new Map())
  assert.equal(reasoning[0].blockIndex, 1)
  assert.equal(reasoning[0].blockKind, 'reasoning')
})

test('planEdits reads the projected text as the original reply text', () => {
  const events = surfaceEvents()
  events.push({ seq: 6, type: PATCH_TYPE, data: { version: 1, targets: [{ seq: 3, blockIndex: 0, kind: 'text', text: 'patched' }] } })
  const edits = __internals.planEdits(events, [
    { seq: 3, mode: 'reply', text: 'patched again' },
  ], patchesOf(events))
  assert.equal(edits[0].original, 'patched')
})

test('planEdits refuses system/tool targets and wrong modes', () => {
  const cases = [
    { request: { seq: 0, mode: 'prompt', text: 'x' }, code: 'not-editable' },
    { request: { seq: 4, mode: 'reply', text: 'x' }, code: 'not-editable' },
    { request: { seq: 3, mode: 'prompt', text: 'x' }, code: 'not-editable' },
  ]
  for (const item of cases) {
    assert.throws(
      () => __internals.planEdits(surfaceEvents(), [item.request], new Map()),
      (error) => error && error.code === item.code,
      JSON.stringify(item.request),
    )
  }
})

test('planEdits refuses empty, duplicate and off-surface edits', () => {
  assert.throws(
    () => __internals.planEdits(surfaceEvents(), [{ seq: 2, mode: 'prompt', text: '   ' }], new Map()),
    (error) => error.code === 'empty-edit',
  )
  assert.throws(
    () => __internals.planEdits(surfaceEvents(), [
      { seq: 2, mode: 'prompt', text: 'a' },
      { seq: 2, mode: 'prompt', text: 'b' },
    ], new Map()),
    (error) => error.code === 'duplicate-edit',
  )
  assert.throws(
    () => __internals.planEdits(surfaceEvents(), [{ seq: 99, mode: 'prompt', text: 'a' }], new Map()),
    (error) => error.code === 'stale',
  )
})

test('plugin registers the projection and all seven loopback routes', () => {
  const routes = []
  const projections = []
  const registered = []
  const webServer = {
    register(definition) {
      routes.push(definition.path)
      return () => {}
    },
  }
  const sessions = {
    messageProjections: [],
    registerMessageProjection(projection) {
      projections.push(projection)
      this.messageProjections.push(projection)
      return () => {}
    },
  }
  const ctx = {
    get(name) {
      if (name === 'webServer') return webServer
      if (name === 'sessions') return sessions
      return undefined
    },
    effect(fn) {
      const dispose = fn()
      registered.push(typeof dispose === 'function' ? dispose : () => {})
    },
  }
  apply(ctx, {})
  assert.deepEqual(projections.map((projection) => projection.type), ['plugin:dsh-curate/patch'])
  const paths = routes.map((path) => path.replace('/dsh-curate/', ''))
  assert.deepEqual(paths.sort(), ['apply', 'changes', 'compact', 'content', 'edit', 'message', 'state'])
})

test('planEdits accepts tool results and injected context', () => {
  const events = surfaceEvents()
  events.push({
    seq: 6,
    type: 'developer/message',
    data: { message: { id: 'd1', role: 'developer', content: [{ type: 'text', text: 'ctx' }] } },
    surfaceOp: 'append',
  })
  events.push({ seq: 7, type: 'turn/end', data: { turn: 1 } })
  const tool = __internals.planEdits(events, [
    { seq: 4, mode: 'tool', text: 'new out' },
  ], new Map())
  assert.equal(tool[0].mode, 'tool')
  assert.equal(tool[0].original, 'out')
  assert.equal(tool[0].blockKind, 'text')

  const context = __internals.planEdits(events, [
    { seq: 6, mode: 'context', text: 'new ctx' },
  ], new Map())
  assert.equal(context[0].mode, 'context')
  assert.equal(context[0].original, 'ctx')

  assert.throws(
    () => __internals.planEdits(events, [{ seq: 4, mode: 'reply', text: 'x' }], new Map()),
    (error) => error.code === 'not-editable',
  )
  assert.throws(
    () => __internals.planEdits(events, [{ seq: 4, mode: 'tool', blockIndex: 0, kind: 'reasoning', text: 'x' }], new Map()),
    (error) => error.code === 'not-editable',
  )
})

test('planEdits can append the missing reply text to a reasoning-only reply', () => {
  const events = surfaceEvents()
  events.push({
    seq: 6,
    type: 'assistant/message',
    data: { turn: 1, step: 2, message: { id: 'a2', role: 'assistant', content: [{ type: 'reasoning', text: 'thinking only', signature: 'sig' }] } },
    surfaceOp: 'append',
  })
  events.push({ seq: 7, type: 'turn/end', data: { turn: 1 } })
  const ops = __internals.planEdits(events, [
    { seq: 6, mode: 'reply', append: true, kind: 'text', text: '补充的助手回复正文' },
  ], new Map())
  assert.equal(ops.length, 1)
  assert.equal(ops[0].append, true)
  assert.equal(ops[0].blockIndex, null)
  assert.equal(ops[0].blockKind, 'text')

  // Appending is only for replies without a text block.
  assert.throws(
    () => __internals.planEdits(events, [{ seq: 3, mode: 'reply', append: true, kind: 'text', text: 'x' }], new Map()),
    (error) => error && error.code === 'not-editable',
  )
  assert.throws(
    () => __internals.planEdits(events, [{ seq: 4, mode: 'tool', append: true, kind: 'text', text: 'x' }], new Map()),
    (error) => error && error.code === 'invalid',
  )
})

test('text-only summary source keeps only user/assistant text blocks', async () => {
  const events = surfaceEvents()
  events.push({ seq: 5, type: 'assistant/message', data: { turn: 1, step: 2, message: { id: 'a2', role: 'assistant', content: [{ type: 'text', text: 'answer text' }, { type: 'reasoning', text: 'hidden reasoning' }, { type: 'tool-call', id: 'call-1', name: 'bash', arguments: '{}' }] } }, surfaceOp: 'append' })
  const { patchesOf } = await import('../lib/edits.js')
  const { turnIndex } = await import('../lib/surface.js')
  const bySeq = new Map(events.map((event) => [event.seq, event]))
  const turns = turnIndex(events)
  const shadowed = [2, 3, 4, 5]
  const full = __internals.sourceTextFor(events, bySeq, turns, shadowed, patchesOf(events), false)
  assert.match(full, /tool result/)
  assert.match(full, /tool call bash/)
  const textOnly = __internals.sourceTextFor(events, bySeq, turns, shadowed, patchesOf(events), true)
  assert.match(textOnly, /hi/)
  assert.match(textOnly, /hello/)
  assert.match(textOnly, /answer text/)
  assert.doesNotMatch(textOnly, /tool result/)
  assert.doesNotMatch(textOnly, /tool call/)
  assert.doesNotMatch(textOnly, /hidden reasoning/)
})

test('summarizeOperation writes a summary at compression time and follows the tone', async () => {
  const prompts = []
  const ctx = {
    get(name) {
      if (name !== 'llm') return undefined
      return {
        stream(request) {
          prompts.push(request.messages[0].content[0].text)
          return (async function* () {
            yield { type: 'text-delta', text: ' 摘要正文 ' }
            yield { type: 'finish', reason: { kind: 'stop' } }
          })()
        },
      }
    },
  }
  const live = { requestHeader: () => ({ config: { provider: 'p', model: 'm' } }) }
  const events = surfaceEvents()
  const minor = await __internals.summarizeOperation(ctx, {}, live, events, {
    kind: 'summary', startSeq: 2, endSeq: 3, shadowed: [2, 3], tone: 'minor',
  }, {})
  assert.equal(minor, '摘要正文')
  assert.match(prompts[0], /次要/)
  assert.match(prompts[0], /hi/)
  assert.match(prompts[0], /hello/)

  await __internals.summarizeOperation(ctx, {}, live, events, {
    kind: 'summary', startSeq: 2, endSeq: 3, shadowed: [2, 3], tone: 'normal',
  }, { textOnly: true })
  assert.match(prompts[1], /默认/)
  assert.doesNotMatch(prompts[1], /think/, 'text-only summaries omit reasoning')
})

test('capabilities probe the agent-scoped /compact command, not a root service', async () => {
  const agent = { ctx: {} }
  const definition = { name: 'compact' }
  const makeCtx = (found) => ({
    get(name) {
      if (name === 'commands') {
        return {
          find(received, command) {
            return received === agent && command === 'compact' ? found : undefined
          },
          execute() {},
        }
      }
      if (name === 'sessionController') {
        return { resolveAgent: async () => ({ agent }) }
      }
      return undefined
    },
  })
  assert.deepEqual(await __internals.capabilitiesOf(makeCtx(definition), 'session-1', true, {}), {
    edit: true,
    patch: true,
    compaction: true,
  })
  assert.equal((await __internals.capabilitiesOf(makeCtx(undefined), 'session-1', true, {})).compaction, false)
  assert.equal((await __internals.capabilitiesOf(makeCtx(definition), 'session-1', true, undefined)).compaction, false, 'no live agent means no compaction')
  assert.equal(__internals.compactionCommandOf({ get: () => undefined }, agent), null)
})

test('stateOf reports official compaction from the agent-scoped /compact command', async () => {
  const agent = { ctx: {} }
  const live = { header: { cwd: '/work' }, snapshotEvents: () => surfaceEvents() }
  const makeCtx = (hasCompact) => ({
    get(name) {
      if (name === 'sessions') return { get: (id) => (id === 'session-1' ? live : undefined) }
      if (name === 'sessionController') return { resolveAgent: async () => ({ agent }) }
      if (name === 'commands') {
        return {
          find: () => (hasCompact ? { name: 'compact' } : undefined),
          execute: async () => undefined,
        }
      }
      return undefined
    },
  })
  const state = await __internals.stateOf(makeCtx(true), 'session-1', true)
  assert.equal(state.version, PACKAGE.version)
  assert.equal(state.live, true)
  assert.equal(state.busy, false)
  assert.equal(state.capabilities.compaction, true)
  assert.equal(state.capabilities.patch, true)

  const without = await __internals.stateOf(makeCtx(false), 'session-1', true)
  assert.equal(without.capabilities.compaction, false)
})
