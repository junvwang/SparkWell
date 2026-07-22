# Sparkwell Specification

> Status: Draft

This document defines the concepts, semantics, and structure of **Sparks**.

It serves as the normative specification for Sparkwell projects.

This specification intentionally defines **what a Spark is**, not how Sparks are created, reviewed, stored, or transformed into engineering artifacts.

---

# Purpose

Sparkwell introduces **Spark** as the primary design artifact of a software system.

Rather than describing software primarily through implementation, Sparkwell describes software through **Sparks**—persistent representations of meaningful software concepts.

Engineering artifacts are realizations of Sparks rather than the primary representation of software design.

---

# Spark

A **Spark** represents a meaningful software concept.

A Spark captures the software intent of that concept independently of any particular engineering artifact.

A Spark may represent software concepts at different levels of abstraction. Bundled SparkWell workflows currently support:

- a domain model
- a service
- a modular UI component

Spark intentionally does not prescribe a fixed granularity.

Projects should choose a granularity that makes each Spark meaningful to understand, review, evolve, and reuse.

---

# Spark Document

A Spark is described by a **Spark Document**.

A Spark Document is the canonical representation of a Spark within a Sparkwell project.

Each Spark Document consists of two complementary parts:

- Frontmatter
- Body

These parts serve different purposes.

---

## Frontmatter

The frontmatter contains concise, structured metadata describing the identity and relationships of a Spark.

Its purpose is to support:

- identification
- navigation
- indexing
- dependency analysis
- tooling

Every Spark Document defines the following core fields:

| Field | Purpose |
|--------|---------|
| `id` | Stable identifier of the Spark |
| `name` | Human-readable name |
| `kind` | Kind of software concept represented |
| `summary` | Brief description of the Spark |
| `composes` | Collection of Sparks directly composed by this Spark |
| `uses` | Collection of other Sparks referenced but not owned |

`composes` and `uses` remain part of the Spark Document when they are empty. Individual projects define how fields and empty collections are serialized.

Projects may define additional metadata when appropriate.

Established kinds may define standardized kind-specific frontmatter fields. Those fields are part of the represented software intent and must follow the semantics defined for their kind.

The frontmatter should remain concise and relatively stable.

---

## Identity

Every Spark has an `id` that is unique within its Sparkwell project.

The identifier remains stable for the lifetime of the represented concept. Changing a Spark's human-readable name does not change its identity.

IDs may use a kind suffix to make references easier to read: `-model` for `domain-model`, `-service` for `service`, and `-ui` for `ui-component`. This is a naming suggestion only. The `kind` field is authoritative, and workflows must not infer kind, validity, applicability, or behavior from an ID suffix.

Changing a Spark's kind does not by itself change its stable ID. An intentional ID rename is a separate identity migration that updates every relationship and realization-state reference.

Relationships reference Sparks by their stable identifiers.

---

## Kinds

The `kind` identifies the category of software concept represented by a Spark.

Bundled SparkWell workflows support exactly these standardized kinds:

- `domain-model`
- `service`
- `ui-component`

The kind system remains extensible, but a project-defined kind is supported only when project guidance defines its concept semantics, document representation, design rules, and target applicability. Without that guidance, design and realization workflows must treat the kind as unsupported rather than infer behavior from its name.

The standardized kinds define additional semantics for the concepts they represent. Those semantics do not impose one universal body template. Project conventions define how kind-specific information is serialized.

### Domain Model

A Spark with `kind: domain-model` represents a meaningful domain concept whose data semantics and rules must remain recognizable across implementations.

A Domain Model Spark communicates:

- the concept's domain meaning and purpose;
- stable logical fields and their meanings;
- domain-level types and required or optional values;
- defaults, validation rules, ranges, and invariants;
- field mutability and applicable lifecycle behavior;
- relationships with other domain concepts;
- model-level behavior that belongs to the concept;
- any standard public service operations explicitly enabled for automatic derivation.

A Domain Model may include the optional `service-exposure` frontmatter field. Its non-empty `standard-operations` list explicitly enables the standard operations that may be derived automatically from the model. Omitting `service-exposure` means that no model-derived public service is generated.

`service-exposure` governs only standard public service behavior derived from the Domain Model. It does not prevent an explicit Service Spark from using the model. When the model must not cross any public service boundary, the Domain Model must state that stronger prohibition in its body. Implementation configuration must not add or remove operations declared by the Spark.

Field identifiers are stable logical identities within the model. Renaming a display label does not by itself rename a field. A field-identity change is software-intent evolution and may affect every realization of the model.

Domain types describe software intent rather than language, transport, ORM, or database types. A Domain Model Spark does not prescribe classes, DTOs, wire schemas, tables, columns, or framework annotations unless one of those constructs is itself essential software intent.

DTOs, API schemas, ORM entities, database records, and target-language types are engineering artifacts. They may realize a Domain Model Spark but do not become Domain Model Sparks merely because they contain data.

Not every noun or data structure deserves a Domain Model Spark. The concept must have independently meaningful semantics, rules, relationships, or a reason to evolve and be reviewed separately.

### Service

A Spark with `kind: service` represents an independently meaningful set of capabilities offered across a conceptual boundary.

A Service Spark communicates:

- the service's purpose and boundary;
- stable logical capabilities;
- the domain concepts each capability uses;
- concept-level inputs and outputs;
- observable success and failure behavior;
- applicable permissions, concurrency, idempotency, and interaction rules.

Capability identifiers are stable logical identities within the service. Changing descriptive wording does not by itself rename a capability. A capability-identity change is software-intent evolution and may affect every contract and implementation that realizes the service.

A Service Spark references independently owned Domain Models and other concepts through `uses`. It does not duplicate their fields, validation, or invariants. It describes only the behavior and rules owned by the service boundary.

A Service Spark does not prescribe HTTP routes, verbs, transport schemas, controllers, framework services, or generated operation names. Those are engineering artifacts unless they are themselves essential software intent.

Do not create a Service Spark solely to restate standard model operations derived from Domain Model service exposure. Create one when service behavior has an independently meaningful boundary, such as cross-model operations, specialized queries, authorization, batching, orchestration, or distinct failure semantics.

### UI Component

A Spark with `kind: ui-component` represents a modular user-interface concept with an identifiable interaction and composition boundary across applicable UI implementations.

A UI Component Spark communicates:

- the component's user-facing purpose;
- information received from an owning UI Component or other established boundary;
- interactions through which it reports user intent or other observable output;
- observable states and state transitions owned by the component;
- user-visible behavior, validation, and failure handling;
- child UI Components it owns and the roles they play;
- applicable layout relationships, accessibility behavior, and interaction constraints;
- state and coordination responsibilities that remain with its owner;
- boundaries separating its intent from Domain Models, Services, and implementation details.

A UI Component may be the root of a target's user interface or a child composed by another UI Component. A root component may be realized by an application shell, window, page, route, or other platform entry surface. A composed child remains independently meaningful and must retain an identifiable component boundary in applicable UI realizations.

A UI Component uses Domain Models and Services rather than duplicating their fields, invariants, or capabilities. It may describe how domain data is presented and how service outcomes affect its states, but it does not redefine the underlying domain or service semantics.

Native controls, layout containers, framework components, source files, and styling fragments are engineering artifacts. Do not create a UI Component Spark for one merely because it appears in a component tree. Create one when modularity is part of the intended design and the concept owns meaningful behavior, state, interaction, composition, constraints, or a reason to evolve independently.

---

## Body

The body describes the software concept itself.

Unlike the frontmatter, the body is intentionally flexible.

Its purpose is to communicate the software design clearly enough for both humans and AI to understand the concept.

A Spark body should describe whatever information is necessary to explain:

- the behavior of the concept;
- its responsibilities;
- its constraints;
- its boundaries;
- its interactions with other concepts;
- any other design information required to understand the concept.

The body should contain the minimum sufficient intent for correct review and realization. Include a decision when omitting it would require a reader or implementer to guess observable behavior, ownership, an invariant, a material constraint, or a relationship. Omit information that is already authoritative in another Spark, follows from the frontmatter or standardized kind representation, or belongs to ordinary engineering practice.

State each decision once in the Spark that owns it. Other Sparks should reference that owner through relationships instead of restating its behavior. Concision must not remove requested outcomes or material product decisions.

The body intentionally uses natural language rather than a rigid schema.

Different kinds of Sparks naturally require different kinds of descriptions.

---

# Spark Principles

Every Spark should follow the following principles.

---

## One Concept

Each Spark represents one meaningful software concept.

The represented concept should have a clear purpose and a well-defined boundary.

---

## Intent Before Implementation

A Spark describes software intent rather than implementation.

Implementation details belong to engineering artifacts unless they are essential to understanding the software concept itself.

---

## Implementation Independent

Whenever practical, a Spark should remain independent of implementation technologies, programming languages, frameworks, and platforms.

Implementation-specific concepts are valid exceptions.

---

## Human and AI Readable

A Spark should be understandable by both humans and AI.

Understanding a Spark should require significantly less effort than reconstructing software intent from engineering artifacts.

---

## Long-lived

Engineering artifacts evolve continuously.

A Spark evolves only when the software intent it represents changes.

Changes to engineering artifacts alone do not necessarily require changes to a Spark.

---

## Composable

A Spark may directly compose other Sparks that it conceptually owns.

Composition allows larger software concepts to be represented without sacrificing the independence of individual Sparks.

Shared or independently owned concepts are used rather than composed.

---

# Recommended Body Organization

Different kinds of Sparks naturally emphasize different aspects of software design.

This specification intentionally does not prescribe a universal template.

Instead, projects should organize Spark bodies in whatever way communicates the software concept most clearly.

Typical examples include:

| Spark Kind | Typical Topics |
|------------|----------------|
| UI Component | Behavior, States, Layout, Interaction, Boundaries |
| Service | Purpose, Capabilities, Inputs, Outputs, Rules, Failure Behavior |
| Domain Model | Domain Meaning, Data, Validation, Invariants, Lifecycle, Relationships |

These examples are recommendations rather than requirements.

---

# Requirements

Requirements express desired outcomes that software should accomplish.

Sparks represent the software concepts and detailed design intent responsible for realizing those outcomes.

Sparks are not summaries, subsets, or compressed copies of requirements. A Spark narrows the scope to one meaningful software concept, but that narrower scope must not imply reduced behavioral detail. Through design and clarification, a Spark may contain more precise behavior, states, responsibilities, constraints, boundaries, interactions, failure behavior, and invariants than any one originating requirement.

A requirement may be realized by multiple Sparks, and a Spark may contribute to realizing multiple requirements. The relationship between Requirements and Sparks is therefore many-to-many.

---

# Engineering Artifacts

Engineering artifacts are concrete realizations of Sparks.

Examples include:

- source code
- tests
- documentation
- diagrams
- API specifications
- platform-specific implementations

A Spark may be realized by multiple engineering artifacts.

Likewise, an engineering artifact may contribute to realizing multiple Sparks.

Engineering artifacts should remain consistent with the Sparks they realize.

---

# Relationships

Sparks may relate to:

- Requirements
- Other Sparks
- Engineering Artifacts

Core Spark-to-Spark relationships are represented by `composes` and `uses`.

Relationship collections contain no duplicate identifiers. Every relationship target must resolve to another Spark in the same Sparkwell project.

## Composition

`composes` represents direct conceptual ownership of constituent Sparks.

A Spark may have at most one direct composing parent. Composition must not contain self-references or cycles.

## Use

`uses` represents a dependency on or interaction with an independently owned Spark.

Use relationships may be many-to-many and cyclic, but they must not contain self-references.

Projects may introduce additional relationship types when appropriate.

---

# Evolution

SparkWell is an experimental project.

This specification intentionally defines only the minimum concepts required to support experimentation.

Future versions may refine these concepts as implementation experience, experiments, and community feedback accumulate.