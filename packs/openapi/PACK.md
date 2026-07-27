# OpenAPI Implementation Pack

This optional pack generates, implements, consumes, and tests OpenAPI 3.1 service contracts. Install it with `sparkwell init --pack openapi`, then activate it per implementation profile:

```yaml
implementations:
  profiles:
    public-api-contract:
      target: openapi-contract
      source-root: src/contracts
      packs:
        openapi:
          version: '3.1'
```

Installation makes the pack available; only a profile whose `packs` list contains `openapi` activates it. The profile, project guidance, and native project configure the pack. Conflicts remain **Blocked** rather than being resolved by list order.

## Intent Boundary

Reviewed Service Sparks define public capabilities, concept-level inputs and outputs, failures, and other observable service behavior. OpenAPI documents define the realized wire interface. Domain Model Sparks may define schemas used by a Service, but this pack never publishes a Domain Model or derives CRUD operations merely because a model exists.

OpenAPI paths, methods, parameters, schemas, and generators are engineering decisions owned by this pack, project guidance, or established artifacts. They do not belong in SparkWell Core.

## Profile Contract

The pack supports these profile roles:

| Role | Profile configuration |
|---|---|
| Contract producer | `target: openapi-contract`; `source-root` is the contract artifact root; `packs.openapi.version` is `'3.1'` |
| API implementation | `target: api-service`; `packs.openapi.contract-profile` names one contract-producer profile |
| Runtime client | Any runtime target; `packs.openapi.contract-profile` names one contract-producer profile |

Every participating profile lists `openapi` in `packs`. A referenced contract profile must exist, use `target: openapi-contract`, activate this pack, and have a project-relative `source-root`. Keep service locations, credentials, and secrets in native secure configuration.

Before `/spark-config` finalizes or `/spark-impl` and `/spark-test` plan work:

- require `packs.openapi.version: '3.1'` on every producer profile;
- resolve every `packs.openapi.contract-profile` to an existing producer profile satisfying the preceding contract;
- mark a missing reference, wrong target, missing pack activation, incompatible version, or unsafe source root **Blocked**.

These are pack-owned configuration requirements. Project guidance cannot override them; contradictions are **Blocked**.

## Workflow Guidance

Read the relevant references before planning:

| Workflow and condition | Reference |
|---|---|
| `/spark-impl`, target `openapi-contract` | [OpenAPI contract production](./references/openapi-contract.md) |
| `/spark-impl`, target `api-service` | [OpenAPI API service](./references/api-service.md) |
| `/spark-impl`, runtime calls a packed service | [OpenAPI client](./references/openapi-client.md) |
| `/spark-test`, target `openapi-contract` | [OpenAPI contract testing](./references/openapi-contract-test.md) |
| `/spark-test`, target `api-service` | [OpenAPI API-service testing](./references/api-service-test.md) |

When no listed condition applies, this pack adds no target behavior.