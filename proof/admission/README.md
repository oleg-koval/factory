# Admission model

The dispatcher serializes each admission. `Admit` models one successful non-forced push.
`Handoff` exposes a durable review PR, and `Consume` clears eligibility separately.
The claim and review entry overlap until `Release`, with one slot occupied throughout.
`Interrupt` models a worker or dispatcher stopping after the push. The reference survives.
A stopped worker's claim can be removed by the human `Abandon` action.

TLC checked three issues, two worker identities, and both cap values. With cap 1 both
workers can compete for the last slot. With cap 2 both can hold claims concurrently.
It checked the types, at most one owner per issue, one reservation per running worker,
and no admission beyond capacity. The search found 152 distinct states at cap 1 and
716 at cap 2, both to depth 16. The safety checks run without fairness assumptions.
Progress assumes a human eventually recovers or abandons interrupted runs and
makes decisions on review-ready PRs. An unattended dispatcher cannot guarantee this.

Run from this directory using TLC from the TLA+ v1.7.4 tools release:

```sh
java -cp /path/to/tla2tools.jar tlc2.TLC -config cap-1.cfg Admission
java -cp /path/to/tla2tools.jar tlc2.TLC -config cap-2.cfg Admission
```

The Git implementation tests run with `zsh tests/check.sh` after installing
`tests/requirements.txt`. Hypothesis generates reserve, retry, restart, handoff,
abandonment, and review decisions against a real local bare Git repository.
A separate test races two independent Git repositories for the same remote ref.
