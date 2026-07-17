# SparkWell Usage

This guide covers installation, initialization, coding-agent adapters, implementation profiles, workflow usage, toggling, safety behavior, and CLI development.

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

Enable multiple adapters by repeating `--agent`:

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
    ├── manage-sparkwell/
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

### 2. Configure an implementation

Initialization creates an empty profile map in `.sparkwell/config.yaml`:

```yaml
schema-version: 1

implementations:
  profiles: {}
```

Add one profile per concrete implementation:

```yaml
schema-version: 1

implementations:
  profiles:
    web-react:
      target: web
      source-root: src/web-react
      constraints:
        framework: react
      preferences:
        language: typescript
```

Native project files remain authoritative for dependencies, versions, commands, formatting, linting, and build configuration.

### 3. Implement

After review, ask the agent to implement selected Sparks for a profile:

```text
Implement todo-list for the web-react profile.
```

`implement-sparks` creates or updates runtime artifacts, maintains realization provenance, runs build and static checks, performs a bounded runtime smoke check when available, and may run relevant existing tests as regression evidence.

It does not create or modify tests, test-only dependencies, test projects, or test infrastructure.

### 4. Test

Invoke the separate testing workflow when test authoring or broader behavioral verification is desired:

```text
Create tests for todo-list using the web-react profile.
```

`test-sparks` derives applicable scenarios from reviewed Sparks, reuses existing test conventions, updates test provenance, and classifies failures as runtime, test, intent, or environment defects.

Adding a new test framework, dependency, project, browser harness, emulator, or other consequential infrastructure requires confirmation unless explicitly requested.

## Enable or Disable Agent Integration

Disabling an adapter removes its SparkWell instruction block and methodology skills while preserving:

- `.sparkwell/` contracts and configuration;
- every Spark Document;
- realization state;
- project-authored instruction content;
- unrelated skills and files;
- the narrow `manage-sparkwell` control skill.

Disable or restore the default adapter:

```sh
sparkwell disable
sparkwell enable
```

Toggle selected adapters:

```sh
sparkwell disable --agent github-copilot
sparkwell enable --agent github-copilot

sparkwell disable \
  --agent github-copilot \
  --agent claude-code
```

Preview first:

```sh
sparkwell disable --dry-run
sparkwell enable --dry-run
```

If the control skill is missing in an older project, `disable` installs it while removing the active methodology. Existing customized control-skill content is preserved.

## Safety and Reinitialization

Initialization, enable, and disable operations are preflighted before writing files.

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
sparkwell enable [directory] [options]
sparkwell disable [directory] [options]

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