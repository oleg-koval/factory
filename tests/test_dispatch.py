"""Exercise one scheduler's admission decisions and recovery boundary."""

import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import dispatch


def item(number, label, *, pull=False):
    return {"number": number, "state": "open", "labels": [{"name": label}],
            **({"pull_request": {}} if pull else {})}


class DispatcherTest(unittest.TestCase):
    def test_capacity_and_a_human_decision_frees_a_slot(self):
        ready = [item(n, dispatch.REVIEW_READY, pull=True) for n in (1, 2, 3)]
        eligible = [item(12, dispatch.ELIGIBLE), item(11, dispatch.ELIGIBLE)]
        with patch.object(dispatch, "read_gh", side_effect=[
            [[ready[0]], ready[1:]], [ready[:2]], [ready[:1]], [eligible],
        ]) as gh:
            self.assertEqual(dispatch.decide("owner/repo", 2)["decision"], "review-capacity")
            self.assertEqual(dispatch.decide("owner/repo", 2)["decision"], "review-capacity")
            admitted = dispatch.decide("owner/repo", 2)
            self.assertEqual((admitted["decision"], admitted["issue"]), ("admit", 11))
            self.assertEqual(gh.call_count, 4)

    def test_unreadable_queue_stops_before_admission(self):
        args = type("Args", (), {"repo": "owner/repo", "review_cap": 2})
        with patch.object(dispatch, "read_gh", side_effect=ValueError("offline")), \
             patch.object(dispatch, "report") as report, patch.object(dispatch.subprocess, "run") as run:
            self.assertEqual(dispatch.dispatch(args, worker=1), 1)
            self.assertEqual(report.call_args.args[1]["decision"], "queue-unreadable")
            run.assert_not_called()

    def test_incomplete_pages_fail_closed(self):
        with patch.object(dispatch, "read_gh", return_value=[[], None]):
            with self.assertRaisesRegex(ValueError, "incomplete"):
                dispatch.decide("owner/repo", 2)

    def test_release_requires_visible_handoff_and_consumed_eligibility(self):
        eligible = item(7, dispatch.ELIGIBLE)
        handed_off = item(12, dispatch.REVIEW_READY, pull=True)
        for visible, consumed in ((False, True), (True, False), (True, True)):
            with self.subTest(visible=visible, consumed=consumed), tempfile.TemporaryDirectory() as temp:
                scheduler = Path(temp)
                args = SimpleNamespace(repo="owner/repo", review_cap=2, scheduler_dir=scheduler,
                                       worker=["factory-worker"])

                def worker(_command, *, env, pass_fds):
                    Path(env["FACTORY_HANDOFF_FILE"]).write_text("12")
                    return subprocess.CompletedProcess([], 0)

                with patch.object(dispatch, "read_gh", side_effect=[
                    [[]], [[eligible]], [[handed_off] if visible else []], [[] if consumed else [eligible]],
                ]), patch.object(dispatch, "report"), patch.object(dispatch.subprocess, "run", worker):
                    released = visible and consumed
                    self.assertEqual(dispatch.dispatch(args, worker=1), 0 if released else 1)
                self.assertEqual((scheduler / "active").exists(), not released)

    def test_closed_handoff_releases_only_the_claim_named_in_the_receipt(self):
        with tempfile.TemporaryDirectory() as temp:
            scheduler = Path(temp)
            args = SimpleNamespace(repo="owner/repo", review_cap=1, scheduler_dir=scheduler,
                                   claim_repo=scheduler, abandon=None, dry_run=True)
            head = "a" * 40
            receipt = scheduler / f"worker-7-{head}.handoff.json"
            with patch.object(dispatch.claims, "reservations", return_value={7: head}), \
                 patch.object(dispatch, "queue", return_value={8}), patch.object(dispatch, "report") as report, \
                 patch.object(dispatch.claims, "review_issues", side_effect=[set(), set(), {7}]) as reviews:
                self.assertEqual(dispatch.dispatch_concurrent(args), 0)
                self.assertEqual(report.call_args.args[1]["decision"], "review-capacity")
                receipt.write_text("12")
                self.assertEqual(dispatch.dispatch_concurrent(args), 0)
                self.assertEqual(report.call_args.args[1]["issue"], 8)
                self.assertEqual(reviews.call_args.kwargs, {"closed_pr": 12})

    def test_next_invocation_reconciles_successful_handoff_without_restarting_worker(self):
        with tempfile.TemporaryDirectory() as temp:
            scheduler = Path(temp)
            (scheduler / "active").write_text("owner/repo#7\n")
            (scheduler / "worker-succeeded").write_text("owner/repo#7\n")
            (scheduler / "handoff.json").write_text("12")
            argv = ["dispatch", "--repo", "owner/repo", "--review-cap", "1", "--enable",
                    "--scheduler-dir", temp, "--", "factory-worker"]
            ready = item(12, dispatch.REVIEW_READY, pull=True)
            with patch.object(sys, "argv", argv), patch.object(dispatch, "report") as report, \
                 patch.object(dispatch, "read_gh", side_effect=[[[]], [[ready]], [[]], [[ready]]]), \
                 patch.object(dispatch.subprocess, "run") as worker:
                self.assertEqual(dispatch.main(), 1)
                self.assertTrue((scheduler / "active").exists())
                self.assertEqual(dispatch.main(), 0)
                self.assertFalse((scheduler / "active").exists())
                self.assertEqual(report.call_args.args[1]["decision"], "review-capacity")
                worker.assert_not_called()

    def test_approval_snapshot_includes_untracked_change_and_rejects_mutation(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp)
            approval = dispatch.approval
            approval.git(path, "init")
            approval.git(path, "-c", "user.name=Factory Test", "-c", "user.email=test@example.invalid",
                         "commit", "--allow-empty", "-m", "test: approval base")
            note = path / "pilot.txt"
            note.write_text("first\n")
            head, _, patch, digest = approval.snapshot(path)
            self.assertIn(b"+first", patch)
            self.assertEqual(approval.git(path, "status", "--porcelain"), "?? pilot.txt")
            note.write_text("changed\n")
            args = SimpleNamespace(resume_approval=digest, scheduler_dir=path)
            with self.assertRaisesRegex(ValueError, "approval no longer matches"):
                approval.publish(args, 7, {"worktree": str(path), "head": head, "digest": digest})

    def test_worker_holds_scheduler_lock_and_failure_leaves_marker(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            gh = folder / "gh"
            gh.write_text(
                "#!/bin/sh\n"
                "case \"$*\" in\n"
                "  *factory-review-ready*) echo '[[]]' ;;\n"
                """  *) echo '[[{"number":7,"state":"open","labels":[{"name":"factory-eligible"}]}]]' ;;\n"""
                "esac\n"
            )
            gh.chmod(0o755)
            scheduler = folder / "scheduler"
            command = [sys.executable, str(SCRIPTS / "dispatch.py"), "--repo", "owner/repo",
                       "--review-cap", "2", "--enable", "--scheduler-dir", str(scheduler)]
            env = {**os.environ, "PATH": f"{folder}{os.pathsep}{os.environ['PATH']}"}
            worker = folder / "worker.py"
            worker.write_text(
                "import subprocess, sys\n"
                "assert sys.argv[-1] == 'https://github.com/owner/repo/issues/7'\n"
                "out = subprocess.check_output(sys.argv[1:-1] + ['--', 'false'], text=True)\n"
                "assert 'scheduler-busy' in out, out\n"
                "raise SystemExit(7)\n"
            )
            result = subprocess.run(command + ["--", sys.executable, str(worker), *command],
                                    text=True, capture_output=True, env=env)
            self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
            self.assertIn('"exit": 7', result.stdout)
            self.assertEqual((scheduler / "active").read_text().strip(), "owner/repo#7")
            again = subprocess.run(command + ["--", "false"], capture_output=True, text=True, env=env)
            self.assertIn('"active": "owner/repo#7"', again.stdout)
            self.assertNotIn('"decision": "admit"', again.stdout)


if __name__ == "__main__":
    unittest.main()
