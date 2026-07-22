---
name: design-sparks
description: 'Design, create, or evolve Spark Documents from requirements and software-intent changes in a Sparkwell project. Use when mapping requirements to Sparks, identifying affected Sparks, choosing Spark granularity, decomposing or composing concepts, or preparing Spark changes for human review. Also use before implementation when requested behavior changes software intent. Do not use for implementation-only changes already represented by existing Sparks.'
argument-hint: 'Describe the requirement or software-intent change'
---

# Design Sparks

## Purpose

Turn requirements and software-intent changes into the smallest coherent set of new or evolved Sparks that represents the intended software design.

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

When a candidate primarily owns domain data semantics, consider `domain-model` only when the concept is independently meaningful and owns fields, invariants, relationships, lifecycle, or model-level behavior worth reviewing and evolving separately. Do not classify an implementation data shape as a Domain Model merely because it has fields.

When a candidate owns independently meaningful capabilities across a conceptual boundary, consider `service`. Create a Service Spark for behavior such as cross-model coordination, specialized queries, authorization, batching, orchestration, or distinct failure semantics. Do not create one merely because an implementation will contain a service class, endpoint, or automatic standard CRUD surface.

For user-facing software, identify concepts by user purpose, behavior, state, and interaction boundaries rather than by the component tree. Create or separate a UI concept only when it owns independently meaningful behavior, constraints, lifecycle, or a reason to evolve or be reused; buttons, inputs, cards, rows, dialogs, and framework components normally remain engineering artifacts. A UI concept should use Domain Model and Service Sparks rather than duplicate their fields, invariants, or capabilities.

### 4. Model Relationships

Use `composes` when a Spark directly owns another Spark as part of the larger concept.

Use `uses` when a Spark depends on or interacts with another independently owned Spark.

Model only relationships needed to understand the design. Do not create Sparks solely to make a relationship graph more detailed.

Relationships should reflect conceptual ownership, dependency, or interaction rather than incidental implementation dependencies.

### 5. Draft Spark Changes

Create or update Spark Documents using the project's storage, naming, identifier, frontmatter, and body conventions.

Describe software intent rather than incidental implementation. Include enough behavior, responsibilities, constraints, boundaries, and interactions for humans to review the concept and for later artifact generation to be grounded in it.

Where applicable, describe success, failure, empty, loading, transitional, validation, lifecycle, persistence, and concurrency behavior. Include only topics that matter to the concept; do not add boilerplate sections with no useful intent.

Place enduring platform-specific observable behavior or constraints in the relevant Spark when they are part of product intent. Keep framework, language, library, packaging, and ordinary platform implementation choices in implementation profiles, project guidance, or native artifacts unless those choices are themselves essential software intent.

For `domain-model`, follow the standardized kind semantics in the Spark Specification and the field-table, type, relationship, and `service-exposure` frontmatter representation in project conventions. Preserve stable logical field identities, distinguish field rules from cross-field invariants, and model referenced domain concepts through `composes` or `uses`. Add `service-exposure` only when reviewed intent explicitly enables automatic standard service operations; omit it otherwise. Do not infer permission for an operation absent from `standard-operations`.

For `service`, follow the standardized kind semantics and `## Capabilities` table in project conventions. Give each capability a stable logical identifier, describe concept-level inputs and outputs, capture observable failure behavior, and include every independently owned referenced concept in `uses`. Do not duplicate Domain Model fields or prescribe transport routes, DTOs, controllers, or framework service types.

When no storage or document convention exists and existing Sparks do not establish one, do not invent a format. Present the proposed Spark map and document content in chat, identify the missing convention, and stop for clarification.

Spark Documents should optimize for human review and conceptual understanding rather than implementation completeness.

### 6. Check the Design

Before presenting the changes, verify that:

- every Spark represents one meaningful concept;
- every requested outcome and constraint is represented by one or more Sparks;
- no required outcome or constraint was weakened, generalized away, or lost during Spark decomposition;
- new Sparks do not duplicate existing responsibilities;
- each boundary and responsibility has a clear owner;
- composition and usage relationships are consistent with conceptual ownership;
- bodies contain enough applicable behavioral, state, failure, validation, lifecycle, and interaction detail for implementation to proceed without inventing product behavior;
- bodies describe intent without unnecessary implementation detail;
- every Domain Model has a valid `## Data` table, stable field identities, technology-independent types, applicable invariants and relationships, and valid `service-exposure` frontmatter when automatic standard service operations are intended;
- every Service has a valid `## Capabilities` table, stable capability identities, concept-level inputs and outputs, applicable failure behavior, and consistent `uses` relationships;
- proposed design remains compatible with relevant established architecture, or any intentional architectural conflict is surfaced;
- assumptions and unresolved questions are explicit;
- every implementation-critical decision learned during the design conversation is captured in durable artifacts;
- the design uses the smallest cohesive set of Sparks that covers the intent.

Consult [the worked examples](./references/examples.md) when the appropriate decomposition is uncertain.

### 7. Present for Human Review

Summarize:

- the outcome classification;
- Sparks created, evolved, or left unchanged;
- requested-outcome coverage across the proposed Sparks;
- important granularity and relationship decisions;
- assumptions, inconsistencies, and open questions.

Then stop so a human has an offline opportunity to review the Spark changes before engineering artifacts are generated. Do not add approval status or other review metadata unless project conventions require it.

Invite the human to edit the proposed Spark Documents directly. Human review should verify requirement coverage, behavioral completeness, success and failure behavior, states, validation rules, invariants, ownership, interactions, lifecycle, persistence, applicable platform intent, and freedom for ordinary engineering decisions. The review is not complete merely because the documents are well formatted.

An implementation request in the original prompt does not bypass this review checkpoint when software intent changed.

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
- Do not generate engineering artifacts as part of this skill.
- Do not invent missing Spark semantics, storage conventions, or workflow metadata.
- Do not silently resolve unclear ownership or contradictions between Sparks and engineering artifacts.
- Do not introduce implementation terminology into a Spark unless it represents the software concept itself.