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

A Spark may represent software concepts at different levels of abstraction, including (but not limited to):

- an application
- a feature
- a workflow
- a service
- a data model
- a UI component
- a reusable software element

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

The frontmatter should remain concise and relatively stable.

---

## Identity

Every Spark has an `id` that is unique within its Sparkwell project.

The identifier remains stable for the lifetime of the represented concept. Changing a Spark's human-readable name does not change its identity.

Relationships reference Sparks by their stable identifiers.

---

## Kinds

The `kind` identifies the category of software concept represented by a Spark.

Kinds are extensible. Projects should reuse established kinds when they accurately describe a concept and may introduce additional kinds when needed.

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
| Screen | User Flow, Layout, Navigation |
| Service | Capabilities, Inputs, Outputs, Failure Behavior |
| Data Model | Data, Validation, Invariants |
| Workflow | Participants, Steps, Transitions |
| Function | Purpose, Inputs, Outputs, Rules |

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