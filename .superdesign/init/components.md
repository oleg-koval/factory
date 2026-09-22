# Shared UI components

## `site/app/_components/ProofExplorer.tsx`

Client-side proof-state selector. It renders the recorded verdict, terminal output, reasons, and artifact links.

```tsx
"use client";

import { useState } from "react";

type ProofCase = {
  id: string;
  label: string;
  verdict: string;
  code: string;
  counts: string[];
  output: string;
  reasons: string[];
  explanation: string;
  tone: "blocked" | "passed";
};

const cases: ProofCase[] = [
  {
    id: "false-delivery",
    label: "Refused delivery",
    verdict: "Not delivered",
    code: "exit=1 · GATE: BLOCKED",
    counts: ["5 unanswered", "2 invalid"],
    output: `$ bash proof/terminal-gate/run.sh\nchecking manifest .......... ok\nchecking delivery answers .. 5 unanswered\nchecking reported checks ... 2 invalid\n\nGATE: BLOCKED\ndelivery_status=not_delivered\nexit=1`,
    reasons: [
      "Five blocking questions have no recorded answer.",
      "Two acceptance criteria use the invalid status partly met.",
      "The requested delivered state is unsupported by the record.",
    ],
    explanation: "The evidence is insufficient. Factory refuses to call the work delivered and names what is missing.",
    tone: "blocked",
  },
  {
    id: "honest-delivery",
    label: "Honest delivery",
    verdict: "Delivered",
    code: "exit=0 · GATE: PASS",
    counts: ["5 answered", "2 met"],
    output: `$ python3 scripts/gate.py proof/terminal-gate/honest-delivery --terminal delivered\nchecking manifest .......... ok\nchecking delivery answers .. complete\nchecking reported checks ... met\n\nGATE: PASS  run=honest-delivery terminal=delivered matrix=clean\nexit=0`,
    reasons: [
      "Every represented blocking question has an answer.",
      "Every represented acceptance criterion is met.",
      "The recorded and requested terminal states agree.",
    ],
    explanation: "This proves the gate accepts this redacted fixture. It is not a complete multi-phase Factory delivery run.",
    tone: "passed",
  },
  {
    id: "gate-bug",
    label: "Gate bug",
    verdict: "Contradiction caught",
    code: "exit=1 · MISMATCH",
    counts: ["recorded blocked", "requested delivered"],
    output: `$ python3 scripts/gate.py proof/terminal-gate/mismatched-terminal --terminal delivered\nchecking recorded terminal . blocked\nchecking requested terminal  delivered\n\nGATE: BLOCKED\nstate.terminal 'blocked' does not match requested terminal 'delivered'\nexit=1`,
    reasons: [
      "The old gate trusted only the command-line request.",
      "The regression fixture preserves the contradictory states.",
      "The current gate rejects the mismatch and names both values.",
    ],
    explanation: "The gate itself had a bypass. Factory keeps the before-and-after case visible because quality systems must be falsifiable too.",
    tone: "blocked",
  },
];

export function ProofExplorer() {
  const [activeId, setActiveId] = useState(cases[0].id);
  const active = cases.find((item) => item.id === activeId) ?? cases[0];
  return (
    <div className="proof-explorer">
      <div className="proof-tabs" aria-label="Choose a recorded Factory run">
        {cases.map((item) => (
          <button key={item.id} type="button" aria-pressed={active.id === item.id} onClick={() => setActiveId(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <article className={`proof-stage proof-${active.tone}`} id={`${active.id}-proof`}>
        <div className="proof-summary">
          <div className="proof-state">
            <span className="state-label">Recorded state</span>
            <strong>{active.verdict}</strong>
            <span className="state-code">{active.code}</span>
          </div>
          <div className="proof-counts" aria-label="Gate result counts">
            {active.counts.map((count) => <span key={count}>{count}</span>)}
          </div>
        </div>
        <div className="proof-grid">
          <div className="terminal-panel">
            <div className="panel-bar"><span>terminal</span><span>factory gate</span></div>
            <pre><code>{active.output}</code></pre>
          </div>
          <div className="reason-panel">
            <p className="panel-kicker">Why this verdict</p>
            <ol>{active.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ol>
            <div className="blocked-explainer">
              <strong>{active.tone === "passed" ? "Evidence boundary" : "What blocked means"}</strong>
              <p>{active.explanation}</p>
            </div>
          </div>
        </div>
        <div className="artifact-row">
          <span className="artifact-label">Receipts</span>
          <a href="/proof/#manifest"><span>proof manifest</span><span aria-hidden="true">↗</span></a>
          <a href="/proof/#fixtures"><span>fixture state</span><span aria-hidden="true">↗</span></a>
          <a href="/proof/#case-study"><span>case study</span><span aria-hidden="true">↗</span></a>
        </div>
      </article>
    </div>
  );
}
```

## `site/app/_components/StructuredData.tsx`

Server-rendered JSON-LD primitive.

```tsx
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```
