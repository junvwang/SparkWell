# API Service Test Guidance

Use this optional reference when the effective target is `api-service`. Reviewed Sparks define required behavior, OpenAPI defines the public wire interface, and the selected profile and established native test stack define implementation choices.

## Contract and Scope

- Require `contracts.service-format: openapi-3.1` and resolve applicable contracts beneath `contracts.root` through realization state and conventional paths.
- Match tested operations by `operationId`. Mark missing or ambiguous contract correspondence **Blocked** rather than reconstructing an interface from Sparks.
- Test only operations and behavior within the requested Spark scope, including shared behavior at risk through the same handlers or domain artifacts.

## Coverage

- Verify HTTP method, path, parameter location, required inputs, request content type, request schema, and declared security where applicable.
- Verify success and failure status codes, headers, response content types, and response schemas.
- Cover Domain Model invariants, Service capability behavior, and observable failures required by the reviewed Sparks.
- Check malformed inputs, authorization failures, undocumented responses, and dependency failures only when required behavior or material risk justifies them.
- Test the public API boundary rather than generated classes, framework internals, or incidental handler structure.

## Test Integration

- Preserve the established test framework, server host, fixtures, authentication helpers, data isolation, and CI commands.
- Prefer established OpenAPI validation or conformance tooling. Adding a new validator, generated client, server harness, or external dependency requires the normal test-infrastructure approval.
- Keep external services and persistence controlled through established fixtures or environments; do not weaken assertions because an environment is inconvenient.

## Execution

- Validate the OpenAPI document before interpreting downstream conformance failures.
- Run the narrowest changed operation scenarios first, then the smallest relevant API regression scope.
- Exercise the running service when the environment permits it. Report missing endpoints, credentials, dependencies, or infrastructure as environment blockers.
- Distinguish contract violations, runtime behavior defects, stale tests, and ambiguous Spark intent according to the shared failure classifications.
