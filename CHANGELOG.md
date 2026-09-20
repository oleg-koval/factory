# Changelog

Evidence status: repository history. `Unreleased` describes committed local behavior that has
not been published as a public release.

## Unreleased

### Added

- One provider-neutral skill package with native Claude Code and Codex runner selection.
- A current `skills` CLI installation check for both hosts.
- A CI workflow that runs the structural and behavioral gate suite.
- A runnable redacted specimen showing false delivery blocked and honest delivery accepted.

### Fixed

- The terminal gate now rejects a requested terminal state that disagrees with a terminal already
  recorded in `state.json`. Before this fix, the requested state controlled strictness without
  being compared with the recorded state.
- Calling the gate without `--terminal` or `--phase` now exits with a usage error instead of
  performing an ambiguous partial check.
