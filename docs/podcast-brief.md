# Factory podcast brief

Evidence status: internal positioning and outreach draft based on public sources checked on
2026-09-26 and the committed Factory proof artifacts. Nothing here has been sent or published.

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

On 2026-09-26, Apple Podcasts listed Greg's latest episode as **Muse AI Connectors: The Next App
Store Moment?** It explores how agent connectors are built, discovered, distributed, and approved.
That is an adjacent opportunity, not the same product category. The bridge for Factory is the
trust boundary before distribution: when an agent builds a product or connector, what evidence
lets anyone say it is actually ready to ship?

Sources:

- [Software Factory episode](https://podcasts.apple.com/us/podcast/building-a-software-factory-that-actually-works/id1593424985?i=1000789595921), published 2026-09-14.
- [The Startup Ideas Podcast](https://podcasts.apple.com/us/podcast/the-startup-ideas-podcast/id1593424985), latest episode checked 2026-09-26.
- [Greg Isenberg Skills Suite](https://www.gregisenberg.com/skills-suite), checked 2026-09-21.
- [Greg Isenberg official site](https://www.gregisenberg.com/), including linked X, LinkedIn, and podcast profiles, checked 2026-09-26.

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

Working title: **The missing quality gate between agent-built and shipped.**

One-sentence promise: Watch an AI coding workflow reject its own false completion claim, expose
the exact contradiction, and pass only when its evidence and delivery record agree.

Three useful audience takeaways:

1. Agent reliability is a state-machine problem before it is a model problem.
2. Evidence becomes trustworthy when a machine-readable gate can reject it.
3. A one-person company gets leverage from agents that stop honestly, not agents that always
   return green.

Strongest limitation to state on air: Factory does not prove that the acceptance criteria were
the right product decision. It proves whether the recorded criteria and required evidence were
satisfied, and it blocks when the decision frontier remains open.

## Proof demo

Run `bash scripts/demo.sh` and follow [`docs/demo-script.md`](demo-script.md):

1. The runner derives five unanswered blocking questions and two invalid acceptance-criterion
   statuses from the false-delivery artifacts.
2. The current gate exits 1 and names all seven defects instead of summarizing them away.
3. The honest fixture passes through the same gate.
4. The committed before-and-after receipts show the gate's own historical bypass: the baseline
   passed a terminal mismatch and the fixed gate blocks it.
5. End on the explicit evidence boundary, not a claim about future potential.

## Outreach draft — do not send yet

Booking-route evidence (checked 2026-09-26): [Greg's official site](https://www.gregisenberg.com/)
links his [X profile](https://twitter.com/gregisenberg) and
[LinkedIn profile](https://www.linkedin.com/in/gisenberg/), but does not publish a guest
application or podcast-booking email. Use one of those official social profiles for a concise
direct pitch if Oleg chooses to send. Third-party podcast directories list possible contacts, but
none was verified on Greg's official site; do not use an unverified address.

New official route verified 2026-09-25: Greg's published newsletter says people with a startup
idea can join his YouTube livestreams and share it on stage. That is a public workshop route, not
a guaranteed podcast application. Factory's strongest version is a concise live teardown of a
false delivery claim and the evidence that makes the gate refuse it.
Source: [Greg's published livestream invitation](https://www.gregisenberg.com/blog/faceless-youtube-formula).
The next livestream date or submission procedure is not verified.

Subject: The missing quality gate between agent-built and shipped

Greg — your September 14 conversation with Ras Mic laid out the software-factory loop:
isolate, build, prove, ship. Your latest episode looks at agents becoming products through
connectors, discovery, and approval. The problem I work on is the trust boundary before “ship.”
Factory is an MIT-licensed skill for Claude Code and Codex that checks whether a delivery claim
matches its acceptance criteria and evidence—and returns a specific blocked result when it does
not.

The sharpest demo is Factory catching its own false finish: the old gate accepted `delivered` even
when the run recorded `blocked`. The regression now rejects that mismatch and links to the
before-and-after source. Separately, a complete Phase 0–6 run on Factory's own site is public: it
reproduced a hydration warning at desktop and mobile widths, fixed it, and verified the deployed
page clean. That is one documented run, not a claim of general reliability or customer adoption.

I have a concise live demo script for the gate. Would a teardown of one “agent says done / evidence
says not yet” run make a useful follow-up for builders using agents to ship products?

Public proof: [Factory gate](https://factory.olegkoval.com/proof/) · [full-run case
study](https://factory.olegkoval.com/case-studies/development-hydration-warning/)

— Oleg

## Release gate before outreach

- [x] Public repository and immutable commit URL exist.
- [x] `factory.olegkoval.com/proof/` renders the same fixtures and before/after receipts.
- [x] The public source resolves to one canonical skill for Claude Code and Codex.
- [x] The non-interactive CLI demo exited 0 in 0.17 seconds on 2026-09-23; this does not time the narration.
- [x] The executable proof completed in 0.18 seconds on 2026-09-24; the spoken walkthrough has not been timed, so the pitch does not promise a three-minute segment.
- [ ] Oleg reviews the unsent wording in his own voice.
- [ ] Oleg selects either Greg's official X/LinkedIn profile for the podcast pitch or the separate
  public livestream workshop route; no official guest form or booking email is listed as of
  2026-09-26.
- [ ] Oleg explicitly approves the recipient, channel, and final message before anything is sent.

No outreach should be sent merely because these checks become green.
