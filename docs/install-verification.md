# Installer verification

Evidence status: verified from the public `oleg-koval/factory` repository on 2026-09-22 against
commit `54d2cc0f114c6db3fe5a3e8e1fd00357b4a5ee84`. This proves public-source discovery and local
installation into a clean repository with the `skills` CLI. Separate fresh Codex and Claude Code
consult invocations were verified on 2026-09-23. A full Phase 0–6 run was later completed on the
Factory codebase; it is documented in [the hydration-warning case study](../proof/case-studies/hydration-warning/README.md).
These checks do not prove a second-machine install or a full run from a clean global install.

## Command

From a new temporary Git repository:

```bash
npx --yes skills add oleg-koval/factory \
  -a claude-code -a codex -y
```

## Observed

- The CLI discovered exactly one root skill named `factory`.
- The CLI cloned `https://github.com/oleg-koval/factory.git` as its source.
- The canonical package was installed at `.agents/skills/factory` for Codex.
- Claude Code received `.claude/skills/factory` as a symlink to that canonical copy.
- Both resolved to the same `SKILL.md`.
- The installed copy reported `PROOF: PASS claims=3 artifacts=13 executable_cases=3`.
- The installed copy reported `SEO SPEC: PASS routes=7 evidence_links=21`.
- `zsh tests/check.sh`, `shellcheck scripts/run.sh`, and the Codex skill validator passed from
  the installed package.
- The disposable repository was moved to Trash after verification.

## Fresh Codex consult (2026-09-23)

An empty temporary Git repository received the public root skill using Codex's skill-installer
helper with `--repo oleg-koval/factory --path . --name factory --dest <temp>/.agents/skills`.
The installed `SKILL.md` SHA-256 matched the same file at public main commit
`5976c9d33275feaf854df0d841a456969ce2a16c`. A new, ephemeral `codex exec` session ran
read-only with `$factory consult` about a hypothetical intermittent button failure.

The session explicitly selected `factory`, read its installed `SKILL.md`, `references/roles.md`,
and `references/phase-0-intake.md`, classified the report as an unverified bug at full depth,
asked for source evidence, and ended with “Start a Factory run with this input?” It made no
product-source changes. This verifies fresh-session Codex discovery and consult behavior from a
project-local public install, not a global installation or a delivery run.

## Fresh Claude Code consult (2026-09-23)

An empty temporary Git repository received the public root skill at
`.claude/skills/factory` using the same installer helper. The installed `SKILL.md` SHA-256
matched public main commit `24ce845a447e426372eb4e11fff5a7a7d4a47364`. A new,
non-persistent Claude Code session invoked `/factory consult` in
plan mode with `--setting-sources project`. Its tool trace read `references/roles.md` and
`references/phase-0-intake.md` from that temporary install, then returned a consult verdict:
the hypothetical intermittent button report was a symptom, not a verified defect. No
product-source changes were made.

The first attempt without `--setting-sources project` read the pre-existing user-global
Factory skill instead. That attempt is **not** counted as public-install proof; user skills
can shadow project skills. The isolated attempt verifies fresh-session Claude Code discovery
and consult behavior from the public project-local copy, not the documented global `-g`
installation or a full delivery run.

## Still unproven

- A clean install on a second machine.
- The global `-g` target used by the recommended end-user commands.
- A full delivery run starting from an independently installed copy on a clean target.
- A single run repeated in both Claude Code and Codex.
