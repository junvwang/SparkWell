---
name: spark-design
description: 'User-invoked SparkWell workflow that proposes Spark changes for confirmation before creating or evolving Spark Documents.'
argument-hint: 'Describe the design request, or use Revise: ..., Finalize, or Cancel for a pending proposal'
user-invocable: true
disable-model-invocation: true
---

# Spark Design

## Purpose

Turn a software-intent change into the smallest coherent set of new or evolved Sparks. Before writing any Spark Document, present a Spark Proposal and obtain explicit confirmation.

This Skill owns Spark design and Spark Document changes only. It does not generate or modify source code, tests, contracts, implementation documentation, profiles, guidance, or realization state.

## Sources of Authority

Read:

1. `.sparkwell/specification.md` for Spark semantics, identities, kinds, and relationships.
2. `.sparkwell/conventions.md` and applicable project kind guidance for storage and document format.
3. Relevant existing Sparks.
4. Only enough architecture guidance and nearby engineering artifacts to understand established boundaries that may affect the design.

The Specification owns semantics; Conventions own representation. Surface conflicts instead of resolving them silently, and never treat incidental implementation structure as product intent.

## Classify the Request

Choose one outcome:

- No Spark change: the request changes only engineering artifacts and leaves the software intent represented by existing Sparks unchanged.
- Evolve existing Sparks: existing concepts own the changed intent.
- Create new Sparks: the intent introduces independently meaningful concepts not represented today.
- Create and evolve: the change affects existing concepts and introduces new ones.
- Clarify: unresolved ambiguity prevents a defensible concept boundary or behavior definition.

If the outcome is **No Spark change**, explain why and stop. If it is **Clarify**, ask only the questions that materially affect intent or boundaries, then classify again.

## Design

1. Extract every requested outcome, actor, behavior, constraint, boundary, and material relationship. Distinguish explicit requirements from assumptions.
2. Map each outcome to the existing Spark that owns it or to a new candidate. Prefer evolving an existing owner over creating an overlapping Spark, and surface Spark/artifact inconsistencies.
3. Group new candidates by enduring purpose rather than requirement wording or anticipated files. Use the [granularity guide](./references/granularity.md), comparable existing Sparks, and [worked examples](./references/examples.md).
4. Assign a supported kind according to the Specification. Do not turn DTOs, endpoints, framework components, controls, tables, or other implementation shapes into Sparks merely because they exist in code.
5. Use `composes` for direct conceptual ownership and `uses` for interaction with an independently owned Spark. Model only relationships needed to understand the design.

Produce the smallest cohesive concept set that preserves every requested outcome. Each body contains the minimum sufficient intent: include a statement when omitting it would force a reader to guess material behavior, ownership, an invariant, a constraint, or a relationship. State each decision once in its owner and avoid boilerplate or repeated content.

## Proposal Checkpoint

Before modifying any file, present one complete, concise Spark Proposal in chat:

- new Sparks: ID, kind, and one-sentence `summary`;
- evolved Sparks: ID and one-sentence reason;
- renames, kind changes, and removals: reason and impact;
- material open questions.

Omit unchanged or contextual Sparks unless needed to explain a boundary. Before presenting, verify that every requested outcome has an owner, candidates do not duplicate existing responsibility, relationships are defensible, destructive changes are explicit, and no file has changed.

Request a decision through a host user-question tool such as `vscode_askQuestions` when available, offering exactly `Finalize`, `Revise`, and `Cancel`. Do not recommend or preselect `Finalize`.

- `Finalize` approves the latest Proposal and permits applying it to Spark Documents. It does not approve the generated documents or start implementation.
- `Revise` collects comments and returns one rechecked, complete replacement Proposal without writing files.
- `Cancel` ends the workflow without writing files.

If no suitable UI is available, accept a direct `Revise: <comments>`, `Finalize`, or `Cancel` reply. Also accept the explicit forms `/spark-design Revise: ...`, `/spark-design Finalize`, and `/spark-design Cancel`.

Act only when the latest complete Proposal is unambiguous. UI dismissal, silence, generic approval, or a control without a pending Proposal changes nothing. Keep Proposal and approval state in chat only.

## Apply the Proposal

After `Finalize`, re-read affected Sparks and verify that IDs, paths, and relevant project state still match the Proposal. If not, present a revised complete Proposal and require confirmation again.

Apply only the confirmed create, evolve, rename, kind-change, and removal scope. Follow the Specification and project Conventions for semantics, relationships, storage, frontmatter, and kind-specific format. Do not invent missing semantics or formats; stop for clarification instead.

Write software intent rather than incidental implementation. Preserve requested behavior and material product decisions, remove repetition, and keep ordinary framework, language, package, and file choices outside Sparks. Do not modify engineering artifacts, profiles, guidance, or realization state.

## Validate and Report

Before reporting, verify that:

- every requested outcome and constraint remains represented;
- every Spark has one meaningful purpose and no duplicate owner;
- relationships, IDs, paths, frontmatter, and kind-specific formats are valid;
- bodies contain enough behavior, state, failure, validation, lifecycle, interaction, and ownership detail without implementation-driven or boilerplate content;
- assumptions, conflicts, destructive changes, and unresolved questions are explicit;
- the written changes match the confirmed Proposal.

Summarize Spark Documents created, evolved, renamed, moved, or removed; requested-outcome coverage; important decisions; and remaining questions. Then stop for human review of the generated Spark Documents.

Do not add approval metadata or automatically invoke another workflow. The user must explicitly invoke `/spark-impl` or `/spark-test`. An implementation request in the original prompt does not bypass either review checkpoint.