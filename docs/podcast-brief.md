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

Booking-route check (official homepage checked 2026-09-27): [Greg's site](https://www.gregisenberg.com/)
links his [X profile](https://twitter.com/gregisenberg) and
[LinkedIn profile](https://www.linkedin.com/in/gisenberg/), along with podcast listening links, but
does not list a guest application or podcast-booking email on that page. Recommended route: a
LinkedIn idea-test post first, then a concise LinkedIn message if the idea resonates. This adapts
Greg's public content-validation advice; it is not a verified booking channel, and the profile's
current message permissions were not verified. In his
[article about validating ideas](https://www.gregisenberg.com/blog/how-to-become-an-idea-machine),
Greg recommends testing a one-liner on Twitter and LinkedIn, expanding it if it resonates, and says
LinkedIn is a better starting point when you have not built an audience on Twitter. That is
audience-building advice, not evidence about podcast bookings. Third-party podcast directories list
possible contacts; none was verified on Greg's official site, so do not use an unverified address.

New official route verified 2026-09-25: Greg's published newsletter says people with a startup
idea can join his YouTube livestreams and share it on stage. That is a public workshop route, not
a guaranteed podcast application. Factory's strongest version is a concise live teardown of a
false delivery claim and the evidence that makes the gate refuse it.
Source: [Greg's published livestream invitation](https://www.gregisenberg.com/blog/faceless-youtube-formula).
The next livestream date or submission procedure is not verified.

LinkedIn idea test — draft only, not posted:

> An AI coding agent saying `done` isn't evidence. The delivery gate should be able to say `not
> yet` and show exactly why.

If that one-liner gets substantive replies from builders, expand it into this post before making a
podcast ask:

> Factory's own gate once accepted `delivered` even though its run record said `blocked`. I added
> a regression that reproduces that contradiction and makes the gate refuse it.
>
> That is the point: “done” should be a claim the evidence has to earn, not a summary the agent
> gets to write about itself. Factory's before/after proof is public, as is a separate full run
> from a reproduced warning to a deployed fix.
>
> What should an AI coding workflow have to prove before it is allowed to say “shipped”?
>
> [Runnable gate proof](https://factory.olegkoval.com/proof/) · [full-run case
> study](https://factory.olegkoval.com/case-studies/development-hydration-warning/)

This sequence is an inference from Greg's content advice, not a proven route to a podcast booking.
No engagement threshold is assumed; Oleg should judge whether any response is meaningful before
expanding or sending a pitch.

LinkedIn draft — do not send without Oleg's final approval:

Greg — your September 14 conversation with Ras Mic mapped isolate → build → prove → ship. I built
the missing quality gate: an MIT-licensed Factory skill for Claude Code and Codex that refuses
`delivered` when a run's own evidence says `blocked`.

Factory caught that false pass in its own gate. A separate full run on Factory's site reproduced
and fixed a desktop/mobile hydration warning, then verified the deployed page clean. Both have
public receipts.

Would you consider me for a Startup Ideas episode showing how an agent can prove—or refuse—its
“done” claim?

Proof: [gate demo](https://factory.olegkoval.com/proof/) · [full-run case
study](https://factory.olegkoval.com/case-studies/development-hydration-warning/)

— Oleg

## Release gate before outreach

- [x] Public repository and immutable commit URL exist.
- [x] `factory.olegkoval.com/proof/` renders the same fixtures and before/after receipts.
- [x] The public source resolves to one canonical skill for Claude Code and Codex.
- [x] The non-interactive CLI demo exited 0 in 0.17 seconds on 2026-09-23; this does not time the narration.
- [x] `bash scripts/demo.sh` reran on 2026-09-26: exit 0 in 0.155 seconds with the false-delivery, honest-delivery, and gate-mismatch outcomes expected. This times only the executable segment; the spoken walkthrough remains unverified.
- [ ] Oleg reviews and approves whether to publish the LinkedIn idea-test draft in his own voice.
- [ ] If the idea-test post receives a meaningful response, Oleg reviews the concise LinkedIn pitch
  in his own voice and confirms the recipient/channel.
  The official public livestream is a separate idea-workshop route, not a podcast booking form; no
  guest application or booking email was listed on the homepage as of 2026-09-27.
- [ ] Oleg explicitly approves the recipient, channel, and final message before anything is sent.

No outreach should be sent merely because these checks become green.
