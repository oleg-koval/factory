# Progress snapshots

Store events in `.factory/<slug>/progress.jsonl` in the consuming repository. The orchestrator
is the sole writer and appends snapshots sequentially: reread the last valid snapshot before
each append, merge unchanged facts, then append one complete record. Leaves return updates to the
orchestrator and do not append concurrently. Start with
[`templates/progress-event.json`](../templates/progress-event.json). Append one complete current
snapshot on assignment acknowledgement, result, gate transition, blocker, or remote delivery.
Carry forward known fields from the previous snapshot; do not reset unchanged evidence timestamps.
Only refresh a timestamp when its evidence is observed again. Keep unknown values explicit.
Set `roadmap_acceptance_complete` to `true` only when the list contains the full roadmap AC set;
otherwise omit it or set `false`. Partial lists never prove roadmap completion.

Include `next_owner` for the next responsible person. Each blocker names `missing_evidence` or
`next_action`, `owner`, and `unaffected_work` that can continue. Record `remote_sha_at` when the
remote SHA is observed. Keep `remote_sha` and CI's `sha` aligned; CI has its own observation
timestamp. Running execution needs a fresh `execution_evidence` receipt from a process, terminal
session, or runtime status. Include the observed state and timestamp from that runtime observation;
a launch request or queued event is not runtime evidence. The status command reads the last
appended valid snapshot and never creates, polls, or refreshes evidence. Reads are bounded; corrupt
or unavailable files are reported as such, never replaced with older evidence.
