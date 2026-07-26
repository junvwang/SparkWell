---
name: implement-sparks
description: 'User-invoked SparkWell workflow for generating or updating one target realization from reviewed Spark Documents.'
argument-hint: 'Specify root Spark IDs or all, plus a target or profile'
user-invocable: true
disable-model-invocation: true
---

# Implement Sparks

## Purpose

Create or update one working target realization that faithfully realizes selected Sparks.

This skill is target-agnostic. It owns the shared Spark-to-artifact workflow. Target-specific behavior comes from the selected implementation profile, existing native project, project guidance, and optional bundled target guidance.

This skill does not create, update, delete, or redesign test artifacts or test infrastructure. Testing is a separate task that requires the user to invoke `/test-sparks`.

## Preconditions

Use this skill to generate engineering artifacts from existing Spark Documents.

Treat the selected Sparks as reviewed design contracts containing the implementation-critical requested outcomes and clarified design for their concepts.

If implementation requires changing software intent, stop before implementation and tell the user to invoke `/design-sparks`. Do not invoke it automatically.

Never modify a Spark Document merely to make implementation easier. If required intent is missing or contradictory, identify the affected Spark and stop with the `/design-sparks` handoff.

## Inputs and Precedence

Always inspect:

1. The requested Sparks, composed descendants, and related Sparks needed for context.
2. `.sparkwell/config.yaml`.
3. Native manifests, build files, target artifacts, relevant existing tests, and profile-referenced guidance. Existing tests are regression evidence, not artifacts owned by this skill.
4. After resolving the implementation ID, `.sparkwell/state/realizations/<implementation-id>.yaml` when that file exists.

For a task that creates, implements, or consumes contracts, resolve `contracts.root` from `.sparkwell/config.yaml`. Inspect conventional contract paths first, then realization manifests that map files beneath that root. Broaden discovery only when needed.

Use realization state to associate contract files with stable Spark IDs and the contract files themselves for operations and schemas; do not infer a competing wire format. When provenance is missing, inspect the contract directly and mark the task **Blocked** only if its Spark correspondence remains ambiguous.

For runtime persistence, resolve provider and access choices from the selected profile and established native project. Keep persistence access and provider-specific artifacts in the current target. Mark an independently managed persistence boundary **Blocked** unless an explicit established contract defines it.

Load supporting contracts only when needed:

- `.sparkwell/specification.md` and `.sparkwell/conventions.md` to resolve unclear or invalid Spark structure or relationships.
- `.sparkwell/implementation-profiles.md` to validate or interpret profile configuration.
- `.sparkwell/realization-state.md` before creating or repairing realization state.
- [OpenAPI client guidance](./references/openapi-client.md) when `contracts.service-format` is `openapi-3.1` and runtime artifacts call a service.
- `./references/<target>.md`, when present, for general target defaults.

Apply decisions in this order:

1. Reviewed Spark intent for owned behavior, states, validation rules, responsibilities, interactions, and conceptual boundaries.
2. Implementation-profile constraints.
3. Compatible explicit user choices.
4. The established native project and its configuration.
5. Profile preferences.
6. Optional target-guide defaults.

Native files remain authoritative for artifact content, dependencies, versions, and build state. Realization state is only an index.

A Spark is a required design contract for its concept, not an exhaustive implementation checklist or a ceiling on quality. Preserve compatible established architecture, security, accessibility, reliability, maintainability, performance, platform conventions, and normal engineering quality expectations even when they are not repeated in every Spark. Do not use quality improvements as a reason to invent observable product behavior or contradict reviewed intent.

## Resolve Target and Scope

Use a named profile when it exists and, if a target was also requested, matches it. Otherwise select the only profile matching the requested target; ask when multiple profiles match.

With no matching profile, use an unambiguous existing implementation. For a new implementation, ask for unresolved consequential choices.

The **effective target** is the selected profile's `target`, otherwise the explicitly requested target, otherwise the existing implementation target. A requested target must match a selected profile.

Use the exact lowercase kebab-case effective target in `./references/<target>.md`; load that optional guide when present. Its defaults never override the profile or established project, and its absence does not make a target unsupported. A target guide supplies baseline platform considerations, not framework selection, comprehensive platform support, or permission to bypass the artifact-owning toolchain.

Bundled target guidance is available for [contract](./references/contract.md), [api-service](./references/api-service.md), [web](./references/web.md), [windows](./references/windows.md), [android](./references/android.md), and [ios](./references/ios.md).

Resolve the **implementation ID** and load `.sparkwell/state/realizations/<implementation-id>.yaml` according to `.sparkwell/realization-state.md`.

Use these scope terms:

- **Requested roots**: explicitly selected Spark IDs, or every project Spark for `all`.
- **Candidate scope**: requested roots plus all transitively composed descendants.
- **Contextual Sparks**: ancestors, used Sparks, and other Sparks read only to assess responsibilities, interactions, or impact.

If scope is omitted, infer it only when unambiguous; otherwise ask for root IDs. Multiple roots produce the union of their candidate scopes. Selecting a child does not include its parent or siblings. A `uses` relationship adds context, not scope; require explicit expansion when a missing used-Spark realization blocks a working result.

Scope is target-specific. Candidate inclusion requires implementation or validation, not automatic rewriting.

## Build the Execution Plan

Before editing:

1. Verify the manifest's implementation ID, Spark IDs, and paths; compare mapped paths with the configured or inferred source root when available.
2. Inspect mapped target artifacts, relevant unmapped source, nearby existing tests, native configuration, and enough established architecture to preserve project integration and quality. Missing or incomplete state does not prove that no realization exists.
3. Verify that candidate Sparks define the product decisions needed for their behavior, states, boundaries, validation, interactions, failures, lifecycle, and applicable platform constraints.
4. Mark unresolved product intent, target configuration, required dependencies, or artifact ownership as **Blocked** rather than guessing.

Ordinary technical choices such as file layout, internal state representation, and framework APIs are implementation decisions governed by the precedence above.

Assign each Spark in the candidate scope exactly one action:

- **Create**: no target realization exists and the Spark must be implemented.
- **Update**: its realization must change to satisfy current intent, configuration, or an affected responsibility, boundary, constraint, or interaction.
- **Validate only**: the existing realization appears consistent and is not affected by the requested change.
- **Not applicable**: the Spark does not produce an artifact for the effective target and is not required to complete another applicable realization.
- **Blocked**: a safe action cannot yet be determined.

For initial generation, create every missing candidate realization. For regeneration, re-evaluate the full candidate scope but update a descendant only when it is missing or inconsistent, a parent or profile change affects it, a shared artifact must change, or focused validation exposes a relevant failure. Otherwise classify it as **Validate only**.

Treat regeneration as impact-aware update in place. Rewrite the full candidate scope only when explicitly requested and after surfacing replacement risk. Never discard unrelated or user-maintained behavior merely because it shares an artifact with generated behavior.

Because Sparks and artifacts are many-to-many, include Sparks outside the candidate scope in regression context when shared artifacts may affect them. Require scope expansion before changing their observable behavior.

Before editing, summarize the requested roots, candidate scope, action for each candidate, and reasons for **Update**, **Validate only**, **Not applicable**, and **Blocked** decisions. Ask only when blocked, when a used Spark must enter scope, or when destructive replacement needs confirmation.

## Project UI Component Composition

For a UI target, classify every candidate `ui-component` as applicable unless its reviewed boundaries explicitly exclude that target. The selected root and every transitively composed UI Component in candidate scope must have an identifiable runtime component boundary. A component boundary may span several artifacts, and several boundaries may share one artifact when the established framework supports that structure; do not require one Spark per file or one file per Spark.

Project composed UI Components as follows:

1. Realize the selected root through the established application shell, window, page, route, view, or equivalent root UI boundary.
2. Realize each composed child through a framework-native component boundary that preserves its applicable intent.
3. Have the parent render, host, or instantiate its children and provide the information they need through idiomatic target mechanisms.
4. Have children report user intent or other outcomes to their owner through idiomatic callbacks, events, commands, delegates, bindings, or equivalent mechanisms. Do not let a child directly mutate parent or sibling state.
5. Keep child presence, information supplied to children, handling of child-reported intent, and cross-child coordination with the parent. Keep internal presentation and component-local state with the child unless reviewed intent assigns them elsewhere.
6. Use referenced Domain Models and Services as their own concepts rather than duplicating their fields, invariants, or capabilities inside UI components.
7. Preserve an existing valid component boundary even when its artifact layout differs from the Spark decomposition. Refactor only when the boundary cannot realize the reviewed component contract.

Do not inline a composed child's behavior into its parent in a way that erases the child's identifiable boundary. Do not create native controls or source modules mechanically for every body section, input, interaction, or state. Framework props, callbacks, events, commands, bindings, state containers, files, and class names remain engineering decisions.

When regenerating, update a parent only when its own behavior, composition, information flow, child presence, or coordination changes. A child-internal change does not by itself require rewriting a compatible parent.

## Implement and Maintain State

Plan the smallest coherent artifact changes for **Create** and **Update**, while preserving **Validate only** artifacts. **Not applicable** Sparks produce no target artifact. Do not mirror Sparks mechanically into files, classes, views, or tests.

Maintain `.sparkwell/state/realizations/<implementation-id>.yaml` according to `.sparkwell/realization-state.md`. For each artifact created or materially maintained by this workflow, record every Spark it is `derived-from` using stable Spark IDs. Preserve existing valid mappings, but do not add files that were only inspected or validated. The manifest does not grant ownership or permission to overwrite; always inspect an artifact before modifying it.

If the configured source root does not exist, initialize the smallest native target structure after resolving required technology choices. Use framework scaffolding only when the target requires it. If the source root exists, extend the established target and never scaffold over it. Mark the plan **Blocked** when required tooling or consequential choices are unavailable.

During implementation:

1. Reuse established project patterns, architecture, quality practices, and native framework capabilities.
2. Modify only target artifacts required by **Create** and **Update**; preserve compatible **Validate only** artifacts.
3. Do not create, update, delete, or rename test files; install test-only dependencies; create test projects; or redesign test infrastructure. Record missing, stale, or desirable coverage for a later `test-sparks` task.
4. Validate a new scaffold before adding the Spark-derived implementation.
5. Track state changes as target artifacts are created, materially maintained, moved, split, merged, repurposed, or deleted; never map a planned artifact before it exists.
6. Preserve valid mappings outside the affected scope, including mappings for test artifacts owned by `test-sparks`, and leave unrelated artifacts unchanged.

After the final artifact edits, reconcile and write the realization manifest before reporting. If validation causes further edits, reconcile it again afterward. Persist factual mappings even when validation fails; report the failure rather than encoding validation status in state.

Do not add realization mappings to Spark Documents.

## Validate and Report

Discover applicable checks from native project files, including manifests, build files, task definitions, and CI configuration. Validate target artifacts with applicable schema or syntax checks, restore or install, compile or build, type-check, lint, format, and bounded runtime smoke checks.

Run relevant existing tests when they provide a cheap regression signal. If an existing test failure exposes a runtime implementation defect, repair the runtime artifact and rerun it. If reviewed behavior intentionally makes a test expectation stale, report it for `test-sparks`; do not edit the test in this workflow. When no compatible test infrastructure exists, do not create it here.

Do not expand implementation validation into comprehensive scenario design, test generation, cross-platform test matrices, or broad visual/accessibility test campaigns. Those belong to `test-sparks`. Report the test coverage that was run, coverage needs discovered, and behavior that remains unverified.

Validate every applicable candidate Spark, including **Validate only**, plus contextual Sparks at risk through shared artifacts. Verify every **Not applicable** classification against target guidance. Do not report a Spark as realized when material behavior is missing. Report checks that could not run and why.

Summarize:

- effective target, selected profile, and implementation ID;
- requested roots and candidate scope;
- each candidate action and reason;
- Sparks created, updated, reused, blocked, or still unverified;
- realization-state path and Spark-to-artifact mapping changes;
- important decisions, validation, and results;
- existing tests run and test-authoring needs deferred to `test-sparks`;
- assumptions, conflicts, and remaining gaps.

## Guardrails

- Do not edit Sparks or invent observable behavior in this workflow.
- Do not rewrite a descendant solely because its parent was selected, or omit a missing descendant from a complete parent realization.
- Do not replace an established framework or perform destructive regeneration without an explicit compatible request.
- Do not duplicate native configuration, expose secrets, or change unrelated artifacts.
- Do not generate or modify test artifacts, test infrastructure, or diagrams.