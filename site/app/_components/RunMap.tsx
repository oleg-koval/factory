const macroStages = [
  {
    number: "01",
    title: "Understand",
    phases: "0 Intake / 0b Isolate / 1 Diagnose",
    body: "Turn a ticket into evidence, establish a clean baseline, and find the cause before proposing treatment.",
    tone: "understand",
  },
  {
    number: "02",
    title: "Decide",
    phases: "2 Human plan / 2b Grill",
    body: "You approve the plan and close the question frontier. Unanswered blockers stop the run.",
    tone: "decide",
  },
  {
    number: "03",
    title: "Build",
    phases: "3 Agent plan / 4 Milestones",
    body: "Preserve approved intent, write the failing test, implement one milestone, review, and commit.",
    tone: "build",
  },
  {
    number: "04",
    title: "Prove",
    phases: "5 Proof / 6 Stop",
    body: "Review the whole change, map every criterion to proof, then let the terminal gate name the outcome.",
    tone: "prove",
  },
] as const;

const phases = [
  {
    id: "0",
    title: "Intake",
    stage: "Understand",
    runsAs: "Opus",
    speaks: "Triage verdict",
    closesWhen: "intake.md is written",
    body: "Classify a ticket, Sentry URL, or written request. Separate the reported symptom from evidence and turn the ask into criteria that can fail.",
    gate: "gate.py --phase 0",
  },
  {
    id: "0b",
    title: "Isolate",
    stage: "Understand",
    runsAs: "Sonnet",
    speaks: "Where the run writes",
    closesWhen: "Worktree + baseline SHA, or your consent to in-place",
    body: "Create a worktree and branch from a recorded baseline. If isolation is impossible, Factory asks before touching the active checkout.",
    gate: "gate.py --phase 0b",
  },
  {
    id: "1",
    title: "Diagnosis",
    stage: "Understand",
    runsAs: "Opus",
    speaks: "Root-cause synthesis",
    closesWhen: "diagnosis.md exists; skipped at light depth",
    body: "Reproduce the problem, trace the cause, and use at most two leaf-agent attempts. Light-depth runs move from a proven baseline directly to planning.",
    gate: "gate.py --phase 1",
  },
  {
    id: "2",
    title: "Human plan",
    stage: "Decide",
    runsAs: "You",
    speaks: "Plan + rediff",
    closesWhen: "The plan contains a Flag key line",
    body: "Review what will change, the acceptance criteria, the decision flags, and the question frontier. Revise the diff until the plan is clean.",
    gate: "NEEDS-YOU",
  },
  {
    id: "2b",
    title: "Grill",
    stage: "Decide",
    runsAs: "You + one leaf per round",
    speaks: "One summary per round",
    closesWhen: "No blocking question remains unanswered",
    body: "Facts go to one leaf agent per round. Decisions come back to you one question at a time. Three rounds are allowed before an honest blocked state.",
    gate: "gate.py --phase 2b",
  },
  {
    id: "3",
    title: "Agent plan",
    stage: "Build",
    runsAs: "Opus",
    speaks: "Gate decision",
    closesWhen: "Invariants, M1 tracer, and SAME-SCOPE are recorded",
    body: "Translate the approved human plan into bounded milestones without changing its meaning. A plan-equivalence auditor gets one retry on mismatch.",
    gate: "gate.py --phase 3",
  },
  {
    id: "4",
    title: "Milestones",
    stage: "Build",
    runsAs: "Opus + leaves",
    speaks: "Per-milestone verdict",
    closesWhen: "Every milestone is complete with a commit SHA",
    body: "Work one milestone per fresh session. An end-to-end tester writes the failing test; implementation, review, and fixes stay bounded.",
    gate: "gate.py --phase 4",
  },
  {
    id: "5",
    title: "Proof",
    stage: "Prove",
    runsAs: "Opus + leaves",
    speaks: "Whole-change verdict",
    closesWhen: "Change scan + AC matrix + reviewer PASS",
    body: "Scan full changed files and callers, rerun the acceptance matrix, and use independent reviewers to challenge invariants and the whole change.",
    gate: "gate.py --phase 5",
  },
  {
    id: "6",
    title: "Stop",
    stage: "Prove",
    runsAs: "You",
    speaks: "Final report + PR URL",
    closesWhen: "Terminal state is set and the gate output is quoted",
    body: "Report tokens, sessions, receipts, and the draft PR. The record permits delivered, delivered-with-gaps, blocked, or intentionally-unchanged.",
    gate: "Terminal gate",
  },
] as const;

const stopSignals = [
  ["Next phase is 2, 2b, or 6", "Print NEEDS-YOU and exit 0. Run /factory resume <slug>, then rerun."],
  ["The closed phase gate says BLOCKED", "Print the reasons and exit 1. Nothing starts on an unpassed predecessor."],
  ["state.terminal is set", "Exit 0. The run is over."],
  ["sessions_used reaches sessions_max", "Exit 0 and name the cap."],
  ["Two sessions change neither phase nor milestone", "Rerun the gate for the reasons, then exit 1."],
  ["leaves_used exceeds leaves_max", "Block at the gate. Only a blocked terminal may still close."],
] as const;

const terminalStates = [
  ["delivered", "Every acceptance criterion is proven."],
  ["delivered-with-gaps", "Named gaps were explicitly accepted by you."],
  ["blocked", "A fact, decision, gate, or budget prevents correct delivery."],
  ["intentionally-unchanged", "Evidence shows that changing code is not the right treatment."],
] as const;

export function RunDownloads({ showExplore = true }: { showExplore?: boolean }) {
  return (
    <div className="run-downloads" aria-label="Factory run-map downloads">
      {showExplore ? (
        <a className="button button-primary" href="/how-it-works/">
          Explore the complete run <span aria-hidden="true">↗</span>
        </a>
      ) : null}
      <a className="text-link" href="/downloads/factory-run-flow-onepage.pdf" download>
        Screen map / PDF <span aria-hidden="true">↓</span>
      </a>
      <a className="text-link" href="/downloads/factory-run-flow-a4.pdf" download>
        Print edition / A4 <span aria-hidden="true">↓</span>
      </a>
    </div>
  );
}

export function RunMapOverview() {
  return (
    <section className="run-map-section" aria-labelledby="run-map-heading">
      <div className="section-heading">
        <p className="eyebrow">The actual run / nine gated phases</p>
        <h2 id="run-map-heading">One ticket in. One verified draft PR out.</h2>
        <p>
          Factory advances one phase per fresh session. The gate closes the phase;
          the record—not the chat—decides what may happen next.
        </p>
      </div>
      <ol className="macro-flow">
        {macroStages.map((stage) => (
          <li className={`macro-stage macro-${stage.tone}`} key={stage.title}>
            <div className="macro-stage-meta"><span>{stage.number}</span><i aria-hidden="true" /></div>
            <h3>{stage.title}</h3>
            <code>{stage.phases}</code>
            <p>{stage.body}</p>
          </li>
        ))}
      </ol>
      <div className="run-invariants" aria-label="Factory run invariants">
        <p>One phase per fresh session</p>
        <p>Only <code>state.json</code> crosses sessions</p>
        <p>Stops whenever a human is needed</p>
      </div>
      <RunDownloads />
    </section>
  );
}

export function CompleteRunMap() {
  return (
    <>
      <section className="run-contract" aria-labelledby="run-contract-heading">
        <div className="run-contract-heading">
          <div>
            <p className="eyebrow">Execution contract</p>
            <h2 id="run-contract-heading">Fresh context. Persistent evidence.</h2>
          </div>
          <p>
            <code>scripts/run.sh &lt;slug&gt;</code> runs exactly one phase, gates the phase
            that just closed, and stops whenever the next decision belongs to you.
          </p>
        </div>
        <div className="run-invariants run-invariants-dark">
          <p>One phase per fresh session</p>
          <p>Only <code>state.json</code> crosses sessions</p>
          <p>Every closed phase must pass its gate</p>
        </div>
        <div className="run-legend" aria-label="Run map legend">
          <span><i className="legend-autonomous" />Autonomous phase</span>
          <span><i className="legend-human" />Needs you</span>
          <span><i className="legend-leaf" />Leaf agents</span>
          <span><i className="legend-gate" />Executable gate</span>
          <span><i className="legend-terminal" />Terminal state</span>
        </div>
      </section>

      <section className="complete-run" aria-labelledby="complete-run-heading">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Phase map / 0 → 6</p>
          <h2 id="complete-run-heading">The complete run, without the tiny boxes.</h2>
        </div>
        <div className="run-stage-stack">
          {macroStages.map((stage) => {
            const stagePhases = phases.filter((phase) => phase.stage === stage.title);
            return (
              <details className={`run-stage run-stage-${stage.tone}`} key={stage.title} open>
                <summary>
                  <span>{stage.number}</span>
                  <strong>{stage.title}</strong>
                  <small>{stage.phases}</small>
                  <i aria-hidden="true">+</i>
                </summary>
                <ol className="phase-map-list">
                  {stagePhases.map((phase) => (
                    <li className={phase.runsAs.startsWith("You") ? "phase-card phase-human" : "phase-card"} key={phase.id}>
                      <div className="phase-card-head">
                        <span>{phase.id}</span>
                        <h3>{phase.title}</h3>
                        <code>{phase.gate}</code>
                      </div>
                      <p>{phase.body}</p>
                      <dl>
                        <div><dt>Runs as</dt><dd>{phase.runsAs}</dd></div>
                        <div><dt>Speaks</dt><dd>{phase.speaks}</dd></div>
                        <div><dt>Closes when</dt><dd>{phase.closesWhen}</dd></div>
                      </dl>
                    </li>
                  ))}
                </ol>
              </details>
            );
          })}
        </div>
      </section>

      <section className="run-decisions" aria-labelledby="run-decisions-heading">
        <div className="section-heading">
          <p className="eyebrow">Human boundary</p>
          <h2 id="run-decisions-heading">Factory knows when not to continue.</h2>
          <p>
            Isolation consent, plan approval, unanswered product questions, exhausted
            rounds, and the final claim remain explicit human boundaries.
          </p>
        </div>
        <div className="decision-grid">
          <article><span>01</span><h3>No worktree?</h3><p>Factory asks before working in place and records whose consent allowed it.</p></article>
          <article><span>02</span><h3>Open question?</h3><p>The grill returns one decision at a time. Code waits until the blocking frontier is empty.</p></article>
          <article><span>03</span><h3>Budget exhausted?</h3><p>The loop stops, names the cap, and reports what remains instead of quietly retrying.</p></article>
        </div>
      </section>

      <section className="run-stop-section" aria-labelledby="stop-loop-heading">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Bounded autonomy</p>
          <h2 id="stop-loop-heading">What stops the loop.</h2>
        </div>
        <div className="table-wrap run-stop-table">
          <table>
            <thead><tr><th scope="col">Signal</th><th scope="col"><code>run.sh</code> does</th></tr></thead>
            <tbody>
              {stopSignals.map(([signal, action]) => (
                <tr key={signal}><th scope="row">{signal}</th><td>{action}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="run-terminal-section" aria-labelledby="run-terminal-heading">
        <div>
          <p className="eyebrow">Terminal gate</p>
          <h2 id="run-terminal-heading">The record permits one ending.</h2>
        </div>
        <div className="run-terminal-grid">
          {terminalStates.map(([state, meaning]) => (
            <article key={state}><code>{state}</code><p>{meaning}</p></article>
          ))}
        </div>
      </section>

      <section className="run-download-section" aria-labelledby="run-download-heading">
        <div>
          <p className="eyebrow">Keep the map</p>
          <h2 id="run-download-heading">Screen it. Share it. Print it.</h2>
        </div>
        <div>
          <p>The long edition keeps the whole system on one canvas. The A4 edition splits the flow only at a phase boundary and repeats the reading context.</p>
          <RunDownloads showExplore={false} />
        </div>
      </section>
    </>
  );
}
