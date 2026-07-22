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
- Changing a Spark's kind moves its complete directory to the matching kind category but does not change its identifier.

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

---

# Kind Names

Serialize kind names in lowercase kebab-case. Prefer an existing project kind when it accurately describes the concept.

Common kinds include:

- `application`
- `feature`
- `workflow`
- `service`
- `domain-model`
- `screen`
- `ui-component`
- `function`
- `reusable-element`

Use lowercase kebab-case for additional kinds and explain a new kind during human review.

---

# Shared Sparks

Do not create a `shared` storage category solely because multiple Sparks use a concept.

Sharedness is derived from relationships rather than encoded in a path. Store a shared Spark under its actual `kind`, and let each consumer reference its stable ID through `uses`.

A Spark does not become a `reusable-element` merely because it has multiple consumers. Use that kind only when reuse is part of the concept's purpose.

---

# Body

Begin the body with a level-one heading matching the Spark's `name`.

Write the remaining body according to the Spark Specification. Omit sections that add no useful design information.

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
id: todo-item
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

## Purpose

Represent one piece of work from creation through completion.

## Data

| Field | Meaning | Type | Required | Default | Constraints | Mutability |
|---|---|---|---|---|---|---|
| `id` | Stable identity of the Todo Item | identifier | Yes | Generated | Unique and non-empty | Immutable |
| `title` | Work the person wants to remember | string | Yes | None | Trimmed; 1-200 characters | Mutable |
| `completed` | Whether the work is complete | boolean | Yes | `false` | None | Mutable |

## Invariants

- The title remains non-empty after trimming.
- Changing completion does not change identity.

## Boundaries

This Spark does not define transport schemas, persistence layout, or visual presentation.
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
id: todo-management
name: Todo Management
kind: service
summary: Provides operations that coordinate changes across Todo Items.
composes: []
uses:
  - todo-item
---

# Todo Management

## Purpose

Coordinate Todo Item operations that are broader than one model-level change.

## Capabilities

| Capability | Purpose | Inputs | Output | Failure Behavior |
|---|---|---|---|---|
| `complete-all` | Mark every active Todo Item complete | None | Number of `todo-item` models changed | Fails without partial completion if the operation cannot complete |

## Rules

- Already completed Todo Items remain unchanged.
- The result counts only Todo Items changed by this operation.

## Boundaries

This Spark does not define transport routes, persistence, or Todo Item fields and invariants.
```

---

# Example

This composition:

```text
checkout
├── order-review
└── payment
    └── fraud-screening
```

is stored as:

```text
sparks/
├── screen/
│   └── order-review/
│       └── order-review.spark.md
├── service/
│   ├── fraud-screening/
│   │   └── fraud-screening.spark.md
│   └── payment/
│       └── payment.spark.md
└── workflow/
    └── checkout/
        └── checkout.spark.md
```

The `sparks/workflow/checkout/checkout.spark.md` document begins:

```markdown
---
id: checkout
name: Checkout
kind: workflow
summary: Guides a customer from order review through payment and order placement.
composes:
  - order-review
  - payment
uses: []
---

# Checkout

## Purpose

Allow a customer to review and complete a purchase.

## Behavior

- Present the order for review before payment.
- Continue to payment after the customer confirms the order.
- Complete the workflow only after its required steps succeed.

## Boundaries

This Spark owns the checkout flow. Order review and payment behavior belong to their composed Sparks.
```

---

# Creation and Review

Create or update proposed Spark Documents as normal working-tree changes.

Before presenting them for review, verify that:

- every Spark is stored at `sparks/<kind>/<id>/<id>.spark.md`;
- each kind category matches the Spark's serialized `kind`;
- each Spark directory and filename match its ID;
- no Spark directory is nested inside another Spark directory;
- core fields are present and correctly serialized;
- IDs and relationships satisfy the Spark Specification;
- bodies satisfy the Spark Specification and begin with the expected heading.

Present the proposed Spark changes and their requirement mapping for offline human review, then stop before generating or modifying engineering artifacts. This checkpoint gives a human the opportunity to inspect or edit the documents; it does not require approval status, review files, or other workflow metadata.

Review must evaluate substance, not only document structure. Verify that relevant requested outcomes and constraints were preserved; applicable success, failure, state, validation, lifecycle, persistence, interaction, and platform behavior is clear; ownership and boundaries are coherent; and implementation can proceed without inventing product decisions. Capture every implementation-critical clarification in the reviewed Spark Documents rather than relying on conversation history.