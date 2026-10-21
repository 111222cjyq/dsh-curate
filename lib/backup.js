// dsh-curate - local backup writer.
//
// The apply path is destructive for the model-visible context and the append is
// irreversible, so every apply writes a self-contained JSON backup first. The
// file records what each replaced window held, so a human can recover a message
// by hand even after the plugin is gone.
//
// Backups contain full transcripts (including tool output and image payloads),
// so files are written 0600 inside 0700 directories: the DSH session store uses
// the same modes. A bounded retention (default 20 per session) keeps the tree
// from growing without limit; override with DSH_CURATE_BACKUP_KEEP.
import { randomBytes } from 'node:crypto'
import { chmod, mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Default number of backups retained per session. */
const DEFAULT_RETENTION = 20

/** The root of the backup tree; override with DSH_CURATE_BACKUP_DIR. */
export function backupRoot() {
  const override = process.env.DSH_CURATE_BACKUP_DIR
  if (typeof override === 'string' && override.trim() !== '') return override.trim()
  return join(homedir(), '.local', 'share', 'dsh-curate', 'backups')
}

/** How many backups one session keeps (positive safe integer, max 999). */
export function backupRetention() {
  const raw = process.env.DSH_CURATE_BACKUP_KEEP
  const value = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN
  return Number.isInteger(value) && value > 0 ? Math.min(value, 999) : DEFAULT_RETENTION
}

/** A filename-safe ISO timestamp (millisecond order sorts lexicographically). */
function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

/** Delete the oldest backups above the retention limit. Never throws. */
async function pruneBackups(dir) {
  try {
    const keep = backupRetention()
    const names = (await readdir(dir)).filter((name) => name.endsWith('.json')).sort()
    for (const name of names.slice(0, Math.max(0, names.length - keep))) {
      await unlink(join(dir, name)).catch(() => {})
    }
  } catch {
    // Retention is best effort: never fail a backup because pruning did.
  }
}

/**
 * Write one backup file.
 * @param sessionId - the session the plan applies to.
 * @param payload - JSON-serializable backup document.
 * @param suffix - short operation label used in the filename (default 'apply').
 * @returns the absolute file path.
 */
export async function writeBackup(sessionId, payload, suffix = 'apply') {
  const root = backupRoot()
  const dir = join(root, String(sessionId))
  await mkdir(dir, { recursive: true, mode: 0o700 })
  // mkdir's mode is ignored for an existing directory; enforce it explicitly.
  await chmod(root, 0o700).catch(() => {})
  await chmod(dir, 0o700).catch(() => {})
  const label = typeof suffix === 'string' && suffix.trim() !== '' ? suffix.trim().replace(/[^a-z0-9-]/gi, '-') : 'apply'
  // Random suffix: two writes in the same millisecond must not overwrite one
  // another (and the audit record must point at the file it actually wrote).
  const file = join(dir, `${stamp()}-${randomBytes(4).toString('hex')}-${label}.json`)
  await writeFile(file, JSON.stringify(payload, null, 2), { encoding: 'utf8', mode: 0o600 })
  await chmod(file, 0o600).catch(() => {})
  await pruneBackups(dir)
  return file
}

/**
 * Remove one backup file (used when an operation turned out to be a no-op).
 * @param file - absolute path returned by {@link writeBackup}.
 */
export async function removeBackup(file) {
  if (typeof file !== 'string' || file === '') return
  await unlink(file).catch(() => {})
}
