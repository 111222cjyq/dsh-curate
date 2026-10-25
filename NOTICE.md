# Third-party and adapted portions

`dsh-curate` is MIT-licensed. The following parts were adapted from other MIT
projects and keep their original attribution:

- `lib/surface.js` (surface fold, message readers) and parts of
  `lib/index.js` (loopback HTTP guard/body/error helpers) are adapted from
  **dsh-edit-turn 0.3.1**, Copyright (c) 2025 DDDMUC, MIT License.
- `lib/edits.js` (block readers, `plugin:dsh-curate/patch` record grammar,
  message projection for assistant replies, tool results and injected context)
  is adapted from dsh-edit-turn 0.3.1's `lib/patch.js`, Copyright (c) 2025
  DDDMUC, MIT License. The record type is renamed so both plugins can coexist in
  one process; the projection target shape was generalized to the other
  message-producing event types (tool/result, developer/message, non-human
  user/message).
- The prompt replacement carrier in `lib/index.js` (`user/message` with
  `source.kind: 'user'`, `editedBy`, and `surfaceOp: replace`) follows the
  contract established by dsh-edit-turn 0.3.1.
- Markdown conversion in `src/client.js` follows the approach of
  **dsh-edit-turn-panel**, an MIT local fork of the above; it bundles
  [marked](https://github.com/markedjs/marked) (MIT),
  [turndown](https://github.com/mixmark-io/turndown) (MIT),
  [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) (MIT)
  and [DOMPurify](https://github.com/cure53/DOMPurify) (Apache-2.0 / MPL-2.0).
- The editable Markdown surface, the "source + rendered" mode switch, and the
  block picker for assistant replies were first built in dsh-edit-turn-panel and
  are reused here. `dsh-curate` 0.4.0 does not import that package at runtime.
- The Chat-row display decoration and restoration pattern in `src/client.js`
  (following `data-chat-flow-key`, matching the rendered markdown container,
  restoring the captured HTML on teardown) is adapted from dsh-edit-turn 0.3.1,
  Copyright (c) 2025 DDDMUC, MIT License.
