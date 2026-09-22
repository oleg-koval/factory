# How Factory verifies AI-written software

Description: Factory turns a ticket, incident, or written request into isolated work, testable
acceptance criteria, reviewed milestones, proof receipts, and an executable delivery decision.

Evidence status: publication draft derived from the current Factory skill contract and phase
files. It describes implemented local behavior, not public availability or measured outcomes.

Factory is an agent skill for Claude Code and Codex. It does not replace the coding agent or
choose a product strategy. It changes the delivery contract around the work: what must be known,
what must be proven, and which terminal claim the evidence permits.

The workflow has seven public-facing gates. Internally, planning is split into three phases so
facts, human decisions, and the executable agent plan cannot silently collapse into one another.

## 1. Intake: turn the request into something that can fail

Factory accepts a Linear issue, Sentry event, or written request. It separates the reported
symptom from the evidence and records the request's provenance. A person's report, a production
event, a failing test, and an agent's observation are not interchangeable sources.

The intake produces testable acceptance criteria and classifies the work as an incident, bug,
feature, refactor, or question. Each criterion must describe an observable result rather than a
general intention such as "make it better."

For early decisions, `consult` mode performs intake and triage without writing files or starting
an implementation run.

**Gate:** the request has a source, a classification, and acceptance criteria that can be
verified later.

## 2. Isolate: establish a clean place to tell the truth

The default execution environment is a separate Git worktree on its own branch. Factory records
the base branch and SHA, the worktree path, and the user's authorization for the isolation mode.

If a worktree cannot be created, Factory does not grant itself permission to edit the active
checkout. An in-place fallback requires the user's own words, preserved in the run state.

Type checking, linting, and tests are measured inside the environment the run will actually use.
Existing failures become the baseline instead of being rediscovered or misattributed at the end.

**Gate:** isolation is explicit, consent is recorded, and the baseline comes from the real run
environment.

## 3. Diagnose: prove the problem before treating it

At full depth, Factory gathers evidence before proposing a change. It traces the relevant code,
attempts a reproduction, and records what was examined along with file, line, or command
receipts.

Reproduction is bounded. Two identical failed attempts stop the loop and produce an honest
unknown diagnosis rather than an indefinite retry. Diagnosis may also conclude that no code
change is needed or that configuration or data is the correct treatment.

Those are valid outcomes. A workflow that can finish only by editing code has already biased its
diagnosis.

**Gate:** the treatment follows evidence, uncertainty is named, and bounded failure can end in
`blocked` or `intentionally-unchanged`.

## 4. Plan: empty the decision frontier before code

The human plan explains what is wrong, why, what will change, what will not change, risks,
release safety, acceptance criteria, milestones, and open questions.

Every open question is structured as a fact or a decision. Factory must search the repository or
source material for facts. It asks the user only for decisions the available evidence cannot
make. New questions join the next bounded planning round. Code does not begin while a blocking
question remains unanswered.

The agent plan then maps each acceptance criterion to a test, implementation tasks, review
checks, budgets, and invariant tracers. A separate equivalence check confirms that the executable
plan still has the same scope as the human plan.

**Gate:** blocking questions are answered and the implementation plan preserves the approved
intent.

## 5. Build: make the proof fail before making it pass

Each milestone begins with its end-to-end or integration test. The test must fail for the
intended reason before implementation starts. A test that already passes cannot prove the new
behavior.

After implementation, the new tests must pass and the rest of the suite must be no worse than
the recorded baseline. Factory then removes the relevant fix and runs the whole test file the
way the repository normally runs it. If the test still passes, it does not have teeth and the
milestone is not accepted.

Each milestone receives a fresh review before it is committed. Acceptance-criterion status goes
into a compact matrix; commands, results, commits, and available token counts go into append-only
receipts rather than the carried state file.

**Gate:** the test was observed red, then green, then red again without the fix; the reviewed
milestone has a commit and an exact acceptance-criterion status.

## 6. Prove: review the change at its real scope

Milestone-local success is not whole-change proof. Factory reruns the full suite and every test
named in the acceptance-criteria matrix against the original baseline.

A mechanical scan reads the full changed files, not only diff hunks. Whole-change review expands
to callers, contracts, migrations, and cross-milestone behavior. An adversarial invariant pass
tries to construct concrete replay, concurrency, or partial-failure orderings the happy-path
suite may not cover.

An acceptance criterion may be `met`, `unrunnable`, or `failed`. `Unrunnable` is evidence about an
environmental boundary, not a softer spelling of success, and it requires a named reason and
owner.

**Gate:** every criterion maps to proof or an explicit gap, and both changed code and its wider
invariants have been reviewed.

## 7. Stop: earn one terminal state

Factory writes the final report before choosing a terminal claim. The report includes the
acceptance matrix, baseline and final checks, commits, questions, gaps, receipts, isolation
details, cleanup command, and cost data the host made available.

The executable terminal gate then reads the record. It checks state shape and size, unanswered
questions, acceptance criteria, isolation, consent, receipts, budgets, and agreement between the
requested terminal and the terminal already recorded by the run.

The four outcomes are:

- `delivered`: every acceptance criterion is met and the terminal gate passes.
- `delivered-with-gaps`: at least one check is unrunnable, every gap is named, and the user has
  explicitly accepted those gaps.
- `blocked`: a missing fact, unanswered decision, failed criterion, exhausted loop, unresolved
  role, or gate failure prevents delivery.
- `intentionally-unchanged`: diagnosis proves that changing code is not the correct treatment.

The worktree is not removed automatically. It contains the branch and may hold the only local
copy of the work until it is pushed or merged.

**Gate:** the terminal state is permitted by the record and the exact gate output is included in
the handoff.

## One contract across Claude Code and Codex

Claude Code invokes Factory as `/factory`; Codex invokes it as `$factory`. Both hosts read the
same provider-neutral skill, phase files, role configuration, state, and executable gates. The
runner selects the host's native CLI, but switching providers does not change the delivery
contract.

The canonical repository is public at `oleg-koval/factory`. A disposable repository verified
public-source discovery, canonical installation for Codex, the Claude Code symlink, and the
installed proof suite on 2026-09-22. Fresh-session invocation, a second-machine install, and a
complete cross-provider run remain unproven.

## Inspect the implementation

- [Factory skill contract](../SKILL.md)
- [Role and binding contract](../references/roles.md)
- [Phase 4 milestone rules](../references/phase-4-milestones.md)
- [Phase 5 proof rules](../references/phase-5-proof.md)
- [Phase 6 terminal gate](../references/phase-6-stop.md)
- [Runnable proof](../proof/terminal-gate/)

Factory does not prove that the acceptance criteria were the right product decision. It proves
whether the recorded criteria and required evidence support the terminal claim, and it refuses
the claim when they do not.
