import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from pypdf import PdfReader

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
        (self.run_dir / "agent-plan.md").write_text("## Invariants\nnone\nM1: approved slice\n  tracer: end to end\n  checkpoint: target: none; demo: local demo\n")
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
        plan = self.run_dir / "agent-plan.md"
        plan.write_text(plan.read_text().replace("target: none", "target: preview"))
        scope_lock.seal(str(self.run_dir))
        self.assertIn("release checkpoint", self.gate("4").stdout)
        self.state["milestones"][0]["checkpoint"] = {"target": "preview", "status": "verified", "receipt": ""}
        self.assertIn("demo or preview receipt", self.gate("4").stdout)
        self.state["milestones"][0]["checkpoint"]["receipt"] = "M1 preview verification"
        self.assertEqual(self.gate("4").returncode, 0)
        (self.run_dir / "receipts.md").write_text("Receipt for M1 appears here\n")
        self.state["milestones"][0]["checkpoint"]["receipt"] = "M1"
        self.assertIn("receipt is absent", self.gate("4").stdout)
        (self.run_dir / "receipts.md").write_text("M1\n")
        self.assertEqual(self.gate("4").returncode, 0)
        self.state["checkpoint_pending"] = "M1"
        self.assertIn("pending", self.gate("4").stdout)

    def test_sealed_run_without_version_still_checks_scope_and_checkpoints(self):
        """Removing the version must not bypass a sealed run's gates."""
        self.state.pop("contract_version")
        self.state["isolation"] = {"mode": "in-place", "repo": "repo", "branch": "test",
                                   "base": "main", "accepted_by": "Use this checkout"}
        self.state["terminal"] = "delivered"
        (self.run_dir / "ac-matrix.md").write_text("| AC | status |\n|---|---|\n| AC-1 | met |\n")
        scope_lock.seal(str(self.run_dir))
        for phase, next_phase in (("4", "4"), ("4", "5"), ("6", None)):
            with self.subTest(phase=phase, next=next_phase):
                self.state["next"] = next_phase
                self.assertEqual(self.gate(phase).returncode, 0)
                checkpoint = self.state["milestones"][0].pop("checkpoint")
                try:
                    self.assertIn("release checkpoint", self.gate(phase).stdout)
                finally:
                    self.state["milestones"][0]["checkpoint"] = checkpoint
        with (self.run_dir / "human-plan.md").open("a") as handle:
            handle.write("Unapproved scope\n")
        for phase in ("3", "4", "5", "6"):
            with self.subTest(phase=phase):
                self.assertIn("changed after scope approval", self.gate(phase).stdout)

    def test_checkpoint_receipt_must_identify_current_milestone(self):
        """A different milestone's receipt cannot satisfy the current milestone."""
        scope_lock.seal(str(self.run_dir))
        for receipt in ("M2 local demo", "M10 local demo", "local demo"):
            with self.subTest(receipt=receipt):
                (self.run_dir / "receipts.md").write_text(receipt + "\n")
                self.state["milestones"][0]["checkpoint"]["receipt"] = receipt
                result = self.gate("4")
                self.assertEqual(result.returncode, 1)
                self.assertIn("does not identify milestone", result.stdout)
        receipt = "| now | 4 | demo | factory(M1): local demo | abc1234 | pass |"
        (self.run_dir / "receipts.md").write_text(receipt + "\n")
        self.state["milestones"][0]["checkpoint"]["receipt"] = receipt
        self.assertEqual(self.gate("4").returncode, 0)

    def test_checkpoint_target_must_match_approved_milestone(self):
        """Neither another milestone nor a missing target permits skipping preview."""
        plan = self.run_dir / "agent-plan.md"
        original = plan.read_text()
        for changed in (
            original.replace("target: none", "target: preview"),
            original.replace("target: none", "target: preview") + "M2: docs\n  checkpoint: target: none; demo: docs\n",
            original.replace("  checkpoint: target: none; demo: local demo\n", ""),
        ):
            with self.subTest(plan=changed):
                plan.write_text(changed)
                scope_lock.seal(str(self.run_dir))
                result = self.gate("4")
                self.assertEqual(result.returncode, 1)
                self.assertIn("approved checkpoint target", result.stdout)
        plan.write_text(original.replace("target: none", "target: preview"))
        scope_lock.seal(str(self.run_dir))
        self.state["milestones"][0]["checkpoint"].update(target="preview", status="verified")
        self.assertEqual(self.gate("4").returncode, 0)

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

    def test_runner_notifies_checkpoint_even_when_phase_gate_blocks(self):
        """Verify an unattended pending checkpoint reaches its human notification."""
        run = self.run_dir / ".factory" / "scope-test"
        run.mkdir(parents=True)
        self.state["checkpoint_pending"] = "M1"
        (run / "state.json").write_text(json.dumps(self.state))

        skill = self.run_dir / "stub-skill"
        scripts = skill / "scripts"
        scripts.mkdir(parents=True)
        run_script = scripts / "run.sh"
        shutil.copy(ROOT / "scripts" / "run.sh", run_script)
        (scripts / "gate.py").write_text("print('GATE: BLOCKED stubbed checkpoint gate')\n")

        result = subprocess.run(["bash", str(run_script), "scope-test", "--runner", "codex"],
                                cwd=self.run_dir, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("GATE: BLOCKED stubbed checkpoint gate", result.stdout)
        self.assertIn("NEEDS-YOU: milestone M1", result.stdout)
        self.assertNotIn("will not start phase", result.stdout)

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
            if args[:3] == ("api", "--paginate", "--slurp"):
                self.assertNotIn("--search", args)
                return json.dumps([
                    [{"title": "Other", "url": "https://api.github.com/repos/owner/repo/issues/6",
                      "html_url": "https://github.com/owner/repo/issues/6"}],
                    [{"title": "Add \"export\"", "url": "https://api.github.com/repos/owner/repo/issues/7",
                      "html_url": "https://github.com/owner/repo/issues/7"}],
                ])
            if args[:2] == ("issue", "view"):
                return json.dumps({"title": 'Add "export"', "url": "https://github.com/owner/repo/issues/7"})
            raise AssertionError("duplicate issue was created")

        ideas = deferred_ideas.read(str(self.run_dir))
        ideas[0]["idea"] = 'Add "export"'
        deferred_ideas.write(str(self.run_dir), ideas)
        with patch.object(deferred_ideas, "gh", side_effect=existing_issue):
            self.assertEqual(deferred_ideas.handoff(str(self.run_dir), "owner/repo", True), 0)
        self.assertEqual(deferred_ideas.read(str(self.run_dir))[0]["status"], "linked")
        self.assertEqual(deferred_ideas.read(str(self.run_dir))[1]["status"], "pending")
        self.assertEqual(deferred_ideas.read(str(self.run_dir))[0]["issue_url"],
                         "https://github.com/owner/repo/issues/7")
        with patch.object(deferred_ideas, "gh", side_effect=AssertionError("linked issue retried")):
            self.assertEqual(deferred_ideas.handoff(str(self.run_dir), "owner/repo", True), 0)
        self.assertEqual(len(calls), 2)

    def test_deferred_issue_creation_marker_prevents_duplicate_after_write_failure(self):
        """Recover a created issue by title when persisting its URL initially fails."""
        deferred_ideas.add(str(self.run_dir), "Add a quoted \"export\"", "Outside M1", "review note")
        created_url = "https://github.com/owner/repo/issues/8"
        writes = 0
        real_write = deferred_ideas.write

        def fail_url_write(run_dir, ideas):
            """Simulate a disk error when first saving the newly created issue URL."""
            nonlocal writes
            writes += 1
            if writes == 2:
                raise OSError("simulated disk error")
            real_write(run_dir, ideas)

        def create_issue(*args):
            if args[:3] == ("api", "--paginate", "--slurp"):
                return "[[]]"
            if args[:2] == ("issue", "create"):
                self.assertTrue(deferred_ideas.read(str(self.run_dir))[0]["issue_creation_pending"])
                return created_url
            raise AssertionError(f"unexpected GitHub call: {args}")

        with patch.object(deferred_ideas, "write", side_effect=fail_url_write), \
                patch.object(deferred_ideas, "gh", side_effect=create_issue):
            self.assertEqual(deferred_ideas.handoff(str(self.run_dir), "owner/repo", True), 1)

        pending = deferred_ideas.read(str(self.run_dir))[0]
        self.assertTrue(pending["issue_creation_pending"])
        self.assertIsNone(pending["issue_url"])

        def recover_issue(*args):
            if args[:3] == ("api", "--paginate", "--slurp"):
                return json.dumps([[{"title": 'Add a quoted "export"', "url": "https://api.github.com/repos/owner/repo/issues/8",
                                     "html_url": created_url}]])
            if args[:2] == ("issue", "view"):
                return json.dumps({"title": 'Add a quoted "export"', "url": created_url})
            if args[:2] == ("issue", "create"):
                raise AssertionError("a second issue was created")
            raise AssertionError(f"unexpected GitHub call: {args}")

        with patch.object(deferred_ideas, "gh", side_effect=recover_issue):
            self.assertEqual(deferred_ideas.handoff(str(self.run_dir), "owner/repo", True), 0)
        recovered = deferred_ideas.read(str(self.run_dir))[0]
        self.assertEqual(recovered["issue_url"], created_url)
        self.assertNotIn("issue_creation_pending", recovered)
        self.assertEqual(recovered["status"], "linked")

    def test_scope_lock_removes_temporary_file_when_replace_fails(self):
        """Verify a failed lock replacement leaves no temporary artifact."""
        temporary = self.run_dir / "scope-lock.json.tmp"
        with patch.object(scope_lock.os, "replace", side_effect=OSError("simulated disk error")):
            with self.assertRaisesRegex(OSError, "simulated disk error"):
                scope_lock.seal(str(self.run_dir))
        self.assertFalse(temporary.exists())

    def test_onepage_pdf_cli_creates_a_single_page_pdf(self):
        """Verify the optional one-page CLI output is a parseable single-page PDF."""
        output = self.run_dir / "generated-a4.pdf"
        onepage = self.run_dir / "generated-onepage.pdf"
        subprocess.run([sys.executable, str(ROOT / "scripts" / "build_factory_run_flow_pdf.py"),
                        "--output", str(output), "--onepage-output", str(onepage)],
                       check=True, capture_output=True, text=True)
        self.assertTrue(onepage.is_file())
        self.assertEqual(len(PdfReader(str(onepage)).pages), 1)


if __name__ == "__main__":
    unittest.main()
