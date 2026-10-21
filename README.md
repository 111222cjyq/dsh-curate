# dsh-curate — 人工筛选 / 改消息 / 按区间压缩的上下文工作台

**English:** a human-in-the-loop context curation workbench for DeepSeek Harness.
It lists the model-visible session as turns, lets you mark whole turns or single
messages **Important** (keep verbatim) / **Normal** / **Minor** (summarize) and
rewrite user, assistant, tool-result and injected-context messages in place
without a model call, then compresses the marked ranges with model-written
summaries or the official `/compact`. Every write is preceded by a local JSON
backup. Install with `dsh plugin --profile web add github:111222cjyq/dsh-curate`,
then restart `dsh web` and hard-refresh the page. Requires DSH 0.2.1-rc.x and
Node.js ≥ 22.

为 DeepSeek Harness（DSH）提供一个人工主导的上下文整理插件。它不替用户决定“什么重要”，而是把决定权交给人：

1. 在会话头部点「整理上下文」，右侧栏打开工作台；
2. 工作台按“轮”把当前模型可见的对话切成卡片，最后一条消息固定保留；每张卡片先显示每条消息的预览，点「查看完整原文」可看渲染后的完整内容；
3. 人可以**直接改写消息**：用户消息、助手正文/思维链、工具结果、注入上下文（含摘要消息）都能进「源码 / 渲染」编辑器；保存只是暂存，点「应用到上下文」才写入会话，**不调用模型**；
4. 人给每条消息标 **重要 / 一般 / 次要**（组头三个按钮是整轮批量预设）：重要=该条原文保留，一般=压缩时写常规摘要，次要=压缩时写更短摘要；一轮里可以出现“保留回答 + 压缩工具噪音”的混合结果；
5. 点底部「压缩上下文」时，模型才为选中的区间写替代摘要；不再需要逐段手动生成和复核摘要；
6. 底部按钮：
   - **修改并应用到上下文**：只写入暂存的消息修改，不压缩；
   - **压缩上下文**：先选压缩对象——**直接压缩上下文**（不应用暂存修改）或**压缩修改后的上下文**（先应用修改再压），再选压缩方式——**按整理结果压缩**或**官方 /compact**；
   - **保存当前内容**：立即保存本地草稿（不写会话）；**撤销**：回退最近一次语气/编辑/拆分改动。
   压缩完成后工作台会重新读取会话，直接显示压缩后的内容；
7. 下一条模型请求立即只看到整理后的上下文。

原始消息不会被删除：它们仍在 append-only 会话日志里，只是被 surface replacement 阴影掉；每次写入前都会写一份本地 JSON 备份。

## 为什么不是自动压缩

DSH 自带的 `compaction-basic` 是“到阈值自动压”。这个插件的定位是**人工可控的压缩**：先备份、可编辑消息、可保留关键段落为原文、可先把消息改对再压；它不替代自动压缩，也不修改其他插件或 profile 的配置。

## 消息编辑（0.3.0）

- **用户消息**：改写走官方 surface replacement —— 改后的文本占住原位置，模型读到新措辞，后面的对话不挪动；平台**不会**把它当成新输入去回答（append 才会）。
- **助手回复**：官方格式不允许 `assistant/message` 携带 `sourceEventSeqs`，所以改回答走官方另一条正门：`plugin:dsh-curate/patch` 插件记录 + `registerMessageProjection` 消息投影。surface 一个节点都不动，没有重放、没有新轮次；日志每次编辑只多一条几百字节的记录。
- **思维链**：和正文一样是独立的可编辑块；改写时会去掉原 `signature` / `thinkingSignature`（签名对应旧文本，留着会被 provider 拒绝）。
- **工具结果可编辑**：`tool/result` 的文本块可以改写，`toolCallId` / `isError` / 角色等配对字段保留；工具调用参数（`tool-call.arguments`）是结构化 JSON，保持只读并标注。
- **注入上下文可编辑**：runtime context、compact checkpoint、curate 摘要消息等 `user/message`（非人工输入）与 `developer/message` 的文本块可改写；`tool-addition` / `tool-removal` 等结构块原样保留。
- **系统提示**：不进入工作台，保持只读。
- **块选择器**：一条回复同时有正文和思维链时，编辑器顶部可以切换要改的块；工具结果/上下文多文本块时也可选块。
- **编辑入口**：每条消息右上角固定「编辑」按钮（长消息滚动时吸顶），预览行也有铅笔；点一下进入编辑。
- **附件原样保留**：带图片/文件的消息改文字时，原有附件块逐字节保留；本轮**不支持**在工作台里增删附件。
- **保存不落盘**：编辑器里的「保存修改」只把改动放进暂存区；底部「应用到上下文」才写会话，并写备份与审计记录。

## 每条消息语气与按区间压缩（0.4.0 新增，0.4.1 简化）

- **单条语气**：每条显示的消息（用户、助手、工具结果、注入上下文）头部都有 `[重要][一般][次要]`；组头三个按钮保留为**批量预设**，点击一次设置整轮，单条可覆盖；组内不一致时组头显示「混合」。
- **重要 = 原文保留**：该消息不进入任何压缩区间；同轮其他「一般/次要」消息按连续区间分别处理。比如一轮里先是工具输出、最后是助手回答，只把回答标「重要」，压缩后工具部分变摘要、回答原文还在。
- **工具对规则**：assistant 消息里的 tool-call 与对应 tool/result 会自动归为同一语气单元；给其中一条设语气会带动整对，避免把调用和结果拆开。主机 `validatePlan` 仍做最终校验。
- **按区间压缩**：每个非 keep 区间在压缩时各自生成一条摘要；压缩时每个区间一个 op，一次写入。keep 区间不提交，原文保留。区间卡片只显示范围和「压缩时自动生成摘要」，没有生成按钮和摘要编辑器。
- **最近保留组**：`最近保留 N 轮` 默认把这些轮次设为 keep，但**可以手动覆盖**——单条/整轮改成「一般/次要」后，该段会进入压缩计划，组头显示「已覆盖」；尾部固定消息永远 keep，不显示语气按钮。
- **草稿**：语气、视图开关和暂存修改保存在本地草稿（schema v4）；从更早状态打开时会按消息序号恢复可用的标注与修改，并在工作台提示；不再保存摘要草稿。

## 视图与压缩摘要来源

- **全部内容 / 仅对话文本**：工作台顶部可切换。仅文本模式只显示用户与助手的文字输入/输出，隐藏工具结果、工具调用、注入上下文和思维链；显示出来的内容都可编辑。该开关只影响查看与编辑，不改变压缩范围。
- **压缩摘要只看对话文本**：单独开关。开启后压缩时生成的摘要只读取用户/助手的 text 块，工具输出、注入上下文、思维链不进入摘要；关闭时保持全文摘要。
- **分组统计**：仅文本模式下卡片只统计可见的 user/assistant 条数与 tokens，并显示「已隐藏 N 条工具/上下文」；压缩仍覆盖整段，除非开启压缩摘要只看对话文本。

## 压缩上下文

- **按整理结果压缩**：使用每段的语气标记，在压缩时调用模型为每个非 keep 区间生成摘要，然后替换范围为完整轮次；摘要里的 `【…】` 来源标记告诉模型这是用户整理后的内容。
- **官方 /compact**：通过当前 agent 预设里的 `/compact` 命令调用官方压缩后端，范围由官方压缩器决定，不按卡片标注。压缩前同样写备份，结束后写一条 `plugin:dsh-curate/compact` 审计记录。
- 两种压缩都**不可撤销**（会话内），确认前必须勾选确认框；压缩后工作台重新读取并显示压缩后的内容。

### 顺序规则

- 「压缩修改后的上下文」会先应用暂存修改；如果修改包含用户消息替换，客户端会按应用后的新节点重算压缩区间，再交给主机校验和写入。
- 「直接压缩上下文」会忽略暂存修改，压缩完成后清除这些暂存修改；确认面板会提示。
- 调整「最近保留 N 轮」会重建分段；最近组默认 keep，手动改过语气的消息保留覆盖。

## 安装

要求：Node.js ≥ 22；DSH 0.2.1-rc.x（本插件声明 `engines.dsh >= 0.2.1-rc.2`，peer 依赖 `@deepseek-ai/dsh-session ^0.2.1-rc.2`）。

从 GitHub 安装（推荐；`lib/` 已预构建，安装时不需要编译）：

```bash
dsh plugin --profile web add github:111222cjyq/dsh-curate
```

发布到 npm 后也可以按包名安装：

```bash
dsh plugin --profile web add dsh-curate
```

本地开发安装：

```bash
git clone https://github.com/111222cjyq/dsh-curate
cd dsh-curate
dsh plugin --profile web add "$PWD"
# 需要重新构建或跑测试时再执行：npm ci && npm run build && npm test
```

`--profile` 的名字按你的环境替换（Web GUI 默认是 `web`；官方桌面端在应用内的插件管理里安装）。

安装后**必须重启 `dsh web` 并硬刷新页面**：宿主插件在启动时加载，浏览器端 bundle 需要刷新才会更新。

**0.4.0 起不再需要安装 dsh-edit-turn**：消息编辑能力已内置在本插件。已安装的 dsh-edit-turn 可以继续共存（两边各有一套投影类型，互不冲突），也可以之后从 profile 移除。

**0.4.1 起不再有逐段「生成摘要」和摘要编辑器**：语气标记只决定压缩范围，摘要由模型在压缩确认后自动写入。0.4.1 的 `/state` 通过当前 agent 预设的 `/compact` 命令探测官方压缩能力，修复了 DSH web 预设隔离压缩后端导致的「两种压缩都不可用」问题。

**0.5.0**：修复草稿在会话新增消息后被静默丢弃/覆盖（现在按消息序号恢复并提示“从更早状态恢复”）、本地存储写入失败仍提示成功、关闭面板时最后一笔改动丢失的问题；补齐对话框可访问性（Escape、初始焦点、aria 标签/状态）和「刷新上下文」入口；压缩区间不再可能拆开跨边界的工具调用对；宿主端修复分块 UTF-8 请求体乱码、按字节的请求上限、冷会话 cwd、`expectedLastSeq` 校验顺序、官方 `/compact` 错误码与可聚焦节点、备份权限（0700/0600）与保留上限；版本号改为单一来源（package.json → 构建注入）。

## 使用

1. 打开任一会话，点头部「整理上下文」；工作台在右侧栏打开，需要更大空间时用右侧栏自带的全屏按钮。
2. 工作台列出除系统提示外的全部模型可见消息，按轮分组；点某段的「查看完整原文」展开渲染后的消息列表。
3. 在消息右上角点「编辑」（或预览行铅笔）：
   - 用户消息直接改全文；
   - 助手回复用顶部「正文 / 思维链」选择要改的块；
   - 工具结果默认源码视图；注入上下文默认渲染视图；
   - 源码/渲染双视图随时切换，渲染视图支持 GFM 表格、删除线、任务列表和本地图片。
4. 点「保存修改」进入暂存；所有要改的消息都暂存后，点底部「应用到上下文」。成功后会显示备份路径，卡片就地更新。
5. 需要压缩时：给具体消息或整轮选「重要 / 一般 / 次要」——重要消息原文保留，一般/次要消息形成压缩区间。需要只总结对话文本时勾选「压缩摘要只看对话文本」。
6. 点底部「压缩上下文」：先选「直接压缩上下文」或「压缩修改后的上下文」；再选「按整理结果压缩」或「官方 /compact」，勾选不可撤销确认，确认。按整理结果压缩时，模型会为每个区间生成摘要，**没有待复核的摘要草稿**。
7. 底部的「保存当前内容」只保存本地草稿，不写会话；「撤销」回退最近一次语气/编辑/拆分改动。
8. 压缩完成后工作台会重新加载并显示压缩后的内容。

## 安全边界

- **不可撤销**：应用修改 / 压缩都会永久改变模型可见历史；不能用“撤销”恢复原顺序、角色和工具配对。原文可从备份手工抄回，但不会自动重建。
- 应用修改前自动备份到 `~/.local/share/dsh-curate/backups/<sessionId>/<time>-<random>-edit.json`；压缩前备份到 `<time>-<random>-apply.json` 或 `<time>-<random>-compact.json`（可用 `DSH_CURATE_BACKUP_DIR` 覆盖根目录，`DSH_CURATE_BACKUP_KEEP` 调整每会话保留份数，默认 20）。
- 备份文件包含完整对话原文，权限为目录 0700 / 文件 0600，与 DSH 会话存储一致；官方 `/compact` 没有可压缩历史时不会留下无意义的备份。
- 每次写会话都在日志里留下只读审计记录：`plugin:dsh-curate/edit-plan` / `edit-applied` / `plan` / `applied` / `compact`。
- 拒绝压缩：系统提示、最后一条消息、会拆开工具调用/结果的边界、重叠范围、超过 200 个块。
- 只在会话空闲（没有进行中的 turn/compaction）时允许编辑和压缩；请求必须带打开工作台时的 `expectedLastSeq`，会话若已增长返回 409，要求刷新重来。
- 路由只监听 loopback，并校验 `Host` 与 `Origin`；不额外要求页面 token，同机进程处于同一信任边界（与 dsh-edit-turn 的取舍一致）。
- 助手回复、工具结果、注入上下文的改写都是**模型可见投影**：工作台内始终显示改后文本；工作台写入后会请求会话重新同步，主对话区通常立即更新，极端情况下刷新页面即可。
- 系统提示与工具调用参数保持只读；工具结果的编辑只改文本块，不改变工具调用配对。
- 不处理图片/附件的语义压缩：带附件消息进入摘要时只保留占位说明，原文附件块仍在日志中。
- 渲染模式的数学公式和脚注按普通文本处理（marked 默认渲染），不会做 KaTeX。

## 配置

宿主插件默认自动选择模型：优先使用该会话最近一次请求的 provider/model，其次遍历已注册 provider 的第一个模型。也可以在 profile 的插件配置里显式指定：

```yaml
- id: dsh-curate
  config:
    provider: deepseek-official
    model: deepseek-v4-flash
```

若都不存在，摘要接口返回 503，按整理结果压缩无法继续。官方 `/compact` 使用当前 agent 预设里的官方压缩命令，不受这里的 provider/model 配置影响。

## 开发

```bash
npm ci
npm run build      # vendor（marked/turndown/DOMPurify）+ client bundle（注入 package.json 版本号）
npm run check      # node --check 五个发布文件
npm test           # node --test：surface / edits / backup / host 路由 / client
```

结构：

- `lib/index.js` — Cordis 插件入口，loopback-only 路由：
  - `GET  /dsh-curate/state|content|message`
  - `POST /dsh-curate/apply|edit|compact`（`/apply` 支持 `autoSummarize` 在写入前生成区间摘要）
- `lib/surface.js` — 纯函数：surface fold、turn 索引、范围校验、摘要/省略帧
- `lib/edits.js` — 纯函数：消息分类、提示词块组装、`plugin:dsh-curate/patch` 记录与投影
- `lib/backup.js` — 写入前 JSON 备份（0700/0600、每会话保留上限）
- `src/client.js` — 头部入口 + 右侧栏工作台（`conversation.session.header.actions` + `sidebar.right.pane.tab`；右侧栏不可用时回退到 `conversation.input.overlay`）
- `lib/client.js` — 构建产物（勿手改；版本号由 `scripts/build-client.mjs` 注入）
- `test/` — node:test 测试（含 `host-routes.test.mjs` 的真实路由分发和 `backup.test.mjs`）
- `scripts/verify-live.mjs` — 只读 CDP 实机检查（从不保存/压缩）

## 已知限制 / 非目标

- 不做自动调度压缩、不修改其他插件或 profile、不提供会话级撤销；「撤销」只回退工作台里的本地改动。
- 不支持在工作台里增删图片/文件附件；附件只原样保留。
- 助手/工具结果/上下文的改写依赖宿主提供 `appendPluginRecord` + `registerMessageProjection`；缺失时只能改用户消息，界面会提示原因。
- 系统提示与工具调用参数不开放编辑。
- 重要消息会原文保留；如果它属于某个工具对，整对都会保留，压缩区间会绕开这对消息。
- 同一轮里可以同时有保留原文和摘要；压缩不再总是整轮替换。
- 「仅对话文本」是视图过滤器；要影响摘要，需打开「压缩摘要只看对话文本」。
- 官方 `/compact` 不受「压缩摘要只看对话文本」影响，仍读取完整历史。
- 官方 `/compact` 依赖当前 agent 预设挂载 `/compact` 命令（DSH web 的预设默认都挂载）；缺失时该选项禁用，不伪造压缩。
- 按整理结果压缩会在确认后同步调用模型生成摘要；区间较多或原文很长时，确认按钮会显示「正在压缩…」并等待，期间请不要关闭页面。
- 不在主对话区做逐条消息的铅笔入口和 DOM 级打补丁；编辑入口在工作台的「查看完整原文」里。
- 不接 dsh-rerun-turn，不做“改完立即重答”。
- 宿主读取当前会话日志使用 `Session.snapshotEvents()`；该方法在 DSH 0.2.1-rc.2 标记为 deprecated（未来版本可能收紧），迁移到 session-query/surface 服务已列为后续兼容工作。
- 超长会话（800 个以上可见节点）的 `/state` 预览会自动缩短；一次展开上千条消息仍可能卡顿，建议按轮查看完整原文。

## License

MIT，见 [`LICENSE`](LICENSE)；改编来源与第三方许可见 [`NOTICE.md`](NOTICE.md)。

仓库：<https://github.com/111222cjyq/dsh-curate> · 问题反馈：<https://github.com/111222cjyq/dsh-curate/issues>
