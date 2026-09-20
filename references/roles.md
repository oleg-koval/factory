# Roles

The factory calls roles. A binding maps a role to one installed skill, script, or factory
built-in subagent contract. Phase files name roles only.

## Contracts

| role | input | output | receipt |
|---|---|---|---|
| `ticket-reader` | source id or url | normalized text, links, owner | fetched record quoted |
| `ac-extractor` | normalized text | AC-1..n, each testable | list written to intake.md |
| `knowledge-lookup` | topic list | relevant captured gotchas only | file paths returned |
| `investigator` | symptom + repo | root cause with file:line and command receipts | receipts in diagnosis.md |
| `payload-reducer` | failing payload + oracle | minimal repro | before/after size |
| `repro-harness` | incident description + repo | isolated reproducible scenario | scenario run output |
| `reuse-index` | planned touchpoints | existing symbols to reuse, ranked | index attached to briefs |
| `implementer` | one milestone task, tests, reuse index, `state.baseline` | diff, new tests pass, rest of suite no worse than baseline | test run output compared to baseline |
| `fixer` | verified findings | diff | re-run output |
| `e2e-tester` | milestone AC, kind | failing e2e tests | run output shows FAIL for the right reason |
| `teeth-check` | the fix lines, the test id, the repo test command | the test proven to fail without the fix | quoted failing run with the fix reverted, then the restore |
| `milestone-reviewer` | diff, agent-plan entry, checklist, the milestone's invariants and the earlier diffs touching them | PASS or FIX with findings | verdict text |
| `plan-equivalence` | human-plan.md, agent-plan.md | SAME-SCOPE or MISMATCH with list | verdict text |
| `whole-change-review` | branch, target branch | findings with proof, optional fix | review file path (built-in `factory-whole-change-reviewer`) |
| `polish` | diff | comments stripped, names fixed | diff stat |
| `pr-opener` | branch | draft PR url | url (built-in, the steps in `phase-6-stop.md` section "Open the PR") |
| `human-gate` | plan file, annotations path | annotations file or "no annotations" | wrapper stdout |
| `mechanical-leaf` | exact edit or commit instruction | done | sha or diff |

## Discovery

Run when no config resolves a role, or when a bound name is not installed.

1. Enumerate candidates from the skill list in this session, the active provider's skill and
   plugin directories, the repository's agent configuration, and the factory's own
   `agents/factory-*.md` prompt contracts. Read only frontmatter name and description.
   Read only frontmatter `name` and `description`.
2. For each role, rank candidates by description match to the contract row above. Keep at most
   three per role. Add `built-in` where `agents/factory-<role>.md` exists. Use `none` when the
   list is empty.
3. Present one table: role, recommended, alternatives, source of recommendation. Ask the user
   about disputed roles in one concise batch of at most three questions; the user edits the
   rest by naming `role=skill` pairs.
4. Save to `~/.factory/roles.json` (or the repo override when the user says so) with
   `source: "discovery"` or `"user"`. Nothing else runs until the file is written and re-read.

## Config resolution

Order: `<repo>/.factory/roles.json`, then `~/.factory/roles.json`, then discovery.
`--config` with no pairs prints the resolved table with each binding's source and asks which
roles to rebind. `--config role=name [...]` rebinds those roles, validates each name is
installed, saves, re-reads, prints the table.

## Portable defaults

Use factory built-ins for roles that can be expressed by the contracts above. Bind
`ticket-reader` to a provider-specific skill only when that source needs one. Bind
`human-gate` to a local review script only when it is installed and executable. Never claim an
external integration is available merely because the role has a name.
