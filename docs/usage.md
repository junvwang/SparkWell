# SparkWell Usage

This guide covers installation, initialization, coding-agent adapters, implementation profiles, workflow usage, safety behavior, and CLI development.

See [Optional Implementation Packs](implementation-packs.md) for the extension contract, OpenAPI profile model, and migration from the former Core Contract configuration.

## Requirements

- Node.js 20 or later

The CLI has no runtime package dependencies.

## Install From This Repository

```sh
git clone https://github.com/junvwang/SparkWell.git
cd SparkWell
npm link
sparkwell --version
```

During toolkit development, run the CLI directly:

```sh
node scripts/sparkwell.js --help
```

## Initialize a Project

Initialize the current directory with the default GitHub Copilot integration:

```sh
sparkwell init
```

Initialize another directory:

```sh
sparkwell init ../MyProject
```

Install an optional implementation pack by repeating `--pack` as needed:

```sh
sparkwell init ../MyProject --pack openapi
```

Installation makes pack guidance available under `.sparkwell/packs/`; only profiles that list a pack activate it.

Create only the agent-neutral SparkWell contract:

```sh
sparkwell init ../MyProject --agent none
```

### Coding-agent adapters

| Adapter | Alias | Project instructions | Shared skills destination |
|---------|-------|----------------------|---------------------------|
| `github-copilot` | `copilot` | `.github/copilot-instructions.md` | `.github/skills/` |
| `claude-code` | `claude` | `CLAUDE.md` | `.claude/skills/` |
| `agents-md` | `agents`, `generic` | `AGENTS.md` | `.agents/skills/` |
| `none` | - | none | none |

Select an adapter:

```sh
sparkwell init ../MyProject --agent claude-code
sparkwell init ../MyProject --agent agents-md
```

Initialize multiple adapters by repeating `--agent`:

```sh
sparkwell init ../MyProject \
  --agent github-copilot \
  --agent claude-code
```

All adapters project the same canonical instructions and Agent Skills into their native discovery locations. SparkWell does not maintain agent-specific skill forks.

## Generated Project Structure

Every initialized project receives:

```text
.sparkwell/
├── config.yaml
├── conventions.md
├── implementation-profiles.md
├── packs/                  # only when explicitly installed
├── realization-state.md
├── specification.md
└── state/
    └── realizations/
sparks/
```

For GitHub Copilot, it also receives:

```text
.github/
├── copilot-instructions.md
└── skills/
    ├── spark-design/
    ├── spark-config/
    ├── spark-impl/
    ├── spark-test/
    └── visualize-sparks/
```

Design, implementation configuration, implementation, and testing are user-invoked, separate workflows. Visualization is currently a disabled placeholder.

Initialization does not generate product Sparks, source code, framework projects, implementation profiles, or tests.

## Explicit Activation

SparkWell is inactive by default. Ordinary questions, implementation, debugging, refactoring, testing, and documentation use the coding agent's normal workflow and do not create or update Spark Documents.

Activate one workflow for the current request by invoking its slash command:

| Command | Purpose |
|---|---|
| `/spark-design` | Propose a Spark map, then generate documents only after finalization |
| `/spark-config` | Propose and finalize one implementation profile and its architecture guidance |
| `/spark-impl` | Realize reviewed Sparks for one target or profile |
| `/spark-test` | Create, update, or execute tests derived from reviewed Sparks |

Changing software intent does not activate SparkWell automatically. Each command activates only its named workflow and does not invoke the next phase. For a pending Spark or Implementation Configuration Proposal, use the host's decision UI when available; otherwise reply directly with `Revise:`, `Finalize`, or `Cancel`. When a workflow identifies any other handoff, invoke the named slash command in a new request.

## Working With Sparks

### 1. Design

Invoke the design workflow explicitly:

```text
/spark-design Design a todo list where people can add todos and mark them complete.
```

The `/spark-design` workflow extracts requested outcomes and identifies meaningful concepts, but it does not modify files immediately. It first presents a Spark Proposal in chat.

The proposal is intentionally brief:

- new Sparks list only ID, kind, and one-sentence `summary`;
- existing Sparks list only ID and the reason they need to evolve;
- renames, kind changes, and removals are listed separately;
- contextual and unchanged Sparks are omitted unless needed to explain a boundary;
- open questions appear only when they are material.

For example:

```markdown
**Spark Proposal**

Create:

| Spark | Kind | Summary |
|---|---|---|
| `todo-item-model` | `domain-model` | Represents one tracked piece of work and its completion state. |

Evolve:

| Spark | Why |
|---|---|
| `todo-app-ui` | Coordinate the proposed entry and list components. |
```

No Spark Documents, realization state, source code, tests, contracts, profiles, or proposal-state files are changed during this phase.

When the host provides a decision UI, choose:

- `Revise` to open a prompt for revision comments and receive one complete replacement proposal;
- `Finalize` to revalidate the current workspace and generate the proposed Spark Documents;
- `Cancel` to stop without modifying files.

If no suitable UI is available, respond to the latest proposal with:

- `Revise: <comments>` to receive one complete replacement proposal;
- `Finalize` to revalidate the current workspace and generate the proposed Spark Documents;
- `Cancel` to stop without modifying files.

The controls may also be invoked explicitly as `/spark-design Revise: ...`, `/spark-design Finalize`, and `/spark-design Cancel`. Dismissing the UI or giving ambiguous approval such as `looks good` does not finalize the proposal.

If affected Sparks or proposed paths changed before finalization, the workflow presents a revised proposal instead of writing stale changes.

Review the proposal for the correct concept set, granularity, and ownership. After finalization, review the generated Spark Documents for complete requested outcomes, material product decisions, and freedom for ordinary engineering choices.

The workflow stops at both checkpoints. Implementation-critical information must be durable in the finalized Sparks rather than existing only in chat.

Keep each body to the minimum sufficient intent. Include a statement when deleting it would force a reviewer or implementer to guess material behavior, ownership, an invariant, a constraint, or a relationship. State each decision once in its owning Spark and reference related Sparks instead of repeating their behavior. Omit repeated summaries, generic quality expectations, implementation-freedom disclaimers, exhaustive negative boundaries, and empty sections.

Bundled SparkWell workflows support exactly these standardized kinds:

- `domain-model`
- `service`
- `ui-component`

A project-defined kind requires guidance for its concept semantics, document rules, design rules, and target applicability. When that guidance is incomplete, the agent stops for clarification.

Spark IDs may use these suggested suffixes when they improve readability:

| Kind | Suggested suffix | Example |
|---|---|---|
| `domain-model` | `-model` | `todo-item-model` |
| `service` | `-service` | `todo-management-service` |
| `ui-component` | `-ui` | `todo-entry-ui` |

Suffixes can make `composes`, `uses`, and realization provenance readable without opening every referenced document. They are optional naming hints: the `kind` field is authoritative, workflows do not infer behavior or applicability from suffixes, and human-readable names omit mechanical suffix wording.

#### UI Component Sparks

Use `kind: ui-component` for a modular user-interface concept with an identifiable purpose and boundary. Describe its information flow, user interactions, state, behavior, constraints, composition, and accessibility intent when those topics are material. A root UI Component owns the overall interface and may be realized by an application shell, window, page, route, or equivalent target entry surface.

A parent UI Component uses `composes` for child UI Components it owns. Information flows from parent to child, while children report user intent or outcomes to the parent. The parent owns child presence, supplied information, handling of reported intent, and cross-child coordination. The child owns its internal presentation and local state.

Do not create UI Component Sparks for every button, input, layout container, framework component, hook, view model, or rendered node. Create a child Spark when modularity is intended and its purpose, behavior, state, interactions, or constraints form an independently reviewable boundary.

For example:

```text
todo-app-ui
├── todo-entry-ui
└── todo-list-ui
  └── todo-item-ui
```

Web may realize these as framework components; Windows may use a root window plus user controls, views, or templates. Android and iOS use their established native component boundaries. The exact files, classes, props, events, commands, and bindings remain engineering choices. Every composed child must nevertheless retain an identifiable runtime component boundary, and one Spark does not imply exactly one source file.

#### Domain Model Sparks

Use `kind: domain-model` for an independently meaningful domain concept that owns durable field semantics, invariants, relationships, lifecycle, or model-level behavior. Do not create Domain Model Sparks mechanically for DTOs, API payloads, ORM entities, database rows, or target-language classes.

Each Domain Model uses a technology-independent `## Data` table:

```markdown
## Data

| Field | Meaning | Type | Required | Default | Constraints | Mutability |
|---|---|---|---|---|---|---|
| `id` | Stable identity of the Todo Item | identifier | Yes | Generated | Unique and non-empty | Immutable |
| `title` | Work the person wants to remember | string | Yes | None | Trimmed; 1-200 characters | Mutable |
| `completed` | Whether the work is complete | boolean | Yes | `false` | None | Mutable |
```

Use stable logical field identifiers and domain types rather than language, transport, ORM, or database types. Put cross-field rules under `## Invariants` and describe material model relationships through `composes` or `uses`. A Domain Model does not automatically publish operations. If it must not cross any Service boundary, state that product restriction in its body.

The projected `.sparkwell/specification.md` defines Domain Model semantics. `.sparkwell/conventions.md` defines the exact field-table, type, and relationship representation.

#### Service Sparks

Use `kind: service` for independently meaningful capabilities across a conceptual boundary. Public create, retrieve, update, and delete behavior is explicit Service intent just like specialized queries, authorization, batching, orchestration, or distinct failures. Do not create Service Sparks mechanically for controllers, endpoints, framework classes, or generated clients.

Each Service Spark uses a lightweight capabilities table:

```markdown
## Capabilities

| Capability | Purpose | Inputs | Output | Failure Behavior |
|---|---|---|---|---|
| `complete-all` | Mark every active Todo Item complete | None | Number of `todo-item-model` models changed | Fails without partial completion if the operation cannot complete |
```

Capability IDs are stable lowercase kebab-case identities. Reference independently owned models and concepts through `uses`, keep inputs and outputs at the concept level, and describe only observable service failure behavior. Transport routes, HTTP verbs, status codes, DTOs, and framework types remain engineering-artifact choices unless they are enduring compatibility requirements.

The projected `.sparkwell/specification.md` defines Service semantics. `.sparkwell/conventions.md` defines the exact capabilities-table representation.

### 2. Configure an implementation

Initialization creates an empty profile map in `.sparkwell/config.yaml`:

```yaml
schema-version: 1

implementations:
  profiles: {}
```

Before a new runtime realization, invoke the configuration workflow:

```text
/spark-config Configure a React Web implementation in src/web.
```

It inspects existing profiles, guidance, and native artifacts, then presents an Implementation Configuration Proposal in chat. For an established implementation it proposes codifying the detected architecture without redesigning it. For a new implementation it asks about consequential choices rather than selecting them automatically.

Choose `Revise`, `Finalize`, or `Cancel` in the host decision UI when available; choosing `Revise` opens a prompt for comments. Otherwise, reply `Revise: <comments>`, `Finalize`, or `Cancel`. Before `Finalize`, no profile, guidance, source, dependency, Spark, test, or realization file changes. Finalization may update only `.sparkwell/config.yaml` and the proposed guidance documents, then stops for review without generating product code.

A finalized profile may look like:

```yaml
schema-version: 1

implementations:
  profiles:
    web-react:
      target: web
      source-root: src/web
      packs: {}
      guidance:
        - .sparkwell/guidance/web-react.md

```

Profile YAML is intentionally limited to target routing, pack-owned machine configuration, and guidance references. `guidance` describes project architecture such as framework choice, module boundaries, state ownership, data flow, model mappings, persistence patterns, and artifact ownership. The recommended path is `.sparkwell/guidance/<profile-id>.md`.

Native project files remain authoritative for dependencies, versions, commands, formatting, linting, build configuration, and actual existing structure. Packs, guidance, and native architecture must agree. A missing selected pack, missing referenced guidance, unresolved consequential architecture, or conflict makes `/spark-impl` **Blocked**.

Resolution order is: reviewed Spark intent, profile routing and pack configuration, profile guidance, selected packs, established native architecture, then optional target defaults. This order never silently resolves contradictions. Consequential project changes require `/spark-config` rather than a task-local override.

### 3. Use optional implementation packs

SparkWell Core does not select a framework, protocol, contract format, persistence provider, or generator. Packs provide reusable technology behavior while profiles decide where and how it applies.

Install the bundled OpenAPI pack:

```sh
sparkwell init --pack openapi
```

Then use `/spark-config` to create profiles like these:

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

Installation alone does not activate OpenAPI. Each participating profile has an `openapi` key in its `packs` map, and consumers identify the producer through `packs.openapi.contract-profile`. Runtime, framework, architecture, and persistence choices belong in `todo-api.md` or the established native project.

#### OpenAPI example

After reviewing an explicit Service Spark, invoke `/spark-impl` for the producer profile:

```text
/spark-impl Implement todo-management-service using the public-api-contract profile.
```

The optional pack generates one OpenAPI 3.1 contract from each selected Service Spark. Domain Models used by Service capabilities provide schema context but never publish operations automatically.

The producer profile's `source-root` owns its artifacts:

```text
src/contracts/
└── service/
  └── <service-spark-id>.openapi.yaml
```

The producer records files in `.sparkwell/state/realizations/public-api-contract.yaml`. Consumers resolve that profile, its source root, and its realization state. Contract production does not create server, client, UI, storage, or test code.

Run the producer before profiles that consume or implement its contracts. SparkWell does not automate this ordering.

### 4. Implement

After review, invoke `/spark-impl` for a profile:

```text
/spark-impl Implement todo-app-ui for the web-react profile.
```

To implement the server side of the selected OpenAPI contracts:

```text
/spark-impl Implement todo-management-service using the todo-api profile.
```

The selected OpenAPI pack implements matching operations, maps boundary schemas to internal representations, and follows the API profile's architecture and persistence choices. It does not generate a competing interface or modify producer-owned files.

`spark-impl` creates or updates artifacts for the selected target, maintains realization provenance, runs applicable checks, and may run relevant existing tests as regression evidence.

It does not create or modify tests, test-only dependencies, test projects, or test infrastructure.

### 5. Test

Invoke `/spark-test` when test authoring or broader behavioral verification is desired:

```text
/spark-test Create tests for todo-app-ui using the web-react profile.
```

`spark-test` derives applicable scenarios from reviewed Sparks, reuses existing test conventions, updates test provenance, and classifies failures as runtime, test, intent, or environment defects.

Adding a new test framework, dependency, project, browser harness, emulator, or other consequential infrastructure requires confirmation unless explicitly requested.

## Safety and Reinitialization

Initialization is preflighted before writing files.

- Existing unrelated project files are never changed.
- Matching SparkWell files are left unchanged.
- Customized `.sparkwell/config.yaml` and project-owned `.sparkwell/conventions.md` are preserved on normal reinitialization.
- Existing instruction files are preserved outside this managed section:

  ```markdown
  <!-- sparkwell:start -->
  ...SparkWell project instructions...
  <!-- sparkwell:end -->
  ```

- Reinitialization updates one valid managed section in place.
- A legacy file containing only unmarked SparkWell instructions is migrated without duplication.
- Malformed or duplicate markers stop the operation before any write.
- Modified SparkWell-managed files cause a conflict rather than being silently replaced.
- `--force` replaces conflicting SparkWell-managed content but never unrelated project files.
- `--dry-run` reports planned changes without writing them.

Always inspect a `--dry-run` before using `--force`.

## CLI Reference

```text
sparkwell init [directory] [options]

--agent <name>  Coding-agent integration; repeat for multiple agents
--pack <id>      Optional implementation pack; repeat for multiple packs
--dry-run       Show planned changes without writing files
--force         Overwrite conflicting SparkWell-managed files
--help, -h      Show help
--version, -v   Show the CLI version
```

## Toolkit Development

```sh
npm run check
npm test
npm pack --dry-run
```

The toolkit source is organized as:

```text
adapters/                    Declarative coding-agent mappings
core/
├── instructions/            Canonical agent-neutral instructions
└── project/                 Files projected into every initialized project
packs/                       Optional reusable implementation guidance
scripts/                     CLI executable and initialization logic
skills/                      Agent-neutral SparkWell workflows
test/                        CLI, safety, projection, and integrity tests
```

See [the adapter guide](../adapters/README.md) to add another coding agent. Native IDE extensions and agent plugins may provide richer installation experiences, but they should consume the same initializer, manifests, and shared skills rather than fork the workflow.