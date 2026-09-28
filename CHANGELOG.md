# Changelog

Evidence status: public repository history. `Unreleased` describes behavior on the default branch
that has not been packaged as a tagged version.

## Unreleased

### Added

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
