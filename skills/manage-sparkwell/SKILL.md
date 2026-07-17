---
name: manage-sparkwell
description: Enable or disable SparkWell integration for one or more coding agents in an initialized project. Use only when the user asks to turn SparkWell on, turn it off, enable it, disable it, or change which agent integrations are active.
---

# Manage SparkWell

Manage the activation state of SparkWell agent integrations without deleting the project's Sparks, implementation profiles, realization state, or other `.sparkwell/` content.

## Procedure

1. Confirm the project contains `.sparkwell/config.yaml`. If it does not, explain that SparkWell must be initialized first.
2. Resolve which adapter or adapters the request applies to:
   - GitHub Copilot or VS Code Copilot: `github-copilot`
   - Claude Code: `claude-code`
   - An `AGENTS.md`-compatible integration: `agents-md`
3. If the user says only "SparkWell" and the current coding agent is unambiguous, use that adapter. If the current agent is unclear or several integrations may be intended, ask which adapters to change.
4. Preview the operation first:

   ```text
   sparkwell enable --agent <adapter> --dry-run
   sparkwell disable --agent <adapter> --dry-run
   ```

5. Report conflicts before making changes. Never add `--force` unless the user explicitly approves replacing conflicting SparkWell-managed content.
6. Run the same command without `--dry-run` after the preview is safe.
7. Report the selected adapters and the created, removed, updated, and unchanged file counts.

Repeat `--agent <adapter>` to toggle multiple integrations in one operation.

If the `sparkwell` command is unavailable, do not manually edit instruction or skill files. Explain that the SparkWell CLI used to initialize the project must be installed or invoked from its package location.

## Toggle Semantics

- `disable` removes the selected adapters' SparkWell instruction blocks and methodology skills.
- This control skill remains available so SparkWell can be enabled again.
- `enable` restores the selected adapters' SparkWell instruction blocks and methodology skills.
- Neither operation removes or rewrites core `.sparkwell/` content or Spark Documents.