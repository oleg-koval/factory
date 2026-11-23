"""Read GitHub's required checks for the recorded pull request head."""

import json
import re
import subprocess
from datetime import datetime, timezone
from urllib.parse import quote

PR_URL = re.compile(r"https://github\.com/([\w.-]+)/([\w.-]+)/pull/([1-9][0-9]*)/?", re.ASCII)
QUERY = """
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    nameWithOwner
    pullRequest(number: $number) {
      number headRefOid state mergedAt baseRefName
      baseRef { branchProtectionRule { requiredStatusCheckContexts } }
      commits(last: 1) {
        pageInfo { hasNextPage }
        nodes { commit { oid statusCheckRollup { contexts(first: 100) {
          pageInfo { hasNextPage }
          nodes {
            ... on CheckRun { name isRequired(pullRequestNumber: $number) status conclusion detailsUrl }
            ... on StatusContext { context isRequired(pullRequestNumber: $number) state targetUrl }
          }
        } } } }
      }
    }
  }
}
"""
SUCCESS = {"SUCCESS", "NEUTRAL", "SKIPPED"}
PENDING = {"EXPECTED", "PENDING", "QUEUED", "IN_PROGRESS", "WAITING", "REQUESTED"}
FAILURE = {"ACTION_REQUIRED", "ERROR", "FAILURE", "STALE", "STARTUP_FAILURE", "TIMED_OUT"}


def read_gh(*args: str):
    try:
        result = subprocess.run(
            ["gh", "api", "--hostname", "github.com", *args],
            check=True, capture_output=True, timeout=30,
        )
        return json.loads(result.stdout)
    except (OSError, subprocess.SubprocessError, ValueError) as error:
        raise ValueError("GitHub evidence unavailable through authenticated gh") from error


def required_contexts(repository, pr):
    if pr["baseRef"] is None:
        raise ValueError("PR base ref unavailable")
    classic = pr["baseRef"]["branchProtectionRule"]
    expected = set(classic["requiredStatusCheckContexts"]) if classic else set()
    branch = quote(pr["baseRefName"], safe="")
    rules = read_gh(f"repos/{repository}/rules/branches/{branch}?per_page=100", "--paginate", "--slurp")
    if not isinstance(rules, list) or not rules or not all(isinstance(page, list) for page in rules):
        raise ValueError("effective branch rules unavailable")
    for page in rules:
        for rule in page:
            if rule["type"] == "required_status_checks":
                expected.update(check["context"] for check in rule["parameters"]["required_status_checks"])
    return expected


def check_verdict(contexts, expected):
    if contexts["pageInfo"]["hasNextPage"]:
        raise ValueError("required-check evidence incomplete")
    checks = {}
    for row in contexts["nodes"]:
        if row["isRequired"] is False:
            continue
        if row["isRequired"] is not True:
            raise ValueError("required-check classification unavailable")
        name = row.get("name") or row["context"]
        if name in checks:
            raise ValueError(f"ambiguous required check {name!r}")
        status = row.get("status")
        state = row["conclusion"] if status == "COMPLETED" else status or row["state"]
        checks[name] = {"state": state, "url": row.get("detailsUrl") or row.get("targetUrl")}
    if not expected or checks.keys() != expected:
        raise ValueError("missing or ambiguous required-check evidence")
    values = {check["state"] for check in checks.values()}
    if not values <= SUCCESS | PENDING | FAILURE:
        raise ValueError("cancelled or ambiguous required-check evidence")
    verdict = "failing" if values & FAILURE else "pending" if values & PENDING else "green"
    return verdict, checks


def observe(owner, repo, number, head):
    repository = f"{owner}/{repo}"
    data = read_gh("graphql", "-f", f"query={QUERY}", "-f", f"owner={owner}",
                   "-f", f"repo={repo}", "-F", f"number={number}")["data"]["repository"]
    pr = data["pullRequest"]
    if data["nameWithOwner"].lower() != repository.lower() or pr["number"] != number:
        raise ValueError("GitHub reported a different repository or PR number")
    receipt = dict(repository=repository, number=number, head=pr["headRefOid"],
                   verdict="unavailable", observedAt=datetime.now(timezone.utc).isoformat(),
                   state=pr["state"], mergedAt=pr["mergedAt"])
    try:
        if receipt["head"] != head:
            raise ValueError(f"PR head mismatch: expected {head}, observed {receipt['head']}")
        commits = pr["commits"]["nodes"]
        if len(commits) != 1 or commits[0]["commit"]["oid"] != head:
            raise ValueError("required-check evidence is not bound to the recorded head")
        contexts = commits[0]["commit"]["statusCheckRollup"]["contexts"]
        receipt["verdict"], receipt["checks"] = check_verdict(contexts, required_contexts(repository, pr))
    except (KeyError, TypeError, ValueError) as error:
        receipt["error"] = str(error) if isinstance(error, ValueError) else "required-check evidence unavailable"
    return receipt
