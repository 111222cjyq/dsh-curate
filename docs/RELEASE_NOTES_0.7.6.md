# dsh-curate v0.7.6

这是一个以**真实对话可读性**和**发布文档**为主的版本。

## 亮点

- **真实 Chat 显示写入后的文本**：顶部「修改后 / 原文」切换；「已修改 · N 处」标记。
- **逐处高亮**：新增/改写词句直接高亮；纯删除显示「原文删除 N 字」；详情层新增「改动」视图（新文本高亮 + 旧文本删除线）。
- **编辑器前后双操作**：顶部和底部都有「取消编辑 / 保存修改」，长文本不用再找按钮。
- **可恢复草稿**：无待应用修改时明确提示；旧草稿无法恢复时可清除重来。
- **投影对象缓存**：插件热重载后复用同一 projection 对象，避免旧会话报
  `session message projection ... was removed or replaced`；已经失效的旧会话仍需完整重启一次。
- **0.7.6 修复**：Chat 标记不再遮挡正文；编辑器标题不再重复。

## 案例截图

![工作台总览](https://raw.githubusercontent.com/111222cjyq/dsh-curate/main/docs/screenshots/01-workbench.png)

![真实对话中的逐处高亮](https://raw.githubusercontent.com/111222cjyq/dsh-curate/main/docs/screenshots/02-chat-applied.png)

![架构总览](https://raw.githubusercontent.com/111222cjyq/dsh-curate/main/docs/screenshots/06-architecture.png)

## 安装 / 升级

```bash
dsh plugin --profile web add github:111222cjyq/dsh-curate
```

安装后**完整重启 `dsh web` 并硬刷新页面**。不要在会话打开时反复 disable/enable。

## 模型支持

当前只验证 **DeepSeek V4.1 系列**。其他模型可能因推理签名、不可变历史、服务端会话状态或消息格式约束而不适用；在非 DeepSeek 模型上请先做小规模验证。

## 成本提醒

修改历史会降低 prompt cache 命中率，越靠前的修改成本越高；批量应用优于逐条应用。压缩同样会改变前缀，请同时权衡 token 节省和缓存命中。

## 人的局限

dsh-curate 适合长文本互动中的**有限、精确、可审计**上下文控制：去除冗余、过期草稿和工具噪音，保留需求、决策、标识符和错误信息。它不适合替代自动上下文管理，也不适合无人值守的长时编码任务。

## 验证

- 137 项自动化测试通过；只读实机回归 `verify-live.mjs` 94 passed / 0 failed；
- 实机案例覆盖编辑、应用、真实 Chat 高亮、改动详情、编辑器双端按钮、压缩预览；
- 架构图：[docs/screenshots/06-architecture.png](https://github.com/111222cjyq/dsh-curate/blob/main/docs/screenshots/06-architecture.png)
- 使用手册：[docs/USAGE.md](https://github.com/111222cjyq/dsh-curate/blob/main/docs/USAGE.md)
