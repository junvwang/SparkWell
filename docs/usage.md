# SparkWell Usage

This guide covers installation, initialization, coding-agent adapters, implementation profiles, workflow usage, safety behavior, and CLI development.

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
    ├── design-sparks/
    ├── implement-sparks/
    ├── test-sparks/
    └── visualize-sparks/
```

Design, implementation, and testing are active, separate workflows. Visualization is currently a disabled placeholder.

Initialization does not generate product Sparks, source code, framework projects, implementation profiles, or tests.

## Working With Sparks

### 1. Design

Ask the coding agent to design Sparks for the requested software change. For example:

```text
Design Sparks for a todo list where people can add todos and mark them complete.
```

The agent uses `design-sparks` to extract requested outcomes, identify meaningful concepts, create or evolve Spark Documents, and present them for human review.

Review the proposal for behavioral completeness, states, failure behavior, validation, ownership, interactions, lifecycle, persistence, and applicable platform intent. Edit the Spark Documents directly when needed.

The workflow stops at this checkpoint. Implementation-critical information must be durable in the reviewed Sparks rather than existing only in chat.

Bundled SparkWell workflows support exactly these standardized kinds:

- `domain-model`
- `service`
- `ui-component`

A project-defined kind requires guidance for its concept semantics, document rules, design rules, and target applicability. When that guidance is incomplete, the agent stops for clarification.

#### UI Component Sparks

Use `kind: ui-component` for a modular user-interface concept with an identifiable purpose and boundary. Describe its information flow, user interactions, state, behavior, constraints, composition, and accessibility intent when those topics are material. A root UI Component owns the overall interface and may be realized by an application shell, window, page, route, or equivalent target entry surface.

A parent UI Component uses `composes` for child UI Components it owns. Information flows from parent to child, while children report user intent or outcomes to the parent. The parent owns child presence, supplied information, handling of reported intent, and cross-child coordination. The child owns its internal presentation and local state.

Do not create UI Component Sparks for every button, input, layout container, framework component, hook, view model, or rendered node. Create a child Spark when modularity is intended and its purpose, behavior, state, interactions, or constraints form an independently reviewable boundary.

For example:

```text
todo-app-ui
├── todo-entry
└── todo-list
  └── todo-item-row
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

Use stable logical field identifiers and domain types rather than language, transport, ORM, or database types. Put cross-field rules under `## Invariants`, describe material model relationships through `composes` or `uses`, and use optional `service-exposure` frontmatter only when automatic standard service operations are explicitly intended.

To enable a model-derived standard service, add the allowed operations after `uses`:

```yaml
service-exposure:
  standard-operations:
    - create
    - get
    - list
    - update
    - delete
```

Omit `service-exposure` to generate no model-derived service. The list must be non-empty and is the exact set of automatically derived operations. Omission does not prevent an explicit Service Spark from using the model unless the Domain Model body states that it must not cross any public service boundary.

The projected `.sparkwell/specification.md` defines Domain Model semantics. `.sparkwell/conventions.md` defines the exact field-table, type, relationship, and service-exposure representation.

#### Service Sparks

Use `kind: service` for independently meaningful capabilities across a conceptual boundary, such as cross-model coordination, specialized queries, authorization, batching, orchestration, or distinct failure behavior. Do not create Service Sparks mechanically for controllers, endpoints, framework service classes, generated clients, or automatic standard CRUD.

Each Service Spark uses a lightweight capabilities table:

```markdown
## Capabilities

| Capability | Purpose | Inputs | Output | Failure Behavior |
|---|---|---|---|---|
| `complete-all` | Mark every active Todo Item complete | None | Number of `todo-item` models changed | Fails without partial completion if the operation cannot complete |
```

Capability IDs are stable lowercase kebab-case identities. Reference independently owned models and concepts through `uses`, keep inputs and outputs at the concept level, and describe only observable service failure behavior. Transport routes, HTTP verbs, status codes, DTOs, and framework types remain engineering-artifact choices unless they are enduring compatibility requirements.

The projected `.sparkwell/specification.md` defines Service semantics. `.sparkwell/conventions.md` defines the exact capabilities-table representation.

### 2. Configure an implementation

Initialization creates shared contract settings and an empty profile map in `.sparkwell/config.yaml`:

```yaml
schema-version: 1

contracts:
  root: src/contracts
  service-format: openapi-3.1

implementations:
  profiles: {}
```

Add one profile per concrete runtime implementation:

```yaml
schema-version: 1

contracts:
  root: src/contracts
  service-format: openapi-3.1

implementations:
  profiles:
    web-react:
      target: web
      source-root: src/web-react
      constraints:
        framework: react
      preferences:
        language: typescript

    todo-api:
      target: api-service
      source-root: src/todo-api
      constraints:
        runtime: dotnet
        framework: aspnet-core
        persistence:
          provider: sqlite
```

Native project files remain authoritative for dependencies, versions, commands, formatting, linting, and build configuration.

The Contract target writes to `contracts.root`, and runtime targets read contracts from that same project-wide folder. Each runtime profile's `source-root` remains the output root for its own artifacts.

### 3. Generate Service Contracts

After reviewing the relevant Sparks, invoke `implement-sparks` for the Contract target:

```text
Implement todo-item and todo-management for the contract target.
```

The initial bundled Contract target generates OpenAPI 3.1 Service Contracts:

- A Domain Model Spark generates a model-derived contract only when it contains a non-empty `service-exposure.standard-operations` list.
- A Service Spark in the requested candidate scope always generates a contract containing its capability rows.

Default paths beneath `contracts.root` are:

```text
src/contracts/
└── service/
    ├── <domain-model-spark-id>.openapi.yaml
    └── <service-spark-id>.openapi.yaml
```

The Contract target records each file in `.sparkwell/state/realizations/contract.yaml`. Runtime targets inspect `contracts.root`, conventional paths, and realization manifests whose artifact paths are under that folder. Contract generation does not create server, client, UI, storage, or test code.

Run the Contract target before profiles that consume or implement its contracts. SparkWell does not automate this ordering.

### 4. Implement

After review, ask the agent to implement selected Sparks for a profile:

```text
Implement todo-list for the web-react profile.
```

To implement the server side of generated Service Contracts:

```text
Implement todo-item and todo-management for the todo-api profile.
```

The API Service target implements matching OpenAPI operations, maps their boundary schemas to internal domain representations, and owns its configured persistence access and provider-specific artifacts. It does not generate a competing interface or modify public contract files.

`implement-sparks` creates or updates artifacts for the selected target, maintains realization provenance, runs applicable checks, and may run relevant existing tests as regression evidence.

It does not create or modify tests, test-only dependencies, test projects, or test infrastructure.

### 5. Test

Invoke the separate testing workflow when test authoring or broader behavioral verification is desired:

```text
Create tests for todo-list using the web-react profile.
```

`test-sparks` derives applicable scenarios from reviewed Sparks, reuses existing test conventions, updates test provenance, and classifies failures as runtime, test, intent, or environment defects.

Adding a new test framework, dependency, project, browser harness, emulator, or other consequential infrastructure requires confirmation unless explicitly requested.

## Bypass SparkWell for a Task

To handle a specific task without the SparkWell workflow, tell the coding agent explicitly. For example:

```text
For this task, do not use the SparkWell workflow and do not create or update Spark Documents. Work directly on the engineering artifacts.
```

This instruction applies to the requested task and does not change project files or persist an activation state.

## Safety and Reinitialization

Initialization is preflighted before writing files.

- Existing unrelated project files are never changed.
- Matching SparkWell files are left unchanged.
- Customized `.sparkwell/config.yaml` is preserved on normal reinitialization.
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
scripts/                     CLI executable and initialization logic
skills/                      Agent-neutral SparkWell workflows
test/                        CLI, safety, projection, and integrity tests
```

See [the adapter guide](../adapters/README.md) to add another coding agent. Native IDE extensions and agent plugins may provide richer installation experiences, but they should consume the same initializer, manifests, and shared skills rather than fork the workflow.