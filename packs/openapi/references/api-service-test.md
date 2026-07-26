# OpenAPI API-Service Testing

Use this reference for `/spark-test` when the effective target is `api-service` and its profile activates the OpenAPI pack.

Resolve contracts through `constraints.contract-profile` as defined by `PACK.md`. Match operations by `operationId`; mark missing or ambiguous correspondence **Blocked** rather than reconstructing an interface from Sparks. Detect duplicate path and method pairs across contracts implemented by the service.

## Coverage

- Verify method, path, parameter location, required inputs, request content type, request schema, and declared security.
- Verify success and failure status codes, headers, content types, and response schemas.
- Cover reviewed Domain Model invariants, Service behavior, and observable failures.
- Cover malformed inputs, authorization failures, undocumented responses, and dependency failures only when required behavior or material risk justifies them.
- Test the public boundary rather than generated classes, framework internals, or incidental handler structure.

Preserve the established test framework, host, fixtures, authentication helpers, data isolation, and CI commands. Prefer established OpenAPI validation or conformance tooling. Adding a validator, generated client, server harness, or external dependency requires normal test-infrastructure approval.

Validate the contract before interpreting conformance failures. Run changed-operation scenarios first, then the smallest relevant regression scope. Exercise the running service when possible and distinguish contract violations, runtime defects, stale tests, ambiguous Spark intent, and environment blockers.