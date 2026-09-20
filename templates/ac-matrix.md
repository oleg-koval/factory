| AC | test id | kind | status | reason | owner | commit |
|---|---|---|---|---|---|---|

`status` is exactly one of:

- `met` - a test ran and passed, or the user performed a manual check whose words you recorded.
- `unrunnable` - the test exists but cannot execute in this environment. `reason` says in one
  line what is missing (no dependencies installed, no live backend, env vars unset, no device).
  `owner` names the person or team who can run it. Never counted as met.
- `failed` - it ran and did not pass.

There is no fourth value. "partly met" is not a status: either split the AC into the part that
is proven and the part that is not, or mark it `unrunnable` and name its owner.

`reason` and `owner` stay empty for `met` rows.
