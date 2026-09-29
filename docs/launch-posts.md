# Launch posts

Status: DRAFT, NOT PUBLISHED. Nothing in this file has been posted anywhere. Oleg publishes each
post himself after reading it.

Evidence status: every factual claim below is drawn from the repository. The source is named in
brackets after each claim group; delete the brackets before posting. No user counts, stars,
benchmarks, quotes, or timing claims exist, so none appear. Replace `[repo]`, `[site]` and
`[gif]` with the live URLs at posting time.

Sources:

- README: `README.md`
- Essay: `docs/essay-right-to-say-not-delivered.md`
- Proof: `docs/launch-proof.md`, `proof/case-studies/*`
- Brief: `docs/product-brief.md`

Facts these posts may use:

- Factory is an Agent Skill for Claude Code and Codex that turns a ticket or rough request into an
  isolated change with acceptance criteria, reviews, receipts, and one of four terminal states.
  [README]
- A run once called itself delivered with five unanswered blocking questions and two acceptance
  criteria marked "partly met". Factory now has a gate that blocks that and no "partly met"
  status. [README, Essay]
- The gate itself had a bug: it accepted a requested terminal state that disagreed with the state
  recorded in the run. The old gate passed the contradiction; the current one exits 1. The
  before and after output is in the repo. [Essay, terminal-state-mismatch case study]
- One full Phase 0 to 6 run on the Factory site is documented, from a React hydration warning to a
  merged fix. [hydration-warning case study]
- The redacted demo is a reconstruction, not the original private run. [README, demo output]
- Not claimed: adoption, speed, fewer defects, a full cross-provider run. [README, Brief]
- Known limits: Codex may show a same-name user-wide skill, so the docs use a path-directed
  prompt; the global `-g` install is not verified. [README]

## Show HN

Title candidates (pick one):

1. Show HN: Factory, a gate that stops a coding agent from saying "delivered" without proof
2. Show HN: An Agent Skill that can say "not delivered" (Claude Code and Codex)
3. Show HN: Factory, executable terminal states for AI coding agents

First comment:

> I built Factory because a coding agent run of mine called itself delivered while five blocking
> questions were still unanswered and two acceptance criteria were marked "partly met". The prose
> rules already said not to do that. It did it anyway.
>
> Factory is an Agent Skill for Claude Code and Codex. It takes a ticket or a rough request,
> works in an isolated worktree, writes testable acceptance criteria, and finishes in one of four
> states: delivered, delivered-with-gaps, blocked, or intentionally-unchanged. A script, not the
> prompt, decides whether the run may claim "delivered". "Partly met" is no longer a valid status.
>
> The part I would look at first is the demo: `bash scripts/demo.sh` runs the gate against a
> redacted reconstruction of that failure. It exits 1 and names the five questions and both bad
> rows. The corrected record passes. It is a reconstruction, not the original private run.
>
> The gate also had its own bug. It checked the terminal state you asked for but never compared it
> with the state recorded in the run, so asking for "delivered" on a run recorded as "blocked"
> could pass. The before and after output is in proof/case-studies/terminal-state-mismatch.
>
> What is documented so far: one full run of the workflow, on the Factory site itself (a React
> hydration warning, through a merged fix). What is not claimed: adoption, speed, or fewer
> defects. Known limits: Codex can show a same-name user-wide skill in the picker, so the docs use
> a path-directed prompt, and the global `-g` install is not verified.
>
> Install: `npx --yes skills add oleg-koval/factory -a claude-code -a codex -y`
>
> Repo: [repo]. If Factory ever says "delivered" and it was not, there is an issue template for
> exactly that.

## X thread (5 posts)

1.
> A coding agent of mine called a run "delivered" with five blocking questions unanswered and two
> acceptance criteria marked "partly met".
>
> The prompt said not to do that. So I made the rule executable. [gif]

2.
> Factory is an Agent Skill for Claude Code and Codex. Ticket or rough request in, isolated
> change out, with acceptance criteria, reviews, and receipts.
>
> It ends in one of four states: delivered, delivered-with-gaps, blocked, intentionally-unchanged.

3.
> A script decides whether a run may say "delivered". "Partly met" is not a status anymore.
> Every criterion is met, unrunnable, or failed.
>
> `bash scripts/demo.sh` shows the gate refusing the false claim, then passing the honest one.

4.
> The gate had its own bug. It never compared the terminal state you asked for with the one
> recorded in the run. The old gate passed the contradiction. The current one exits 1.
>
> Before and after output is in the repo.

5.
> What is proven: one full run on the Factory site, plus the demo above (a redacted
> reconstruction). What is not claimed: adoption, speed, fewer defects.
>
> npx --yes skills add oleg-koval/factory -a claude-code -a codex -y
>
> [repo]

Single-post variant:

> My coding agent called a run "delivered" with five blocking questions unanswered. I turned "may
> it say delivered?" into a script that can say no. Factory: an Agent Skill for Claude Code and
> Codex, with a runnable demo of the gate refusing a false claim. [repo] [gif]

## LinkedIn

> Coding agents are good at producing motion. The hard part starts when the work becomes a claim:
> this change is delivered.
>
> One of my runs called itself delivered with five blocking questions still open and two
> acceptance criteria marked "partly met". The written rules already said not to. So I turned the
> rule into a script.
>
> Factory is an Agent Skill for Claude Code and Codex. A run ends in one of four states:
> delivered, delivered-with-gaps, blocked, or intentionally-unchanged. A gate reads the record and
> can refuse "delivered". Every acceptance criterion is met, unrunnable, or failed; "partly met"
> no longer exists.
>
> The gate also had a bug of its own: it did not compare the terminal state requested with the one
> recorded in the run. I kept the before and after output in the repo instead of quietly fixing
> it.
>
> What exists today: the open-source skill, a runnable redacted demo, and one documented full run
> on the Factory site itself. What I am not claiming: adoption, faster delivery, or fewer defects.
>
> Repo and demo: [repo]

## Note for newsletter and podcast hosts (DM or email)

Subject: A gate that lets a coding agent say "not delivered"

> Hi [name],
>
> I made Factory, an Agent Skill for Claude Code and Codex. It lets a coding agent finish a run as
> "not delivered" or "blocked", and a script refuses "delivered" when the record does not support
> it. It came from a run of mine that called itself delivered with five blocking questions still
> open.
>
> There is a short runnable demo of the gate refusing a false claim, and a case where the gate had
> its own bug and the fix is documented. It is early: one full run is documented, and I am not
> claiming adoption or speed gains.
>
> If it fits [newsletter or show], the repo is [repo] and the essay is [site]. Happy to answer
> anything, or to say it is not a fit.
>
> Oleg
