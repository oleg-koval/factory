#!/usr/bin/env python3
"""Read one Factory run without polling or changing it."""
import argparse
import datetime as dt
import json
import os
import re
import stat
from pathlib import Path

FRESH_SECONDS = 900
CI_FRESH_SECONDS = 86400
STATE_MAX_BYTES = 65536
PROGRESS_MAX_BYTES = 1048576
MATRIX_MAX_BYTES = 2097152
EXECUTION_STATES = ("running", "waiting", "idle", "blocked", "complete")
CI_STATES = ("green", "pending", "failing", "failed")


def parse_time(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo and parsed.utcoffset() is not None else None


def known(value):
    return value if value is not None and value != "" else "unknown"


def read_text(path, max_bytes):
    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_NONBLOCK", 0)
    try:
        descriptor = os.open(path, flags)
    except OSError:
        return "unavailable", None
    try:
        if not stat.S_ISREG(os.fstat(descriptor).st_mode):
            return "unavailable", None
        with os.fdopen(descriptor, "rb") as source:
            descriptor = -1
            contents = source.read(max_bytes + 1)
        if len(contents) > max_bytes:
            return "unavailable", None
        return "available", contents.decode("utf-8")
    except UnicodeDecodeError:
        return "corrupt", None
    except OSError:
        return "unavailable", None
    finally:
        if descriptor >= 0:
            os.close(descriptor)


def read_state(path):
    file_status, contents = read_text(path, STATE_MAX_BYTES)
    if file_status != "available":
        return file_status, {}
    try:
        state = json.loads(contents)
    except json.JSONDecodeError:
        return "corrupt", {}
    return ("available", state) if isinstance(state, dict) else ("corrupt", {})


def read_progress(path):
    file_status, contents = read_text(path, PROGRESS_MAX_BYTES)
    if file_status != "available":
        return file_status, {}
    lines = contents.splitlines()
    if not lines:
        return "unavailable", {}
    latest = None
    for line in lines:
        if not line.strip():
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            return "corrupt", {}
        if not isinstance(item, dict) or parse_time(item.get("at")) is None:
            return "corrupt", {}
        latest = item
    if latest is None:
        return "unavailable", {}
    return "available", latest


def read_acceptance(run_dir, state):
    files = state.get("files", {})
    if not isinstance(files, dict):
        return "invalid-path", ()
    relative = files.get("ac_matrix", "ac-matrix.md")
    if not isinstance(relative, str) or not relative:
        return "invalid-path", ()
    path = Path(relative)
    root = run_dir.resolve()
    try:
        target = (root / path).resolve()
    except (OSError, ValueError):
        return "invalid-path", ()
    if path.is_absolute() or ".." in path.parts or not target.is_relative_to(root):
        return "invalid-path", ()
    file_status, contents = read_text(target, MATRIX_MAX_BYTES)
    if file_status != "available":
        return file_status, ()
    rows = []
    ac_index = None
    status_index = None
    for line in contents.splitlines():
        if not line.startswith("|"):
            continue
        cells = tuple(cell.strip().strip("`").strip()
                      for cell in line.strip("|").split("|"))
        lowered = tuple(cell.lower() for cell in cells)
        if "ac" in lowered and "status" in lowered:
            ac_index = lowered.index("ac")
            status_index = lowered.index("status")
            continue
        if status_index is None or len(cells) <= ac_index:
            continue
        if not re.fullmatch(r"AC-\d+", cells[ac_index], re.IGNORECASE):
            continue
        if len(cells) <= status_index:
            return "corrupt", ()
        normalized_status = cells[status_index].strip("`").strip().lower()
        if normalized_status not in ("met", "unrunnable", "failed"):
            return "corrupt", ()
        rows.append((cells[ac_index], normalized_status))
    return ("available", tuple(rows)) if rows else ("unavailable", ())


def execution_observation(event):
    evidence = event.get("execution_evidence")
    if not isinstance(evidence, dict):
        return None
    source = evidence.get("source")
    observed_state = evidence.get("observed_state")
    observed_at = parse_time(evidence.get("observed_at"))
    if source not in ("process", "terminal-session", "runtime-status"):
        return None
    return observed_at if observed_state == event.get("execution") else None


def ci_result(event, remote_sha, remote_sha_at, now):
    ci = event.get("ci")
    if not isinstance(ci, dict):
        return {"status": "unknown", "observed_at": "unknown", "sha": "unknown", "freshness": "missing"}
    observed_at = parse_time(ci.get("at"))
    ci_sha = ci.get("sha")
    status = ci.get("status")
    if observed_at is None or not isinstance(ci_sha, str) or status not in CI_STATES:
        freshness = "invalid"
    elif remote_sha_at is None:
        freshness = "missing-remote-timestamp"
    elif not isinstance(remote_sha, str) or remote_sha in ("", "unknown"):
        freshness = "missing-sha"
    elif ci_sha != remote_sha:
        freshness = "sha-mismatch"
    else:
        age = (now - observed_at).total_seconds()
        remote_age = (now - remote_sha_at).total_seconds()
        freshness = (
            "stale-remote-sha" if not 0 <= remote_age <= CI_FRESH_SECONDS
            else "before-remote-sha" if observed_at < remote_sha_at
            else "fresh" if 0 <= age <= CI_FRESH_SECONDS else "stale"
        )
    return {
        "status": status if freshness == "fresh" else "unknown",
        "observed_at": known(ci.get("at")),
        "sha": known(ci_sha),
        "freshness": freshness,
    }


def roadmap_acceptance(event):
    items = event.get("roadmap_acceptance_criteria")
    if not isinstance(items, list) or not items:
        return "unknown", []
    if any(not isinstance(item, dict) or not isinstance(item.get("id"), str) or not item.get("id")
           or item.get("status") not in ("met", "pending", "unrunnable", "failed") for item in items):
        return "corrupt", []
    pending = [item["id"] for item in items if item["status"] != "met"]
    complete = event.get("roadmap_acceptance_complete")
    return ("available" if complete is True else "partial"), pending


def status(run_dir, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    state_status, state = read_state(run_dir / "state.json")
    progress_status, event = read_progress(run_dir / "progress.jsonl")
    at = parse_time(event.get("at"))
    event_age = (now - at).total_seconds() if at else None
    age = int(event_age) if event_age is not None and event_age >= 0 else None
    fresh = event_age is not None and 0 <= event_age <= FRESH_SECONDS
    observed_at = execution_observation(event)
    observed_age = (now - observed_at).total_seconds() if observed_at else None
    execution_fresh = observed_age is not None and 0 <= observed_age <= FRESH_SECONDS
    execution = event.get("execution", "unknown")
    if execution not in EXECUTION_STATES or not fresh or (execution == "running" and not execution_fresh):
        execution = "unknown"

    acceptance_status, acs = (
        read_acceptance(run_dir, state) if state_status == "available" else (state_status, ())
    )
    remaining = [ac for ac, result in acs if result != "met"]
    terminal = state.get("terminal") or "unknown"
    delivery = state.get("delivery")
    delivery = delivery if isinstance(delivery, dict) else {}
    remote_sha = event.get("remote_sha")
    remote_sha_valid = isinstance(remote_sha, str) and bool(re.fullmatch(r"[0-9a-fA-F]{7,64}", remote_sha))
    remote_sha_at = parse_time(event.get("remote_sha_at"))
    ci = ci_result(event, remote_sha if remote_sha_valid else None, remote_sha_at, now)
    roadmap_status, pending_roadmap = roadmap_acceptance(event)
    if not fresh or acceptance_status != "available" or roadmap_status == "unknown":
        roadmap_complete = "unknown"
    elif remaining or pending_roadmap:
        roadmap_complete = "incomplete"
    elif roadmap_status == "available" and terminal == "delivered":
        roadmap_complete = "complete"
    else:
        roadmap_complete = "unknown"
    assignment = event.get("assignment")
    assignment = assignment if isinstance(assignment, dict) else {}
    event_value = lambda value: known(value) if fresh else "unknown"
    remote_sha_freshness = (
        "unknown" if not remote_sha_valid or remote_sha_at is None
        else "fresh" if 0 <= (now - remote_sha_at).total_seconds() <= CI_FRESH_SECONDS else "stale"
    )
    return {
        "slug": state.get("slug", run_dir.name),
        "state_status": state_status,
        "scope": event_value(event.get("scope")),
        "active_slice": event_value(event.get("active_slice")),
        "phase": known(state.get("phase")),
        "execution": execution,
        "assignment": {"owner": event_value(assignment.get("owner")),
                       "model": event_value(assignment.get("model"))},
        "progress_status": progress_status,
        "updated_at": event.get("at", "unknown"),
        "age_seconds": age if age is not None else "unknown",
        "evidence_fresh": fresh if at else "unknown",
        "execution_evidence_source": event_value(event.get("execution_evidence", {}).get("source"))
        if isinstance(event.get("execution_evidence"), dict) else "unknown",
        "execution_observed_at": known(event.get("execution_evidence", {}).get("observed_at"))
        if isinstance(event.get("execution_evidence"), dict) else "unknown",
        "execution_evidence_fresh": execution_fresh if observed_at else "unknown",
        "completed_prs": event_value(event.get("completed_prs")),
        "blockers": event_value(event.get("blockers")),
        "next_action": event_value(event.get("next_action")),
        "next_owner": event_value(event.get("next_owner")),
        "acceptance_status": acceptance_status,
        "remaining_acceptance_criteria": remaining if acceptance_status == "available" else "unknown",
        "pending_roadmap_acceptance_criteria": (
            pending_roadmap if fresh and roadmap_status in ("available", "partial") else "unknown"
        ),
        "roadmap_acceptance_status": roadmap_status if fresh else "unknown",
        "local_proof": event_value(event.get("local_proof")),
        "commit": event_value(event.get("commit", delivery.get("commit"))),
        "remote_sha": event_value(remote_sha),
        "remote_sha_observed_at": known(event.get("remote_sha_at")),
        "remote_sha_freshness": remote_sha_freshness if fresh else "unknown",
        "ci": ci["status"] if fresh else "unknown",
        "ci_observed_at": known(ci["observed_at"]),
        "ci_sha": event_value(ci["sha"]),
        "ci_freshness": ci["freshness"] if fresh else "unknown",
        "deployment": event_value(event.get("deployment")),
        "live_acceptance": event_value(event.get("live_acceptance")),
        "slice_terminal": terminal,
        "roadmap_complete": roadmap_complete,
    }


def render_text(result):
    return "".join(f"{key.replace('_', ' ')}: {json.dumps(value, ensure_ascii=False)}\n"
                   for key, value in result.items())


def render_json(result):
    return json.dumps(result, indent=2, sort_keys=True)


def main():
    parser = argparse.ArgumentParser(description="Read progress for one Factory run.")
    parser.add_argument("slug")
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9][a-z0-9._-]{0,79}", args.slug) or ".." in args.slug:
        parser.error("invalid slug")
    try:
        result = status(Path(".factory") / args.slug)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))
    print(render_json(result) if args.as_json else render_text(result), end="\n" if args.as_json else "")


if __name__ == "__main__":
    main()
