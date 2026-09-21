# Your software factory needs the right to say "not delivered"

Description: More coding agents create more output. Reliable software factories need an
executable delivery contract that can reject false completion and explain why.

Author: Oleg Koval

Evidence status: publication draft backed by Factory's committed local fixtures and regression
case study. It does not claim public availability, adoption, faster delivery, or fewer defects.

AI coding agents are good at producing motion. They inspect a repository, edit files, run a
test, and return a confident summary. The hard problem begins when that activity becomes a
claim: *this change is delivered*.

"Done" sounds harmless in a chat window. In a software team, it carries hidden commitments.
The request was understood. Blocking decisions were answered. The change was isolated. The
test failed for the intended reason before the fix, passed after it, and still caught the bug
when the fix was removed. Review covered the whole change, not only the latest diff. Any checks
that could not run were named rather than blurred into success.

More agents do not make those commitments true. They make it possible to produce unsupported
completion claims faster.

## A factory needs a delivery contract

A useful software factory can isolate work, build changes in parallel, collect before-and-after
evidence, and send the result through review. Those capabilities improve throughput and make
agent work easier to inspect.

They still leave one question unanswered: what must be true before a run may call itself
delivered?

Factory treats that as an executable contract rather than a sentence in a prompt. A run carries
testable acceptance criteria, open decisions, proof receipts, review outcomes, and a requested
terminal state. The gate reads that record and can refuse the terminal claim.

This distinction matters. A workflow describes what should happen. A gate decides whether the
record proves that it happened.

## The failure that became the first gate

The failure shape behind Factory was ordinary enough to be dangerous. A run reached
`delivered` while five blocking questions remained unanswered. Two acceptance criteria were
marked `partly met`, a phrase that sounded encouraging but had no enforceable meaning.

The prose rules already said not to do this. The run did it anyway.

Factory now accepts only three acceptance-criterion results: `met`, `unrunnable`, or `failed`.
An unanswered blocking question prevents delivery. An unrunnable check is not silently promoted
to success; it requires a named gap and explicit acceptance before the run can use
`delivered-with-gaps`.

The [redacted terminal-gate fixture](../proof/terminal-gate/) reconstructs the cardinality and
logic of that failure without exposing the private work. Run it with:

```bash
bash scripts/demo.sh
```

The false-delivery case exits 1 and names all five unanswered questions and both invalid
acceptance-criterion rows. The corrected case passes through the same gate. The useful result is
not that one fixture turns green. It is that the same executable rule discriminates between a
supported completion claim and an unsupported one.

## "Blocked" is a product feature

A reliable agent needs more than success and failure. Factory uses four explicit terminal
states:

- `delivered`: every acceptance criterion was proven and the terminal gate passed.
- `delivered-with-gaps`: the change is ready, but named checks could not run and the user
  explicitly accepted those gaps.
- `blocked`: a missing fact, unanswered decision, or exhausted bounded loop prevents correct
  delivery.
- `intentionally-unchanged`: diagnosis showed that changing code was not the right treatment.

These states prevent a common collapse of meaning. "I changed something," "I could not verify
something," and "nothing should change" are different outcomes. Treating all three as done
makes the human reconstruct the truth from a long transcript.

The right to stop also changes agent behavior. A bounded loop can end honestly instead of
retrying until it produces a plausible-looking green result. A missing decision stays visible
instead of becoming an assumption. An unchanged repository can be the correct outcome rather
than evidence that the agent failed to act.

## The gate must be allowed to fail too

An executable gate is not automatically trustworthy. It is software, and software can encode
the wrong rule.

While preparing Factory's public proof, the gate exposed its own defect. It validated the
terminal requested on the command line but did not compare that request with the terminal
already recorded in the run state. A caller could ask it to validate `delivered` against a run
recorded as `blocked`. If the other checks were clean, the old gate returned `PASS`.

The [terminal-state mismatch case study](../proof/case-studies/terminal-state-mismatch/) preserves
the baseline output, the regression test, the fixed output, and the relevant commits. The old
gate passes the contradiction. The current gate exits 1 and names both conflicting states.

That bug is part of the product story, not an embarrassment edited out of it. A quality system
earns trust by making its claims falsifiable, including claims about itself.

## Proof should survive the demo

A polished video can make almost any agent workflow look reliable. The more useful standard is
whether another engineer can inspect the record after the presentation ends.

Factory's proof surface is designed around that standard:

- the acceptance-criteria matrix maps each requirement to evidence, a named gap, or failure;
- receipts preserve the command, result, and commit without inflating the compact carried state;
- the test must fail before the fix, pass after it, and fail again when the fix is removed;
- milestone review and whole-change review cover different failure scopes;
- the terminal gate emits the exact reasons a completion claim is accepted or refused.

The [proof manifest](../proof/manifest.json) maps the current claims to their artifacts and states
their limits. It does not claim benchmark wins, adoption, time savings, or lower defect rates.
Those require evidence that does not exist yet.

## The unfair advantage is honest refusal

Model capability will keep improving. Agent orchestration will become easier to copy. Neither
one removes the need to decide what counts as delivered.

The durable advantage is a workflow built from real failure modes and converted into executable
constraints: unanswered decisions, tests without teeth, self-approved permission fallbacks,
unbounded retries, oversized state, and locally clean milestones that break a branch-wide
invariant.

Factory is not another conveyor belt for producing code. It is the quality system beneath the
conveyor belt. Its job is to make delivery claims inspectable and to refuse the ones the evidence
does not support.

Your coding agent does not need permission to sound confident. It needs the right to say exactly
why the work is not delivered.
