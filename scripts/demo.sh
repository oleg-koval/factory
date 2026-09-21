#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FALSE_DIR="$ROOT/proof/terminal-gate/false-delivery"
CASE_DIR="$ROOT/proof/case-studies/terminal-state-mismatch"

printf '%s\n' 'FACTORY: THE THREE-MINUTE DELIVERY-GATE DEMO'
printf '%s\n\n' 'One completion claim, one executable refusal, and one bug in the gate itself.'

python3 - "$FALSE_DIR/state.json" "$FALSE_DIR/ac-matrix.md" <<'PY'
import json
import sys

with open(sys.argv[1]) as handle:
    state = json.load(handle)

unanswered = sum(
    question.get("blocking") is True and not question.get("answer")
    for question in state.get("open_questions", [])
)

allowed = {"met", "unrunnable", "failed"}
invalid = 0
with open(sys.argv[2]) as handle:
    for line in handle:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) >= 4 and cells[0].startswith("AC-") and cells[3] not in allowed:
            invalid += 1

print(
    "DEMO INPUT: "
    f"terminal={state.get('terminal')} "
    f"unanswered_blocking={unanswered} "
    f"invalid_ac_statuses={invalid}"
)
PY

printf '\n%s\n' 'LIVE GATE:'
bash "$ROOT/proof/terminal-gate/run.sh"

printf '%s\n' 'THE GATE CAUGHT ITS OWN BUG:'
python3 - "$CASE_DIR/before.txt" "$CASE_DIR/after.txt" <<'PY'
import re
import sys


def receipt(path: str) -> tuple[int, str]:
    with open(path) as handle:
        lines = [line.rstrip("\n") for line in handle]

    verdict = next(
        match.group(1)
        for line in lines
        if (match := re.match(r"GATE: (PASS|BLOCKED)", line))
    )
    echo_index = lines.index("$ echo $?")
    return int(lines[echo_index + 1]), verdict


before_rc, before_verdict = receipt(sys.argv[1])
after_rc, after_verdict = receipt(sys.argv[2])
print(f"BEFORE FIX: exit={before_rc} verdict={before_verdict}")
print(f"AFTER FIX: exit={after_rc} verdict={after_verdict}")
PY

printf '\n%s\n' 'DEMO BOUNDARY: This is a redacted gate reconstruction, not the original private run,'
printf '%s\n' 'a complete Phase 0-6 delivery, or evidence of adoption, speed, or defect reduction.'
