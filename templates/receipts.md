# Receipts

Append-only. One row per meaningful action, newest at the bottom. This file exists because
receipts used to live in `state.json`, which is the one file carried across every compaction:
a real run pushed it to 43KB, of which 21KB was receipts, and every compaction paid for all of
it. `scripts/gate.py` refuses a terminal state when `state.json` exceeds 4KB.

Never rewrite a row. A correction is a new row that says what it corrects. Phase 6 sums the
`tokens` column and states sessions used.

| at | phase | role | command | sha | tokens | result |
|---|---|---|---|---|---|---|
| 2026-09-15T10:12:00Z | 1 | investigate | `npm test -- orders.spec.ts` | - | 8400 | root cause at web/services/orders/sync.ts:88 |
| 2026-09-15T14:02:00Z | 4 | teeth-check | `npm test -- services/orders/sync.test.ts` | - | 5100 | with the cap line reverted 6 pass / 1 fail, the failing test is the new one; restored to 7/7 |
| 2026-09-15T14:20:00Z | 4 | mechanical-leaf | `git commit` | 4f1c9a20 | 2200 | factory(M1): carry tags through the recreate path |
| 2026-09-15T14:30:00Z | 4 | orchestrator | `python3 scripts/gate.py .factory/gic-1414-order-tags --phase 4` | - | - | GATE: PASS |
