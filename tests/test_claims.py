"""Generated retry/recovery traces and a real non-forced Git claim race."""

import subprocess
import sys
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from hypothesis import given, settings, strategies as st

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import claims


def git(path, *args):
    return subprocess.run(["git", "-C", str(path), *args], check=True, capture_output=True, text=True)


def repository(root):
    remote = root / "remote.git"
    git(root, "init", "--bare", str(remote))
    workers = []
    for index in range(2):
        path = root / f"worker-{index}"
        path.mkdir()
        git(path, "init")
        git(path, "config", "user.email", "factory-test@example.invalid")
        git(path, "config", "user.name", "Factory Test")
        git(path, "commit", "--allow-empty", "-m", "test: worker base")
        workers.append(path)
    return str(remote), workers


class ClaimTest(unittest.TestCase):
    @given(st.integers(1, 2), st.lists(st.tuples(
        st.sampled_from(["admit", "retry", "restart", "handoff", "release", "abandon", "decide"]),
        st.integers(1, 3),
    ), min_size=1, max_size=24))
    @settings(max_examples=32, deadline=None)
    def test_retries_and_restart_keep_capacity_and_ownership(self, cap, actions):
        with tempfile.TemporaryDirectory() as directory:
            remote, (worker, restarted) = repository(Path(directory))
            expected = {}
            review = set()
            eligible = {1, 2, 3}
            for action, issue in actions:
                observed = claims.reservations(restarted, remote)
                self.assertEqual(observed, expected)
                if action == "admit":
                    decision, admitted = claims.admission(eligible, observed, review, cap)
                    remaining = eligible - expected.keys() - review
                    if len(expected.keys() | review) < cap and remaining:
                        self.assertEqual((decision, admitted), ("admit", min(remaining)))
                        expected[admitted] = claims.claim(worker, remote, admitted)
                    else:
                        self.assertIsNone(admitted)
                elif action == "retry" and issue in observed:
                    with self.assertRaises(ValueError):
                        claims.claim(restarted, remote, issue)
                elif action == "handoff" and issue in observed:
                    review.add(issue)
                    eligible.discard(issue)
                elif action == "release" and issue in observed and issue in review:
                    claims.release(worker, remote, issue, observed[issue])
                    del expected[issue]
                elif action == "abandon" and issue in observed:
                    claims.release(restarted, remote, issue, observed[issue])
                    del expected[issue]
                elif action == "decide":
                    review.discard(issue)
                recovered = claims.reservations(restarted, remote)
                self.assertEqual(recovered, expected)
                self.assertLessEqual(len(recovered.keys() | review), cap)

    def test_review_ready_draft_uses_issue_identity(self):
        ready = {"number": 21, "state": "open", "draft": True,
                 "labels": [{"name": "factory-review-ready"}],
                 "head": {"ref": "factory/issue-7", "repo": {"full_name": "owner/repo"}}}
        construction = {"number": 22, "state": "open", "draft": True, "labels": []}
        with patch.object(claims, "read_gh", return_value=[[ready], [construction]]):
            review = claims.review_issues("owner/repo", "factory-review-ready")
        self.assertEqual(review, {7})
        self.assertEqual(claims.admission({8, 9}, {7: "claim"}, review, 2), ("admit", 8))

    def test_two_runners_get_one_non_forced_winner(self):
        with tempfile.TemporaryDirectory() as directory:
            remote, workers = repository(Path(directory))
            start = threading.Barrier(2)

            def reserve(path):
                start.wait(timeout=10)
                try:
                    return claims.claim(path, remote, 7)
                except ValueError:
                    return None

            with ThreadPoolExecutor(max_workers=2) as pool:
                winners = [head for head in pool.map(reserve, workers) if head is not None]
            self.assertEqual(len(winners), 1)
            self.assertEqual(claims.reservations(workers[1], remote), {7: winners[0]})
            self.assertEqual(claims.admission({7, 8}, {7: winners[0]}, set(), 1),
                             ("review-capacity", None))


if __name__ == "__main__":
    unittest.main()
