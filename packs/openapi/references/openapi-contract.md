# OpenAPI Contract Production

Use this reference when the effective target is `openapi-contract`.

## Scope and Ownership

This target generates OpenAPI 3.1 service contracts only. It does not create runtime server, client, UI, persistence, deployment, or test artifacts.

Classify candidate Sparks as follows:

- A `service` Spark is applicable and produces one contract containing every capability in its `## Capabilities` table.
- A `domain-model` Spark is **Not applicable** as a standalone contract. Treat models used by an applicable Service as contextual schema inputs.
- A `ui-component` Spark is **Not applicable**. Inspect it only when its service interactions constrain an applicable Service contract.
- A project-defined kind follows project guidance; without explicit applicability, mark it **Blocked**.

Only this producer profile creates or updates contracts under its `source-root`. Consumers and implementers must not modify them.

## Effective Service Definition

Before writing each contract, construct a transient Effective Service Definition from the Service Spark and Domain Models that define its boundary schemas. Resolve every capability, concept-level input and output, validation rule, failure, permission, concurrency rule, and other declared boundary behavior. Mark missing or conflicting intent **Blocked**.

Summarize this definition in the implementation plan. Do not persist it or add it to realization state.

## Layout

Use the selected producer profile's `source-root` as the contract root. Unless project guidance or established artifacts define another layout, write:

```text
<source-root>/
└── service/
    └── <service-spark-id>.openapi.yaml
```

Do not configure per-Spark output paths. Require `packs.openapi.version: '3.1'` and a project-relative source root.

## Operations and Schemas

Generate one OpenAPI operation for each row in the Service Spark's `## Capabilities` table.

- Convert a kebab-case capability ID to lower camel case for `operationId`; for example, `complete-all` becomes `completeAll`.
- Resolve inputs and outputs through the Service Spark's `uses` relationships and referenced Sparks.
- Preserve observable failure behavior without inventing transport-specific product semantics.
- Apply declared permissions, ordering, idempotency, concurrency, and transactional rules.

Service Sparks do not define routes or HTTP verbs. Follow established project conventions. For a new contract set, choose stable REST-shaped routes and verbs consistent with capability semantics and report those engineering choices.

Boundary schemas are projections, not mechanical copies of complete Domain Models. Preserve required values, defaults, validation, invariants, mutability, identity, and public-boundary restrictions only where relevant to the operation.

Each file contains `openapi: 3.1.0`, stable project-consistent `info`, paths, unique `operationId` values, required parameters and request bodies, success and failure responses, and referenced component schemas. Do not add SparkWell-specific OpenAPI extensions.

## State and Validation

Record every generated or materially updated file in `.sparkwell/state/realizations/<implementation-id>.yaml`, derived from its Service Spark and every materially represented Domain Model Spark. Do not map individual operations or schema symbols.

- Parse and validate every document with established project tooling when available.
- Verify the OpenAPI version, unique operation IDs, resolvable `$ref` values, required schemas, and realization-state paths.
- Verify that operations cover every Service capability exactly once.
- Compare updates with the existing interface and report additive, compatible, and potentially breaking changes.
- When no validator is available, perform the strongest structural check possible and report the remaining gap.