#!/usr/bin/env python3
"""Keep optional ideas out of the active plan and link actionable ones at handoff."""

from __future__ import annotations

import json
import os
import subprocess
import sys

FILE = "deferred-ideas.json"


def read(run_dir: str) -> list[dict]:
    path = os.path.join(run_dir, FILE)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as handle:
        ideas = json.load(handle)
    if not isinstance(ideas, list):
        raise ValueError(f"{FILE} must be a list")
    return ideas


def write(run_dir: str, ideas: list[dict]) -> None:
    path = os.path.join(run_dir, FILE)
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8") as handle:
        json.dump(ideas, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    os.replace(temporary, path)


def gh(*args: str) -> str:
    result = subprocess.run(["gh", *args], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"gh exited {result.returncode}")
    return result.stdout.strip()


def add(run_dir: str, idea: str, reason: str, source: str, actionable: bool = True) -> None:
    ideas = read(run_dir)
    if any(item.get("idea", "").casefold() == idea.casefold() for item in ideas):
        print("IDEA: already recorded")
        return
    item = {"id": f"D-{len(ideas) + 1}", "idea": idea, "reason": reason, "source": source,
            "status": "pending", "actionable": actionable, "issue_url": None}
    ideas.append(item)
    write(run_dir, ideas)
    print(f"IDEA: recorded {item['id']}")


def handoff(run_dir: str, repo: str, publish: bool) -> int:
    ideas = read(run_dir)
    if not publish:
        for item in ideas:
            print(f"IDEA: {item['id']} {item['status']} {item['idea']}")
        return 0

    errors = 0
    for item in ideas:
        if item.get("actionable") is False:
            continue
        if item.get("status") == "linked":
            continue
        try:
            if item.get("issue_url"):
                url = item["issue_url"]
            else:
                matches = json.loads(gh("issue", "list", "--repo", repo, "--state", "all",
                                        "--search", f'"{item["idea"]}" in:title',
                                        "--json", "title,url", "--limit", "100"))
                duplicate = next((issue for issue in matches if issue["title"].casefold() == item["idea"].casefold()), None)
                if duplicate:
                    url = duplicate["url"]
                else:
                    body = (f"Deferred from Factory run `{os.path.basename(run_dir)}` ({item['id']}).\n\n"
                            f"Source: {item['source']}\n\nWhy deferred: {item['reason']}\n")
                    url = gh("issue", "create", "--repo", repo, "--title", item["idea"], "--body", body)
                item["issue_url"] = url
                item["status"] = "unverified"
                write(run_dir, ideas)

            observed = json.loads(gh("issue", "view", url, "--repo", repo, "--json", "title,url"))
            if observed.get("url") != url or observed.get("title", "").casefold() != item["idea"].casefold():
                raise ValueError(f"issue readback did not match {item['id']}")
            item["status"] = "linked"
            write(run_dir, ideas)
            print(f"IDEA: linked {item['id']} {url}")
        except (OSError, RuntimeError, ValueError, KeyError) as error:
            errors += 1
            print(f"IDEA: pending {item['id']} {error}", file=sys.stderr)
    return 1 if errors else 0


def main(argv: list[str]) -> int:
    try:
        if len(argv) in (6, 7) and argv[1] == "add":
            if len(argv) == 7 and argv[6] != "--exploratory":
                raise ValueError("only --exploratory is supported as an optional flag")
            add(argv[2], argv[3], argv[4], argv[5], actionable=len(argv) == 6)
            return 0
        if len(argv) in (4, 5) and argv[1] == "handoff":
            if len(argv) == 5 and argv[4] != "--publish":
                raise ValueError("only --publish is supported as an optional flag")
            return handoff(argv[2], argv[3], len(argv) == 5)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"IDEA: ERROR {error}", file=sys.stderr)
        return 1
    print("usage: deferred_ideas.py add <run-dir> <idea> <reason> <source> [--exploratory] | "
          "handoff <run-dir> <owner/repo> [--publish]", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
