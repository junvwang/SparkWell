# SparkWell

> [!IMPORTANT]
> SparkWell is at a very early stage. Its methodology and tooling are under active development, and its underlying ideas have not yet been thoroughly validated through broad practical use. Expect significant changes. You are welcome to try it and share feedback, use cases, and challenges through [GitHub issues](https://github.com/junvwang/SparkWell/issues).

> **Build and evolve software through shared, durable intent.**

SparkWell aims to give humans and AI a durable, reviewable representation of software intent for building and evolving software together.

## Why SparkWell?

Software engineering is not only about generating code. It is also about understanding, reviewing, evolving, and maintaining software over time.

Coding agents make implementation dramatically faster, but speed creates a new imbalance: our ability to generate software can outpace our ability to understand it. Important decisions disappear into temporary conversations, implementation grows faster than people can review it, and future contributors must reconstruct intent from code and fragmented documentation.

## The Problems SparkWell Addresses

### Context Loss

AI conversations are temporary. Design discussions, clarifications, and decisions can disappear when a session ends, forcing future humans and agents to reconstruct the same understanding.

SparkWell explores how to preserve durable product and software intent in persistent project artifacts rather than relying on conversation history.

### Review at AI Scale

AI can generate implementation faster than humans can review it line by line. As systems grow, implementation alone becomes an increasingly expensive review surface.

SparkWell lets people review software intent and concept boundaries before implementation is generated.

### Intent Loss

Implementation records how software currently works, but often loses why responsibilities, constraints, interactions, and boundaries exist.

Sparks preserve product and design intent as the system evolves across refactors, frameworks, platforms, and rewrites.

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

SparkWell explores an answer to these questions by making software intent a first-class artifact alongside implementation.

## What Is a Spark?

A **Spark** is a persistent, independently meaningful, and composable element of a software model. It gives humans and AI a stable unit through which to understand, review, evolve, and realize software intent.

A Spark is not a requirement item and is not a mirror of a source file, class, control, endpoint, or database table. Requirements, ideas, feedback, and code changes are change inputs. Sparks represent the accepted current model after those inputs have been understood.

```text
Requirement / Idea / Feedback / Code Change
                       │
                       ▼
                Normalize Change
                       │
                       ▼
               Current Spark Model
```

Spark Documents remain human-readable. They may combine prose, Markdown tables, lists, diagrams, examples, state machines, or other concise forms suited to the concept. Their structured metadata should identify the Spark and its graph topology without forcing the concept's knowledge into a rigid modeling language.

> **Schema the topology, not the knowledge.**

## Product Sparks

SparkWell's current direction begins with a **Product Spark Graph**: a durable model of what the product is now.

A Product Spark represents a product-level commitment that implementation cannot change unilaterally. Product Sparks describe meaningful product concepts such as user-facing spaces, core product data, observable behavior, platform-specific experiences, and product or system boundaries when those boundaries are themselves part of the product commitment.

Product Sparks should be large enough to remain independently understandable and reusable. A field, button, route, or native control normally belongs inside a larger Spark rather than becoming a Spark merely because it exists in an implementation.

Product Sparks compose into larger Sparks. Starting from a product root, their composition forms an application or system:

```text
Todo App
├── Todo
├── Todo List
└── Todo Editor
```

Composition records what a larger concept is made of. References connect independently owned concepts that interact or depend on one another. Detailed semantics remain in the Spark bodies rather than requiring a large vocabulary of specialized graph relationships.

For example, one product UI can describe when it opens another, while the destination separately describes what happens after success, cancellation, or failure. Product-visible transitions belong to the relevant Product Sparks; target-specific navigation mechanisms do not.

## Design Sparks

Some enduring software concepts are needed to realize a product but are not themselves part of explaining what the product is. Examples may include an editing draft, response processor, synchronization coordinator, or another internal responsibility whose boundary should survive changes in language, framework, and platform.

These concepts may be represented as **Design Sparks**. Design Sparks remain implementation-independent: they describe durable logical software organization, not React hooks, SwiftUI navigation APIs, classes, files, or other target mechanics.

The Design layer is not intended to mirror the Product Graph. It is an optional, sparse overlay:

```text
Effective Software Intent
    =
Product Spark Graph
    +
Applicable Design Sparks
```

A Product Spark does not require a corresponding Design Spark. Product Sparks can be realized directly when project guidance and established architecture already provide sufficient engineering direction. A Design Spark is justified only when it adds durable software knowledge that is absent from the Product Graph and should not be left for each implementation task to reinvent.

## From Intent to Realization

SparkWell does not define one universal project architecture. Concrete realization uses several sources with distinct responsibilities:

```text
Product Spark Graph
   + optional Design Sparks
   + project design context
   + target-specific guidance
   + reusable Skills and Packs
   + established native project facts
                       │
                       ▼
             Engineering Artifacts
         Code / Tests / Docs / Diagrams
```

Sparks preserve project-specific product and software intent. Project guidance preserves target-specific architecture and mappings. Skills and Packs provide reusable transformation and technology knowledge. Native project files remain authoritative for actual dependencies, versions, commands, artifacts, and current implementation structure.

This separation allows the same Product Spark Graph to guide different platform realizations without embedding each platform's implementation mechanics into the product model.

## Continuous Reconciliation

SparkWell ultimately aims to maintain consistency rather than perform only one-time generation. A change may originate in a requirement, a Spark, a design decision, or implementation. The change re-enters the loop so each abstraction level can determine whether it is semantically affected.

```text
Diff
  ↓
Changed Spark or Artifact
  ↓
Traverse the Spark Graph
  ↓
Find Impact Candidates
  ↓
AI-assisted Semantic Evaluation
  ↓
Propose Update or Skip
```

The graph determines what should be checked. The diff determines what changed. AI and human review determine whether a candidate actually needs to change. Lower-level changes may propose higher-level changes, but they must not silently redefine product intent.

This supports three different review questions:

- **Product review:** Is this the product change we want?
- **Design review:** Are these enduring software responsibilities and boundaries appropriate?
- **Verification:** Do the engineering artifacts faithfully realize the accepted intent?

## Current Exploration Focus

The ideas above are hypotheses under active validation, not a finalized modeling language. The repository's existing Spark kinds and workflows represent an earlier iteration and will be updated incrementally rather than rewritten all at once.

The immediate focus is the first part of the loop:

```text
Requirement
    ↓
Author and review Product Sparks
```

Development will proceed through a practical feedback loop:

1. refine the Product Spark authoring guidance;
2. exercise it in a deliberately small demo project;
3. observe ambiguity, duplication, missing concepts, and unnecessary ceremony;
4. feed those findings back into the documentation;
5. repeat before expanding the Design and implementation workflows.

The initial goal is not to finalize every Spark kind or relationship. It is to determine whether humans and AI can reliably turn a change request into a concise, composable, reviewable Product Spark Graph that is useful for later mock generation, design, implementation, testing, and reconciliation.

## Existing Prototype

The repository remains usable while the methodology is being revised. The commands below exercise the existing single-layer Spark prototype; they do not yet implement the Product Spark authoring direction described above.

SparkWell requires Node.js 20 or later and has no runtime package dependencies.

```sh
git clone https://github.com/junvwang/SparkWell.git
cd SparkWell
npm link

cd ../MyProject
sparkwell init
```

Optional implementation packs are installed separately:

```sh
sparkwell init --pack openapi
```

Then explicitly invoke a workflow, for example:

```text
/spark-design Design a todo list where people can add todos and mark them complete.
```

Review the Spark Proposal, choose `Finalize` in the decision UI or reply `Finalize` when no UI is available, then review the generated Spark Documents before separately invoking `/spark-impl` or `/spark-test` as needed.

Before the first new runtime realization, copy the profile placeholder from `.sparkwell/config.yaml` and maintain its referenced file under `.sparkwell/guidance/`. Complete the consequential architecture decisions there before invoking `/spark-impl`.

See the [Project Setup Flow](docs/usage.md#project-setup-flow) for the existing prototype's complete order and ownership of these files.

GitHub Copilot is the default adapter. SparkWell also supports Claude Code, `AGENTS.md`-compatible agents, multi-agent projects, and an agent-neutral initialization mode.

See the **[detailed usage guide](docs/usage.md)** for the existing prototype's installation, adapters, configuration, workflow usage, safety behavior, and complete CLI reference.

## Project Structure

| Path | Purpose |
|------|---------|
| [`core/`](core/) | Canonical SparkWell instructions and project contracts |
| [`skills/`](skills/) | Agent-neutral design, configuration, implementation, testing, and visualization workflows |
| [`packs/`](packs/) | Optional reusable technology-specific implementation and test guidance |
| [`adapters/`](adapters/) | Declarative mappings to coding-agent instruction and skill locations |
| [`scripts/`](scripts/) | Dependency-free CLI and initialization engine |
| [`docs/README.md`](docs/README.md) | Documentation map and source-of-truth guide |
| [`docs/usage.md`](docs/usage.md) | Detailed installation and usage reference |
| [`docs/implementation-packs.md`](docs/implementation-packs.md) | Pack boundary, activation, OpenAPI example, and migration guide |
| [`test/`](test/) | CLI, projection, migration, safety, and methodology integrity tests |

## Current Status

SparkWell is in early development and is undergoing a significant methodology revision. Existing tooling includes a Spark specification, design/configuration/implementation/testing workflows, realization provenance, multi-agent adapters, project guidance, and optional implementation packs. These currently reflect the previous single-layer Spark model and should not be read as the finalized form of the Product and Design model described above.

The next iteration is intentionally narrower: update the requirement-to-Product-Spark authoring method, validate it repeatedly in a small demo, and revise the documentation from observed results before changing downstream workflows. Some supporting documents still describe the previous methodology and will be reconciled incrementally as each workflow is revisited.

## Why "Spark"?

The name is inspired by the *Spark* in the Transformers universe: the enduring identity that remains even when a Transformer changes or rebuilds its body.

Software has a similar continuity. Implementations evolve. Languages and frameworks change. Systems may be rewritten. Yet the intent of a software concept - why it exists, what it owns, how it behaves, and how it relates to other concepts - should remain recognizable.

A Spark is not another implementation. It is an intent identity that should survive every implementation.

## Contributing

Questions, critical feedback, documentation improvements, adapter support, workflow improvements, and code contributions are welcome through GitHub issues and pull requests.

When changing a shared skill, keep it agent-neutral and preserve compatibility across supported coding agents.

## License

SparkWell is licensed under the [MIT License](LICENSE).
