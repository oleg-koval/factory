# Installer verification

Evidence status: verified locally on 2026-09-21 against commit `761951d`. This proves local
package discovery and installation with `skills` CLI 1.7.0. It does not prove that a public
repository or public install command exists.

## Command

From a new temporary Git repository:

```bash
npx --yes skills add <local-factory-repository> \
  -a claude-code -a codex -y
```

## Observed

- The CLI discovered exactly one root skill named `factory`.
- The canonical package was installed at `.agents/skills/factory` for Codex.
- Claude Code received `.claude/skills/factory` as a symlink to that canonical copy.
- Both resolved to the same `SKILL.md`.
- `zsh tests/check.sh` passed from the installed package.
- The disposable repository was moved to Trash after verification.

## Still unproven

- Installation from `oleg-koval/factory` until that repository exists publicly.
- A clean install on a second machine.
- Invocation behavior inside fresh Claude Code and Codex sessions.
- A complete cross-provider Factory run reaching an honest terminal state.
