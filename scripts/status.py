#!/usr/bin/env python3
"""Read one Factory run without polling or changing it."""
import argparse
import datetime as dt
import json
import re
from pathlib import Path

FRESH_SECONDS = 900
CI_FRESH_SECONDS = 86400
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


def read_progress(path):
    try:
        lines = path.read_text().splitlines()
    except OSError:
        return "unavailable", {}
    if not lines:
        return "unavailable", {}
    events = []
    for line in lines:
        if not line.strip():
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            return "corrupt", {}
        if not isinstance(item, dict) or parse_time(item.get("at")) is None:
            return "corrupt", {}
        events.append(item)
    if not events:
        return "unavailable", {}
    event = max(events, key=lambda item: parse_time(item.get("at")))
    return "available", event


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
    try:
        lines = target.read_text().splitlines()
    except ValueError:
        return "invalid-path", ()
    except OSError:
        return "unavailable", ()
    rows = []
    for line in lines:
        if not line.startswith("|"):
            continue
        cells = tuple(cell.strip() for cell in line.strip("|").split("|"))
        if not cells or not re.fullmatch(r"AC-\d+", cells[0]):
            continue
        if len(cells) < 4 or cells[3] not in ("met", "unrunnable", "failed"):
            return "corrupt", ()
        rows.append((cells[0], cells[3]))
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
    return "available", pending


def status(run_dir, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    state = json.loads((run_dir / "state.json").read_text())
    if not isinstance(state, dict):
        raise ValueError("state.json must contain an object")
    progress_status, event = read_progress(run_dir / "progress.jsonl")
    at = parse_time(event.get("at"))
    seconds_old = int((now - at).total_seconds()) if at else None
    age = seconds_old if seconds_old is not None and seconds_old >= 0 else None
    fresh = age is not None and age <= FRESH_SECONDS
    observed_at = execution_observation(event)
    observed_age = (now - observed_at).total_seconds() if observed_at else None
    execution_fresh = observed_age is not None and 0 <= observed_age <= FRESH_SECONDS
    execution = event.get("execution", "unknown")
    if execution not in EXECUTION_STATES or not fresh or not execution_fresh:
        execution = "unknown"

    acceptance_status, acs = read_acceptance(run_dir, state)
    remaining = [ac for ac, result in acs if result != "met"]
    terminal = state.get("terminal") or "unknown"
    delivery = state.get("delivery")
    delivery = delivery if isinstance(delivery, dict) else {}
    remote_sha = event.get("remote_sha", "unknown")
    remote_sha_at = parse_time(event.get("remote_sha_at"))
    ci = ci_result(event, remote_sha, remote_sha_at, now)
    roadmap_status, pending_roadmap = roadmap_acceptance(event)
    roadmap_complete = (
        False if acceptance_status == "available" and remaining
        else False if roadmap_status == "available" and pending_roadmap
        else True if roadmap_status == "available" and not pending_roadmap
        and acceptance_status == "available" and terminal == "delivered"
        else "unknown"
    )
    assignment = event.get("assignment")
    assignment = assignment if isinstance(assignment, dict) else {}
    return {
        "slug": state.get("slug", run_dir.name),
        "scope": known(event.get("scope")),
        "active_slice": known(event.get("active_slice")),
        "phase": known(state.get("phase")),
        "execution": execution,
        "assignment": {"owner": assignment.get("owner", "unknown"),
                       "model": assignment.get("model", "unknown")},
        "progress_status": progress_status,
        "updated_at": event.get("at", "unknown"),
        "age_seconds": age if age is not None else "unknown",
        "evidence_fresh": fresh if at else "unknown",
        "execution_evidence_source": known(event.get("execution_evidence", {}).get("source"))
        if isinstance(event.get("execution_evidence"), dict) else "unknown",
        "execution_observed_at": known(event.get("execution_evidence", {}).get("observed_at"))
        if isinstance(event.get("execution_evidence"), dict) else "unknown",
        "execution_evidence_fresh": execution_fresh if observed_at else "unknown",
        "completed_prs": known(event.get("completed_prs")),
        "blockers": known(event.get("blockers")),
        "next_action": known(event.get("next_action")),
        "next_owner": known(event.get("next_owner")),
        "acceptance_status": acceptance_status,
        "remaining_acceptance_criteria": remaining if acceptance_status == "available" else "unknown",
        "pending_roadmap_acceptance_criteria": pending_roadmap if roadmap_status == "available" else "unknown",
        "roadmap_acceptance_status": roadmap_status,
        "local_proof": known(event.get("local_proof")),
        "commit": known(event.get("commit", delivery.get("commit"))),
        "remote_sha": known(remote_sha),
        "remote_sha_observed_at": known(event.get("remote_sha_at")),
        "remote_sha_freshness": (
            "fresh" if remote_sha_at and 0 <= (now - remote_sha_at).total_seconds() <= CI_FRESH_SECONDS
            else "stale" if remote_sha_at else "unknown"
        ),
        "ci": ci["status"],
        "ci_observed_at": ci["observed_at"],
        "ci_sha": ci["sha"],
        "ci_freshness": ci["freshness"],
        "deployment": known(event.get("deployment")),
        "live_acceptance": known(event.get("live_acceptance")),
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
