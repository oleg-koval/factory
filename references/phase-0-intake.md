# Phase 0: intake and triage

You are the physician taking the history. Cheap, mostly reading. Write nothing outside
`.factory/<slug>/` except adding `.factory/` to `.gitignore` if absent.

1. Slug: `<lowercased source id or first 4 words>-<yyyymmdd>`. Create `.factory/<slug>/`.
2. Fetch the source with role `ticket-reader` (linear) or the Sentry MCP (sentry: issue plus
   latest event). For `text`, the input is the source and its provenance is unknown until you
   ask. Ask the user, in one question, where the behaviour was seen: a report from a person, a
   Sentry event, a Slack thread, a failing test, a log line, or their own observation. Record the
   answer verbatim as `source_evidence` in `state.json` and under `## Source` in `intake.md`.
   Free text is a statement of a symptom, never evidence that the symptom exists: a phrase that
   came from an example, a template, a skill's own documentation or a guess is not a source. If
   the answer is that nothing was observed, say so and stop rather than starting a run. If the
   user has no evidence but wants the run anyway, set
   `source_evidence: "none - unconfirmed, code inspection only"` and repeat that sentence in
   `intake.md`, `anamnesis.md`, the human plan, the PR body and any ticket, so no artifact ever
   reads as if the symptom was seen in production.
3. Acceptance criteria with role `ac-extractor`. For `text` sources, draft AC-1..n yourself
   and ask the user to confirm or edit in one question. Each AC must be testable.
4. Classify: `incident | bug | feature | refactor | question`.
5. Depth. `light`: feature or refactor with clear AC and no failing behaviour to explain.
   `full`: incident, bug, unknown cause, or AC that contradict observed behaviour. A sentry
   source is always `full`. Record the reason in one sentence.
6. Role `knowledge-lookup` on the touched area (Shopify, @teifi-digital, team gotchas).
   Store what came back, verbatim, under `## Knowledge`.
7. Write `intake.md` with sections `## Source`, `## Acceptance criteria`, `## Triage`,
   `## Knowledge`. Write `state.json` with `phase: "0"` and `depth` set.

The baseline is NOT measured here. It is measured in Phase 0b, inside the tree the run will
actually use, because a baseline taken in a different tree with different dependencies is not
the baseline every later "the suite is green" claim gets compared against.

Speak once: class, depth, AC count, and the next phase, in under 6 lines.

## Close

1. Write `state.json`: `state.phase = "0"`, `state.next = "0b"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 0` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line which phase comes next and that `scripts/run.sh <slug>` resumes it. A
   fresh session per phase is the design; compaction is the fallback when a phase is resumed
   inside an old session.

## consult mode

Run steps 2 to 5 in your head, write no files, and answer the user's question as the CTO:
what you would check first, what the likely treatment class is, what a run would cost in
phases. End with one line: "Start a run with `$factory <input>`?" Do not start it yourself.
