# Changelog

Evidence status: public repository history. `Unreleased` describes behavior on the default branch
that has not been packaged as a tagged version.

## Unreleased

### Added

- One provider-neutral skill package with native Claude Code and Codex runner selection.
- A current `skills` CLI installation check for both hosts.
- A CI workflow that runs the structural and behavioral gate suite.
- A runnable redacted specimen showing false delivery blocked and honest delivery accepted.
- A machine-readable proof manifest and validator that map each public claim to its artifacts,
  expected executable output, and evidence boundary.
- A validated seven-route search specification with unique metadata, local evidence sources,
  crawl rules, structured-data boundaries, and a negative duplicate-title test.

### Fixed

- The session runner now rejects traversal or shell syntax in slugs, rejects non-integer session
  caps, and passes state paths and keys to Python without source interpolation.
- The terminal gate now rejects a requested terminal state that disagrees with a terminal already
  recorded in `state.json`. Before this fix, the requested state controlled strictness without
  being compared with the recorded state.
- Calling the gate without `--terminal` or `--phase` now exits with a usage error instead of
  performing an ambiguous partial check.
