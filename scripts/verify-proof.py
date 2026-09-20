#!/usr/bin/env python3
"""Verify Factory's public proof manifest without executing manifest-supplied commands."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MANIFEST = ROOT / "proof" / "manifest.json"
RUNNER = ROOT / "proof" / "terminal-gate" / "run.sh"
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def main() -> int:
    if len(sys.argv) > 2:
        print("usage: verify-proof.py [manifest.json]", file=sys.stderr)
        return 2

    manifest_path = Path(sys.argv[1]) if len(sys.argv) == 2 else DEFAULT_MANIFEST
    failures: list[str] = []

    try:
        manifest = json.loads(manifest_path.read_text())
    except (OSError, json.JSONDecodeError) as error:
        print(f"PROOF: BLOCKED\n  manifest unreadable: {error}")
        return 1

    if manifest.get("version") != 1:
        failures.append("manifest.version must be 1")

    claims = manifest.get("claims")

    if not isinstance(claims, list) or not claims:
        failures.append("manifest.claims must be a non-empty list")
        claims = []

    seen: set[str] = set()
    artifact_count = 0

    for index, claim in enumerate(claims):
        where = f"claims[{index}]"

        if not isinstance(claim, dict):
            failures.append(f"{where} must be an object")
            continue

        claim_id = claim.get("id")

        if not isinstance(claim_id, str) or not claim_id:
            failures.append(f"{where}.id must be a non-empty string")
        elif claim_id in seen:
            failures.append(f"duplicate claim id {claim_id!r}")
        else:
            seen.add(claim_id)

        if claim.get("status") != "verified-local":
            failures.append(f"{where}.status must be 'verified-local'")

        for key in ("statement", "limit"):
            if not isinstance(claim.get(key), str) or not claim[key].strip():
                failures.append(f"{where}.{key} must be a non-empty string")

        artifacts = claim.get("artifacts")

        if not isinstance(artifacts, list) or not artifacts:
            failures.append(f"{where}.artifacts must be a non-empty list")
            artifacts = []

        for relative in artifacts:
            artifact_count += 1

            if not isinstance(relative, str):
                failures.append(f"{where}.artifacts contains a non-string path")
                continue

            path = Path(relative)

            if path.is_absolute() or ".." in path.parts:
                failures.append(f"{where}.artifacts contains unsafe path {relative!r}")
                continue

            resolved = ROOT / path

            if not resolved.is_file() or resolved.stat().st_size == 0:
                failures.append(f"artifact missing or empty: {relative}")

        required_output = claim.get("required_output")

        if not isinstance(required_output, list) or not required_output or not all(
            isinstance(value, str) and value for value in required_output
        ):
            failures.append(f"{where}.required_output must contain non-empty strings")

        commits = claim.get("commits", {})

        if not isinstance(commits, dict):
            failures.append(f"{where}.commits must be an object when present")
        else:
            for label, sha in commits.items():
                if not isinstance(label, str) or not isinstance(sha, str) or not SHA_RE.fullmatch(sha):
                    failures.append(f"{where}.commits has invalid {label!r}: {sha!r}")

    boundaries = manifest.get("boundaries")

    if not isinstance(boundaries, list) or not boundaries or not all(
        isinstance(value, str) and value for value in boundaries
    ):
        failures.append("manifest.boundaries must contain non-empty strings")

    runner = subprocess.run(["bash", str(RUNNER)], cwd=ROOT, capture_output=True, text=True)
    runner_output = runner.stdout + runner.stderr

    if runner.returncode != 0:
        failures.append(f"proof runner exited {runner.returncode}")

    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            continue

        for expected in claim.get("required_output", []):
            if isinstance(expected, str) and expected not in runner_output:
                failures.append(f"claims[{index}] required output missing: {expected!r}")

    if failures:
        print("PROOF: BLOCKED")

        for failure in failures:
            print(f"  {failure}")

        return 1

    print(f"PROOF: PASS claims={len(claims)} artifacts={artifact_count} executable_cases=3")
    return 0


if __name__ == "__main__":
    sys.exit(main())
