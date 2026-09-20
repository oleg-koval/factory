# Phase 1: diagnosis (full depth only)

Evidence gathering is delegated. You synthesize. Declare before starting:
"reproduce attempts max 2".

1. Anamnesis (one `leaf-worker`, read-only brief, cap 250 words): recent commits on the
   touched area, merged PRs on the ticket and what their bodies measured, first seen, frequency
   (Sentry counts), environment, reporter. Write `## Anamnesis`.
2. Examination: role `investigator` for the root cause. When the failure is payload-driven,
   role `payload-reducer` first to shrink the repro. When a reproducible harness would pay for
   itself (multi-service incident, flaky repro), role `repro-harness`; record the decision and
   its reason either way. Write `## Examination` with every receipt: file:line, command and
   output excerpt, event id.
3. Diagnosis: one paragraph naming the cause. Confidence `high | medium | low`, and for
   anything under high, the missing evidence by name. Write `## Diagnosis`.
4. Treatment, exactly one of: `no-change` (behaviour is expected; explain), `config-or-data`
   (no code change), `patch` (small code change), `feature` (planned build), `refactor`.
   Add blast radius: files, services, stores, users affected. Write `## Treatment`.

Stopping rule: two identical failed reproduce attempts (same command, same outcome) means
stop, write `## Diagnosis` as unknown with what was tried, set `terminal: blocked`, go to Phase 6 for the report.

`no-change` and `config-or-data`: show the diagnosis, ask the user to confirm, then set
`terminal: intentionally-unchanged` and go to Phase 6 for the report. Otherwise Phase 2.

Speak once: cause, confidence, treatment, blast radius, under 8 lines.

## Close

1. Write `state.json`: `state.phase = "1"`, `state.next = "2"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 1` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line which phase comes next and that `scripts/run.sh <slug>` resumes it. A
   fresh session per phase is the design; compaction is the fallback when a phase is resumed
   inside an old session.
