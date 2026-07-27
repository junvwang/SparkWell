# Spark Document Conventions

This project-owned document defines Spark Document storage, naming, serialization, and kind-specific format. `.sparkwell/specification.md` remains authoritative for Spark concepts, semantics, identities, kinds, and relationships. The `/spark-design` Skill owns proposal, finalization, and review workflow.

Projects may extend these conventions without redefining Spark semantics.

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

Serialize every standardized `domain-model` body with a `## Data` table containing these columns in this order:

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

---

# Service Documents

Serialize every standardized `service` body with a `## Capabilities` table containing these columns in this order:

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

List every Service capability explicitly. Never infer capability rows from a Domain Model.

---

# UI Component Documents

Standardized `ui-component` bodies have no fixed section template. Use whatever prose, lists, tables, or sections communicate the applicable intent from the Spark Specification most clearly. Omit topics that do not apply.

When `composes` is non-empty, explain any parent-child responsibilities that are not already clear from the child Sparks, such as supplied information, reported user intent, state ownership, cross-child coordination, ordering, or conditional presence. Do not repeat the complete child definitions in the parent.

Keep framework properties, callbacks, events, commands, bindings, files, classes, controls, styling mechanics, and layout implementation in engineering artifacts.

---

# Validation

Validate every Spark Document against these project conventions:

- every Spark is stored at `sparks/<kind>/<id>/<id>.spark.md`;
- each kind category matches the Spark's serialized `kind`;
- each Spark directory and filename match its ID;
- no Spark directory is nested inside another Spark directory;
- core fields are present and correctly serialized;
- IDs and relationships satisfy the Spark Specification;
- the body begins with the expected heading;
- each standardized Domain Model has the required `## Data` table;
- each standardized Service has the required `## Capabilities` table.