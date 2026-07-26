# OpenAPI Contract Testing

Use this reference for `/spark-test` when the effective target is `openapi-contract`.

Resolve contracts through the selected profile's source root and realization state. Service Sparks are applicable; Domain Models used by their operations are contextual schema inputs; UI Components are **Not applicable**. Mark missing or ambiguous provenance **Blocked**.

## Validation and Compatibility

- Parse each OpenAPI document with established project tooling when available.
- Verify version, unique `operationId` values, resolvable `$ref` values, parameters, request bodies, declared responses, and required component schemas.
- Verify one operation per Service capability and preserve concept-level inputs, output, failures, and materially represented Domain Model rules.
- Verify realization-state paths and complete file-level Spark provenance.
- Compare updates with the existing interface and report removed or changed operations, parameters, required fields, schemas, responses, and security as potentially breaking unless project policy proves compatibility.

Run the narrowest checks first. Adding a validator, compatibility tool, generated client, or harness requires normal test-infrastructure approval. If no validator exists, perform the strongest structural checks possible and report the gap.

Classify invalid generated contracts as runtime defects for `/spark-impl`, ambiguous intent as an intent defect for `/spark-design`, and unavailable tooling as an environment defect. Do not invoke another workflow automatically.