import datetime as dt
import json
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
        event["remote_sha"] = "sha-a"
        event["remote_sha_at"] = NOW.isoformat()
        event["ci"] = {"status": "green", "at": NOW.isoformat(), "sha": "sha-a"}
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["ci"], "green")
        for ci, expected_freshness in (({"status": "green", "at": NOW.isoformat(), "sha": "sha-b"}, "sha-mismatch"),
                                       ({"status": "green", "at": (NOW - dt.timedelta(days=2)).isoformat(), "sha": "sha-a"}, "before-remote-sha"),
                                       (None, "missing")):
            event["ci"] = ci
            path.write_text(json.dumps(event) + "\n")
            result = self.result(run)
            self.assertEqual(result["ci"], "unknown")
            self.assertEqual(result["ci_freshness"], expected_freshness)
        event.pop("remote_sha")
        event["ci"] = {"status": "green", "at": NOW.isoformat(), "sha": "sha-a"}
        path.write_text(json.dumps(event) + "\n")
        self.assertEqual(self.result(run)["ci_freshness"], "missing-sha")

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

    def test_null_state_and_corrupt_matrix_are_reported_safely(self):
        run = self.fixture()
        (run / "state.json").write_text("null")
        with self.assertRaises(ValueError):
            API["status"](run, now=NOW)
        run = self.fixture()
        (run / "ac-matrix.md").write_text("| AC-1 | test | unit | not-a-status |\n")
        result = self.result(run)
        self.assertEqual(result["acceptance_status"], "corrupt")
        self.assertEqual(result["remaining_acceptance_criteria"], "unknown")

    def test_completion_requires_all_current_and_roadmap_criteria(self):
        run = self.fixture(terminal="delivered")
        path = run / "progress.jsonl"
        event = json.loads(path.read_text())
        event["roadmap_acceptance_criteria"] = [{"id": "AC-1", "status": "met"}]
        path.write_text(json.dumps(event) + "\n")
        self.assertFalse(self.result(run)["roadmap_complete"])
        run = self.fixture(terminal="delivered", all_local_acs_met=True)
        path = run / "progress.jsonl"
        event = json.loads(path.read_text())
        event["roadmap_acceptance_criteria"] = [{"id": "AC-1", "status": "met"}]
        path.write_text(json.dumps(event) + "\n")
        self.assertTrue(self.result(run)["roadmap_complete"])


if __name__ == "__main__":
    unittest.main()
