# OpenAPI Client

Use this reference when a runtime profile activates the OpenAPI pack and calls a service from its configured `contract-profile`.

## Resolve Operations

Verify the referenced producer profile as defined by `PACK.md`, then locate contracts through its realization state and source root.

- Select one unique `operationId` for each required Service interaction; otherwise mark the task **Blocked**.
- Follow the operation's path, HTTP method, parameters, request body, security, responses, and `$ref` schemas instead of reconstructing wire details from Sparks.
- Resolve the service base URL from native runtime configuration or contract server metadata. Never embed environments, credentials, or secrets.

## Client Strategy and Runtime Behavior

Inspect existing generator configuration, generated clients, networking abstractions, and serialization conventions before adding code or dependencies. Prefer established client-generation tooling and do not hand-edit generated files. Otherwise implement the smallest compatible adapter with the existing networking stack.

Preserve wire names, parameter locations, content types, formats, enum values, and optionality. Apply declared security through established authentication and secret handling. Map declared successes and failures to reviewed runtime behavior, and handle transport or malformed-payload failures through established project behavior without inventing contract semantics.

Do not modify the public contract from a runtime task.

## Validation

Run the owning generator when applicable, then compile, type-check, lint, and format. Verify every call against its selected `operationId`, including method, path, inputs, security, and responses. Run a bounded smoke check when a safe endpoint and required credentials are available; otherwise report what remains unverified.