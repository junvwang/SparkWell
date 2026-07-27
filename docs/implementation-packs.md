# Optional Implementation Packs

Implementation packs provide reusable technology-specific realization and test guidance without making that technology part of SparkWell Core.

## Boundary

SparkWell Core owns:

- Spark concepts, kinds, relationships, and document semantics;
- project implementation profiles and guidance;
- generic design, configuration, implementation, and testing workflows;
- realization provenance.

Projects and optional packs own:

- frameworks, protocols, interface formats, persistence providers, and generators;
- target applicability and artifact mapping;
- technology-specific implementation and validation rules;
- generated versus human-maintained boundaries.

A pack never owns product behavior. Reviewed Sparks remain authoritative for capabilities, domain rules, user-visible behavior, failures, and lifecycle.

## Install and Activate

Install a bundled pack explicitly:

```sh
sparkwell init --pack openapi
```

The initializer projects it to:

```text
.sparkwell/packs/openapi/
├── pack.json
├── PACK.md
└── references/
```

Installation only makes the pack available. Activate it per profile:

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

Before planning, `/spark-impl` and `/spark-test` read every selected `PACK.md` and the references it requires. A missing pack, incompatible profile, or conflict is **Blocked**. Pack list order never resolves conflicts.

`/spark-config` may add or remove a pack ID in a proposal, but it does not install or edit packs. When a requested bundled pack is absent, install it with the CLI first.

## OpenAPI Pack

The bundled `openapi` pack supports:

- `openapi-contract` profiles that generate OpenAPI 3.1 from explicit Service Sparks;
- `api-service` profiles that implement a producer profile's contracts;
- runtime profiles that consume those contracts;
- contract and API conformance testing.

Producer and consumer profiles are connected explicitly:

```yaml
implementations:
  profiles:
    public-api-contract:
      target: openapi-contract
      source-root: src/contracts
      packs:
        openapi:
          version: '3.1'

    todo-api:
      target: api-service
      source-root: src/todo-api
      packs:
        openapi:
          contract-profile: public-api-contract
      guidance:
        - .sparkwell/guidance/todo-api.md
```

The producer's `source-root` owns contract artifacts. Consumers resolve `packs.openapi.contract-profile`, then use that profile's source root and realization state. Runtime and architecture choices remain in guidance or native files. Core has no global contract root or contract format.

## Service Intent

A Domain Model never creates public operations automatically. It may provide data semantics used by a Service, or state that it must not cross a Service boundary.

A Service Spark explicitly owns every capability offered across its conceptual boundary. This includes familiar create, retrieve, update, and delete capabilities when they are part of the intended public behavior.

The OpenAPI pack maps those capabilities to paths, methods, operations, and schemas. Another pack may map the same Service intent to gRPC, GraphQL, messaging, an in-process interface, or another technology without changing Core semantics.

## Migration From the Former Contract Model

Projects using the former root-level `contracts` configuration should:

1. Install the OpenAPI pack.
2. Replace `contracts.root` with an `openapi-contract` profile whose `source-root` is the old contract root.
3. Replace `contracts.service-format` with `packs.openapi.version: '3.1'` on that profile.
4. Add an `openapi` key to each participating profile's `packs` map.
5. Add `packs.openapi.contract-profile` to each consumer.
6. Replace Domain Model `service-exposure` with explicit Service capabilities.
7. Move contract provenance to the producer profile's realization manifest.

For example, replace this former Domain Model metadata:

```yaml
service-exposure:
  standard-operations: [create, get, list, update, delete]
```

with a reviewed Service Spark whose capability table states the intended boundary explicitly:

```markdown
---
id: todo-service
name: Todo Service
kind: service
summary: Offers Todo Item management across a service boundary.
composes: []
uses:
  - todo-item-model
---

# Todo Service

## Capabilities

| Capability | Purpose | Inputs | Output | Failure Behavior |
|---|---|---|---|---|
| `create-todo` | Create a Todo Item | Todo title | `todo-item-model` | Rejects an invalid title without creating an item |
| `get-todo` | Retrieve one Todo Item | Todo Item identity | `todo-item-model` | Reports that the requested item does not exist |
| `list-todos` | Retrieve Todo Items | None | List of `todo-item-model` | None |
| `update-todo` | Change an existing Todo Item | Todo Item identity and requested changes | `todo-item-model` | Rejects invalid changes without partial update |
| `delete-todo` | Delete one Todo Item | Todo Item identity | None | Reports that the requested item does not exist |
```

Migration changes the representation of public service intent and should be reviewed before regenerating artifacts.