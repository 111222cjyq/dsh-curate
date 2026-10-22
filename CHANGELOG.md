# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries before 0.3.0 are not recorded in the working tree as of 2026-10-21 and
must be reconstructed from the repository history after the first push. The
0.4.1 entry is dated from the working-tree file timestamps; confirm it against
the actual release history before publishing.

## [0.5.1] - 2026-10-22

### Fixed

- Clicking **Compress context** while the workbench body was scrolled down
  opened the compression sheet above the viewport (browsers keep the scroll
  anchor), so the button looked dead. The sheet now scrolls into view and takes
  focus when it opens.
- On a busy session the footer compress button is no longer a silently disabled
  control: it explains the busy state in a toast/title, and the footer note shows
  the reason even when the body is scrolled.

## [0.5.0] - 2026-10-21

### Fixed — browser half

- Saved drafts survive a session that grew after the draft was written: tones
  and staged edits are restored by message seq, the panel says it restored an
  earlier state, and an empty autosave no longer overwrites the saved draft.
  Draft schema is v4 (v2/v3 drafts are still read).
- "Save current content" now reports a real storage failure (quota, private
  window) instead of claiming success; closing the panel flushes the pending
  debounced draft instead of losing the last change.
- The workbench follows the host locale service (immediate language switch)
  instead of `navigator.language`, and the block-switch confirmation is an
  in-panel confirm instead of a native `window.confirm`.
- Partial failures never leave a stale surface: every failure path reloads the
  context; a new "Refresh context" control recovers from 409 `stale`/`busy`;
  host error codes are mapped to localized messages.
- A compression segment can no longer split an incomplete tool-call unit at the
  kept tail (the host would reject it as `tool-pair`).
- Large full-text expansions render incrementally (first messages, then "show
  more") instead of sanitizing hundreds of markdown blocks in one pass.
- Accessibility: the overlay dialog has an accessible name, Escape and a focus
  trap, icon-only buttons have labels, and toggle groups expose `aria-pressed`.
- Undo restores the view switches too; a refused merge explains itself.
- Loading is cancellable, so a superseded refresh cannot overwrite newer state.

### Fixed — host half

- Request bodies are decoded as UTF-8 once (a multi-byte character split across
  TCP chunks used to be written to the session log as U+FFFD).
- The request body limit is enforced on bytes; malformed percent-encoding is a
  400 instead of a 500; empty `seq`/`startSeq`/`endSeq` are 400s.
- `expectedLastSeq` is required and validated, and staleness is checked before
  plan validation, so a race loser gets `409 stale` instead of a range error.
- Writes refuse a cold session instead of silently resuming it; cold `/state`
  reports the session header's `cwd`.
- Official `/compact` failure results keep stable codes (`busy`, `cancelled`,
  `stale`, `compaction-summary`, `compaction-partial`, `compaction-persistence`)
  instead of one generic 409; the response also carries `replacementSeq`, the
  new surface node the workbench focuses.
- A compact run with nothing to compact no longer leaves a multi-MB backup.
- Backup files are written 0600 in 0700 directories, get unique names, and keep
  at most 20 per session (`DSH_CURATE_BACKUP_KEEP` overrides).
- A cross-module `Session` instance mismatch surfaces as `409 unsupported`
  instead of a private-field TypeError.
- Large-surface `/state` payloads shrink their previews beyond 800 nodes.
- Version is single-sourced from `package.json`: the host reads it and the
  client build injects it, so a release bump cannot leave the halves out of
  sync.

### Changed

- Packaging: npm↔GitHub link (`repository`/`homepage`/`bugs`/`author`), DSH
  icon and zh/en display metadata, `engines.dsh >= 0.2.1-rc.2`, peer range
  narrowed to `^0.2.1-rc.2`, `publishConfig`, CI workflow (build-reproducibility
  guard + tests), `docs/release/` publish checklist, catalog entry draft and
  CHANGELOG.
- Tests: new `test/host-routes.test.mjs` (real route dispatch, chunked bodies,
  guards, status matrix, compaction error mapping) and `test/backup.test.mjs`
  (modes, uniqueness, retention); client tests cover draft salvage, storage
  failure, draft flush, a11y attributes and version injection.

## [0.4.1] - 2026-10-21

### Changed

- Message tone now only decides the compression range: the per-range
  "generate summary" button and the summary editor are gone. The model writes
  the summaries for the selected non-keep ranges after the compression is
  confirmed.
- `/state` probes the official compaction capability through the current agent
  preset's `/compact` command. This fixes "neither compression mode is
  available" on DSH web, where preset isolation had hidden the official
  compaction backend.

### Removed

- Per-range summary drafts and the summary editor.

## [0.4.0] - 2026-10 (before 0.4.1; exact date not recorded in the working tree)

### Added

- Per-message tone: `Important` (keep verbatim) / `Normal` / `Minor`, with
  turn-level batch presets on the group header and a mixed state for
  inconsistent groups.
- Range compression: each non-keep range gets one summary and is written in a
  single operation; keep ranges stay verbatim, so a turn can mix a verbatim
  answer with compressed tool output. Tool calls and their tool results form
  one tone unit. The last message is always kept.
- "Keep recent N turns" defaults the tail to keep and can be overridden per
  message or per turn.
- Local draft schema v3 for tone, view switches and staged edits.
- Built-in message editing (no longer requires `dsh-edit-turn`): user messages
  are replaced through the official surface replacement; assistant body /
  reasoning, tool results and injected context are rewritten through
  `plugin:dsh-curate/patch` records plus the message projection. Includes a
  block selector and keeps attachments byte-for-byte.

## [0.3.0] - 2026-10 (before 0.4.0; exact date not recorded in the working tree)

### Added

- Message editing with a source / rendered editor, staged `Save changes`, and
  `Apply to context` as the only write point. Edits never call the model.
- In-place rewrite of user messages (surface replacement), assistant replies,
  thinking blocks, tool results and injected context; the system prompt and
  tool-call arguments stay read-only.
- Local JSON backup and read-only audit records before every write.

[Unreleased]: https://github.com/OWNER/dsh-curate/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/OWNER/dsh-curate/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/OWNER/dsh-curate/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/OWNER/dsh-curate/releases/tag/v0.3.0
