"""Persistent approval checkpoints for the single-worker dispatcher."""

import hashlib
import json
import os
import subprocess
import tempfile
from pathlib import Path


def command(*args, env=None):
    return subprocess.check_output(args, env=env, timeout=60).decode().strip()


def git(path, *args, env=None):
    return command("git", "-C", str(path), *args, env=env)


def snapshot(path):
    head = git(path, "rev-parse", "HEAD")
    with tempfile.TemporaryDirectory() as directory:
        env = {**os.environ, "GIT_INDEX_FILE": str(Path(directory) / "index")}
        git(path, "read-tree", head, env=env)
        git(path, "add", "--all", "--", ".", env=env)
        tree = git(path, "write-tree", env=env)
    if tree == git(path, "rev-parse", "HEAD^{tree}"):
        raise ValueError("approval worktree has no changes")
    patch = subprocess.check_output(
        ["git", "-C", str(path), "diff", "--binary", "--no-ext-diff", "--no-textconv",
         "--no-renames", head, tree, "--"], timeout=60,
    )
    digest = hashlib.sha256(head.encode() + b"\0" + patch).hexdigest()
    return head, tree, patch, digest


def checkpoint_path(args):
    return args.scheduler_dir / "approval.json"


def save(path, record):
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(record) + "\n")
    temp.replace(path)


def base_ref(path, repo):
    remote = f"git@github.com:{repo}.git"
    lines = git(path, "ls-remote", "--symref", remote, "HEAD").splitlines()
    if len(lines) != 2 or not lines[0].startswith("ref: refs/heads/"):
        raise ValueError("default branch unavailable")
    return lines[0].split("\t")[0].removeprefix("ref: refs/heads/"), lines[1].split("\t")[0]


def prepare(args, issue, path):
    path = Path(path)
    if not path.is_absolute() or Path(git(path, "rev-parse", "--show-toplevel")) != path.resolve():
        raise ValueError("approval requires an absolute worktree root")
    remote = git(path, "remote", "get-url", "origin").lower()
    repo = args.repo.lower()
    if remote.removesuffix(".git") not in {f"git@github.com:{repo}", f"https://github.com/{repo}"}:
        raise ValueError("approval worktree origin does not match the scheduler repository")
    head, _, patch, digest = snapshot(path)
    base, remote_head = base_ref(path, args.repo)
    if remote_head != head:
        raise ValueError("worktree base does not match the remote default branch")
    (args.scheduler_dir / "approval.patch").write_bytes(patch)
    save(checkpoint_path(args), dict(repo=args.repo, issue=issue, worktree=str(path.resolve()),
                                    head=head, base=base, digest=digest))
    return digest


def publish(args, issue, record):
    path = record["worktree"]
    head, tree, patch, digest = snapshot(path)
    if (args.resume_approval != record["digest"] or digest != record["digest"]
            or head != record["head"] or patch != (args.scheduler_dir / "approval.patch").read_bytes()):
        raise ValueError("approval no longer matches the worktree; review a refreshed checkpoint")

    branch = f"factory/issue-{issue}"
    remote = f"git@github.com:{args.repo}.git"
    commit = record.get("commit")
    if commit is None:
        if base_ref(path, args.repo) != (record["base"], head):
            raise ValueError("remote base changed; review a refreshed checkpoint")
        if git(path, "ls-remote", "--refs", remote, f"refs/heads/{branch}"):
            raise ValueError("approval branch already exists remotely")
        commit = git(path, "commit-tree", tree, "-p", head, "-m", f"feat: address Factory issue #{issue}")
        record["commit"] = commit
        save(checkpoint_path(args), record)
    if git(path, "show", "-s", "--format=%T %P", commit) != f"{tree} {head}":
        raise ValueError("saved publication commit does not match the approved snapshot")
    git(path, "push", remote, f"{commit}:refs/heads/{branch}")

    prs = json.loads(command("gh", "pr", "list", "-R", args.repo, "--state", "all",
                             "--head", branch, "--limit", "2", "--json",
                             "number,state,isDraft,headRefOid,isCrossRepository,baseRefName"))
    if len(prs) > 1 or any(pr["state"] != "OPEN" or not pr["isDraft"] or pr["isCrossRepository"]
                          or pr["headRefOid"] != commit or pr["baseRefName"] != record["base"] for pr in prs):
        raise ValueError("existing PR does not match the approved draft")
    if prs:
        number = prs[0]["number"]
    else:
        url = command("gh", "pr", "create", "-R", args.repo, "--draft", "--head", branch, "--base", record["base"],
                      "--title", f"Factory handoff for issue #{issue}",
                      "--body", f"Approved Factory handoff for #{issue}.")
        number = int(url.rsplit("/", 1)[1])
    (args.scheduler_dir / "handoff.json").write_text(json.dumps(number))
    command("gh", "pr", "edit", str(number), "-R", args.repo, "--add-label", "factory-review-ready")
    command("gh", "issue", "edit", str(issue), "-R", args.repo, "--remove-label", "factory-eligible")
