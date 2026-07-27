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

Installation makes pack guidance available under `.sparkwell/packs/`; a profile activates a pack only when its `packs` map contains that pack ID.

Create only the agent-neutral SparkWell Core files:

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
    ├── spark-impl/
    ├── spark-test/
    └── visualize-sparks/
```

Design, implementation, and testing are user-invoked, separate workflows. Visualization is currently a disabled placeholder. Profiles and guidance are project-owned files rather than a separate SparkWell workflow.

Initialization does not generate product Sparks, source code, framework projects, implementation profiles, or tests.

## Explicit Activation

SparkWell is inactive by default. Ordinary questions, implementation, debugging, refactoring, testing, and documentation use the coding agent's normal workflow and do not create or update Spark Documents.

Activate one workflow for the current request by invoking its slash command:

| Command | Purpose |
|---|---|
| `/spark-design` | Propose a Spark map, then generate documents only after finalization |
| `/spark-impl` | Realize Sparks for one target or profile |
| `/spark-test` | Create, update, or execute tests derived from Sparks |

Changing software intent does not activate SparkWell automatically. Each command activates only its named workflow and does not invoke the next phase. For a pending Spark Proposal, use the host's decision UI when available; otherwise reply directly with `Revise:`, `Finalize`, or `Cancel`. When a workflow identifies any other handoff, invoke the named slash command in a new request.

Detailed executable rules live in the Agent Skills:

- [`/spark-design`](../skills/spark-design/SKILL.md)
- [`/spark-impl`](../skills/spark-impl/SKILL.md)
- [`/spark-test`](../skills/spark-test/SKILL.md)

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

SparkWell currently standardizes three kinds:

| Kind | Represents |
|---|---|
| `domain-model` | Durable domain data semantics, invariants, lifecycle, and relationships |
| `service` | Explicit capabilities offered across a conceptual boundary |
| `ui-component` | A modular user-interface interaction and composition boundary |

Project-defined kinds require explicit semantics, document rules, design rules, and target applicability. For authoritative details, see the [Spark Specification](../core/project/.sparkwell/specification.md), project-owned [Spark Document Conventions](../core/project/.sparkwell/conventions.md), [granularity guide](../skills/spark-design/references/granularity.md), and [worked examples](../skills/spark-design/references/examples.md).

### 2. Configure an implementation

Initialization creates `.sparkwell/guidance/` and a valid empty profile map with a copyable commented example in `.sparkwell/config.yaml`. Copy that example and replace `profiles: {}` when adding an implementation:

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

Profiles and guidance are project-owned inputs. Maintain them manually or with ordinary coding-agent assistance and improve guidance as the project evolves. Profile YAML is limited to target routing, pack-owned machine configuration, and guidance references. Guidance describes project architecture such as framework choice, module boundaries, state ownership, data flow, model mappings, persistence patterns, and artifact ownership.

Native project files remain authoritative for dependencies, versions, commands, formatting, linting, build configuration, and actual existing structure. Packs, guidance, and native architecture must agree. A missing selected pack, missing referenced guidance, unresolved consequential architecture, or conflict makes `/spark-impl` **Blocked**.

Resolution order is: Spark intent, profile routing and pack configuration, profile guidance, selected packs, established native architecture, then optional target defaults. This order never silently resolves contradictions. Update the project-owned profile or guidance before retrying `/spark-impl` when a consequential decision is missing or changes.

### 3. Use optional implementation packs

SparkWell Core does not select a framework, protocol, contract format, persistence provider, or generator. Packs provide reusable technology behavior while profiles decide where and how it applies.

Install the bundled OpenAPI pack:

```sh
sparkwell init --pack openapi
```

Then edit `.sparkwell/config.yaml` to activate the Pack in the participating profiles:

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

`spark-test` derives applicable scenarios from Sparks, reuses existing test conventions, updates test provenance, and classifies failures as runtime, test, intent, or environment defects.

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