# Contract Test Guidance

Use this optional reference when the effective target is `contract`. Reviewed Sparks define the intended service boundary, OpenAPI defines the generated interface, and established project tooling defines validation choices.

## Scope

- Resolve applicable Domain Model and Service Sparks using the Contract target applicability rules.
- Treat `ui-component` Sparks as **Not applicable** to Contract test artifacts and inspect them only as context when they constrain an applicable service interaction.
- Validate only contract artifacts in the requested scope. Treat other Sparks as context when they constrain operations or boundary schemas.
- Require `contracts.service-format: openapi-3.1` and locate contracts beneath `contracts.root` through conventional paths and realization state.
- Mark missing or ambiguous Spark-to-contract correspondence **Blocked** rather than inventing provenance.

## Contract Validation

- Parse each OpenAPI document with established project tooling when available.
- Verify OpenAPI version, unique `operationId` values, resolvable `$ref` values, parameter and request-body schemas, declared responses, and required component schemas.
- For a model-derived contract, verify that operations exactly match `service-exposure.standard-operations` and that create, update, identity, and public-output schemas reflect field defaults, mutability, invariants, and boundary restrictions.
- For an explicit Service contract, verify one operation per capability and preserve its concept-level inputs, output, and observable failure behavior.
- Verify realization-state paths and complete file-level Spark provenance.

## Compatibility

- Compare an updated contract with the existing interface using established compatibility tooling when available.
- Report removed or changed operations, parameters, required fields, schemas, responses, and security requirements as potentially breaking unless project policy proves compatibility.
- Treat compatibility policy as reviewed Service intent; do not weaken validation to accept an unintended breaking change.

## Execution

- Run the narrowest contract checks first, then the smallest relevant contract regression scope.
- Adding a validator, compatibility tool, generated client, or test harness requires the normal test-infrastructure approval.
- When no validator is available, perform the strongest structural checks possible and report the remaining validation gap.
- Classify invalid generated contracts as runtime artifact defects requiring a later `/implement-sparks` invocation, ambiguous boundary intent as an intent defect requiring `/design-sparks`, and unavailable tooling as an environment defect. Do not invoke another workflow automatically.
