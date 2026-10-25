// Integration proof that curation writes reach the model-visible context.
//
// The other host tests use a fake session at the route boundary. The question
// "did the edit/compression actually enter the model context?" can only be
// answered by the real `@deepseek-ai/dsh-session` fold: append through the
// plugin routes, then derive messages exactly as the harness does.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Session, deriveEventMessage, foldSurface } from '@deepseek-ai/dsh-session'
import { apply } from '../lib/index.js'
import { patchProjection } from '../lib/edits.js'

const SESSION_ID = 'session-11111111-2222-3333-4444-555555555555'
const BACKUP_DIR = mkdtempSync(join(tmpdir(), 'dsh-curate-apply-'))
process.env.DSH_CURATE_BACKUP_DIR = BACKUP_DIR
process.on('exit', () => {
  try {
    rmSync(BACKUP_DIR, { recursive: true, force: true })
  } catch {}
})

/** A compact but valid session: three turns, no open turn, no tool pairs. */
function seedEvents() {
  const raw = [
    { type: 'system/message', data: { message: { id: 's', role: 'system', source: { kind: 'system-prompt' }, content: [{ type: 'text', text: 'system prompt' }] } }, surfaceOp: 'append' },
    { type: 'turn/start', data: { turn: 1 } },
    { type: 'user/message', data: { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'first question' }] }, surfaceOp: 'append' },
    { type: 'assistant/message', data: { turn: 1, step: 1, stream: [], message: { id: 'a1', role: 'assistant', source: { kind: 'model', provider: 'test-provider', model: 'test-model' }, content: [{ type: 'text', text: 'first answer' }] } }, surfaceOp: 'append' },
    { type: 'turn/end', data: { turn: 1 } },
    { type: 'turn/start', data: { turn: 2 } },
    { type: 'user/message', data: { id: 'u2', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'second question' }] }, surfaceOp: 'append' },
    { type: 'assistant/message', data: { turn: 2, step: 1, stream: [], message: { id: 'a2', role: 'assistant', source: { kind: 'model', provider: 'test-provider', model: 'test-model' }, content: [{ type: 'text', text: 'second answer' }] } }, surfaceOp: 'append' },
    { type: 'turn/end', data: { turn: 2 } },
    { type: 'turn/start', data: { turn: 3 } },
    { type: 'user/message', data: { id: 'u3', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'latest question' }] }, surfaceOp: 'append' },
    { type: 'turn/end', data: { turn: 3 } },
  ]
  return raw.map((event, index) => ({ ...event, seq: index, time: index }))
}

function makeSession() {
  return Session.create(
    SESSION_ID,
    seedEvents(),
    { version: 4, id: SESSION_ID, createdAt: 1, isSeeded: false, cwd: '/work' },
    undefined,
    [patchProjection()],
  )
}

function makeReq({ method = 'GET', url = '/', headers = {}, body = null }) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: '127.0.0.1:3080', ...headers }
  req.socket = { remoteAddress: '127.0.0.1' }
  queueMicrotask(() => {
    try {
      if (body !== null) req.emit('data', Buffer.from(body))
      req.emit('end')
    } catch (error) {
      req.emit('error', error)
    }
  })
  return req
}

function makeRes() {
  let settle
  const done = new Promise((resolve) => { settle = resolve })
  return {
    status: 0,
    headers: {},
    text: '',
    writeHead(status, headers) {
      this.status = status
      this.headers = headers || {}
    },
    end(payload) {
      this.text = typeof payload === 'string' ? payload : ''
      settle(this)
    },
    done,
  }
}

function post(value) {
  return { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) }
}

function parse(res) {
  return JSON.parse(res.text)
}

/** Mount the real plugin on a fake Cordis context around a real Session. */
function mount(session) {
  const routes = new Map()
  const summaries = []
  const llm = {
    stream(request) {
      summaries.push(request)
      return (async function* () {
        yield { type: 'text-delta', text: '压缩摘要正文' }
        yield { type: 'finish', reason: { kind: 'stop' } }
      })()
    },
  }
  const sessions = {
    messageProjections: [],
    get(id) {
      return id === session.id || id === session.id.slice('session-'.length) ? session : undefined
    },
    registerMessageProjection(projection) {
      sessions.messageProjections.push(projection)
      return () => {}
    },
    flush: async () => true,
  }
  const webServer = {
    register(definition) {
      routes.set(definition.path, definition.handler)
      return () => {}
    },
  }
  const ctx = {
    get(name) {
      if (name === 'webServer') return webServer
      if (name === 'sessions') return sessions
      if (name === 'llm') return llm
      return undefined
    },
    effect(fn) {
      const dispose = fn()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    inject(_dependencies, callback) {
      callback({ webServer })
    },
  }
  apply(ctx, { provider: 'test-provider', model: 'test-model' })
  return {
    summaries,
    async dispatch(path, request) {
      const handler = routes.get(path)
      assert.ok(handler, `route ${path} must be registered`)
      const res = makeRes()
      await handler(request, res)
      await res.done
      return res
    },
  }
}

/** The model-visible messages of one session, exactly as DSH derives them. */
function derivedMessages(session) {
  const events = session.snapshotEvents()
  const folded = foldSurface(events, [patchProjection()])
  return {
    nodes: folded.nodes,
    messages: folded.nodes
      .map((seq) => deriveEventMessage(events[seq], folded.projectedMessages))
      .filter(Boolean),
  }
}

function textOf(message) {
  return (message.content || [])
    .filter((block) => block && block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}

test('compression writes Default summaries and drops Minor ranges in the model context', async () => {
  const session = makeSession()
  const lastSeq = session.snapshotEvents().at(-1).seq
  const { dispatch, summaries } = mount(session)
  const res = await dispatch('/dsh-curate/apply', makeReq({
    method: 'POST',
    url: '/dsh-curate/apply',
    ...post({
      sessionId: SESSION_ID,
      expectedLastSeq: lastSeq,
      confirm: true,
      autoSummarize: true,
      ops: [
        { kind: 'summary', startSeq: 2, endSeq: 3, tone: 'normal' },
        { kind: 'drop', startSeq: 6, endSeq: 7, tone: 'minor' },
      ],
    }),
  }))
  assert.equal(res.status, 200)
  const body = parse(res)
  assert.equal(body.applied.length, 2)
  assert.equal(summaries.length, 1, 'only the Default range asks the model for a summary')
  assert.deepEqual(body.applied.map((item) => item.kind), ['summary', 'drop'])

  const { nodes, messages } = derivedMessages(session)
  assert.ok(!nodes.includes(2) && !nodes.includes(3), 'the replaced Default range left the surface')
  assert.ok(!nodes.includes(6) && !nodes.includes(7), 'the dropped Minor range left the surface')
  const texts = messages.map(textOf)
  assert.ok(
    texts.some((text) => text.includes('【上下文整理摘要】') && text.includes('压缩摘要正文')),
    'the model sees the generated summary in place of the Default range',
  )
  assert.ok(
    texts.some((text) => text.includes('已直接丢弃') && !text.includes('压缩摘要正文')),
    'the model sees only an omission marker for the Minor range',
  )
  assert.ok(texts.some((text) => text === 'latest question'), 'the kept tail is still in the model context')
  assert.ok(!texts.some((text) => text.includes('first question')), 'the replaced original is no longer visible')
  assert.ok(!texts.some((text) => text.includes('second answer')), 'the dropped original is no longer visible')
})

test('a reply edit is projected into the model context without adding a turn', async () => {
  const session = makeSession()
  const lastSeq = session.snapshotEvents().at(-1).seq
  const before = session.snapshotEvents().filter((event) => event.type === 'turn/start').length
  const { dispatch } = mount(session)
  const res = await dispatch('/dsh-curate/edit', makeReq({
    method: 'POST',
    url: '/dsh-curate/edit',
    ...post({
      sessionId: SESSION_ID,
      expectedLastSeq: lastSeq,
      confirm: true,
      edits: [{ seq: 3, mode: 'reply', blockIndex: 0, kind: 'text', text: '改写后的回答' }],
    }),
  }))
  assert.equal(res.status, 200)
  assert.equal(parse(res).applied.length, 1)

  const { messages } = derivedMessages(session)
  assert.ok(messages.some((message) => message.role === 'assistant' && textOf(message) === '改写后的回答'),
    'the model derives the edited reply text')
  assert.ok(!messages.some((message) => textOf(message).includes('first answer')),
    'the original reply no longer reaches the model')
  assert.equal(session.snapshotEvents().filter((event) => event.type === 'turn/start').length, before,
    'editing a reply does not start a new turn')
})

test('a prompt edit replaces the model-visible user message in place', async () => {
  const session = makeSession()
  const lastSeq = session.snapshotEvents().at(-1).seq
  const { dispatch } = mount(session)
  const res = await dispatch('/dsh-curate/edit', makeReq({
    method: 'POST',
    url: '/dsh-curate/edit',
    ...post({
      sessionId: SESSION_ID,
      expectedLastSeq: lastSeq,
      confirm: true,
      edits: [{ seq: 6, mode: 'prompt', text: '改写后的第二问' }],
    }),
  }))
  assert.equal(res.status, 200)
  assert.equal(parse(res).applied.length, 1)
  const { messages } = derivedMessages(session)
  assert.ok(messages.some((message) => message.role === 'user' && textOf(message) === '改写后的第二问'),
    'the model sees the rewritten prompt')
  assert.ok(!messages.some((message) => textOf(message).includes('second question')),
    'the original prompt no longer reaches the model')
})
