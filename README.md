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

SparkWell lets people review detailed software intent and concept boundaries before implementation is generated.

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

A Spark is not a compressed request or a file-generation template. It narrows conceptual scope, not detail. Through discussion and clarification, a Spark can contain more precise design information than the request that led to it. Depending on the concept, it can describe:

- purpose and responsibilities;
- observable behavior and states;
- validation, invariants, and failure behavior;
- boundaries and ownership;
- interactions with other Sparks;
- lifecycle, persistence, and concurrency expectations;
- enduring platform-specific intent.

Sparks can exist at different levels of abstraction. A Spark might represent an application, feature, workflow, service, data model, UI component, function, or another concept that is meaningful to understand and evolve independently. Larger concepts can compose smaller ones without forcing the implementation into the same structure.

Each Spark is stored as a **Spark Document** with two complementary parts:

- concise frontmatter for stable identity and relationships;
- a natural-language body for detailed behavior, responsibilities, constraints, interactions, and boundaries.

The Spark Document is the durable design contract for that concept. It evolves when the software intent changes, not every time code is refactored, dependencies are upgraded, or implementation structure moves.

Ordinary engineering choices remain free unless they are themselves part of the software intent. A Spark does not prescribe a language, framework, class, file, or test structure by default. It may be realized by source code, tests, documentation, diagrams, and platform-specific implementations, while one artifact may realize several Sparks.

This separation allows implementations to evolve while the concept's identity and intent remain recognizable across technologies and over time.

## How SparkWell Works

SparkWell does not turn a request into code in one uninterrupted step. It introduces an explicit review boundary between software design and artifact generation.

First, humans and AI use `design-sparks` to clarify the requested change and express it as detailed Spark Documents. The workflow then stops. Reviewers can edit the proposed Sparks to close omissions, clarify states and failure behavior, resolve ownership, and ensure later work can proceed without inventing product decisions.

After review, specialized workflows realize the same Sparks independently:

| Workflow | Responsibility | Does not own |
|----------|----------------|--------------|
| `implement-sparks` | Creates or updates runtime artifacts while preserving established architecture and normal engineering quality | Spark design or test authoring |
| `test-sparks` | Derives behavioral scenarios, creates or updates test artifacts, and reports verified and unverified intent | Spark design or production runtime changes |

Implementation and testing are separate realization paths rather than one automatic pipeline. A team can implement a Spark for multiple targets, add tests at a different time, or evolve either artifact set without forcing the Spark Documents to mirror the code or test structure.

When implementation or testing reveals missing or contradictory intent, the workflow returns to Spark design and human review. It does not hide the gap by inventing product behavior in code or weakening a test.

## Quick Start

SparkWell requires Node.js 20 or later and has no runtime package dependencies.

```sh
git clone https://github.com/junvwang/SparkWell.git
cd SparkWell
npm link

cd ../MyProject
sparkwell init
```

Then ask your coding agent to design Sparks for a change. Review and edit the proposal before invoking the implementation and testing workflows as needed.

GitHub Copilot is the default adapter. SparkWell also supports Claude Code, `AGENTS.md`-compatible agents, multi-agent projects, and an agent-neutral initialization mode.

See the **[detailed usage guide](docs/usage.md)** for installation, adapters, configuration, toggling, safety behavior, and the complete CLI reference.

## Project Structure

| Path | Purpose |
|------|---------|
| [`core/`](core/) | Canonical SparkWell instructions and project contracts |
| [`skills/`](skills/) | Agent-neutral design, implementation, testing, and management workflows |
| [`adapters/`](adapters/) | Declarative mappings to coding-agent instruction and skill locations |
| [`scripts/`](scripts/) | Dependency-free CLI and initialization engine |
| [`docs/usage.md`](docs/usage.md) | Detailed installation and usage reference |
| [`test/`](test/) | CLI, projection, migration, safety, and methodology integrity tests |

## Current Status

SparkWell is in early development. The core Spark specification, design and implementation workflows, separate testing workflow, realization provenance, multi-agent adapters, and reversible agent integration are available today.

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
