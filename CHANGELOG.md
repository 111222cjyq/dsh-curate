# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries before 0.3.0 are not recorded in the working tree as of 2026-10-21 and
must be reconstructed from the repository history after the first push. The
0.4.1 entry is dated from the working-tree file timestamps; confirm it against
the actual release history before publishing.

## [0.7.5] - 2026-10-25

### Fixed

- **Hot reloads no longer invalidate live sessions.** DSH live Sessions remember
  the exact message-projection object they folded with. Re-registering a fresh
  object after a plugin reload produced
  `session message projection "plugin:dsh-curate/patch" was removed or replaced`.
  The host now caches the projection on `globalThis` and re-registers the same
  object after a reload; a race with an existing registration reuses it too.
- The workbench localizes that host error into an actionable message: a full
  `dsh web` restart is needed only for sessions that were already invalidated
  before this cache existed; local drafts are preserved.

### Notes

- Sessions broken by earlier hot reloads cannot be repaired in-process: restart
  `dsh web` once. Do not just disable/enable the plugin.
- New client test for the error mapping; the full suite is 137 tests.

## [0.7.4] - 2026-10-25

### Changed

- **Cancel now mirrors Save at the top of the editor.** The editor header shows
  “取消 / Cancel” beside “保存修改 / Save edit”, and the original Cancel/Save
  pair remains in the footer. Both ends are always visible immediately, even
  for long messages.

### Tests

- The editor render test now asserts both top actions exist and are enabled.

## [0.7.3] - 2026-10-25

### Changed

- **The editor now has a save action at both ends.** “保存修改 / Save edit” is
  available in the editor header next to the edit title (visible immediately)
  and remains in the editor footer. Long messages previously put the only save
  button below a 440px editor, so it was easy to edit and then not find how to
  stage the change.
- The footer of the workbench continues to be the place for “Apply edits to
  context” (the actual write) and “Save current content” (the local draft); the
  two save concepts remain explicitly separate.

### Tests

- The editor render test now asserts the top save action exists and is enabled
  alongside the footer pair. Full suite: 136 tests.

## [0.7.2] - 2026-10-25

### Fixed

- **A disabled “Apply to context” button now explains itself.** When there is
  no staged edit, the workbench footer says so and names the next step (open a
  message with the pencil, save the edit). Before, the footer was blank and the
  only visible clue was a stale-draft banner.
- When the saved draft cannot be restored because its messages are no longer on
  the current surface, the banner now offers **“清除旧草稿 / Clear old draft”**.
  Clearing signs out the protected draft so a fresh edit can be staged and
  applied; the footer also distinguishes “unrestorable draft” from “no pending
  edits”.

### Changed

- Clarified that “保存当前内容 / Save current content” only stores the local
  workbench draft and never writes the session; applying requires “修改并应用到
  上下文 / Apply edits to context”.

## [0.7.1] - 2026-10-25

### Added

- **Inline change marks.** The applied transcript now highlights the exact
  added/rewritten fragments instead of only marking the whole message. A pure
  deletion is shown as a small “原文删除 N 字” note; a replacement shows only
  the new text with the new word highlighted (no old/new text glued together).
- The “已修改” badge now includes the changed-part count (`已修改 · N 处`), and
  the detail dialog has a third **改动 / Changes** view with highlighted new
  text, struck-through old text and a legend.
- 3 new client diff tests (line/token LCS, multi-change counts, pure deletion
  note); the full suite is 136 tests.

### Changed

- Inline diff uses line-level LCS followed by token-level LCS; whitespace-only
  and indentation-only runs are ignored so formatting noise does not inflate
  the count. Very large rewrites fall back to a cheap common-prefix/suffix diff.
- The inline view intentionally shows only the applied version (deletions are
  summarized); the exact before/after comparison remains in the dialog.

## [0.7.0] - 2026-10-25

### Added

- **The real Chat transcript now shows the applied text.** A new read-only
  `GET /dsh-curate/changes` returns every prompt replacement and
  reply/tool/context patch with both the original and the exact text written
  into the model context. The browser decorates the matching Chat rows, shows
  an always-visible “Edited / 已修改” badge, and adds a header switch between
  the applied and original transcript. Clicking a badge opens the full
  original/applied text with copy support.
- **Display-only by design.** The decoration layer tracks and restores every
  DOM change on session switch, plugin unload and mode toggle; it never writes
  the session. The switch and modal are localized (Chinese/English), and the
  preference is stored in `localStorage`.
- 9 client display tests plus 4 host `/changes` tests; the live read-only check
  uses an existing patched session (original “凌晨三点”, applied “凌晨六点”)
  and verifies Chat text, badge, modal toggle and header switch.

### Changed

- The host advertises seven loopback routes (`/changes` added).
- Inline applied text is shown as plain text with preserved newlines (Markdown
  markers are unwrapped, not rendered) to keep the exact context text readable;
  the detail dialog keeps the raw full text.

## [0.6.0] - 2026-10-25

### Fixed

- **“查看完整内容” and “编辑” failed with HTTP 500.** `messageOf()` evaluated
  the append-text verdict before `truncated` was initialized, so every
  `/dsh-curate/message` request threw
  `Cannot access 'truncated' before initialization`. The cap result is now
  computed first, and route-level regression tests cover normal replies,
  reasoning-only replies and over-long messages.

### Changed

- **The tone scale is now Important / Default / Minor.** “Default” (formerly
  “Normal”) keeps the normal compression behaviour; “Minor” is no longer a
  shorter summary — its ranges are dropped from the model context without a
  model call, leaving only a short “omitted” marker. Internal tone keys
  (`keep` / `normal` / `minor`) and draft storage are unchanged.
- Token estimates, the “after compression” preview, segment notes, the
  confirmation dialog and the toasts now distinguish summary ranges from
  dropped ranges.
- Tone buttons and the workbench toolbar (recent-turns scope, all/dialogue
  view, text-only summaries, full text, edit, compress, save, undo) carry
  explicit hover/aria descriptions.
- Updated README, locale metadata and the read-only live-verification script
  for the new labels.

### Added

- `test/apply-context.test.mjs`: drives the real plugin routes against a real
  `@deepseek-ai/dsh-session` `Session`, then folds the log with the plugin's
  message projection and asserts what the model derives. It proves that a
  mixed Default/Minor plan writes a summary plus an omission marker, that only
  the Default range calls the summarizer, and that prompt/reply edits reach
  the model context without starting a turn.

## [0.5.2] - 2026-10-22

### Added

- **Repair a reply that was stopped before producing text.** When an assistant
  message has only a reasoning block (an aborted turn), the editor now opens on
  "Add the missing reply text" and appends a text block through the message
  projection instead of silently editing (and hiding) the reasoning. The block
  picker can still switch to the reasoning block.

### Fixed

- Editing a reply with no text block used to open the reasoning editor without
  saying so; the panel now names the target, explains the reasoning-only case,
  and no longer puts a native "Rendered" tooltip over the editable area.
- Saving an empty editor was a silent no-op; it now explains that there is
  nothing to save, and the save button stays clickable for that feedback.

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
