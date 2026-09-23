#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GATE="$ROOT/scripts/gate.py"
FAIL=0

run_case() {
  local name="$1"
  local expected_rc="$2"
  local expected_verdict="$3"
  local run_dir="$ROOT/proof/terminal-gate/$name"
  local output
  local rc

  output="$(cd "$ROOT" && python3 "$GATE" "$run_dir" --terminal delivered 2>&1)"
  rc=$?

  printf '%s\n%s\n' "[$name] exit=$rc" "$output"

  if [[ "$rc" -ne "$expected_rc" ]]; then
    printf 'proof failure: %s exited %s, expected %s\n' "$name" "$rc" "$expected_rc" >&2
    FAIL=1
  fi

  if [[ "$output" != *"$expected_verdict"* ]]; then
    printf 'proof failure: %s omitted %s\n' "$name" "$expected_verdict" >&2
    FAIL=1
  fi
}

run_case false-delivery 1 "GATE: BLOCKED"
printf '\n'
run_case honest-delivery 0 "GATE: PASS"
printf '\n'
run_case mismatched-terminal 1 "does not match requested terminal"

exit "$FAIL"
