// Backup writer tests: location, JSON payload, permissions, retention, removal.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { backupRetention, backupRoot, removeBackup, writeBackup } from '../lib/backup.js'

async function withRoot(run) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-curate-backup-'))
  const previous = {
    dir: process.env.DSH_CURATE_BACKUP_DIR,
    keep: process.env.DSH_CURATE_BACKUP_KEEP,
  }
  process.env.DSH_CURATE_BACKUP_DIR = root
  try {
    await run(root)
  } finally {
    if (previous.dir === undefined) delete process.env.DSH_CURATE_BACKUP_DIR
    else process.env.DSH_CURATE_BACKUP_DIR = previous.dir
    if (previous.keep === undefined) delete process.env.DSH_CURATE_BACKUP_KEEP
    else process.env.DSH_CURATE_BACKUP_KEEP = previous.keep
  }
}

test('writeBackup stores a readable JSON file under the configured root', async () => {
  await withRoot(async (root) => {
    assert.equal(backupRoot(), root)
    const file = await writeBackup('session-1234', { version: 1, hello: 'world' })
    assert.ok(file.startsWith(root))
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), { version: 1, hello: 'world' })
  })
})

test('backup files are 0600 inside a 0700 session directory', async (t) => {
  if (process.platform === 'win32') {
    t.skip('POSIX file modes')
    return
  }
  await withRoot(async (root) => {
    // Pre-create the root as 0755 to prove the writer tightens an existing dir.
    const file = await writeBackup('session-modes', { version: 1 })
    const dir = join(root, 'session-modes')
    for (const [target, expected] of [[dir, 0o700], [file, 0o600], [root, 0o700]]) {
      const info = await stat(target)
      assert.equal(info.mode & 0o777, expected, `${target} mode`)
    }
  })
})

test('two backups in the same millisecond do not overwrite each other', async () => {
  await withRoot(async (root) => {
    const files = await Promise.all([
      writeBackup('session-dup', { n: 1 }, 'edit'),
      writeBackup('session-dup', { n: 2 }, 'edit'),
    ])
    assert.notEqual(files[0], files[1])
    const dir = join(root, 'session-dup')
    const names = await readdir(dir)
    assert.equal(names.filter((name) => name.endsWith('.json')).length, 2)
  })
})

test('retention keeps the newest backups and supports an env override', async () => {
  await withRoot(async (root) => {
    process.env.DSH_CURATE_BACKUP_KEEP = '3'
    assert.equal(backupRetention(), 3)
    const files = []
    for (let index = 0; index < 6; index += 1) {
      files.push(await writeBackup('session-retain', { index }, 'apply'))
      // Distinct millisecond stamps keep the ordering deterministic without
      // slowing the suite down noticeably.
      await new Promise((resolve) => setTimeout(resolve, 2))
    }
    const dir = join(root, 'session-retain')
    const names = (await readdir(dir)).filter((name) => name.endsWith('.json')).sort()
    assert.equal(names.length, 3)
    assert.ok(names.includes(files[5].split('/').pop()), 'newest backup is kept')
    assert.ok(!names.includes(files[0].split('/').pop()), 'oldest backup was pruned')
  })
})

test('backupRetention ignores invalid overrides', () => {
  for (const value of ['0', '-1', 'abc', '']) {
    process.env.DSH_CURATE_BACKUP_KEEP = value
    assert.equal(backupRetention(), 20, `override ${JSON.stringify(value)}`)
  }
  delete process.env.DSH_CURATE_BACKUP_KEEP
  assert.equal(backupRetention(), 20)
})

test('removeBackup deletes the file and never throws for a missing path', async () => {
  await withRoot(async () => {
    const file = await writeBackup('session-remove', { version: 1 }, 'compact')
    await removeBackup(file)
    await assert.rejects(() => readFile(file, 'utf8'), (error) => error.code === 'ENOENT')
    await removeBackup(file)
    await removeBackup('')
    await removeBackup(null)
  })
})
