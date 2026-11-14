import datetime as dt
import json
import os
import runpy
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/status.py"
TEMPLATE = Path(__file__).resolve().parents[1] / "templates/progress-event.json"
API = runpy.run_path(str(SCRIPT))
NOW = dt.datetime.now(dt.timezone.utc)


class StatusTests(unittest.TestCase):
    def test_progress_template_links_remote_sha_observation_to_ci(self):
        event = json.loads(TEMPLATE.read_text())
        self.assertTrue(event["remote_sha_at"])
        self.assertEqual(event["remote_sha"], event["ci"]["sha"])
        self.assertTrue(event["ci"]["at"])

    def fixture(self, execution="running", observation=True, source="terminal-session",
                event_age=30, observation_age=30, ac_path="ac-matrix.md",
                all_local_acs_met=False, terminal=None, progress=True):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        run = Path(temp.name) / ".factory" / "fixture"
        run.mkdir(parents=True)
        state = {"slug": "fixture", "phase": "4", "terminal": terminal,
                 "delivery": {}, "files": {"ac_matrix": ac_path}}
        (run / "state.json").write_text(json.dumps(state))
        second = "met" if all_local_acs_met else "failed"
        (run / "ac-matrix.md").write_text(
            "| AC | test | kind | status |\n|---|---|---|---|\n"
            f"| AC-1 | t | unit | met |\n| AC-2 | t2 | unit | {second} |\n")
        if progress:
            event = {"at": (NOW - dt.timedelta(seconds=event_age)).isoformat(),
                     "execution": execution, "scope": "roadmap", "active_slice": "slice A",
                     "assignment": {"owner": "Lee", "model": "default"},
                     "next_owner": "Pat", "next_action": "verify receipt",
                     "blockers": [{"missing_evidence": "CI SHA", "next_action": "rerun CI",
                                   "owner": "Pat", "unaffected_work": ["AC-3"]}]}
            if observation:
                event["execution_evidence"] = {
                    "source": source,
                    "observed_at": (NOW - dt.timedelta(seconds=observation_age)).isoformat(),
                    "observed_state": execution}
            (run / "progress.jsonl").write_text(json.dumps(event) + "\n")
        return run

    def result(self, run):
        data = API["status"](run, now=NOW)
        text = API["render_text"](data)
        text_data = {key.replace(" ", "_"): json.loads(value)
                     for key, _, value in (line.partition(": ") for line in text.splitlines())}
        self.assertEqual(text_data, data)
        self.assertEqual(json.loads(API["render_json"](data)), data)
        return data

    def test_six_execution_states_and_legacy_unknown(self):
        for value in ("running", "waiting", "idle", "blocked", "complete"):
            with self.subTest(value=value):
                self.assertEqual(self.result(self.fixture(execution=value))["execution"], value)
        legacy = self.result(self.fixture(progress=False))
        self.assertEqual(legacy["execution"], "unknown")
        self.assertEqual(legacy["progress_status"], "unavailable")

    def test_read_only_cli_has_text_and_json_modes(self):
        run = self.fixture()
        cwd = run.parents[1]
        text = subprocess.run([sys.executable, str(SCRIPT), "fixture"], cwd=cwd,
                              capture_output=True, text=True, check=True).stdout
        machine = subprocess.run([sys.executable, str(SCRIPT), "fixture", "--json"], cwd=cwd,
                                 capture_output=True, text=True, check=True).stdout
        self.assertIn('execution: "running"', text)
        self.assertEqual(json.loads(machine)["execution"], "running")

    def test_idle_handoff_names_next_owner_and_blocker_scope(self):
        data = self.result(self.fixture(execution="idle"))
        self.assertEqual(data["next_owner"], "Pat")
        self.assertEqual(data["next_action"], "verify receipt")
        self.assertEqual(data["blockers"][0]["owner"], "Pat")
        self.assertEqual(data["blockers"][0]["unaffected_work"], ["AC-3"])

    def test_running_needs_fresh_observed_runtime_state(self):
        for options in ({"observation": False}, {"source": "queued-message"},
                        {"event_age": 901}, {"observation_age": 901}):
            with self.subTest(options=options):
                self.assertEqual(self.result(self.fixture(**options))["execution"], "unknown")

    def test_fresh_non_running_states_do_not_need_runtime_receipts(self):
        for value in ("waiting", "idle", "blocked", "complete"):
            with self.subTest(value=value):
                self.assertEqual(self.result(self.fixture(execution=value, observation=False))["execution"], value)

    def test_last_appended_event_wins_and_stale_event_fields_are_unknown(self):
        run = self.fixture()
        path = run / "progress.jsonl"
        first = json.loads(path.read_text())
        last = dict(first, at=(NOW - dt.timedelta(seconds=901)).isoformat(),
                    execution="idle", scope="stale scope", next_owner="stale owner")
        path.write_text(json.dumps(first) + "\n" + json.dumps(last) + "\n")
        result = self.result(run)
        self.assertEqual(result["scope"], "unknown")
        self.assertEqual(result["next_owner"], "unknown")
        self.assertEqual(result["execution"], "unknown")
        self.assertFalse(result["evidence_fresh"])

    def test_stale_snapshot_keeps_receipt_times_but_hides_conclusions(self):
        run = self.fixture(event_age=901)
        path = run / "progress.jsonl"
        event = json.loads(path.read_text())
        observed = (NOW - dt.timedelta(seconds=902)).isoformat()
        event["execution_evidence"]["observed_at"] = observed
        event["remote_sha"] = "a" * 40
        event["remote_sha_at"] = observed
        event["ci"] = {"status": "green", "at": observed, "sha": "a" * 40}
        path.write_text(json.dumps(event) + "\n")
        result = self.result(run)
        self.assertEqual(result["execution_observed_at"], observed)
        self.assertEqual(result["remote_sha_observed_at"], observed)
        self.assertEqual(result["ci_observed_at"], observed)
        self.assertEqual(result["execution"], "unknown")
        self.assertEqual(result["ci"], "unknown")
        self.assertEqual(result["remote_sha_freshness"], "unknown")

    def test_bounded_reads_and_corrupt_files_are_reported(self):
        run = self.fixture()
        (run / "progress.jsonl").write_bytes(b"\xff")
        self.assertEqual(self.result(run)["progress_status"], "corrupt")
        (run / "progress.jsonl").write_bytes(b"x" * (1024 * 1024 + 1))
        self.assertEqual(self.result(run)["progress_status"], "unavailable")
        run = self.fixture()
        os.mkfifo(run / "matrix.fifo")
        state = json.loads((run / "state.json").read_text())
        state["files"]["ac_matrix"] = "matrix.fifo"
        (run / "state.json").write_text(json.dumps(state))
        self.assertEqual(self.result(run)["acceptance_status"], "unavailable")

    def test_concurrent_state_write_is_reported_without_using_matrix(self):
        run = self.fixture()
        (run / "state.json").write_text("{")
        result = self.result(run)
        self.assertEqual(result["state_status"], "corrupt")
        self.assertEqual(result["acceptance_status"], "corrupt")

    def test_corrupt_progress_never_falls_back_to_an_older_event(self):
        run = self.fixture()
        valid = (run / "progress.jsonl").read_text()
        (run / "progress.jsonl").write_text(valid + "{broken\n")
        result = self.result(run)
        self.assertEqual(result["progress_status"], "corrupt")
        self.assertEqual(result["execution"], "unknown")
        self.assertEqual(result["scope"], "unknown")

    def test_ci_must_be_fresh_and_match_remote_sha(self):
        run = self.fixture()
        path = run / "progress.jsonl"
        event = json.loads(path.read_text())
        event["remote_sha"] = "a" * 40
        event["remote_sha_at"] = NOW.isoformat()
        event["ci"] = {"status": "green", "at": NOW.isoformat(), "sha": "a" * 40}
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["ci"], "green")
        for ci, expected_freshness in (({"status": "green", "at": NOW.isoformat(), "sha": "b" * 40}, "sha-mismatch"),
                                       ({"status": "green", "at": (NOW - dt.timedelta(days=2)).isoformat(), "sha": "a" * 40}, "before-remote-sha"),
                                       (None, "missing")):
            event["ci"] = ci
            path.write_text(json.dumps(event) + "\n")
            result = self.result(run)
            self.assertEqual(result["ci"], "unknown")
            self.assertEqual(result["ci_freshness"], expected_freshness)
        event.pop("remote_sha")
        event["ci"] = {"status": "green", "at": NOW.isoformat(), "sha": "a" * 40}
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["ci_freshness"], "missing-sha")
        event["remote_sha"] = "not-a-sha"
        path.write_text(json.dumps(event) + "\n")
        result = self.result(run)
        self.assertEqual(result["remote_sha_freshness"], "unknown")
        self.assertEqual(result["ci"], "unknown")
        event["remote_sha"] = "a" * 40
        event["remote_sha_at"] = (NOW - dt.timedelta(days=2)).isoformat()
        event["ci"] = {"status": "green", "at": NOW.isoformat(), "sha": "a" * 40}
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["ci"], "unknown")
        event["remote_sha_at"] = None
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["ci"], "unknown")

    def test_ac_paths_are_confined_and_pending_roadmap_is_visible(self):
        for path in (None, {}, "../outside.md", str(Path("/tmp/outside.md"))):
            result = self.result(self.fixture(ac_path=path))
            self.assertEqual(result["acceptance_status"], "invalid-path")
            self.assertEqual(result["remaining_acceptance_criteria"], "unknown")
        run = self.fixture()
        outside = run.parent / "outside.md"
        outside.write_text("| AC-9 | test | unit | met |\n")
        (run / "escape.md").symlink_to(outside)
        state = json.loads((run / "state.json").read_text())
        state["files"]["ac_matrix"] = "escape.md"
        (run / "state.json").write_text(json.dumps(state))
        self.assertEqual(self.result(run)["acceptance_status"], "invalid-path")
        run = self.fixture()
        path = run / "progress.jsonl"
        event = json.loads(path.read_text())
        event["roadmap_acceptance_criteria"] = [
            {"id": "AC-1", "status": "met"}, {"id": "AC-2", "status": "pending"}]
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["pending_roadmap_acceptance_criteria"], ["AC-2"])

    def test_custom_matrix_header_order_and_backtick_cells(self):
        run = self.fixture(ac_path="custom/matrix.md")
        custom = run / "custom"
        custom.mkdir()
        (custom / "matrix.md").write_text(
            "| `STATUS` | note | `ac` |\n|---|---|---|\n| `MET` | proof | `AC-9` |\n")
        result = self.result(run)
        self.assertEqual(result["acceptance_status"], "available")
        self.assertEqual(result["remaining_acceptance_criteria"], [])

    def test_truncated_recognized_ac_row_blocks_completion(self):
        run = self.fixture(terminal="delivered", all_local_acs_met=True)
        path = run / "ac-matrix.md"
        path.write_text(
            "| AC | test | kind | status |\n|---|---|---|---|\n"
            "| AC-1 | test | unit | MET |\n| AC-2 | test | unit |\n")
        event_path = run / "progress.jsonl"
        event = json.loads(event_path.read_text())
        event["roadmap_acceptance_criteria"] = [
            {"id": "AC-1", "status": "met"}, {"id": "AC-2", "status": "met"}]
        event["roadmap_acceptance_complete"] = True
        event_path.write_text(json.dumps(event) + "\n")
        result = self.result(run)
        self.assertEqual(result["acceptance_status"], "corrupt")
        self.assertEqual(result["roadmap_complete"], "unknown")

    def test_status_in_test_id_does_not_hide_failed_ac_row(self):
        run = self.fixture(terminal="delivered", all_local_acs_met=True)
        (run / "ac-matrix.md").write_text(
            "| AC | test id | kind | status |\n|---|---|---|---|\n"
            "| AC-1 | unit-one | unit | met |\n"
            "| AC-2 | status | unit | failed |\n")
        event_path = run / "progress.jsonl"
        event = json.loads(event_path.read_text())
        event["roadmap_acceptance_criteria"] = [
            {"id": "AC-1", "status": "met"}, {"id": "AC-2", "status": "met"}]
        event["roadmap_acceptance_complete"] = True
        event_path.write_text(json.dumps(event) + "\n")
        result = self.result(run)
        self.assertEqual(result["remaining_acceptance_criteria"], ["AC-2"])
        self.assertEqual(result["roadmap_complete"], "incomplete")

    def test_null_state_and_corrupt_matrix_are_reported_safely(self):
        run = self.fixture()
        (run / "state.json").write_text("null")
        self.assertEqual(self.result(run)["state_status"], "corrupt")
        run = self.fixture()
        (run / "ac-matrix.md").write_text(
            "| AC | test | kind | status |\n|---|---|---|---|\n"
            "| AC-1 | test | unit | not-a-status |\n")
        result = self.result(run)
        self.assertEqual(result["acceptance_status"], "corrupt")
        self.assertEqual(result["remaining_acceptance_criteria"], "unknown")

    def test_completion_requires_all_current_and_roadmap_criteria(self):
        run = self.fixture(terminal="delivered")
        path = run / "progress.jsonl"
        event = json.loads(path.read_text())
        event["roadmap_acceptance_criteria"] = [
            {"id": "AC-1", "status": "met"}, {"id": "AC-2", "status": "met"}]
        event["roadmap_acceptance_complete"] = True
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["roadmap_complete"], "incomplete")
        run = self.fixture(terminal="delivered", all_local_acs_met=True)
        path = run / "progress.jsonl"
        event = json.loads(path.read_text())
        event["roadmap_acceptance_criteria"] = [
            {"id": "AC-1", "status": "met"}, {"id": "AC-2", "status": "met"}]
        event["roadmap_acceptance_complete"] = True
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["roadmap_complete"], "complete")
        del event["roadmap_acceptance_complete"]
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["roadmap_complete"], "unknown")


if __name__ == "__main__":
    unittest.main()
