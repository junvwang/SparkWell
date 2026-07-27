---
name: spark-impl
description: 'User-invoked SparkWell workflow for creating or updating one target realization from selected Sparks and project-owned implementation guidance.'
argument-hint: 'Specify root Spark IDs or all, plus a target or profile'
user-invocable: true
disable-model-invocation: true
---

# Spark Implementation

## Purpose

Create or update one working target realization of selected Sparks.

This Skill owns the shared Spark-to-artifact workflow. Target-specific decisions come only from the selected profile, project guidance, selected implementation packs, and established native project.

Do not modify Sparks, profiles, guidance, Packs, tests, test infrastructure, or diagrams. If implementation requires changing or clarifying product intent, stop and tell the user to invoke `/spark-design`; never invoke it automatically.

## Resolve Inputs and Scope

Read:

1. Requested Sparks, transitively composed descendants, and related Sparks needed for context.
2. `.sparkwell/config.yaml` and `.sparkwell/implementation-profiles.md`.
3. Every selected `.sparkwell/packs/<pack-id>/PACK.md` and its applicable references.
4. Every guidance file referenced by the profile.
5. Native manifests, build files, source, target artifacts, and relevant existing tests.
6. `.sparkwell/state/realizations/<implementation-id>.yaml` when it exists.

Installed Packs are inactive unless selected by the profile. Validate every selected Pack's required fields and cross-profile references. Reject absolute paths, `..` components, paths outside the project root, and Pack references outside their installed Pack directory. Missing, unreadable, incompatible, unsafe, or contradictory input is **Blocked**.

Apply the authoritative **Resolution and Conflicts** order from `.sparkwell/implementation-profiles.md`. Native files are authoritative for artifact content, dependencies, versions, commands, and current build state. Realization state is only a provenance index.

Select a named profile that matches any requested target. If exactly one profile matches a requested target, select it; if several match, ask for the profile ID. An unprofiled established implementation may be used only when its target and architecture are unambiguous and no new implementation surface is required. A new implementation requires a named profile and complete project guidance; otherwise identify the missing routing or architecture decisions and stop as **Blocked**.

The effective target is the selected profile's `target`, otherwise the explicit target of an established implementation. Use the profile ID as the implementation ID; without a profile, use the target only when it identifies one implementation unambiguously.

Use these scope terms:

- **Requested roots**: explicitly selected Spark IDs, or every project Spark for `all`.
- **Candidate scope**: requested roots plus all transitively composed descendants.
- **Contextual Sparks**: ancestors, used Sparks, and other Sparks read only to assess responsibilities, interactions, or impact.

Selecting a child does not include its parent or siblings. A `uses` relationship adds context, not scope; require explicit scope expansion when a used Spark must be changed or realized for a working result.

Preserve an established architecture. For a new implementation, project guidance must resolve every consequential choice needed to place and own artifacts safely. Do not choose or migrate architecture, framework, state ownership, persistence, synchronization, dependency injection, or module structure on the project's behalf.

Treat material platform-specific quality, lifecycle, permission, packaging, and validation rules as Spark intent, project guidance, Pack rules, or established native configuration according to their ownership. Do not invent them during implementation.

## Plan

Inspect realization state, mapped artifacts, relevant unmapped source, native configuration, and nearby tests. Missing or incomplete state does not prove that no realization exists.

Assign each Spark in the candidate scope exactly one action:

- **Create**: no target realization exists and the Spark must be implemented.
- **Update**: its realization must change to satisfy current intent, configuration, or an affected responsibility, boundary, constraint, or interaction.
- **Validate only**: the existing realization appears consistent and is not affected by the requested change.
- **Not applicable**: the Spark does not produce an artifact for the effective target and is not required to complete another applicable realization.
- **Blocked**: a safe action cannot yet be determined.

Re-evaluate the complete candidate scope, but update only missing, inconsistent, or materially affected realizations. Include out-of-scope Sparks in regression context when artifacts are shared, and require scope expansion before changing their observable behavior. Never perform destructive regeneration or discard unrelated behavior without an explicit compatible request.

For UI targets, preserve one identifiable runtime boundary for each applicable root and composed child. The owner supplies child information, handles child outcomes, and owns cross-child coordination; children must not directly mutate parent or sibling state. Spark boundaries and source files need not map one-to-one.

Before editing, present a concise Implementation Plan containing the target, profile, implementation ID, architecture source, Packs and guidance read, requested roots, candidate scope, and each action with its reason. Ask only for a blocker, required scope expansion, or destructive replacement confirmation.

## Implement and Maintain State

Make the smallest coherent changes for **Create** and **Update**, preserving **Validate only** artifacts and producing nothing for **Not applicable** candidates. Follow Spark intent, selected Pack rules, project guidance, established project patterns, and the artifact-owning native toolchain. Do not mirror Sparks mechanically into files, classes, views, or modules.

If the source root is absent, scaffold only when the profile and guidance fully determine the project shape and required tooling is available. Never scaffold over an established target.

Maintain `.sparkwell/state/realizations/<implementation-id>.yaml` according to `.sparkwell/realization-state.md`:

- map artifacts created or materially maintained by this workflow to every source Spark;
- do not map files that were only inspected or validated;
- preserve valid out-of-scope mappings and remove deleted paths;
- never map an artifact before it exists;
- treat mappings as provenance, not ownership or overwrite permission.

Reconcile state after artifact edits and again after validation-driven edits. Persist factual mappings even when validation fails, and report the failure separately.

## Validate and Report

Discover applicable checks from native project files, tasks, and CI. Run the narrowest relevant schema or syntax checks, restore or install, build or compile, type-check, lint, format, and bounded runtime smoke checks available for the changed target.

Run relevant existing tests as regression evidence. Repair runtime artifacts when a failure exposes an implementation defect, but never create or modify tests in this workflow. Report stale expectations and broader test-authoring needs for `/spark-test`; do not expand into comprehensive scenario design or platform matrices.

Validate every applicable candidate, every **Validate only** classification, and contextual Sparks at risk through shared artifacts. Do not report a Spark as realized when material behavior is missing. Report unavailable checks and remaining uncertainty.

Summarize the target, profile, implementation ID, scope, candidate actions, artifact and realization-state changes, important decisions, validation results, blocked or unverified behavior, and test work deferred to `/spark-test`.