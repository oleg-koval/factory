# Factory product brief

Evidence status: product direction backed by the public Factory repository, its passing structural
suite, a verified public-source install, and a live Cloudflare deployment. User adoption,
fresh-session invocation, and performance claims are not yet proven.

## The claim

Agents can produce code. Factory produces evidence.

Factory is an agent skill that turns a ticket, incident, or rough request into an isolated
software change with testable acceptance criteria, milestone reviews, proof receipts, and an
explicit terminal state. It may finish `delivered`, `delivered-with-gaps`, `blocked`, or
`intentionally-unchanged`. It is not allowed to blur those states together.

## The audience

Write for the engineering leader who already uses Claude Code or Codex, has watched an agent
declare victory after a narrow test passed, and now needs a workflow the rest of the team can
trust.

They already believe agents can write code. They do not yet believe an agent can own delivery
without constant supervision. Factory must change that belief by showing its work.

## The unfair advantage

Factory is built from observed delivery failures rather than an imagined ideal workflow:

- A run once called itself delivered with five unanswered questions and two acceptance criteria
  marked partly met. Factory now has an executable terminal gate and no "partly met" status.
- A test that fails alone but passes inside its own file will never fail in CI. Factory runs the
  full test file and then removes the fix to prove the test has teeth.
- A run once granted itself permission to edit in place. Factory now isolates work in a separate
  worktree and requires the user's own words before accepting an in-place fallback.
- Receipts once expanded the carried state file to 43 KB, with 21 KB of receipts. Factory keeps
  append-only receipts outside compact state and blocks terminal state when that state exceeds
  4 KB.
- A clean milestone can still break a cross-milestone invariant. Factory reviews the whole
  branch and asks an adversarial reviewer to construct a concrete interleaving, replay, or
  partial failure.

These are not generic best practices. They are scars turned into gates.

## Category position

“Software factory” already describes workflows that isolate work, build with agents, capture
before/after proof, and ship through review. Factory should not compete on that broad claim.

Factory is the verification layer for those workflows: the executable contract that decides
whether a run may say `delivered`. Its wedge is not more agents or more throughput. It is
falsifiable completion, explicit refusal states, and evidence another engineer can inspect.

## Product shape

The first release is one provider-neutral open-source skill installed into both hosts. Claude
Code invokes it as `/factory`; Codex invokes it as `$factory`. The runner selects the host's
native CLI while both hosts read the same delivery contract and `.factory/roles.json`.

The website is the product's proof surface, not a brochure. Its primary interaction is a
redacted example run that visitors can inspect phase by phase: source, plan, acceptance-criteria
matrix, test failure, implementation checkpoint, teeth check, whole-change review, and final
gate. Every claim on the page should link to an artifact or remain visibly marked `[TK]` until
evidence exists.

## What the first release includes

- A public repository containing the canonical skill, scripts, tests, license, and evaluation
  fixtures.
- A one-command install path for both Claude Code and Codex.
- One redacted, reproducible demo run with real artifacts.
- A searchable marketing site at `factory.olegkoval.com`.
- A short essay: "Your coding agent needs the right to say not delivered."
- A versioned changelog and a page explaining every terminal state.

## What it does not include yet

- Hosted execution, billing, GitHub App permissions, or a remote control plane.
- Claims about time saved, defect reduction, adoption, or benchmark wins without measured data.
- Automatic publication, outreach, or messages sent on Oleg's behalf.

## Product test

The launch is credible when a skeptical engineering leader can answer these questions from the
public artifacts without trusting the landing page:

1. What exactly does Factory do that a normal coding agent does not?
2. What failure does each gate prevent?
3. Can I inspect a complete run?
4. Can I install it in Claude Code or Codex?
5. What happens when Factory cannot prove completion?

The strategic test is stronger: Factory should make a useful podcast demo even if the viewer
never installs it. The episode hook is not "I made another agent framework." It is "I taught
coding agents to carry proof and refuse false completion."
