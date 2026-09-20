#!/usr/bin/env bash
# run.sh drives one factory session per phase.
#
# Why: one long session pays the cache-read line on the whole run's history every turn.
# A fresh session per phase pays only for state.json plus one phase file, because state.json
# is the only thing this script carries forward between sessions.
#
# usage: run.sh <slug> [--runner auto|codex|claude] [--max N] [--dry-run] [-- <extra runner args>]

set -euo pipefail

SLUG=""
MAX=""
DRY_RUN=0
RUNNER="${FACTORY_RUNNER:-auto}"
EXTRA=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max)
      if [[ $# -lt 2 ]]; then
        echo "run.sh: --max needs a positive integer" >&2
        exit 2
      fi
      MAX="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --runner)
      if [[ $# -lt 2 ]]; then
        echo "run.sh: --runner needs auto, codex, or claude" >&2
        exit 2
      fi
      RUNNER="$2"
      shift 2
      ;;
    --)
      shift
      EXTRA=("$@")
      break
      ;;
    *)
      if [[ -z "$SLUG" ]]; then
        SLUG="$1"
        shift
      else
        echo "usage: run.sh <slug> [--runner auto|codex|claude] [--max N] [--dry-run] [-- <extra runner args>]" >&2
        exit 2
      fi
      ;;
  esac
done

if [[ -z "$SLUG" ]]; then
  echo "usage: run.sh <slug> [--runner auto|codex|claude] [--max N] [--dry-run] [-- <extra runner args>]" >&2
  exit 2
fi

if [[ ! "$SLUG" =~ ^[a-z0-9][a-z0-9._-]{0,79}$ ]] || [[ "$SLUG" == *..* ]]; then
  echo "run.sh: invalid slug; use 1-80 lowercase letters, digits, dots, underscores, or hyphens, without '..'" >&2
  exit 2
fi

if [[ -n "$MAX" && ! "$MAX" =~ ^[1-9][0-9]*$ ]]; then
  echo "run.sh: invalid --max; use a positive integer" >&2
  exit 2
fi

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR=".factory/${SLUG}"
STATE_FILE="${RUN_DIR}/state.json"

if [[ "$RUNNER" == "auto" ]]; then
  case "$SKILL_DIR" in
    */.codex/*) RUNNER="codex" ;;
    */.claude/*) RUNNER="claude" ;;
    *)
      if command -v codex >/dev/null 2>&1 && ! command -v claude >/dev/null 2>&1; then
        RUNNER="codex"
      elif command -v claude >/dev/null 2>&1 && ! command -v codex >/dev/null 2>&1; then
        RUNNER="claude"
      else
        echo "run.sh: cannot choose a provider; pass --runner codex or --runner claude" >&2
        exit 2
      fi
      ;;
  esac
fi

if [[ "$RUNNER" != "codex" && "$RUNNER" != "claude" ]]; then
  echo "run.sh: runner must be auto, codex, or claude" >&2
  exit 2
fi

if [[ ! -f "$STATE_FILE" ]]; then
  echo "run.sh: no state.json at ${STATE_FILE}" >&2
  exit 1
fi

py_get() {
  python3 - "$STATE_FILE" "$1" <<'PY'
import json, sys
path, dotted_key = sys.argv[1:3]
with open(path) as handle:
    state = json.load(handle)
value = state
for key in dotted_key.split('.'):
    if isinstance(value, dict):
        value = value.get(key)
    else:
        value = None
        break
print(value if value is not None else '')
PY
}

py_increment() {
  python3 - "$STATE_FILE" "$1" <<'PY'
import json, sys
path, dotted_key = sys.argv[1:3]
with open(path) as handle:
    state = json.load(handle)
keys = dotted_key.split('.')
target = state
for key in keys[:-1]:
    target = target[key]
value = target.get(keys[-1], 0)
if isinstance(value, bool) or not isinstance(value, int) or value < 0:
    raise SystemExit(f"{dotted_key} must be a non-negative integer")
target[keys[-1]] = value + 1
with open(path, 'w') as handle:
    json.dump(state, handle, indent=2)
    handle.write('\n')
PY
}

if [[ -z "$MAX" ]]; then
  MAX="$(py_get budget.sessions_max)"
  [[ -z "$MAX" ]] && MAX=16
fi

if [[ ! "$MAX" =~ ^[1-9][0-9]*$ ]]; then
  echo "run.sh: invalid --max or budget.sessions_max; use a positive integer" >&2
  exit 2
fi

ITER=0
STALLS=0
LAST_PHASE=""
LAST_MILESTONE=""

while true; do
  TERMINAL="$(py_get terminal)"

  if [[ -n "$TERMINAL" ]]; then
    echo "run.sh: terminal=${TERMINAL}, stopping."
    exit 0
  fi

  if [[ "$ITER" -ge "$MAX" ]]; then
    echo "run.sh: reached session cap ${MAX}, stopping."
    exit 0
  fi

  PHASE="$(py_get next)"
  [[ -z "$PHASE" ]] && PHASE="$(py_get phase)"

  HUMAN=0
  case "$PHASE" in
    2|2b|6) HUMAN=1 ;;
  esac

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "plan: phase=${PHASE} runner=${RUNNER} configured_model=default human=${HUMAN}"
    exit 0
  fi

  # Gate the phase that just closed (state.phase), never the one about to run: its
  # artifacts do not exist yet. A fresh run has no closed phase, so nothing to gate.
  PREV="$(py_get phase)"

  if [[ -n "$PREV" ]]; then
    GATE_OUT="$(python3 "${SKILL_DIR}/scripts/gate.py" "$RUN_DIR" --phase "$PREV" 2>&1)" || true
    echo "$GATE_OUT"

    if [[ "$GATE_OUT" == GATE:\ BLOCKED* ]]; then
      echo "run.sh: gate blocked on phase ${PREV}, will not start phase ${PHASE}."
      exit 1
    fi
  fi

  if [[ "$HUMAN" -eq 1 ]]; then
    if [[ "$RUNNER" == "codex" ]]; then
      echo "NEEDS-YOU: phase ${PHASE} needs you. Run Codex in this repository and say: Use \$factory to resume ${SLUG}. Quit when the phase says it is closed, then run this script again."
    else
      echo "NEEDS-YOU: phase ${PHASE} needs you. Run Claude Code in this repository and say: /factory resume ${SLUG}. Quit when the phase says it is closed, then run this script again."
    fi
    exit 0
  fi

  if [[ "$RUNNER" == "codex" ]]; then
    PROMPT="Use \$factory to resume ${SLUG}. Complete exactly one phase, run its gate, update state, and stop."
    codex exec -C "$PWD" ${EXTRA[@]+"${EXTRA[@]}"} "$PROMPT"
  else
    PROMPT="/factory resume ${SLUG}. Complete exactly one phase, run its gate, update state, and stop."
    claude -p "$PROMPT" ${EXTRA[@]+"${EXTRA[@]}"}
  fi

  py_increment budget.sessions_used

  NEW_PHASE="$(py_get phase)"
  NEW_MILESTONE="$(py_get milestone)"

  if [[ "$NEW_PHASE" == "$LAST_PHASE" && "$NEW_MILESTONE" == "$LAST_MILESTONE" ]]; then
    STALLS=$((STALLS + 1))

    if [[ "$STALLS" -ge 2 ]]; then
      python3 "${SKILL_DIR}/scripts/gate.py" "$RUN_DIR" --phase "$NEW_PHASE" || true
      echo "run.sh: two stalls in a row on phase ${NEW_PHASE}, stopping to diagnose."
      exit 1
    fi
  else
    STALLS=0
  fi

  LAST_PHASE="$NEW_PHASE"
  LAST_MILESTONE="$NEW_MILESTONE"
  ITER=$((ITER + 1))
done
