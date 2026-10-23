# Publish checklist — dsh-curate → awesome-dsh-plugin catalog

Snapshot: **2026-10-21**, `dsh-curate@0.4.1`, host tested against `dsh 0.2.1-rc.2`,
local Node 26.10.0 / npm 12.1.0 (the CI workflow below runs Node 22 and 24).

This checklist covers only what the marketplace and npm actually require. It was
compiled from the sources quoted in [Sources](#sources), not from memory.

Legend: **PASS** ready · **NEEDS-APPLY** files exist, `package.json`/`README.md`
edits proposed in [apply.md](apply.md) are not applied yet · **NEEDS-USER** an
action only the repository owner can do · **BLOCKED** cannot be done from this
machine (no git repository, no `gh`, no npm login).

---

## 1. Gate-by-gate status

| # | Gate | Requirement (source) | Status | Evidence / action |
|---|------|----------------------|--------|-------------------|
| 1 | `dsh.bundle` manifest | Repo declares `dsh.bundle` in `package.json`; `dsh.client` alone is **not** installable | **PASS** | `dsh.bundle.patch: ./cordis.patch.yml`; patch inserts `id: dsh-curate` |
| 2 | Real, working code | No placeholder / README-only repo | **PASS** | `lib/` 5 runtime files, `src/` 2923-line client, 62 tests (`npm test`: 62/62 pass) |
| 3 | Repo age ≥ 1 day | Automatically checked by catalog CI | **BLOCKED** | No git repository yet; clock starts when the GitHub repo is created |
| 4 | `dsh-plugin` topic | GitHub topic on the repo | **NEEDS-USER** | Add after push: repo → About → Topics |
| 5 | Accurate, marketing-free description | Read as a claim and checked against code | **PASS (draft)** | Entry draft in [awesome-entry.yml](awesome-entry.yml); no numbers or superlatives claimed |
| 6 | `category: session` | Category matches behaviour; near misses are re-filed by maintainers | **PASS** | Renders under "Sessions & Messages" |
| 7 | Official `@deepseek-ai/*` as peers with explicit prerelease branch | Missing prerelease branch silently excludes prerelease hosts | **PASS** | Sole official peer `@deepseek-ai/dsh-session` has an explicit `-rc.` comparator on both tuples |
| 8 | `engines.dsh` placement and accuracy | `dsh-app-boot` reads **top-level** `engines.dsh`; `dsh.engines.dsh` is ignored there (dsh-market reads it only as a fallback) | **NEEDS-APPLY** | Current `dsh.engines.dsh: ">=0.1.6-alpha.2"` is both misplaced and too broad versus the declared compatibility (`0.2.1-rc.2` only) |
| 9 | DSH display metadata | Icon + localized title/description (see §2) | **NEEDS-APPLY** | `assets/icon.svg` and `docs/release/locale/*.json` created; `package.json` `icon`, `exports`, `files` pending |
| 9b | GitHub Actions CI | Workflow lives at `docs/release/ci.yml` until the token has the `workflow` scope; move it to `.github/workflows/ci.yml` and push (steps in the file header) | **NEEDS-USER (scope)** | Own repo, next to `package.json`, 1–8 paths relative to that file, no `..`/absolute, GitHub-hosted images only | **PASS*** | `screenshots.json` + `assets/screenshot-workbench.png`; *current 0.4.1 capture that contains a personal live session — approve it or recapture a clean one, see §3 |
| 11 | npm `repository` field | Published package's `repository` must point back at the listed repo, or npm/GitHub stay unlinked | **NEEDS-APPLY** | `repository`/`homepage`/`bugs`/`author` missing today |
| 12 | CI workflow | Not required, but expected of a maintained repo | **PASS** | `.github/workflows/ci.yml` (Node 22/24, `npm ci`, build, stale-artifact diff, check, test, `npm pack --dry-run`; no secrets) |
| 13 | npm publish (optional) | Recommended: prebuilt installs skip the `allowBuilds` approval | **BLOCKED** | Not logged in (`npm whoami` → `ENEEDAUTH`); name `dsh-curate` is free (registry HTTP 404 on 2026-10-21) |
| 14 | Entry file / PR | One `data/plugins/<owner>__<repo>.yml`, max 3 entries per PR | **BLOCKED** | Needs the GitHub repo and owner first; content ready in [awesome-entry.yml](awesome-entry.yml) |
| 15 | `npm pack` contents | Tarball must carry the runtime, must not leak dev files | **PASS** | 10 files, 93,035 B packed / 341,615 B unpacked; see [npm-publish.md](npm-publish.md) |

---

## 2. Display metadata: what DSH 0.2.1-rc.2 actually supports

Do **not** invent fields. Verified in the installed runtime
(`@deepseek-ai/dsh-package-manifest@0.2.1-rc.2` → `lib/types/types.d.ts`, and
`@deepseek-ai/dsh-app-boot@0.2.1-rc.2` → `readPluginMeta`)/`iconOf`):

- **Icon** — `package.json` top-level `"icon": "<relative path>"` (SVG, PNG,
  JPEG or WebP; must stay inside the package directory; ≤ 256 KiB), or an
  exported `<package>/icon` subpath. A declared manifest `icon` takes priority.
  dsh-context 0.74.0 uses `"icon": "icon.svg"`; dsh-restart 0.1.0 exports
  `"./icon": "./icon.svg"`. `assets/icon.svg` + `"icon": "assets/icon.svg"`
  is valid and needs no root-level copy.
- **Localized title / description** — files `locale/en.json` and sibling
  `locale/<lang>.json`, each `{"meta": {"title": "...", "description": "..."}}`,
  resolved through the package `exports` map as `./locale/*.json`. English is
  required; other languages are read from the same directory. Fallbacks:
  title → package name, description → top-level `package.json.description`.
- **Not supported / unread**: there is no manifest field for a display name,
  category, screenshots or homepage inside `dsh`; marketplace text comes from
  the catalog entry, screenshots from the repo's `screenshots.json`, and store
  links from `package.json` `homepage`/`repository`.

Current state: the plugin card in Settings → Plugins has no icon, its title falls
back to the package name `dsh-curate`, and its description falls back to the
English `package.json.description`. After the apply step the card shows
上下文整理 / "Context curation" plus the icon.

---

## 3. Screenshot status

Primary image: `assets/screenshot-workbench.png` — a copy (identical sha256
`f27f86…8bef`) of `docs/workbench-preview.png`, **1440×900, 264,977 B**,
captured 2026-10-21 23:07 by the teammate running the live verification harness
against the live **0.4.1** host (headless Chrome, read-only; see the verifier's
`docs/verification/live-baseline.md`). It is a real workbench capture and shows
the current UI:

- session-header action **Curate context**;
- right-sidebar panel **Context curation**, `Visible ≈126k tokens · 2 segments`,
  `Keep recent 2 turns verbatim` / `All content` / `Dialogue text only`;
- per-turn `Important / Normal / Minor`, previews with `Read full text`,
  `Split` / `Merge next`;
- footer **Apply to context · Compress context · Save current content · Undo**
  and the `v0.4.1` version marker.

`docs/sidebar-workbench.png` (44,968 B) is also a real capture, but pre-0.4.1: its
footer shows `Draft all summaries`, a button removed in 0.4.1. It is kept only as
history and is **not** referenced by `screenshots.json`.

**Before submitting, decide on the privacy of the primary image.** The capture
shows a live personal session: the account name in the bottom-left, private
session/workspace titles in the sidebar, conversation text and local paths. No
token or API key is visible, but the marketplace image is public. Two options:

1. **Approve the current image** as-is (fastest), or
2. **Recapture in a clean session** (recommended) and overwrite the same path:
   - open a scratch session with 3–4 neutral turns (for example about a shopping
     list or a sample JSON file), click **Curate context** in the header;
   - mark one turn `Minor` so the screenshot shows the workbench doing its job,
     and leave one message preview expanded;
   - capture the window at 1440×900+ (keep the PNG under 2 MB) — or crop to the
     right-hand workbench panel to avoid showing any session list;
   - overwrite `assets/screenshot-workbench.png`; `screenshots.json` needs no edit.
3. Optional second image (max 8): the `Compress context` confirmation dialog;
   append its path to `screenshots.json`.

Storefront fallback: if the declared file is missing, dsh-market extracts images
from the README, so a stale or broken shot is worse than none — either replace it
or remove the entry from `screenshots.json`.

---

## 4. Install-from-GitHub viability (measured)

`dsh plugin add github:<owner>/dsh-curate` installs the package from the git
repository; npm/pnpm packs the repo using the package `files` allow-list and runs
no build script. Measured on the current tree:

- `package.json` has **no** `prepare`, `prepack` or `install` script, and `files`
  ships the prebuilt runtime (`lib/index.js`, `lib/client.js`, `lib/surface.js`,
  `lib/edits.js`, `lib/backup.js`) plus `cordis.patch.yml`. Nothing has to be
  compiled at install time and no `allowBuilds` approval is triggered.
- A tarball extracted to a scratch directory imports cleanly:
  `import('./lib/index.js')` exports `default`, `apply`, `name`, `PLUGIN_VERSION`
  (no missing runtime module).
- The only runtime import from the host is `@deepseek-ai/dsh-session`, declared
  as a peer and supplied by the profile — do not move it to `dependencies`.
- Conclusion: **GitHub source install works from the committed tree**, and after
  [apply.md](apply.md) it also carries the icon/locale display metadata. npm
  publishing remains recommended only because prebuilt npm installs skip the
  build-approval step and show download counts.

## 5. Exact command sequence

Run from the repository root. Steps A–B are local and C is `git` on this machine;
E and F need npm/GitHub credentials this machine does not have, and D is just a
24-hour wait.

### A. Apply the proposed edits

```sh
# 1. localized display metadata + let the package-edit script run
mkdir -p locale
cp docs/release/locale/en.json docs/release/locale/zh.json locale/
OWNER=<your-github-user> node docs/release/apply-package.mjs
# 2. hand-apply the README edits from docs/release/apply.md (D1–D5)
node docs/release/verify-release.mjs          # expect 0 fail (warnings explained in output)
```

### B. Verify the plugin still works

```sh
npm ci
npm run build && git diff --exit-code -- lib src/vendor.bundle.js
npm run check
npm test
npm pack --dry-run --json
```

After the plugin is installed in the web profile and `dsh web` is restarted:
Settings → Plugins should show the localized title/description/icon. Static
check of the exports map (profile contains a `dsh-curate` link):

```sh
cd ~/.dsh/profiles/web
node --input-type=module -e "console.log(import.meta.resolve('dsh-curate/locale/en.json'))"
```

### C. Create and push the GitHub repository (GUI or CLI, no `gh` here)

```sh
git init -b main
git add -A
git commit -m "dsh-curate 0.4.1: human-in-the-loop context curation"
# create an EMPTY public repo named dsh-curate in the GitHub UI, then:
git remote add origin git@github.com:<owner>/dsh-curate.git
git push -u origin main
```

Then in the repo's About panel: **Topics → `dsh-plugin`**.

### D. Wait one day

The catalog's automated check only requires the repo to be **created** at least
24 h before the PR. Nothing else is gained by waiting.

### E. Optional but recommended: publish to npm

See [npm-publish.md](npm-publish.md). Verify the repository↔npm link afterwards:

```sh
npm view dsh-curate version repository.url
```

### F. Open the catalog PR

1. Fork `https://github.com/awesome-dsh-plugin/awesome-dsh-plugin` in the UI.
2. Add `data/plugins/<owner>__dsh-curate.yml` with the content of
   [awesome-entry.yml](awesome-entry.yml) (`OWNER` replaced).
3. One commit, one PR, body says what the plugin does and links the repo. Do not
   edit the generated READMEs and do not touch other entries.
4. CI checks, in order: entry count (≤ 3), `dsh.bundle` fetched from your repo,
   repo age, `awesome-lint` + site build. Push fixes to the same branch if a
   check fails.

Optional local preview of the generated list line:

```sh
git clone https://github.com/<your-fork>/awesome-dsh-plugin
cd awesome-dsh-plugin && npm ci && node scripts/generate-readme.mjs
```

---

## 5. Still blocked on this machine (nothing was published or pushed)

- **No git repository** in the working tree (`git status`
  → "not a git repository"), so no commit/push/tag can be made here.
- **No `gh` CLI** (`which gh` → not found) and no GitHub credential configured;
  repo creation and the topic must be done in the GitHub UI or by the owner.
- **No npm login** (`npm whoami` → `ENEEDAUTH`); `npm publish` will fail until
  `npm login` (or trusted publishing from GitHub Actions) is done by the owner.
- **Owner unknown**, so every URL in this proposal uses `OWNER`; the entry file
  name and both URLs must be filled in after the repo is created.
- Catalog PR cannot be opened from here.

## Sources

- Catalog rules: [contributing.md](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)
  (fetched 2026-10-21). Key lines quoted: *"Most rejected submissions declare
  only `dsh.client` — that alone is not installable."*; *"The repo is at least
  1 day old."*; *"A peer range without an explicit prerelease branch silently
  excludes every prerelease build of the harness."*; *"add a `screenshots.json`
  next to your `package.json` … listing 1-8 image paths"*; *"The published
  package's `repository` field must point back at the repository listed here."*
- Catalog README listing bar: [README.md](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/README.md) —
  entry added when the plugin *"installs with `dsh plugin add`, does what its
  one-line description says, sits in the right category, and is maintained."*
- Catalog CI order: same contributing.md, *"What CI checks"* section.
- Market app: `dshmarket@1.66.39` in `~/.dsh/profiles/web/node_modules/dshmarket`
  — its README's *"Submit your plugin"* section confirms *"This repo is the
  market app, not the catalog"* and that entries go to the catalog repo.
  `lib/discovery-compatibility.js` reads `engines.dsh` (top-level first, then
  `dsh.engines.dsh`) and `@deepseek-ai/dsh-*` peers.
- Host metadata: `@deepseek-ai/dsh-package-manifest@0.2.1-rc.2`
  `lib/types/types.d.ts` (`icon`, `PluginLocalizedMeta`, `DshEnginesManifest`);
  `@deepseek-ai/dsh-app-boot@0.2.1-rc.2` `readPluginMeta`/`iconOf`/
  `unmetRequirements` in `lib/index.js`.

---

## Status as of 2026-10-22 (0.5.0)

| Step | State |
|---|---|
| package metadata (repository/homepage/bugs/author/icon/locale/engines/peer/publishConfig) | **applied** in `package.json`; `node docs/release/verify-release.mjs --strict` = 21 pass / 1 warn (screenshots intentionally omitted for privacy) / 0 fail |
| version | `0.5.0` in `package.json`; host reads it at runtime, client build injects it; `CHANGELOG.md` updated |
| GitHub repository | created and pushed: https://github.com/111222cjyq/dsh-curate (`main` at the 0.5.0 tree), topic `dsh-plugin` set; description set |
| local git | initialized in the project (`main`), two commits: initial 0.5.0 release + header-refresh fix + architecture diagram |
| CI | workflow parked at `docs/release/ci.yml` because the token lacks the `workflow` scope; move it back after `gh auth refresh -h github.com -s workflow` |
| npm publish | **not done** (no npm login); catalog listing does not require it. `npm pack --dry-run` = 13 files / ~104 kB packed, no dev leakage |
| catalog PR | **opened 2026-10-23**: [awesome-dsh-plugin#8843](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/8843), one file `data/plugins/111222cjyq__dsh-curate.yml`; CI green, awaiting maintainer review — see *Submission status* below |
| screenshots | intentionally not shipped: the only live capture contains a personal session. Recapture a clean session before adding `screenshots.json` (optional) |

---

## Submission status as of 2026-10-23 (0.5.2)

The catalog PR was submitted on 2026-10-23 once the repository passed the
24-hour age floor (created `2026-10-21T15:35:37Z`).

| Item | State |
|---|---|
| repository age | 37 h at submission — catalog requires ≥ 24 h |
| catalog PR | [awesome-dsh-plugin#8843](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/8843) — `Add 111222cjyq/dsh-curate`, open, mergeable, awaiting maintainer review |
| PR contents | exactly one added file: `data/plugins/111222cjyq__dsh-curate.yml` (no README edits — they are regenerated on `main` after merge) |
| `check` workflow | **pass** (10m 20s): stale-fork guard, path checks, README regeneration parity, `awesome-lint`, entry tests, site build |
| `Submission gate` workflow | **pass** (26s): repo age, `dsh.bundle` + `cordis.patch.yml`, repo not archived, not a first-party repo |
| local preflight | entry YAML parsed, README row generated at 6,566 entries, `generate-readme.mjs --check` up to date, `build-site.mjs` built 6,566 rows × 2 locales, `awesome-lint` exit 0 |
| repo state | `main` at `71adcb1` (`v0.5.2`), working tree clean |
