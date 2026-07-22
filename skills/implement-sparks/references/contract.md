# Contract Target Guidance

Use this reference when the effective target is `contract`. The root-level `contracts` configuration, project guidance, and established contract artifacts take precedence.

## Initial Scope

The bundled target generates OpenAPI 3.1 Service Contracts. Persistence and event contracts are out of scope.

Within SparkWell, only the Contract target creates or updates public contract files. Runtime targets may consume or implement them. The Contract target does not create runtime server, client, UI, storage, or test artifacts.

## Applicability

Classify candidate Sparks as follows:

- A `domain-model` Spark with a present, non-empty `service-exposure.standard-operations` list is applicable. Generate one model-derived Service Contract containing exactly those standard operations.
- A `domain-model` Spark without `service-exposure` is **Not applicable** and produces no default Service Contract.
- A `service` Spark is applicable whenever it is in candidate scope. Generate one Service Contract containing every capability in its `## Capabilities` table.
- Other Spark kinds are **Not applicable** as Contract-target artifacts. Inspect any that materially constrain an applicable contract as contextual Sparks.

An explicit Service Spark always owns its own Service Contract. Its presence does not suppress a separate model-derived contract enabled by Domain Model `service-exposure`.

Treat Domain Models referenced by an applicable Service Spark as contextual inputs. Inspect their fields, invariants, relationships, and public-boundary restrictions. Include them in the contract artifact's realization provenance when their semantics materially define request or response schemas.

## Configuration and Layout

Use `contracts.root` from `.sparkwell/config.yaml` as the contract artifact root. For OpenAPI 3.1, use these defaults unless an established project convention overrides them:

```text
<contracts-root>/
└── service/
    ├── <domain-model-spark-id>.openapi.yaml
    └── <service-spark-id>.openapi.yaml
```

Do not configure per-Spark output paths.

Require `contracts.root` to be project-relative and `contracts.service-format` to be `openapi-3.1`; otherwise mark the task **Blocked**.

## Model-Derived Service Contracts

For each listed standard operation, derive the public API behavior from the Domain Model field table, invariants, mutability, relationships, and lifecycle intent.

Use these operation meanings:

- `create`: create one model instance from client-settable fields while respecting generated values, defaults, required fields, and invariants.
- `get`: retrieve one instance by stable identity.
- `list`: retrieve a collection of instances without inventing filtering, sorting, or pagination requirements.
- `update`: change mutable fields while preserving identity and immutable fields.
- `delete`: remove one instance by stable identity without inventing soft-delete, retention, or cascade semantics.

If an operation requires unresolved product behavior, mark that contract **Blocked** and return to Spark design. Examples include an unspecified identity strategy needed by `get`, ambiguous delete semantics, or relationships whose update behavior is unclear.

Use the standard operation name as its stable OpenAPI `operationId`: `create`, `get`, `list`, `update`, or `delete`. The contract filename scopes these generic names to one model service.

Derive request and response schemas as boundary projections rather than copying the complete model mechanically:

- Public output includes fields intended at the service boundary.
- Create input excludes generated fields and applies required values, defaults, and validation.
- Update input includes only mutable fields.
- Identity parameters use the model's stable identity field.

Do not expose a field that the Spark prohibits from crossing a public boundary.

## Explicit Service Contracts

Generate one OpenAPI operation for each row in the Service Spark's `## Capabilities` table.

- Convert the kebab-case capability ID to lower camel case for `operationId`, for example `complete-all` becomes `completeAll`.
- Resolve concept-level inputs and outputs through the Service Spark's `uses` relationships and the referenced Sparks.
- Preserve the capability's observable failure behavior in contract responses without inventing transport-specific product semantics.
- Apply service-wide permissions, ordering, idempotency, concurrency, and transactional rules when the Spark defines them.

The Service Spark does not define routes or HTTP verbs. Follow established project conventions. For a new project, choose a stable REST-shaped route and verb consistent with the capability semantics, report the choice, and do not encode behavior absent from the reviewed Sparks.

## Contract Content

Each OpenAPI file contains:

- `openapi: 3.1.0`;
- stable `info.title` and `info.version` values consistent with project conventions;
- paths and operations;
- unique `operationId` values;
- parameters and request bodies required by its operations;
- success and failure responses;
- embedded component schemas required by those operations.

Do not add SparkWell-specific OpenAPI extensions in the initial version. Realization state owns Spark-to-contract-file provenance. Standard OpenAPI `$ref` links connect operations to request and response schemas.

## State

Record every generated or materially updated contract file in `.sparkwell/state/realizations/contract.yaml`.

- A model-derived contract is `derived-from` its Domain Model Spark.
- An explicit-service contract is `derived-from` its Service Spark and every materially represented Domain Model Spark.
- Do not create mappings for **Not applicable** Sparks.
- Do not map individual OpenAPI operations or schema symbols.

## Validation

- Parse and validate every generated OpenAPI document with an established project tool when available.
- Verify OpenAPI version, unique operation IDs, resolvable `$ref` values, referenced request and response schemas, and realization-state paths.
- Compare an updated contract with the existing file and report additive, compatible, and potentially breaking interface changes.
- If no OpenAPI validator is available, perform the strongest available structural check and report the remaining validation gap.
