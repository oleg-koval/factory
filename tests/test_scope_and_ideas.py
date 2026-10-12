import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import deferred_ideas  # noqa: E402
import scope_lock  # noqa: E402


class ScopeAndIdeasTest(unittest.TestCase):
    def setUp(self):
        """Create an isolated version 2 run with plans and checkpoint receipts."""
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.run_dir = Path(self.temp.name)
        (self.run_dir / "human-plan.md").write_text("## Milestones\nM1: approved slice\nFlag key: none\n")
        (self.run_dir / "agent-plan.md").write_text("## Invariants\nnone\nM1: approved slice\n  tracer: end to end\n")
        (self.run_dir / "receipts.md").write_text("M1 local demo\nM1 preview verification\n")
        self.state = {
            "slug": "scope-test", "source": "text", "input": "example", "class": "feature",
            "depth": "light", "phase": "3", "next": "4", "milestone": "M1",
            "bindings_file": "roles.json",
            "loops": {"reproduce": 0, "plan_equivalence": 0, "fixer": {}},
            "terminal": None, "contract_version": 2,
            "milestones": [{"id": "M1", "status": "done", "sha": "abc1234",
                            "checkpoint": {"target": "none", "status": "not-applicable",
                                           "reason": "No preview target", "receipt": "M1 local demo"}}],
        }

    def gate(self, phase):
        """Persist the fixture state and capture the gate result for a phase."""
        (self.run_dir / "state.json").write_text(json.dumps(self.state))
        return subprocess.run([sys.executable, str(ROOT / "scripts/gate.py"), str(self.run_dir),
                               "--phase", phase], capture_output=True, text=True)

    def test_approved_scope_blocks_unreviewed_change_and_allows_reapproval(self):
        """Verify plan drift blocks progress until the changed scope is resealed."""
        self.assertIn("scope lock unavailable", self.gate("3").stdout)
        scope_lock.seal(str(self.run_dir))
        self.assertEqual(self.gate("3").returncode, 0)
        self.assertEqual(self.gate("4").returncode, 0)
        with (self.run_dir / "agent-plan.md").open("a") as handle:
            handle.write("M2: optional rabbit hole\n")
        blocked = self.gate("4")
        self.assertEqual(blocked.returncode, 1)
        self.assertIn("changed after scope approval", blocked.stdout)
        scope_lock.seal(str(self.run_dir))
        self.assertEqual(self.gate("4").returncode, 0)

    def test_legacy_run_and_checkpoint_receipts(self):
        """Verify legacy compatibility and version 2 checkpoint requirements."""
        self.state.pop("contract_version")
        self.state["milestones"][0].pop("checkpoint")
        self.assertEqual(self.gate("4").returncode, 0)
        self.state["contract_version"] = 2
        scope_lock.seal(str(self.run_dir))
        self.assertIn("release checkpoint", self.gate("4").stdout)
        self.state["milestones"][0]["checkpoint"] = {"target": "preview", "status": "verified", "receipt": ""}
        self.assertIn("demo or preview receipt", self.gate("4").stdout)
        self.state["milestones"][0]["checkpoint"]["receipt"] = "M1 preview verification"
        self.assertEqual(self.gate("4").returncode, 0)
        self.state["checkpoint_pending"] = "M1"
        self.assertIn("pending", self.gate("4").stdout)

    def test_runner_stops_for_attended_preview(self):
        """Verify a pending preview checkpoint requires an attended runner session."""
        run = self.run_dir / ".factory" / "scope-test"
        run.mkdir(parents=True)
        self.state["checkpoint_pending"] = "M1"
        (run / "state.json").write_text(json.dumps(self.state))
        result = subprocess.run(["bash", str(ROOT / "scripts/run.sh"), "scope-test",
                                 "--runner", "codex", "--dry-run"], cwd=self.run_dir,
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("human=1", result.stdout)

    def test_deferred_idea_survives_unavailable_github_and_deduplicates(self):
        """Verify ideas survive GitHub failures and reuse matching issues on retry."""
        deferred_ideas.add(str(self.run_dir), "Add export", "Outside M1", "review note")
        deferred_ideas.add(str(self.run_dir), "add export", "Outside M1", "review note")
        deferred_ideas.add(str(self.run_dir), "Maybe add chat", "Needs discovery", "review note", actionable=False)
        self.assertEqual(len(deferred_ideas.read(str(self.run_dir))), 2)
        with patch.object(deferred_ideas, "gh", side_effect=OSError("GitHub unavailable")):
            self.assertEqual(deferred_ideas.handoff(str(self.run_dir), "owner/repo", True), 1)
        self.assertEqual(deferred_ideas.read(str(self.run_dir))[0]["status"], "pending")

        calls = []
        def existing_issue(*args):
            """Simulate finding and verifying an existing issue while rejecting creation."""
            calls.append(args)
            if args[:2] == ("issue", "list"):
                return json.dumps([{"title": "Add export", "url": "https://github.com/owner/repo/issues/7"}])
            if args[:2] == ("issue", "view"):
                return json.dumps({"title": "Add export", "url": "https://github.com/owner/repo/issues/7"})
            raise AssertionError("duplicate issue was created")

        with patch.object(deferred_ideas, "gh", side_effect=existing_issue):
            self.assertEqual(deferred_ideas.handoff(str(self.run_dir), "owner/repo", True), 0)
        self.assertEqual(deferred_ideas.read(str(self.run_dir))[0]["status"], "linked")
        self.assertEqual(deferred_ideas.read(str(self.run_dir))[1]["status"], "pending")
        self.assertEqual(len(calls), 2)


if __name__ == "__main__":
    unittest.main()
