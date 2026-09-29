#!/usr/bin/env bash
# Trimmed views of the gate output for docs/demo.tape. Usage: demo-gif.sh false|honest|bug
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
case "${1:-}" in
  false)
    out=$(bash "$ROOT/proof/terminal-gate/run.sh" | awk '/^\[false-delivery\]/{f=1} /^$/{f=0} f')
    printf '%s\n' "$out" | grep -E '^\[false-delivery\]|^GATE: BLOCKED'
    printf '  %s blocking questions unanswered\n' "$(printf '%s\n' "$out" | grep -c 'is blocking and unanswered')"
    printf '  %s criteria marked "partly met"\n' "$(printf '%s\n' "$out" | grep -c "partly met")" ;;
  honest)
    bash "$ROOT/proof/terminal-gate/run.sh" | grep -A1 -E '^\[honest-delivery\]' | cut -c1-70 ;;
  bug)
    bash "$ROOT/scripts/demo.sh" | grep -E 'CAUGHT|FIX:' ;;
  *) echo "usage: demo-gif.sh false|honest|bug" >&2; exit 2 ;;
esac
