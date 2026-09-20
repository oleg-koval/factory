# Phase 2b: grill the plan

Purpose: empty the question frontier from `human-plan.md` section 9 before any code is
written. A found fact or a made decision here is cheap; the same gap found in Phase 4 is a
milestone redone.

Declare before round 1: `state.grill.rounds_max = 3`.

## One round

a. **Facts.** Take every open question with `kind: fact`. Send them all to ONE leaf in a
   single brief, role `investigator` (or `knowledge-lookup` when the fact is a lookup,
   `mechanical-leaf` when it is a grep). The brief lists every fact question by id and text.
   The leaf returns one answer per id with a receipt (file:line, command output, or the
   source it read). Write each answer into `state.open_questions[].answer` and append the
   id, question and answer to `grill.md`. Facts are the run's job to find; never ask the user
   a question the repo or the ticket already answers.

b. **Decisions.** Take every open question with `kind: decision`. Put them to the user in one
   concise batch for the round, one question per open decision. Lead each option list with
   the recommended answer, marked `(Recommended)`, with one line of why. Record the user's
   choice verbatim as the `answer`, whichever option they pick.

c. **New questions.** An answer from (a) or (b) may surface a new question (a fact answer that
   names a second unknown, a decision that opens a follow-up). Add it to
   `state.open_questions` with its own `kind` and `blocking` flag; it joins the next round.

Increment `state.grill.rounds` at the end of the round.

## Stopping

Done when no unanswered `blocking: true` question remains in `state.open_questions`. Any
non-blocking question still unanswered stays in the list with its owner; it is not chased
further here and is reported in Phase 6 as-is.

Rounds exhausted (`state.grill.rounds == state.grill.rounds_max`) with a blocking question
still open: set `terminal: blocked`, go to Phase 6 for the report naming which question and
whose answer is missing.

Finding facts is the run's job, never the user's; making decisions is the user's job, never
the run's. One line of why: a run once shipped `delivered` with five questions open because
nothing forced them closed before the code started.

Speak once per round: how many facts answered, how many decisions asked, how many questions
remain open and their `blocking` flags, under 6 lines.

## Close

1. Write `state.json`: `state.phase = "2b"`, `state.next = "3"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 2b` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line which phase comes next and that `scripts/run.sh <slug>` resumes it. A
   fresh session per phase is the design; compaction is the fallback when a phase is resumed
   inside an old session.
