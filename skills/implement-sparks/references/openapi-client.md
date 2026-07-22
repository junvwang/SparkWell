# OpenAPI Client Guidance

Use this reference when a runtime artifact calls a service defined by OpenAPI. Reviewed Sparks remain authoritative for runtime behavior, the OpenAPI document for the wire interface, and the selected profile and native project for implementation choices.

## Resolve Operations

- Locate candidate contracts through the shared contract-discovery workflow.
- Select one contract operation by `operationId` for each required service interaction. Mark the task **Blocked** when no unique operation matches.
- Follow the operation's path, HTTP method, parameters, request body, security requirements, responses, and `$ref` schemas. Do not reconstruct routes or data shapes from Sparks.
- Resolve the service base URL from established runtime configuration or contract server metadata. Do not embed environments, credentials, or secrets; mark missing required configuration **Blocked**.

## Choose a Client Strategy

- Inspect existing OpenAPI generator configuration, generated clients, networking abstractions, and serialization conventions before adding code or dependencies.
- Prefer established client-generation tooling when its output fits the project. Run the artifact-owning generator and do not hand-edit generated files.
- Otherwise implement the smallest compatible client or adapter with the target's existing networking and serialization stack.
- Preserve contract-defined wire names, parameter locations, content types, formats, enum values, and optionality.

## Implement Runtime Behavior

- Serialize path, query, header, cookie, and body inputs exactly as the selected operation defines them.
- Apply declared security through the project's established authentication and secret-handling mechanisms.
- Handle declared success and failure responses, then map them to the runtime behavior defined by the reviewed Sparks.
- Treat undocumented responses, malformed payloads, and transport failures through established project behavior without inventing contract semantics.
- Do not modify the public contract from a runtime-target task.

## Validate

- Run the owning generator when applicable, then compile, type-check, lint, and format through the native toolchain.
- Verify that generated or handwritten calls correspond to the selected `operationId` and use its method, path, inputs, security, and response schemas.
- Run a bounded smoke check when a safe endpoint and required credentials are available. Otherwise report exactly what remains unverified.
