"use client";

import { useState } from "react";
import manifest from "../../public/proof/manifest.json";
import gateResults from "../../public/proof/gate-results.json";

type ProofCase = {
  id: keyof typeof gateResults;
  claimId: string;
  label: string;
  verdict: string;
  code: string;
  counts: string[];
  reasons: string[];
  explanation: string;
  tone: "blocked" | "passed";
};

const cases: ProofCase[] = [
  {
    id: "false-delivery",
    claimId: "false-completion-is-rejected",
    label: "Refused delivery",
    verdict: "Not delivered",
    code: "exit=1 · GATE: BLOCKED",
    counts: ["5 unanswered", "2 invalid"],
    reasons: [
      "Five blocking questions have no recorded answer.",
      "Two acceptance criteria use the invalid status partly met.",
      "The requested delivered state is unsupported by the record.",
    ],
    explanation:
      "The evidence is insufficient. Factory refuses to call the work delivered and names what is missing.",
    tone: "blocked",
  },
  {
    id: "honest-delivery",
    claimId: "valid-completion-is-accepted",
    label: "Honest delivery",
    verdict: "Delivered",
    code: "exit=0 · GATE: PASS",
    counts: ["5 answered", "2 met"],
    reasons: [
      "Every represented blocking question has an answer.",
      "Every represented acceptance criterion is met.",
      "The recorded and requested terminal states agree.",
    ],
    explanation:
      "This proves the gate accepts this redacted fixture. It is not a complete multi-phase Factory delivery run.",
    tone: "passed",
  },
  {
    id: "gate-bug",
    claimId: "terminal-mismatch-bypass-is-closed",
    label: "Gate bug",
    verdict: "Contradiction caught",
    code: "exit=1 · MISMATCH",
    counts: ["recorded blocked", "requested delivered"],
    reasons: [
      "The old gate trusted only the command-line request.",
      "The regression fixture preserves the contradictory states.",
      "The current gate rejects the mismatch and names both values.",
    ],
    explanation:
      "The gate itself had a bypass. Factory keeps the before-and-after case visible because quality systems must be falsifiable too.",
    tone: "blocked",
  },
];

export function ProofExplorer() {
  const [activeId, setActiveId] = useState(cases[0].id);
  const active = cases.find((item) => item.id === activeId) ?? cases[0];
  const claim = manifest.claims.find((item) => item.id === active.claimId);
  const stateArtifact = claim?.artifacts.find((artifact) => artifact.endsWith("/state.json"));

  return (
    <div className="proof-explorer">
      <div className="proof-tabs" role="group" aria-label="Choose an executable gate fixture">
        {cases.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={active.id === item.id}
            onClick={() => setActiveId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <article
        className={`proof-stage proof-${active.tone}`}
        id={`${active.id}-proof`}
      >
        <div className="proof-summary">
          <div className="proof-state">
            <span className="state-label">Recorded state</span>
            <strong>{active.verdict}</strong>
            <span className="state-code">{active.code}</span>
          </div>
          <div className="proof-counts" role="group" aria-label="Gate result counts">
            {active.counts.map((count) => <span key={count}>{count}</span>)}
          </div>
        </div>

        <div className="proof-grid">
          <div className="terminal-panel">
            <div className="panel-bar">
              <span>terminal</span>
              <span>factory gate</span>
            </div>
            <pre role="region" aria-label="Factory gate output" tabIndex={0}><code>{gateResults[active.id]}</code></pre>
          </div>
          <div className="reason-panel">
            <p className="panel-kicker">Why this verdict</p>
            <ol>
              {active.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ol>
            <div className="blocked-explainer">
              <strong>{active.tone === "passed" ? "Evidence boundary" : "What blocked means"}</strong>
              <p>{active.explanation}</p>
            </div>
          </div>
        </div>

        <div className="artifact-row">
          <span className="artifact-label">Receipts</span>
          <a href="/proof/#manifest"><span>proof manifest</span><span aria-hidden="true">↗</span></a>
          {stateArtifact ? <a href={`https://github.com/oleg-koval/factory/blob/main/${stateArtifact}`}><span>fixture state</span><span aria-hidden="true">↗</span></a> : null}
          <a href="/proof/terminal-gate.txt"><span>complete gate output</span><span aria-hidden="true">↗</span></a>
        </div>
      </article>
    </div>
  );
}
