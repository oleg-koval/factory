#!/usr/bin/env bash
# Mechanical scan of a factory branch, run in Phase 5 before the whole-change review.
#
# It exists because a review of the diff alone is not a review of the change. A cast, a
# missing pagination guard or a second writer on a counter is visible in the file, not in
# the hunk, and the callers a changed export breaks are in files the diff never lists.
# So this prints four things the reviewer's scope must include:
#
#   1. hard-rule violations, scanned over the FULL TEXT of every changed file
#   2. the blast radius: files outside the change that call a changed export
#   3. concurrency markers, which decide whether the invariant pass is mandatory
#   4. migrations and schema changes
#
# Usage: change-scan.sh <worktree> <base-ref> [human-plan.md]
# Output is a report on stdout. Exit 0 always: this reports, it does not judge.
# The optional third argument adds a fifth section that checks a required feature flag's
# key actually appears in the diff.

set -uo pipefail

WORKTREE=${1:?usage: change-scan.sh <worktree> <base-ref> [human-plan.md]}
BASE=${2:?usage: change-scan.sh <worktree> <base-ref> [human-plan.md]}
HUMAN_PLAN=${3:-}
HERE=$(cd "$(dirname "$0")" && pwd)

cd "$WORKTREE" || exit 2

MERGE_BASE=$(git merge-base "$BASE" HEAD 2>/dev/null) || MERGE_BASE=$BASE
CHANGED=$(git diff --name-only --diff-filter=d "$MERGE_BASE"...HEAD)
CHANGED_COUNT=$(printf '%s\n' "$CHANGED" | grep -c . )

echo "== scope"
echo "worktree: $WORKTREE"
echo "base: $BASE ($MERGE_BASE)"
echo "head: $(git rev-parse HEAD)"
echo "changed files: $CHANGED_COUNT"
printf '%s\n' "$CHANGED" | sed 's/^/  /'

echo
echo "== hard rules (full file text, not the hunks)"
echo "  TS-1 cast or any | TS-2 .js file | GQL-1 nodes without pageInfo"
if [ "$CHANGED_COUNT" -gt 0 ]; then
  printf '%s\n' "$CHANGED" | tr '\n' '\0' | xargs -0 python3 "$HERE/hard-rules.py"
else
  echo "  none"
fi

echo
echo "== blast radius: callers of changed exports, outside the changed set"

TS_FILES=$(printf '%s\n' "$CHANGED" | grep -E '\.(ts|tsx)$' | grep -vE '\.(test|spec)\.tsx?$' || true)

EXPORTS=$(printf '%s\n' "$TS_FILES" | while read -r file; do
  [ -f "$file" ] || continue
  grep -hoE '^export (async )?function [A-Za-z0-9_]+|^export (const|class|interface|type|enum) [A-Za-z0-9_]+' "$file" \
    | awk '{print $NF}'
done | sort -u | grep -v '^$' || true)

if [ -z "$EXPORTS" ]; then
  echo "  no exported symbols changed"
else
  FOUND=0
  while read -r symbol; do
    [ -n "$symbol" ] || continue
    HITS=$(git grep -l -w "$symbol" -- '*.ts' '*.tsx' 2>/dev/null | grep -vxF "$CHANGED" 2>/dev/null)
    [ -n "$HITS" ] || continue
    FOUND=1
    N=$(printf '%s\n' "$HITS" | grep -c .)
    # A symbol with callers everywhere is a barrel export (`db`, `bmq`), not a blast radius.
    # Naming twelve files nobody will read buries the handful that matter.
    if [ "$N" -gt 12 ]; then
      printf '  %s: %s callers (widely used, likely a barrel export; not enumerated)\n' "$symbol" "$N"
    else
      printf '  %s <- %s\n' "$symbol" "$(printf '%s' "$HITS" | tr '\n' ' ')"
    fi
  done <<< "$EXPORTS"
  [ "$FOUND" -eq 0 ] && echo "  no callers outside the changed set"
fi
echo "  -> the review scope is the changed files PLUS every file listed above"

echo
echo "== concurrency markers in changed files"
# Per file, the DISTINCT markers it carries, not every line that matches one. The question
# this section answers is "does this change touch shared mutable state", and a thousand lines
# from a generated query file answers it no better than one.
# Frontend files are excluded: a component's `upsertMutation` is a name, not a race.
MARKER_RE='advisory_lock|FOR UPDATE|SERIALIZABLE|transaction\(|unit\(|Promise\.all|Promise\.allSettled|upsert|ON CONFLICT|[A-Za-z_)\]]\+\+|(increment|decrement)\('

MARKERS=$(printf '%s\n' "$CHANGED" | grep -Ei '\.(ts|tsx|sql|prisma)$' \
  | grep -vE '/frontend/|(^|/)generated/' | while read -r file; do
  [ -f "$file" ] || continue
  FOUND=$(grep -ohE "$MARKER_RE" "$file" | sort -u | tr '\n' ' ')
  [ -n "$FOUND" ] && printf '  %s: %s\n' "$file" "$FOUND"
done)

if [ -n "$MARKERS" ]; then
  printf '%s\n' "$MARKERS"
  echo "  -> the invariant pass in Phase 5 is MANDATORY for this change"
else
  echo "  none"
fi

echo
echo "== migrations and schema"
SCHEMA=$(printf '%s\n' "$CHANGED" | grep -Ei 'migration|\.sql$|schema\.prisma' || true)
if [ -n "$SCHEMA" ]; then
  printf '%s\n' "$SCHEMA" | sed 's/^/  /'
  echo "  -> a migration is not reversible by a feature flag; say in the brief how it rolls back"
else
  echo "  none"
fi

if [ -n "$HUMAN_PLAN" ] && [ -f "$HUMAN_PLAN" ]; then
  FLAG_KEY=$(grep -m1 '^Flag key: ' "$HUMAN_PLAN" | sed 's/^Flag key: //')
  if [ -n "$FLAG_KEY" ] && [ "$FLAG_KEY" != "none" ]; then
    echo
    echo "== feature flag"
    echo "flag key: $FLAG_KEY"
    if git diff "$MERGE_BASE"...HEAD | grep -qF "$FLAG_KEY"; then
      echo "present in diff: yes"
    else
      echo "present in diff: NO"
      echo "  -> the human plan requires a flag and the diff does not carry its key"
    fi
  fi
fi
