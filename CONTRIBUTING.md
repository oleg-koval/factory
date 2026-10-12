# Contributing

Evidence status: describes the repository as of 1.0.0. Nothing here claims outside contributions
have been received yet.

## Run the checks

```bash
zsh tests/check.sh
python3 scripts/verify-proof.py
python3 scripts/verify-seo-spec.py
```

`tests/check.sh` is the same gate CI runs. Run it with zsh, not bash. It exits 0 when every check
passes and prints a `FAIL` line for each check that does not. The site has its own checks; see
`site/package.json` (`npm ci`, `npm run lint`, `npm run build`).

## Report a problem

Use the issue templates. If Factory said a run was delivered and it was not, use "Factory said
delivered but it wasn't". Paste real output and redact anything private.

## Propose a hard rule

Factory's hard rules exist because a real run failed in a specific way. A rule proposal needs the same:

1. The failure: what happened, with output or a link to the run. A hypothetical is not enough.
2. The check: something the scripts can enforce, not advice for the agent to remember.
3. The test: add it to `tests/check.sh` so it is seen failing on the bad input and passing on the
   good one.
4. The changelog line: say which failure changed the rule.

Rules with no failure behind them will be declined.

## Style

Docs state their evidence status and do not claim more than was verified. Skill, reference, and
agent files avoid em dashes; `tests/check.sh` enforces this.
