# Leaf briefs

Every leaf gets one brief. A leaf sees nothing else from this session, so the brief must be
self-contained. Copy this shape; fill every heading; never link to "the plan above".

### Run
`.factory/<slug>/` and the phase and milestone this belongs to.

### Working directory
`state.isolation.worktree`, quoted as an absolute path. Every path under "Files you may write"
is relative to it, and every command the leaf runs starts there. A leaf never touches the main
checkout: it is the user's, it holds their uncommitted work, and nothing in this run is allowed
to compete with it.

### Role
The role id and the one-line contract from `roles.md`. State the model tier.

### Goal
One sentence. What exists when the leaf is done.

### Inputs
Quoted text the leaf needs: AC ids and text, agent-plan entry, human-plan sections 3 and 4,
reuse index, test command, commit range. Quote inputs under 40 lines; anything longer is a path
plus line range, relative to the worktree, and the leaf reads it there instead. One line of why:
a brief that pastes a whole plan costs more than the leaf's work.

Two inputs are easy to forget and change the verdict when they are missing. Any leaf that will
claim the suite is green gets `state.baseline` quoted, so "green" means "matches these numbers"
rather than "zero". Any reviewer gets the `INV-` entries its milestone lists, in full, plus the
diffs of earlier commits in this run that touched the same invariant - without them the reviewer
can only find defects that fit inside one milestone.

### Files you may write
Exact paths or globs. Anything else is out of bounds. Read-only roles: "none".

### Done when
The post-condition and the command that proves it. The leaf must run that command and quote
its output.

### Report
Word cap (default 250; reviewers 300). Required first line where a verdict contract exists.
Required receipts: commands run, output excerpts, files touched with line ranges.

Rules: leaves never delegate; a leaf that hits a wall completes the rest and names the gap;
do not tell a leaf to echo its reasoning.
