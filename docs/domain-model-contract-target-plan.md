# Domain Model, Contract, and Multi-Target Implementation Plan

> Status: Superseded
>
> This document records the former design in which Contract/OpenAPI behavior and `service-exposure` were bundled into SparkWell Core. The current design moves technology-specific behavior into optional implementation packs, requires explicit Service capabilities, and configures contract producers and consumers through profiles. See [Optional Implementation Packs](implementation-packs.md). The material below is historical and must not be used as current workflow guidance.

## 1. Background

SparkWell currently supports:

- durable, implementation-independent software intent represented by Sparks;
- concept relationships expressed through `composes` and `uses`;
- implementation profiles containing target, source-root, constraints, and preferences;
- separate realizations for API Service, Web, Windows, Android, and iOS;
- realization state that records provenance between Sparks and engineering artifacts.

Without shared contracts, client and API Service targets may infer incompatible interfaces from the same Sparks, including disagreement about:

- field names, optionality, and validation;
- API operations, inputs, outputs, and error formats;
- how public boundary models map to internal persistence representations;
- how a model in one language corresponds to the same concept in another;
- which implementations are affected by a Domain Model change.

This plan introduces contract realizations so that each public boundary has one precise interface artifact that all relevant targets share.

## 2. Goals

1. Replace the recommended `data-model` kind with `domain-model`.
2. Represent each independently meaningful model, with its identity and invariants, as a Spark.
3. Keep authoritative model fields, types, ranges, defaults, and constraints in the Domain Model Spark itself.
4. Add a `contract` target whose initial bundled behavior generates OpenAPI Service Contracts.
5. Add an `api-service` target whose runtime, framework, and API style come from its implementation profile.
6. Keep persistence choices, access code, and provider-specific artifacts within the runtime target that uses them.
7. Connect Sparks and target implementations through Spark relationships, standard contract files under one project-level `contracts.root`, and realization-state provenance.
8. Normalize model-enabled standard operations and explicit Service Spark capabilities through a transient Effective Service Definition.
9. Validate the design through an end-to-end Todo scenario.

## 3. Non-Goals

This update will not:

- turn Spark bodies into a rigid field DSL;
- generate a duplicate standalone Domain Contract or JSON Schema for each Domain Model;
- require Spark Documents to prescribe REST, OpenAPI, an ORM, or a database provider;
- require every field, DTO, ORM entity, or database table to become a Spark;
- create a low-information Service Spark for every model that exposes standard operations;
- list individual Sparks, projections, operations, or schemas in implementation profiles;
- create a custom Contract ID registry, Contract Set Manifest, or symbol registry;
- let runtime targets independently generate competing versions of the same public interface;
- introduce an independently managed persistence surface before an explicit persistence contract exists;
- generate persistence or event contracts in the initial Contract target;
- build profile dependency graphs, topological scheduling, execution-order enforcement, or automatic cross-profile orchestration;
- define generated-code ownership, direct-edit boundaries, customization points, or regeneration merge behavior; those concerns belong to a separate plan;
- establish a remote contract registry before practical evidence requires one.

## 4. Core Design Principles

### 4.1 A Contract Belongs to a Boundary

Use the target name:

```yaml
target: contract
```

Do not use `layer-contract`. Public boundaries may exist between UI and API, a service and an external system, an event publisher and subscriber, or a plugin host and plugin. The design must not require a traditional layered architecture.

### 4.2 One Public Contract Has One Owner

The `contract` target is the only workflow that generates and maintains public contract files.

Other targets may:

- implement a contract;
- consume a contract;
- generate target-specific clients, server stubs, types, or adapters from a contract;
- never independently derive a second version of the same public interface.

The first version will not introduce a separate contract management system. The standard contract file is the authoritative interface, and realization state records which Sparks produced each contract artifact.

### 4.3 Contract Location, Operations, and Schemas

Do not define an additional SparkWell Contract ID. Use the configured artifact root, target conventions, and identifiers already present in the standard contract:

| Identifier | Example | Purpose |
|---|---|---|
| Spark ID | `todo-item-model` | Stable software-concept identity |
| Contract path | `src/contracts/service/todo-management-service.openapi.yaml` | Project-relative contract artifact location |
| Operation ID | `completeAll` | Stable operation identifier in a Service Contract |
| Schema symbol | `#/components/schemas/TodoItem` | Data definition in a Service Contract |

The project-level `contracts.root` defines the root contract directory. Target guidance defines the default layout beneath that root:

```text
<contracts-root>/
└── service/
  ├── <domain-model-spark-id>.openapi.yaml
  └── <service-spark-id>.openapi.yaml
```

For example:

- `src/contracts/service/todo-item-model.openapi.yaml` is the model-derived service for the `todo-item-model` Domain Model Spark;
- `src/contracts/service/todo-management-service.openapi.yaml` is the service derived from the explicit `todo-management-service` Service Spark.

An established project may choose another root or layout through project configuration and guidance. It must not require per-Spark path mappings.

In OpenAPI, `operationId` is the stable logical name of an API operation, not its URL. For example, `POST /todos/complete-all` may have `operationId: completeAll`, and client generators commonly turn it into a method such as `client.completeAll()`.

A schema symbol is a contract-local data-shape name. `#/components/schemas/TodoItem` refers to the `TodoItem` schema inside that OpenAPI file. It is not a back-reference to a Spark. Once an operation is selected, its standard `$ref` links identify the request and response schemas required to generate invocation code.

Spark-to-contract provenance belongs in realization state. A Spark's display name may change, so provenance always uses stable Spark IDs. Symbol-level provenance is not required in the first version: realization state locates the contract file, `operationId` locates the operation, and `$ref` locates its schemas.

Suggested kind suffixes may make Spark IDs easier to read, but targets treat IDs as opaque identities. Contract applicability and behavior come from the Spark's `kind` and reviewed content, never from an ID suffix.

### 4.4 A Domain Model May Have Multiple Boundary Projections

The same `todo-item-model` may appear as:

- `service-public`: data returned through a public API;
- `service-create-input`: fields accepted when creating an item;
- `service-update-input`: fields accepted when updating an item;
- `persistence`: data required by a persistence boundary.

The complete model definition and domain semantics remain in the Domain Model Spark. A Service Contract contains only the projections required by its API boundary. Standard operation and schema references connect those projections inside the contract. Targets must not assume that one model has the same representation at every boundary.

The Contract target creates these OpenAPI projections. Client targets generate or adapt calls from them, while the API Service target implements the same operations and maps boundary schemas to internal domain representations. Runtime targets do not derive wire shapes directly from the Domain Model Spark.

### 4.5 Not Every Spark Is Realized by Every Target

Do not hard-code an absolute `kind -> target` filter in the shared skill. Use these responsibilities instead:

| Source | Responsibility |
|---|---|
| Target reference | Supplies default applicability and implementation guidance |
| Implementation request | Selects root Spark scope for the current realization |
| Project contract configuration | Configures the shared contract root and service-contract format |
| Implementation profile | Configures runtime-target technology choices and artifact root |
| Standard contract | Defines operations, request/response schemas, and errors |
| Realization state | Maps contract artifacts and other outputs to source Spark IDs |

Target guidance does not override project contract configuration, explicit profile choices, compatible user choices, or an established project. The implementation request determines scope; standard contract files and realization state record the result.

### 4.6 Derived Intermediate Models Are Not Sparks

The Contract target may construct a transient model that resolves several durable inputs into one deterministic contract-generation input. Such an intermediate model:

- does not represent an independently evolving software concept;
- has no Spark ID;
- is not written under `sparks/`;
- is not added to `composes` or `uses`;
- is not recorded as an artifact in realization state;
- is recomputed from reviewed Sparks and project contract configuration;
- is summarized in the execution plan, including policies, overrides, and unresolved conflicts.

Durable software intent remains in Sparks, durable contract settings remain in project configuration, durable runtime technology choices remain in profiles or native projects, and durable machine-readable boundaries remain in standard contracts. A transient model must not become another source of truth.

## 5. Domain Model Sparks

### 5.1 Replace `data-model` with `domain-model`

Replace the recommended kind:

```yaml
kind: data-model
```

with:

```yaml
kind: domain-model
```

A Domain Model Spark should describe:

- domain meaning;
- stable identity;
- fields and their meaning;
- required and optional values;
- valid ranges and invariants;
- defaults and lifecycle;
- model-level behavior;
- relationships with other Domain Models;
- explicitly enabled standard public service operations;
- responsibilities outside the model's boundary.

A Domain Model Spark normally does not describe:

- TypeScript, C#, Java, Swift, or Kotlin types;
- JSON property names as transport-specific choices;
- HTTP routes or verbs;
- ORM annotations;
- SQL tables or columns;
- UI layout or presentation.

#### Field Table Convention

Use a lightweight, semi-structured Markdown table as the authoritative definition of fields, types, ranges, defaults, optionality, and mutability. Do not generate a standalone Domain Contract that duplicates this information.

Recommended structure:

```markdown
## Data

| Field | Meaning | Type | Required | Default | Constraints | Mutability |
|---|---|---|---|---|---|---|
| `id` | Stable Todo Item identity | identifier | Yes | Generated | Unique and non-empty | Immutable |
| `title` | Work to remember | string | Yes | None | Trimmed; 1–200 characters | Mutable |
| `completed` | Whether work is complete | boolean | Yes | `false` | — | Mutable |
```

Rules:

- `Field` is a stable logical field identifier, not a display label.
- `Meaning` states the domain semantics.
- `Type` uses technology-independent domain types such as `string`, `boolean`, `integer`, `decimal`, `identifier`, `date`, `datetime`, `enum(...)`, `reference(<spark-id>)`, and `list(...)`.
- `Required` states whether the model permits the value to be absent.
- `Default` states the domain default or generation rule.
- `Constraints` states lengths, ranges, formats, uniqueness, and other invariants.
- `Mutability` states whether the value may change after creation.

Do not use `System.Guid`, `DateTimeOffset`, TypeScript interfaces, ORM annotations, or database column types in this table. Targets map domain types to concrete language, API, and storage types according to the profile and native project.

Use a separate relationship table to add cardinality, lifecycle, and ownership detail to `composes` and `uses`:

```markdown
## Relationships

| Model | Relationship | Cardinality | Ownership | Rules |
|---|---|---|---|---|
| `todo-list-model` | Belongs to | One | Todo List owns lifecycle | Deleted with its list |
```

The table is not a strict DSL in the first phase. Agents interpret it and return to Spark design when a field identifier, type, or constraint is unclear. Introduce deterministic table and type validation only if practice demonstrates a need.

### 5.2 Domain Model Granularity

Default rule:

> One independently meaningful model with stable identity, invariants, and an independent reason to evolve should be one Spark.

The following normally do not become separate Sparks:

- ordinary fields;
- implementation-only DTOs;
- ORM entities;
- API request or response classes;
- database rows;
- simple value objects with no independent behavior or rules.

### 5.3 Relationships Between Domain Models

Use existing Spark relationships:

- `composes` for lifecycle or conceptual ownership;
- `uses` for references to independently owned models;
- the body for cardinality, ownership, deletion propagation, and other detailed semantics.

Do not create an empty parent Spark only to draw a model diagram. `visualize-sparks` should eventually derive a relationship diagram by scanning `domain-model` Sparks.

Create a broader `domain`, `application`, or other composing Spark only when the parent has real software intent, such as a bounded context, aggregate boundary, or cross-model invariant.

### 5.4 UI Data and Service Dependencies

A UI Spark references only software concepts through Spark IDs. It never references a contract path, schema filename, operation ID, or generated language type.

To display model data, reference the Domain Model Spark and describe presentation behavior in the body:

```yaml
uses:
  - todo-item-model
```

To use the model's standard service capabilities, still reference the Domain Model Spark and state the required operations in the body:

```yaml
uses:
  - todo-item-model
```

```markdown
## Interactions

- Use the standard Todo Item service capabilities to list, create, rename, complete, reopen, and delete Todo Items.
```

"Standard service capabilities" means a service derived from the Domain Model's `service-exposure`. It does not imply a hidden Service Spark.

To use independently meaningful service behavior, reference an explicit Service Spark:

```yaml
uses:
  - todo-management-service
```

A UI may reference both:

```yaml
uses:
  - todo-item-model
  - todo-management-service
```

For example, standard CRUD may come from the model-derived Todo Item service while bulk completion comes from Todo Management. The UI body must identify which interactions use standard capabilities and which use explicit service behavior. The `uses` list alone is not enough to infer operation ownership.

Resolution rules:

- Domain Model usage with display-only behavior produces a target-specific model representation or uses a service output projection; it does not infer write operations.
- Domain Model usage with explicit standard operations matches a model-derived Service Contract only when the model declares those operations through `service-exposure`.
- Explicit Service Spark usage matches the Service Contract derived from that Spark.
- Both references may result in both default and explicit Service Contracts being consumed.
- Missing or conflicting operation ownership returns to Spark design for clarification.

## 6. Effective Service Definition

### 6.1 Unified Resolution

The Contract target first constructs a transient **Effective Service Definition**:

```text
Reviewed Domain Model Spark
+ optional reviewed Service Spark
+ explicit Domain Model service exposure
→ transient Effective Service Definition
→ Service Contract
```

It resolves:

- public operations;
- input and output projections;
- application of validation and invariants;
- permissions, errors, concurrency, and idempotency;
- model-enabled standard operations and explicit capabilities;
- Spark sources used by the resulting contract.

The Effective Service Definition is not a Spark Document or project file. The Contract target summarizes it in the execution plan. Missing product decisions or conflicting intent make contract generation `Blocked`; the workflow must not encode guesses in the contract.

Service Contract provenance includes only durable Sparks:

- Domain Model Sparks for model-enabled standard services;
- explicit Service Sparks and their related Domain Model Sparks for explicit services;

### 6.2 Standard Model Service

When a consumer Spark references a Domain Model and requests standard CRUD or model-level operations:

```text
Domain Model Spark
+ non-empty service-exposure.standard-operations
→ transient Effective Service Definition
→ Service Contract
```

The supported standard operations are create, get, list, update, and delete. The Domain Model explicitly selects a non-empty subset. Omitting `service-exposure` generates no model-derived Service Contract. This mechanism does not create an additional Service Spark.

Referencing a Domain Model does not request every CRUD operation. The Contract target reads consumer Spark behavior to distinguish display-only usage from explicitly requested service operations.

#### Standard Operations Frontmatter

A Domain Model Spark explicitly opts into a model-derived public Service Contract through optional kind-specific frontmatter.

Allow the full standard service:

```yaml
service-exposure:
  standard-operations:
    - create
    - get
    - list
    - update
    - delete
```

Permit read-only standard operations:

```yaml
service-exposure:
  standard-operations:
    - get
    - list
```

Omit `service-exposure` to generate no model-derived Service Contract. When present, `standard-operations` must be non-empty and is the exact standard operation set generated by the Contract target.

Semantics:

- When the Domain Model is in Contract candidate scope, generate exactly the listed operations.
- Omission prohibits automatic public-service derivation from the Domain Model.
- Omission does not prohibit target-specific model types or persistence artifacts.
- Omission does not prevent an explicit Service Spark from using the model as input or output.
- A stronger statement in the Domain Model body is required when the model must never cross any public service boundary; conflicting explicit Service Sparks are then `Blocked`.
- Project configuration and implementation profiles may not add or remove operations from the exact `standard-operations` list.

If a consumer requests a prohibited standard operation, do not generate it. Return to Spark review to remove the consumer request, evolve the model's exposure intent, or introduce an explicit Service Spark with the necessary product rules.

### 6.3 Explicit Service Spark

Create a Service Spark for independently meaningful behavior such as:

- cross-model operations;
- specialized queries;
- permissions and authorization;
- concurrency, idempotency, or transaction semantics;
- specialized errors;
- batch operations;
- external-system interactions;
- workflows not owned by one Domain Model.

Every explicit Service Spark uses the standardized `## Capabilities` table:

```markdown
| Capability | Purpose | Inputs | Output | Failure Behavior |
|---|---|---|---|---|
| `complete-all` | Mark every active Todo Item complete | None | Number of `todo-item-model` models changed | Fails without partial completion if the operation cannot complete |
```

Capability IDs are stable service-level identities. Inputs and outputs reference concepts through Spark IDs where applicable. Contract generation maps capabilities to native contract operations; the Service Spark does not prescribe transport routes, DTOs, or generated operation names.

Generation becomes:

```text
Domain Model Spark
+ Service Spark
→ transient Effective Service Definition
→ Service Contract
```

Authority rules:

- The Domain Model owns field semantics, validation, invariants, and model behavior.
- The Service Spark owns public operations, queries, boundary projections, permissions, and errors.
- The Service Spark does not replace the Domain Model.
- The Service Spark's `## Capabilities` table is authoritative for the capabilities it owns. Standard model operations remain separately governed by Domain Model `service-exposure`.

The presence of an explicit Service Spark does not disable a separately enabled model-derived service. Resolve service usage per consumer and per operation:

- Domain Model references use declared model-derived standard operations.
- Explicit Service Spark references use that Spark's contract.
- A consumer may use both contracts.
- Conflicting semantics for the same consumer operation are `Blocked`.

Consumers select explicit services through stable Spark IDs. The Service Spark references related Domain Models through its own `uses`. If a consumer references multiple Service Sparks, its body must distinguish operation ownership.

## 7. Contract Target

### 7.1 Outputs

| Contract kind | Recommended format | Primary inputs |
|---|---|---|
| Service Contract | OpenAPI 3.1 | Effective Service Definition |

The bundled target generates OpenAPI 3.1 Service Contracts with embedded request, response, and error schemas.

Persistence and event contracts are deferred until their Spark semantics and boundary formats are designed and validated.

The Contract target does not duplicate the complete Domain Model field table. It derives only the projections required by the current service boundary, such as:

- `TodoItem`: public output;
- `CreateTodoInput`: create input;
- `UpdateTodoInput`: update input;
- `Problem`: service error.

These schemas belong to the Service Contract. Web, Windows, and mobile clients consume that same contract. A local target that does not use an API may generate its domain type directly from the Domain Model Spark.

### 7.2 Output Location and Naming

```text
<contracts-root>/
└── service/
    ├── todo-item-model.openapi.yaml
    └── todo-management-service.openapi.yaml
```

The project-level `contracts.root` configures the root. The target reference supplies these default subdirectories and filenames:

- model-derived service: `service/<domain-model-spark-id>.openapi.yaml`;
- explicit service: `service/<service-spark-id>.openapi.yaml`;

This convention makes common contract paths predictable without adding per-Spark configuration.

### 7.3 Standard Contract Content

The Service Contract itself contains everything AI and existing tools need for interface consistency:

- operations, parameters, and stable operation IDs;
- request, response, and error schemas;
- required values, types, ranges, and formats;
- the Domain Model projections used at the boundary.

Example OpenAPI generated from an explicit Service Spark:

```yaml
openapi: 3.1.0

info:
  title: Todo Management API
  version: 1.0.0

paths:
  /todos/complete-all:
    post:
      operationId: completeAll
      responses:
        "200":
          description: Number of Todo Items changed
          content:
            application/json:
              schema:
                type: integer
                minimum: 0
```

The OpenAPI file needs no SparkWell-specific extensions. Record its provenance in the Contract target's realization state:

```yaml
schema-version: 1
implementation-id: contract

artifacts:
  - path: src/contracts/service/todo-item-model.openapi.yaml
    derived-from:
      - todo-item-model

  - path: src/contracts/service/todo-management-service.openapi.yaml
    derived-from:
      - todo-item-model
      - todo-management-service
```

The OpenAPI file remains authoritative for operations and API schemas. Realization state is authoritative only for artifact provenance and discovery; it does not redefine contract content.

The first version does not need symbol-level provenance. After realization state identifies a candidate OpenAPI file, the implementation workflow selects the required `operationId` from UI behavior and follows that operation's standard `$ref` links to its request and response schemas.

Do not generate `contract-set.yaml`, add custom OpenAPI extensions, assign custom Contract IDs, or maintain a symbol registry in the first phase. If file-level provenance proves insufficient at scale, design more detailed indexing separately.

## 8. Targets and Implementation Profiles

### 8.1 Target Definition

Define a target as:

> An independently built, deployed, or otherwise realized engineering surface for selected Sparks.

Recommended targets after this change:

- `contract`;
- `api-service`;
- existing `web`, `windows`, `android`, and `ios` targets.

### 8.2 Framework and Tool Configuration

Structured technology and architecture choices remain in implementation profiles; nuanced architecture belongs in profile-referenced project guidance; native files own actual dependencies and build state:

```yaml
constraints:
  runtime: dotnet
  framework: aspnet-core
  architecture: clean-architecture
  persistence:
    provider: sqlite
    access: orm
    orm: entity-framework-core
```

Without an ORM:

```yaml
constraints:
  runtime: dotnet
  framework: aspnet-core
  persistence:
    provider: postgresql
    access: sql-driver
    driver: npgsql
```

Persistence constraints may select no persistence, a local file, an embedded database such as SQLite, or a directly accessed database service. Profiles do not contain connection secrets or duplicate dependencies, commands, formatter rules, or linter settings already owned by native project files.

### 8.3 Project Implementation Guidance

Profiles may reference project-relative guidance:

```yaml
guidance:
  - .sparkwell/guidance/todo-api.md
```

Guidance defines project-owned architecture and generation rules such as module boundaries, state ownership, model mappings, persistence access, local and remote data flow, repository and dependency-injection patterns, error handling, artifact placement, and workflow-maintained boundaries.

Every guidance file must be read before implementation planning. Missing or conflicting guidance, disagreement with profile constraints, or conflict with established native architecture makes the task **Blocked**. List order does not resolve conflicts.

Sparks retain product semantics such as offline behavior, synchronization outcomes, conflict presentation, and user-visible failures. Profiles and guidance own provider, adapter, ORM, repository, and source-layout choices.

Use `/spark-config` to propose and finalize profiles and guidance. It does not generate product artifacts. New runtime implementations require a named profile and resolved consequential architecture; established implementations preserve their existing architecture.

### 8.4 Scope Does Not Belong in Profiles

An implementation profile answers "how," not "which product concepts." Do not add `realizes.roots`, exclusions, or other Spark lists.

The implementation request chooses scope:

```text
/spark-impl Implement todo-item-model and todo-management-service for the contract target.
```

Existing scope rules remain:

- requested roots come from the user request;
- composed descendants enter candidate scope;
- `uses` contributes context and contract requirements but does not automatically expand runtime implementation scope;
- target guidance determines default applicability;
- non-applicable candidates are reported as `Not applicable`, not persisted as profile exclusions;
- standard contract files and realization state record actual results.

Ask for root Spark IDs when scope is ambiguous. Never persist a temporary scope choice in the profile.

### 8.5 Shared Contract Configuration

```yaml
contracts:
  root: src/contracts
  service-format: openapi-3.1
```

The root-level `contracts` configuration defines the service-contract format and shared artifact root. It does not list Spark IDs, operations, schemas, or individual files.

The Contract target uses this configuration directly and does not require an implementation profile. It generates standard contract files for the requested Spark scope and records file-level artifact provenance in `.sparkwell/state/realizations/contract.yaml`.

### 8.6 Contract Discovery

Runtime profiles contain only their own target-specific settings. They do not repeat the shared contract root:

```yaml
implementations:
  profiles:
    todo-web:
      target: web
      source-root: apps/web
      constraints:
        framework: react
        architecture: feature-modules
      guidance:
        - .sparkwell/guidance/todo-web.md

    todo-api:
      target: api-service
      source-root: services/todo-api
      constraints:
        runtime: dotnet
        framework: aspnet-core
        architecture: clean-architecture
      guidance:
        - .sparkwell/guidance/todo-api.md
```

Rules:

- `contracts.root` is a project-relative path and must not contain secrets or point outside the project.
- It is shared by every target and must not list Spark IDs, operations, schemas, or individual contract files.
- The implementation workflow inspects contract files beneath the root and realization manifests whose artifact paths are beneath it.
- For a standard model service, it first checks the conventional path `service/<domain-model-spark-id>.openapi.yaml` and verifies that realization state derives it from that model Spark.
- For an explicit service, it first checks `service/<service-spark-id>.openapi.yaml` and verifies that realization state derives it from that Service Spark.
- If an established project uses another layout, realization state provides the candidate artifact paths.
- If contracts were authored outside SparkWell and have no realization mapping, inspect them directly and surface ambiguous Spark correspondence rather than inventing provenance.
- After selecting a contract file, UI behavior is matched to its OpenAPI `operationId` values; each operation's `$ref` links determine request and response schemas.
- Web, Windows, Android, and iOS targets consume Service Contracts.
- API Service implements Service Contracts.
- Model-derived contract generation must use exactly the Domain Model's `service-exposure.standard-operations` list.
- Ambiguous matching is `Blocked`; do not bypass it with product mappings in profiles.
- `contracts.root` locates contracts and does not schedule execution.
- Missing or unreadable contract files stop the current task; the workflow does not run the Contract target automatically.

## 9. Runtime Persistence Ownership

Persistence belongs to the runtime target that uses it. The selected profile may constrain the provider or access strategy, while native project configuration owns dependencies, connection details, and secrets.

- API Service owns its data-access code and applicable serialization, mappings, schemas, and migrations.
- Web, Windows, Android, and iOS own local file or embedded-database persistence used only by that application.
- A runtime target may use no persistence, a local file such as JSON, SQLite or another embedded database, or a directly accessed database service.
- An independently managed persistence surface is unsupported until an explicit persistence contract defines the boundary. Mark such work **Blocked** rather than independently deriving compatible artifacts.
- A network-accessed data service is modeled as a Service and API Service using a Service Contract.

## 10. Manual Execution Order

Users run target and profile tasks in this order:

```text
Reviewed Sparks
      ↓
Contract target
      ↓
API Service / Web / Windows / Android / iOS
```

After contracts are generated, API and UI implementations can be generated independently. The API runtime does not need to be running or deployed first.

Current workflow:

1. The user invokes `/spark-impl` for the Contract target.
2. The Contract target creates or updates standard contract files.
3. The user separately invokes `/spark-impl` for an API or UI profile.
4. Those profiles read the existing standard contract files.
5. `spark-impl` does not run or modify other targets or profiles automatically.

SparkWell does not persist an "already generated" status or preflight global execution order. The project-level `contracts.root` only locates contracts. Missing inputs are reported for the current task.

Dependency analysis and cross-target orchestration are outside this plan. Design them separately only if practical demand emerges.

## 11. Contract Compatibility

Before updating a public contract, the Contract target should:

1. read the existing contract;
2. produce a candidate contract;
3. compare additive, compatible, and breaking changes;
4. report implementations that may be affected;
5. require explicit reviewed intent for a breaking change;
6. report which profiles need reimplementation or validation.

Compatibility responsibilities remain separate:

- Whether an API promises backward compatibility is Service Spark intent.
- Contract format and output root come from project contract configuration; generator and detailed layout choices come from project guidance or native tooling.
- Concrete compatibility checks come from the project toolchain or target guidance.

## 12. Project Changes

### 12.1 Core Contracts

#### `core/project/.sparkwell/specification.md`

- Replace recommended Data Model terminology with Domain Model.
- Add Domain Model topics to kind examples and body guidance.
- Clarify Domain Model field semantics, invariants, lifecycle, and relationships.
- Clarify that contracts are engineering artifacts.
- Clarify that a Spark need not be realized by every target.
- Keep OpenAPI details out of the core Spark Specification.

#### `core/project/.sparkwell/conventions.md`

- Replace `data-model` with `domain-model` in common kinds.
- Add Domain Model field-table and technology-independent type guidance.
- Add Domain Model relationship guidance.
- Document migration from `sparks/data-model/` to `sparks/domain-model/` without changing Spark IDs.

#### `core/project/.sparkwell/config.yaml`

- Define one project-level `contracts.root` shared by contract-producing and contract-consuming targets.
- Define the initial `contracts.service-format` as `openapi-3.1`.
- Keep Spark scope, operations, schemas, and individual files out of project configuration.

#### `core/project/.sparkwell/implementation-profiles.md`

- Explain the separation between shared contract configuration and runtime implementation profiles.
- Document that the Contract target uses root-level settings and does not require a profile.
- Keep Spark scope in implementation requests rather than profiles.
- Add a runtime profile example without repeated contract settings.

#### `core/project/.sparkwell/realization-state.md`

- Clarify that OpenAPI, generated clients, server stubs, DB schemas, and migrations are engineering artifacts.
- Use realization state as the only Spark-to-contract-file provenance index.
- Record every source Spark for shared contract artifacts.
- Continue excluding validation status and compatibility results.

### 12.2 Canonical Instructions

#### `core/instructions/sparkwell.md`

- Add the contract-first collaboration principle.
- Keep Spark relationships concept-based; Sparks never reference contract paths.
- Prevent runtime targets from inventing interfaces when contracts are missing or contradictory.
- Preserve the toolkit-work versus product-work distinction.

### 12.3 Design Skill

#### `skills/spark-design/SKILL.md`

- Add `domain-model` design guidance.
- Require field tables for fields, types, defaults, constraints, and mutability.
- Add standardized `service` semantics and the lightweight capabilities-table convention.
- Clarify when a Domain Model deserves a separate Spark.
- Clarify when an explicit Service Spark is needed.
- Define model-derived service opt-in, explicit Service capability ownership, and their coexistence rules.
- Prevent automatic low-information Service Sparks.
- Require `service-exposure.standard-operations` when automatic public service behavior is restricted.
- Allow UI Sparks to request standard model service or explicit service behavior.
- Require operation ownership to be clear in UI behavior.
- Prevent DTOs, ORM entities, API schemas, and DB rows from becoming Sparks by default.

#### `skills/spark-design/references/granularity.md`

- Add a Domain Model separate-concept test.
- Add aggregate and bounded-context parent guidance.
- Prohibit empty parent Sparks created only for diagrams.
- Add counterexamples for fields, simple value objects, DTOs, and ORM entities.

#### `skills/spark-design/references/examples.md`

Add Todo examples for:

- Domain Model with explicitly enabled standard operations;
- empty or read-only `standard-operations` frontmatter;
- Domain Model with an explicit Service Spark;
- explicit Service capability table with concept-level inputs, outputs, and failure behavior;
- UI using standard model CRUD;
- UI using explicit special service behavior;
- UI using both default and explicit services;
- relationships among several Domain Models.

### 12.4 Configuration Skill

Add `skills/spark-config/SKILL.md` as an explicit user-invoked workflow.

It should:

- inspect profiles, guidance, and established native architecture;
- classify the target as a new or established implementation;
- present an Implementation Configuration Proposal before writing files;
- support `Revise:`, `Finalize`, and `Cancel` without persisting proposal state;
- update only the finalized profile and guidance;
- preserve unrelated contract settings, profiles, and native files;
- stop before product generation and require a separate `/spark-impl` invocation.

### 12.5 Implementation Skill

#### `skills/spark-impl/SKILL.md`

- Load project-level `contracts.root`, standard contract files, and matching realization-state entries.
- Load the selected profile and every referenced project guidance document before planning.
- Preserve established architecture and mark profile/guidance/native conflicts **Blocked**.
- Require a named profile and resolved consequential architecture for new runtime implementations.
- Never choose or migrate architecture, state management, persistence, synchronization, or module layout from generic target defaults.
- Build and present the transient Effective Service Definition without persisting it.
- Keep profile-less Contract target execution user-driven.
- Report missing contract inputs without running the Contract target automatically.
- Prevent runtime targets from regenerating public contracts.
- Keep applicability guidance target-specific rather than a global kind filter.
- Record complete Spark provenance for contract-derived artifacts.

Add target references:

```text
skills/spark-impl/references/contract.md
skills/spark-impl/references/api-service.md
skills/spark-impl/references/openapi-client.md
```

Update existing target references:

```text
skills/spark-impl/references/web.md
skills/spark-impl/references/windows.md
skills/spark-impl/references/android.md
skills/spark-impl/references/ios.md
```

The shared workflow and references should:

- resolve contract files using Spark relationships, naming conventions, and realization state;
- select operations through standard `operationId` values and follow `$ref` links for schemas;
- preserve existing frameworks and native code-generation tools;
- never independently infer a competing wire format;
- report compatibility and tooling blockers.

### 12.6 Test Skill

Evaluate target references for:

```text
skills/spark-test/references/contract.md
skills/spark-test/references/api-service.md
```

Cover:

- standard contract syntax and schema validation;
- API implementation conformance;
- client compatibility;
- breaking-change detection;
- the distinction between contract validation and complete behavioral coverage.

### 12.7 Documentation

#### `README.md`

- Briefly introduce Domain Models, Contract target, and cross-target interface consistency.
- Keep detailed profile schema out of the README.
- Preserve the early-stage warning.

#### `docs/usage.md`

- Add a Domain Model example.
- Add field-table and technology-independent type examples.
- Add the contract-first workflow.
- Add project-level Contract configuration and runtime profile examples.
- Document folder-based `contracts.root` discovery.

### 12.8 Tests

#### `test/init-project.test.js`

- Update canonical skill projection counts.
- Verify new target references are projected unchanged through every adapter.
- Continue validating skill metadata.
- Update methodology-integrity assertions.

Future deterministic validator tests should use a separate test file rather than further expanding initialization tests.

## 13. Implementation Phases

### Phase 1: Concept Semantics — Implemented

- Update Specification, Conventions, and Design Skill.
- Replace `data-model` with `domain-model`.
- Define the field-table convention.
- Define model-derived service opt-in and explicit Service coexistence.
- Define Effective Service Definition as transient.
- Add Todo Spark examples.
- Do not yet change profile schema or runtime generation.

Completion criterion: Domain Model, optional Service Spark, and `service-exposure` intent can clearly express Todo fields, opt-in standard operations, restricted exposure, and custom service behavior without generating extra Service Spark Documents.

### Phase 2: Shared Service Contract Configuration — Implemented

- Define a project-level `contracts.root` and `contracts.service-format` shared by all targets.
- Define a profile-less Contract target, the OpenAPI root layout, and Spark-ID-based filename conventions.
- Update realization-state guidance.
- Review the configuration, path, and provenance conventions before changing implementation skills.

Completion criterion: Contract target generates OpenAPI Service Contracts under `contracts.root`; runtime targets locate the same files through shared configuration, naming conventions, and realization state, then use native operation and schema references without another manifest.

### Phase 3: Target Guidance — Implemented

- Add Contract target and shared OpenAPI client guidance.
- Add API Service implementation guidance.
- Add Contract and API Service test guidance.
- Keep platform references focused on platform-specific concerns.

Completion criterion: Agents consistently distinguish the contract owner, implementers, and consumers without generating duplicate contracts.

### Phase 4: Todo Vertical Validation — Not Started

Create in SparkWellDemo:

- a `todo-item-model` Domain Model Spark;
- a model-derived CRUD scenario;
- a `todo-management-service` explicit Service Spark scenario;
- project-level Contract configuration;
- OpenAPI with embedded API data schemas;
- one Node.js or ASP.NET Core API with API-owned persistence;
- a Web client;
- a Windows client;
- an Android client;
- an iOS client;

Then evolve the model:

- add an optional due date;
- inspect the contract diff;
- update API, Web, Windows, Android, iOS, and persistence artifacts;
- record clarification count, repeated decisions, changed artifacts, and failure points.

Completion criterion: all targets agree on field semantics, public operations, and validation, and each public contract has one owner.

### Phase 5: Deterministic Validation — Deferred

After the Todo experiment succeeds, consider:

- `sparkwell validate`;
- project configuration, `contracts.root`, profile, and standard contract validation;
- Spark ID and realization-state provenance validation;
- operation ID, schema symbol, and artifact-path validation;
- stale-contract checks;
- contract compatibility checks.

This phase validates individual configuration and artifacts. It does not enforce execution order or add cross-profile orchestration.

## 14. Acceptance Criteria

- `domain-model` replaces `data-model` without undefined overlapping semantics.
- `service` has stable capability identities and a lightweight standardized capabilities table.
- Domain Model field tables are authoritative; no duplicate Domain Contract is generated.
- Service Contracts embed the API projections required by their boundaries.
- UI Sparks reference stable Spark IDs rather than contract artifacts.
- UI Sparks can request standard model service behavior or explicit Service Spark behavior.
- Model-derived and explicit services can coexist.
- Domain Models generate a model-derived Service Contract only when `service-exposure.standard-operations` is present and non-empty.
- One project-level `contracts.root` is shared by contract-producing and contract-consuming targets.
- Profiles do not list individual Sparks, operations, schemas, or contract files.
- Realization scope comes from implementation requests rather than profiles.
- Standard contracts contain no SparkWell-specific provenance extensions in the first version.
- Realization state maps each contract artifact to every source Spark.
- No Contract Set Manifest, custom Contract ID registry, or symbol registry is generated.
- Web, Windows, mobile, and API Service use the same Service Contract.
- API Service implements the selected OpenAPI operations without deriving a competing public interface.
- Every Service Contract is resolved through an Effective Service Definition.
- Effective Service Definitions are never persisted as Sparks or realization-state artifacts.
- Conflicting default and explicit semantics for the same consumer operation are reported.
- Service Sparks do not duplicate Domain Model fields and invariants.
- Runtime targets own their persistence access and provider-specific artifacts.
- Independently managed persistence remains blocked until an explicit contract defines the boundary.
- Runtime targets read contracts generated earlier by the user; they do not run the Contract target automatically.
- Missing or ambiguous contracts are reported rather than reconstructed independently.
- Realization state traces contracts and generated artifacts to their source Sparks.
- Breaking contract changes are reported.
- The Todo experiment covers initial generation and at least one model evolution.

## 15. Open Questions

1. What practical evidence would justify supporting more than one project contract root?
2. When should an established project override the default contract layout and filename convention?
3. What contract should define an independently managed persistence boundary if practical evidence requires one?
4. How strict should the Domain Model field-type vocabulary become, and when is a validator worthwhile?
5. Should compatibility policy live in the Service Spark, the profile, or be split between product and technical concerns?
6. Will file-level realization provenance remain sufficient for large contracts containing many Domain Models?
7. When should a contract be imported from an external system rather than generated by SparkWell?

Resolve these questions through the Todo vertical experiment and real-project feedback rather than abstract design alone.