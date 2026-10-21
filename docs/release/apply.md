# Apply plan — `package.json` + `README.md`

Snapshot: **2026-10-21**, `dsh-curate@0.4.1`. The release engineer did **not**
edit `package.json`, `README.md`, `LICENSE`, `NOTICE.md`, `lib/`, `src/`,
`test/` or `scripts/`. This file is the exact proposal for the files that are
outside that write scope.

Apply in this order: §1 package.json (script + copy locale files), then §2 README,
then run `docs/release/verify-release.mjs --strict`.

---

## 0. Already added by the release engineer (no action needed)

```
.gitignore
.github/workflows/ci.yml
screenshots.json
CHANGELOG.md
assets/icon.svg                     # DSH plugin icon, 777 B, original artwork
assets/screenshot-workbench.png     # 0.4.1 live capture (copy of docs/workbench-preview.png;
                                    # contains a personal session -- approve or recapture, see
                                    # publish-checklist.md §3)
docs/release/publish-checklist.md
docs/release/npm-publish.md
docs/release/awesome-entry.yml
docs/release/apply.md               # this file
docs/release/apply-package.mjs      # deterministic package.json edit
docs/release/verify-release.mjs     # offline gate checker
docs/release/locale/en.json         # source for locale/en.json
docs/release/locale/zh.json         # source for locale/zh.json
```

`docs/sidebar-workbench.png` was left untouched.

---

## 1. `package.json`

### 1.1 Command

From the repository root, after the GitHub repository exists (or with `OWNER`
set explicitly):

```sh
mkdir -p locale
cp docs/release/locale/en.json docs/release/locale/zh.json locale/
OWNER=<your-github-user-or-org> node docs/release/apply-package.mjs
```

`OWNER` may be omitted when `git remote get-url origin` already points at
`github.com:<owner>/dsh-curate`. Preview without writing:

```sh
node docs/release/apply-package.mjs --check
```

### 1.2 Field-by-field changes

| Field | Before | After | Why |
|---|---|---|---|
| `icon` | — | `assets/icon.svg` | DSH plugin icon. Host accepts a relative SVG/PNG/JPEG/WebP inside the package dir, ≤ 256 KiB |
| `author` | — | `OWNER (https://github.com/OWNER/dsh-curate)` | attribution; replace `OWNER` display name if desired |
| `repository` | — | `{"type":"git","url":"git+https://github.com/OWNER/dsh-curate.git"}` | **required** for the npm↔GitHub link the catalog checks |
| `homepage` | — | `https://github.com/OWNER/dsh-curate#readme` | registry/storefront link |
| `bugs` | — | `{"url":"https://github.com/OWNER/dsh-curate/issues"}` | `npm bugs`; reviewer signal |
| `exports` | `.`, `./client`, `./package.json` | **+** `"./locale/*.json": "./locale/*.json"` | the host resolves `locale/en.json` through the exports map; without this subpath the localized title/description are invisible |
| `files` | 9 entries | **+** `"assets/icon.svg"`, `"locale/*.json"` | display metadata must be inside the npm tarball; `screenshots.json` stays repo-only (catalog reads it from GitHub) |
| `keywords` | 8 | **+** `"session"`, `"summarization"` | search terms; no invented claims |
| `engines` | `{"node":">=22"}` | `{"node":">=22","dsh":">=0.2.1-rc.2"}` | **top-level** `engines.dsh` is what `dsh-app-boot`'s compatibility gate reads; the current nested declaration is ignored there |
| `dsh.engines` | `{"dsh":">=0.1.6-alpha.2"}` | **removed** | non-standard position (ignored by the host) and far broader than the declared compatibility; dsh-market reads it only as a fallback when top-level is absent |
| `dsh.manifestVersion` | — | `1` | declared public manifest format (`DshManifest.manifestVersion: 1`); optional but explicit |
| `peerDependencies["@deepseek-ai/dsh-session"]` | `^0.2.0-rc.1 \|\| ^0.2.1-rc.2` | `^0.2.1-rc.2` | matches `engines.dsh` above, keeps an explicit prerelease comparator (the catalog's rule), and stops claiming the untested 0.2.0 line |
| `publishConfig` | — | `{"access":"public"}` | explicit publish intent; unscoped default is public anyway |
| `version` | `0.4.1` | unchanged | first npm publish can use 0.4.1; see npm-publish.md §3 before any bump |
| `dsh.bundle`, `dsh.client`, `dsh.compatibility` | present | unchanged | `compatibility.dshReleases` is author-facing documentation; neither the host gate nor dsh-market reads it, so keep it accurate by hand (`0.2.1-rc.2` tested) |

Do **not** add:

- **`sideEffects`** — registration happens when the host imports `lib/index.js`
  and loads `lib/client.js`; declaring `false` invites a bundler to tree-shake
  those imports, and nothing on the DSH path needs it. If a downstream bundler
  ever wraps this package, use `"sideEffects": ["lib/index.js", "lib/client.js"]`.
- **`prepare` / install-time build** — `lib/` is committed prebuilt on purpose so
  `dsh plugin add github:…` needs no build and no `allowBuilds` approval.
- **`dependencies` for `@deepseek-ai/*`** — they are host packages; peers only.
- **`private: true`** — the package must be publishable.

Optional hardening (not applied by the script): a publish guard, so a stale
prebuilt bundle can never be published.

```sh
npm pkg set 'scripts.prepublishOnly=npm run build && git diff --exit-code -- lib src/vendor.bundle.js && npm run check && npm test'
```

It runs only in a git checkout and only on `npm publish`; it does not affect
installs or CI.

### 1.3 Target `package.json` (for review; `OWNER` replaced by the script)

```json
{
  "name": "dsh-curate",
  "version": "0.4.1",
  "description": "Human-in-the-loop context curation: triage turns, rewrite messages, then compress the session history in place with model-written summaries and a local backup.",
  "icon": "assets/icon.svg",
  "author": "OWNER (https://github.com/OWNER/dsh-curate)",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./client": "./lib/client.js",
    "./locale/*.json": "./locale/*.json",
    "./package.json": "./package.json"
  },
  "files": [
    "lib/index.js",
    "lib/surface.js",
    "lib/backup.js",
    "lib/client.js",
    "lib/edits.js",
    "cordis.patch.yml",
    "README.md",
    "LICENSE",
    "NOTICE.md",
    "assets/icon.svg",
    "locale/*.json"
  ],
  "keywords": [
    "deepseek-harness",
    "dsh",
    "dsh-plugin",
    "context",
    "compression",
    "compaction",
    "curation",
    "human-in-the-loop",
    "session",
    "summarization"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/OWNER/dsh-curate.git"
  },
  "homepage": "https://github.com/OWNER/dsh-curate#readme",
  "bugs": {
    "url": "https://github.com/OWNER/dsh-curate/issues"
  },
  "engines": {
    "node": ">=22",
    "dsh": ">=0.2.1-rc.2"
  },
  "scripts": {
    "build:vendor": "node scripts/build-vendor.mjs",
    "build:client": "node scripts/build-client.mjs",
    "build": "npm run build:vendor && npm run build:client",
    "check": "node --check lib/index.js && node --check lib/surface.js && node --check lib/backup.js && node --check lib/edits.js && node --check lib/client.js",
    "test": "node --test \"test/*.test.mjs\""
  },
  "devDependencies": {
    "@deepseek-ai/dsh-session": "^0.2.1-rc.2",
    "dompurify": "^3.2.4",
    "esbuild": "^0.25.0",
    "jsdom": "^26.0.0",
    "marked": "^15.0.7",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "turndown": "^7.2.0",
    "turndown-plugin-gfm": "^1.0.2"
  },
  "peerDependencies": {
    "@deepseek-ai/dsh-session": "^0.2.1-rc.2"
  },
  "dsh": {
    "manifestVersion": 1,
    "bundle": {
      "patch": "./cordis.patch.yml"
    },
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-conversation"
      ]
    },
    "compatibility": {
      "dshReleases": {
        "0.2.1-rc.2": "compatible"
      }
    }
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### 1.4 Verify

```sh
node docs/release/verify-release.mjs --strict    # before applying: exit 1 with the pending fields; after: 0 fail
node docs/release/apply-package.mjs --check        # expect exit 0, all PASS
npm pack --dry-run --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=Object.values(JSON.parse(s))[0];console.log(r.entryCount,'files',r.size,'B');r.files.forEach(f=>console.log(f.path))})"
```

Expected tarball after the change, measured by dry-running the applied tree in a
scratch copy: **13 files, 93,847 B packed, 343,746 B unpacked** (the current 10
plus `assets/icon.svg`, `locale/en.json`, `locale/zh.json`), and still **no**
`src/`, `test/`, `scripts/`, `docs/`, `package-lock.json`. The same dry run
reported 29 pass / 1 warn / 0 fail from `verify-release.mjs --strict`; the one
warning is the README absolute paths that D2/D3 remove.

---

## 2. `README.md`

Line numbers refer to `README.md` as of 0.4.1. Apply them in order (later line
numbers shift).

### D1 — English summary near the top (insert after line 1, before the Chinese intro)

```diff
 # dsh-curate — 人工筛选 / 改消息 / 按区间压缩的上下文工作台
 
+**English:** a human-in-the-loop context curation workbench for DeepSeek
+Harness. It lists the model-visible session as turns, lets you mark whole turns
+or single messages **Important** (keep verbatim) / **Normal** / **Minor**
+(summarize) and rewrite user, assistant, tool-result and injected-context
+messages in place without a model call, then compresses the marked ranges with
+model-written summaries or the official `/compact`. Every write is preceded by
+a local JSON backup. Install with
+`dsh plugin --profile web add github:OWNER/dsh-curate`, then restart `dsh web`
+and hard-refresh the page.
+
 为 DeepSeek Harness（DSH）提供一个人工主导的上下文整理插件。它不替用户决定“什么重要”，而是把决定权交给人：
```

### D2 — Replace the machine-specific install section (lines 63–73)

Before (current):

````markdown
## 安装

```bash
cd "$REPO"
npm install
npm run build
# 在 DSH 里安装本地包（profile 视情况而定）：
dsh plugin --profile web add "$REPO"
```

或在 DSH GUI 的插件管理中安装本地目录。安装后刷新页面，会话头部会出现「整理上下文」按钮。
````

After:

````markdown
## 安装

要求：Node.js ≥ 22；DSH 0.2.1-rc.x（本插件声明 `engines.dsh >= 0.2.1-rc.2`）。

从 GitHub 安装（推荐；`lib/` 已预构建，安装时不需要编译）：

```bash
dsh plugin --profile web add github:OWNER/dsh-curate
```

发布到 npm 后也可以按包名安装：

```bash
dsh plugin --profile web add dsh-curate
```

本地开发安装：

```bash
git clone https://github.com/OWNER/dsh-curate
cd dsh-curate
dsh plugin --profile web add "$PWD"
# 需要重新构建或跑测试时再执行：npm ci && npm run build && npm test
```

`--profile` 的名字按你的环境替换（Web GUI 默认是 `web`；官方桌面端在应用内的插件管理里安装）。

安装后**必须重启 `dsh web` 并硬刷新页面**：宿主插件在启动时加载，浏览器端 bundle 需要刷新才会更新。
````

### D3 — Remove local-machine references (line 21)

Before:

> DSH 自带的 `compaction-basic` 和本机安装的 billion-context 都是“到阈值自动压”。这个插件的定位是**人工可控的压缩**：先备份、可逐段编辑、可保留关键段落为原文、可先把消息改对再压。它不修改 bili 配置，也不会停用 bili 的最后防线。

After:

> DSH 自带的 `compaction-basic` 是“到阈值自动压”。这个插件的定位是**人工可控的压缩**：先备份、可编辑消息、可保留关键段落为原文、可先把消息改对再压；它不替代自动压缩，也不修改其他插件或 profile 的配置。

### D4 — Screenshot section (insert after 使用, before `## 安全边界`)

The image now in `assets/screenshot-workbench.png` is a current 0.4.1 capture,
so this section can be added as-is. Caveat: it shows a live personal session
(account name, private session titles, conversation text); approve that, or
recapture a clean session first — see publish-checklist.md §3. The older
`docs/sidebar-workbench.png` is pre-0.4.1 and must not be used.

```diff
 8. 压缩完成后工作台会重新加载并显示压缩后的内容。
 
+## 截图
+
+![右侧栏中的上下文整理工作台：按轮分组、逐条标记重要/一般/次要，底部应用到上下文与压缩上下文](assets/screenshot-workbench.png)
+
 ## 安全边界
```

### D5 — Repository links at the bottom (lines 157–159)

```diff
 ## License
 
-MIT，见 `LICENSE`；改编来源与第三方许可见 `NOTICE.md`。
+MIT，见 [`LICENSE`](LICENSE)；改编来源与第三方许可见 [`NOTICE.md`](NOTICE.md)。
+
+仓库：<https://github.com/OWNER/dsh-curate> · 问题反馈：<https://github.com/OWNER/dsh-curate/issues>
```

### D6 — (optional) Use the lockfile in the 开发 section (lines 121–127)

```diff
 ```bash
-npm install
+npm ci
 npm run build      # vendor（marked/turndown/DOMPurify）+ client bundle
 npm test           # node --test：surface / edits / backup / client
 ```
```

### Market listing blurb (goes to the catalog PR, not to README)

The one-line entry text is in [awesome-entry.yml](awesome-entry.yml). Short
summary of the claims, all verifiable in `lib/` and `src/client.js`:

- marks whole turns or single messages Important / Normal / Minor;
- edits messages in place without a model call (user messages via surface
  replacement, the rest via plugin record + message projection);
- compresses marked ranges with model-written summaries or the official
  `/compact`; last message and `Important` messages stay verbatim;
- writes a local JSON backup before every write.

No counts, no superlatives, no unsupported API names.

---

## 3. After applying — single verification pass

```sh
node docs/release/verify-release.mjs --strict    # must report 0 fail
npm run check && npm test                        # 62/62 tests
npm pack --dry-run --json                        # icon + locale present, no dev leakage
# restart the host and confirm the plugin card shows 上下文整理 + icon:
#   dsh web, then Settings -> Plugins (or the Plugins page on dsh >= 0.2.1)
# static check that the exports map resolves (profile has a dsh-curate link):
cd ~/.dsh/profiles/web && node --input-type=module -e "console.log(import.meta.resolve('dsh-curate/locale/en.json'))"
```

Suggested commit message once applied:

```
release: marketplace packaging (repository link, display metadata, CI, docs)

- package.json: repository/homepage/bugs/author, icon, locale exports + files,
  top-level engines.dsh aligned to tested 0.2.1-rc.2, publishConfig
- README: portable install, English summary, repo links
- add CI workflow, screenshots.json, icon, CHANGELOG and release docs
```

Then follow publish-checklist.md §5 phases C–F (git init/push → topic → 24 h →
npm (optional) → catalog PR).
