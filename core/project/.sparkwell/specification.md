# Sparkwell Specification

> Status: Draft

This normative specification defines what a **Spark** is, including its concepts, semantics, and document structure. Workflows and project conventions define how Sparks are created, reviewed, stored, and transformed into engineering artifacts.

# Spark

A **Spark** is the persistent representation of a meaningful software concept and its software intent, independent of any particular engineering artifact. Engineering artifacts realize Sparks rather than define the primary software design.

A Spark may represent software concepts at different levels of abstraction. Bundled SparkWell workflows currently support:

- a domain model
- a service
- a modular UI component

Spark does not prescribe fixed granularity. Each Spark should remain meaningful to understand, review, evolve, and reuse.

# Spark Document

A **Spark Document** is the canonical representation of a Spark within a Sparkwell project. It consists of structured frontmatter and a natural-language body.

## Frontmatter

Frontmatter contains concise, relatively stable metadata for identity, relationships, navigation, indexing, dependency analysis, and tooling.

Every Spark Document defines the following core fields:

| Field | Purpose |
|--------|---------|
| `id` | Stable identifier of the Spark |
| `name` | Human-readable name |
| `kind` | Kind of software concept represented |
| `summary` | Brief description of the Spark |
| `composes` | Collection of Sparks directly composed by this Spark |
| `uses` | Collection of other Sparks referenced but not owned |

`composes` and `uses` remain present when empty; project conventions define serialization. Projects may add metadata, and established kinds may define standardized kind-specific fields. Such fields represent software intent and follow their kind's semantics.

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

Standardized kinds add concept semantics without imposing a universal body template. Project conventions define how kind-specific information is serialized.

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
- public-boundary restrictions when the model must not cross a Service boundary.

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

Create a Service Spark when capabilities are intentionally offered across an independently meaningful conceptual boundary. Even familiar create, retrieve, update, or delete capabilities are explicit Service intent rather than behavior inferred automatically from a Domain Model.

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

The flexible, natural-language body describes the concept's behavior, responsibilities, constraints, boundaries, interactions, and other design information needed by humans and AI.

The body should contain the minimum sufficient intent for correct review and realization. Include a decision when omitting it would require a reader or implementer to guess observable behavior, ownership, an invariant, a material constraint, or a relationship. Omit information that is already authoritative in another Spark, follows from the frontmatter or standardized kind representation, or belongs to ordinary engineering practice.

State each decision once in the Spark that owns it. Other Sparks should reference that owner through relationships instead of restating its behavior. Concision must not remove requested outcomes or material product decisions. Different kinds naturally require different descriptions; no rigid body schema applies.

# Spark Principles

| Principle | Rule |
|---|---|
| One concept | Represent one meaningful concept with a clear purpose and boundary. |
| Intent before implementation | Describe software intent. Keep implementation details in engineering artifacts unless they are essential to the concept. |
| Implementation independent | Remain independent of technologies, languages, frameworks, and platforms whenever practical; implementation-specific concepts are valid exceptions. |
| Human and AI readable | Be understandable with significantly less effort than reconstructing intent from engineering artifacts. |
| Long-lived | Evolve when represented software intent changes; engineering-artifact changes alone do not necessarily require Spark changes. |
| Composable | Directly compose conceptually owned Sparks; use shared or independently owned Sparks. |

# Recommended Body Organization

Projects should organize each body in the clearest way for its concept rather than follow a universal template. Typical topics include:

Typical examples include:

| Spark Kind | Typical Topics |
|------------|----------------|
| UI Component | Behavior, States, Layout, Interaction, Boundaries |
| Service | Purpose, Capabilities, Inputs, Outputs, Rules, Failure Behavior |
| Domain Model | Domain Meaning, Data, Validation, Invariants, Lifecycle, Relationships |

These topics are recommendations, not requirements.

# Requirements

Requirements express desired outcomes that software should accomplish.

Sparks represent the software concepts and detailed design intent responsible for realizing those outcomes.

Sparks are not summaries, subsets, or compressed copies of requirements. A Spark narrows the scope to one meaningful software concept, but that narrower scope must not imply reduced behavioral detail. Through design and clarification, a Spark may contain more precise behavior, states, responsibilities, constraints, boundaries, interactions, failure behavior, and invariants than any one originating requirement.

A requirement may be realized by multiple Sparks, and a Spark may contribute to multiple requirements; the relationship is many-to-many.

# Engineering Artifacts

Engineering artifacts are concrete realizations of Sparks, including source code, tests, documentation, diagrams, API specifications, and platform-specific implementations. A Spark may have multiple artifacts, and an artifact may realize multiple Sparks. Artifacts should remain consistent with the Sparks they realize.

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

SparkWell is experimental. This specification defines the minimum concepts needed for experimentation and may evolve with implementation experience and feedback.