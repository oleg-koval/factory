#!/usr/bin/env python3
"""Mechanical gate for a factory run.

Phase 6 may not set a terminal state until this script has run and its output has been
quoted. The rules it enforces used to live in prose, and prose gates do not fire: the
GIC-1351 run set `terminal: delivered` while five open questions were unanswered and two
acceptance criteria were marked "partly met", because nothing ever read the files.

Usage:  python3 gate.py <run-dir> (--terminal <state> | --phase <id>)

Exit 0  GATE: PASS            the run may take the terminal state it asked for
Exit 1  GATE: BLOCKED         reasons printed, one per line
Exit 2  usage or parse error
"""

from __future__ import annotations

import json
import os
import re
import sys

STATE_MAX_BYTES = 4096
STRING_MAX = 240
QUESTION_TEXT_MAX = 200

REQUIRED_KEYS = {"slug", "source", "input", "class", "depth", "phase", "bindings_file", "loops", "terminal"}
ALLOWED_KEYS = REQUIRED_KEYS | {
    "milestone",
    "isolation",
    "baseline",
    "open_questions",
    "milestones",
    "files",
    "next",
    "grill",
    "budget",
    "gaps",
}
# Keys that carried prose in earlier runs and pushed state.json to 43KB. They are not a
# matter of taste: state.json is the one file carried across every compaction, so anything
# that grows without bound belongs in a sibling file.
BANNED_KEYS = {"receipts", "blockers", "diagnosis", "notes", "log", "history"}

AC_STATUSES = {"met", "unrunnable", "failed"}
TERMINALS = {"delivered", "delivered-with-gaps", "blocked", "intentionally-unchanged", "withdrawn"}


def fail(reasons: list[str], msg: str) -> None:
    reasons.append(msg)


def check_state(run_dir: str, reasons: list[str]) -> dict:
    path = os.path.join(run_dir, "state.json")

    if not os.path.exists(path):
        fail(reasons, f"state.json missing at {path}")
        return {}

    size = os.path.getsize(path)

    if size > STATE_MAX_BYTES:
        fail(reasons, f"state.json is {size} bytes, over the {STATE_MAX_BYTES} byte cap; move prose to a sibling file")

    try:
        with open(path) as handle:
            state = json.load(handle)
    except json.JSONDecodeError as error:
        fail(reasons, f"state.json does not parse: {error}")
        return {}

    if not isinstance(state, dict):
        fail(reasons, "state.json is not an object")
        return {}

    for key in sorted(REQUIRED_KEYS - set(state)):
        fail(reasons, f"state.json is missing required key {key!r}")

    for key in sorted(set(state) & BANNED_KEYS):
        fail(reasons, f"state.json holds {key!r}, which belongs in a sibling file, not in the carried state")

    for key in sorted(set(state) - ALLOWED_KEYS - BANNED_KEYS):
        fail(reasons, f"state.json holds unknown key {key!r}")

    for key, value in state.items():
        if isinstance(value, str) and len(value) > STRING_MAX:
            fail(reasons, f"state.{key} is {len(value)} characters, over the {STRING_MAX} character cap")

    if state.get("terminal") is not None and state["terminal"] not in TERMINALS:
        fail(reasons, f"state.terminal is {state['terminal']!r}, not one of {sorted(TERMINALS)}")

    return state


def check_questions(state: dict, reasons: list[str], strict: bool) -> None:
    """Open questions must be objects. A malformed entry counts as blocking.

    The shape is the whole point. When these were plain strings the "no blocking question
    left unanswered" rule had nothing to read, so it passed on a run with two decisions
    still open.
    """
    questions = state.get("open_questions", [])

    if not isinstance(questions, list):
        fail(reasons, "state.open_questions is not a list")
        return

    for index, question in enumerate(questions):
        where = f"state.open_questions[{index}]"

        if not isinstance(question, dict):
            fail(reasons, f"{where} is not an object, so it counts as blocking and unanswered")
            continue

        for key in ("id", "text", "blocking", "owner", "answer"):
            if key not in question:
                fail(reasons, f"{where} has no {key!r} field, so it counts as blocking and unanswered")

        if not isinstance(question.get("blocking"), bool):
            fail(reasons, f"{where}.blocking is not true or false, so it counts as blocking")

        text = question.get("text")

        if isinstance(text, str) and len(text) > QUESTION_TEXT_MAX:
            fail(reasons, f"{where}.text is {len(text)} characters, over the {QUESTION_TEXT_MAX} character cap")

        if not strict:
            continue

        blocking = question.get("blocking")
        answer = question.get("answer")
        unanswered = answer is None or (isinstance(answer, str) and answer.strip() == "")

        if blocking is not False and unanswered:
            fail(reasons, f"{where} is blocking and unanswered: {str(question.get('text'))[:80]!r}")


def read_matrix(run_dir: str, reasons: list[str]) -> list[tuple[str, str]]:
    """Return (ac id, status) per body row of ac-matrix.md.

    The status column is located by its header name, not by index: runs have written the
    matrix with extra columns, and a fixed index silently read the wrong one.
    """
    path = os.path.join(run_dir, "ac-matrix.md")

    if not os.path.exists(path):
        fail(reasons, "ac-matrix.md missing")
        return []

    with open(path) as handle:
        lines = handle.read().splitlines()

    rows: list[list[str]] = []

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("|") and stripped.endswith("|"):
            rows.append([cell.strip() for cell in stripped.strip("|").split("|")])

    header_index = None
    status_column = None

    for index, cells in enumerate(rows):
        lowered = [cell.lower() for cell in cells]

        if "status" in lowered:
            header_index = index
            status_column = lowered.index("status")
            break

    if header_index is None or status_column is None:
        fail(reasons, "ac-matrix.md has no table with a 'status' column")
        return []

    results: list[tuple[str, str]] = []

    for cells in rows[header_index + 1:]:
        if len(cells) <= status_column:
            continue

        if set("".join(cells)) <= set("-: "):
            continue

        ac = cells[0]
        status = cells[status_column].strip().strip("`").lower()

        if not ac or ac.lower() == "ac":
            continue

        results.append((ac, status))

    return results


def check_matrix(run_dir: str, reasons: list[str], strict: bool) -> str:
    rows = read_matrix(run_dir, reasons)

    if not rows:
        if strict:
            fail(reasons, "ac-matrix.md has no acceptance-criterion rows")

        return "unknown"

    gaps = False

    for ac, status in rows:
        if status not in AC_STATUSES:
            fail(reasons, f"ac-matrix.md row {ac!r} has status {status!r}; allowed: met, unrunnable, failed")
            gaps = True
            continue

        if status == "failed":
            fail(reasons, f"ac-matrix.md row {ac!r} is failed")
            gaps = True

        if status == "unrunnable":
            gaps = True

    if gaps:
        return "gaps"

    return "clean"


def check_isolation(state: dict, reasons: list[str]) -> None:
    isolation = state.get("isolation")

    if not isinstance(isolation, dict):
        fail(reasons, "state.isolation missing; Phase 0b must record where this run writes")
        return

    mode = isolation.get("mode")

    if mode not in {"worktree", "in-place"}:
        fail(reasons, f"state.isolation.mode is {mode!r}, not 'worktree' or 'in-place'")

    for key in ("repo", "branch", "base"):
        if not isolation.get(key):
            fail(reasons, f"state.isolation.{key} is empty")

    if mode == "worktree":
        path = isolation.get("worktree")

        if not path or not os.path.isdir(str(path)):
            fail(reasons, f"state.isolation.worktree {path!r} is not a directory")

    if mode == "in-place":
        accepted_by = isolation.get("accepted_by")

        if not isinstance(accepted_by, str) or not accepted_by.strip():
            fail(
                reasons,
                "isolation.mode is in-place but isolation.accepted_by is empty: "
                "the user must accept sharing their working tree, in their own words",
            )


def check_budget(state: dict, reasons: list[str], wanted: str | None) -> None:
    """Budget caps hold regardless of mode, except when the run is stopping as blocked."""
    if wanted == "blocked":
        return

    budget = state.get("budget")

    if not isinstance(budget, dict):
        return

    leaves_used = budget.get("leaves_used", 0)
    leaves_max = budget.get("leaves_max", 0)
    sessions_used = budget.get("sessions_used", 0)
    sessions_max = budget.get("sessions_max", 0)

    if isinstance(leaves_used, (int, float)) and isinstance(leaves_max, (int, float)) and leaves_used > leaves_max:
        fail(reasons, f"budget.leaves_used {leaves_used} exceeds budget.leaves_max {leaves_max}")

    if (
        isinstance(sessions_used, (int, float))
        and isinstance(sessions_max, (int, float))
        and sessions_used > sessions_max
    ):
        fail(reasons, f"budget.sessions_used {sessions_used} exceeds budget.sessions_max {sessions_max}")


def artifact_path(state: dict, run_dir: str, key: str, name: str) -> str:
    files = state.get("files")

    if isinstance(files, dict) and files.get(key):
        path = str(files[key])

        if not os.path.isabs(path):
            path = os.path.join(run_dir, path)

        return path

    return os.path.join(run_dir, name)


def check_file_present(path: str, reasons: list[str]) -> bool:
    if not os.path.exists(path):
        fail(reasons, f"{path} missing")
        return False

    if os.path.getsize(path) == 0:
        fail(reasons, f"{path} is empty")
        return False

    return True


def check_phase(state: dict, run_dir: str, phase: str, reasons: list[str]) -> None:
    if phase == "0":
        path = artifact_path(state, run_dir, "intake", "intake.md")
        check_file_present(path, reasons)

        for key in ("class", "depth"):
            value = state.get(key)

            if not isinstance(value, str) or not value.strip():
                fail(reasons, f"state.{key} is not a non-empty string")

    elif phase == "0b":
        check_isolation(state, reasons)
        baseline = state.get("baseline")

        if not isinstance(baseline, dict) or not str(baseline.get("sha") or "").strip():
            fail(reasons, "state.baseline.sha is empty")

    elif phase == "1":
        if state.get("depth") == "light":
            return

        path = artifact_path(state, run_dir, "diagnosis", "diagnosis.md")
        check_file_present(path, reasons)

    elif phase == "2":
        path = artifact_path(state, run_dir, "human_plan", "human-plan.md")

        if check_file_present(path, reasons):
            with open(path) as handle:
                text = handle.read()

            if not re.search(r"^Flag key: ", text, re.MULTILINE):
                fail(reasons, f"{path} has no line matching '^Flag key: '")

        check_questions(state, reasons, strict=False)

    elif phase == "2b":
        questions = state.get("open_questions", [])

        if isinstance(questions, list):
            for index, question in enumerate(questions):
                if not isinstance(question, dict):
                    continue

                if question.get("blocking") is True:
                    answer = question.get("answer")

                    if answer is None or (isinstance(answer, str) and not answer.strip()):
                        fail(
                            reasons,
                            f"state.open_questions[{index}] is blocking with no answer: "
                            f"{str(question.get('text'))[:80]!r}",
                        )

        grill = state.get("grill")

        if isinstance(grill, dict):
            rounds = grill.get("rounds", 0)
            rounds_max = grill.get("rounds_max", 0)

            if isinstance(rounds, (int, float)) and isinstance(rounds_max, (int, float)) and rounds > rounds_max:
                fail(reasons, f"state.grill.rounds {rounds} exceeds state.grill.rounds_max {rounds_max}")

    elif phase == "3":
        path = artifact_path(state, run_dir, "agent_plan", "agent-plan.md")

        if check_file_present(path, reasons):
            with open(path) as handle:
                text = handle.read()

            if "## Invariants" not in text:
                fail(reasons, f"{path} has no '## Invariants' section")

            if not re.search(r"^M1:", text, re.MULTILINE):
                fail(reasons, f"{path} has no line matching '^M1:'")
            else:
                m1_match = re.search(r"^M1:", text, re.MULTILINE)
                after = text[m1_match.end():]
                m2_match = re.search(r"^M2:", after, re.MULTILINE)
                block = after[: m2_match.start()] if m2_match else after

                if not re.search(r"^\s*tracer:", block, re.MULTILINE):
                    fail(reasons, f"{path} has no 'tracer:' line inside the M1 block")

    elif phase == "4":
        milestones = state.get("milestones")

        if not isinstance(milestones, list):
            fail(reasons, "state.milestones is not a list")
            return

        if state.get("next") == "5":
            for milestone in milestones:
                if not isinstance(milestone, dict) or milestone.get("status") != "done" or not milestone.get("sha"):
                    fail(reasons, f"milestone {milestone!r} is not done with a sha")
        else:
            current = state.get("milestone")
            match = None

            for milestone in milestones:
                if isinstance(milestone, dict) and milestone.get("id") == current:
                    match = milestone
                    break

            if match is None:
                fail(reasons, f"state.milestone {current!r} not found in state.milestones")
            elif match.get("status") != "done" or not match.get("sha"):
                fail(reasons, f"milestone {match!r} is not done with a sha")

    elif phase == "5":
        scan_path = artifact_path(state, run_dir, "change_scan", "change-scan.txt")
        check_file_present(scan_path, reasons)
        matrix_rows = read_matrix(run_dir, reasons)

        if matrix_rows and not any(status in AC_STATUSES for _, status in matrix_rows):
            fail(reasons, "ac-matrix.md has no data row with a status in AC_STATUSES")

    elif phase == "6":
        wanted = state.get("terminal")

        if not wanted:
            fail(reasons, "state.terminal is null; Phase 6 must set a terminal state")
            return

        run_terminal_checks(state, run_dir, wanted, reasons)

    else:
        fail(reasons, f"unknown phase {phase!r}")


def check_receipts(run_dir: str, reasons: list[str]) -> None:
    path = os.path.join(run_dir, "receipts.md")

    if not os.path.exists(path) or os.path.getsize(path) == 0:
        fail(reasons, "receipts.md missing or empty; receipts live there, not in state.json")


def run_terminal_checks(state: dict, run_dir: str, wanted: str, reasons: list[str]) -> str:
    recorded = state.get("terminal")

    if wanted not in TERMINALS:
        fail(reasons, f"requested terminal {wanted!r} is not one of {sorted(TERMINALS)}")

    if recorded is not None and recorded != wanted:
        fail(reasons, f"state.terminal {recorded!r} does not match requested terminal {wanted!r}")

    strict = wanted in {"delivered", "delivered-with-gaps"}
    check_questions(state, reasons, strict)
    check_isolation(state, reasons)

    matrix = "unknown"

    if strict:
        matrix = check_matrix(run_dir, reasons, strict)
        check_receipts(run_dir, reasons)

    if wanted == "delivered" and matrix != "clean":
        fail(reasons, "terminal 'delivered' needs every acceptance criterion met; use 'delivered-with-gaps' and name each gap and its owner")

    if wanted == "delivered-with-gaps":
        gaps = state.get("gaps")
        accepted_by = gaps.get("accepted_by") if isinstance(gaps, dict) else None

        if not isinstance(accepted_by, str) or not accepted_by.strip():
            fail(
                reasons,
                "delivered-with-gaps needs gaps.accepted_by: the user accepts the gaps, in their own words",
            )

    return matrix


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__.strip())
        return 2

    run_dir = argv[1]

    if not os.path.isdir(run_dir):
        print(f"GATE: BLOCKED\n  run directory {run_dir} does not exist")
        return 2

    wanted = None
    phase = None

    if "--terminal" in argv:
        index = argv.index("--terminal")

        if index + 1 < len(argv):
            wanted = argv[index + 1]

    if "--phase" in argv:
        index = argv.index("--phase")

        if index + 1 < len(argv):
            phase = argv[index + 1]

    if wanted is not None and phase is not None:
        print("GATE: BLOCKED\n  --terminal and --phase are mutually exclusive")
        return 2

    if wanted is None and phase is None:
        print("GATE: BLOCKED\n  choose exactly one mode: --terminal <state> or --phase <id>")
        return 2

    reasons: list[str] = []
    state = check_state(run_dir, reasons)
    matrix = "unknown"

    if state:
        check_budget(state, reasons, wanted)

        if phase is not None:
            check_phase(state, run_dir, phase, reasons)
        else:
            matrix = run_terminal_checks(state, run_dir, wanted, reasons)

    if reasons:
        print("GATE: BLOCKED")

        for reason in reasons:
            print(f"  {reason}")

        return 1

    label = f"phase={phase}" if phase is not None else f"terminal={wanted or 'not requested'} matrix={matrix}"
    print(f"GATE: PASS  run={os.path.basename(run_dir.rstrip('/'))} {label}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
