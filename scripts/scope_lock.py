#!/usr/bin/env python3
"""Seal and verify the two approved Factory plans for contract version 2 runs."""

from __future__ import annotations

import hashlib
import json
import os
import sys

PLAN_FILES = ("human-plan.md", "agent-plan.md")
LOCK_FILE = "scope-lock.json"


def digest(path: str) -> str:
    """Return the SHA-256 hex digest of a file, propagating read errors."""
    with open(path, "rb") as handle:
        return hashlib.sha256(handle.read()).hexdigest()


def verify(run_dir: str) -> list[str]:
    """Return scope-lock validation failures, or an empty list if both plans match."""
    path = os.path.join(run_dir, LOCK_FILE)
    try:
        with open(path, encoding="utf-8") as handle:
            lock = json.load(handle)
    except (OSError, ValueError) as error:
        return [f"scope lock unavailable: {error}"]

    if not isinstance(lock, dict) or lock.get("version") != 1:
        return ["scope lock has an unsupported shape or version"]

    reasons = []
    for name in PLAN_FILES:
        expected = lock.get(name)
        if not isinstance(expected, str) or len(expected) != 64:
            reasons.append(f"scope lock has no valid digest for {name}")
            continue
        try:
            actual = digest(os.path.join(run_dir, name))
        except OSError as error:
            reasons.append(f"cannot read {name}: {error}")
            continue
        if actual != expected:
            reasons.append(f"{name} changed after scope approval; defer the idea or return to Phase 2 and reseal after review")
    return reasons


def seal(run_dir: str) -> None:
    """Atomically save the current plan digests as the approved scope lock."""
    lock = {"version": 1}
    for name in PLAN_FILES:
        lock[name] = digest(os.path.join(run_dir, name))
    path = os.path.join(run_dir, LOCK_FILE)
    temporary = path + ".tmp"
    try:
        with open(temporary, "w", encoding="utf-8") as handle:
            json.dump(lock, handle, indent=2)
            handle.write("\n")
        os.replace(temporary, path)
    except OSError:
        try:
            os.remove(temporary)
        except OSError:
            pass
        raise


def main(argv: list[str]) -> int:
    """Seal or verify a run scope and return success, blocked, or usage exit status."""
    if len(argv) != 3 or argv[1] not in {"seal", "verify"}:
        print("usage: scope_lock.py seal|verify <run-dir>", file=sys.stderr)
        return 2
    try:
        if argv[1] == "seal":
            seal(argv[2])
        reasons = verify(argv[2])
    except OSError as error:
        print(f"SCOPE: BLOCKED {error}")
        return 1
    if reasons:
        for reason in reasons:
            print(f"SCOPE: BLOCKED {reason}")
        return 1
    print("SCOPE: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
