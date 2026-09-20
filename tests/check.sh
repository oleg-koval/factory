#!/bin/zsh
# Structural tests for the factory skill. Exit 0 = all pass.
set -u
[ -n "${ZSH_VERSION:-}" ] || { echo "run with zsh: zsh tests/check.sh"; exit 2; }
root=${0:a:h:h}
fail=0
f() { print -r -- "FAIL $1"; fail=1; }

# T1 skeleton
[[ -f $root/SKILL.md ]] || f "SKILL.md missing"
head -1 $root/SKILL.md | grep -q '^---$' || f "SKILL.md has no frontmatter"
grep -q '^name: factory$' $root/SKILL.md || f "SKILL.md name != factory"
grep -q '^description:' $root/SKILL.md || f "SKILL.md has no description"
for s in "## Arguments" "## Role resolution" "## Phase dispatch" "## Tier and token rules" "## Terminal states"; do
  grep -qF "$s" $root/SKILL.md || f "SKILL.md missing section: $s"
done
grep -rEn 'TBD|TODO|implement later' $root/SKILL.md $root/references $root/agents 2>/dev/null && f "placeholder text found"
grep -rn -- '—' $root/SKILL.md $root/references $root/agents 2>/dev/null && f "em-dash found"

# T2 roles
roles=(ticket-reader ac-extractor knowledge-lookup investigator payload-reducer repro-harness reuse-index implementer fixer e2e-tester teeth-check milestone-reviewer plan-equivalence whole-change-review polish pr-opener human-gate mechanical-leaf)
[[ -f $root/references/roles.md ]] || f "roles.md missing"
for r in $roles; do grep -q "^| \`$r\`" $root/references/roles.md || f "roles.md missing role $r"; done
python3 -c "
import json
d = json.load(open('$root/templates/roles.json'))
b = d['bindings']
for role in ('whole-change-review', 'pr-opener'):
    assert b[role]['kind'] == 'built-in', (role, b[role])
for role, binding in b.items():
    if binding['kind'] == 'skill':
        assert 'lekker' not in binding['name'] and 'push-pr' not in binding['name'], (role, binding)
" || f "roles.json binds whole-change-review/pr-opener wrong, or a skill binding matches lekker|push-pr"
grep -q "## Discovery" $root/references/roles.md || f "roles.md missing Discovery section"
grep -q "## Config resolution" $root/references/roles.md || f "roles.md missing Config resolution"
python3 -c "import json,sys;d=json.load(open('$root/templates/roles.json'));assert d['version']==1;b=d['bindings'];assert set(b)=={$(printf "'%s'," $roles)};[b[k]['kind'] in ('skill','script','built-in','none') or sys.exit(1) for k in b]" || f "roles.json template invalid"

# T3 agents
for a in factory-e2e-tester factory-milestone-reviewer factory-plan-equivalence factory-whole-change-reviewer; do
  af=$root/agents/$a.md
  [[ -f $af ]] || { f "agent $a missing"; continue; }
  grep -q "^name: $a$" $af || f "$a name mismatch"
  grep -q "^model:" $af && f "$a hard-codes a provider model"
  grep -q "^tools:" $af && f "$a uses unsupported Claude agent metadata"
done
grep -q "Edit" $root/agents/factory-milestone-reviewer.md && grep -q "^tools:.*Edit" $root/agents/factory-milestone-reviewer.md && f "reviewer must be read-only"
grep -q "^tools:.*Edit" $root/agents/factory-plan-equivalence.md && f "equivalence must be read-only"
grep -q "VERDICT: PASS" $root/agents/factory-milestone-reviewer.md || f "reviewer lacks verdict contract"
grep -q "VERDICT: SAME-SCOPE" $root/agents/factory-plan-equivalence.md || f "equivalence lacks verdict contract"
grep -q "FAIL for the right reason" $root/agents/factory-e2e-tester.md || f "tester lacks watch-it-fail rule"
grep -q "^tools:.*Edit" $root/agents/factory-whole-change-reviewer.md && f "whole-change-reviewer must be read-only"
grep -q "^tools:.*Write" $root/agents/factory-whole-change-reviewer.md && f "whole-change-reviewer must be read-only"
grep -q "VERDICT: PASS" $root/agents/factory-whole-change-reviewer.md || f "whole-change-reviewer lacks verdict contract"

# T4 briefs + state
[[ -f $root/references/briefs.md ]] || f "briefs.md missing"
for h in "Run" "Role" "Goal" "Inputs" "Files you may write" "Done when" "Report"; do grep -q "^### $h" $root/references/briefs.md || f "briefs.md missing heading $h"; done
python3 -c "
import json,os;path='$root/templates/state.json';d=json.load(open(path))
for k in ['slug','source','input','class','depth','phase','milestone','bindings_file','isolation','baseline','open_questions','milestones','files','loops','terminal']: assert k in d, k
assert 'receipts' not in d, 'receipts belongs in receipts.md, not state.json'
assert isinstance(d['phase'], str), 'phase must be a string so 0b is representable'
assert set(d['loops'])=={'reproduce','plan_equivalence','fixer'}
for k in ('grill', 'budget', 'gaps'): assert k in d, k
assert 'accepted_by' in d['isolation'], 'isolation.accepted_by missing'
for k in ('leaves_max', 'leaves_used', 'sessions_max', 'sessions_used'): assert k in d['budget'], k
assert os.path.getsize(path) < 4096, os.path.getsize(path)
" || f "state.json template invalid"
[[ -f $root/templates/receipts.md ]] || f "receipts.md template missing"
grep -q '^| at | phase | role | command | sha | tokens | result |' $root/templates/receipts.md || f "receipts.md header wrong"
grep -q '^| AC | test id | kind | status | reason | owner | commit |' $root/templates/ac-matrix.md || f "ac-matrix header wrong"

# T5 phase 0/1
for ph in 0-intake 0b-isolate 1-diagnosis 2-human-plan 2b-grill 3-agent-plan 4-milestones 5-proof 6-stop; do
  [[ -f $root/references/phase-$ph.md ]] || f "phase-$ph.md missing"
  grep -q "references/phase-$ph.md" $root/SKILL.md || f "SKILL.md does not dispatch phase-$ph"
done
for pf in $root/references/phase-*.md; do
  grep -q "## Close" $pf || f "$pf:t missing ## Close"
  grep -q -- "--phase" $pf || f "$pf:t missing --phase"
  grep -q "run.sh" $pf || f "$pf:t missing run.sh"
  count=$(grep -c "compaction is the fallback" $pf)
  (( count <= 1 )) || f "$pf:t has $count 'compaction is the fallback' hits, want at most 1"
done
grep -q "consult" $root/references/phase-0-intake.md || f "phase 0 lacks consult mode"
for r in ticket-reader ac-extractor knowledge-lookup; do grep -q "\`$r\`" $root/references/phase-0-intake.md || f "phase 0 does not use role $r"; done
grep -qE "light|full" $root/references/phase-0-intake.md || f "phase 0 lacks depth"
for r in investigator payload-reducer repro-harness; do grep -q "\`$r\`" $root/references/phase-1-diagnosis.md || f "phase 1 does not use role $r"; done
for t in no-change config-or-data patch feature refactor; do grep -q "$t" $root/references/phase-1-diagnosis.md || f "phase 1 lacks treatment $t"; done
grep -q "two identical" $root/references/phase-1-diagnosis.md || f "phase 1 lacks reproduce stopping rule"
# no hard-coded skill names in phase files
grep -nE "linear-read|fsd-|find-knowledge|ddmin|lekker|revdiff-plan|push-pr|leaf-mechanical" $root/references/phase-*.md && f "phase file hard-codes a skill name"

# T6 phase 2/3
for h in "What is wrong" "Why" "What will change" "What will not change" "Risks and trade-offs" "Release safety" "Acceptance criteria" "Milestones" "Open questions"; do
  grep -q "$h" $root/references/phase-2-human-plan.md || f "phase 2 lacks section $h"
done
grep -q "\`human-gate\`" $root/references/phase-2-human-plan.md || f "phase 2 lacks human-gate role"
grep -q "no annotations" $root/references/phase-2-human-plan.md || f "phase 2 lacks empty-review rule"
grep -q "\`plan-equivalence\`" $root/references/phase-3-agent-plan.md || f "phase 3 lacks equivalence role"
grep -q "\`reuse-index\`" $root/references/phase-3-agent-plan.md || f "phase 3 lacks reuse-index role"
for k in "ac:" "e2e:" "tasks:" "review-checklist:" "budget:"; do grep -q "$k" $root/references/phase-3-agent-plan.md || f "phase 3 lacks milestone key $k"; done
grep -q "Filled in by a later task" $root/references/phase-2-human-plan.md && f "phase 2 still a stub"
grep -q "Filled in by a later task" $root/references/phase-3-agent-plan.md && f "phase 3 still a stub"
grep -q "Flag key:" $root/references/phase-2-human-plan.md || f "phase 2 lacks Flag key:"
grep -qE "kind: fact\|decision" $root/references/phase-2-human-plan.md || f "phase 2 lacks kind: fact|decision"
grep -q "rounds_max" $root/references/phase-2b-grill.md || f "phase 2b lacks rounds_max"
grep -q "(Recommended)" $root/references/phase-2b-grill.md || f "phase 2b lacks (Recommended)"
grep -q "concise batch" $root/references/phase-2b-grill.md || f "phase 2b lacks batched user decision rule"
grep -q "tracer" $root/references/phase-3-agent-plan.md || f "phase 3 lacks tracer"
grep -q "tracer" $root/agents/factory-plan-equivalence.md || f "plan-equivalence agent lacks tracer"
grep -q -- "- 6:" $root/agents/factory-plan-equivalence.md || f "plan-equivalence agent lacks '- 6:'"

# T7 phase 4
f4=$root/references/phase-4-milestones.md
grep -q "Filled in by a later task" $f4 && f "phase 4 still a stub"
for r in e2e-tester implementer mechanical-leaf milestone-reviewer fixer; do grep -q "\`$r\`" $f4 || f "phase 4 lacks role $r"; done
grep -q "FAIL for the right reason" $f4 || f "phase 4 lacks watch-it-fail step"
grep -q "factory(M" $f4 || f "phase 4 lacks checkpoint commit format"
grep -q "VERDICT: FIX" $f4 || f "phase 4 lacks reviewer verdict handling"
grep -q "third" $f4 || f "phase 4 lacks third-FIX stop rule"
grep -qi "compact" $f4 || f "phase 4 lacks compaction point"
grep -q "light" $f4 || f "phase 4 lacks depth == light near reviewer step"

# T8 phase 5/6
f5=$root/references/phase-5-proof.md; f6=$root/references/phase-6-stop.md
grep -q "Filled in by a later task" $f5 && f "phase 5 still a stub"
grep -q "Filled in by a later task" $f6 && f "phase 6 still a stub"
for r in whole-change-review polish; do grep -q "\`$r\`" $f5 || f "phase 5 lacks role $r"; done
grep -q "plan failure" $f5 || f "phase 5 lacks Critical-is-plan-failure rule"
grep -q "ac-matrix" $f5 || f "phase 5 does not check the AC matrix"
grep -qE "at most 4|four" $f5 || f "phase 5 lacks the four invariant leaves cap"
grep -q "\`pr-opener\`" $f6 || f "phase 6 lacks pr-opener role"
grep -q "scripts/gate.py" $f6 || f "phase 6 does not run the gate script"
grep -q "verbatim" $f6 || f "phase 6 does not quote the gate output"
grep -q "not yet automated" $f6 || f "phase 6 lacks v2 handoff wording"
grep -q "delivered" $f6 || f "phase 6 lacks terminal state"
grep -q "Open the PR" $f6 || f "phase 6 lacks 'Open the PR'"
grep -q -- "--body-file" $f6 || f "phase 6 lacks --body-file"
grep -q "TL;DR (for humans)" $f6 || f "phase 6 lacks TL;DR (for humans)"
grep -q "gaps.accepted_by" $f6 || f "phase 6 lacks gaps.accepted_by"
grep -q -- "--porcelain" $f6 || f "phase 6 lacks --porcelain"
grep -q "git add" $f6 && f "phase 6 must not contain 'git add'"

# T9 isolation, scripts and gates
f0b=$root/references/phase-0b-isolate.md
grep -q "worktree add" $f0b || f "phase 0b does not create a worktree"
grep -q "in-place" $f0b || f "phase 0b lacks the in-place fallback"
grep -q "baseline" $f0b || f "phase 0b does not measure the baseline"
grep -q "isolation" $root/SKILL.md || f "SKILL.md does not mention isolation"
grep -q "state.isolation.worktree" $root/SKILL.md || f "SKILL.md does not pin leaf cwd to the worktree"
grep -q "delivered-with-gaps" $root/SKILL.md || f "SKILL.md lacks the delivered-with-gaps terminal"
for s in gate.py change-scan.sh hard-rules.py; do
  [[ -x $root/scripts/$s ]] || f "scripts/$s missing or not executable"
done
grep -q "change-scan.sh" $f5 || f "phase 5 does not run the change scan"
python3 -c "import ast;ast.parse(open('$root/scripts/gate.py').read())" || f "gate.py does not parse"
python3 -c "import ast;ast.parse(open('$root/scripts/hard-rules.py').read())" || f "hard-rules.py does not parse"
bash -n $root/scripts/change-scan.sh || f "change-scan.sh does not parse"
[[ -x $root/scripts/run.sh ]] || f "run.sh missing or not executable"
bash -n $root/scripts/run.sh || f "run.sh does not parse"
dryrun_dir=$(mktemp -d)
mkdir -p "$dryrun_dir/.factory/dryslug"
python3 -c "
import json
json.dump({'slug': 'dryslug', 'source': 'linear', 'input': 'X-1', 'class': 'bug',
           'depth': 'full', 'phase': '0b', 'bindings_file': 'x',
           'loops': {'reproduce': 0, 'plan_equivalence': 0, 'fixer': {}},
           'terminal': None, 'budget': {'sessions_max': 16}},
          open('$dryrun_dir/.factory/dryslug/state.json', 'w'))
"
dryrun_out=$(cd "$dryrun_dir" && bash $root/scripts/run.sh dryslug --runner codex --dry-run 2>&1)
print -r -- "$dryrun_out" | grep -q "0b" || f "run.sh --dry-run output lacks 0b"
print -r -- "$dryrun_out" | grep -q "configured_model=default" || f "run.sh --dry-run output lacks configured model"
rm -rf "$dryrun_dir"
# run.sh gates the phase that just closed (state.phase) before starting the next one
gaterun_dir=$(mktemp -d)
mkdir -p "$gaterun_dir/.factory/gateslug" "$gaterun_dir/fakebin"
cat > "$gaterun_dir/fakebin/codex" <<'FAKECODEX'
#!/usr/bin/env bash
touch "$(dirname "$0")/../codex-was-called"
exit 0
FAKECODEX
chmod +x "$gaterun_dir/fakebin/codex"

python3 -c "
import json
json.dump({'slug': 'gateslug', 'source': 'linear', 'input': 'X-1', 'class': 'bug',
           'depth': 'full', 'phase': '0', 'next': '1', 'bindings_file': 'x',
           'loops': {'reproduce': 0, 'plan_equivalence': 0, 'fixer': {}},
           'terminal': None, 'budget': {'sessions_max': 16}},
          open('$gaterun_dir/.factory/gateslug/state.json', 'w'))
"
gate_out=$(cd "$gaterun_dir" && PATH="$gaterun_dir/fakebin:$PATH" bash $root/scripts/run.sh gateslug --runner codex 2>&1)
gate_rc=$?
(( gate_rc == 1 )) || f "run.sh did not exit 1 when the closed phase's gate blocks"
print -r -- "$gate_out" | grep -q "gate blocked on phase 0" || f "run.sh --phase gate output lacks 'gate blocked on phase 0'"
[[ -f "$gaterun_dir/codex-was-called" ]] && f "run.sh invoked codex despite a blocked gate"
rm -f "$gaterun_dir/codex-was-called"

python3 -c "
import json
json.dump({'slug': 'gateslug', 'source': 'linear', 'input': 'X-1', 'class': 'bug',
           'depth': 'full', 'phase': None, 'next': '0', 'bindings_file': 'x',
           'loops': {'reproduce': 0, 'plan_equivalence': 0, 'fixer': {}},
           'terminal': None, 'budget': {'sessions_max': 16}},
          open('$gaterun_dir/.factory/gateslug/state.json', 'w'))
"
gate_out2=$(cd "$gaterun_dir" && PATH="$gaterun_dir/fakebin:$PATH" bash $root/scripts/run.sh gateslug --runner codex 2>&1)
print -r -- "$gate_out2" | grep -q "gate blocked" && f "run.sh gated a fresh run with no closed phase"
[[ -f "$gaterun_dir/codex-was-called" ]] || f "run.sh did not invoke codex when there is no closed phase to gate"
rm -rf "$gaterun_dir"

# The provider-neutral runner must execute Claude with its native skill syntax too.
clauderun_dir=$(mktemp -d)
mkdir -p "$clauderun_dir/.factory/claudeslug" "$clauderun_dir/fakebin"
cat > "$clauderun_dir/fakebin/claude" <<'FAKECLAUDE'
#!/usr/bin/env bash
printf '%s\n' "$@" > claude-args
python3 - <<'PY'
import json
path = '.factory/claudeslug/state.json'
with open(path) as handle:
    state = json.load(handle)
state['terminal'] = 'intentionally-unchanged'
with open(path, 'w') as handle:
    json.dump(state, handle)
PY
FAKECLAUDE
chmod +x "$clauderun_dir/fakebin/claude"
python3 -c "
import json
json.dump({'slug': 'claudeslug', 'source': 'text', 'input': 'test', 'class': 'question',
           'depth': 'light', 'phase': None, 'next': '0', 'bindings_file': 'x',
           'loops': {'reproduce': 0, 'plan_equivalence': 0, 'fixer': {}},
           'terminal': None, 'budget': {'sessions_max': 2, 'sessions_used': 0}},
          open('$clauderun_dir/.factory/claudeslug/state.json', 'w'))
"
claude_out=$(cd "$clauderun_dir" && PATH="$clauderun_dir/fakebin:$PATH" bash $root/scripts/run.sh claudeslug --runner claude 2>&1)
claude_rc=$?
(( claude_rc == 0 )) || f "run.sh Claude branch exited $claude_rc"
grep -qx -- '-p' "$clauderun_dir/claude-args" || f "run.sh did not invoke Claude with -p"
grep -q '^/factory resume claudeslug' "$clauderun_dir/claude-args" || f "run.sh Claude prompt lacks /factory resume"
print -r -- "$claude_out" | grep -q 'terminal=intentionally-unchanged' || f "run.sh Claude branch did not observe terminal state"
rm -rf "$clauderun_dir"

grep -q "run.sh" $root/SKILL.md || f "SKILL.md does not mention run.sh"
grep -q "2b" $root/SKILL.md || f "SKILL.md does not mention 2b"
grep -q "leaves_max" $root/SKILL.md || f "SKILL.md does not mention leaves_max"
grep -q "tokens" $root/SKILL.md || f "SKILL.md does not mention tokens"

# T10 the gate, watched failing. A gate is untested until you see it block something.
python3 - "$root" <<'GATEPY' || f "gate.py behaviour wrong"
import json, os, subprocess, sys, tempfile

root = sys.argv[1]
gate = os.path.join(root, "scripts", "gate.py")
state = json.load(open(os.path.join(root, "templates", "state.json")))

def run(run_dir, terminal):
    out = subprocess.run([sys.executable, gate, run_dir, "--terminal", terminal],
                         capture_output=True, text=True)
    return out.returncode, out.stdout + out.stderr

def write(run_dir, questions, ac_status):
    state["open_questions"] = questions
    state["isolation"]["repo"] = run_dir
    state["isolation"]["worktree"] = run_dir
    json.dump(state, open(os.path.join(run_dir, "state.json"), "w"))
    open(os.path.join(run_dir, "receipts.md"), "w").write("| at | phase | role | command | sha | result |\n")
    open(os.path.join(run_dir, "ac-matrix.md"), "w").write(
        "| AC | test id | kind | status | reason | owner | commit |\n"
        "|---|---|---|---|---|---|---|\n"
        "| AC-1 | t1 | unit | %s | - | - | abc1234 |\n" % ac_status)

answered = [{"id": "B-1", "text": "q", "blocking": True, "owner": "o", "answer": "yes"}]
open_q = [{"id": "B-1", "text": "q", "blocking": True, "owner": "o", "answer": None}]
bare = ["a bare string, the shape that broke the old gate"]

with tempfile.TemporaryDirectory() as d:
    write(d, answered, "met")
    no_mode = subprocess.run([sys.executable, gate, d], capture_output=True, text=True)
    assert no_mode.returncode == 2 and "choose exactly one mode" in no_mode.stdout, no_mode.stdout + no_mode.stderr

    code, out = run(d, "victory")
    assert code == 1 and "requested terminal" in out, out

    write(d, open_q, "met")
    code, out = run(d, "delivered")
    assert code == 1 and "blocking and unanswered" in out, out

    write(d, bare, "met")
    code, out = run(d, "delivered")
    assert code == 1 and "not an object" in out, out

    write(d, answered, "partly met")
    code, out = run(d, "delivered")
    assert code == 1 and "partly met" in out, out

    write(d, answered, "unrunnable")
    code, out = run(d, "delivered")
    assert code == 1, out

    state["gaps"]["accepted_by"] = "ok, share it"
    write(d, answered, "unrunnable")
    code, out = run(d, "delivered-with-gaps")
    assert code == 0 and "GATE: PASS" in out, out
    state["gaps"]["accepted_by"] = None

    write(d, answered, "met")
    code, out = run(d, "delivered")
    assert code == 0 and "GATE: PASS" in out, out

    # The requested terminal cannot disagree with a terminal already recorded in state.
    state["terminal"] = "blocked"
    write(d, answered, "met")
    code, out = run(d, "delivered")
    assert code == 1 and "does not match" in out, out
    state["terminal"] = None

    # in-place isolation without accepted_by
    state["isolation"]["mode"] = "in-place"
    write(d, answered, "met")
    code, out = run(d, "delivered")
    assert code == 1 and "accepted_by" in out, out

    state["isolation"]["accepted_by"] = "ok, share it"
    write(d, answered, "met")
    code, out = run(d, "delivered")
    assert code == 0 and "GATE: PASS" in out, out
    state["isolation"]["mode"] = "worktree"
    state["isolation"]["accepted_by"] = None

    # delivered-with-gaps with gaps.accepted_by null
    state["gaps"]["accepted_by"] = None
    write(d, answered, "unrunnable")
    code, out = run(d, "delivered-with-gaps")
    assert code == 1 and "gaps.accepted_by" in out, out

    # budget over cap
    state["budget"]["leaves_used"] = 41
    write(d, answered, "met")
    code, out = run(d, "delivered")
    assert code == 1 and "leaves" in out, out
    state["budget"]["leaves_used"] = 0

    # phase 2b: blocking unanswered question
    write(d, open_q, "met")
    out2 = subprocess.run([sys.executable, gate, d, "--phase", "2b"], capture_output=True, text=True)
    assert out2.returncode == 1, out2.stdout + out2.stderr

    # phase 2b: answered
    write(d, answered, "met")
    out2 = subprocess.run([sys.executable, gate, d, "--phase", "2b"], capture_output=True, text=True)
    assert out2.returncode == 0, out2.stdout + out2.stderr

    # phase 3: agent-plan.md lacking tracer:
    write(d, answered, "met")
    open(os.path.join(d, "agent-plan.md"), "w").write("## Invariants\nINV-1: x\n\nM1: does a thing\nM2: does another\n")
    out2 = subprocess.run([sys.executable, gate, d, "--phase", "3"], capture_output=True, text=True)
    assert out2.returncode == 1 and "tracer" in out2.stdout + out2.stderr, out2.stdout + out2.stderr

    # phase 4: next "5" with one milestone pending
    state["next"] = "5"
    state["milestones"] = [{"id": "M1", "status": "done", "sha": "abc1234"}, {"id": "M2", "status": "pending", "sha": None}]
    write(d, answered, "met")
    out2 = subprocess.run([sys.executable, gate, d, "--phase", "4"], capture_output=True, text=True)
    assert out2.returncode == 1 and "M2" in (out2.stdout + out2.stderr), out2.stdout + out2.stderr
    state["next"] = None
    state["milestones"] = [{"id": "M1", "status": "done", "sha": "abc1234"}]

    # phase 2: human-plan.md lacking Flag key:
    write(d, answered, "met")
    open(os.path.join(d, "human-plan.md"), "w").write("## What is wrong\nsomething\n")
    out2 = subprocess.run([sys.executable, gate, d, "--phase", "2"], capture_output=True, text=True)
    assert out2.returncode == 1 and "Flag key" in (out2.stdout + out2.stderr), out2.stdout + out2.stderr
GATEPY

# Final review: every blocked exit routes to Phase 6
for p in phase-1-diagnosis phase-2-human-plan phase-4-milestones; do
  grep -q 'terminal: blocked`, go to Phase 6' "$root/references/$p.md" || f "$p blocked exit does not route to Phase 6"
done
grep -q 'terminal: blocked`' "$root/references/phase-6-stop.md" || f "phase-6 has no blocked-run report rule"
grep -q 'ZSH_VERSION' "$root/tests/check.sh" || f "check.sh lacks zsh guard"

# T11 word caps
for pf in $root/references/phase-*.md; do
  words=$(wc -w < $pf)
  (( words < 950 )) || f "$pf:t is $words words, over the 950 cap"
done
skill_words=$(wc -w < $root/SKILL.md)
(( skill_words < 850 )) || f "SKILL.md is $skill_words words, over the 850 cap"
for af in $root/agents/*.md; do
  words=$(wc -w < $af)
  (( words < 500 )) || f "$af:t is $words words, over the 500 cap"
done
grep -q "40 lines" $root/references/briefs.md || f "briefs.md lacks '40 lines'"

# Global: em-dash grep extends to scripts, templates, tests; lekker/push-pr must not appear
grep -rn -- '—' $root/scripts $root/templates $root/tests 2>/dev/null | grep -v '/tests/check\.sh:' | grep -q . && f "em-dash found in scripts/templates/tests"
grep -rn 'lekker\|push-pr' $root/references $root/SKILL.md $root/templates 2>/dev/null && f "lekker or push-pr mentioned"
grep -rnE 'model: (sonnet|opus|haiku)' $root/SKILL.md $root/references $root/agents $root/scripts $root/templates 2>/dev/null && f "provider model hard-coded"
grep -q 'codex exec' $root/scripts/run.sh || f "run.sh lacks Codex runner"
grep -q 'claude -p' $root/scripts/run.sh || f "run.sh lacks Claude Code runner"
grep -q -- '--runner' $root/scripts/run.sh || f "run.sh lacks explicit provider override"

# T12 public proof specimen: the same gate must reject false delivery and accept honest delivery.
[[ -x $root/proof/terminal-gate/run.sh ]] || f "terminal-gate proof runner missing or not executable"
proof_out=$(bash $root/proof/terminal-gate/run.sh 2>&1)
proof_rc=$?
(( proof_rc == 0 )) || f "terminal-gate proof runner exited $proof_rc"
print -r -- "$proof_out" | grep -q '\[false-delivery\] exit=1' || f "proof did not block false delivery"
print -r -- "$proof_out" | grep -q '\[honest-delivery\] exit=0' || f "proof did not pass honest delivery"
print -r -- "$proof_out" | grep -q '\[mismatched-terminal\] exit=1' || f "proof did not block terminal mismatch"

proof_manifest_out=$(python3 $root/scripts/verify-proof.py 2>&1)
proof_manifest_rc=$?
(( proof_manifest_rc == 0 )) || f "proof manifest verifier exited $proof_manifest_rc"
print -r -- "$proof_manifest_out" | grep -q '^PROOF: PASS claims=3 ' || f "proof manifest verifier did not pass three claims"

bad_manifest=$(mktemp)
python3 - "$root/proof/manifest.json" "$bad_manifest" <<'BADPROOF'
import json, sys
with open(sys.argv[1]) as handle:
    manifest = json.load(handle)
manifest["claims"][1]["id"] = manifest["claims"][0]["id"]
with open(sys.argv[2], "w") as handle:
    json.dump(manifest, handle)
BADPROOF
bad_proof_out=$(python3 $root/scripts/verify-proof.py "$bad_manifest" 2>&1)
bad_proof_rc=$?
(( bad_proof_rc == 1 )) || f "proof verifier accepted duplicate claim ids"
print -r -- "$bad_proof_out" | grep -q "duplicate claim id" || f "proof verifier did not name duplicate claim id"
rm -f "$bad_manifest"

exit $fail
