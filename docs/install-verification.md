# Installer verification

Evidence status: verified from the public `oleg-koval/factory` repository on 2026-09-22 against
commit `54d2cc0f114c6db3fe5a3e8e1fd00357b4a5ee84`. This proves public-source discovery and local
installation into a clean repository with the `skills` CLI. It does not prove fresh-session
invocation, a second-machine install, or a global install target.

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

## Still unproven

- A clean install on a second machine.
- The global `-g` target used by the recommended end-user commands.
- Invocation behavior inside fresh Claude Code and Codex sessions.
- A complete cross-provider Factory run reaching an honest terminal state.
