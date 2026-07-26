# SparkWell

> [!IMPORTANT]
> SparkWell is at a very early stage. Its methodology and tooling are under active development, and its underlying ideas have not yet been thoroughly validated through broad practical use. Expect significant changes. You are welcome to try it and share feedback, use cases, and challenges through [GitHub issues](https://github.com/junvwang/SparkWell/issues).

> **Build and evolve software through shared, durable intent.**

SparkWell gives humans and AI a durable, reviewable representation of software intent for building and evolving software together.

## Why SparkWell?

Software engineering is not only about generating code. It is also about understanding, reviewing, evolving, and maintaining software over time.

Coding agents make implementation dramatically faster, but speed creates a new imbalance: our ability to generate software can outpace our ability to understand it. Important decisions disappear into temporary conversations, implementation grows faster than people can review it, and future contributors must reconstruct intent from code and fragmented documentation.

## The Problems SparkWell Addresses

### Context Loss

AI conversations are temporary. Design discussions, clarifications, and decisions can disappear when a session ends, forcing future humans and agents to reconstruct the same understanding.

SparkWell captures implementation-critical intent in persistent project artifacts rather than relying on conversation history.

### Review at AI Scale

AI can generate implementation faster than humans can review it line by line. As systems grow, implementation alone becomes an increasingly expensive review surface.

SparkWell lets people review software intent and concept boundaries before implementation is generated.

### Intent Loss

Implementation records how software currently works, but often loses why responsibilities, constraints, interactions, and boundaries exist.

Sparks preserve that design intent as the system evolves across refactors, frameworks, platforms, and rewrites.

### Beyond Black-box Development

Modern AI workflows can increasingly treat implementation as a black box.

People describe desired outcomes.

AI generates implementation.

When evaluation focuses only on observable correctness, large portions of the generated implementation may never be deeply understood.

This raises several fundamental questions:

- Is implementation alone a sufficient artifact for understanding a software system?
- What should people review when implementation becomes too large to examine in detail?
- What should AI understand before generating or changing implementation?
- Can humans and AI collaborate through something more durable than implementation alone?

SparkWell answers these questions by making software intent a first-class artifact alongside implementation.

## What Is a Spark?

SparkWell introduces a **Spark** as an additional software engineering artifact between **Requirements** and **Engineering Artifacts**. A Spark captures the shared software intent of one meaningful concept for humans and AI to understand, clarify, and review together.

```text
               Requirements
                     │
                     ▼
            Human + AI Collaboration
                     │
                     ▼
                   Spark
          (Shared Software Intent)
                     │
          Human + AI Collaboration
                     │
                     ▼
          Engineering Artifacts
              ├── Source Code
              ├── Tests
              ├── Documentation
              ├── Diagrams
              └── Platform-specific Implementations
```

A Spark is neither a compressed request nor an exhaustive design dossier. It captures the minimum sufficient intent for one concept: the decisions whose absence would force a reviewer or implementer to guess material behavior, ownership, invariants, constraints, or relationships. Each decision belongs in one authoritative Spark; related Sparks reference that owner instead of repeating it.

Sparks can exist at different levels of abstraction. Bundled SparkWell workflows currently support three standardized kinds: Domain Models, Services, and modular UI Components. Projects may define another kind only by supplying its semantics, document rules, design rules, and target applicability.

Spark IDs may use `-model`, `-service`, or `-ui` as readability hints. These suffixes are optional; the `kind` field remains authoritative and workflows do not depend on suffixes. Human-readable names remain natural.

`domain-model` represents independently meaningful domain concepts with durable field semantics, invariants, lifecycle, and relationships. `service` represents independently meaningful capabilities, concept-level inputs and outputs, and failure behavior across a boundary. `ui-component` represents a modular interface boundary with user-facing behavior, state, interactions, accessibility intent, and optional child composition. A root UI Component may realize the application shell, window, page, route, or another platform entry surface.

Each Spark is stored as a **Spark Document** with two complementary parts:

- concise frontmatter for stable identity and relationships;
- a concise natural-language body for the concept's owned intent.

The Spark Document is the durable design contract for that concept. It evolves when the software intent changes, not every time code is refactored, dependencies are upgraded, or implementation structure moves.

Ordinary engineering choices remain free unless they are themselves part of the software intent. A Spark does not prescribe a language, framework, class, file, or test structure by default. It may be realized by source code, tests, documentation, diagrams, and platform-specific implementations, while one artifact may realize several Sparks.

This separation allows implementations to evolve while the concept's identity and intent remain recognizable across technologies and over time.

## How SparkWell Works

SparkWell is opt-in. Ordinary questions, coding, debugging, refactoring, and testing use the coding agent's normal workflow and do not create or update Sparks.

Invoke `/spark-design` to clarify a requested change. It first presents a concise Spark Proposal in chat, listing the Sparks to create and their summaries plus existing Sparks to evolve and why. It does not modify files before confirmation.

Reply `Revise: <comments>` to receive a complete replacement proposal, `Finalize` to generate the proposed Spark Documents, or `Cancel` to stop without changes. Finalized documents then receive a second human review before any implementation workflow begins.

After review, invoke later workflows independently:

| Workflow | Responsibility | Does not own |
|----------|----------------|--------------|
| `/spark-config` | Creates or revises one project implementation profile and its architecture guidance | Sparks, product code, tests, or dependencies |
| `/spark-impl` | Creates or updates target engineering artifacts, including runtime and Service Contract realizations | Spark design or test authoring |
| `/spark-test` | Derives behavioral scenarios, creates or updates test artifacts, and reports verified and unverified intent | Spark design or production runtime changes |

Each slash command activates only that workflow for the current request. Direct controls for the latest Spark or Implementation Configuration Proposal are the only limited continuations; any unrelated message ends that continuation. Workflows never activate automatically or chain into one another.

SparkWell provides the shared realization process, not a universal project architecture. Before generating a new runtime implementation, use `/spark-config` to confirm its profile and project guidance. Existing implementations preserve their established architecture. `/spark-impl` follows reviewed Sparks, profile constraints, project guidance, and native architecture; it does not choose MVC, MVVM, state management, persistence, synchronization, or module structure on the project's behalf.

When implementation or testing reveals missing or contradictory intent, the workflow stops and identifies `/spark-design` as the explicit next command. It does not invoke that workflow, invent product behavior in code, or weaken a test.

## Quick Start

SparkWell requires Node.js 20 or later and has no runtime package dependencies.

```sh
git clone https://github.com/junvwang/SparkWell.git
cd SparkWell
npm link

cd ../MyProject
sparkwell init
```

Then explicitly invoke a workflow, for example:

```text
/spark-design Design a todo list where people can add todos and mark them complete.
```

Review the Spark Proposal, reply `Finalize`, then review the generated Spark Documents before separately invoking `/spark-impl` or `/spark-test` as needed.

Before the first new runtime realization, configure its architecture separately:

```text
/spark-config Configure a React Web implementation in src/web.
```

Review and finalize the configuration proposal before invoking `/spark-impl`.

GitHub Copilot is the default adapter. SparkWell also supports Claude Code, `AGENTS.md`-compatible agents, multi-agent projects, and an agent-neutral initialization mode.

See the **[detailed usage guide](docs/usage.md)** for installation, adapters, configuration, workflow usage, safety behavior, and the complete CLI reference.

## Project Structure

| Path | Purpose |
|------|---------|
| [`core/`](core/) | Canonical SparkWell instructions and project contracts |
| [`skills/`](skills/) | Agent-neutral design, configuration, implementation, testing, and visualization workflows |
| [`adapters/`](adapters/) | Declarative mappings to coding-agent instruction and skill locations |
| [`scripts/`](scripts/) | Dependency-free CLI and initialization engine |
| [`docs/usage.md`](docs/usage.md) | Detailed installation and usage reference |
| [`test/`](test/) | CLI, projection, migration, safety, and methodology integrity tests |

## Current Status

SparkWell is in early development. The core Spark specification, standardized Domain Model, Service, and UI Component kinds, project implementation guidance, OpenAPI Service Contract and API Service target guidance, explicit design/configuration/implementation/testing workflows, realization provenance, and multi-agent adapters are available today.

The methodology and tooling will continue to evolve through practical use and feedback while keeping existing project content safe and version controlled.

## Why "Spark"?

The name is inspired by the *Spark* in the Transformers universe: the enduring identity that remains even when a Transformer changes or rebuilds its body.

Software has a similar continuity. Implementations evolve. Languages and frameworks change. Systems may be rewritten. Yet the intent of a software concept - why it exists, what it owns, how it behaves, and how it relates to other concepts - should remain recognizable.

A Spark is not another implementation. It is the design identity that should survive every implementation.

## Contributing

Questions, critical feedback, documentation improvements, adapter support, workflow improvements, and code contributions are welcome through GitHub issues and pull requests.

When changing a shared skill, keep it agent-neutral and preserve compatibility across supported coding agents.

## License

SparkWell is licensed under the [MIT License](LICENSE).
