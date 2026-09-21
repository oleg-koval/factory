# Factory podcast brief

Evidence status: internal positioning and outreach draft based on public sources checked on
2026-09-21 and the committed Factory proof artifacts. Nothing here has been sent or published.

## The strategic correction

Do not pitch Factory as a new way to run a software factory.

Greg Isenberg published **Building a Software Factory that actually works (Full Course)** with
Ras Mic on 2026-09-14. The episode already covers a model-independent Markdown workflow with
four steps: isolate, build, prove, and ship. It also shows parallel feature work, before/after
evidence, and an external review loop.

That makes the broad category familiar to Greg's audience. It also makes an undifferentiated
Factory pitch late.

The sharper follow-up is:

> A software factory still needs a quality system that can refuse shipment.

Factory is the delivery contract beneath the conveyor belt. It decides whether the evidence
earns `delivered`, names the exact reason when it does not, and preserves the record another
engineer can inspect.

## Why this fits Greg now

Greg's current Skills Suite describes agent roles with failure guardrails and review loops. His
recent channel has covered skills, agent workforces, Claude Code, local AI, and software
factories. Factory meets that conversation at its next unresolved question: what makes an
agent's completion claim trustworthy?

Sources:

- [Software Factory episode](https://www.youtube.com/watch?v=_LCeJZFIsd4), published 2026-09-14.
- [Greg Isenberg Skills Suite](https://www.gregisenberg.com/skills-suite), checked 2026-09-21.
- [Greg Isenberg YouTube channel](https://www.youtube.com/@GregIsenberg), checked 2026-09-21.

## The non-overlapping wedge

| Recent Software Factory episode | Factory's distinct contribution |
|---|---|
| Runs many agents through isolate, build, prove, ship | Decides whether any one run may claim a terminal state |
| Uses before/after evidence | Maps every acceptance criterion to proof, a named gap, or failure |
| Sends review feedback back into the loop | Bounds loops and stops as `blocked` instead of retrying indefinitely |
| Treats Markdown as the portable workflow | Adds executable gates that read the Markdown and JSON artifacts |
| Optimizes throughput and reviewability | Optimizes falsifiability, consent, and honest handoff |

This is a complement, not a rebuttal. The pitch should credit the existing episode and show the
quality-control layer it creates demand for.

## Episode idea

Working title: **Your software factory needs the right to say “not delivered.”**

One-sentence promise: Watch an AI coding workflow reject its own completion claim, expose the
missing evidence, and pass only after the record and the request agree.

Three useful audience takeaways:

1. Agent reliability is a state-machine problem before it is a model problem.
2. Evidence becomes trustworthy when a machine-readable gate can reject it.
3. A one-person company gets leverage from agents that stop honestly, not agents that always
   return green.

Strongest limitation to state on air: Factory does not prove that the acceptance criteria were
the right product decision. It proves whether the recorded criteria and required evidence were
satisfied, and it blocks when the decision frontier remains open.

## Three-minute demo

Run `bash scripts/demo.sh` and follow [`docs/demo-script.md`](demo-script.md):

1. The runner derives five unanswered blocking questions and two invalid acceptance-criterion
   statuses from the false-delivery artifacts.
2. The current gate exits 1 and names all seven defects instead of summarizing them away.
3. The honest fixture passes through the same gate.
4. The committed before-and-after receipts show the gate's own historical bypass: the baseline
   passed a terminal mismatch and the fixed gate blocks it.
5. End on the explicit evidence boundary, not a claim about future potential.

## Outreach draft — do not send yet

Subject: Follow-up to your software factory episode: the delivery gate

Greg — your September 14 software factory episode with Ras Mic mapped the operating loop:
isolate, build, prove, ship. I have been working on the layer underneath that loop: what must be
true before an agent is allowed to call the work delivered.

[TK: one concrete sentence from Oleg about the software or agent workload he personally runs]

A real run reached `delivered` with five unanswered questions and two acceptance criteria marked
`partly met`. I turned that failure into an executable gate. While preparing the public proof, I
found the gate itself could validate `delivered` against a run recorded as `blocked`; the
regression now shows the old commit passing and the fixed gate refusing it.

The demo is designed to fit in three minutes and remain inspectable end to end: bad state, exact
refusal, corrected state, then the gate catching its own bug. It is not another orchestration
framework. It is the quality system that gives a software factory the right to say “not
delivered.”

[TK: public proof URL]

Would that make a useful follow-up for your audience? I can demonstrate the failure and the fix
live, using the public artifacts rather than a slide deck.

— Oleg

## Release gate before outreach

- Public repository and immutable commit URL exist.
- `factory.olegkoval.com/proof/` renders the same fixtures and before/after receipts.
- Install commands work from the public repository on Claude Code and Codex.
- The complete public demo takes less than three minutes when timed.
- Oleg reviews the wording in his own voice and replaces or approves the first-person claims.
- Oleg explicitly approves the recipient, channel, and final message before anything is sent.

No outreach should be sent merely because these checks become green.
