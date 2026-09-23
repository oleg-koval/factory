# Factory podcast brief

Evidence status: internal positioning and outreach draft based on public sources checked on
2026-09-23 and the committed Factory proof artifacts. Nothing here has been sent or published.

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

- [Software Factory episode](https://podcasts.apple.com/us/podcast/building-a-software-factory-that-actually-works/id1593424985?i=1000789595921), published 2026-09-14.
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

Booking-route evidence (checked 2026-09-23): [Greg's official site](https://www.gregisenberg.com/)
links his [X profile](https://twitter.com/gregisenberg) and
[LinkedIn profile](https://www.linkedin.com/in/gisenberg/), but does not publish a guest
application or a podcast-booking email. Third-party podcast directories list possible contacts;
none was verified on the official site, so this draft has no selected recipient or channel.
Oleg must choose and approve those details before outreach.

Subject: Your software factory episode missed one gate

Greg — your September 14 software factory episode with Ras Mic mapped the operating loop:
isolate, build, prove, ship. I built Factory, an MIT-licensed agent skill for Claude Code and
Codex with executable delivery gates. Its public regression caught a false pass in Factory's
own gate.

The old gate could accept `delivered` even when the run's recorded state was `blocked`. The same
fixture now exits 1, names the contradiction, and links to the before-and-after source. Another
fixture shows the gate refusing five unanswered questions and two invalid acceptance-criterion
statuses.

I have a three-minute demo script built around those public artifacts. The idea for your
audience: a software factory needs a quality system that can refuse shipment and say exactly
why. Factory's proof page is explicit about its limits; this is a gate demonstration, not a claim
of production adoption or a complete multi-phase run.

Public proof: https://factory.olegkoval.com/proof/

Would that make a useful follow-up for your audience?

— Oleg

## Release gate before outreach

- [x] Public repository and immutable commit URL exist.
- [x] `factory.olegkoval.com/proof/` renders the same fixtures and before/after receipts.
- [x] The public source resolves to one canonical skill for Claude Code and Codex.
- [x] The non-interactive CLI demo exited 0 in 0.17 seconds on 2026-09-23; this does not time the narration.
- [ ] The complete public demo takes less than three minutes when timed.
- [ ] Oleg reviews the unsent wording in his own voice.
- [ ] Select a recipient and channel using a verified route; no official guest form or booking
  email was found on Greg's site on 2026-09-23.
- [ ] Oleg explicitly approves the recipient, channel, and final message before anything is sent.

No outreach should be sent merely because these checks become green.
