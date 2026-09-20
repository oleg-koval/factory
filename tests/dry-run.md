# Dry-run receipts

Date: 2026-09-15. Machine: local. Skill HEAD before this commit: 0ad35d0.

The string "orders sync drops tags on partial refunds" below is a made-up placeholder used to
exercise the skill. No one reported that behaviour and it was never observed. Do not reuse it as
an input: see the provenance step in `references/phase-0-intake.md`.

| AC | expected | observed | result |
|---|---|---|---|
| AC-1 consult writes nothing | `$factory consult "orders sync drops tags on partial refunds"` answers in conversation; no `.factory/` created, `git status` in the target repo unchanged | answered in conversation; `.factory/` absent; git status unchanged before the full run | pass |
| AC-7 first-run discovery | candidates table, at most three user questions, `~/.factory/roles.json` saved and re-read with 18 bindings | candidates table; 3 questions maximum; roles.json saved and re-read | pending cross-provider forward test |
| AC-8 --config rebind | `--config e2e-tester=<skill>` saves and re-reads a user binding; rebinding back restores the built-in | not yet exercised on Codex | pending Codex forward test |

## Partially exercised by the gic-integrations run (slug orders-sync-drops-tags-20260915)

- AC-2..6, AC-9: Phase 0 intake and Phase 1 diagnosis ran with receipts (4 receipts, anamnesis, examination, diagnosis.md, human-plan.md written).
- Phase 2 human-gate: `~/bin/revdiff-plan` launched twice as a background task, both killed by the harness for low system memory before a window opened. Gate rule applied: second failure -> `terminal: blocked`, Phase 6 report written. Skill behaved as specified; the failure was environmental.
- Phases 3-5 not yet exercised.

## Note for a later version

The gate rule treats a harness-killed background process the same as a revdiff error. Consider distinguishing "killed before start" (retry after the user frees memory) from a real non-zero exit.
