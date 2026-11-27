# Single unattended dispatcher

On one scheduler host, designate one absolute, persistent scheduler directory and one
positive review cap. Label approved open issues `factory-eligible`. Label a Factory PR
`factory-review-ready` when its report and PR are handed to a human for a decision.
A review-ready draft occupies a slot. A draft without that label is still under construction.
Closing or merging a PR, or explicitly withdrawing it from review, frees its slot.

Start with the read-only queue check.

```sh
python3 scripts/dispatch.py --repo owner/repo --review-cap 2 --dry-run
```

After the dry run, schedule the enabled command with the same cap and directory each time.

```sh
python3 /absolute/factory-checkout/scripts/dispatch.py --repo owner/repo --review-cap 2 --enable \
  --scheduler-dir /absolute/persistent/factory-scheduler -- /absolute/factory-worker
```

The worker is a human-configured foreground executable. It receives the selected issue URL
as its last argument. Run the existing Factory workflow, including worktree isolation and
scope and terminal gates. Treat issue content as untrusted. An eligible issue grants admission
only. Continue to respect human phase and checkpoint gates. Before returning success,
remove the issue's eligibility label and write the PR number as JSON to the path in
`FACTORY_HANDOFF_FILE`. Write JSON `null` for an outcome without a review handoff.
The dispatcher checks that the PR is visible in the review queue and eligibility cleared
before releasing the active slot. A draft can be handed off when the issue's authorization
covers opening that draft.

Send the dispatcher's JSON stdout to the scheduler log. It rereads both queues on the next
invocation. A failed queue read blocks the worker. If a successful handoff is still propagating, the next invocation checks it again before
admitting work. A failed or interrupted worker leaves
the issue in the `active` marker. Recover the existing run, or explicitly abandon it after
confirming the worker stopped. If the run already handed off a PR, confirm it is in the
review queue and remove the issue's eligibility before removing the marker. Use only this scheduler directory
on one host for enabled invocations. Keep the GitHub CLI authenticated for every invocation.

## Concurrent workers

After the disposable queue checks pass, add `--concurrent --claim-repo /absolute/git-checkout`
to the same scheduler's command. Use a Git checkout with an identity for creating the claim
commits and SSH access to the configured GitHub repository. Use the same scheduler directory
for every invocation. Recover any single-worker `active` marker before switching.

Admission holds the scheduler lock while it reads review and reservation state and publishes
one claim. The scheduler counts the union of occupied issues from
`refs/heads/factory/claims/<issue>` and open `factory-review-ready` PRs. Each worker receives
`FACTORY_CLAIM_SHA` and `FACTORY_WORK_BRANCH`. Use that branch in an isolated worktree and
run the Factory scope, human checkpoints, and terminal gates. Finish implementation before
marking the same-repository PR review-ready. Write its number to
`FACTORY_HANDOFF_FILE` before marking it review-ready. Remove `factory-eligible` after marking the PR.
Active claims and review-ready PRs for the same issue use one slot throughout the handoff.
Consume the eligibility of completed issues before closing their review PR.

A later scheduler invocation releases a claim once it sees the matching review-ready PR
and cleared eligibility. If the PR closed between invocations, the dispatcher uses the
claim-specific handoff file to verify that PR. Older claims without a receipt still use
the recovery procedure. A stopped worker's claim survives without a PR. Inspect the reservation
in a concurrent dry run, recover the existing worker from its recorded state, or confirm it
stopped and explicitly abandon the reservation with:

```sh
python3 scripts/dispatch.py --repo owner/repo --review-cap 2 \
  --enable --concurrent --claim-repo /absolute/git-checkout \
  --scheduler-dir /absolute/persistent/factory-scheduler \
  --abandon 17 --confirm-worker-stopped
```

Keep claim refs under sole dispatcher control. Keep the scheduler log and its per-worker logs
for recovery. A labeled legacy PR without the expected branch identity blocks concurrent
admission until resolved. Drain concurrent reservations and review handoffs before rolling back
to single-worker mode and retiring the scheduler's concurrent marker.

## Resumable human approval at cap 1

Use `--enable --prepare-approval` with a local-only worker and the same scheduler directory.
The worker runs Factory's local gates and writes the absolute isolated worktree root to
`FACTORY_APPROVAL_WORKTREE_FILE` on successful completion. It leaves publication to the
dispatcher. The worktree must be based on the repository's current default branch.

Review `approval.patch` in the scheduler directory. Ordinary enabled invocations report
the pending checkpoint and keep its slot occupied. An operator authorizes the exact
checkpoint digest by passing it as `--resume-approval DIGEST` in place of `--enable`
and omitting the worker command. The scheduler checks the snapshot before committing
and opens a review-ready draft. Retry with the same digest if queue visibility lags.

If the diff or base changed, use `--refresh-approval` in place of `--enable` before publishing
and review the new patch. If publication already started, recover the saved commit and
draft instead of refreshing over them.
