#!/usr/bin/env bash
# Git Bash / GitHub CLI helper; never touches any other repository.
# --check is read-only. --create-private creates an EMPTY private repo.
# --publish pushes known branches and opens STACKED PRs (never merges).
set -euo pipefail

REPOSITORY='saifsiddiqui59/GenAI-Galaxy'
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:---check}"

usage() {
  echo 'Usage: bash scripts/publish_github.sh [--check|--create-private|--publish]' >&2
  exit 2
}
case "$MODE" in --check|--create-private|--publish) ;; *) usage ;; esac

cd "$ROOT"
command -v git >/dev/null || { echo 'Install Git first.' >&2; exit 2; }
command -v gh >/dev/null || { echo 'Install GitHub CLI (gh) and run gh auth login first.' >&2; exit 2; }
[[ -z "$(git rev-parse --show-prefix)" ]] || { echo 'Not at the expected Galaxy project root.' >&2; exit 2; }
gh auth status -h github.com >/dev/null || { echo 'Authenticate gh with github.com first.' >&2; exit 2; }
ACCOUNT="$(gh api user --jq '.login')"
[[ "$ACCOUNT" == 'saifsiddiqui59' ]] || { echo "Wrong GitHub account: $ACCOUNT. Expected saifsiddiqui59." >&2; exit 2; }

ensure_private_repo() {
  local privacy
  privacy="$(gh repo view "$REPOSITORY" --json isPrivate --jq '.isPrivate')" || {
    echo 'Target GitHub repository is not visible. Create it using --create-private.' >&2
    exit 2
  }
  [[ "$privacy" == true ]] || { echo 'Refusing to publish to a public repository.' >&2; exit 2; }
}

ensure_origin() {
  local expected_https="https://github.com/$REPOSITORY.git"
  local expected_ssh="git@github.com:$REPOSITORY.git"
  local actual
  if actual="$(git remote get-url origin 2>/dev/null)"; then
    case "$actual" in
      "$expected_https"|"${expected_https%.git}"|"$expected_ssh"|"${expected_ssh%.git}") ;;
      *) echo "Refusing unexpected origin: $actual" >&2; exit 2 ;;
    esac
  else
    git remote add origin "$expected_https"
    echo "Added Galaxy-only origin: $expected_https"
  fi
}

if [[ "$MODE" == '--create-private' ]]; then
  if gh repo view "$REPOSITORY" --json isPrivate --jq '.isPrivate' >/dev/null 2>&1; then
    echo 'Repository already exists; checking privacy.'
  else
    gh repo create "$REPOSITORY" --private --description 'GenAI Galaxy Adaptive Interview Tutor'
  fi
  ensure_private_repo
  ensure_origin
  echo "Private repo ready: https://github.com/$REPOSITORY"
  exit 0
fi

if [[ "$MODE" == '--check' ]]; then
  echo "Authenticated GitHub user: $ACCOUNT"
  if gh repo view "$REPOSITORY" --json isPrivate --jq '.isPrivate' 2>/dev/null; then
    echo 'The target GitHub repository exists. Before publishing, verify it is private.'
  else
    echo 'The Galaxy repository is not visible; no files were pushed.'
  fi
  echo 'Next: --create-private (if absent), then --publish.'
  exit 0
fi

ensure_private_repo
# Preserve intentionally separate M2/M3/M4 PRs instead of one large unreviewed merge.
for branch in main feat/m2-interview-foundations feat/m3-curriculum-hardening chore/m4-github-readiness chore/m5-azure-actions; do
  git show-ref --verify --quiet "refs/heads/$branch" || { echo "Missing local branch $branch" >&2; exit 2; }
done
[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || {
  echo 'Commit or stash changes before publishing; refusing partial/untracked pushes.' >&2
  exit 2
}
ensure_origin

git push -u origin main
git push -u origin feat/m2-interview-foundations
git push -u origin feat/m3-curriculum-hardening
git push -u origin chore/m4-github-readiness
git push -u origin chore/m5-azure-actions

create_pr_if_missing() {
  local head="$1" base="$2" title="$3" body="$4" existing
  existing="$(gh pr list --repo "$REPOSITORY" --state open --head "$head" --json number --jq '.[0].number // empty')"
  if [[ -n "$existing" ]]; then
    echo "Existing open PR #$existing for $head; leaving it unchanged."
    return
  fi
  gh pr create --repo "$REPOSITORY" --base "$base" --head "$head" --title "$title" --body "$body" --draft
}

create_pr_if_missing 'feat/m2-interview-foundations' 'main' 'M2: lesson quality and guarded interview APIs' 'Local tests only. Review changes and GitHub Actions before merge. No cloud deployment.'
create_pr_if_missing 'feat/m3-curriculum-hardening' 'feat/m2-interview-foundations' 'M3: curated curriculum expansion and API hardening' 'Stacked on M2; retarget main after M2 merge. Tests must pass on this PR.'
create_pr_if_missing 'chore/m4-github-readiness' 'feat/m3-curriculum-hardening' 'M4: isolated GitHub onboarding and CI safeguards' 'Stacked on M3; read-only CI and GitHub publishing helper. No production secrets or cloud deployment.'

create_pr_if_missing 'chore/m5-azure-actions' 'chore/m4-github-readiness' 'M5: Galaxy Azure OIDC and guarded static deployment' 'Stacked on M4; manual-only Azure authentication check and explicit deployment gate. No cloud resources provisioned.'

echo "Branches pushed and draft PRs requested. Check each Actions run and logs before asking the coordinator to merge."
