---
name: spark-design
description: 'User-invoked SparkWell workflow that proposes Spark changes for confirmation before creating or evolving Spark Documents.'
argument-hint: 'Describe the design request, or use Revise: ..., Finalize, or Cancel for a pending proposal'
user-invocable: true
disable-model-invocation: true
---

# Spark Design

## Purpose

Turn requirements and software-intent changes into the smallest coherent set of new or evolved Sparks, obtain confirmation of that Spark map, and then create the reviewed Spark Documents.

This skill designs Sparks. It does not generate or modify engineering artifacts such as source code, tests, API specifications, or implementation documentation.

## Sources of Authority

Before designing Sparks:

1. Read `.sparkwell/specification.md` for Spark concepts, semantics, and document structure.
2. Read `.sparkwell/conventions.md` and other project guidance for storage, naming, review, and workflow conventions.
3. Read the relevant existing Sparks.
4. In an established implementation, inspect enough nearby engineering artifacts and architecture guidance to understand integration constraints that could affect concept boundaries. Do not treat accidental implementation details as product intent.

Do not duplicate or override the Spark Specification in this skill. If project guidance conflicts with the specification, identify the conflict and ask for clarification.

## Possible Outcomes

Classify the request as one of these outcomes:

- No Spark change: the request changes only engineering artifacts and leaves the software intent represented by existing Sparks unchanged.
- Evolve existing Sparks: existing concepts own the changed intent.
- Create new Sparks: the intent introduces independently meaningful concepts not represented today.
- Create and evolve: the change affects existing concepts and introduces new ones.
- Clarify: unresolved ambiguity prevents a defensible concept boundary or behavior definition.

Do not assume that every requirement creates a Spark.

## Design Mindset

Spark design is an exercise in software design, not document generation.

The goal is not to maximize the number of Sparks, nor to minimize them.

The goal is to produce the smallest cohesive set of independently meaningful software concepts that best represents the intended design.

### Minimum Sufficient Intent

Write the shortest Spark body that preserves correct design decisions. A statement belongs when removing it would force a reviewer or implementer to guess observable behavior, ownership, an invariant, a material constraint, or a relationship.

State each decision once in the Spark that owns it. Reference composed and used Sparks rather than restating their behavior. Omit content already established by frontmatter, standardized kind representations, project guidance, or ordinary engineering practice.

Do not add a Purpose section that only repeats `summary`, exhaustive lists of behavior the concept does not support, generic accessibility or quality expectations, repeated implementation-freedom disclaimers, empty sections, or prose that merely expands a table row. Keep such content only when it captures material software intent or resolves a plausible ambiguity.

Concision must not weaken or omit requested outcomes and implementation-critical product decisions. There is no target line count; optimize for information density and clear ownership.

## Procedure

### 1. Understand the Requirement

Extract the desired outcomes, actors, observable behavior, responsibilities, constraints, boundaries, and relevant relationships.

Preserve each distinct requested outcome and constraint through the design. A Spark may clarify and add concept-level detail, but must not compress away requested behavior.

Separate explicit requirements from assumptions. Ask focused questions only when an ambiguity would materially change software intent or Spark boundaries. Otherwise, capture the assumption in a durable Spark when implementation depends on it and also state it in the review summary.

### 2. Inspect Existing Sparks

Find the Sparks that currently own related responsibilities or behavior.

For each requirement outcome, determine whether it is already represented, changes an existing Spark, or introduces a new concept. Prefer evolving an existing Spark over creating an overlapping Spark.

If a Spark and its engineering artifacts disagree, surface the inconsistency instead of silently treating either as authoritative.

### 3. Identify Candidate Software Concepts

Group related outcomes by enduring purpose and responsibility, not by wording, acceptance criterion, or anticipated implementation structure.

Prefer stable conceptual boundaries over anticipated implementation boundaries. Narrower conceptual scope must not reduce the behavioral detail needed to understand, review, and implement that concept.

Use [the granularity guide](./references/granularity.md) to decide whether each candidate should be an independent Spark, remain part of another Spark, or be represented as a relationship.

Use existing Sparks of similar kinds as the primary calibration for vocabulary and granularity.

Use the standardized `domain-model`, `service`, and `ui-component` kinds. A project-defined kind requires guidance for its concept semantics, document representation, design rules, and target applicability. Classify each candidate with a supported kind or stop for clarification.

When a candidate primarily owns domain data semantics, consider `domain-model` only when the concept is independently meaningful and owns fields, invariants, relationships, lifecycle, or model-level behavior worth reviewing and evolving separately. Do not classify an implementation data shape as a Domain Model merely because it has fields.

When a candidate owns independently meaningful capabilities across a conceptual boundary, consider `service`. Create a Service Spark for behavior such as cross-model coordination, specialized queries, authorization, batching, orchestration, or distinct failure semantics. Do not create one merely because an implementation will contain a service class, endpoint, or automatic standard CRUD surface.

For user-facing software, identify a root `ui-component` that owns the overall interface purpose and cross-component coordination. Decompose it into composed child UI Components when modularity is intended and each child has a meaningful user-facing role, conceptual inputs, interactions, state, behavior, constraints, or reason to evolve independently. Define the parent-child interface and state ownership rather than copying a rendered component tree. Native controls, layout containers, styling fragments, and framework-only components remain engineering artifacts. UI Components use Domain Model and Service Sparks rather than duplicating their fields, invariants, or capabilities.

### 4. Model Relationships

Use `composes` when a Spark directly owns another Spark as part of the larger concept.

Use `uses` when a Spark depends on or interacts with another independently owned Spark.

Model only relationships needed to understand the design. Do not create Sparks solely to make a relationship graph more detailed.

Relationships should reflect conceptual ownership, dependency, or interaction rather than incidental implementation dependencies.

### 5. Prepare the Spark Proposal

Prepare a concise proposal in chat before creating, updating, moving, renaming, or deleting any Spark Document.

For each proposed new Spark, provide only:

- proposed Spark ID;
- kind;
- one-sentence `summary` describing what the concept is for.

For each proposed evolution, provide only:

- existing Spark ID;
- one-sentence reason it must change.

List a rename, kind change, or removal separately as an identity or destructive change with its reason and impact. Omit contextual and unchanged Sparks unless they are necessary to explain a boundary decision. Mention relationships only when they materially explain the proposed decomposition.

Use this compact shape, omitting empty sections:

```markdown
**Spark Proposal**

Create:

| Spark | Kind | Summary |
|---|---|---|
| `todo-item-model` | `domain-model` | Represents one tracked piece of work and its completion state. |

Evolve:

| Spark | Why |
|---|---|
| `todo-app-ui` | Coordinate the proposed entry and list components. |

Open questions:

- Should completed items be reopenable?
```

End the proposal by asking the user to reply with `Revise: <comments>`, `Finalize`, or `Cancel`.

During the proposal phase, do not modify Spark Documents, realization state, source code, tests, contracts, profiles, or any other project file. Keep the proposal in chat only. Do not write approval, proposal, draft, or workflow-state metadata into the repository.

When the outcome is **No Spark change**, explain that result briefly and stop without a confirmation cycle. When the outcome is **Clarify**, ask the blocking questions and prepare a proposal only after they are resolved.

### 6. Check the Proposal

Before presenting the proposal, verify that:

- every proposed Spark represents one meaningful concept;
- every requested outcome and constraint maps to a proposed or existing owner;
- no proposed Spark duplicates an existing responsibility;
- each proposed boundary and relationship has a defensible owner;
- the proposal uses the smallest cohesive set of Sparks that covers the intent;
- assumptions, inconsistencies, destructive changes, and blocking questions are explicit;
- no project file has been modified.

Consult [the worked examples](./references/examples.md) when the appropriate decomposition is uncertain.

### 7. Present and Revise the Proposal

Present the complete Spark Proposal and stop. Do not generate Spark Documents in the same turn.

Handle `Revise:`, `Finalize`, or `Cancel` only when the latest complete proposal is unambiguously available in the conversation. If no pending proposal can be identified, do not modify files; ask the user to start `/spark-design` with the design request or explicitly provide enough proposal context.

For a direct `Revise: <comments>` response to the pending proposal, incorporate the comments, recheck the design, present one complete replacement proposal, and stop again without modifying files. Do not present only a delta.

For `Cancel`, end the pending design workflow without modifying files.

For `Finalize`, continue to finalization below. The user may also explicitly invoke `/spark-design Revise: ...`, `/spark-design Finalize`, or `/spark-design Cancel`.

### 8. Finalize Spark Documents

Before writing, re-read every affected existing Spark and verify the proposed IDs and paths are still available. Inspect relevant worktree changes when available. If the repository changed in a way that invalidates the proposal, do not write files; present a revised complete proposal and wait for confirmation again.

Create or update Spark Documents using the project's storage, naming, identifier, frontmatter, and body conventions.

When it improves readability, consider `-model` for `domain-model`, `-service` for `service`, and `-ui` for `ui-component`. This is optional naming guidance. Keep the human-readable name natural and always use the `kind` field, not the suffix, to classify the Spark.

Describe software intent rather than incidental implementation. Include enough behavior, responsibilities, constraints, boundaries, and interactions for humans to review the concept and for later artifact generation to be grounded in it.

Where applicable, describe success, failure, empty, loading, transitional, validation, lifecycle, persistence, and concurrency behavior. Include only topics that matter to the concept; do not add boilerplate sections with no useful intent.

After drafting, remove statements duplicated by frontmatter or another Spark, collapse repeated rules into their authoritative owner, and delete generic quality or implementation-choice prose already supplied by project guidance.

Place enduring platform-specific observable behavior or constraints in the relevant Spark when they are part of product intent. Keep framework, language, library, packaging, and ordinary platform implementation choices in implementation profiles, project guidance, or native artifacts unless those choices are themselves essential software intent.

For `domain-model`, follow the standardized kind semantics in the Spark Specification and the field-table, type, relationship, and `service-exposure` frontmatter representation in project conventions. Preserve stable logical field identities, distinguish field rules from cross-field invariants, and model referenced domain concepts through `composes` or `uses`. Add `service-exposure` only when reviewed intent explicitly enables automatic standard service operations; omit it otherwise. Do not infer permission for an operation absent from `standard-operations`.

For `service`, follow the standardized kind semantics and `## Capabilities` table in project conventions. Give each capability a stable logical identifier, describe concept-level inputs and outputs, capture observable failure behavior, and include every independently owned referenced concept in `uses`. Do not duplicate Domain Model fields or prescribe transport routes, DTOs, controllers, or framework service types.

For `ui-component`, follow the standardized kind semantics and body conventions in project guidance. Organize the body for clarity rather than filling a fixed template. Describe information received from owners, reported user intent, observable states, transitions, behavior, constraints, boundaries, and accessibility intent when material. When the component composes children, capture material child roles, information flow, interaction handling, parent coordination, and layout relationships without repeating child definitions. Do not prescribe framework props, callbacks, events, commands, bindings, classes, files, or native controls.

When no storage or document convention exists and existing Sparks do not establish one, do not invent a format. Report the missing convention and stop without writing.

Spark Documents should optimize for human review and conceptual understanding rather than implementation completeness.

### 9. Check the Finalized Design

Before reporting the written documents, verify that:

- every Spark represents one meaningful concept;
- every requested outcome and constraint is represented by one or more Sparks;
- no required outcome or constraint was weakened, generalized away, or lost during Spark decomposition;
- new Sparks do not duplicate existing responsibilities;
- each boundary and responsibility has a clear owner;
- composition and usage relationships are consistent with conceptual ownership;
- bodies contain enough applicable behavioral, state, failure, validation, lifecycle, and interaction detail for implementation to proceed without inventing product behavior;
- bodies describe intent without unnecessary implementation detail;
- each decision appears once in its authoritative Spark and related Sparks do not restate it;
- summaries, tables, and prose do not duplicate one another without adding material meaning;
- bodies contain no generic quality, implementation-freedom, empty-section, or exhaustive negative-list boilerplate;
- every Domain Model has a valid `## Data` table, stable field identities, technology-independent types, applicable invariants and relationships, and valid `service-exposure` frontmatter when automatic standard service operations are intended;
- every Service has a valid `## Capabilities` table, stable capability identities, concept-level inputs and outputs, applicable failure behavior, and consistent `uses` relationships;
- every UI Component clearly communicates its purpose and boundary, applicable information and interaction flow, material states and ownership, child composition responsibilities, and consistent `uses` relationships;
- proposed design remains compatible with relevant established architecture, or any intentional architectural conflict is surfaced;
- assumptions and unresolved questions are explicit;
- every implementation-critical decision learned during the design conversation is captured in durable artifacts;
- the design uses the smallest cohesive set of Sparks that covers the intent.

### 10. Present Spark Documents for Review

Summarize the Sparks created, evolved, renamed, or removed; requested-outcome coverage; important design decisions; and remaining assumptions or questions.

Then stop so a human can review the generated Spark Documents. Do not add approval status or other review metadata.

After document review, the user must explicitly invoke `/spark-impl` or `/spark-test` for a later phase. Do not invoke either workflow automatically.

Invite reviewers to remove repetition as well as fill gaps. A longer document is not more complete when its extra text repeats another owner or project-wide guidance.

Implementation wording supplied to `/spark-design` does not bypass either review checkpoint or activate `/spark-impl`.

## Success Criteria

A successful Spark design should:

- faithfully represent the intended software design;
- preserve all relevant requested outcomes and constraints;
- add the clarification and concept-level detail needed for implementation rather than merely summarizing requirements;
- be understandable without reading engineering artifacts;
- be reviewable by humans;
- support future engineering-artifact generation;
- avoid implementation-driven decomposition.

## Guardrails

- Do not create one Spark per requirement by default.
- Do not model files, classes, endpoints, tables, framework components, or implementation layers as Sparks unless they represent independently meaningful software concepts.
- Do not create Domain Model Sparks for DTOs, API payloads, ORM entities, database rows, or target-language types unless they independently satisfy the Domain Model semantics.
- Do not create Service Sparks for controllers, endpoints, framework service classes, generated clients, or automatic standard CRUD unless they independently satisfy the Service semantics.
- Do not create unsupported Spark kinds unless project guidance defines their semantics, document representation, design rules, and target applicability.
- Do not create a UI Component Spark for a native control, layout container, style fragment, or framework-only component.
- Do not repeat another Spark's owned behavior for local context; reference that Spark instead.
- Do not add sections or boundary lists solely to make a document look complete.
- Do not create, update, move, rename, or delete Spark Documents before the user finalizes the current proposal.
- Do not accept `Revise:`, `Finalize`, or `Cancel` when no latest complete proposal is available.
- Do not treat silence, approval of an earlier proposal, or ambiguous positive feedback as `Finalize`.
- Do not persist proposal or approval state in project files.
- Do not generate engineering artifacts as part of this skill.
- Do not invent missing Spark semantics, storage conventions, or workflow metadata.
- Do not silently resolve unclear ownership or contradictions between Sparks and engineering artifacts.
- Do not introduce implementation terminology into a Spark unless it represents the software concept itself.