// dsh-curate - browser half.
//
// A header entry opens a full-screen workbench for one Session. The workbench
// reads the current surface from the host, slices it into turn-sized cards,
// lets the human triage each card (important / normal / minor) and rewrite any
// message, then compresses the selected windows: the host asks the model for
// each replacement summary at compression time. Apply replaces the selected
// windows in place; the host backs up and validates first.
//
// The module is a classic client bundle (client-modules protocol): it registers
// a factory with window.__ModuleLoader__ and returns apply().
window.__ModuleLoader__.load({
  id: 'dsh-curate',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const react = require('react')
    const jsxRuntime = require('react/jsx-runtime')
    const { jsx, jsxs } = jsxRuntime

    /* __DSHCURATE_VENDOR__ */

    const NS = 'dsh-curate'
    const ROUTE_PREFIX = '/dsh-curate'
    // scripts/build-client.mjs replaces this marker with the package.json
    // version, so the client half never carries a hand-maintained version.
    const PLUGIN_VERSION = '__DSH_CURATE_VERSION__'
    const DRAFT_PREFIX = 'dsh-curate:draft:'
    const DRAFT_VERSION = 4
    const DRAFT_VERSIONS = new Set([2, 3, 4])
    const PRESERVE_TURNS_MAX = 6
    // Large detail expansions render in pages instead of one giant pass.
    const DETAIL_PAGE_SIZE = 80
    const STYLE_ID = 'dsh-curate-styles'
    const TAB_KIND = 'dsh-curate'

    const zh = {
      'tab.title': '上下文整理',
      'action.open': '整理上下文',
      'action.title': '打开上下文整理工作台（人工筛选、改写，再压缩）',
      'panel.title': '上下文整理',
      'panel.subtitle': '由你决定哪些重要，也可以改写任何消息。压缩时由模型生成替代摘要；被替换的原文不再进入模型上下文。',
      'panel.close': '关闭',
      'panel.loading': '正在读取会话上下文…',
      'panel.retry': '重试',
      'panel.refresh': '刷新上下文',
      'panel.empty': '这条会话还没有可整理的对话。',
      'panel.busy': '会话正在工作，等当前回合结束后再整理。',
      'stats.surface': '可见约 {tokens} tokens',
      'stats.selected': '选入 {count} 段 · {tokens} tokens',
      'stats.after': '压缩后约 {tokens} tokens',
      'stats.saved': '节省 {tokens} tokens',
      'scope.title': '最近保留',
      'scope.suffix': '轮不压缩',
      'scope.note': '最后一条消息永远保留；工具调用与结果不会被拆开。',
      'tone.keep': '重要',
      'tone.normal': '一般',
      'tone.minor': '次要',
      'tone.keep.hint': '整段原文保留，不进入压缩。',
      'tone.mixed': '混合',
      'segment.keep.note': '原文保留，不进入压缩。',
      'segment.range': '#{start}–#{end} · {count} 条',
      'segment.hidden': '含 {count} 条已隐藏的工具/上下文',
      'tone.normal.hint': '压缩时由模型生成常规摘要，保留关键细节。',
      'tone.minor.hint': '压缩时由模型生成更短摘要，只留结论与错误。',
      'locked.badge': '最近对话',
      'locked.override': '已覆盖',
      'tail.badge': '当前消息 · 固定保留',
      'group.range': '第 {turn} 轮',
      'group.noTurn': '独立消息',
      'group.counts': '用户 {user} · 助手 {assistant} · 工具 {tool}',
      'group.tokens': '约 {tokens} tokens',
      'content.hint': '共 {count} 条消息 · 显示预览',
      'content.expand': '查看完整原文',
      'content.loading': '正在读取原文…',
      'content.collapse': '收起完整原文',
      'content.loaded': '已显示 {count} 条消息的完整原文',
      'content.showMore': '再显示 {count} 条',
      'content.failed': '读取原文失败：{error}',
      'segment.autoSummary': '压缩时自动生成摘要。',
      'group.view.source': '源码',
      'group.view.rendered': '渲染',
      'group.split': '拆分',
      'group.merge': '合并下一段',
      'group.keep.note': '整段原文保留，不压缩。',
      'footer.apply': '应用到上下文',
      'footer.cancel': '取消',
      'footer.nothing': '还没有选入任何要压缩的段落。',
      'confirm.title': '应用后无法撤销',
      'confirm.body': '即将替换 {count} 个压缩区间，共 {messages} 条原始消息。它们将不再进入模型上下文；原始内容已备份到本地文件，但会话内的消息无法通过撤销恢复。',
      'confirm.keep': '同轮还有 {kept} 条标记为重要的消息会原文保留。',
      'confirm.backup': '备份位置：{path}',
      'confirm.check': '我理解：应用后原始消息不再进入模型上下文，且会话内无法撤销。',
      'confirm.apply': '确认应用',
      'confirm.cancel': '再检查一下',
      'apply.failed': '应用失败：{error}',
      'apply.stale': '会话在打开工作台后有了新消息，请刷新后重新整理。',
      'apply.partial': '写入中断：已应用 {done}/{total} 个块。请保留备份并检查会话。',
      'done.title': '已完成上下文整理',
      'done.applied': '已替换 {count} 个块',
      'done.backup': '原文备份：{path}',
      'done.check': '回话后原始消息不再出现在模型上下文中。',
      'done.close': '关闭',
      'toast.select': '请先给至少一个段落选择“一般”或“次要”。',
      'toast.noSplit': '这一段无法在不拆开工具调用的情况下切分。',
      'toast.saved': '草稿已保存到本地。',
      'toast.saveFailed': '草稿保存失败：浏览器存储不可用或空间已满，请先复制需要保留的内容。',
      'toast.mergeLocked': '下一段属于最近保留的对话，不能合并。',
      'draft.restored': '已恢复你上次保存的草稿；会话之后有新消息，只保留了仍存在消息上的标注。',
      'draft.unrestorable': '上次保存的草稿所标注的消息已不在会话中，草稿已保留但无法恢复。',
      'edit.entry': '编辑',
      'edit.title.prompt': '编辑用户消息',
      'edit.title.reply': '编辑助手回复',
      'edit.save': '保存修改',
      'edit.cancel': '取消编辑',
      'edit.hint': '保存后先暂存，点底部「应用到上下文」才写入会话。',
      'edit.staged': '已修改（待应用）',
      'edit.undo': '撤销修改',
      'edit.unchanged': '没有检测到修改。',
      'edit.attachments': '这条消息带的 {count} 个附件会原样保留。',
      'edit.loading': '正在读取完整内容…',
      'edit.failed': '读取失败：{error}',
      'edit.readOnly': '这条消息不可编辑。',
      'edit.block': '编辑块',
      'edit.block.text': '正文',
      'edit.block.reasoning': '思维链',
      'edit.noPending': '没有待应用的修改。',
      'edit.blockSwitch': '切换编辑块会丢弃当前未保存的修改。',
      'edit.blockSwitch.confirm': '放弃修改并切换',
      'edit.placeholder': '在这里输入…',
      'edit.applied': '已应用 {count} 处修改。',
      'edit.unchangedCount': '{count} 处没有变化。',
      'edit.backup': '修改前备份：{path}',
      'edit.partial': '已应用 {done}/{total} 处修改，其余保留在工作台。',
      'edit.failedApply': '应用修改失败：{error}',
      'edit.stale': '会话在工作台打开后有了新消息，请刷新后重试。',
      'edit.busy': '会话正在工作，等当前回合结束后再应用。',
      'detail.loadFull': '查看完整内容',
      'detail.truncated': '内容较长，当前显示已截断。',
      'detail.reasoning': '思维链',
      'detail.toolCall': '工具调用',
      'detail.toolResult': '工具结果',
      'detail.attachments': '{count} 个附件',
      'detail.patched': '已改写',
      'compress.title': '压缩上下文',
      'compress.target': '压缩对象',
      'compress.method': '压缩方式',
      'compress.curated': '按整理结果压缩',
      'compress.curated.hint': '把选中的 {count} 段交给模型生成摘要并替换（共 {messages} 条原始消息）。',
      'compress.curated.unavailable': '还没有可压缩的段：先给至少一段选「一般」或「次要」。',
      'compress.official': '官方 /compact',
      'compress.official.hint': '由官方压缩器自行选择较早历史，压成一条摘要；不按上面的分段标注。',
      'compress.official.textOnly': '「压缩摘要只看对话文本」不影响官方 /compact，它仍读取完整历史。',
      'compress.official.unavailable': '当前宿主或 agent 预设没有提供官方 /compact；刚升级插件时请重启 DSH web。',
      'compress.pendingEdits': '还有 {count} 处修改没有应用；先应用或撤销它们，再压缩。',
      'compress.confirm': '确认压缩',
      'compress.cancel': '再检查一下',
      'compress.doneCurated': '已按整理结果压缩 {count} 段。',
      'compress.doneOfficial': '官方 /compact 完成，替换了 {count} 条历史。',
      'compress.nothing': '没有可压缩的历史。',
      'compress.failed': '压缩失败：{error}',
      'compress.running': '正在压缩…',
      'compress.irreversible': '我理解：压缩后原始消息不再进入模型上下文，且会话内无法撤销。',
      'compress.backup': '压缩前备份：{path}',
      'footer.compress': '压缩上下文',
      'footer.applyEdits': '修改并应用到上下文',
      'footer.save': '保存当前内容',
      'footer.undo': '撤销',
      'undo.empty': '没有可撤销的改动。',
      'undo.done': '已撤销上一步。',
      'panel.help': '说明',
      'compress.target.direct': '直接压缩上下文',
      'compress.target.direct.hint': '不应用暂存修改，按当前上下文压缩。',
      'compress.target.direct.pending': '直接压缩不会应用暂存的 {count} 处修改；压缩完成后这些暂存修改会被清除。',
      'compress.target.modified': '压缩修改后的上下文',
      'compress.target.modified.hint': '先应用 {count} 处修改，再压缩修改后的内容。',
      'compress.target.modified.none': '没有暂存修改，无法选择。',
      'footer.pending': '{count} 处修改待应用',
      'edit.title.tool': '编辑工具结果',
      'edit.title.context': '编辑注入上下文',
      'edit.toolArgsReadOnly': '结构化工具调用参数不可编辑。',
      'edit.entryHint': '点消息右上角「编辑」可改写正文、思维链、工具结果或注入上下文。',
      'view.all': '全部内容',
      'view.text': '仅对话文本',
      'view.hidden': '已隐藏 {count} 条工具/上下文',
      'view.note': '视图只影响查看与编辑；压缩仍覆盖整段。',
      'view.empty': '这一段没有可显示的对话文本。',
      'tail.hidden': '最后一条消息是工具/上下文，已隐藏；压缩仍会保留它。',
      'summary.textOnly': '压缩摘要只看对话文本',
      'summary.source.all': '压缩摘要来源：全部内容（压缩时自动生成）',
      'summary.source.text': '压缩摘要来源：仅对话文本（工具与上下文不进入摘要）',
      'version.label': 'v{version}',
      'version.mismatch': '宿主 v{host} / 前端 v{client} 不一致：请重启 DSH web 并硬刷新页面。',
      'version.missing': '宿主缺少版本/能力信息：请重启 DSH web 并硬刷新页面。',
      'version.patchOff': '宿主没有注册消息投影：助手/工具/上下文编辑不可用；用户消息仍可编辑。请重启 DSH web 后重试。',
      'version.reload': '重新加载页面',
      'error.state': '读取失败：{error}',
      'error.generic': '操作失败：{error}',
      'error.confirmRequired': '请先阅读并确认不可撤销提示。',
      'error.toolPair': '选中的范围把工具调用和它的结果拆开了；请扩大范围，或把这条消息标为重要。',
      'error.tailLocked': '最后一条消息不能被压缩。',
      'error.systemLocked': '系统消息不能被压缩。',
      'error.rangeTooLarge': '一个压缩块覆盖的消息太多了，请先拆分再压缩。',
      'error.notEditable': '这条消息不可编辑，请刷新后重试。',
      'error.patchUnavailable': '当前宿主不支持就地修改非用户消息，请重启 DSH web 并硬刷新页面。',
      'error.unsupported': '当前宿主不支持这项写入，请升级或重启 DSH web。',
      'error.invalidRange': '压缩范围无效，请刷新后重新选择。',
      'error.sessionNotActive': '这条会话当前没有打开，无法写入。',
      'error.cancelled': '官方压缩已取消，会话没有被修改。',
      'error.compactionSummary': '官方压缩没有生成有效摘要，会话没有被修改。',
      'error.compactionPartial': '官方压缩没有完整写入，请保留备份并检查会话。',
      'error.compactionPersistence': '官方压缩结果没有完整落盘，请检查会话。',
      'error.compactionFailed': '官方压缩失败，会话没有被修改。',
      'misc.user': '用户',
      'misc.assistant': '助手',
      'misc.tool': '工具',
      'misc.context': '上下文',
      'misc.system': '系统',
    }
    const en = {
      'tab.title': 'Context curation',
      'action.open': 'Curate context',
      'action.title': 'Open the context curation workbench (human triage, rewrite, then compress)',
      'panel.title': 'Context curation',
      'panel.subtitle': 'You decide what matters and may rewrite any message. At compression time the model writes the replacement summaries; replaced originals leave the model context.',
      'panel.close': 'Close',
      'panel.loading': 'Reading the session context…',
      'panel.retry': 'Retry',
      'panel.refresh': 'Refresh context',
      'panel.empty': 'This session has no conversation to curate yet.',
      'panel.busy': 'The session is working. Curate after the current turn finishes.',
      'stats.surface': 'Visible ~{tokens} tokens',
      'stats.selected': '{count} segments · {tokens} tokens',
      'stats.after': 'After ~{tokens} tokens',
      'stats.saved': 'Saved {tokens} tokens',
      'scope.title': 'Keep recent',
      'scope.suffix': 'turns verbatim',
      'scope.note': 'The final message is always kept; tool calls and results are never split.',
      'tone.keep': 'Important',
      'tone.normal': 'Normal',
      'tone.minor': 'Minor',
      'tone.keep.hint': 'Keep this range verbatim.',
      'tone.mixed': 'Mixed',
      'segment.keep.note': 'Kept verbatim; not compressed.',
      'segment.range': '#{start}–#{end} · {count} message(s)',
      'segment.hidden': 'Includes {count} hidden tool/context item(s)',
      'tone.normal.hint': 'Summarize with key details at compression time.',
      'tone.minor.hint': 'Summarize hard at compression time; conclusions and errors only.',
      'locked.badge': 'Recent',
      'locked.override': 'Overridden',
      'tail.badge': 'Latest message · always kept',
      'group.range': 'Turn {turn}',
      'group.noTurn': 'Standalone',
      'group.counts': 'user {user} · assistant {assistant} · tool {tool}',
      'group.tokens': '~{tokens} tokens',
      'content.hint': '{count} messages · preview',
      'content.expand': 'Read full text',
      'content.loading': 'Loading full text…',
      'content.collapse': 'Hide full text',
      'content.loaded': 'Full text for {count} messages',
      'content.showMore': 'Show {count} more',
      'content.failed': 'Could not load the full text: {error}',
      'segment.autoSummary': 'A summary is generated automatically at compression time.',
      'group.view.source': 'Source',
      'group.view.rendered': 'Rendered',
      'group.split': 'Split',
      'group.merge': 'Merge next',
      'group.keep.note': 'Kept verbatim; not compressed.',
      'footer.apply': 'Apply to context',
      'footer.cancel': 'Cancel',
      'footer.nothing': 'No block selected for compression.',
      'confirm.title': 'Apply cannot be undone',
      'confirm.body': 'Replacing {count} compressed range(s), {messages} original messages. They stop entering the model context. The originals are backed up on disk, but the session cannot be rolled back.',
      'confirm.keep': '{kept} message(s) marked Important stay verbatim in the same turn.',
      'confirm.backup': 'Backup location: {path}',
      'confirm.check': 'I understand the replaced originals leave the model context and cannot be undone in the session.',
      'confirm.apply': 'Apply',
      'confirm.cancel': 'Keep reviewing',
      'apply.failed': 'Apply failed: {error}',
      'apply.stale': 'The session grew after the workbench opened. Refresh and curate again.',
      'apply.partial': 'Apply stopped partway: {done}/{total} blocks written. Keep the backup and inspect the session.',
      'done.title': 'Context curation applied',
      'done.applied': 'Replaced {count} blocks',
      'done.backup': 'Original backup: {path}',
      'done.check': 'The originals no longer appear in the model context.',
      'done.close': 'Close',
      'toast.select': 'Mark at least one block Normal or Minor first.',
      'toast.noSplit': 'This block cannot be split without breaking a tool-call pair.',
      'toast.saved': 'Draft saved locally.',
      'toast.saveFailed': 'Could not save the draft: browser storage is unavailable or full. Copy anything you need to keep.',
      'toast.mergeLocked': 'The next block is part of the recently kept turns and cannot be merged.',
      'draft.restored': 'Restored the draft you saved earlier; the session has grown since then, so only markings on messages that still exist were kept.',
      'draft.unrestorable': 'None of the messages marked in the saved draft still exist; the draft was kept but cannot be restored.',
      'edit.entry': 'Edit',
      'edit.title.prompt': 'Edit your message',
      'edit.title.reply': 'Edit the reply',
      'edit.save': 'Save edit',
      'edit.cancel': 'Cancel',
      'edit.hint': 'Saved edits are staged; press "Apply to context" at the bottom to write them.',
      'edit.staged': 'Edited (pending)',
      'edit.undo': 'Undo edit',
      'edit.unchanged': 'No change detected.',
      'edit.attachments': 'The {count} attachment(s) on this message are kept as they are.',
      'edit.loading': 'Loading the full message…',
      'edit.failed': 'Could not load it: {error}',
      'edit.readOnly': 'This message cannot be edited.',
      'edit.block': 'Block',
      'edit.block.text': 'Text',
      'edit.block.reasoning': 'Reasoning',
      'edit.noPending': 'No pending edits.',
      'edit.blockSwitch': 'Switching blocks discards your unsaved change.',
      'edit.blockSwitch.confirm': 'Discard and switch',
      'edit.placeholder': 'Type here…',
      'edit.applied': 'Applied {count} edit(s).',
      'edit.unchangedCount': '{count} edit(s) were unchanged.',
      'edit.backup': 'Pre-edit backup: {path}',
      'edit.partial': 'Applied {done}/{total} edits; the rest are still staged.',
      'edit.failedApply': 'Could not apply the edits: {error}',
      'edit.stale': 'The session grew after this workbench opened. Refresh and try again.',
      'edit.busy': 'The session is working. Apply the edits after the current turn finishes.',
      'detail.loadFull': 'Load full text',
      'detail.truncated': 'This text is truncated in the current view.',
      'detail.reasoning': 'Reasoning',
      'detail.toolCall': 'Tool call',
      'detail.toolResult': 'Tool result',
      'detail.attachments': '{count} attachment(s)',
      'detail.patched': 'Rewritten',
      'compress.title': 'Compress context',
      'compress.target': 'Target',
      'compress.method': 'Method',
      'compress.curated': 'Compress the curated blocks',
      'compress.curated.hint': 'Let the model summarize and replace the {count} selected block(s) ({messages} original messages).',
      'compress.curated.unavailable': 'Nothing to compress yet: mark at least one block Normal or Minor.',
      'compress.official': 'Official /compact',
      'compress.official.hint': 'The official compactor picks an older range and replaces it with one summary; it does not follow the blocks above.',
      'compress.official.textOnly': 'The text-only compression-summary switch does not affect official /compact; it still reads the full history.',
      'compress.official.unavailable': 'This host or agent preset provides no official /compact; restart DSH web after upgrading the plugin.',
      'compress.pendingEdits': '{count} edit(s) are not applied yet; apply or undo them before compressing.',
      'compress.confirm': 'Compress',
      'compress.cancel': 'Keep reviewing',
      'compress.doneCurated': 'Compressed {count} curated block(s).',
      'compress.doneOfficial': 'Official /compact replaced {count} history items.',
      'compress.nothing': 'No compactable history yet.',
      'compress.failed': 'Compression failed: {error}',
      'compress.running': 'Compressing…',
      'compress.irreversible': 'I understand the originals leave the model context and cannot be undone in the session.',
      'compress.backup': 'Pre-compression backup: {path}',
      'footer.compress': 'Compress context',
      'footer.applyEdits': 'Apply edits to context',
      'footer.save': 'Save current content',
      'footer.undo': 'Undo',
      'undo.empty': 'Nothing to undo.',
      'undo.done': 'Undid the last change.',
      'panel.help': 'Help',
      'compress.target.direct': 'Compress the current context',
      'compress.target.direct.hint': 'Compress the current context without applying staged edits.',
      'compress.target.direct.pending': 'Direct compression ignores the {count} staged edit(s); they will be cleared after compressing.',
      'compress.target.modified': 'Compress the modified context',
      'compress.target.modified.hint': 'Apply the {count} staged edit(s), then compress the modified content.',
      'compress.target.modified.none': 'No staged edits to apply.',
      'footer.pending': '{count} pending edit(s)',
      'edit.title.tool': 'Edit the tool result',
      'edit.title.context': 'Edit the injected context',
      'edit.toolArgsReadOnly': 'Structured tool-call arguments are not editable.',
      'edit.entryHint': 'Use Edit at the top-right of a message to rewrite text, reasoning, a tool result or injected context.',
      'view.all': 'All content',
      'view.text': 'Dialogue text only',
      'view.hidden': '{count} tool/context item(s) hidden',
      'view.note': 'The view only filters what you see and edit; compression still covers the whole block.',
      'view.empty': 'This block has no dialogue text to show.',
      'tail.hidden': 'The final message is a tool/context item and is hidden here; compression still keeps it.',
      'summary.textOnly': 'Compression summaries: dialogue text only',
      'summary.source.all': 'Compression summary source: all content (generated at compression time)',
      'summary.source.text': 'Compression summary source: dialogue text only (tools and context are omitted)',
      'version.label': 'v{version}',
      'version.mismatch': 'Host v{host} / front-end v{client} differ: restart DSH web and hard-refresh this page.',
      'version.missing': 'The host exposes no version/capability metadata: restart DSH web and hard-refresh this page.',
      'version.patchOff': 'The host registered no message projection: reply/tool/context editing is unavailable; user messages are still editable. Restart DSH web and retry.',
      'version.reload': 'Reload page',
      'error.state': 'Could not load: {error}',
      'error.generic': 'Failed: {error}',
      'error.confirmRequired': 'Read and confirm the irreversible-change notice first.',
      'error.toolPair': 'The selected range splits a tool call from its result; widen the range or mark that message Important.',
      'error.tailLocked': 'The latest message cannot be compressed.',
      'error.systemLocked': 'System messages cannot be compressed.',
      'error.rangeTooLarge': 'This compression block covers too many messages; split it first.',
      'error.notEditable': 'This message cannot be edited; refresh and retry.',
      'error.patchUnavailable': 'This host cannot patch non-user messages in place; restart DSH web and hard-refresh the page.',
      'error.unsupported': 'This host does not support that write; upgrade or restart DSH web.',
      'error.invalidRange': 'That compression range is invalid; refresh and select again.',
      'error.sessionNotActive': 'This session is not open, so nothing can be written.',
      'error.cancelled': 'Official /compact was cancelled; the session is unchanged.',
      'error.compactionSummary': 'Official /compact produced no valid summary; the session is unchanged.',
      'error.compactionPartial': 'Official /compact did not write completely; keep the backup and inspect the session.',
      'error.compactionPersistence': 'Official /compact did not persist completely; inspect the session.',
      'error.compactionFailed': 'Official /compact failed; the session is unchanged.',
      'misc.user': 'User',
      'misc.assistant': 'Assistant',
      'misc.tool': 'Tool',
      'misc.context': 'Context',
      'misc.system': 'System',
    }
    // The host locale service is the source of truth once apply() has run; the
    // browser language is only the fallback for standalone/unit-test renders.
    function hostLocaleId() {
      try {
        if (clientCtx !== null && clientCtx.locale && typeof clientCtx.locale.getLocale === 'function') {
          const snapshot = clientCtx.locale.getLocale()
          if (snapshot && typeof snapshot.active === 'string' && snapshot.active !== '') return snapshot.active
        }
      } catch {}
      return ''
    }
    const isZh = () => {
      try {
        const active = hostLocaleId() || String((typeof navigator !== 'undefined' && navigator.language) || '')
        return active.toLowerCase().startsWith('zh')
      } catch {
        return false
      }
    }
    function tr(key, values) {
      const dict = isZh() ? zh : en
      let text = dict[key] !== undefined ? dict[key] : (zh[key] !== undefined ? zh[key] : key)
      if (values && typeof values === 'object') {
        for (const name of Object.keys(values)) text = text.split(`{${name}}`).join(String(values[name]))
      }
      return text
    }
    function rawErrorMessage(error) {
      return String(error && error.message ? error.message : error)
    }
    /**
     * Translate a host error code into panel copy. Returns null for unknown
     * codes so the caller can fall back to its localized wrapper plus the
     * host's own (Chinese) prose. `context` picks the edit vs compression
     * wording for the two codes that have per-flow strings.
     */
    function hostErrorText(error, context) {
      const code = error && typeof error.code === 'string' ? error.code : ''
      if (code === 'busy') return tr(context === 'edit' ? 'edit.busy' : 'panel.busy')
      if (code === 'stale') return tr(context === 'edit' ? 'edit.stale' : 'apply.stale')
      const keys = {
        'confirm-required': 'error.confirmRequired',
        'tool-pair': 'error.toolPair',
        'tail-locked': 'error.tailLocked',
        'system-locked': 'error.systemLocked',
        'range-too-large': 'error.rangeTooLarge',
        'not-editable': 'error.notEditable',
        'patch-unavailable': 'error.patchUnavailable',
        unsupported: 'error.unsupported',
        cancelled: 'error.cancelled',
        'compaction-summary': 'error.compactionSummary',
        'compaction-partial': 'error.compactionPartial',
        'compaction-persistence': 'error.compactionPersistence',
        'compaction-failed': 'error.compactionFailed',
        'invalid-range': 'error.invalidRange',
        'session-not-active': 'error.sessionNotActive',
      }
      return keys[code] !== undefined ? tr(keys[code]) : null
    }
    // Locale switches must re-render every mounted workbench/header entry.
    const localeListeners = new Set()
    function publishLocaleChange() {
      for (const listener of [...localeListeners]) {
        try {
          listener()
        } catch (error) {
          console.error('[dsh-curate] locale listener failed:', error)
        }
      }
    }
    function useLocaleTick() {
      const [, force] = react.useState(0)
      react.useEffect(() => {
        const listener = () => force((value) => value + 1)
        localeListeners.add(listener)
        return () => localeListeners.delete(listener)
      }, [])
    }
    function fmtTokens(tokens) {
      const value = Number.isFinite(tokens) ? Math.max(0, Math.round(tokens)) : 0
      if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
      return String(value)
    }

    // --- per-message tones and compression segments -------------------------

    /**
     * Rough size of the summary the model will write at compression time. The
     * target is a share of the original range (see the host's tone prompt):
     * about 12% for Normal and 5% for Minor, with a small floor.
     */
    function estimatedSummaryTokens(segment) {
      const tokens = segment && Number.isFinite(segment.tokens) ? Math.max(0, segment.tokens) : 0
      const ratio = segment && segment.tone === 'minor' ? 0.05 : 0.12
      return Math.max(120, Math.round(tokens * ratio))
    }

    /**
     * Union tool calls with their results. One assistant message can announce
     * several calls; every matching result joins the same unit. A tone applies
     * to the whole unit so a compression segment can never split a call/result
     * pair.
     */
    function buildToneUnits(nodes) {
      const parent = nodes.map((_, index) => index)
      function find(index) {
        let root = index
        while (parent[root] !== root) root = parent[root]
        let current = index
        while (parent[current] !== current) {
          const next = parent[current]
          parent[current] = root
          current = next
        }
        return root
      }
      function union(left, right) {
        const a = find(left)
        const b = find(right)
        if (a !== b) parent[b] = a
      }
      const resultByCall = new Map()
      nodes.forEach((node, index) => {
        if (node && node.role === 'tool' && typeof node.toolResultFor === 'string' && node.toolResultFor !== '') {
          resultByCall.set(node.toolResultFor, index)
        }
      })
      nodes.forEach((node, index) => {
        if (!node || !Array.isArray(node.toolCallIds)) return
        for (const id of node.toolCallIds) {
          if (typeof id !== 'string' || id === '') continue
          const result = resultByCall.get(id)
          if (result !== undefined) union(index, result)
        }
      })
      return {
        find,
        unitOf(index) {
          const root = find(index)
          const out = []
          for (let cursor = 0; cursor < nodes.length; cursor += 1) {
            if (find(cursor) === root) out.push(cursor)
          }
          return out
        },
      }
    }

    /**
     * Split one group into contiguous compression segments by effective tone.
     * Tool units are normalized to one tone first (keep > normal > minor), so a
     * segment boundary always falls outside a call/result pair.
     */
    function segmentsForGroup(group, surface, toneAt, units) {
      const start = group.startIndex
      const end = group.endIndex
      if (start === undefined || end === undefined || end < start) return []
      const tones = []
      for (let index = start; index <= end; index += 1) tones.push(toneAt(index))
      if (units) {
        const byRoot = new Map()
        for (let index = start; index <= end; index += 1) {
          const root = units.find(index)
          if (!byRoot.has(root)) byRoot.set(root, [])
          byRoot.get(root).push(index)
        }
        const rank = { keep: 3, normal: 2, minor: 1 }
        for (const [root, indices] of byRoot) {
          // A tone unit that is only partially inside this group cannot be
          // compressed here: its other members (usually the tool result just
          // after the group, or a call before it) would be split off. Mirror
          // the host's validatePlan and keep the whole in-group part verbatim.
          const whole = units.unitOf(root)
          if (whole.length !== indices.length) {
            for (const index of indices) tones[index - start] = 'keep'
            continue
          }
          if (indices.length < 2) continue
          let best = tones[indices[0] - start]
          for (const index of indices) {
            if ((rank[tones[index - start]] || 0) > (rank[best] || 0)) best = tones[index - start]
          }
          for (const index of indices) tones[index - start] = best
        }
      }
      const segments = []
      let current = null
      for (let index = start; index <= end; index += 1) {
        const tone = tones[index - start]
        if (current === null || tone !== current.tone) {
          if (current !== null) segments.push(current)
          current = { tone, startIndex: index, endIndex: index, startSeq: surface[index] ? surface[index].seq : null, endSeq: null }
        }
        current.endIndex = index
        current.endSeq = surface[index] ? surface[index].seq : null
      }
      if (current !== null) segments.push(current)
      for (const segment of segments) {
        const nodes = surface.slice(segment.startIndex, segment.endIndex + 1)
        segment.key = `${segment.startSeq}-${segment.endSeq}-${segment.tone}`
        segment.count = nodes.length
        segment.tokens = nodes.reduce((sum, node) => sum + (Number.isFinite(node.tokens) ? node.tokens : 0), 0)
      }
      return segments
    }

    /** The single tone of a group, or 'mixed' when its messages disagree. */
    function groupToneOf(segments) {
      if (segments.length === 0) return 'normal'
      const first = segments[0].tone
      return segments.every((segment) => segment.tone === first) ? first : 'mixed'
    }

    /** Stable key for one staged edit. */
    function editKeyFor(mode, seq, blockIndex) {
      return mode === 'prompt' ? `p:${seq}` : `${mode}:${seq}:${blockIndex}`
    }

    // --- Markdown vendor helpers (same converters as dsh-edit-turn's panel) ---

    function vendo() {
      try {
        return typeof __DSHCURATE_VENDOR__ === 'object' && __DSHCURATE_VENDOR__ !== null ? __DSHCURATE_VENDOR__ : null
      } catch {
        return null
      }
    }
    function escapeHtmlText(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    }
    function escapeMarkdownParagraph(text) {
      return '<p>' + escapeHtmlText(text).replace(/\n/g, '<br>') + '</p>'
    }
    /**
     * Sanitize already-parsed Markdown HTML. Without DOMPurify we must not
     * return the raw `marked` output (it may contain script/event attributes),
     * so fall back to an escaped text paragraph instead.
     */
    function sanitizeMarkdownHtml(raw, source, vendor) {
      if (vendor && vendor.DOMPurify !== undefined && typeof vendor.DOMPurify.sanitize === 'function') {
        return vendor.DOMPurify.sanitize(raw, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'textarea'],
          FORBID_ATTR: ['style'],
        })
      }
      return escapeMarkdownParagraph(source)
    }
    function markdownToHtml(source) {
      const text = typeof source === 'string' ? source : ''
      const vendor = vendo()
      if (vendor === null || typeof vendor.marked === 'undefined') return escapeMarkdownParagraph(text)
      try {
        return sanitizeMarkdownHtml(vendor.marked.parse(text), text, vendor)
      } catch {
        return escapeMarkdownParagraph(text)
      }
    }
    function htmlToMarkdown(html) {
      const vendor = vendo()
      const source = typeof html === 'string' ? html : ''
      if (vendor === null || typeof vendor.turndown === 'undefined') return source.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
      try {
        return vendor.turndown.turndown(source).replace(/\n+$/, '')
      } catch {
        return source.replace(/<[^>]+>/g, '')
      }
    }
    function isAbsoluteMediaPath(value) {
      return typeof value === 'string' && (value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value))
    }
    function resolveWorkspacePath(cwd, value) {
      const path = typeof value === 'string' ? value : ''
      if (path === '' || isAbsoluteMediaPath(path)) return path
      if (typeof cwd !== 'string' || cwd === '') return path
      const absolute = cwd.startsWith('/') || /^[A-Za-z]:[\\/]/.test(cwd)
      const combined = cwd.replace(/[\\/]+$/, '') + '/' + path.replace(/\\/g, '/')
      const out = []
      for (const part of combined.split('/')) {
        if (part === '' || part === '.') continue
        if (part === '..') {
          if (out.length > 0 && out[out.length - 1] !== '..') out.pop()
          else if (!absolute) out.push('..')
          continue
        }
        out.push(part)
      }
      let normalized = out.join('/')
      if (absolute) normalized = '/' + normalized
      return normalized === '' ? path : normalized
    }
    function fileMediaUrl(path) {
      if (typeof path !== 'string' || path === '') return null
      try {
        const base = typeof document !== 'undefined' ? document.baseURI : ''
        if (!/^https?:/i.test(base) && !base.startsWith('dsh-app://app/')) return null
        return new URL(`api/file?path=${encodeURIComponent(path)}`, base).href
      } catch {
        return null
      }
    }
    function resolveRenderedImages(container, cwd) {
      if (!container || typeof container.querySelectorAll !== 'function') return
      let images = []
      try {
        images = container.querySelectorAll('img')
      } catch {
        return
      }
      for (const image of images) {
        let raw = ''
        try {
          raw = image.getAttribute('src') || ''
        } catch {
          raw = ''
        }
        if (raw === '' || /^(?:[a-z][a-z0-9+.-]*:)/i.test(raw)) continue
        let decoded = raw
        try {
          decoded = decodeURIComponent(raw.split(/[?#]/u)[0] || '')
        } catch {
          decoded = raw
        }
        if (decoded === '') continue
        const url = fileMediaUrl(resolveWorkspacePath(cwd, decoded))
        if (url !== null) {
          try {
            image.setAttribute('src', url)
          } catch {}
        }
      }
    }

    // --- workbench open state per Session ------------------------------------

    const workbenches = new Map()
    function workbenchFor(sessionId) {
      let workbench = workbenches.get(sessionId)
      if (workbench === undefined) {
        workbench = { open: false, listeners: new Set() }
        workbenches.set(sessionId, workbench)
      }
      return workbench
    }
    function notifyWorkbench(workbench) {
      for (const listener of [...workbench.listeners]) {
        try {
          listener()
        } catch (error) {
          console.error('[dsh-curate] workbench listener failed:', error)
        }
      }
    }
    function openWorkbench(sessionId) {
      const workbench = workbenchFor(sessionId)
      workbench.open = true
      notifyWorkbench(workbench)
    }
    function closeWorkbench(sessionId) {
      const workbench = workbenchFor(sessionId)
      workbench.open = false
      notifyWorkbench(workbench)
    }
    // --- right Sidebar tab ----------------------------------------------------

    // The approved UI seat: the workbench lives in the official right Sidebar as
    // its own tab type. The overlay registered below stays as a fallback for a
    // composition without the Sidebar services.
    let openCurateTab = null
    let closeCurateTab = null
    // Set once by apply(): the workbench uses the client `sessions` service to
    // resync the transcript after it writes to the session.
    let clientCtx = null

    function dockedCloseTab() {
      if (closeCurateTab !== null) {
        try {
          closeCurateTab()
          return
        } catch (error) {
          console.error('[dsh-curate] closing the curation tab failed:', error)
        }
      }
    }

    function useWorkbenchState(sessionId) {
      const workbench = workbenchFor(sessionId)
      const [, force] = react.useState(0)
      react.useEffect(() => {
        const listener = () => force((value) => value + 1)
        workbench.listeners.add(listener)
        return () => workbench.listeners.delete(listener)
      }, [sessionId])
      return workbench
    }

    // --- host API ------------------------------------------------------------

    async function request(path, options) {
      const response = await fetch(`${ROUTE_PREFIX}${path}`, {
        headers: { 'content-type': 'application/json' },
        ...options,
      })
      let data = {}
      try {
        data = await response.json()
      } catch {
        data = {}
      }
      if (!response.ok || data.ok === false) {
        const error = new Error(typeof data.error === 'string' ? data.error : `HTTP ${response.status}`)
        error.status = response.status
        error.code = data.code || 'http'
        error.payload = data
        throw error
      }
      return data
    }
    async function loadState(sessionId, signal) {
      // The caller may abort a superseded load (see Workbench.load).
      return request(`/state?sessionId=${encodeURIComponent(sessionId)}`, signal ? { signal } : undefined)
    }
    async function loadContent(sessionId, startSeq, endSeq) {
      return request(`/content?sessionId=${encodeURIComponent(sessionId)}&startSeq=${startSeq}&endSeq=${endSeq}`)
    }
    async function applyPlan(sessionId, expectedLastSeq, ops, label, options = {}) {
      return request('/apply', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          expectedLastSeq,
          confirm: true,
          ops,
          label,
          autoSummarize: options.autoSummarize === true,
          textOnly: options.textOnly === true,
        }),
      })
    }
    /**
     * Compatibility path for a host older than 0.4.1: it has no auto-summary in
     * /apply, but still exposes /summarize. The 0.4.1 client falls back to it
     * when the host rejects a text-less plan, so curated compression keeps
     * working until the host is restarted.
     */
    async function draftSummaryLegacy(sessionId, segment, textOnly) {
      return request('/summarize', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          startSeq: segment.startSeq,
          endSeq: segment.endSeq,
          tone: segment.tone,
          textOnly: textOnly === true,
        }),
      })
    }
    async function loadMessage(sessionId, seq) {
      return request(`/message?sessionId=${encodeURIComponent(sessionId)}&seq=${encodeURIComponent(String(seq))}`)
    }
    async function applyMessageEdits(sessionId, expectedLastSeq, edits) {
      return request('/edit', {
        method: 'POST',
        body: JSON.stringify({ sessionId, expectedLastSeq, confirm: true, edits }),
      })
    }
    async function compactContext(sessionId, expectedLastSeq) {
      return request('/compact', {
        method: 'POST',
        body: JSON.stringify({ sessionId, expectedLastSeq, confirm: true }),
      })
    }

    /** Best-effort refresh of the host transcript after this workbench writes. */
    function resyncConversation(sessionId) {
      try {
        const sessions = clientCtx && typeof clientCtx.get === 'function' ? clientCtx.get('sessions') : null
        const binding = sessions && typeof sessions.binding === 'function' ? sessions.binding(sessionId) : undefined
        const session = binding && binding.session
        if (session && typeof session.resync === 'function') session.resync()
      } catch (error) {
        console.error('[dsh-curate] session resync failed:', error)
      }
    }

    // --- grouping ------------------------------------------------------------

    function middleCut(surface, start, end) {
      const candidates = []
      for (let index = start; index < end; index += 1) {
        const current = surface[index]
        const next = surface[index + 1]
        if (!current || !next) continue
        if (current.role === 'tool') {
          if (next.role !== 'tool') candidates.push(index)
          continue
        }
        if (next.role === 'user') {
          candidates.push(index)
          continue
        }
        if (current.role === 'assistant' && Array.isArray(current.toolCalls) && current.toolCalls.length === 0) candidates.push(index)
      }
      if (candidates.length === 0) return null
      const middle = (start + end) / 2
      let best = candidates[0]
      for (const candidate of candidates) if (Math.abs(candidate - middle) < Math.abs(best - middle)) best = candidate
      return best
    }

    function buildGroups(state, preserveTurns) {
      const all = Array.isArray(state.nodes) ? state.nodes : []
      const surface = all.filter((node) => node && node.role !== 'system')
      if (surface.length === 0) return { surface, groups: [] }
      const selectable = surface.slice(0, Math.max(0, surface.length - 1))
      const groups = []
      let current = null
      for (let index = 0; index < selectable.length; index += 1) {
        const node = selectable[index]
        const turn = typeof node.turn === 'number' ? node.turn : null
        if (current !== null && turn !== null && current.turn !== null && turn !== current.turn) {
          groups.push(current)
          current = null
        }
        if (current === null) current = { startIndex: index, endIndex: index, turn }
        current.endIndex = index
      }
      if (current !== null) groups.push(current)
      const turns = [...new Set(surface.map((node) => node.turn).filter((turn) => typeof turn === 'number'))].sort((a, b) => b - a)
      const lockedTurns = new Set(turns.slice(0, Math.max(0, preserveTurns)))
      return {
        surface,
        groups: groups.map((group) => ({
          id: `${surface[group.startIndex].seq}-${surface[group.endIndex].seq}`,
          startIndex: group.startIndex,
          endIndex: group.endIndex,
          turn: group.turn,
          tone: lockedTurns.has(group.turn) ? 'keep' : 'normal',
          locked: lockedTurns.has(group.turn),
        })),
      }
    }

    /** Clamp a persisted "keep recent turns" scope to the select's 0..6 options. */
    function normalizePreserveTurns(value) {
      return Number.isInteger(value) && value >= 0 && value <= PRESERVE_TURNS_MAX ? value : null
    }
    function readDraft(sessionId) {
      try {
        const raw = localStorage.getItem(DRAFT_PREFIX + sessionId)
        return raw ? JSON.parse(raw) : null
      } catch (error) {
        // Corrupt JSON and blocked/quota-denied storage both land here; the
        // panel still loads, but the caller must not pretend a draft exists.
        try {
          console.warn('[dsh-curate] could not read the saved draft:', error)
        } catch {}
        return null
      }
    }
    /** Returns true only when the browser accepted the write. */
    function writeDraft(sessionId, payload) {
      try {
        localStorage.setItem(DRAFT_PREFIX + sessionId, JSON.stringify(payload))
        return true
      } catch (error) {
        try {
          console.warn('[dsh-curate] could not write the draft:', error)
        } catch {}
        return false
      }
    }
    function clearDraft(sessionId) {
      try {
        localStorage.removeItem(DRAFT_PREFIX + sessionId)
        return true
      } catch (error) {
        try {
          console.warn('[dsh-curate] could not clear the draft:', error)
        } catch {}
        return false
      }
    }
    /** A payload is "empty" when no tone or staged edit survived in it. */
    function draftHasContent(payload) {
      if (!payload || typeof payload !== 'object') return false
      const tones = Array.isArray(payload.tones) ? payload.tones.length : 0
      const edits = Array.isArray(payload.edits) ? payload.edits.length : 0
      return tones > 0 || edits > 0
    }

    // --- styles --------------------------------------------------------------

    /** Inject the stylesheet once and return a disposer that removes it. */
    function ensureStyles() {
      const noop = () => {}
      if (typeof document === 'undefined') return noop
      // A previous plugin instance (or an HMR reload) owns the existing node.
      if (document.getElementById(STYLE_ID)) return noop
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = `
        .dshcurate-open{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l2, #d9d9d9);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary, #222);font-size:12px;line-height:1;cursor:pointer;white-space:nowrap}
        .dshcurate-open:hover{background:var(--dsw-alias-interactive-bg-hover, #f5f5f5)}
        .dshcurate-layer{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.38))}
        .dshcurate-panel{width:min(1180px,96vw);height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:12px;background:var(--dsw-alias-bg-layer-1, #fff);color:var(--dsw-alias-label-primary,#222);box-shadow:0 18px 48px rgba(0,0,0,.22);font-size:13px}
        .dshcurate-head{display:flex;align-items:flex-start;gap:12px;padding:12px 16px 10px;border-bottom:1px solid var(--dsw-alias-border-l2,#e8e8e8)}
        .dshcurate-head-main{flex:1;min-width:0}
        .dshcurate-title{margin:0;font-size:15px;font-weight:600;line-height:1.4}
        .dshcurate-subtitle{margin:2px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-title-row{display:flex;align-items:center;gap:7px;min-width:0}
        .dshcurate-help{flex:none;width:20px;height:20px;padding:0;border:1px solid var(--dsw-alias-border-l2,#d9d9d9);border-radius:50%;background:transparent;color:var(--dsw-alias-label-tertiary,#777);font-size:12px;line-height:18px;cursor:pointer}
        .dshcurate-help:hover{background:var(--dsw-alias-interactive-bg-hover,#f5f5f5);color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-help-pop{margin:0 16px 10px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-interactive-bg-hover,#fafafa);font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-help-pop p{margin:0 0 4px}
        .dshcurate-help-pop p:last-child{margin-bottom:0}
        .dshcurate-icon{flex:none;width:28px;height:28px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:6px;background:transparent;color:inherit;font-size:16px;line-height:1;cursor:pointer}
        .dshcurate-icon:hover{background:var(--dsw-alias-interactive-bg-hover,#f5f5f5)}
        .dshcurate-stats{display:flex;flex-wrap:nowrap;align-items:center;gap:14px;overflow-x:auto;white-space:nowrap;padding:8px 16px;border-bottom:1px solid var(--dsw-alias-border-l2,#f0f0f0);font-size:11.5px;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-stats b{font-weight:600;color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-scope{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dsw-alias-border-l2,#f0f0f0);font-size:12px;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-scope select{height:26px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2,#d9d9d9);border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:12px}
        .dshcurate-body{flex:1;min-height:0;overflow:auto;padding:12px 16px}
        .dshcurate-alert{margin:0 0 10px;padding:8px 10px;border:1px solid rgba(220,90,90,.38);border-radius:8px;background:rgba(220,90,90,.10);color:var(--dsw-alias-state-error-primary,#c0504d);font-size:12px;line-height:1.5}
        .dshcurate-card{margin:0 0 10px;border:1px solid var(--dsw-alias-border-l2,#e6e6e6);border-radius:9px;padding:9px 11px;background:var(--dsw-alias-bg-layer-1,#fff)}
        .dshcurate-card.locked{background:var(--dsw-alias-interactive-bg-hover,#fafafa)}
        .dshcurate-snippets-wrap{margin:6px 0 2px}
        .dshcurate-snippets{max-height:230px;overflow:auto;padding:2px 4px;border:1px solid var(--dsw-alias-border-l1,#484848);border-radius:7px;background:var(--dsw-alias-bg-layer-1,#0a0a0a)}
        .dshcurate-snippet{display:flex;align-items:flex-start;gap:6px;padding:4px 5px;border-bottom:1px solid var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));font-size:11.5px;line-height:1.55}
        .dshcurate-snippet:last-child{border-bottom:0}
        .dshcurate-role{flex:none;min-width:32px;padding:0 5px;border-radius:4px;background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.14));color:var(--dsw-alias-label-secondary,#666);font-size:10.5px;line-height:17px;text-align:center}
        .dshcurate-role.assistant{color:var(--dsw-alias-brand-primary,#4c6ef5)}
        .dshcurate-role.tool,.dshcurate-role.context{color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-snippet-seq{flex:none;color:var(--dsw-alias-label-tertiary,#777);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;line-height:17px}
        .dshcurate-snippet-text{flex:1;min-width:0;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-snippets.full .dshcurate-snippet-text{display:block;-webkit-line-clamp:unset;max-height:180px;overflow:auto;color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-snippet.error .dshcurate-snippet-text{color:var(--dsw-alias-state-error-primary,#c0504d)}
        .dshcurate-snippet-tools{display:flex;align-items:center;gap:8px;margin-top:4px}
        .dshcurate-snippet-tools .muted{flex:1;min-width:0;font-size:11px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-card-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
        .dshcurate-card-meta{flex:1;min-width:220px;font-size:12px;color:var(--dsw-alias-label-tertiary,#777);line-height:1.5}
        .dshcurate-card-meta b{color:var(--dsw-alias-label-primary,#222);font-weight:600}
        .dshcurate-badge{display:inline-block;margin-left:6px;padding:0 6px;border-radius:10px;background:var(--dsw-alias-interactive-bg-hover,#eee);font-size:11px;line-height:18px;color:var(--dsw-alias-label-tertiary,#666)}
        .dshcurate-tones{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px}
        .dshcurate-tone{height:22px;padding:0 8px;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary,#666);font-size:11.5px;line-height:1;cursor:pointer}
        .dshcurate-tone.active{background:var(--dsw-alias-button-ghost-active-fill,var(--dsw-alias-interactive-bg-hover,#eee));color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-tone:disabled{opacity:.55;cursor:default}
        .dshcurate-tools{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
        .dshcurate-btn{height:26px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2,#d9d9d9);border-radius:6px;background:transparent;color:inherit;font-size:12px;line-height:1;cursor:pointer;white-space:nowrap}
        .dshcurate-btn:hover{background:var(--dsw-alias-interactive-bg-hover,#f5f5f5)}
        .dshcurate-btn:disabled{opacity:.5;cursor:default}
        .dshcurate-btn.primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#4c6ef5));color:var(--dsw-alias-label-primary-foreground,#fff)}
        .dshcurate-btn.primary:hover{opacity:.9;background:var(--dsw-alias-brand-primary,#4c6ef5)}
        .dshcurate-btn.danger{border-color:rgba(220,90,90,.45);color:var(--dsw-alias-state-error-primary,#c0504d)}
        .dshcurate-btn.small{height:22px;padding:0 8px;font-size:11.5px}
        .dshcurate-hint{display:flex;gap:6px;margin-top:8px}
        .dshcurate-hint input{flex:1;min-width:0;height:26px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:12px}
        .dshcurate-note{margin-top:8px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-modes{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;font-size:12px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-modes .group{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px}
        .dshcurate-modes button{height:22px;padding:0 8px;border:0;border-radius:5px;background:transparent;color:inherit;font-size:11.5px;line-height:1;cursor:pointer}
        .dshcurate-modes button.active{background:var(--dsw-alias-button-ghost-active-fill,var(--dsw-alias-interactive-bg-hover,#eee));color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-source{display:block;width:100%;box-sizing:border-box;min-height:110px;max-height:320px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.6;resize:vertical}
        .dshcurate-rendered{box-sizing:border-box;width:100%;min-height:110px;max-height:320px;overflow:auto;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);font-size:13px;line-height:1.65;outline:none;cursor:text}
        .dshcurate-rendered:focus{border-color:var(--dsw-alias-brand-primary,#4c6ef5);box-shadow:0 0 0 2px rgba(76,110,245,.16)}
        .dshcurate-rendered:empty:before{content:attr(data-placeholder);color:var(--dsw-alias-label-tertiary,#aaa)}
        .dshcurate-md h1,.dshcurate-md h2,.dshcurate-md h3{font-size:15px;margin:10px 0 6px;line-height:1.4}
        .dshcurate-md h1{font-size:17px}
        .dshcurate-md p{margin:6px 0}
        .dshcurate-md ul,.dshcurate-md ol{margin:6px 0;padding-left:22px}
        .dshcurate-md li{margin:2px 0}
        .dshcurate-md code{padding:1px 4px;border-radius:4px;background:var(--dsw-alias-interactive-bg-hover,#f2f2f2);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
        .dshcurate-md pre{margin:8px 0;padding:8px 10px;border-radius:7px;background:var(--dsw-alias-interactive-bg-hover,#f6f6f6);overflow:auto}
        .dshcurate-md pre code{padding:0;background:transparent}
        .dshcurate-md blockquote{margin:6px 0;padding:2px 10px;border-left:3px solid var(--dsw-alias-border-l2,#ddd);color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-md img{max-width:100%;height:auto;border-radius:6px}
        .dshcurate-md table{border-collapse:collapse;margin:6px 0;font-size:12px}
        .dshcurate-md th,.dshcurate-md td{border:1px solid var(--dsw-alias-border-l2,#ddd);padding:3px 6px}
        .dshcurate-err{margin:6px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-state-error-primary,#c0504d)}
        .dshcurate-empty{padding:48px 16px;text-align:center;font-size:13px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-foot{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-start;padding:10px 16px;border-top:1px solid var(--dsw-alias-border-l2,#e8e8e8)}
        .dshcurate-foot .spacer{flex:1}
        .dshcurate-foot .note{font-size:12px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-confirm{margin:0 0 10px;padding:10px 12px;border:1px solid #e0b4b4;border-radius:8px;background:#fff8f8;color:#7a2b2b}
        .dshcurate-confirm h4{margin:0 0 6px;font-size:13px}
        .dshcurate-confirm p{margin:0 0 6px;font-size:12px;line-height:1.55}
        .dshcurate-confirm label{display:flex;gap:6px;align-items:flex-start;font-size:12px;line-height:1.5;margin:8px 0}
        .dshcurate-confirm .row{display:flex;gap:8px;justify-content:flex-end}
        .dshcurate-toast{position:sticky;bottom:0;margin:8px 0 0;padding:6px 10px;border-radius:7px;background:var(--dsw-alias-interactive-bg-hover,#f2f2f2);font-size:12px;color:var(--dsw-alias-label-secondary,#555)}
        @media (max-width:720px){.dshcurate-panel{width:100vw;height:100vh;border-radius:0}.dshcurate-layer{padding:0}}
        .dshcurate-dock{width:100%;height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-dock .dshcurate-panel{width:100%;height:100%;border:0;border-radius:0;box-shadow:none;background:transparent}
        .dshcurate-banner{margin:0 0 10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-interactive-bg-hover,#f5f5f5);font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-banner b{color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-banner .path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;word-break:break-all}
        .dshcurate-detail{margin:6px 0 0}
        .dshcurate-detail-list{display:flex;flex-direction:column;gap:8px;max-height:460px;overflow:auto;padding:2px}
        .dshcurate-message{border:1px solid var(--dsw-alias-border-l2,#e6e6e6);border-radius:8px;padding:7px 9px;background:var(--dsw-alias-bg-layer-1,#fff)}
        .dshcurate-message.staged{border-color:var(--dsw-alias-brand-primary,#4c6ef5)}
        .dshcurate-message-head{display:flex;flex-wrap:wrap;align-items:center;gap:5px 8px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-message-head .seq{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px}
        .dshcurate-message-head .spring{flex:1}
        .dshcurate-message-body{margin-top:5px;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-message-body .dshcurate-md{font-size:12.5px;line-height:1.6}
        .dshcurate-badge.edit{background:rgba(76,110,245,.14);color:var(--dsw-alias-brand-primary,#4c6ef5)}
        .dshcurate-badge.stale{background:rgba(180,120,20,.16);color:#9a6a12}
        .dshcurate-tool-text{margin:4px 0;padding:6px 8px;border-radius:6px;background:var(--dsw-alias-interactive-bg-hover,#f5f5f5);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:1.55;white-space:pre-wrap;word-break:break-word;max-height:170px;overflow:auto}
        .dshcurate-tool-text.error{color:var(--dsw-alias-state-error-primary,#c0504d)}
        .dshcurate-reasoning{margin:5px 0;padding:5px 8px;border-left:2px solid var(--dsw-alias-border-l2,#ddd);font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-secondary,#555);background:var(--dsw-alias-interactive-bg-hover,#fafafa);border-radius:0 6px 6px 0}
        .dshcurate-reasoning summary{cursor:pointer;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-reasoning pre{margin:5px 0 0;white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:11.5px}
        .dshcurate-block-chip{display:inline-flex;align-items:center;gap:4px;margin:2px 4px 2px 0;padding:1px 6px;border-radius:5px;background:var(--dsw-alias-interactive-bg-hover,#eee);font-size:10.5px;color:var(--dsw-alias-label-secondary,#666)}
        .dshcurate-editor{margin:6px 0 2px;padding:8px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-bg-base,#fff)}
        .dshcurate-editor-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-editor-head .grow{flex:1}
        .dshcurate-editor-head select{height:24px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:11.5px}
        .dshcurate-editor .dshcurate-modes{margin-top:6px}
        .dshcurate-editor .dshcurate-source,.dshcurate-editor .dshcurate-rendered{min-height:150px;max-height:440px}
        .dshcurate-editor-foot{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-end;margin-top:6px}
        .dshcurate-editor-foot .hint{flex:1;min-width:180px;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-compress{margin:0 0 10px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:9px;background:var(--dsw-alias-bg-layer-1,#fff)}
        .dshcurate-compress h4{margin:0 0 6px;font-size:13px}
        .dshcurate-option{display:flex;gap:8px;align-items:flex-start;margin:6px 0;padding:7px 9px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px;cursor:pointer}
        .dshcurate-option.active{border-color:var(--dsw-alias-brand-primary,#4c6ef5);background:rgba(76,110,245,.10)}
        .dshcurate-option.disabled{opacity:.55;cursor:default}
        .dshcurate-option input{margin-top:2px}
        .dshcurate-option .t{font-size:12.5px;font-weight:600}
        .dshcurate-option .d{margin-top:1px;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-compress > label{display:flex;gap:6px;align-items:flex-start;margin:8px 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-compress-group{margin:0 0 8px}
        .dshcurate-compress-label{margin:0 0 4px;font-size:11px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-compress-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
        .dshcurate-stale{margin-top:6px;font-size:11.5px;line-height:1.5;color:#9a6a12}
        .dshcurate-segment{margin-top:9px;padding:8px 9px;border:1px solid var(--dsw-alias-border-l2,#e6e6e6);border-radius:8px;background:var(--dsw-alias-bg-base,#fff)}
        .dshcurate-segment.keep{background:var(--dsw-alias-interactive-bg-hover,#fafafa)}
        .dshcurate-segment-head{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-segment-head b{color:var(--dsw-alias-label-primary,#222);font-weight:600}
        .dshcurate-segment .dshcurate-hint{margin-top:7px}
        .dshcurate-msg-tones{display:inline-flex;gap:2px;padding:1px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:6px}
        .dshcurate-msg-tones .dshcurate-tone{height:19px;padding:0 6px;font-size:10.5px}
        .dshcurate-msg-actions{display:inline-flex;gap:4px;align-items:center}
        .dshcurate-message-head{position:sticky;top:0;z-index:2;background:var(--dsw-alias-bg-layer-1,#fff);padding:4px 2px;border-bottom:1px solid var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}
        .dshcurate-message.staged .dshcurate-message-head{background:rgba(76,110,245,.06)}
        .dshcurate-snippet-pencil{flex:none;width:22px;height:20px;padding:0;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary,#777);font-size:11px;line-height:1;cursor:pointer}
        .dshcurate-snippet-pencil:hover{background:var(--dsw-alias-interactive-bg-hover,#f5f5f5);color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-view{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px}
        .dshcurate-view button{height:22px;padding:0 8px;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary,#666);font-size:11.5px;line-height:1;cursor:pointer}
        .dshcurate-view button.active{background:var(--dsw-alias-button-ghost-active-fill,var(--dsw-alias-interactive-bg-hover,#eee));color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-flag{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--dsw-alias-label-secondary,#555);cursor:pointer}
        .dshcurate-flag input{margin:0}
        .dshcurate-version-banner{margin:0 0 10px;padding:8px 10px;border:1px solid rgba(210,140,40,.45);border-radius:8px;background:rgba(210,140,40,.10);color:#8a5a10;font-size:12px;line-height:1.55;display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}
        .dshcurate-version-banner .grow{flex:1;min-width:200px}
        .dshcurate-version-banner button{height:24px;padding:0 8px;border:1px solid rgba(210,140,40,.5);border-radius:6px;background:transparent;color:inherit;font-size:11.5px;cursor:pointer}
        .dshcurate-hidden{margin:3px 0 0;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-scope .grow{flex:1}
      `
      document.head.appendChild(style)
      // Only remove a node this call created; an HMR-previous instance keeps
      // ownership of its own node until its own disposer runs.
      return () => {
        try {
          if (style.parentNode !== null) style.parentNode.removeChild(style)
        } catch {}
      }
    }

    // --- components ----------------------------------------------------------

    function MarkdownEditor(props) {
      const { value, mode, cwd, disabled, onMode, onChange, placeholder, label, large } = props
      const [text, setText] = react.useState(typeof value === 'string' ? value : '')
      const lastPushed = react.useRef(typeof value === 'string' ? value : '')
      const renderedRef = react.useRef(null)
      const focusedRef = react.useRef(false)
      const timerRef = react.useRef(null)
      const latest = react.useRef(text)
      latest.current = text

      react.useEffect(() => {
        if (typeof value !== 'string') return
        if (value === lastPushed.current) return
        lastPushed.current = value
        setText(value)
        if (mode === 'rendered' && renderedRef.current && !focusedRef.current) {
          renderedRef.current.innerHTML = markdownToHtml(value)
          resolveRenderedImages(renderedRef.current, cwd)
        }
      }, [value])

      react.useEffect(() => {
        if (mode !== 'rendered' || !renderedRef.current) return
        if (focusedRef.current) return
        renderedRef.current.innerHTML = markdownToHtml(text)
        resolveRenderedImages(renderedRef.current, cwd)
      }, [mode, cwd])

      react.useEffect(() => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current)
      }, [])

      function push(next) {
        lastPushed.current = next
        setText(next)
        onChange(next)
      }
      function flushRendered() {
        if (!renderedRef.current) return
        const markdown = htmlToMarkdown(renderedRef.current.innerHTML)
        if (markdown !== latest.current) push(markdown)
      }
      function onSourceChange(event) {
        push(event.target.value)
      }
      function onRenderedInput() {
        if (timerRef.current !== null) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          flushRendered()
        }, 220)
      }
      function onRenderedBlur() {
        focusedRef.current = false
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        flushRendered()
      }
      function switchMode(next) {
        if (mode === 'rendered') flushRendered()
        onMode(next)
      }

      const controls = jsxs('div', {
        className: 'dshcurate-modes',
        children: [
          jsx('span', { children: label || tr('edit.block') }),
          jsxs('div', {
            className: 'group',
            children: [
              jsx('button', {
                type: 'button',
                className: mode === 'source' ? 'active' : '',
                'aria-pressed': mode === 'source' ? 'true' : 'false',
                onClick: () => switchMode('source'),
                children: tr('group.view.source'),
              }),
              jsx('button', {
                type: 'button',
                className: mode === 'rendered' ? 'active' : '',
                'aria-pressed': mode === 'rendered' ? 'true' : 'false',
                onClick: () => switchMode('rendered'),
                children: tr('group.view.rendered'),
              }),
            ],
          }),
        ],
      })
      const editor = mode === 'source'
        ? jsx('textarea', {
            className: 'dshcurate-source',
            value: text,
            placeholder: placeholder || tr('edit.placeholder'),
            disabled,
            onChange: onSourceChange,
            onFocus: () => {
              focusedRef.current = true
            },
            onBlur: () => {
              focusedRef.current = false
            },
          })
        : jsx('div', {
            ref: renderedRef,
            className: `dshcurate-rendered dshcurate-md${large ? ' large' : ''}`,
            contentEditable: disabled ? false : true,
            suppressContentEditableWarning: true,
            'data-placeholder': placeholder || tr('edit.placeholder'),
            title: tr('group.view.rendered'),
            onInput: onRenderedInput,
            onBlur: onRenderedBlur,
            onFocus: () => {
              focusedRef.current = true
            },
          })
      return jsxs('div', { children: [controls, editor] })
    }

    function RenderedText(props) {
      const { text, cwd, className } = props
      const ref = react.useRef(null)
      const source = typeof text === 'string' ? text : ''
      react.useEffect(() => {
        const node = ref.current
        if (!node) return
        node.innerHTML = markdownToHtml(source)
        resolveRenderedImages(node, cwd)
      }, [source, cwd])
      return jsx('div', { ref, className: `dshcurate-md${className ? ` ${className}` : ''}` })
    }

    function MessageEditor(props) {
      const { editing, message, cwd, disabled, textOnlyView, onValue, onMode, onBlock, onBlockConfirm, onBlockCancel, onCancel, onSave } = props
      let blockList = message && Array.isArray(message.editableBlocks) ? message.editableBlocks : []
      if (editing.mode === 'tool' || editing.mode === 'context' || textOnlyView) {
        blockList = blockList.filter((block) => block.kind === 'text')
      }
      const showPicker = editing.mode !== 'prompt' && blockList.length > 1
      const pendingBlock = editing.pendingBlock !== undefined && editing.pendingBlock !== null && editing.pendingBlock !== editing.blockIndex
      const title = editing.mode === 'prompt'
        ? tr('edit.title.prompt')
        : editing.mode === 'reply'
          ? tr('edit.title.reply')
          : editing.mode === 'tool'
            ? tr('edit.title.tool')
            : tr('edit.title.context')
      return jsxs('div', {
        className: 'dshcurate-editor',
        children: [
          jsxs('div', {
            className: 'dshcurate-editor-head',
            children: [
              jsx('span', { children: title }),
              showPicker ? jsxs('label', {
                children: [
                  jsx('span', { children: tr('edit.block') }),
                  jsx('select', {
                    value: String(editing.blockIndex),
                    'aria-label': tr('edit.block'),
                    disabled,
                    onChange: (event) => onBlock(Number(event.target.value)),
                    children: blockList.map((block) => jsx('option', {
                      value: String(block.index),
                      children: block.kind === 'reasoning' ? tr('edit.block.reasoning') : tr('edit.block.text'),
                    }, block.index)),
                  }),
                ],
              }) : null,
              jsx('span', { className: 'grow' }),
            ],
          }),
          pendingBlock ? jsxs('div', {
            className: 'dshcurate-confirm',
            children: [
              jsx('p', { children: tr('edit.blockSwitch') }),
              jsxs('div', {
                className: 'row',
                children: [
                  jsx('button', { type: 'button', className: 'dshcurate-btn small', onClick: onBlockCancel, children: tr('edit.cancel') }),
                  jsx('button', { type: 'button', className: 'dshcurate-btn small primary', onClick: onBlockConfirm, children: tr('edit.blockSwitch.confirm') }),
                ],
              }),
            ],
          }) : null,
          jsx(MarkdownEditor, {
            value: editing.value,
            mode: editing.viewMode === 'source' ? 'source' : 'rendered',
            cwd,
            disabled,
            onMode,
            onChange: onValue,
            placeholder: tr('edit.placeholder'),
            label: title,
            large: true,
          }),
          message && message.attachments > 0
            ? jsx('div', { className: 'dshcurate-note', children: tr('edit.attachments', { count: message.attachments }) })
            : null,
          jsxs('div', {
            className: 'dshcurate-editor-foot',
            children: [
              jsx('span', { className: 'hint', children: tr('edit.hint') }),
              jsx('button', { type: 'button', className: 'dshcurate-btn', disabled, onClick: onCancel, children: tr('edit.cancel') }),
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn primary',
                disabled: disabled || editing.value.trim() === '',
                onClick: onSave,
                children: tr('edit.save'),
              }),
            ],
          }),
        ],
      })
    }

    function MessageDetail(props) {
      const { node, full, nodeEdits, editing, cwd, busy, textOnlyView, tone, toneDisabled, showTone, onTone, onEdit, onUndo, onLoadFull, onValue, onMode, onBlock, onBlockConfirm, onBlockCancel, onCancel, onSave } = props
      const edits = Array.isArray(nodeEdits) ? nodeEdits : []
      const role = node.role || 'context'
      const isTool = role === 'tool'
      const staged = edits.length > 0
      const editingHere = editing !== null && editing !== undefined && editing.seq === node.seq
      const editable = full ? full.editable === true : node.editable === true
      const reason = full && full.editReason ? full.editReason : node.editReason
      const blocks = full && Array.isArray(full.blocks) ? full.blocks : null
      const promptEdit = edits.find((edit) => edit.mode === 'prompt')
      const plain = typeof node.plainText === 'string' && node.plainText !== ''
        ? node.plainText
        : (typeof node.previewPlain === 'string' ? node.previewPlain : '')
      const text = full
        ? (typeof full.text === 'string' ? full.text : '')
        : (textOnlyView && plain !== '' ? plain : (typeof node.text === 'string' ? node.text : (typeof node.preview === 'string' ? node.preview : '')))
      const displayBlocks = blocks
        ? (textOnlyView ? blocks.filter((block) => block.kind === 'text') : blocks)
        : null
      function stagedBlock(index) {
        return edits.find((edit) => edit.mode !== 'prompt' && edit.blockIndex === index)
      }

      let body
      if (editingHere) {
        body = jsx(MessageEditor, {
          editing,
          message: full,
          cwd,
          disabled: busy,
          textOnlyView,
          onValue,
          onMode,
          onBlock,
          onBlockConfirm,
          onBlockCancel,
          onCancel,
          onSave,
        })
      } else if (isTool) {
        body = jsx('pre', {
          className: `dshcurate-tool-text${node.isError ? ' error' : ''}`,
          children: text === '' ? '…' : text,
        })
      } else if (full && promptEdit) {
        body = jsx(RenderedText, { text: promptEdit.text, cwd, className: 'dshcurate-message-body' })
      } else if (displayBlocks && displayBlocks.length > 0) {
        body = jsx('div', {
          className: 'dshcurate-message-body',
          children: displayBlocks.map((block) => {
            const stagedEdit = stagedBlock(block.index)
            const blockText = stagedEdit ? stagedEdit.text : (typeof block.text === 'string' ? block.text : '')
            if (block.kind === 'reasoning') {
              return jsxs('details', {
                className: 'dshcurate-reasoning',
                children: [
                  jsx('summary', { children: tr('detail.reasoning') }),
                  jsx('pre', { children: blockText }),
                ],
              }, block.index)
            }
            if (block.kind === 'text') {
              return jsx(RenderedText, { text: blockText, cwd }, block.index)
            }
            return jsx('span', {
              className: 'dshcurate-block-chip',
              title: block.type === 'tool-call' ? tr('edit.toolArgsReadOnly') : undefined,
              children: block.label || block.type || 'block',
            }, block.index)
          }),
        })
      } else {
        const fallback = promptEdit ? promptEdit.text : (textOnlyView && plain !== '' ? plain : text)
        body = jsx(RenderedText, { text: fallback, cwd, className: 'dshcurate-message-body' })
      }

      return jsxs('div', {
        className: `dshcurate-message${staged ? ' staged' : ''}`,
        children: [
          jsxs('div', {
            className: 'dshcurate-message-head',
            children: [
              jsx('span', { className: `dshcurate-role ${role}`, children: roleText(role) }),
              jsx('span', { className: 'seq', children: `#${node.seq}` }),
              node.turn !== null && node.turn !== undefined ? jsx('span', { children: `· ${tr('group.range', { turn: node.turn })}` }) : null,
              node.attachments > 0 ? jsx('span', { children: tr('detail.attachments', { count: node.attachments }) }) : null,
              node.patched || (full && full.patched) ? jsx('span', { className: 'dshcurate-badge', children: tr('detail.patched') }) : null,
              staged ? jsx('span', { className: 'dshcurate-badge edit', children: tr('edit.staged') }) : null,
              showTone !== false && (tone === 'keep' || tone === 'normal' || tone === 'minor')
                ? jsx('div', {
                    className: 'dshcurate-msg-tones',
                    children: ['keep', 'normal', 'minor'].map((value) => jsx('button', {
                      type: 'button',
                      className: `dshcurate-tone${tone === value ? ' active' : ''}`,
                      title: tr(`tone.${value}.hint`),
                      'aria-pressed': tone === value ? 'true' : 'false',
                      disabled: toneDisabled === true,
                      onClick: () => {
                        if (typeof onTone === 'function') onTone(node, value)
                      },
                      children: tr(`tone.${value}`),
                    }, value)),
                  })
                : null,
              jsx('span', { className: 'spring' }),
              staged ? jsx('button', { type: 'button', className: 'dshcurate-btn small', onClick: () => onUndo(node), children: tr('edit.undo') }) : null,
              !full ? jsx('button', { type: 'button', className: 'dshcurate-btn small', disabled: busy, onClick: () => onLoadFull(node), children: tr('detail.loadFull') }) : null,
              editable && !editingHere ? jsx('button', { type: 'button', className: 'dshcurate-btn small', disabled: busy, onClick: () => onEdit(node), children: tr('edit.entry') }) : null,
            ],
          }),
          full && full.truncated ? jsx('div', { className: 'dshcurate-note', children: tr('detail.truncated') }) : null,
          !editable && reason ? jsx('div', { className: 'dshcurate-note', children: String(reason) }) : null,
          body,
        ],
      })
    }

    function roleText(role) {
      const key = `misc.${typeof role === 'string' ? role : 'context'}`
      const label = tr(key)
      return label === key ? String(role || '') : label
    }

    function isConversationNode(node, textOnlyView) {
      if (!node) return false
      if (!textOnlyView) return true
      if (node.role === 'user') return true
      if (node.role !== 'assistant') return false
      const plain = typeof node.plainText === 'string' && node.plainText !== ''
        ? node.plainText
        : (typeof node.previewPlain === 'string' ? node.previewPlain : (typeof node.preview === 'string' ? node.preview : ''))
      return plain.trim() !== ''
    }

    function Snippet(props) {
      const { node, full, textOnly, onEdit } = props
      const text = full && typeof node.text === 'string'
        ? node.text
        : (textOnly && typeof node.previewPlain === 'string' ? node.previewPlain : (typeof node.preview === 'string' ? node.preview : ''))
      return jsxs('div', {
        className: `dshcurate-snippet${node.isError ? ' error' : ''}`,
        children: [
          jsx('span', { className: `dshcurate-role ${node.role || 'context'}`, children: roleText(node.role) }),
          jsx('span', { className: 'dshcurate-snippet-seq', children: `#${node.seq}` }),
          jsx('span', { className: 'dshcurate-snippet-text', children: text === '' ? '…' : text }),
          node.editable && typeof onEdit === 'function'
            ? jsx('button', {
                type: 'button',
                className: 'dshcurate-snippet-pencil',
                title: tr('edit.entry'),
                'aria-label': tr('edit.entry'),
                onClick: () => onEdit(node),
                children: '✎',
              })
            : null,
        ],
      })
    }

    function GroupSnippets(props) {
      const {
        nodes, detail, loading, cwd, edits, messages, busy, editing, textOnlyView,
        onLoadDetail, onCloseDetail, onEdit, onEditSnippet, onUndo, onLoadFull,
        onValue, onEditorMode, onBlock, onBlockConfirm, onBlockCancel, onCancel, onSave,
        toneOfNode, onNodeTone, toneDisabledForNode,
      } = props
      const full = Array.isArray(detail) && detail.length > 0
      const allNodes = full ? detail : nodes
      const shown = textOnlyView ? allNodes.filter((node) => isConversationNode(node, true)) : allNodes
      const hiddenCount = allNodes.length - shown.length
      // Large detail expansions render one page at a time so a 300+ message
      // group does not run every markdown sanitizer in a single render pass.
      const [detailLimit, setDetailLimit] = react.useState(DETAIL_PAGE_SIZE)
      react.useEffect(() => {
        if (!full) setDetailLimit(DETAIL_PAGE_SIZE)
      }, [full])
      const renderedDetail = full && shown.length > detailLimit ? shown.slice(0, detailLimit) : shown
      const remainingDetail = full ? shown.length - renderedDetail.length : 0
      const editsOf = (node) => (Array.isArray(edits) ? edits.filter((edit) => edit.seq === node.seq) : [])
      return jsxs('div', {
        className: 'dshcurate-snippets-wrap',
        children: [
          full
            ? jsx('div', {
                className: 'dshcurate-detail',
                children: jsx('div', {
                  className: 'dshcurate-detail-list',
                  children: shown.length === 0
                    ? jsx('div', { className: 'dshcurate-note', children: tr('view.empty') })
                    : renderedDetail.map((node) => jsx(MessageDetail, {
                        node,
                        full: messages && messages[node.seq] ? messages[node.seq] : null,
                        nodeEdits: editsOf(node),
                        editing: editing && editing.seq === node.seq ? editing : null,
                        cwd,
                        busy,
                        textOnlyView,
                        tone: toneOfNode ? toneOfNode(node) : null,
                        toneDisabled: toneDisabledForNode ? toneDisabledForNode(node) : true,
                        onTone: onNodeTone,
                        onEdit,
                        onUndo,
                        onLoadFull,
                        onValue,
                        onMode: onEditorMode,
                        onBlock,
                        onBlockConfirm,
                        onBlockCancel,
                        onCancel,
                        onSave,
                      }, node.seq)),
                }),
              })
            : jsx('div', {
                className: 'dshcurate-snippets',
                children: shown.map((node) => jsx(Snippet, { node, full: false, textOnly: textOnlyView, onEdit: onEditSnippet }, node.seq)),
              }),
          jsxs('div', {
            className: 'dshcurate-snippet-tools',
            children: [
              jsx('span', {
                className: 'muted',
                children: full ? tr('content.loaded', { count: shown.length }) : tr('content.hint', { count: shown.length }),
              }),
              hiddenCount > 0 ? jsx('span', { className: 'muted', children: tr('view.hidden', { count: hiddenCount }) }) : null,
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn small',
                disabled: loading,
                onClick: full ? onCloseDetail : onLoadDetail,
                children: loading ? tr('content.loading') : (full ? tr('content.collapse') : tr('content.expand')),
              }),
              remainingDetail > 0
                ? jsx('button', {
                    type: 'button',
                    className: 'dshcurate-btn small',
                    onClick: () => setDetailLimit((value) => value + DETAIL_PAGE_SIZE),
                    children: tr('content.showMore', { count: remainingDetail }),
                  })
                : null,
            ],
          }),
        ],
      })
    }

    function GroupCard(props) {
      const {
        group, surface, cwd, disabled, edits, messages, busy, editing, textOnlyView,
        segments, groupTone, onGroupTone, onNodeTone, toneOfNode, toneDisabledForNode,
        onSplit, onMerge, canMerge,
        detail, detailLoading, onLoadDetail, onCloseDetail, onEdit, onEditSnippet, onUndo, onLoadFull,
        onValue, onEditorMode, onBlock, onBlockConfirm, onBlockCancel, onCancel, onSave,
      } = props
      const start = surface[group.startIndex]
      const end = surface[group.endIndex]
      const nodes = surface.slice(group.startIndex, group.endIndex + 1)
      const visibleNodes = textOnlyView ? nodes.filter((node) => isConversationNode(node, true)) : nodes
      const hiddenCount = nodes.length - visibleNodes.length
      const groupEdits = Array.isArray(edits) ? edits.filter((edit) => {
        const index = surface.findIndex((node) => node.seq === edit.seq)
        return index >= group.startIndex && index <= group.endIndex
      }) : []
      const tokens = visibleNodes.reduce((sum, node) => sum + (Number.isFinite(node.tokens) ? node.tokens : 0), 0)
      const counts = { user: 0, assistant: 0, tool: 0, context: 0 }
      for (const node of visibleNodes) if (Object.prototype.hasOwnProperty.call(counts, node.role)) counts[node.role] += 1
      const title = group.turn === null || group.turn === undefined ? tr('group.noTurn') : tr('group.range', { turn: group.turn })
      const toneOptions = ['keep', 'normal', 'minor'].map((tone) => jsx('button', {
        type: 'button',
        className: `dshcurate-tone${groupTone === tone ? ' active' : ''}`,
        title: tr(`tone.${tone}.hint`),
        'aria-pressed': groupTone === tone ? 'true' : 'false',
        disabled: disabled,
        onClick: () => onGroupTone(tone),
        children: tr(`tone.${tone}`),
      }, tone))

      const segmentViews = (Array.isArray(segments) ? segments : []).map((segment) => {
        const segmentNodes = surface.slice(segment.startIndex, segment.endIndex + 1)
        const segmentHidden = textOnlyView ? segmentNodes.filter((node) => !isConversationNode(node, true)).length : 0
        const head = jsxs('div', {
          className: 'dshcurate-segment-head',
          children: [
            jsx('b', { children: tr(`tone.${segment.tone}`) }),
            jsx('span', { children: tr('segment.range', { start: segment.startSeq, end: segment.endSeq, count: segment.count }) }),
            jsx('span', { children: tr('group.tokens', { tokens: fmtTokens(segment.tokens) }) }),
            segmentHidden > 0 ? jsx('span', { children: tr('segment.hidden', { count: segmentHidden }) }) : null,
          ],
        })
        if (segment.tone === 'keep') {
          return jsxs('div', {
            className: 'dshcurate-segment keep',
            children: [head, jsx('div', { className: 'dshcurate-note', children: tr('segment.keep.note') })],
          }, segment.key)
        }
        return jsxs('div', {
          className: 'dshcurate-segment',
          children: [head, jsx('div', { className: 'dshcurate-note', children: tr('segment.autoSummary') })],
        }, segment.key)
      })

      return jsxs('div', {
        className: `dshcurate-card${group.locked ? ' locked' : ''}`,
        children: [
          jsxs('div', {
            className: 'dshcurate-card-head',
            children: [
              jsxs('div', {
                className: 'dshcurate-card-meta',
                children: [
                  jsx('b', { children: title }),
                  jsx('span', { children: ` · #${start.seq}–#${end.seq} · ` }),
                  jsx('span', { children: tr('group.counts', counts) }),
                  jsx('span', { children: ` · ${tr('group.tokens', { tokens: fmtTokens(tokens) })}` }),
                  group.locked ? jsx('span', { className: 'dshcurate-badge', children: tr('locked.badge') }) : null,
                  group.locked && segments.some((segment) => segment.tone !== 'keep')
                    ? jsx('span', { className: 'dshcurate-badge', children: tr('locked.override') })
                    : null,
                  groupTone === 'mixed' ? jsx('span', { className: 'dshcurate-badge', children: tr('tone.mixed') }) : null,
                  groupEdits.length > 0 ? jsx('span', { className: 'dshcurate-badge edit', children: tr('footer.pending', { count: groupEdits.length }) }) : null,
                  textOnlyView && hiddenCount > 0 ? jsx('span', { className: 'dshcurate-badge', children: tr('view.hidden', { count: hiddenCount }) }) : null,
                ],
              }),
              jsx('div', { className: 'dshcurate-tones', children: toneOptions }),
            ],
          }),
          jsx(GroupSnippets, {
            nodes,
            detail,
            loading: detailLoading,
            cwd,
            edits,
            messages,
            busy,
            editing,
            textOnlyView,
            onLoadDetail,
            onCloseDetail,
            onEdit,
            onEditSnippet,
            onUndo,
            onLoadFull,
            onValue,
            onEditorMode,
            onBlock,
            onBlockConfirm,
            onBlockCancel,
            onCancel,
            onSave,
            toneOfNode,
            onNodeTone,
            toneDisabledForNode,
          }),
          ...segmentViews,
          jsxs('div', {
            className: 'dshcurate-tools',
            children: [
              jsx('button', { type: 'button', className: 'dshcurate-btn small', disabled: disabled || group.locked, onClick: onSplit, children: tr('group.split') }),
              canMerge ? jsx('button', { type: 'button', className: 'dshcurate-btn small', disabled: disabled || group.locked, onClick: onMerge, children: tr('group.merge') }) : null,
            ],
          }),
        ],
      })
    }

    function Workbench(props) {
      const { sessionId, onClose, docked = false } = props
      // Re-render when the host locale switches (panel copy follows it).
      useLocaleTick()
      const titleId = react.useId()
      const panelRef = react.useRef(null)
      const [phase, setPhase] = react.useState('loading')
      const [state, setState] = react.useState(null)
      const [surface, setSurface] = react.useState([])
      const [groups, setGroups] = react.useState([])
      const [preserveTurns, setPreserveTurns] = react.useState(2)
      const [errorText, setErrorText] = react.useState('')
      const [toast, setToast] = react.useState('')
      const [banner, setBanner] = react.useState(null)
      const [details, setDetails] = react.useState({})
      const [detailBusy, setDetailBusy] = react.useState('')
      const [messages, setMessages] = react.useState({})
      const [messageBusy, setMessageBusy] = react.useState(0)
      const [edits, setEdits] = react.useState([])
      const [editing, setEditing] = react.useState(null)
      const [applyingEdits, setApplyingEdits] = react.useState(false)
      const [compressOpen, setCompressOpen] = react.useState(false)
      const [compressTarget, setCompressTarget] = react.useState('direct')
      const [compressMethod, setCompressMethod] = react.useState('curated')
      const [compressChecked, setCompressChecked] = react.useState(false)
      const [helpOpen, setHelpOpen] = react.useState(false)
      const [undoStack, setUndoStack] = react.useState([])
      const [compacting, setCompacting] = react.useState(false)
      const [focusSeq, setFocusSeq] = react.useState(null)
      const [textOnlyView, setTextOnlyView] = react.useState(false)
      const [summaryTextOnly, setSummaryTextOnly] = react.useState(false)
      const [tones, setTones] = react.useState({})
      const [draftNotice, setDraftNotice] = react.useState('')
      const toastTimer = react.useRef(null)
      // True while a non-empty saved draft could not be restored at all: the
      // autosave must not overwrite it with an empty payload.
      const protectedDraftRef = react.useRef(false)
      // Latest committed draft payload, used to flush the debounce on unmount.
      const latestDraftRef = react.useRef(null)
      const draftReadyRef = react.useRef(false)
      const draftTimerRef = react.useRef(null)
      // Token/abort pair for load(): a superseded response must never win.
      const loadTokenRef = react.useRef(null)
      const loadAbortRef = react.useRef(null)
      const mountedRef = react.useRef(true)
      // The scroll container of the workbench body; the compression sheet is
      // rendered at its top.
      const bodyRef = react.useRef(null)

      // Opening the compression sheet inserts it at the top of the scrollable
      // body. A user who is scrolled down would otherwise see nothing change:
      // the browser keeps their scroll anchor, so the sheet opens far above the
      // viewport and the button looks dead. Scroll it into view and focus the
      // first control for keyboard users.
      react.useEffect(() => {
        if (!compressOpen) return undefined
        const body = bodyRef.current
        if (body !== null) body.scrollTop = 0
        const timer = setTimeout(() => {
          const dialog = body !== null ? body.querySelector('.dshcurate-compress') : null
          const focusable = dialog !== null
            ? dialog.querySelector('input[type="radio"], input[type="checkbox"], button')
            : null
          if (focusable !== null && typeof focusable.focus === 'function') {
            try {
              focusable.focus({ preventScroll: true })
            } catch {
              focusable.focus()
            }
          }
        }, 30)
        return () => clearTimeout(timer)
      }, [compressOpen])

      function showToast(message) {
        setToast(message)
        if (toastTimer.current !== null) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(''), 6000)
      }

      function restoredEdits(data, saved) {
        const seqs = new Set((Array.isArray(data.nodes) ? data.nodes : []).map((node) => node.seq))
        const restored = []
        for (const item of saved.edits) {
          if (!item || typeof item !== 'object') continue
          if (item.mode !== 'prompt' && item.mode !== 'reply' && item.mode !== 'tool' && item.mode !== 'context') continue
          if (typeof item.seq !== 'number' || !seqs.has(item.seq)) continue
          if (typeof item.text !== 'string') continue
          if (item.mode !== 'prompt' && typeof item.blockIndex !== 'number') continue
          restored.push({
            key: editKeyFor(item.mode, item.seq, item.blockIndex),
            seq: item.seq,
            messageId: item.messageId || null,
            mode: item.mode,
            blockIndex: typeof item.blockIndex === 'number' ? item.blockIndex : undefined,
            kind: typeof item.kind === 'string' ? item.kind : undefined,
            text: item.text,
            original: typeof item.original === 'string' ? item.original : '',
          })
        }
        return restored
      }

      function applyLoaded(data) {
        setUndoStack([])
        setDetails({})
        setDetailBusy('')
        setMessages({})
        setEditing(null)
        setState(data)
        const saved = readDraft(sessionId)
        const usable = saved !== null && typeof saved === 'object' && DRAFT_VERSIONS.has(saved.version) ? saved : null
        const savedHasContent = saved !== null && typeof saved === 'object' && draftHasContent(saved)
        const fallbackPreserve = normalizePreserveTurns(data.preserveRecentTurns)
        const savedPreserve = usable !== null ? normalizePreserveTurns(usable.preserveTurns) : null
        const nextPreserve = savedPreserve !== null ? savedPreserve : (fallbackPreserve !== null ? fallbackPreserve : 2)
        const built = buildGroups(data, nextPreserve)
        setSurface(built.surface)
        setGroups(built.groups)
        setPreserveTurns(nextPreserve)
        const seqs = new Set((Array.isArray(data.nodes) ? data.nodes : []).map((node) => node.seq))
        let restoredCount = 0
        if (usable !== null) {
          const toneMap = {}
          for (const item of Array.isArray(usable.tones) ? usable.tones : []) {
            if (!item || typeof item.seq !== 'number' || !seqs.has(item.seq)) continue
            if (item.tone !== 'keep' && item.tone !== 'normal' && item.tone !== 'minor') continue
            toneMap[item.seq] = item.tone
          }
          const restored = restoredEdits(data, usable)
          restoredCount = Object.keys(toneMap).length + restored.length
          setTones(toneMap)
          setEdits(restored)
          setTextOnlyView(usable.textOnlyView === true)
          setSummaryTextOnly(usable.summaryTextOnly === true)
        } else {
          setTones({})
          setEdits([])
          setTextOnlyView(false)
          setSummaryTextOnly(false)
        }
        // Seq numbers survive an append-only session, so a draft saved before
        // the log grew is still usable for the messages that still exist. Warn
        // when that earlier state was partially (or not at all) restored.
        const savedLastSeq = usable !== null && typeof usable.lastSeq === 'number' ? usable.lastSeq : null
        const staleDraft = usable !== null && (savedLastSeq === null || savedLastSeq !== data.lastSeq)
        protectedDraftRef.current = savedHasContent && restoredCount === 0
        setDraftNotice(staleDraft ? tr(restoredCount > 0 ? 'draft.restored' : 'draft.unrestorable') : '')
        setPhase('ready')
        setErrorText('')
      }

      async function load() {
        // Supersede any in-flight load so a slow older response cannot
        // overwrite a newer one, and ignore responses after unmount.
        const token = {}
        loadTokenRef.current = token
        if (loadAbortRef.current !== null) {
          try {
            loadAbortRef.current.abort()
          } catch {}
        }
        const controller = typeof AbortController === 'function' ? new AbortController() : null
        loadAbortRef.current = controller
        setPhase('loading')
        setErrorText('')
        try {
          const data = await loadState(sessionId, controller !== null ? controller.signal : undefined)
          if (loadTokenRef.current !== token || !mountedRef.current) return
          applyLoaded(data)
        } catch (error) {
          if (loadTokenRef.current !== token || !mountedRef.current) return
          if (error && error.name === 'AbortError') return
          setErrorText(rawErrorMessage(error))
          setPhase('error')
        }
      }

      react.useEffect(() => {
        mountedRef.current = true
        load()
        return () => {
          mountedRef.current = false
          loadTokenRef.current = null
          if (loadAbortRef.current !== null) {
            try {
              loadAbortRef.current.abort()
            } catch {}
            loadAbortRef.current = null
          }
          if (toastTimer.current !== null) clearTimeout(toastTimer.current)
          // Closing the panel inside the autosave debounce must not drop the
          // latest committed tone/view/edit change: flush the last payload.
          if (draftReadyRef.current && latestDraftRef.current !== null) {
            const payload = latestDraftRef.current
            if (!(protectedDraftRef.current && !draftHasContent(payload))) writeDraft(sessionId, payload)
          }
        }
      }, [sessionId])

      function draftPayload() {
        return {
          version: DRAFT_VERSION,
          lastSeq: state ? state.lastSeq : -1,
          preserveTurns,
          textOnlyView,
          summaryTextOnly,
          tones: Object.keys(tones).map((seq) => ({ seq: Number(seq), tone: tones[seq] })),
          edits: edits.map((edit) => ({
            seq: edit.seq,
            messageId: edit.messageId,
            mode: edit.mode,
            blockIndex: edit.blockIndex,
            kind: edit.kind,
            text: edit.text,
            original: edit.original,
          })),
        }
      }

      function saveDraftNow() {
        // An explicit save is the user's decision, so it always rewrites the
        // stored draft; only then report success (storage may be blocked/full).
        if (writeDraft(sessionId, draftPayload())) {
          protectedDraftRef.current = false
          showToast(tr('toast.saved'))
        } else {
          showToast(tr('toast.saveFailed'))
        }
      }

      function snapshotWorkbench() {
        return {
          tones: { ...tones },
          edits: edits.map((edit) => ({ ...edit })),
          groups: groups.map((group) => ({ ...group })),
          preserveTurns,
          textOnlyView,
          summaryTextOnly,
        }
      }

      function pushUndo() {
        const snapshot = snapshotWorkbench()
        setUndoStack((current) => [...current.slice(-49), snapshot])
      }

      function undoLast() {
        if (undoStack.length === 0) {
          showToast(tr('undo.empty'))
          return
        }
        const last = undoStack[undoStack.length - 1]
        setTones(last.tones)
        setEdits(last.edits)
        if (Array.isArray(last.groups)) setGroups(last.groups)
        if (typeof last.preserveTurns === 'number') setPreserveTurns(last.preserveTurns)
        setTextOnlyView(last.textOnlyView === true)
        setSummaryTextOnly(last.summaryTextOnly === true)
        setEditing(null)
        setUndoStack((current) => current.slice(0, -1))
        showToast(tr('undo.done'))
      }

      react.useEffect(() => {
        if (phase !== 'ready') return undefined
        const payload = draftPayload()
        latestDraftRef.current = payload
        draftReadyRef.current = true
        const write = () => {
          // Never autosave an empty draft over a non-empty saved draft that
          // could not be restored.
          if (protectedDraftRef.current && !draftHasContent(payload)) return
          if (writeDraft(sessionId, payload)) protectedDraftRef.current = false
        }
        const handle = setTimeout(write, 350)
        draftTimerRef.current = handle
        return () => {
          clearTimeout(handle)
          if (draftTimerRef.current === handle) draftTimerRef.current = null
        }
      }, [phase, groups, preserveTurns, edits, state, textOnlyView, summaryTextOnly, tones])

      /** Drop a queued autosave so an explicit clear cannot be resurrected. */
      function cancelPendingDraftWrite() {
        if (draftTimerRef.current !== null) {
          clearTimeout(draftTimerRef.current)
          draftTimerRef.current = null
        }
      }

      function rangeKeyOf(group) {
        const start = surface[group.startIndex]
        const end = surface[group.endIndex]
        return start !== undefined && end !== undefined ? `${start.seq}-${end.seq}` : ''
      }

      function detailOf(group) {
        const key = rangeKeyOf(group)
        return key === '' ? null : (details[key] || null)
      }

      async function fetchDetail(group) {
        const start = surface[group.startIndex]
        const end = surface[group.endIndex]
        if (start === undefined || end === undefined) return null
        const key = `${start.seq}-${end.seq}`
        setDetailBusy(key)
        try {
          const data = await loadContent(sessionId, start.seq, end.seq)
          const nodes = Array.isArray(data.nodes) ? data.nodes : []
          setDetails((current) => ({ ...current, [key]: nodes }))
          return nodes
        } catch (error) {
          showToast(tr('content.failed', { error: String(error && error.message ? error.message : error) }))
          return null
        } finally {
          setDetailBusy('')
        }
      }

      async function toggleDetail(group) {
        const key = rangeKeyOf(group)
        if (key === '') return
        if (details[key] !== undefined) {
          setDetails((current) => {
            const next = { ...current }
            delete next[key]
            return next
          })
          return
        }
        await fetchDetail(group)
      }

      async function loadFull(node) {
        if (!node || typeof node.seq !== 'number') return null
        if (messages[node.seq]) return messages[node.seq]
        setMessageBusy((value) => value + 1)
        try {
          const data = await loadMessage(sessionId, node.seq)
          setMessages((current) => ({ ...current, [node.seq]: data }))
          return data
        } catch (error) {
          showToast(tr('edit.failed', { error: String(error && error.message ? error.message : error) }))
          return null
        } finally {
          setMessageBusy((value) => Math.max(0, value - 1))
        }
      }

      async function openEditor(node) {
        if (!node) return
        const full = messages[node.seq] || await loadFull(node)
        if (!full) return
        if (full.editable !== true) {
          showToast(typeof full.editReason === 'string' && full.editReason !== '' ? full.editReason : tr('edit.readOnly'))
          return
        }
        const mode = full.editKind === 'prompt' || full.editKind === 'reply' || full.editKind === 'tool' || full.editKind === 'context'
          ? full.editKind
          : 'prompt'
        let blockIndex = null
        let kind = null
        let original = ''
        let value = ''
        if (mode !== 'prompt') {
          let blocks = Array.isArray(full.editableBlocks) ? full.editableBlocks : []
          if (mode === 'tool' || mode === 'context' || textOnlyView) blocks = blocks.filter((block) => block.kind === 'text')
          if (blocks.length === 0) {
            showToast(tr('edit.readOnly'))
            return
          }
          const previous = edits.find((edit) => edit.seq === node.seq && edit.mode === mode)
          const block = previous
            ? (blocks.find((candidate) => candidate.index === previous.blockIndex) || blocks[0])
            : (blocks.find((candidate) => candidate.kind === 'text') || blocks[0])
          blockIndex = block.index
          kind = block.kind
          original = block.text
          const staged = edits.find((edit) => edit.key === editKeyFor(mode, node.seq, blockIndex))
          value = staged ? staged.text : original
        } else {
          original = typeof full.promptText === 'string' ? full.promptText : ''
          const staged = edits.find((edit) => edit.key === editKeyFor('prompt', node.seq))
          value = staged ? staged.text : original
        }
        setEditing({
          seq: node.seq,
          messageId: node.messageId || full.messageId || null,
          mode,
          blockIndex,
          kind,
          original,
          value,
          viewMode: mode === 'tool' ? 'source' : 'rendered',
          message: full,
        })
      }

      async function editFromPreview(group, node) {
        if (!group || !node) return
        const key = rangeKeyOf(group)
        if (details[key] === undefined) {
          const nodes = await fetchDetail(group)
          if (!nodes) return
        }
        await openEditor(node)
      }

      function setEditorValue(value) {
        setEditing((current) => (current ? { ...current, value } : current))
      }

      function setEditorMode(mode) {
        setEditing((current) => (current ? { ...current, viewMode: mode === 'source' ? 'source' : 'rendered' } : current))
      }

      /** Apply a pending block pick inside the open editor (no confirm layer). */
      function applyEditorBlock(current, index) {
        if (!current || !current.message) return current
        let blocks = Array.isArray(current.message.editableBlocks) ? current.message.editableBlocks : []
        if (current.mode === 'tool' || current.mode === 'context' || textOnlyView) {
          blocks = blocks.filter((block) => block.kind === 'text')
        }
        const block = blocks.find((candidate) => candidate.index === index)
        if (!block) return current
        const staged = edits.find((edit) => edit.key === editKeyFor(current.mode, current.seq, index))
        return {
          ...current,
          blockIndex: block.index,
          kind: block.kind,
          original: block.text,
          value: staged ? staged.text : block.text,
          pendingBlock: undefined,
        }
      }

      function setEditorBlock(index) {
        if (!editing || !editing.message) return
        // Switching blocks with an unsaved change used to call window.confirm;
        // ask inline instead (localized, non-blocking).
        if (editing.value !== editing.original) {
          setEditing({ ...editing, pendingBlock: index })
          return
        }
        setEditing(applyEditorBlock(editing, index))
      }

      function confirmBlockSwitch() {
        if (!editing || editing.pendingBlock === undefined || editing.pendingBlock === null) return
        setEditing(applyEditorBlock(editing, editing.pendingBlock))
      }

      function cancelBlockSwitch() {
        setEditing((current) => (current ? { ...current, pendingBlock: undefined } : current))
      }

      function cancelEditor() {
        setEditing(null)
      }

      function saveEditor() {
        if (!editing) return
        const text = typeof editing.value === 'string' ? editing.value : ''
        // Early returns must not leave a no-op snapshot on the undo stack.
        if (text.trim() === '') return
        if (text === editing.original) {
          setEditing(null)
          showToast(tr('edit.unchanged'))
          return
        }
        pushUndo()
        const key = editKeyFor(editing.mode, editing.seq, editing.blockIndex)
        const next = {
          key,
          seq: editing.seq,
          messageId: editing.messageId,
          mode: editing.mode,
          blockIndex: editing.blockIndex,
          kind: editing.kind,
          text,
          original: editing.original,
        }
        setEdits((current) => [...current.filter((edit) => edit.key !== key), next])
        setEditing(null)
        showToast(tr('edit.staged'))
      }

      function undoEditsForNode(seq) {
        pushUndo()
        setEdits((current) => current.filter((edit) => edit.seq !== seq))
        setEditing((current) => (current && current.seq === seq ? null : current))
      }

      function rebuildKeepTurns(nextPreserve) {
        if (!state) return
        setDetails({})
        const built = buildGroups(state, nextPreserve)
        setSurface(built.surface)
        setGroups(built.groups)
        setPreserveTurns(nextPreserve)
      }

      function changeTextOnlyView(next) {
        setTextOnlyView(next === true)
      }

      function changeSummaryTextOnly(next) {
        pushUndo()
        setSummaryTextOnly(next === true)
      }

      function changePreserve(event) {
        const next = Number(event.target.value)
        pushUndo()
        rebuildKeepTurns(next)
      }

      function setGroupTone(group, tone) {
        if (!group) return
        pushUndo()
        setTones((current) => {
          const next = { ...current }
          for (let index = group.startIndex; index <= group.endIndex; index += 1) {
            const node = surface[index]
            if (node) next[node.seq] = tone
          }
          return next
        })
      }

      function setNodeTone(node, tone) {
        if (!node) return
        const index = surface.findIndex((candidate) => candidate.seq === node.seq)
        if (index < 0) return
        const group = groupAt.get(index)
        if (!group) return
        pushUndo()
        const unit = units.unitOf(index)
        setTones((current) => {
          const next = { ...current }
          for (const unitIndex of unit) {
            const targetNode = surface[unitIndex]
            if (targetNode) next[targetNode.seq] = tone
          }
          return next
        })
      }

      function onSplit(group) {
        const index = middleCut(surface, group.startIndex, group.endIndex)
        if (index === null) {
          showToast(tr('toast.noSplit'))
          return
        }
        pushUndo()
        setGroups((current) => {
          const next = []
          for (const item of current) {
            if (item.id !== group.id) {
              next.push(item)
              continue
            }
            const left = { ...item, endIndex: index, id: `${surface[item.startIndex].seq}-${surface[index].seq}` }
            const right = { ...item, startIndex: index + 1, id: `${surface[index + 1].seq}-${surface[item.endIndex].seq}` }
            next.push(left, right)
          }
          return next
        })
      }

      function onMerge(group) {
        const index = groups.findIndex((item) => item.id === group.id)
        if (index === -1 || index >= groups.length - 1) return
        // Refusing to merge into the locked recent turns is a real answer: say
        // so instead of silently doing nothing (and do not push a no-op undo).
        if (groups[index + 1].locked) {
          showToast(tr('toast.mergeLocked'))
          return
        }
        pushUndo()
        setGroups((current) => {
          const currentIndex = current.findIndex((item) => item.id === group.id)
          if (currentIndex === -1 || currentIndex === current.length - 1) return current
          const nextGroup = current[currentIndex + 1]
          if (nextGroup.locked) return current
          const merged = {
            ...group,
            endIndex: nextGroup.endIndex,
            id: `${surface[group.startIndex].seq}-${surface[nextGroup.endIndex].seq}`,
          }
          const next = current.slice(0, currentIndex)
          next.push(merged, ...current.slice(currentIndex + 2))
          return next
        })
      }

      const groupAt = new Map()
      for (const group of groups) {
        for (let index = group.startIndex; index <= group.endIndex; index += 1) groupAt.set(index, group)
      }
      const units = buildToneUnits(surface)
      const toneAt = (index) => {
        const node = surface[index]
        if (!node) return 'normal'
        const group = groupAt.get(index)
        if (!group) return 'keep'
        // A recent turn defaults to keep, but an explicit per-message/group tone
        // is an opt-in override: the user may deliberately compress part of it.
        if (group.locked) return tones[node.seq] || 'keep'
        return tones[node.seq] || 'normal'
      }
      const groupSegments = new Map()
      for (const group of groups) groupSegments.set(group.id, segmentsForGroup(group, surface, toneAt, units))
      const segmentsOfGroup = (group) => groupSegments.get(group.id) || []
      const compressSegments = []
      for (const group of groups) {
        for (const segment of segmentsOfGroup(group)) {
          if (segment.tone !== 'keep') compressSegments.push({ ...segment, group })
        }
      }
      const selected = compressSegments
      const selectedTokens = compressSegments.reduce((sum, segment) => sum + segment.tokens, 0)
      const summaryTokens = compressSegments.reduce((sum, segment) => sum + estimatedSummaryTokens(segment), 0)
      const surfaceTokens = state ? state.surfaceTokens : 0
      const afterTokens = Math.max(0, surfaceTokens - selectedTokens + summaryTokens)
      const totalMessages = compressSegments.reduce((sum, segment) => sum + segment.count, 0)
      const keptMessages = groups.reduce((sum, group) => {
        const current = segmentsOfGroup(group)
        if (!current.some((segment) => segment.tone !== 'keep')) return sum
        return sum + current
          .filter((segment) => segment.tone === 'keep')
          .reduce((count, segment) => count + segment.count, 0)
      }, 0)
      const capabilities = state && state.capabilities && typeof state.capabilities === 'object' ? state.capabilities : null
      const hostVersion = state && typeof state.version === 'string' ? state.version : ''
      const versionIssue = phase === 'ready' && (hostVersion === '' || hostVersion !== PLUGIN_VERSION)
      const patchUnavailable = phase === 'ready' && capabilities !== null && capabilities.patch === false
      const busySession = Boolean(state && state.busy)
      const canApplyEdits = phase === 'ready' && !busySession && edits.length > 0 && !applyingEdits && !compacting
      const canCurated = phase === 'ready' && !busySession && compressSegments.length > 0 && !compacting
      const canOfficial = phase === 'ready' && !busySession && capabilities !== null && capabilities.compaction === true && !compacting
      const canConfirmCompression = !compacting
        && (compressTarget === 'direct' || edits.length > 0)
        && (compressMethod === 'curated' ? canCurated : canOfficial)
      const tailNode = surface.length > 0 ? surface[surface.length - 1] : null

      /**
       * Mirror the host's edit application on the local surface: prompt edits
       * land a replacement node at the same position, reply/tool/context edits
       * only change the effective node text. Used both to refresh the cards
       * after "apply edits" and to rebase the selected compression ranges when
       * "compress the modified context" applies edits first.
       */
      function projectionAfterEdits(data) {
        const applied = Array.isArray(data.applied) ? data.applied : []
        const unchanged = Array.isArray(data.unchanged) ? data.unchanged : []
        const nodes = data.nodes && typeof data.nodes === 'object' ? data.nodes : {}
        const nextTones = { ...tones }
        for (const item of applied) {
          if (item.mode === 'prompt' && nextTones[item.seq] !== undefined) {
            nextTones[item.replacementSeq] = nextTones[item.seq]
            delete nextTones[item.seq]
          }
        }
        const nextSurface = surface.map((node) => {
          const prompt = applied.find((item) => item.mode === 'prompt' && item.seq === node.seq)
          if (prompt) {
            const replacement = nodes[prompt.replacementSeq]
            return replacement || { ...node, seq: prompt.replacementSeq, patched: true }
          }
          const patched = applied.find((item) => item.mode !== 'prompt' && item.seq === node.seq)
          if (patched) return nodes[patched.seq] || node
          return node
        })
        const nextGroupAt = new Map()
        for (const group of groups) {
          for (let index = group.startIndex; index <= group.endIndex; index += 1) nextGroupAt.set(index, group)
        }
        const nextUnits = buildToneUnits(nextSurface)
        const nextToneAt = (index) => {
          const node = nextSurface[index]
          if (!node) return 'normal'
          const group = nextGroupAt.get(index)
          if (!group) return 'keep'
          if (group.locked) return nextTones[node.seq] || 'keep'
          return nextTones[node.seq] || 'normal'
        }
        const segments = []
        for (const group of groups) {
          for (const segment of segmentsForGroup(group, nextSurface, nextToneAt, nextUnits)) {
            if (segment.tone !== 'keep') segments.push(segment)
          }
        }
        return { applied, unchanged, nextSurface, nextTones, segments }
      }

      function adoptAppliedEdits(data) {
        setUndoStack([])
        const { applied, unchanged, nextSurface, nextTones } = projectionAfterEdits(data)
        const removeKeys = new Set()
        for (const item of applied) {
          if (item.mode === 'prompt') removeKeys.add(editKeyFor('prompt', item.seq))
          else removeKeys.add(editKeyFor(item.mode, item.seq, item.blockIndex))
        }
        for (const item of unchanged) {
          removeKeys.add(item.mode === 'prompt'
            ? editKeyFor('prompt', item.seq)
            : editKeyFor(item.mode, item.seq, item.blockIndex))
        }
        setSurface(nextSurface)
        setTones(nextTones)
        setGroups((current) => current.map((group) => {
          const next = { ...group }
          const start = nextSurface[next.startIndex]
          const end = nextSurface[next.endIndex]
          if (start && end) next.id = `${start.seq}-${end.seq}`
          return next
        }))
        setEdits((current) => current.filter((edit) => !removeKeys.has(edit.key)))
        setDetails({})
        setMessages({})
        setEditing(null)
        setBanner({ kind: 'edit', count: applied.length, unchanged: unchanged.length, backupFile: data.backupFile || '' })
        if (data.lastSeq !== undefined) {
          setState((current) => current ? {
            ...current,
            lastSeq: data.lastSeq,
            surfaceTokens: nextSurface.filter((node) => node.role !== 'system').reduce((sum, node) => sum + (Number.isFinite(node.tokens) ? node.tokens : 0), 0),
          } : current)
        }
        if (applied.length > 0) showToast(tr('edit.applied', { count: applied.length }))
        resyncConversation(sessionId)
      }

      async function submitEdits() {
        if (edits.length === 0) {
          showToast(tr('edit.noPending'))
          return
        }
        if (busySession) {
          showToast(tr('edit.busy'))
          return
        }
        setApplyingEdits(true)
        setErrorText('')
        try {
          const data = await applyMessageEdits(sessionId, state ? state.lastSeq : -1, edits.map((edit) => ({
            seq: edit.seq,
            mode: edit.mode,
            text: edit.text,
            ...(edit.mode !== 'prompt' ? { blockIndex: edit.blockIndex, kind: edit.kind } : {}),
          })))
          adoptAppliedEdits(data)
          if (Array.isArray(data.applied) && data.applied.length === 0 && Array.isArray(data.unchanged) && data.unchanged.length > 0) {
            showToast(tr('edit.unchangedCount', { count: data.unchanged.length }))
          }
        } catch (error) {
          const payload = error && error.payload ? error.payload : null
          if (payload && Array.isArray(payload.applied) && payload.applied.length > 0) {
            adoptAppliedEdits({ ...payload, nodes: {}, lastSeq: state ? state.lastSeq : -1 })
            setErrorText(tr('edit.partial', { done: payload.applied.length, total: edits.length }))
          } else {
            // Known host codes (busy/stale/tool-pair/...) get localized copy;
            // unknown codes keep the host prose inside the localized wrapper.
            setErrorText(hostErrorText(error, 'edit') || tr('edit.failedApply', { error: rawErrorMessage(error) }))
          }
        } finally {
          setApplyingEdits(false)
        }
      }

      function openCompression() {
        setCompressOpen(true)
        setCompressChecked(false)
        setCompressTarget('direct')
        setCompressMethod(canCurated ? 'curated' : (canOfficial ? 'official' : 'curated'))
      }

      function closeCompression() {
        setCompressOpen(false)
        setCompressChecked(false)
      }

      async function commitEditsForCompression() {
        return applyMessageEdits(sessionId, state ? state.lastSeq : -1, edits.map((edit) => ({
          seq: edit.seq,
          mode: edit.mode,
          text: edit.text,
          ...(edit.mode !== 'prompt' ? { blockIndex: edit.blockIndex, kind: edit.kind } : {}),
        })))
      }

      async function confirmCompression() {
        if (!compressChecked || !canConfirmCompression) return
        setCompacting(true)
        setErrorText('')
        let focus = null
        let editDataForCompression = null
        let opsSegments = compressSegments
        try {
          let lastSeq = state ? state.lastSeq : -1
          if (compressTarget === 'modified') {
            const editData = await commitEditsForCompression()
            editDataForCompression = editData
            lastSeq = typeof editData.lastSeq === 'number' ? editData.lastSeq : lastSeq
            if (compressMethod === 'curated') {
              // The prompt replacement nodes get new seqs, so the ranges chosen
              // before applying edits no longer address the same surface.
              opsSegments = projectionAfterEdits(editData).segments
              if (opsSegments.length === 0) {
                adoptAppliedEdits(editData)
                setCompressOpen(false)
                showToast(tr('compress.nothing'))
                return
              }
            }
          }
          if (compressMethod === 'official') {
            const result = await compactContext(sessionId, lastSeq)
            if (!result.compacted) {
              showToast(tr('compress.nothing'))
              return
            }
            // The host's summarySeq is log-only; replacementSeq is the new
            // surface node, so prefer it for auto-focusing after compaction.
            focus = typeof result.replacementSeq === 'number'
              ? result.replacementSeq
              : (typeof result.summarySeq === 'number' ? result.summarySeq : null)
            setBanner({
              kind: 'compress',
              mode: 'compact',
              count: Array.isArray(result.shadowedSeqs) ? result.shadowedSeqs.length : 0,
              backupFile: result.backupFile || '',
            })
            showToast(tr('compress.doneOfficial', { count: Array.isArray(result.shadowedSeqs) ? result.shadowedSeqs.length : 0 }))
          } else {
            const ops = opsSegments.map((segment) => ({
              kind: 'summary',
              startSeq: segment.startSeq,
              endSeq: segment.endSeq,
              tone: segment.tone,
            }))
            let result
            try {
              result = await applyPlan(sessionId, lastSeq, ops, '', {
                autoSummarize: true,
                textOnly: summaryTextOnly,
              })
            } catch (error) {
              if (!error || error.code !== 'missing-summary') throw error
              // Host 0.4.0 has no auto-summary in /apply but still serves
              // /summarize; write the same summaries explicitly and retry.
              const withText = []
              for (const segment of opsSegments) {
                const data = await draftSummaryLegacy(sessionId, segment, summaryTextOnly)
                withText.push({
                  kind: 'summary',
                  startSeq: segment.startSeq,
                  endSeq: segment.endSeq,
                  tone: segment.tone,
                  text: data.text,
                })
              }
              result = await applyPlan(sessionId, lastSeq, withText, '')
            }
            const count = result && Array.isArray(result.applied) ? result.applied.length : 0
            focus = result && Array.isArray(result.applied) && result.applied.length > 0 ? result.applied[0].replacementSeq : null
            setBanner({ kind: 'compress', mode: 'curated', count, backupFile: result.backupFile || '' })
            showToast(tr('compress.doneCurated', { count }))
          }
          setCompressOpen(false)
          cancelPendingDraftWrite()
          clearDraft(sessionId)
          protectedDraftRef.current = false
          setFocusSeq(focus)
          await load()
          resyncConversation(sessionId)
        } catch (error) {
          const payload = error && error.payload ? error.payload : null
          const partialApplied = payload && Array.isArray(payload.applied) ? payload.applied.length : 0
          const editsCommitted = editDataForCompression && Array.isArray(editDataForCompression.applied)
            ? editDataForCompression.applied.length
            : 0
          let message
          if (partialApplied > 0) {
            message = tr('apply.partial', { done: partialApplied, total: opsSegments.length })
          } else {
            // Map known host codes (busy/stale/cancelled/...) to localized copy.
            message = hostErrorText(error, 'compress') || tr('compress.failed', { error: rawErrorMessage(error) })
          }
          // Any partial write leaves the on-screen surface stale: reload even
          // for direct compression (which commits no edits first).
          if (partialApplied > 0 || editsCommitted > 0) await load()
          setErrorText(message)
          setCompressOpen(false)
        } finally {
          setCompacting(false)
        }
      }

      react.useEffect(() => {
        if (phase !== 'ready' || focusSeq === null) return
        const index = surface.findIndex((node) => node.seq === focusSeq)
        if (index < 0) {
          setFocusSeq(null)
          return
        }
        const group = groups.find((candidate) => index >= candidate.startIndex && index <= candidate.endIndex)
        setFocusSeq(null)
        if (!group) return
        const key = rangeKeyOf(group)
        if (details[key] === undefined) fetchDetail(group)
      }, [phase, focusSeq, surface, groups, details])

      // Modal keyboard semantics: Escape closes, Tab stays inside the dialog,
      // and the dialog receives initial focus (its h3 names it via
      // aria-labelledby on the layer below).
      function onDialogKeyDown(event) {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
          return
        }
        if (event.key !== 'Tab') return
        const root = event.currentTarget
        const focusables = Array.from(root.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
      react.useEffect(() => {
        if (docked) return
        const node = panelRef.current
        if (node && typeof node.focus === 'function') {
          try {
            node.focus({ preventScroll: true })
          } catch {}
        }
      }, [docked])

      const header = jsxs('div', {
        className: 'dshcurate-head',
        children: [
          jsx('div', {
            className: 'dshcurate-head-main',
            children: jsxs('div', {
              className: 'dshcurate-title-row',
              children: [
                jsx('h3', { id: titleId, className: 'dshcurate-title', children: tr('panel.title') }),
                jsx('button', {
                  type: 'button',
                  className: 'dshcurate-help',
                  title: tr('panel.help'),
                  'aria-label': tr('panel.help'),
                  onClick: () => setHelpOpen((value) => !value),
                  children: '?',
                }),
              ],
            }),
          }),
          jsx('button', {
            type: 'button',
            className: 'dshcurate-icon',
            // Refresh stays usable while a load is in flight: load() supersedes
            // the previous request instead of racing it.
            disabled: applyingEdits || compacting,
            title: tr('panel.refresh'),
            'aria-label': tr('panel.refresh'),
            onClick: load,
            children: '↻',
          }),
          jsx('button', {
            type: 'button',
            className: 'dshcurate-icon',
            title: tr('panel.close'),
            'aria-label': tr('panel.close'),
            onClick: onClose,
            children: '×',
          }),
        ],
      })

      const helpPopover = helpOpen
        ? jsxs('div', {
            className: 'dshcurate-help-pop',
            children: [
              jsx('p', { children: tr('panel.subtitle') }),
              jsx('p', { children: tr('scope.note') }),
              jsx('p', { children: tr('view.note') }),
              jsx('p', { children: tr('edit.entryHint') }),
            ],
          })
        : null

      const versionBanner = (versionIssue || patchUnavailable) && phase === 'ready'
        ? jsxs('div', {
            className: 'dshcurate-version-banner',
            children: [
              jsx('span', {
                className: 'grow',
                children: versionIssue
                  ? (hostVersion === ''
                      ? tr('version.missing')
                      : tr('version.mismatch', { host: hostVersion, client: PLUGIN_VERSION }))
                  : tr('version.patchOff'),
              }),
              jsx('button', {
                type: 'button',
                onClick: () => {
                  try {
                    window.location.reload()
                  } catch {}
                },
                children: tr('version.reload'),
              }),
            ],
          })
        : null

      const bannerView = banner !== null
        ? jsxs('div', {
            className: 'dshcurate-banner',
            children: [
              jsx('b', {
                children: banner.kind === 'edit'
                  ? tr('edit.applied', { count: banner.count })
                  : (banner.mode === 'compact'
                      ? tr('compress.doneOfficial', { count: banner.count })
                      : tr('compress.doneCurated', { count: banner.count })),
              }),
              banner.kind === 'edit' && banner.unchanged > 0
                ? jsx('span', { children: ` ${tr('edit.unchangedCount', { count: banner.unchanged })}` })
                : null,
              banner.backupFile !== ''
                ? jsx('div', { className: 'path', children: banner.kind === 'edit' ? tr('edit.backup', { path: banner.backupFile }) : tr('compress.backup', { path: banner.backupFile }) })
                : null,
            ],
          })
        : null

      const draftNoticeView = draftNotice === ''
        ? null
        : jsx('div', { className: 'dshcurate-banner', children: draftNotice })

      const compressPanel = compressOpen
        ? jsxs('div', {
            className: 'dshcurate-compress',
            children: [
              jsx('h4', { children: tr('compress.title') }),
              jsxs('div', {
                className: 'dshcurate-compress-group',
                children: [
                  jsx('div', { className: 'dshcurate-compress-label', children: tr('compress.target') }),
                  jsxs('label', {
                    className: `dshcurate-option${compressTarget === 'direct' ? ' active' : ''}`,
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'dshcurate-compress-target',
                        checked: compressTarget === 'direct',
                        disabled: compacting,
                        onChange: () => setCompressTarget('direct'),
                      }),
                      jsxs('div', {
                        children: [
                          jsx('div', { className: 't', children: tr('compress.target.direct') }),
                          jsx('div', {
                            className: 'd',
                            children: tr('compress.target.direct.hint')
                              + (edits.length > 0 ? ` ${tr('compress.target.direct.pending', { count: edits.length })}` : ''),
                          }),
                        ],
                      }),
                    ],
                  }),
                  jsxs('label', {
                    className: `dshcurate-option${compressTarget === 'modified' ? ' active' : ''}${edits.length === 0 ? ' disabled' : ''}`,
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'dshcurate-compress-target',
                        checked: compressTarget === 'modified',
                        disabled: compacting || edits.length === 0,
                        onChange: () => setCompressTarget('modified'),
                      }),
                      jsxs('div', {
                        children: [
                          jsx('div', { className: 't', children: tr('compress.target.modified') }),
                          jsx('div', {
                            className: 'd',
                            children: edits.length > 0
                              ? tr('compress.target.modified.hint', { count: edits.length })
                              : tr('compress.target.modified.none'),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              jsxs('div', {
                className: 'dshcurate-compress-group',
                children: [
                  jsx('div', { className: 'dshcurate-compress-label', children: tr('compress.method') }),
                  jsxs('label', {
                    className: `dshcurate-option${compressMethod === 'curated' ? ' active' : ''}${canCurated ? '' : ' disabled'}`,
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'dshcurate-compress-method',
                        checked: compressMethod === 'curated',
                        disabled: !canCurated,
                        onChange: () => setCompressMethod('curated'),
                      }),
                      jsxs('div', {
                        children: [
                          jsx('div', { className: 't', children: tr('compress.curated') }),
                          jsx('div', {
                            className: 'd',
                            children: canCurated
                              ? tr('compress.curated.hint', { count: compressSegments.length, messages: totalMessages })
                              : (busySession ? tr('panel.busy') : tr('compress.curated.unavailable')),
                          }),
                        ],
                      }),
                    ],
                  }),
                  jsxs('label', {
                    className: `dshcurate-option${compressMethod === 'official' ? ' active' : ''}${canOfficial ? '' : ' disabled'}`,
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'dshcurate-compress-method',
                        checked: compressMethod === 'official',
                        disabled: !canOfficial,
                        onChange: () => setCompressMethod('official'),
                      }),
                      jsxs('div', {
                        children: [
                          jsx('div', { className: 't', children: tr('compress.official') }),
                          jsx('div', {
                            className: 'd',
                            children: canOfficial
                              ? tr('compress.official.hint') + (summaryTextOnly ? ` ${tr('compress.official.textOnly')}` : '')
                              : (busySession ? tr('panel.busy') : tr('compress.official.unavailable')),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              compressMethod === 'curated' && canCurated
                ? jsx('div', {
                    className: 'dshcurate-note',
                    children: tr('confirm.body', { count: compressSegments.length, messages: totalMessages })
                      + (keptMessages > 0 ? ` ${tr('confirm.keep', { kept: keptMessages })}` : ''),
                  })
                : null,
              jsx('div', {
                className: 'dshcurate-note',
                children: summaryTextOnly ? tr('summary.source.text') : tr('summary.source.all'),
              }),
              jsx('label', {
                children: [
                  jsx('input', {
                    type: 'checkbox',
                    checked: compressChecked,
                    onChange: (event) => setCompressChecked(event.target.checked),
                  }),
                  jsx('span', { children: tr('compress.irreversible') }),
                ],
              }),
              jsxs('div', {
                className: 'dshcurate-compress-foot',
                children: [
                  jsx('button', { type: 'button', className: 'dshcurate-btn', onClick: closeCompression, disabled: compacting, children: tr('compress.cancel') }),
                  jsx('button', {
                    type: 'button',
                    className: 'dshcurate-btn danger',
                    disabled: !compressChecked || !canConfirmCompression,
                    onClick: confirmCompression,
                    children: compacting ? tr('compress.running') : tr('compress.confirm'),
                  }),
                ],
              }),
            ],
          })
        : null

      let body
      if (phase === 'loading') {
        body = jsx('div', { className: 'dshcurate-empty', children: tr('panel.loading') })
      } else if (phase === 'error') {
        body = jsxs('div', {
          className: 'dshcurate-empty',
          children: [
            jsx('div', { children: tr('error.state', { error: errorText }) }),
            jsx('button', { type: 'button', className: 'dshcurate-btn', onClick: load, children: tr('panel.retry') }),
          ],
        })
      } else if (groups.length === 0 && tailNode === null && !compressOpen && banner === null) {
        body = jsx('div', { className: 'dshcurate-empty', children: tr('panel.empty') })
      } else {
        const cards = groups.map((group) => jsx(GroupCard, {
          group,
          surface,
          cwd: state ? state.cwd : '',
          disabled: applyingEdits || busySession,
          edits,
          messages,
          busy: applyingEdits || compacting || busySession || messageBusy > 0,
          editing,
          textOnlyView,
          segments: segmentsOfGroup(group),
          groupTone: groupToneOf(segmentsOfGroup(group)),
          onGroupTone: (tone) => setGroupTone(group, tone),
          onNodeTone: setNodeTone,
          toneOfNode: (node) => {
            const index = surface.findIndex((candidate) => candidate.seq === node.seq)
            return index >= 0 ? toneAt(index) : 'keep'
          },
          toneDisabledForNode: (node) => {
            const index = surface.findIndex((candidate) => candidate.seq === node.seq)
            return !groupAt.has(index)
          },
          canMerge: groups[groups.length - 1] !== group,
          onSplit: () => onSplit(group),
          onMerge: () => onMerge(group),
          detail: detailOf(group),
          detailLoading: detailBusy === rangeKeyOf(group) && detailBusy !== '',
          onLoadDetail: () => toggleDetail(group),
          onCloseDetail: () => toggleDetail(group),
          onEdit: openEditor,
          onEditSnippet: (node) => editFromPreview(group, node),
          onUndo: (node) => undoEditsForNode(node.seq),
          onLoadFull: loadFull,
          onValue: setEditorValue,
          onEditorMode: setEditorMode,
          onBlock: setEditorBlock,
          onBlockConfirm: confirmBlockSwitch,
          onBlockCancel: cancelBlockSwitch,
          onCancel: cancelEditor,
          onSave: saveEditor,
        }, group.id))
        const tailEdits = tailNode && Array.isArray(edits) ? edits.filter((edit) => edit.seq === tailNode.seq) : []
        const tailVisible = tailNode !== null && isConversationNode(tailNode, textOnlyView)
        const tail = tailNode
          ? jsxs('div', {
              className: 'dshcurate-card locked',
              children: [
                jsxs('div', {
                  className: 'dshcurate-card-meta',
                  children: [
                    jsx('b', { children: tr('tail.badge') }),
                    jsx('span', { children: ` · #${tailNode.seq}` }),
                    tailEdits.length > 0 ? jsx('span', { className: 'dshcurate-badge edit', children: tr('footer.pending', { count: tailEdits.length }) }) : null,
                  ],
                }),
                tailVisible
                  ? jsx(MessageDetail, {
                      node: tailNode,
                      full: messages[tailNode.seq] ? messages[tailNode.seq] : null,
                      nodeEdits: tailEdits,
                      editing: editing && editing.seq === tailNode.seq ? editing : null,
                      cwd: state ? state.cwd : '',
                      busy: applyingEdits || compacting || busySession,
                      textOnlyView,
                      showTone: false,
                      onEdit: openEditor,
                      onUndo: (node) => undoEditsForNode(node.seq),
                      onLoadFull: loadFull,
                      onValue: setEditorValue,
                      onMode: setEditorMode,
                      onBlock: setEditorBlock,
                      onBlockConfirm: confirmBlockSwitch,
                      onBlockCancel: cancelBlockSwitch,
                      onCancel: cancelEditor,
                      onSave: saveEditor,
                    })
                  : jsx('div', { className: 'dshcurate-note', children: tr('tail.hidden') }),
              ],
            })
          : null
        body = jsxs('div', {
          children: [
            versionBanner,
            draftNoticeView,
            bannerView,
            busySession
              ? jsx('div', { className: 'dshcurate-alert', role: 'status', 'aria-live': 'polite', children: tr('panel.busy') })
              : null,
            errorText !== ''
              ? jsx('div', { className: 'dshcurate-alert', role: 'alert', children: errorText })
              : null,
            compressPanel,
            ...cards,
            tail,
            toast !== ''
              ? jsx('div', { className: 'dshcurate-toast', role: 'status', 'aria-live': 'polite', children: toast })
              : null,
          ].filter(Boolean),
        })
      }

      const stats = jsxs('div', {
        className: 'dshcurate-stats',
        children: [
          jsx('span', { children: tr('stats.surface', { tokens: fmtTokens(surfaceTokens) }) }),
          jsx('span', { children: tr('stats.selected', { count: selected.length, tokens: fmtTokens(selectedTokens) }) }),
          jsx('span', { children: tr('stats.after', { tokens: fmtTokens(afterTokens) }) }),
          jsx('span', { children: jsx('b', { children: tr('stats.saved', { tokens: fmtTokens(Math.max(0, surfaceTokens - afterTokens)) }) }) }),
          edits.length > 0 ? jsx('span', { children: jsx('b', { children: tr('footer.pending', { count: edits.length }) }) }) : null,
        ],
      })
      const scope = jsxs('div', {
        className: 'dshcurate-scope',
        children: [
          jsx('span', { children: tr('scope.title') }),
          jsx('select', {
            value: preserveTurns,
            'aria-label': tr('scope.title'),
            disabled: applyingEdits || compacting,
            onChange: changePreserve,
            children: [0, 1, 2, 3, 4, 5, 6].map((value) => jsx('option', { value, children: `${value} ${tr('scope.suffix')}` }, value)),
          }),
          jsxs('div', {
            className: 'dshcurate-view',
            children: [
              jsx('button', {
                type: 'button',
                className: textOnlyView ? '' : 'active',
                'aria-pressed': textOnlyView ? 'false' : 'true',
                onClick: () => changeTextOnlyView(false),
                children: tr('view.all'),
              }),
              jsx('button', {
                type: 'button',
                className: textOnlyView ? 'active' : '',
                'aria-pressed': textOnlyView ? 'true' : 'false',
                onClick: () => changeTextOnlyView(true),
                children: tr('view.text'),
              }),
            ],
          }),
          jsxs('label', {
            className: 'dshcurate-flag',
            children: [
              jsx('input', {
                type: 'checkbox',
                checked: summaryTextOnly,
                onChange: (event) => changeSummaryTextOnly(event.target.checked),
              }),
              jsx('span', { children: tr('summary.textOnly') }),
            ],
          }),
          jsx('span', { className: 'grow' }),
        ],
      })
      const footer = phase === 'ready'
        ? jsxs('div', {
            className: 'dshcurate-foot',
            children: [
              jsx('button', {
                type: 'button',
                className: `dshcurate-btn${edits.length > 0 ? ' primary' : ''}`,
                disabled: !canApplyEdits,
                title: edits.length > 0 ? tr('edit.hint') : tr('edit.noPending'),
                onClick: submitEdits,
                children: applyingEdits ? tr('edit.loading') : (edits.length > 0 ? tr('footer.applyEdits') : tr('footer.apply')),
              }),
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn',
                disabled: applyingEdits || compacting,
                title: busySession ? tr('panel.busy') : undefined,
                onClick: () => {
                  if (busySession) {
                    showToast(tr('panel.busy'))
                    return
                  }
                  openCompression()
                },
                children: compacting ? tr('compress.running') : tr('footer.compress'),
              }),
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn',
                disabled: applyingEdits || compacting,
                onClick: saveDraftNow,
                children: tr('footer.save'),
              }),
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn',
                disabled: undoStack.length === 0,
                onClick: undoLast,
                children: tr('footer.undo'),
              }),
              jsx('span', { className: 'spacer' }),
              jsx('span', {
                className: 'note',
                children: busySession
                  ? tr('panel.busy')
                  : edits.length > 0
                    ? tr('footer.pending', { count: edits.length })
                    : selected.length === 0
                      ? tr('footer.nothing')
                      : '',
              }),
              jsx('span', { className: 'note', children: tr('version.label', { version: PLUGIN_VERSION }) }),
            ],
          })
        : null

      const panel = jsxs('div', {
        ref: panelRef,
        className: 'dshcurate-panel',
        tabIndex: -1,
        'aria-labelledby': docked ? undefined : titleId,
        children: [header, helpPopover, stats, scope, jsx('div', { className: 'dshcurate-body', ref: bodyRef, children: body }), footer].filter(Boolean),
      })
      if (docked) {
        return jsx('div', {
          className: 'dshcurate-dock',
          'aria-label': tr('panel.title'),
          onKeyDown: onDialogKeyDown,
          children: panel,
        })
      }
      return jsxs('div', {
        className: 'dshcurate-layer',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        onKeyDown: onDialogKeyDown,
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose()
        },
        children: [panel],
      })
    }

    function ModalShell(props) {
      const sessionId = props.sessionId
      const workbench = useWorkbenchState(sessionId)
      if (!workbench.open) return null
      return jsx(Workbench, { sessionId, onClose: () => closeWorkbench(sessionId) })
    }

    function HeaderEntry(props) {
      useLocaleTick()
      return jsx('button', {
        type: 'button',
        className: 'dshcurate-open',
        title: tr('action.title'),
        onClick: () => {
          if (openCurateTab !== null) {
            try {
              if (openCurateTab() === true) return
            } catch (error) {
              console.error('[dsh-curate] opening the curation tab failed:', error)
            }
          }
          openWorkbench(props.sessionId)
        },
        children: tr('action.open'),
      })
    }

    // --- plugin --------------------------------------------------------------

    function apply(ctx) {
      clientCtx = ctx
      const disposeStyles = ensureStyles()
      try {
        document.documentElement.dataset.dshCurateVersion = PLUGIN_VERSION
      } catch {}
      try {
        if (ctx.locale && typeof ctx.locale.register === 'function') {
          ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-curate: dictionaries')
        }
      } catch (error) {
        console.error('[dsh-curate] locale registration failed:', error)
      }
      // Host locale switches must re-render the workbench body, not only the
      // sidebar tab title. Prefer the locale service's subscription; fall back
      // to the documented locale/change event on older compositions.
      try {
        if (ctx.locale && typeof ctx.locale.subscribe === 'function') {
          ctx.effect(() => ctx.locale.subscribe(() => publishLocaleChange()), 'dsh-curate: locale refresh')
        } else if (typeof ctx.on === 'function') {
          ctx.effect(() => ctx.on('locale/change', () => publishLocaleChange()), 'dsh-curate: locale refresh')
        }
      } catch (error) {
        console.error('[dsh-curate] locale refresh subscription failed:', error)
      }

      ctx.slots.inject('conversation.session.header.actions', () =>
        ctx.slots.register(
          {
            name: 'conversation.session.header.actions',
            id: 'dsh-curate-open',
            order: 12,
            locale: NS,
            inject: (sessionId) => ({ sessionId }),
          },
          HeaderEntry,
        ),
      )
      ctx.slots.inject('conversation.input.overlay', () =>
        ctx.slots.register(
          {
            name: 'conversation.input.overlay',
            id: 'dsh-curate',
            order: 11,
            locale: NS,
            inject: (sessionId) => ({ sessionId }),
          },
          ModalShell,
        ),
      )

      // The approved UI seat: a tab in the official right Sidebar. The body is
      // the same workbench; the header entry simply opens the tab.
      ctx.effect(
        () =>
          ctx.inject(['sidebarRightTabs'], (sidebarCtx) => {
            const disposers = []
            const t = typeof sidebarCtx.locale?.bind === 'function' ? sidebarCtx.locale.bind(NS) : (key) => key
            let service = null
            try {
              service = sidebarCtx.get('sidebarRight')
            } catch {
              service = null
            }
            const usable = service !== null && service !== undefined && typeof service.openTab === 'function'
            try {
              if (sidebarCtx.sidebarRightTabs !== undefined && sidebarCtx.sidebarRightTabs !== null &&
                  typeof sidebarCtx.sidebarRightTabs.register === 'function') {
                disposers.push(sidebarCtx.sidebarRightTabs.register({
                  id: TAB_KIND,
                  kind: TAB_KIND,
                  title: () => t('tab.title'),
                }))
              }
            } catch (error) {
              console.error('[dsh-curate] sidebar tab type registration failed:', error)
            }
            try {
              const Body = (props) => jsx(Workbench, {
                sessionId: props.sessionId,
                onClose: () => dockedCloseTab(),
                docked: true,
              })
              disposers.push(sidebarCtx.slots.inject('sidebar.right.pane.tab', () => sidebarCtx.slots.register(
                {
                  name: 'sidebar.right.pane.tab',
                  key: TAB_KIND,
                  locale: NS,
                  inject: (sessionId) => ({ sessionId }),
                },
                Body,
              )))
              disposers.push(sidebarCtx.slots.inject('sidebar.right.pane.tab.title', () => sidebarCtx.slots.register(
                { name: 'sidebar.right.pane.tab.title', key: TAB_KIND, locale: NS },
                (props) => {
                  const tt = typeof props.t === 'function' ? props.t : t
                  return jsx('span', { children: tt('tab.title') })
                },
              )))
            } catch (error) {
              console.error('[dsh-curate] sidebar tab body registration failed:', error)
            }
            if (usable) {
              openCurateTab = () => {
                service.openTab(TAB_KIND)
                return true
              }
              closeCurateTab = () => {
                try {
                  const active = typeof service.active === 'function' ? service.active() : undefined
                  if (active !== null && active !== undefined && typeof active.id === 'string') service.close(active.id)
                } catch (error) {
                  console.error('[dsh-curate] closing the curation tab failed:', error)
                }
              }
            }
            return () => {
              openCurateTab = null
              closeCurateTab = null
              for (const dispose of disposers) {
                try {
                  if (typeof dispose === 'function') dispose()
                } catch {}
              }
            }
          }),
        'dsh-curate: sidebar tab',
      )

      // Plugin unload / HMR: remove the stylesheet and the version marker so a
      // reloaded instance starts clean.
      return () => {
        try {
          if (typeof disposeStyles === 'function') disposeStyles()
        } catch {}
        try {
          delete document.documentElement.dataset.dshCurateVersion
        } catch {}
      }
    }

    // Tests only: the pure pieces have no Cordis dependency.
    exports.__internals = {
      buildGroups,
      middleCut,
      markdownToHtml,
      sanitizeMarkdownHtml,
      htmlToMarkdown,
      resolveRenderedImages,
      MarkdownEditor,
      MessageEditor,
      MessageDetail,
      isConversationNode,
      buildToneUnits,
      estimatedSummaryTokens,
      segmentsForGroup,
      groupToneOf,
      GroupCard,
      Workbench,
      HeaderEntry,
      editKeyFor,
      hostErrorText,
      normalizePreserveTurns,
      draftHasContent,
      readDraft,
      writeDraft,
      DETAIL_PAGE_SIZE,
    }
    exports.apply = apply
    exports.inject = ['slots', 'locale']
    exports.PLUGIN_VERSION = PLUGIN_VERSION
    return module.exports
  },
})
