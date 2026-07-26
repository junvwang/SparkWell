# Sparkwell Project Conventions

This document defines how this project stores and maintains Spark Documents. It complements `.sparkwell/specification.md`, which remains the authority for Spark concepts, semantics, and document structure.

---

# Storage and Naming

Store every Spark in its own directory beneath a kind category in the repository's `sparks/` directory.

Use this path:

```text
sparks/<kind>/<id>/<id>.spark.md
```

Apply these rules:

- Every directory immediately beneath `sparks/` is a kind category named with the exact serialized `kind` value.
- Every directory immediately beneath a kind category represents exactly one Spark and is named with that Spark's `id`.
- A Spark Document is stored directly in its Spark directory and is named `<id>.spark.md`.
- Do not nest one Spark directory inside another Spark directory.
- `composes` and `uses` relationships do not affect directory placement.
- Changing composition or usage relationships does not move a Spark Document.
- Changing a Spark's kind moves its complete directory to the matching kind category but does not by itself change its identifier.

---

# Document Representation

A Spark Document is Markdown with YAML frontmatter delimited by `---` lines at the beginning of the file, followed by its natural-language body.

Serialize the core fields defined by the Spark Specification in this order:

1. `id`
2. `name`
3. `kind`
4. `summary`
5. `composes`
6. `uses`

Serialize `id`, `name`, `kind`, and `summary` as YAML strings. Serialize `composes` and `uses` as YAML lists of Spark IDs, using `[]` when a collection is empty.

For a Domain Model Spark, serialize the optional `service-exposure` field after `uses`.

Do not add approval status or review metadata. Introduce other frontmatter fields only when project conventions explicitly define them.

---

# Identifiers

Use lowercase kebab-case identifiers matching this pattern:

```text
^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$
```

The Spark directory and filename must remain aligned with the stable identifier required by the Spark Specification.

Consider these suffixes when they improve readability:

| Kind | Suggested suffix | Example ID |
|---|---|---|
| `domain-model` | `-model` | `todo-item-model` |
| `service` | `-service` | `todo-management-service` |
| `ui-component` | `-ui` | `todo-entry-ui` |

Suffixes can make relationship lists and realization provenance readable without opening each referenced Spark. They are optional naming hints and do not replace the authoritative `kind` field. Do not infer kind, validity, applicability, or behavior from a suffix.

Keep the human-readable `name` natural and omit suffix wording unless it is part of the concept's ordinary name. Project-defined kinds may suggest their own suffixes.

---

# Supported Kinds

Serialize kind names in lowercase kebab-case.

Bundled SparkWell workflows support exactly these kinds:

- `domain-model`
- `service`
- `ui-component`

A project may use another kind only when it defines that kind's concept semantics, document rules, design rules, and target applicability. Without all four, treat the kind as unsupported and stop for clarification instead of inferring behavior from its name.

---

# Shared Sparks

Do not create a `shared` storage category solely because multiple Sparks use a concept.

Sharedness is derived from relationships rather than encoded in a path. Store a shared Spark under its actual `kind`, and let each consumer reference its stable ID through `uses`.

A Spark does not change kind merely because it has multiple consumers. Reuse is represented by relationships and the concept's own intent.

---

# Body

Begin the body with a level-one heading matching the Spark's `name`.

Write the remaining body according to the Spark Specification using the minimum sufficient intent for correct review and realization.

- State each decision once in the Spark that owns it.
- Reference composed or used Sparks instead of summarizing their behavior.
- Do not repeat the frontmatter summary as a Purpose section unless additional purpose or scope must be clarified.
- Include boundaries only when they resolve plausible ownership or scope ambiguity; do not enumerate every unsupported behavior.
- Omit generic quality expectations, implementation-freedom disclaimers, empty sections, and other boilerplate already established by the specification or project guidance.
- Preserve every requested outcome and material product decision despite the concise form.

---

# Domain Model Documents

Use `kind: domain-model` only for a domain concept that satisfies the Domain Model semantics in the Spark Specification. Do not use it for a DTO, API payload, ORM entity, database row, or target-language type whose boundary exists only in implementation.

Every Domain Model Spark body contains a `## Data` table with these columns in this order:

```markdown
| Field | Meaning | Type | Required | Default | Constraints | Mutability |
|---|---|---|---|---|---|---|
```

Apply these rules:

- `Field` is a unique, stable, lowercase kebab-case logical identifier within the model.
- `Meaning` explains the field's domain meaning rather than repeating its name.
- `Type` uses a technology-independent domain type.
- `Required` is `Yes` or `No` and describes whether the model permits the value to be absent.
- `Default` is a domain default, a generation rule such as `Generated`, or `None`.
- `Constraints` describes applicable ranges, lengths, formats, uniqueness, and other field rules, or uses `None`.
- `Mutability` is `Immutable` or `Mutable` after creation.

Use these common domain types when they fit:

- `string`
- `boolean`
- `integer`
- `decimal`
- `identifier`
- `date`
- `datetime`
- `enum(value-one, value-two)`
- `reference(<spark-id>)`
- `list(<domain-type>)`

Projects may introduce another technology-independent domain type when necessary and explain it during human review. Do not use language, transport, ORM, or storage types such as `System.Guid`, `DateTimeOffset`, TypeScript interfaces, SQL column types, or framework annotations.

A `reference(<spark-id>)` type must resolve to an existing Spark that the Domain Model either composes or uses. Describe cardinality, ownership, lifecycle, and propagation rules in a `## Relationships` section when the relationship requires more detail than the data row communicates.

Describe model-wide validation and cross-field invariants outside the table. Include lifecycle, state transitions, concurrency, and persistence behavior only where they are part of the model's software intent.

## Service Exposure Frontmatter

Use the optional `service-exposure` frontmatter field only when a Domain Model explicitly enables automatic standard service operations.

Allow all standard operations explicitly:

```yaml
service-exposure:
  standard-operations:
    - create
    - get
    - list
    - update
    - delete
```

Allow only read operations:

```yaml
service-exposure:
  standard-operations:
    - get
    - list
```

Apply these rules:

- Omit `service-exposure` when no model-derived public service should be generated.
- When `service-exposure` is present, `standard-operations` is required.
- `standard-operations` is a non-empty, duplicate-free list containing only `create`, `get`, `list`, `update`, and `delete`, serialized in that order when present.
- The list is the exact standard operation set for a model-derived Service Contract. An implementation profile must not add or remove operations.
- This field does not prohibit an explicit Service Spark from using the model.
- To prohibit every public service representation, state in `## Boundaries` that the model must not cross any public service boundary, including through explicit services.
- When a consumer requests a prohibited standard operation, return to Spark design rather than generating that operation.

Example:

```markdown
---
id: todo-item-model
name: Todo Item
kind: domain-model
summary: Represents one piece of work a person wants to track.
composes: []
uses: []
service-exposure:
  standard-operations:
    - create
    - get
    - list
    - update
    - delete
---

# Todo Item

## Data

| Field | Meaning | Type | Required | Default | Constraints | Mutability |
|---|---|---|---|---|---|---|
| `id` | Stable identity of the Todo Item | identifier | Yes | Generated | Unique and non-empty | Immutable |
| `title` | Work the person wants to remember | string | Yes | None | Trimmed; 1-200 characters | Mutable |
| `completed` | Whether the work is complete | boolean | Yes | `false` | None | Mutable |

## Invariants

- The title remains non-empty after trimming.
- Changing completion does not change identity.
```

An existing `data-model` Spark may move to `domain-model` only when it represents the same domain concept and is updated to satisfy these semantics and conventions. Preserve its stable Spark ID while moving its directory to `sparks/domain-model/<id>/`.

---

# Service Documents

Use `kind: service` only for a concept that satisfies the Service semantics in the Spark Specification. Do not use it merely for an API endpoint, controller, framework service, client class, or automatic CRUD surface.

Every Service Spark body contains a `## Capabilities` table with these columns in this order:

```markdown
| Capability | Purpose | Inputs | Output | Failure Behavior |
|---|---|---|---|---|
```

Apply these rules:

- `Capability` is a unique, stable, lowercase kebab-case logical identifier within the service.
- `Purpose` describes the outcome owned by the service capability.
- `Inputs` names concept-level inputs and references related Sparks by stable ID when applicable, or uses `None`.
- `Output` describes the concept-level result and references related Sparks by stable ID when applicable, or uses `None`.
- `Failure Behavior` describes observable failure and partial-completion semantics, or uses `None` when no service-specific failure behavior exists.
- Every independently owned Spark referenced by a capability must appear in the Service Spark's `uses`.

Describe permissions, ordering, idempotency, concurrency, transactional behavior, and cross-capability rules in separate sections only when they are part of the service's software intent.

Do not put HTTP routes, verbs, status codes, DTO names, framework types, controller names, or generated client method names in the capabilities table unless they are enduring compatibility requirements of the software concept.

Do not create a Service Spark solely to repeat standard operations already represented by a Domain Model's service exposure.

Example:

```markdown
---
id: todo-management-service
name: Todo Management
kind: service
summary: Provides operations that coordinate changes across Todo Items.
composes: []
uses:
  - todo-item-model
---

# Todo Management

## Capabilities

| Capability | Purpose | Inputs | Output | Failure Behavior |
|---|---|---|---|---|
| `complete-all` | Mark every active Todo Item complete | None | Number of `todo-item-model` models changed | Fails without partial completion if the operation cannot complete |

## Rules

- Already completed Todo Items remain unchanged.
- The result counts only Todo Items changed by this operation.
```

---

# UI Component Documents

Use `kind: ui-component` only for a modular user-interface concept that satisfies the UI Component semantics in the Spark Specification. Do not use it merely for a native control, framework component, source file, style fragment, or incidental node in a rendered tree.

Describe enough applicable intent to understand and implement the component's user-facing purpose, owned behavior and state, interactions, composition responsibilities, constraints, accessibility requirements, and boundaries. Organize the body with whatever prose, lists, tables, or sections communicate that intent most clearly. Omit topics that do not apply.

When `composes` is non-empty, explain any parent-child responsibilities that are not already clear from the child Sparks, such as supplied information, reported user intent, state ownership, cross-child coordination, ordering, or conditional presence. Do not repeat the complete child definitions in the parent.

Keep Domain Model invariants in Domain Model Sparks and Service capabilities in Service Sparks. Reference independently owned concepts through `uses` rather than duplicating their semantics.

Keep framework properties, callbacks, events, commands, bindings, files, classes, controls, styling mechanics, and layout implementation in engineering artifacts.

---

# Example

This UI Component composition:

```text
todo-app-ui
├── todo-entry-ui
└── todo-list-ui
```

is stored as:

```text
sparks/
└── ui-component/
    ├── todo-app-ui/
    │   └── todo-app-ui.spark.md
    ├── todo-entry-ui/
    │   └── todo-entry-ui.spark.md
    └── todo-list-ui/
      └── todo-list-ui.spark.md
```

The `sparks/ui-component/todo-app-ui/todo-app-ui.spark.md` document begins:

```markdown
---
id: todo-app-ui
name: Todo App UI
kind: ui-component
summary: Coordinates entry and list components for a Todo application.
composes:
  - todo-entry-ui
  - todo-list-ui
uses:
  - todo-item-model
---

# Todo App UI

The Todo App UI provides the root user interface and owns the ordered Todo Item collection. It coordinates collection changes reported by its child components.

It composes:

- `todo-entry-ui`, which collects a new Todo Item title and reports add intent;
- `todo-list-ui`, which receives the ordered collection and reports completion intent.

When the collection is empty, the list presents its empty state. Otherwise, it presents items in their established order. Focus moves logically between entry and list content, and collection changes are communicated without relying on color alone.

The children own their internal presentation and interactions. `todo-item-model` owns Todo Item data and invariants.
```

---

# Proposal, Creation, and Review

Before modifying Spark Documents, present a concise Spark Proposal in chat and wait for explicit finalization. The proposal lists new Spark IDs, kinds, and summaries; existing Sparks to evolve and why; and any identity or destructive changes. Do not persist the proposal or approval state.

After finalization, revalidate the affected Sparks and proposed paths, then create or update Spark Documents as normal working-tree changes. If relevant project state changed, revise the proposal and obtain confirmation again before writing.

Before presenting them for review, verify that:

- every Spark is stored at `sparks/<kind>/<id>/<id>.spark.md`;
- each kind category matches the Spark's serialized `kind`;
- each Spark directory and filename match its ID;
- no Spark directory is nested inside another Spark directory;
- core fields are present and correctly serialized;
- IDs and relationships satisfy the Spark Specification;
- bodies satisfy the Spark Specification and begin with the expected heading.

Present the generated Spark Documents and their requirement mapping for human review, then stop before generating or modifying engineering artifacts. Proposal review and generated-document review are separate checkpoints; neither requires approval status, review files, or other workflow metadata.

Review must evaluate substance, not document length or structure. Verify that relevant requested outcomes and constraints were preserved; material behavior, failure, state, validation, lifecycle, persistence, interaction, and platform intent is clear; ownership and boundaries are coherent; each decision has one authoritative owner; and implementation can proceed without inventing product decisions. Remove repetition and boilerplate before review while retaining every implementation-critical clarification.