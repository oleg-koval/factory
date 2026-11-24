"""Durable GitHub issue reservations used under the single scheduler lock."""

import os
import re
import subprocess
import uuid

from live_delivery import read_gh


PREFIX = "refs/heads/factory/claims/"
WORK_BRANCH = re.compile(r"factory/issue-([1-9][0-9]*)")
SHA = re.compile(r"[0-9a-f]{40}")


def git(path, *args):
    try:
        result = subprocess.run(
            ["git", "-C", str(path), *args], capture_output=True, text=True, timeout=30,
            check=True, env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
        )
        return result.stdout.strip()
    except (OSError, subprocess.SubprocessError) as error:
        raise ValueError(f"git {args[0]} failed or did not finish") from error


def reservations(path, remote):
    refs = {}
    for line in git(path, "ls-remote", "--refs", remote, PREFIX + "*").splitlines():
        head, ref = line.split("\t")
        issue = ref.removeprefix(PREFIX)
        if not ref.startswith(PREFIX) or not re.fullmatch(r"[1-9][0-9]*", issue) or not SHA.fullmatch(head):
            raise ValueError("remote reservation has an unexpected ref or SHA")
        refs[int(issue)] = head
    return refs


def claim(path, remote, issue):
    # Independent commits guarantee that two attempts can never both fast-forward the same ref.
    tree = git(path, "rev-parse", "HEAD^{tree}")
    head = git(path, "commit-tree", tree, "-m", f"Factory issue {issue} reservation {uuid.uuid4()}")
    ref = f"{PREFIX}{issue}"
    result = git(path, "push", "--porcelain", remote, f"{head}:{ref}")
    if not any(line.startswith("*\t") and f":{ref}\t" in line for line in result.splitlines()):
        raise ValueError(f"Git did not report creating the reservation for issue {issue}")
    return head


def release(path, remote, issue, head):
    # The dispatcher is the sole ref deleter and holds the scheduler lock throughout.
    if reservations(path, remote).get(issue) != head:
        raise ValueError(f"reservation changed for issue {issue}")
    git(path, "push", remote, f":{PREFIX}{issue}")


def review_issues(repo, label):
    pages = read_gh(f"repos/{repo}/pulls?state=open&per_page=100", "--paginate", "--slurp")
    if not isinstance(pages, list) or not pages or any(not isinstance(page, list) for page in pages):
        raise ValueError("incomplete review queue")
    seen = set()
    issues = set()
    for page in pages:
        for pr in page:
            if pr["number"] in seen or pr["state"] != "open":
                raise ValueError("review queue changed during pagination")
            seen.add(pr["number"])
            if label not in {entry["name"] for entry in pr["labels"]}:
                continue
            head = pr["head"]
            branch = WORK_BRANCH.fullmatch(head["ref"])
            origin = head["repo"]["full_name"]
            if not branch or not isinstance(origin, str) or origin.lower() != repo.lower():
                raise ValueError("review-ready PR lacks a same-repository factory/issue-N branch")
            issues.add(int(branch[1]))
    return issues


def admission(eligible, reserved, review, cap):
    occupied = set(reserved) | review
    if len(occupied) >= cap:
        return "review-capacity", None
    return ("admit", min(eligible - occupied)) if eligible - occupied else ("no-eligible-issue", None)
