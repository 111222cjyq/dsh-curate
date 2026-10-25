# dsh-curate 0.7.6 质量检查

日期：2026-10-25  
范围：0.7.5 → 0.7.6 的回归与发布前检查。

## 自动化

- `npm run build`：通过（client bundle 版本 0.7.6）；
- `npm run check`：通过；
- `npm test`：**137 passed, 0 failed**；
- `scripts/verify-live.mjs`（只读 CDP，不写 /apply /edit /compact）：**94 passed, 0 failed, 1 warning**（warning 为所选会话只有一张分组卡片，不影响结论）；
- 新增/相关测试：
  - 编辑器顶部「保存修改 / 取消」按钮渲染与可用性；
  - Chat「已修改」标记的 DOM 装饰与恢复；
  - 逐处 diff（行/token LCS、多改动、纯删除、空白噪音）；
  - 宿主 7 条路由、`/changes` 链式 prompt、append/tool/context；
  - 投影对象在模拟热重载后复用同一实例。

## 实机案例

使用独立示例会话「雨夜车站小说片段」（DeepSeek V4.1 Flash）：

1. 生成一段约 150 字的小说片段，包含「凌晨三点」；
2. 在工作台把助手回复中的「凌晨三点」改为「凌晨六点」；
3. 顶部保存、底部应用；
4. 真实 Chat 显示「凌晨六点」、金色高亮「六」、「已修改 · 1 处」标记；
5. 详情层「改动」视图显示旧词删除线 + 新词高亮；
6. 编辑器同时显示顶部/底部「取消编辑 / 保存修改」；
7. 压缩预览打开正常；
8. 页面无 console/page error；应用请求成功，备份路径由宿主返回。

截图见 [`screenshots/`](screenshots/)。

## 本轮修复

- **Badge 遮挡正文**：为被修改行预留右侧 gutter，标记不再覆盖首行文字末端；移动端使用较窄 gutter。
- **编辑器标题重复**：移除编辑块切换行上方重复的「编辑用户消息」标题，只保留编辑器 header 的标题。
- **旧草稿状态**：无暂存修改时 footer 显示原因；不可恢复草稿提供「清除旧草稿」。
- **投影热重载**：0.7.5 起按对象身份缓存 projection；旧会话失效需完整重启。

## 未覆盖 / 未验证

- 非 DeepSeek provider（推理签名、不可变历史、服务端会话状态差异）；
- 移动端窄屏布局（已写 media query，但未做完整回归）；
- 800+ 可见节点、极大会话的浏览器性能；
- 官方 `/compact` 在不同 agent 预设下的全部组合；
- Windows 路径、非本机 DSH 部署。
