---
name: spark-config
description: 'User-invoked SparkWell workflow that proposes and finalizes project implementation profiles and architecture guidance without generating product code.'
argument-hint: 'Describe the target/profile to configure, or use Revise: ..., Finalize, or Cancel for a pending proposal'
user-invocable: true
disable-model-invocation: true
---

# Spark Config

## Purpose

Create or revise one project-owned implementation profile and its architecture guidance so `/spark-impl` can generate code without choosing consequential project design.

This workflow owns `.sparkwell/config.yaml` profile entries and profile-referenced guidance documents. It does not design Sparks, generate product code or tests, install dependencies, scaffold projects, or update realization state.

## Sources of Authority

Always inspect:

1. `.sparkwell/config.yaml`.
2. `.sparkwell/implementation-profiles.md`.
3. Every installed pack selected by the affected profile, starting with `.sparkwell/packs/<pack-id>/PACK.md`.
4. Existing guidance referenced by the affected profile.
5. Native manifests, build files, source layout, and representative code for the target.
6. Relevant reviewed Sparks only when needed to distinguish product behavior from implementation architecture.

Preserve unrelated profiles, installed packs, guidance, and project files.

## Classify the Implementation

Classify the requested profile as:

- **Established implementation**: substantive native artifacts reveal a coherent architecture.
- **New implementation**: the source root is missing, contains only a generic scaffold, or lacks enough architecture to extend safely.

For an established implementation, summarize and preserve the detected architecture. Do not propose a framework, architecture, persistence, state-management, or module migration unless the user explicitly requests that migration.

For a new implementation, identify consequential choices relevant to the target, including framework or project type, architecture and module boundaries, state ownership, persistence boundary, local and remote data flow, source root, and artifact ownership. Do not require irrelevant choices. Ask focused questions when the answer would materially change the architecture.

Separate product intent from implementation decisions. User-visible offline behavior, synchronization semantics, conflict behavior, and failure outcomes belong in Sparks. Framework, provider, repository, ORM, adapter, mapping, and module-layout decisions belong in project guidance or established native files.

## Choose the Configuration Layer

Use:

- `target` and `source-root` for deterministic artifact routing;
- `packs` as a map from activated pack IDs to pack-owned machine-readable configuration;
- `guidance` for project architecture and code-generation decisions;
- native project files for dependencies, versions, commands, and actual build configuration.

Do not encode general architecture settings in YAML. If a choice needs explanation or is not required for deterministic pack routing, put it in guidance. Use `{}` for a pack that requires no configuration.

Recommend `.sparkwell/guidance/<profile-id>.md` for a profile's primary guidance. Use more than one guidance file only when they have distinct scopes and equal authority. Never encode secrets.

Activate a pack only when its `.sparkwell/packs/<pack-id>/PACK.md` exists and the requested target and configuration satisfy its contract. If a requested bundled pack is not installed, stop without modifying files and tell the user to run `sparkwell init --pack <pack-id>`. `/spark-config` configures packs but does not install or edit them.

Validate every pack-defined required field, value, and cross-profile reference before finalization. A referenced profile must already exist or be created in the same finalized proposal and satisfy the selected pack's target, pack, constraint, and source-root requirements. Mark unresolved or incompatible references **Blocked**.

Reject absolute paths, paths containing a `..` component after normalizing `/` and `\`, and paths that resolve outside the project root. Pack references must also remain inside their installed pack directory.

Guidance may describe architecture and module boundaries, state and data flow, model mappings, persistence responsibilities, repository and dependency-injection patterns, error and concurrency handling, UI projection, artifact placement, and workflow-maintained versus human-maintained files.

## Prepare the Configuration Proposal

Before modifying any file, present a concise proposal in chat.

Use this shape, omitting empty sections:

```markdown
**Implementation Configuration Proposal**

Profile: `web-react`
Target: `web`
Source root: `src/web`
Classification: New implementation

Packs:
- None

Guidance:
- `.sparkwell/guidance/web-react.md` — Defines React, feature modules, state ownership, IndexedDB repository mapping, and artifact placement.

Open questions:
- Should shared state be limited to cross-feature data?
```

For an existing profile, list only changed fields and guidance plus the reason for each change. Surface removed profiles, renamed profiles, source-root changes, framework changes, and architecture migrations separately with their impact.

During the proposal phase, do not modify `.sparkwell/config.yaml`, guidance, source code, native configuration, Sparks, tests, realization state, or any other project file. Keep proposal and approval state in chat only.

When no configuration change is needed, explain that result briefly and stop without a confirmation cycle.

## Review and Revise

Present the complete Implementation Configuration Proposal in chat before requesting a decision so the user can review it.

When the host exposes a user-question tool such as `vscode_askQuestions`, use it to open a decision UI offering exactly `Finalize`, `Revise`, and `Cancel`. Do not recommend or preselect `Finalize`. A decision returned by this UI is equivalent to the corresponding direct control.

If the user selects `Revise`, collect revision comments through the UI before incorporating them and presenting one complete replacement proposal. Do not present only a delta. Request a new decision for the replacement proposal.

If no suitable decision UI is available, ask the user to reply with `Revise: <comments>`, `Finalize`, or `Cancel`. If the UI is dismissed or returns no decision, stop without modifying files. The user may also explicitly invoke `/spark-config Revise: ...`, `/spark-config Finalize`, or `/spark-config Cancel`.

Handle a UI decision or direct control only when the latest complete Implementation Configuration Proposal is unambiguously available. If none is available, do not modify files; ask the user to invoke `/spark-config` with the configuration request or sufficient proposal context.

For `Revise: <comments>`, incorporate the comments and present one complete replacement proposal without modifying files. Do not present only a delta.

For `Cancel`, end without modifying files.

For `Finalize`, continue below. Do not modify configuration files until the user explicitly selects or replies with `Finalize`.

Do not interpret a dismissed UI, silence, `yes`, `looks good`, or other ambiguous positive feedback as `Finalize`.

## Finalize Configuration

Before writing, re-read `.sparkwell/config.yaml`, affected guidance, and representative native artifacts. If relevant state changed or invalidates the proposal, present a revised complete proposal and wait for confirmation again.

On finalization:

1. Preserve installed packs and unrelated profiles.
2. Create or update exactly the proposed profile entry.
3. Create or update exactly the proposed guidance documents.
4. Keep paths project-relative and inside the project root; reject absolute paths and `..` components.
5. Keep native dependencies, versions, commands, and secrets out of Sparkwell configuration.
6. Validate YAML structure, profile ID uniqueness, required routing fields, pack-owned configuration, cross-profile references, guidance paths, and agreement among packs and guidance.
7. Compare packs and guidance with established native architecture and report any unresolved conflict as **Blocked** rather than writing a migration implicitly.

Do not scaffold, compile, install, or generate product artifacts as part of this workflow.

## Report for Review

Summarize the profile and guidance files created or updated, important architecture decisions, validation performed, and remaining open questions.

Then stop for human review. The user must separately invoke `/spark-impl`; do not invoke it automatically.

## Guardrails

- Do not modify files before explicit `Finalize` of the latest complete proposal.
- Do not persist proposal or approval state.
- Do not modify Spark Documents, product code, tests, realization state, dependencies, or native build configuration.
- Do not invent product behavior or move it into implementation guidance.
- Do not replace established architecture unless the user explicitly requested and finalized that migration.
- Do not install or modify implementation packs.
- Do not use guidance list order to resolve conflicts.
- Do not include credentials, tokens, connection secrets, or machine-specific paths.