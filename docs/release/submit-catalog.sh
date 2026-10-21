#!/usr/bin/env bash
# Submit dsh-curate to the awesome-dsh-plugin catalog.
#
# The catalog CI rejects a repository younger than one day, so this script
# refuses to open the PR early instead of earning a red CI run.
#
# Prerequisites: `gh auth login` for the owner account, `git`, `curl`.
# Usage: docs/release/submit-catalog.sh            # check + submit when eligible
#        docs/release/submit-catalog.sh --check    # only report eligibility
set -euo pipefail

OWNER="111222cjyq"
REPO="dsh-curate"
CATALOG="awesome-dsh-plugin/awesome-dsh-plugin"
ENTRY_SRC="$(cd "$(dirname "$0")" && pwd)/awesome-entry.yml"
BRANCH="add-${REPO}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

command -v gh >/dev/null || { echo "gh CLI not found (https://cli.github.com/)" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "run: gh auth login" >&2; exit 1; }

created="$(gh api "repos/${OWNER}/${REPO}" --jq .created_at)"
created_epoch="$(date -u -d "$created" +%s)"
now_epoch="$(date -u +%s)"
age_hours=$(( (now_epoch - created_epoch) / 3600 ))
echo "repository age: ${age_hours}h (catalog requires >= 24h)"
if (( age_hours < 24 )); then
  echo "not eligible yet: wait $((24 - age_hours)) more hour(s), then rerun this script."
  exit 2
fi

if [[ "${1:-}" == "--check" ]]; then
  echo "eligible to submit."
  exit 0
fi

gh repo fork "$CATALOG" --clone=false >/dev/null
gh repo clone "${OWNER}/awesome-dsh-plugin" "$WORKDIR/catalog" -- --depth=1
mkdir -p "$WORKDIR/catalog/data/plugins"
cp "$ENTRY_SRC" "$WORKDIR/catalog/data/plugins/${OWNER}__${REPO}.yml"
(
  cd "$WORKDIR/catalog"
  git checkout -b "$BRANCH"
  git add "data/plugins/${OWNER}__${REPO}.yml"
  git -c user.name="$OWNER" -c user.email="${OWNER}@users.noreply.github.com" \
    commit -m "Add ${OWNER}/${REPO}"
  git push -u origin "$BRANCH"
)
gh pr create \
  --repo "$CATALOG" \
  --head "${OWNER}:${BRANCH}" \
  --title "Add ${OWNER}/${REPO}" \
  --body "Adds \`${OWNER}/${REPO}\` (context curation workbench for DSH sessions) to the Sessions & Messages category.

- \`dsh.bundle\` + \`cordis.patch.yml\` present; installs with \`dsh plugin --profile web add github:${OWNER}/${REPO}\` with a prebuilt \`lib/\` (no build step).
- Repository: https://github.com/${OWNER}/${REPO}
- Category: \`session\`; one entry only."
echo "PR opened."
