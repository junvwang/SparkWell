# API Service Target Guidance

Use this reference when the effective target is `api-service`. The selected profile, project guidance, OpenAPI contracts, and established native project take precedence.

## Applicability

- A `domain-model` Spark with a matching model-derived Service Contract is applicable.
- A `service` Spark with a matching explicit Service Contract is applicable.
- A Domain Model without its own model-derived contract is **Not applicable** unless an applicable Service operation requires it as context or as an internal domain artifact.
- A `ui-component` Spark is **Not applicable** as an API Service artifact. Inspect it only as context when its interactions consume an applicable contract.
- A project-defined kind follows the target applicability defined by its project guidance; without that guidance, mark it **Blocked** rather than inferring an API Service projection.
- Mark the task **Blocked** when an applicable Spark has no unambiguous matching contract. Do not reconstruct the public interface from Sparks.

## Contract Boundary

- Require `contracts.service-format: openapi-3.1` and resolve contract files through the shared discovery workflow.
- Treat reviewed Sparks as authoritative for domain and service behavior and OpenAPI as authoritative for paths, methods, parameters, request bodies, security requirements, responses, and boundary schemas.
- Implement every selected contract operation by its `operationId` without adding or removing public operations.
- Mark incompatible duplicate path and HTTP method pairs across selected contracts **Blocked**.
- Mark conflicts between the contract and reviewed Spark intent **Blocked**; only the Contract target may repair the public contract.
- Do not modify public contract files from an API Service task.

## Project Integration

- Inspect native manifests, framework configuration, route registration, dependency injection, serialization, authentication, persistence, migrations, and existing source before editing.
- Preserve the established runtime, framework, architecture, dependency management, and error-handling conventions unless the profile or request changes them.
- Prefer established OpenAPI server-generation tooling when its output fits the project. Run the artifact-owning generator and do not hand-edit generated files.
- Otherwise implement the smallest compatible handlers and adapters with the established framework.

## Persistence

- Resolve persistence choices from the selected API Service profile and established native project.
- The API Service owns the data-access code and provider-specific artifacts it needs, including serialization, repositories or adapters, mappings, schemas, and migrations where applicable.
- Support the configured approach, whether no persistence, a local file, an embedded database such as SQLite, or a directly accessed database service.
- Keep connection details and secrets in the native secure configuration. A profile may constrain the provider or access strategy but must not contain credentials.
- Map internal domain representations to persistence representations without exposing persistence shapes through the public API.
- Mark an independently managed persistence boundary **Blocked** unless an explicit established contract defines it. A network-accessed persistence service uses a Service Contract.

## Implement Operations

- Bind path, query, header, cookie, and body inputs exactly as the selected operation defines them.
- Enforce contract-required validation, content types, and security through established framework mechanisms.
- Map boundary schemas to internal domain representations. Do not assume public, create, update, and persistence projections share one type.
- Implement Domain Model invariants and Service capabilities from the reviewed Sparks without changing the wire interface.
- Return declared success and failure responses with contract-conformant status codes, headers, content types, and schemas.
- Handle undocumented failures through established server behavior without exposing secrets or inventing contract semantics.

## Validation

- Run the owning generator when applicable, then restore or install, compile, type-check, lint, and format through the native toolchain.
- Validate the OpenAPI document and verify route, input, security, response, and schema conformance with established project tooling when available.
- Launch the service and exercise the smallest safe material operation set when the environment permits it. Do not invoke destructive operations without controlled data and explicit justification.
- Run relevant existing tests as regression evidence, but leave new or changed test artifacts to `test-sparks`.
- Report unavailable validators, dependencies, endpoints, credentials, and runtime checks precisely.

## Boundaries

- Do not create UI, client, deployment, or test artifacts in this target.
- Do not add public endpoints, fields, or response shapes absent from OpenAPI.
- Do not encode unresolved product behavior in handlers; return to Spark design when implementation requires it.
