#!/usr/bin/env python3
"""Admit at most one foreground Factory worker on the configured scheduler."""

import argparse
import fcntl
import json
import os
import re
import subprocess
from pathlib import Path
from urllib.parse import urlencode

import claims
from live_delivery import read_gh

ELIGIBLE = "factory-eligible"
REVIEW_READY = "factory-review-ready"


def queue(repo, label, *, pulls):
    params = urlencode({"state": "open", "labels": label, "per_page": 100})
    pages = read_gh(f"repos/{repo}/issues?{params}", "--paginate", "--slurp")
    if not isinstance(pages, list) or not pages or any(not isinstance(page, list) for page in pages):
        raise ValueError(f"incomplete {label} queue")
    numbers = set()
    seen = set()
    for page in pages:
        for item in page:
            number = item["number"]
            if type(number) is not int or number < 1 or item["state"] != "open":
                raise ValueError(f"invalid {label} queue entry")
            if label not in {entry["name"] for entry in item["labels"]}:
                raise ValueError(f"incomplete {label} queue entry")
            if number in seen:
                raise ValueError(f"{label} queue changed during pagination")
            seen.add(number)
            if ("pull_request" in item) == pulls:
                numbers.add(number)
    return numbers


def decide(repo, cap):
    review = queue(repo, REVIEW_READY, pulls=True)
    if len(review) >= cap:
        return {"decision": "review-capacity", "awaiting_review": len(review), "cap": cap}
    eligible = queue(repo, ELIGIBLE, pulls=False)
    if not eligible:
        return {"decision": "no-eligible-issue"}
    return {"decision": "admit", "issue": min(eligible), "awaiting_review": len(review), "cap": cap}


def report(repo, result):
    print(json.dumps({"repo": repo, **result}), flush=True)


def dispatch(args, *, worker):
    try:
        result = decide(args.repo, args.review_cap)
    except (ValueError, TypeError, KeyError) as error:
        report(args.repo, {"decision": "queue-unreadable", "reason": str(error)})
        return 1
    report(args.repo, result)
    if worker is None or result["decision"] != "admit":
        return 0

    issue = result["issue"]
    # Retain a durable local recovery marker if the worker or scheduler stops mid-run.
    active = args.scheduler_dir / "active"
    with active.open("x") as handle:
        handle.write(f"{args.repo}#{issue}\n")
        handle.flush()
    url = f"https://github.com/{args.repo}/issues/{issue}"
    handoff = args.scheduler_dir / "handoff.json"
    handoff.unlink(missing_ok=True)
    env = {**os.environ, "FACTORY_HANDOFF_FILE": str(handoff)}
    completed = subprocess.run([*args.worker, url], env=env, pass_fds=(worker,))
    if completed.returncode:
        report(args.repo, {"decision": "recovery-required", "issue": issue, "exit": completed.returncode})
        return 1
    try:
        pr = json.loads(handoff.read_text())
        if pr is not None and (type(pr) is not int or pr not in queue(args.repo, REVIEW_READY, pulls=True)):
            raise ValueError("review handoff is not visible in the queue")
        if issue in queue(args.repo, ELIGIBLE, pulls=False):
            raise ValueError("issue eligibility is still visible")
    except (OSError, ValueError, KeyError, TypeError) as error:
        report(args.repo, {"decision": "recovery-required", "issue": issue, "reason": str(error)})
        return 1
    active.unlink()
    handoff.unlink()
    return 0


def dispatch_concurrent(args):
    remote = f"git@github.com:{args.repo}.git"
    try:
        reserved = claims.reservations(args.claim_repo, remote)
        if args.abandon is not None:
            head = reserved.get(args.abandon)
            if head is not None:
                claims.release(args.claim_repo, remote, args.abandon, head)
            report(args.repo, {"decision": "explicitly-abandoned" if head else "no-reservation",
                              "issue": args.abandon})
            return 0
        review = claims.review_issues(args.repo, REVIEW_READY)
        eligible = queue(args.repo, ELIGIBLE, pulls=False)
        decision, issue = claims.admission(eligible, reserved, review, args.review_cap)
    except (OSError, ValueError, KeyError, TypeError) as error:
        report(args.repo, {"decision": "queue-unreadable", "reason": str(error)})
        return 1

    report(args.repo, {"decision": decision, "issue": issue, "reservations": reserved,
                      "awaiting_review": sorted(review), "cap": args.review_cap})
    if args.dry_run:
        return 0

    for landed in sorted((set(reserved) & review) - eligible):
        claims.release(args.claim_repo, remote, landed, reserved[landed])
        report(args.repo, {"decision": "handoff-released", "issue": landed})
    if issue is None:
        return 0
    head = claims.claim(args.claim_repo, remote, issue)
    report(args.repo, {"decision": "claimed", "issue": issue, "head": head})
    url = f"https://github.com/{args.repo}/issues/{issue}"
    log = args.scheduler_dir / f"worker-{issue}-{head}.log"
    env = {**os.environ, "FACTORY_CLAIM_SHA": head, "FACTORY_WORK_BRANCH": f"factory/issue-{issue}",
           "FACTORY_HANDOFF_FILE": str(log.with_suffix(".handoff.json"))}
    with log.open("x") as handle:
        process = subprocess.Popen([*args.worker, url], env=env, stdin=subprocess.DEVNULL,
                                   stdout=handle, stderr=subprocess.STDOUT, start_new_session=True)
    report(args.repo, {"decision": "worker-started", "issue": issue, "pid": process.pid, "log": str(log)})
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--review-cap", type=int, required=True)
    parser.add_argument("--scheduler-dir", type=Path)
    parser.add_argument("--concurrent", action="store_true")
    parser.add_argument("--claim-repo", type=Path)
    parser.add_argument("--abandon", type=int, metavar="ISSUE")
    parser.add_argument("--confirm-worker-stopped", action="store_true")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--enable", action="store_true")
    mode.add_argument("--dry-run", action="store_true")
    parser.add_argument("worker", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9-]+/[A-Za-z0-9_.-]+", args.repo) or args.review_cap < 1:
        parser.error("use owner/repository and a positive review cap")
    if args.concurrent and (not args.claim_repo or not args.claim_repo.is_absolute()):
        parser.error("--concurrent requires an absolute --claim-repo Git checkout")
    if args.abandon is not None and not (
        args.concurrent and args.enable and args.confirm_worker_stopped and args.abandon > 0
    ):
        parser.error("--abandon requires --concurrent --enable --confirm-worker-stopped and a positive issue")
    if args.dry_run:
        return dispatch_concurrent(args) if args.concurrent else dispatch(args, worker=None)
    if args.worker[:1] == ["--"]:
        args.worker = args.worker[1:]
    if not args.scheduler_dir or not args.scheduler_dir.is_absolute() or (not args.worker and args.abandon is None):
        parser.error("--enable requires an absolute --scheduler-dir and a foreground worker command")

    try:
        args.scheduler_dir.mkdir(parents=True, exist_ok=True)
        with (args.scheduler_dir / "scheduler.lock").open("a") as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                report(args.repo, {"decision": "scheduler-busy"})
                return 0
            active = args.scheduler_dir / "active"
            if active.exists():
                report(args.repo, {"decision": "recovery-required", "active": active.read_text().strip()})
                return 1
            concurrent_marker = args.scheduler_dir / "concurrent"
            if not args.concurrent and concurrent_marker.exists():
                report(args.repo, {"decision": "concurrent-scheduler-required"})
                return 1
            if args.concurrent:
                concurrent_marker.touch(exist_ok=True)
                return dispatch_concurrent(args)
            return dispatch(args, worker=lock.fileno())
    except (OSError, ValueError) as error:
        report(args.repo, {"decision": "scheduler-unavailable", "reason": str(error)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
