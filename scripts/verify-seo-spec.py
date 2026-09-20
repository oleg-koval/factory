#!/usr/bin/env python3
"""Validate Factory's route and metadata contract before site implementation."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SPEC = ROOT / "docs" / "seo-routes.json"
ALLOWED_SCHEMAS = {
    "CollectionPage",
    "ItemList",
    "Person",
    "ProfilePage",
    "SoftwareSourceCode",
    "TechArticle",
    "WebPage",
    "WebSite",
}


def main() -> int:
    if len(sys.argv) > 2:
        print("usage: verify-seo-spec.py [seo-routes.json]", file=sys.stderr)
        return 2

    spec_path = Path(sys.argv[1]) if len(sys.argv) == 2 else DEFAULT_SPEC
    failures: list[str] = []

    try:
        spec = json.loads(spec_path.read_text())
    except (OSError, json.JSONDecodeError) as error:
        print(f"SEO SPEC: BLOCKED\n  spec unreadable: {error}")
        return 1

    if spec.get("version") != 1:
        failures.append("version must be 1")

    base_url = spec.get("base_url")
    parsed = urlparse(base_url) if isinstance(base_url, str) else None

    if not parsed or parsed.scheme != "https" or not parsed.netloc or parsed.path:
        failures.append("base_url must be an origin-only HTTPS URL")

    routes = spec.get("routes")

    if not isinstance(routes, list) or not routes:
        failures.append("routes must be a non-empty list")
        routes = []

    seen_paths: set[str] = set()
    seen_titles: set[str] = set()
    evidence_links = 0

    for index, route in enumerate(routes):
        where = f"routes[{index}]"

        if not isinstance(route, dict):
            failures.append(f"{where} must be an object")
            continue

        route_path = route.get("path")
        title = route.get("title")
        description = route.get("description")

        if not isinstance(route_path, str) or not route_path.startswith("/") or not route_path.endswith("/"):
            failures.append(f"{where}.path must start and end with /")
        elif "//" in route_path or ".." in Path(route_path).parts:
            failures.append(f"{where}.path is unsafe: {route_path!r}")
        elif route_path in seen_paths:
            failures.append(f"duplicate path {route_path!r}")
        else:
            seen_paths.add(route_path)

        if not isinstance(title, str) or not 25 <= len(title) <= 65:
            failures.append(f"{where}.title must be 25-65 characters")
        elif title in seen_titles:
            failures.append(f"duplicate title {title!r}")
        else:
            seen_titles.add(title)

        if not isinstance(description, str) or not 90 <= len(description) <= 170:
            failures.append(f"{where}.description must be 90-170 characters")

        if any("[TK" in value for value in (title, description) if isinstance(value, str)):
            failures.append(f"{where} metadata contains an unresolved [TK]")

        if not isinstance(route.get("intent"), str) or not route["intent"].strip():
            failures.append(f"{where}.intent must be a non-empty string")

        schemas = route.get("schemas")

        if not isinstance(schemas, list) or not schemas:
            failures.append(f"{where}.schemas must be a non-empty list")
        else:
            unknown = [schema for schema in schemas if schema not in ALLOWED_SCHEMAS]

            if unknown:
                failures.append(f"{where}.schemas contains unsupported values: {unknown}")

        evidence = route.get("evidence")

        if not isinstance(evidence, list) or not evidence:
            failures.append(f"{where}.evidence must be a non-empty list")
            evidence = []

        for relative in evidence:
            evidence_links += 1

            if not isinstance(relative, str):
                failures.append(f"{where}.evidence contains a non-string path")
                continue

            path = Path(relative)

            if path.is_absolute() or ".." in path.parts:
                failures.append(f"{where}.evidence contains unsafe path {relative!r}")
                continue

            resolved = ROOT / path

            if not resolved.is_file() or resolved.stat().st_size == 0:
                failures.append(f"evidence missing or empty: {relative}")

    if failures:
        print("SEO SPEC: BLOCKED")

        for failure in failures:
            print(f"  {failure}")

        return 1

    print(f"SEO SPEC: PASS routes={len(routes)} evidence_links={evidence_links}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
