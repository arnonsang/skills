#!/usr/bin/env bash
# Create an isolated worktree for one fleet slice: branch fleet/<slice>, shared node_modules, copied env files.
set -euo pipefail

repo=${1:?usage: fleet-worktree.sh <repo> <slice> [base-ref]}
slice=${2:?usage: fleet-worktree.sh <repo> <slice> [base-ref]}
base=${3:-HEAD}

repo=$(cd "$repo" && git rev-parse --show-toplevel)
name=$(basename "$repo")
path="$(dirname "$repo")/${name}-fleet-${slice}"
branch="fleet/${slice}"

if [ -e "$path" ]; then
  echo "EXISTS: $path (reuse it or remove it first)"
  exit 1
fi

git -C "$repo" worktree add -q -b "$branch" "$path" "$base"

# Share installed deps instead of reinstalling: every node_modules dir up to depth 3, skipping nested ones.
while IFS= read -r nm; do
  rel=${nm#"$repo"/}
  mkdir -p "$path/$(dirname "$rel")"
  [ -e "$path/$rel" ] || ln -s "$nm" "$path/$rel"
done < <(find "$repo" -maxdepth 3 -name node_modules -type d -prune -not -path "*/node_modules/*/node_modules" 2>/dev/null)

# Untracked env files the app or tests read.
for f in .env.local .env .env.development.local .env.test.local api/.env.local api/.env; do
  if [ -f "$repo/$f" ] && ! git -C "$repo" ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    mkdir -p "$path/$(dirname "$f")"
    cp "$repo/$f" "$path/$f"
  fi
done

echo "WORKTREE: $path"
echo "BRANCH: $branch (from $base)"
