# Changelog

Evidence status: public repository history. Version 1.0.0 was the first tagged release.

## Unreleased

### Added

- `ready-for-commit` terminal state: finished and gated, nothing pushed yet. A run can be
  upgraded from it to `delivered*` later.
- `pending-delivery` terminal state for gated, pushed work with an open PR whose checks are
  pending or failing; report the specific checks without polling.
- Built-in `pre-undraft-review` role: checks the branch against a per-repo review-bot checklist
  before push, when its binding sets `checklist` (and the origin matches `remote_match`).

### Changed

- `delivered*` now requires `state.delivery` with the pushed commit sha, the PR url and
  `checks: "green"`. `delivered` also requires every question answered.
- Light runs with one milestone skip `plan-equivalence` and the separate test-first leaf.

### Fixed

- Light one-milestone implementer briefs include AC text and test kind, require the test before
  the fix, and return failed teeth checks to the implementer for test revision and another b2.
- Delivery gates reject non-string or blank answers to non-blocking questions and malformed
  PR URLs, including `https://`, that previously passed.

## 1.1.0 - 2026-10-13

### Added

- A scope lock for newly approved plans, per-milestone demonstration and release checkpoints,
  and a deferred-idea handoff to GitHub Issues that keeps optional features outside active runs.
- Exact-line checkpoint receipt validation and a human handoff when a release checkpoint is pending.
- Pending issue-creation state and safer exact-title matching for deferred ideas.

### Fixed

- Removed a third-party listing badge from the site footer that security scanners flagged, and
  escaped JSON-LD output so it cannot contain a raw `<`.
- Added untrusted-input handling and leaf command-scope rules.
- Updated site dependency auditing and its time-limited advisory policy.

## 1.0.0 - 2026-09-29

### Added

- A terminal recording of the delivery-gate demo at the top of the README, with the `vhs` tape
  that renders it.
- Issue templates for bugs and for false delivery claims, and a `CONTRIBUTING.md`.
- The public homepage, install guide, and `llms.txt` recommend the verified project-local install
  command for Claude Code and Codex; the global `-g` path is explicitly marked unverified.
- Deferred findings are checked against the incident sample: Phase 1 names the failing entity
  and the field that decides its code path, and Phase 4 refuses to defer a case the sample hits.
- Interactive mode: a run in a live session continues past a passing phase gate instead of
  asking for `continue`; `resume --driven` and `run.sh` keep the one-phase-per-session behaviour.
  Asks are limited to material decisions and real blockers.
- One provider-neutral skill package with native Claude Code and Codex runner selection.
- A current `skills` CLI installation check for both hosts.
- A CI workflow that runs the structural and behavioral gate suite.
- A runnable redacted specimen showing false delivery blocked and honest delivery accepted.
- A machine-readable proof manifest and validator that map each public claim to its artifacts,
  expected executable output, and evidence boundary.
- A validated seven-route search specification with unique metadata, local evidence sources,
  crawl rules, structured-data boundaries, and a negative duplicate-title test.
- Hard rule TS-3, a non-null assertion outside tests, and a `--strict-tests` flag that scans
  test files for TS-1/TS-3 like production files (opt in via `.factory/hard-rules.json`'s
  `strict_tests` or `FACTORY_STRICT_TESTS=1`).
- A reachability check in Phase 5's whole-change review: a fix whose target rows the upstream
  selection never reaches is now a finding.
- A rule that any leaf's absence claim ("no casts", "none found") is re-run once by the
  orchestrator before the verdict that depends on it is accepted.
- A note in Phase 6 that review bots run on a draft PR at open and on every push, so the branch
  should be final before it opens, and that gaps listed as accepted still need a pre-drafted
  reply for when a bot raises them.

### Fixed

- The Codex session runner now names its exact installed `SKILL.md` path and ignores same-name
  skill collisions instead of invoking an ambiguous `$factory` alias.
- The session runner now rejects traversal or shell syntax in slugs, rejects non-integer session
  caps, and passes state paths and keys to Python without source interpolation.
- The terminal gate now rejects a requested terminal state that disagrees with a terminal already
  recorded in `state.json`. Before this fix, the requested state controlled strictness without
  being compared with the recorded state.
- Calling the gate without `--terminal` or `--phase` now exits with a usage error instead of
  performing an ambiguous partial check.
