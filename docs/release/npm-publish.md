# npm publish runbook — dsh-curate

Snapshot: **2026-10-21**, `dsh-curate@0.4.1`. npm publishing is **optional** for
catalog listing (the entry works either way), but it is recommended by the
catalog: prebuilt npm installs skip the `allowBuilds` build-approval step.

Checks done for this runbook on 2026-10-21:

- `curl -s -o /dev/null -w '%{http_code}' https://registry.npmjs.org/dsh-curate`
  → **404**, the unscoped name is free. Re-check before publishing; a 404 today
  says nothing about next week.
- `npm whoami` → `ENEEDAUTH`. Publishing is **blocked on this machine** until the
  owner runs `npm login` (or uses trusted publishing from GitHub Actions).
- Tarball today (before the display-metadata edits): **10 files, 93,035 B packed,
  341,615 B unpacked** (`npm pack --dry-run --json`). File list:
  `package.json`, `cordis.patch.yml`, `lib/{index,client,surface,edits,backup}.js`,
  `README.md`, `LICENSE`, `NOTICE.md`.
- No runtime file is missing today and there is **no dev leakage**: the tarball
  contains no `src/`, `test/`, `scripts/`, `node_modules/`, `package-lock.json`
  or `docs/`. The only gap is display metadata: no icon and no locale files until
  [apply.md](apply.md) is applied. Measured after applying the proposal in a
  scratch copy: **13 files, 93,847 B packed, 343,746 B unpacked**.

Do the `package.json` edits in [apply.md](apply.md) first — in particular
`repository`, `homepage`, `bugs`, `icon`, and the `files` additions. Without
`repository` the npm package and the GitHub repo are not linked, and the catalog
will not show a download count (and provenance cannot be produced).

---

## 1. What the tarball must contain

| Must contain | Why |
|---|---|
| `package.json` | identity + `dsh.bundle` + `exports` (incl. `./locale/*.json`) |
| `cordis.patch.yml` | the bundle layer the host applies |
| `lib/index.js`, `lib/surface.js`, `lib/edits.js`, `lib/backup.js` | host half |
| `lib/client.js` | browser half, already bundled |
| `README.md`, `LICENSE`, `NOTICE.md` | docs and attribution |
| `assets/icon.svg` | DSH plugin icon (after apply) |
| `locale/en.json`, `locale/zh.json` | localized title/description (after apply) |

| Must NOT contain | Why |
|---|---|
| `src/`, `test/`, `scripts/` | development sources; not needed at runtime |
| `node_modules/` | would balloon the package; the host supplies peers |
| `package-lock.json`, `docs/`, `.github/` | repo-only material |
| `*.tgz`, backups, local verification artifacts | accidental artifacts |

`files` in `package.json` is the allow-list that enforces this — it already
excludes all dev paths, and after apply it includes the icon and locale files.
Note that npm always includes `package.json`, `README`, `LICENSE` and the
`main` file regardless of `files`.

---

## 2. Pre-publish sequence

Run from the repository root after the [apply.md](apply.md) changes are committed.

```sh
# 0. name still free?
npm view dsh-curate version        # expect E404

# 1. clean, reproducible build from the lockfile
git status --porcelain             # must be empty
rm -rf node_modules && npm ci
npm run build
git diff --exit-code -- lib src/vendor.bundle.js   # prebuilt artifacts must be current
npm run check
npm test

# 2. inspect the exact package
npm pack --dry-run --json > /tmp/dsh-curate-pack.json
node -e "const r=Object.values(require('/tmp/dsh-curate-pack.json'))[0];
console.log(r.entryCount+' files', r.size+' B packed', r.unpackedSize+' B unpacked');
for (const f of r.files) console.log(String(f.size).padStart(8), f.path)"
# expect the icon + locale files in the list now, still no src/test/scripts

# 3. optional: inspect the real tarball, then remove it (leave no tarball behind)
npm pack --pack-destination /tmp
tar -tzf /tmp/dsh-curate-0.4.1.tgz | sort
rm /tmp/dsh-curate-0.4.1.tgz

# 4. authenticate (2FA-enabled account) and publish
npm login
npm publish --access public

# 5. verify the published package
npm view dsh-curate version repository.url homepage
npm pack dsh-curate@0.4.1 --pack-destination /tmp && tar -tzf /tmp/dsh-curate-0.4.1.tgz | sort
rm /tmp/dsh-curate-0.4.1.tgz
```

`--access public` is the default for unscoped packages; it is passed explicitly so
the intent is visible.

---

## 3. Version bumps: three literals must move together

The version is **not** read from `package.json` at runtime:

- `lib/index.js`: `export const PLUGIN_VERSION = '0.4.1'` (**host half**, hand-written)
- `src/client.js`: `const PLUGIN_VERSION = '0.4.1'` (**client source**; `lib/client.js`
  is built from it)
- `lib/client.js`: generated copy — do not edit by hand

The workbench compares the host and client versions and shows a "restart and hard
refresh" banner when they differ, so a version bump that updates only one literal
would make a correct install look broken. For every release:

```sh
# 1. pick the version, then edit ALL of:
#    package.json, lib/index.js (PLUGIN_VERSION), src/client.js (PLUGIN_VERSION)
# 2. rebuild so lib/client.js carries the same literal
npm run build
# 3. update CHANGELOG.md, commit, then tag after publishing:
git add -A && git commit -m "release: v0.4.2"
git tag v0.4.2
git push origin main --tags
```

`npm version` is **not** sufficient here (it changes only `package.json`) unless
its output is followed by the two source edits and a rebuild.

---

## 4. Provenance

- A local `npm publish --provenance` fails: provenance requires a CI provider with
  OIDC. Plain `npm publish` from this machine produces no provenance.
- To get provenance, publish from a GitHub Actions release workflow in the public
  repository with `permissions: id-token: write`, and either
  `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` plus `npm publish --provenance --access public`,
  or npm **trusted publishing** (npmjs.com → package settings → Trusted Publishers,
  no token at all). Keep that workflow separate from `.github/workflows/ci.yml`,
  which is deliberately secrets-free and does not publish.
- Provenance requires the repository field to match the public repo, which is why
  [apply.md](apply.md) sets `repository` first.

Do not add a `prepare`/`install` build script: `lib/` is committed prebuilt, so
`dsh plugin add` from GitHub works without running code during install.

---

## 5. No npm release? Use a GitHub Release tarball

The catalog accepts an optional `tarball:` field for prebuilt assets (an https
`.tgz` hosted on GitHub Releases). Use it only if you decide not to publish to npm;
this repository installs from source anyway because `lib/` is committed.

```sh
npm pack --pack-destination /tmp            # → dsh-curate-0.4.1.tgz
# upload to a GitHub Release. If the URL uses /releases/latest/download/, rename
# the asset to a VERSION-FREE name first, e.g. dsh-curate.tgz — otherwise the URL
# works on submission day and 404s after the next release (catalog contributing.md
# calls this out explicitly).
```

Entry then adds:

```yaml
tarball: https://github.com/OWNER/dsh-curate/releases/latest/download/dsh-curate.tgz
```

or pin the tag when the filename is versioned:

```yaml
tarball: https://github.com/OWNER/dsh-curate/releases/download/v0.4.1/dsh-curate-0.4.1.tgz
```

Never add an `npm:` key to the catalog entry — the npm mapping is collected from
the registry automatically, and a hand-written key is rejected.

---

## 6. After publishing

- Catalog: no action needed for the npm link; the storefront links by `repository`
  and shows download counts once the catalog rebuild picks it up (usually within
  a day).
- dsh-market: shows updates by comparing the installed version with the npm
  version; publish new versions to make updates available.
- If a bad version ships: `npm deprecate dsh-curate@0.4.1 "reason"` rather than
  unpublishing (unpublish breaks installed copies and is restricted after 72 h).
