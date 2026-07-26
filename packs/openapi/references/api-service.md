# OpenAPI API Service

Use this reference when the effective target is `api-service` and its profile activates the OpenAPI pack.

## Contract Resolution and Scope

Resolve `constraints.contract-profile`, then verify that profile exists, targets `openapi-contract`, activates `openapi`, and has a project-relative `source-root`. Locate contracts through that profile's realization state and source root. Mark missing or ambiguous Spark-to-contract correspondence **Blocked**.

- A `service` Spark with a matching contract is applicable.
- A Domain Model is contextual or an internal domain artifact when a selected operation uses it; it does not independently create a public endpoint.
- A `ui-component` Spark is **Not applicable** and is consumer context only.
- A project-defined kind follows project guidance; without it, mark the candidate **Blocked**.

Do not reconstruct a public interface from Sparks when its contract is absent.

## Contract Boundary

Treat reviewed Sparks as authoritative for domain and service behavior and OpenAPI as authoritative for paths, methods, parameters, request bodies, security requirements, responses, and boundary schemas.

- Implement every selected operation by `operationId` without adding or removing public operations.
- Mark incompatible duplicate path and HTTP method pairs **Blocked**.
- Mark contract/Spark conflicts **Blocked**; only the producer profile may repair the contract.
- Do not modify public contract files in an API Service task.

## Project and Architecture Integration

Inspect native manifests, framework configuration, route registration, dependency injection, serialization, authentication, persistence, migrations, and existing source before editing. Preserve established runtime and architecture conventions.

Prefer established OpenAPI server-generation tooling when compatible. Run the artifact-owning generator and do not hand-edit generated files. Otherwise implement the smallest compatible handlers and adapters.

Resolve module boundaries, domain/boundary mappings, persistence access, dependency injection, transactions, and dependencies from the selected profile, guidance, and established project. This pack does not choose an architecture, ORM, provider, synchronization strategy, or source layout. For a new implementation, unresolved consequential choices are **Blocked** and require `/spark-config`.

Keep connection details and secrets in native secure configuration. Map internal and persistence representations without exposing persistence shapes through the API. An independently managed persistence service requires its own explicit contract.

## Implement and Validate

- Bind all inputs exactly as the selected operation defines them.
- Enforce contract validation, content types, and security through established framework mechanisms.
- Map boundary schemas to internal domain representations; do not assume public, create, update, and persistence projections share one type.
- Implement reviewed invariants and Service behavior without changing the wire interface.
- Return declared success and failure responses with conformant status codes, headers, content types, and schemas.

Run the owning generator when applicable, then restore or install, compile, type-check, lint, and format through the native toolchain. Validate route and schema conformance and exercise the smallest safe material operation set when the environment permits it. Report unavailable tooling, dependencies, endpoints, credentials, and runtime checks precisely.

Do not create UI, client, deployment, or test artifacts, and do not add endpoints, fields, or response shapes absent from OpenAPI.