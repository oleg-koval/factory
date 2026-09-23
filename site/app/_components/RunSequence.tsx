"use client";

import { useEffect, useState } from "react";

const scenes = [
  {
    number: "01",
    title: "Intake",
    phase: "0 → 1",
    receipt: "Ticket → criteria → diagnosis",
    detail: "The request becomes testable criteria in an isolated worktree.",
  },
  {
    number: "02",
    title: "Human plan",
    phase: "2 → 2b",
    receipt: "NEEDS-YOU",
    detail: "The run waits for your decision. Open questions cannot be waved through.",
  },
  {
    number: "03",
    title: "Build",
    phase: "3 → 4",
    receipt: "Test: red → green → red",
    detail: "A failing test leads the change; removing the fix makes it fail again.",
  },
  {
    number: "04",
    title: "Proof",
    phase: "5 → 6",
    receipt: "Review → matrix → terminal gate",
    detail: "Independent review and the acceptance matrix decide the final claim.",
  },
] as const;

type Ending = "delivered" | "blocked" | "intentionally-unchanged" | null;

export function RunSequence() {
  const [step, setStep] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [ending, setEnding] = useState<Ending>(null);

  useEffect(() => {
    if (paused || ending || step < 0 || step === 1 || step === 4) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reducedMotion ? 120 : step === 0 ? 1800 : 2100;
    const timeout = window.setTimeout(() => {
      if (step === 3) {
        setStep(4);
        setEnding("delivered");
      } else {
        setStep(step + 1);
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [step, paused, ending]);

  function replay() {
    setEnding(null);
    setPaused(false);
    setStep(0);
  }

  function stop(outcome: Exclude<Ending, null>) {
    setPaused(false);
    setEnding(outcome);
    setStep(4);
  }

  const active = step >= 0 && step < scenes.length ? scenes[step] : null;
  const progress = step < 0 ? 0 : step === 4 ? 1 : step / scenes.length;

  return (
    <div className="run-sequence" id="run-flow" role="region" aria-label="Illustrated Factory delivery flow">
      <div className="run-sequence-topline">
        <div>
          <p className="eyebrow">Run the ticket / interactive specimen</p>
          <h3>See where the run stops.</h3>
        </div>
        <p>Illustrative sequence. No agent or code runs in this browser.</p>
      </div>

      <div className="run-sequence-track" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <ol className="run-sequence-scenes">
        {scenes.map((scene, index) => (
          <li
            className={step === index ? "run-sequence-scene is-active" : step > index ? "run-sequence-scene is-past" : "run-sequence-scene"}
            key={scene.number}
          >
            <div className="run-sequence-scene-head"><span>{scene.number}</span><i aria-hidden="true" /></div>
            <h4>{scene.title}</h4>
            <small>Phase {scene.phase}</small>
            <p>{scene.receipt}</p>
          </li>
        ))}
      </ol>

      <div className="run-sequence-console">
        <div className="run-sequence-status" role="status" aria-live="polite">
          <span className="run-sequence-label">{ending ? "Terminal state" : step === 1 ? "Human gate" : active ? "Current receipt" : "Ready"}</span>
          {ending ? (
            <p>
              <strong className={`run-sequence-stamp is-${ending}`}>
                {ending === "intentionally-unchanged" ? "UNCHANGED" : ending.toUpperCase()}
              </strong>
              <span>{ending === "blocked" ? "Questions remain. The run cannot advance." : ending === "intentionally-unchanged" ? "The diagnosis shows no code change is needed." : "Every criterion has evidence and the terminal gate passes."}</span>
            </p>
          ) : (
            <p><strong>{active?.receipt ?? "Ticket awaiting intake"}</strong><span>{active?.detail ?? "Start the sequence to see the gates."}</span></p>
          )}
        </div>
        <div className="run-sequence-controls">
          {step < 0 || ending ? (
            <button className="run-sequence-main-action" type="button" onClick={replay}>
              {ending ? "Replay the flow" : "Run the flow"} <span aria-hidden="true">↗</span>
            </button>
          ) : step === 1 ? (
            <>
              <button className="run-sequence-main-action" type="button" onClick={() => setStep(2)}>
                Approve the plan <span aria-hidden="true">→</span>
              </button>
              <button className="run-sequence-secondary-action" type="button" onClick={() => stop("blocked")}>
                Questions remain / block
              </button>
              <button className="run-sequence-secondary-action" type="button" onClick={() => stop("intentionally-unchanged")}>
                No code change needed
              </button>
            </>
          ) : (
            <button className="run-sequence-secondary-action" type="button" onClick={() => setPaused(!paused)}>
              {paused ? "Resume sequence" : "Pause sequence"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
