# Terminal gate specimen

Evidence status: runnable mechanical proof. This is a redacted reconstruction of the failure
shape that caused Factory's terminal gate to be written; it is not the original private run and
it is not a complete Factory delivery.

The historical run claimed `delivered` while five blocking questions were unanswered and two
acceptance criteria were marked `partly met`. The `false-delivery/` fixture preserves those
cardinalities without preserving private question text. The `honest-delivery/` fixture changes
only the proof state: every question has an answer and every criterion is `met`.

Run both through the same gate:

```bash
bash proof/terminal-gate/run.sh
```

Expected result:

- `false-delivery` exits 1 with `GATE: BLOCKED`, naming all five unanswered questions and both
  invalid acceptance-criterion rows.
- `honest-delivery` exits 0 with `GATE: PASS`.
- `mismatched-terminal` exits 1 when the file records `blocked` but the caller asks the gate to
  validate `delivered`. The pre-fix gate incorrectly passed this fixture.

The script fails if either case produces the wrong exit code or omits its expected verdict. This
proves the executable rule discriminates between the two states. It does not prove faster
delivery, lower defect rates, or adoption.
