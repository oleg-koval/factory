# Progress snapshots

Store events in `.factory/<slug>/progress.jsonl` in the consuming repository. Start with
[`templates/progress-event.json`](../templates/progress-event.json). Append one complete current
snapshot on assignment acknowledgement, result, gate transition, blocker, or remote delivery.
Carry forward known fields from the previous snapshot; do not reset unchanged evidence timestamps.
Only refresh a timestamp when its evidence is observed again. Keep unknown values explicit.

Include `next_owner` for the next responsible person. Each blocker names `missing_evidence` or
`next_action`, `owner`, and `unaffected_work` that can continue. Record `remote_sha_at` when the
remote SHA is observed. Keep `remote_sha` and CI's `sha` aligned; CI has its own observation
timestamp. Running execution needs a fresh `execution_evidence` receipt from a process, terminal
session, or runtime status. The status command reads the newest snapshot and never creates or
refreshes evidence.
