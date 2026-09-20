# Case study: the terminal-state mismatch

Evidence status: reproduced locally on 2026-09-21 from repository history. This records a real
Factory defect, a failing regression test, and the fixed behavior. It was reconstructed after
the change; it is not represented as a complete Phase 0-6 Factory-orchestrated run.

## Claim

Before commit `fd1cd03381451bc610e7424123132cb2f6a12aba`, the gate trusted the terminal named on
the command line without comparing it with `state.terminal`. A caller could therefore ask it to
check `delivered` against a run already recorded as `blocked` and receive `GATE: PASS` when the
other delivery checks were clean.

## Reproduction

Baseline: `e0f8277804949502fda1134e75e4e6056c8478ae`.

The fixture at `proof/terminal-gate/mismatched-terminal/` records `terminal: blocked`; the
command asks for `delivered`.

```bash
git worktree add --detach /tmp/factory-gate-before \
  e0f8277804949502fda1134e75e4e6056c8478ae
python3 /tmp/factory-gate-before/scripts/gate.py \
  "$PWD/proof/terminal-gate/mismatched-terminal" --terminal delivered
```

Against the baseline gate, it exited 0. See [`before.txt`](before.txt).

The regression patch in [`regression-test.patch`](regression-test.patch) was then applied with
`git -C /tmp/factory-gate-before apply "$PWD/proof/case-studies/terminal-state-mismatch/regression-test.patch"`.
`zsh tests/check.sh` exited 1 because the old gate still returned `PASS`; this is the
watch-it-fail receipt.

## Fix

`run_terminal_checks` now rejects an unknown requested terminal and rejects any non-null
`state.terminal` that differs from the requested terminal. The CLI also refuses to run without
exactly one of `--terminal` and `--phase`.

Against the fixed gate, the same fixture exits 1 and names both states. See
[`after.txt`](after.txt). The full structural and behavioral suite then exits 0.

## Boundary

This case proves one concrete gate failure was reproduced and closed. It does not prove a defect
rate, time saving, production adoption, or the complete multi-phase workflow.
