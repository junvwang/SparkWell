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
- `data-model`
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