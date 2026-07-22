# Spark Granularity

Use this guide to choose a defensible, project-consistent Spark decomposition. Granularity is a design judgment, not a mechanical score.

## Primary Rule

Prefer the smallest cohesive set of Sparks
that best represents the software design.

Each Spark should be meaningful to understand, review, evolve, or reuse independently. Start from desired outcomes and enduring responsibilities, not anticipated source-code structure.

## Reuse Before Creation

Before proposing a new Spark, ask:

1. Does an existing Spark already own this purpose or responsibility?
2. Is the requested behavior a natural evolution of that concept?
3. Would a new Spark overlap with or fragment an existing boundary?

Evolve the existing Spark when it remains the clear conceptual owner. Create a new Spark only when the candidate has an independently meaningful boundary.

## Separate Concept Test

A candidate is usually strong enough to be a separate Spark when:

- it has a distinct purpose and coherent responsibility;
- its boundary and ownership can be stated clearly;
- it owns meaningful behavior, rules, or constraints;
- it can be understood and reviewed independently; and
- there is a credible reason for it to evolve, compose, or be reused independently.

These considerations support judgment rather than impose a numeric threshold. A distinct purpose and clear boundary are essential; the remaining evidence should make independence useful rather than merely possible.

## Keep Concepts Together When

- one candidate has no purpose apart from an enclosing concept;
- its behavior and constraints are inseparable from the enclosing concept;
- splitting would duplicate the same intent across documents;
- the boundary exists only because of a proposed implementation; or
- independent review or evolution would add ceremony without clarity.

## Split a Concept When

- it combines unrelated purposes or responsibilities;
- parts own independently meaningful behavior or constraints;
- different parts have stable conceptual boundaries and ownership;
- parts are expected to evolve or be reused independently; or
- the current Spark is too broad to understand or review without reconstructing several distinct concepts.

## Composition

A composing Spark must represent a meaningful larger concept, not merely serve as a folder or index.

Use `composes` for directly owned constituent concepts. Use `uses` for independently owned concepts that participate in or support the design. Keep relationships at the level necessary to explain software intent.

## Established Design Lenses

Spark design draws on established software-design principles. Use these as complementary lenses, not as mechanical rules or required methodologies.

### Responsibility-Driven Design

Ask what responsibility a concept owns, what information it needs, and which other concepts it collaborates with. A responsibility without a clear owner may reveal a missing Spark; substantially unrelated responsibilities may indicate that a candidate should be split.

### Domain-Driven Design

Use domain language, business capabilities, invariants, and bounded contexts to identify stable conceptual boundaries. Do not automatically translate every entity, aggregate, service, or bounded context into a Spark.

### Domain Model Concepts

A data-bearing candidate is a useful `domain-model` Spark when it represents an independently meaningful domain concept and owns material field semantics, invariants, relationships, lifecycle, or model-level behavior. Independent reuse or evolution strengthens the case but does not replace a clear domain purpose.

Keep data within another Spark when it has no independent domain meaning, rules, or review value. Do not create Domain Model Sparks by mining nouns, database tables, API schemas, request or response DTOs, ORM entities, or target-language classes. Those shapes may realize a Domain Model without defining its conceptual boundary.

A broader domain, aggregate, or application Spark should compose Domain Models only when the parent owns real purpose, boundaries, or cross-model rules. Do not create an otherwise empty parent solely to group models or draw a relationship diagram.

### Service Concepts

A candidate is a useful `service` Spark when it owns an independently meaningful set of capabilities across a conceptual boundary. Strong signals include cross-model coordination, specialized queries, authorization, batching, orchestration, idempotency, concurrency, or distinctive failure behavior.

Do not create a Service Spark solely because an implementation has a service class, controller, endpoint group, repository, or generated client. Do not create one merely to repeat standard CRUD already derived from Domain Model service exposure. Keep a capability in another Spark when it has no independent service purpose or review value.

Service boundaries should follow owned behavior, not deployment or framework layers. One Service Spark may have several engineering artifacts, while one service application may realize several Service Sparks.

### Cohesion and Coupling

Keep behavior, rules, and constraints together when they serve one purpose. Consider separate Sparks when concepts have distinct purposes and can evolve with limited impact on each other.

### Information Hiding

A concept may deserve its own boundary when it owns meaningful rules, constraints, or decisions that other concepts should depend on through observable behavior rather than internal details. Implementation choices alone do not justify a Spark.

### Use Cases and Workflows

Actors, outcomes, states, transitions, and failure behavior can reveal meaningful workflow concepts. Steps that have no independent responsibility should usually remain part of the enclosing workflow.

### Abstraction Levels

Compare candidate Sparks at similar levels of abstraction. A larger Spark may compose smaller Sparks, but do not treat an application, feature, UI control, and helper function as peers merely because each can technically be described as a concept.

Artifacts from these methods are evidence, not automatic Spark boundaries. Not every domain entity, aggregate, use case, service, architecture component, or workflow step deserves a Spark.

## Project Calibration

Compare candidates with existing Sparks of similar kinds:

- use established domain vocabulary;
- preserve comparable levels of abstraction where they remain useful;
- treat existing granularity as evidence, not unquestionable precedent;
- surface inconsistent or overlapping existing boundaries instead of copying them.

When no precedent exists, begin with a cohesive concept and split only when independent purpose, ownership, and evolution are clear.

## Common Failure Modes

### One Requirement, One Spark

Requirements describe outcomes; Sparks represent responsible concepts. Their relationship is many-to-many.

### Implementation-Shaped Sparks

Do not create Sparks merely for controllers, hooks, DTOs, database tables, API endpoints, source files, or packages.

### Data-Structure Mining

Do not create one Domain Model Spark per payload, table, entity class, or field group. Start from domain meaning and owned rules. Multiple implementation shapes may realize one Domain Model, while an incidental data structure may realize no independent Spark at all.

### Service-Layer Mining

Do not create one Service Spark per controller, endpoint, service class, repository, or transport group. Start from independently meaningful capabilities and boundary rules. A default CRUD surface does not justify a Service Spark by itself.

### Noun Mining

Not every noun in a requirement is an independently meaningful software concept. Look for owned responsibility and behavior.

### Premature Decomposition

Do not split hypothetical future variation into separate Sparks without current software intent supporting those boundaries.

### Overloaded Spark

Do not place unrelated capabilities into a single application or feature Spark merely because they ship together.

### Relationship-Only Spark

Do not create an otherwise empty Spark solely to connect other Sparks. A composing concept needs its own purpose and intent.

## Candidate Decision Notes

For each candidate concept, record during analysis:

- requested outcomes it helps realize;
- existing Spark match, if any;
- proposed action: none, evolve, create, or clarify;
- purpose and owned responsibility;
- boundary and key relationships;
- rationale for keeping it together or separating it.

These notes support the human review summary and do not need to become project files.