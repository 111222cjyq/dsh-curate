// Route-level and transport-level tests for the dsh-curate host half.
//
// The original suite only exercised pure functions plus a fake route capture;
// the defects found in the host audit (chunked-body decoding, byte limits,
// malformed query strings, stale-before-plan ordering, cold-session metadata,
// audit-record module mismatches) all live at the HTTP/route boundary. These
// tests mount the real `apply()` on a minimal Cordis-like context and dispatch
// handlers with real request/response shapes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { __internals, PLUGIN_VERSION, apply } from '../lib/index.js'

const PACKAGE = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const LIVE_ID = 'session-11111111-2222-3333-4444-555555555555'
const COLD_ID = 'session-99999999-8888-7777-6666-555555555555'

function surfaceEvents() {
  return [
    { seq: 0, type: 'system/message', data: { message: { id: 's1', role: 'system', content: [{ type: 'text', text: 'sys' }] } }, surfaceOp: 'append' },
    { seq: 1, type: 'turn/start', data: { turn: 1 } },
    { seq: 2, type: 'user/message', data: { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'hi' }] }, surfaceOp: 'append' },
    { seq: 3, type: 'assistant/message', data: { turn: 1, step: 1, message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: 'hello' }] } }, surfaceOp: 'append' },
    { seq: 4, type: 'user/message', data: { id: 'u2', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'bye' }] }, surfaceOp: 'append' },
    { seq: 5, type: 'turn/end', data: { turn: 1 } },
  ]
}

function makeReq({ method = 'GET', url = '/', headers = {}, body = null, chunks = null }) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: '127.0.0.1:3080', ...headers }
  req.socket = { remoteAddress: '127.0.0.1' }
  queueMicrotask(() => {
    try {
      if (chunks !== null) {
        for (const chunk of chunks) req.emit('data', Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      } else if (body !== null) {
        req.emit('data', Buffer.isBuffer(body) ? body : Buffer.from(body))
      }
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

/** Mount the plugin and return a dispatcher for its six routes. */
function mount({ live = true, coldCwd = '/cold/work', liveCwd = '/live/work', events = surfaceEvents(), sessionQuery = null } = {}) {
  const routes = new Map()
  const session = {
    id: LIVE_ID,
    header: { cwd: liveCwd },
    events,
    snapshotEvents: () => events,
    requestHeader: () => ({ config: { provider: 'test-provider', model: 'test-model' } }),
    append(type, data, options) {
      const event = { type, data, seq: this.events.length, ...(options || {}) }
      this.events.push(event)
      return event
    },
  }
  const sessions = {
    messageProjections: [],
    get(id) {
      if (!live) return undefined
      return id === LIVE_ID || id === LIVE_ID.slice('session-'.length) ? session : undefined
    },
    registerMessageProjection(projection) {
      this.messageProjections.push(projection)
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
      if (name === 'sessionQuery') {
        if (sessionQuery === null && live) return undefined
        return {
          readSession: async () => ({
            events,
            session: { cwd: coldCwd, id: COLD_ID },
            inheritedEventCount: 0,
          }),
        }
      }
      return undefined
    },
    effect(fn) {
      const dispose = fn()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    inject(dependencies, callback) {
      if (typeof dependencies === 'function') dependencies()
      else callback({ webServer })
    },
  }
  apply(ctx, {})
  return async function dispatch(path, request) {
    const handler = routes.get(path)
    assert.ok(handler, `route ${path} must be registered`)
    const res = makeRes()
    await handler(request, res)
    await res.done
    return res
  }
}

function jsonBody(value) {
  return { body: JSON.stringify(value), headers: { 'content-type': 'application/json' } }
}

function parse(res) {
  return JSON.parse(res.text)
}

test('PLUGIN_VERSION is the package version (single source of truth)', () => {
  assert.equal(PLUGIN_VERSION, PACKAGE.version)
  assert.match(PLUGIN_VERSION, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
})

test('GET /state returns the version, cwd and nodes of a live session', async () => {
  const dispatch = mount()
  const res = await dispatch('/dsh-curate/state', makeReq({ url: `/dsh-curate/state?sessionId=${LIVE_ID}` }))
  assert.equal(res.status, 200)
  const body = parse(res)
  assert.equal(body.ok, true)
  assert.equal(body.version, PACKAGE.version)
  assert.equal(body.live, true)
  assert.equal(body.cwd, '/live/work')
  assert.equal(body.busy, false)
  assert.deepEqual(body.nodes.map((node) => node.seq), [0, 2, 3, 4])
  assert.equal(body.capabilities.patch, true)
})

test('GET /state keeps the cwd of a cold session from the query snapshot', async () => {
  const dispatch = mount({ live: false, coldCwd: '/cold/work' })
  const res = await dispatch('/dsh-curate/state', makeReq({ url: `/dsh-curate/state?sessionId=${COLD_ID}` }))
  assert.equal(res.status, 200)
  const body = parse(res)
  assert.equal(body.live, false)
  assert.equal(body.cwd, '/cold/work')
})

test('GET /state accepts the id with and without the session- prefix', async () => {
  const dispatch = mount()
  for (const id of [LIVE_ID, LIVE_ID.slice('session-'.length)]) {
    const res = await dispatch('/dsh-curate/state', makeReq({ url: `/dsh-curate/state?sessionId=${id}` }))
    assert.equal(res.status, 200, id)
  }
})

test('malformed percent-encoding is a 400, not a 500', async () => {
  const dispatch = mount()
  const content = await dispatch('/dsh-curate/content', makeReq({ url: `/dsh-curate/content?sessionId=${LIVE_ID}&startSeq=2&endSeq=%zz` }))
  assert.equal(content.status, 400)
  assert.equal(parse(content).code, 'invalid')
  const message = await dispatch('/dsh-curate/message', makeReq({ url: `/dsh-curate/message?sessionId=${LIVE_ID}&seq=%E0%A4%A` }))
  assert.equal(message.status, 400)
})

test('missing or malformed seq parameters are 400s', async () => {
  const dispatch = mount()
  const missing = await dispatch('/dsh-curate/message', makeReq({ url: `/dsh-curate/message?sessionId=${LIVE_ID}` }))
  assert.equal(missing.status, 400)
  const text = await dispatch('/dsh-curate/content', makeReq({ url: `/dsh-curate/content?sessionId=${LIVE_ID}&startSeq=nope&endSeq=3` }))
  assert.equal(text.status, 400)
  const negative = await dispatch('/dsh-curate/content', makeReq({ url: `/dsh-curate/content?sessionId=${LIVE_ID}&startSeq=-1&endSeq=3` }))
  assert.equal(negative.status, 400)
})

test('guard rejects non-loopback peers, a foreign Host header and cross-origin requests', async () => {
  const dispatch = mount()
  const remote = makeReq({ url: `/dsh-curate/state?sessionId=${LIVE_ID}` })
  remote.socket.remoteAddress = '10.0.0.9'
  assert.equal((await dispatch('/dsh-curate/state', remote)).status, 403)
  assert.equal((await dispatch('/dsh-curate/state', makeReq({ url: `/dsh-curate/state?sessionId=${LIVE_ID}`, headers: { host: 'evil.example' } }))).status, 403)
  assert.equal((await dispatch('/dsh-curate/state', makeReq({ url: `/dsh-curate/state?sessionId=${LIVE_ID}`, headers: { origin: 'http://evil.example' } }))).status, 403)
  const sameOrigin = await dispatch('/dsh-curate/state', makeReq({ url: `/dsh-curate/state?sessionId=${LIVE_ID}`, headers: { origin: 'http://127.0.0.1:3080' } }))
  assert.equal(sameOrigin.status, 200)
})

test('method and body validation answer 405/400/413', async () => {
  const dispatch = mount()
  assert.equal((await dispatch('/dsh-curate/state', makeReq({ method: 'POST', url: `/dsh-curate/state?sessionId=${LIVE_ID}` }))).status, 405)
  const malformed = await dispatch('/dsh-curate/edit', makeReq({ method: 'POST', url: '/dsh-curate/edit', ...jsonBodyRaw('{oops') }))
  assert.equal(malformed.status, 400)
  const oversized = await dispatch('/dsh-curate/edit', makeReq({ method: 'POST', url: '/dsh-curate/edit', body: 'a'.repeat(4 * 1024 * 1024 + 1) }))
  assert.equal(oversized.status, 413)
  assert.equal(parse(oversized).code, 'too-large')
})

function jsonBodyRaw(raw) {
  return { body: raw, headers: { 'content-type': 'application/json' } }
}

test('readBody decodes a multi-byte character split across chunks', async () => {
  const buffer = Buffer.from('{"text":"中文内容测试"}', 'utf8')
  const cut = buffer.indexOf(Buffer.from('中', 'utf8')) + 1 // split inside the first CJK character
  const req = makeReq({ chunks: [buffer.subarray(0, cut), buffer.subarray(cut)] })
  const text = await __internals.readBody(req, 1024)
  assert.equal(text.includes('\uFFFD'), false)
  assert.deepEqual(JSON.parse(text), { text: '中文内容测试' })
})

test('readBody caps on bytes, not on UTF-16 code units', async () => {
  const payload = Buffer.from('中'.repeat(100), 'utf8') // 300 bytes, 100 chars
  await assert.rejects(
    () => __internals.readBody(makeReq({ chunks: [payload.subarray(0, 80), payload.subarray(80)] }), 120),
    (error) => error && error.status === 413 && error.code === 'too-large',
  )
})

test('every write route requires a valid expectedLastSeq', async () => {
  const dispatch = mount()
  const missing = await dispatch('/dsh-curate/edit', makeReq({
    method: 'POST', url: '/dsh-curate/edit',
    ...jsonBody({ sessionId: LIVE_ID, confirm: true, edits: [{ seq: 2, mode: 'prompt', text: 'edited prompt' }] }),
  }))
  assert.equal(missing.status, 400)
  assert.equal(parse(missing).code, 'invalid')
  const stringy = await dispatch('/dsh-curate/edit', makeReq({
    method: 'POST', url: '/dsh-curate/edit',
    ...jsonBody({ sessionId: LIVE_ID, confirm: true, expectedLastSeq: '5', edits: [{ seq: 2, mode: 'prompt', text: 'edited prompt' }] }),
  }))
  assert.equal(stringy.status, 400)
})

test('staleness is checked before plan validation', async () => {
  const dispatch = mount()
  // Without an auto-summarize flag this plan would be rejected as
  // `missing-summary`; the stale guard must win because the client lost a race.
  const res = await dispatch('/dsh-curate/apply', makeReq({
    method: 'POST', url: '/dsh-curate/apply',
    ...jsonBody({
      sessionId: LIVE_ID,
      confirm: true,
      expectedLastSeq: 999,
      ops: [{ kind: 'summary', startSeq: 2, endSeq: 3 }],
    }),
  }))
  assert.equal(res.status, 409)
  assert.equal(parse(res).code, 'stale')
})

test('writes refuse a cold session instead of resuming it', async () => {
  const dispatch = mount({ live: false })
  for (const path of ['/dsh-curate/apply', '/dsh-curate/edit', '/dsh-curate/compact']) {
    const res = await dispatch(path, makeReq({
      method: 'POST', url: path,
      ...jsonBody({ sessionId: COLD_ID, confirm: true, expectedLastSeq: 5, ops: [], edits: [] }),
    }))
    assert.equal(res.status, 409, path)
    assert.equal(parse(res).code, 'session-not-active', path)
  }
})

test('official /compact failures keep their stable codes', () => {
  const cases = [
    ['Compaction is unavailable because this process has an active compaction, or the agent is not idle.', 409, 'busy'],
    ['Compaction cancelled.', 409, 'cancelled'],
    ['The history selected for compaction changed before it could be replaced. The attempt is recorded in the session log.', 409, 'stale'],
    ['Compaction could not produce a useful summary. The attempt is recorded in the session log.', 502, 'compaction-summary'],
    ['Compaction did not finish cleanly; some session history may have changed. Inspect the current session state before retrying.', 500, 'compaction-partial'],
    ['Compaction finished, but the session could not be saved.', 500, 'compaction-persistence'],
    ['Usage: /compact (no arguments)', 400, 'invalid'],
  ]
  for (const [text, status, code] of cases) {
    const error = __internals.officialCompactError(text)
    assert.equal(error.status, status, text)
    assert.equal(error.code, code, text)
  }
  const generic = __internals.officialCompactError('something else happened')
  assert.equal(generic.status, 409)
  assert.equal(generic.code, 'compaction-failed')
  assert.equal(generic.message, 'something else happened')
})

test('an appendPluginRecord instance mismatch becomes a clear 409', () => {
  const foreignSession = { snapshotEvents: () => surfaceEvents() }
  assert.throws(
    () => __internals.appendRecordOrThrow(foreignSession, 'plugin:dsh-curate/plan', { version: 1 }),
    (error) => error && error.status === 409 && error.code === 'unsupported',
  )
})

test('/state previews shrink for very large surfaces', async () => {
  const events = []
  events.push({ seq: 0, type: 'system/message', data: { message: { id: 's', role: 'system', content: [{ type: 'text', text: 'sys' }] } }, surfaceOp: 'append' })
  for (let index = 0; index < 900; index += 1) {
    events.push({
      seq: index + 1,
      type: 'assistant/message',
      data: { turn: 1, message: { id: `a${index}`, role: 'assistant', content: [{ type: 'text', text: `message ${index} `.padEnd(500, 'x') }] } },
      surfaceOp: 'append',
    })
  }
  const dispatch = mount({ events })
  const res = await dispatch('/dsh-curate/state', makeReq({ url: `/dsh-curate/state?sessionId=${LIVE_ID}` }))
  assert.equal(res.status, 200)
  const body = parse(res)
  assert.ok(body.nodes.length > 800)
  assert.ok(body.nodes[1].preview.length <= 240, `preview=${body.nodes[1].preview.length}`)
})

test('flushSession reports the real durability outcome', async () => {
  const session = {}
  const ok = await __internals.flushSession({
    get(name) {
      if (name === 'sessions') return { flush: async () => true }
      return undefined
    },
  }, session)
  assert.equal(ok.flushed, true)
  const skipped = await __internals.flushSession({
    get(name) {
      if (name === 'sessions') return { flush: async () => false }
      if (name === 'sessionPersistence') return { flush: async () => true }
      return undefined
    },
  }, session)
  assert.equal(skipped.flushed, true, 'the persistence fallback still flushes')
  const failed = await __internals.flushSession({
    get(name) {
      if (name === 'sessions') return { flush: async () => false }
      if (name === 'sessionPersistence') return { flush: async () => false }
      return undefined
    },
  }, session)
  assert.equal(failed.flushed, false)
  assert.match(failed.flushError, /no flush handler/)
})
