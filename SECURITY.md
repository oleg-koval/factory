# Security policy

Evidence status: policy for an unreleased local release candidate. No public release or supported
version exists yet.

## Permission boundary

Factory is an agent skill, not a sandbox. Once invoked, the host agent retains the permissions
the user granted to Claude Code or Codex. Factory's scripts can read and write the target
repository, create Git worktrees and commits, run project commands, and invoke the selected agent
CLI. Review this repository before installation and run it with the least host permissions your
task permits.

Factory does not include a hosted service, telemetry client, credential store, or background
daemon. Provider credentials remain with their native CLIs. Do not place secrets in
`.factory/`, `state.json`, receipts, briefs, or role configuration.

## Enforced boundaries

- Work begins in an external Git worktree by default. Only the user may accept an in-place
  fallback, and the terminal gate checks that acceptance.
- `scripts/run.sh` accepts a constrained local slug before constructing a path or prompt. It
  rejects traversal, shell syntax, and non-integer session caps.
- State paths and keys are passed to Python as process arguments, not interpolated into Python
  source.
- Loop and session caps are validated before arithmetic use.
- The terminal gate rejects unknown states, unresolved blocking questions, invalid acceptance
  statuses, evidence gaps, isolation violations, and disagreement between requested and recorded
  terminal states.
- Factory does not publish, push, open a pull request, deploy, change DNS, or send a message merely
  because local checks pass. Those remain separate authorization and delivery gates.

These controls reduce known workflow risks; they do not turn arbitrary repository commands or
third-party agent CLIs into trusted code.

## Supported versions

No version is supported until the first public release. After release, the latest tagged version
and the default branch will receive security fixes; the table will be updated with exact dates.

## Reporting

Before public release, security findings stay local to the owner. Public release is blocked until
GitHub private vulnerability reporting is enabled for `oleg-koval/factory` and this section links
to that live channel.

After that channel exists, report vulnerabilities privately. Do not include exploit details,
credentials, private repository content, or customer data in a public issue. If private reporting
is unavailable, open a public issue asking for a private contact without disclosing the finding.

The initial response target and disclosure timeline remain `[TK: decide before public release]`.
