# Factory three-minute demo

Evidence status: operator script for the committed local proof. It does not claim a public
release, original-run provenance, adoption, speed, or defect reduction.

## Setup

Run from the repository root:

```bash
bash scripts/demo.sh
```

The command is non-interactive, needs no network access, and should finish in seconds. Keep the
terminal large enough to show the complete refusal. Do not hide the boundary printed at the end.

## 0:00 - The completion claim

Say: "This run says `delivered`. But its own record still contains five unanswered blocking
questions and two acceptance criteria with a status the contract does not permit."

Point to the first generated line. The runner derives all three values from
`false-delivery/state.json` and `false-delivery/ac-matrix.md`; they are not presentation text.

## 0:30 - The refusal

Say: "A normal agent can summarize those contradictions away. Factory has to pass them through
an executable terminal gate."

The first case exits 1 and names every unanswered question and invalid acceptance-criterion row.
Do not paraphrase the output. Let the gate make the argument.

## 1:20 - The corrected record

Say: "This uses the same gate. The only meaningful difference is that every represented
question has an answer and every represented criterion is `met`."

The honest fixture exits 0. The contrast is the product: Factory is not a workflow that always
finds a way to return green.

## 1:50 - The gate's own scar

Say: "While preparing this proof, I found that the gate itself trusted the requested terminal
without comparing it with the state the run had recorded."

The last pair of lines is derived from the committed before-and-after receipts. The baseline gate
passed a request for `delivered` against a record that said `blocked`; the fixed gate refuses it.

## 2:30 - The category

Say: "Software factories already know how to isolate, build, prove, and ship. Factory is the
quality system underneath that conveyor belt: the contract that decides whether the evidence
earns the word delivered."

End on the printed evidence boundary. Then invite inspection of the fixture, regression patch,
and current gate. Do not make performance or adoption claims.

## Success condition

The walkthrough is ready for a recorded or live demo when:

- `bash scripts/demo.sh` exits 0;
- the false, honest, and mismatched fixtures show their expected terminal results;
- a fresh spoken run completes in under three minutes without skipping the evidence boundary;
- the public proof URL points to the same committed artifacts.
