# Sparkwell Project Instructions

This project includes **Sparkwell** as an opt-in workflow.

This document defines when SparkWell is active and how AI agents should behave when a user invokes it. It complements the Spark Specification rather than replacing it.

SparkWell must not alter ordinary coding-agent behavior unless the user explicitly invokes a SparkWell workflow.

---

# Explicit Activation

Activate SparkWell only when the current user message directly invokes one of these slash commands:

- `/spark-design`
- `/spark-config`
- `/spark-impl`
- `/spark-test`

The invoked command activates only its named workflow for the current request. It does not activate another SparkWell workflow or establish a session-wide mode. The only cross-message continuations are the pending proposal responses defined below.

A request that changes product behavior or software intent does not by itself activate SparkWell. Mentioning Sparks, reading a Spark file, asking about SparkWell, or working in a repository that contains `.sparkwell/` also does not activate it.

When no SparkWell slash command is invoked:

- handle questions, implementation, debugging, refactoring, testing, and documentation through the normal coding-agent workflow;
- do not create, update, or delete Spark Documents;
- do not require Sparks to change before source code or tests change;
- do not impose a Spark review checkpoint;
- do not automatically invoke or recommend a SparkWell workflow merely because one appears applicable.

When a SparkWell command is invoked, load and follow that command's Agent Skill. If the requested next step belongs to another SparkWell workflow, stop and tell the user which slash command to invoke next rather than activating it automatically.

## Pending Design Proposal

A `/spark-design` request first produces a proposal in chat without modifying project files. The directly following user reply may continue that pending design workflow without another slash command only when it is one of these explicit controls:

- `Revise: <comments>` updates the proposal and presents one complete replacement proposal without writing files;
- `Finalize` confirms the latest complete proposal and permits Spark Document generation;
- `Cancel` ends the pending design workflow without writing files.

Each revised proposal may receive the same directly following controls. Treat the controls case-insensitively after trimming surrounding whitespace, but require `Revise:` to include the colon. Do not treat `yes`, `looks good`, silence, or other ambiguous approval as `Finalize`.

Any other user message does not continue SparkWell and ends eligibility for implicit proposal continuation. To resume later, the user must explicitly invoke `/spark-design` with the intended control and enough proposal context. Proposal and approval state remain in chat only and must not be persisted in project files.

If no latest complete proposal is unambiguously available, `Revise:`, `Finalize`, and `Cancel` do not authorize file changes. Ask the user to invoke `/spark-design` with the design request or provide sufficient proposal context.

## Pending Implementation Configuration Proposal

A `/spark-config` request first produces an Implementation Configuration Proposal in chat without modifying project files. The same directly following controls apply:

- `Revise: <comments>` updates the configuration proposal and presents one complete replacement without writing files;
- `Finalize` confirms the latest complete configuration proposal and permits updates to the proposed profile and guidance only;
- `Cancel` ends the pending configuration workflow without writing files.

Any other user message ends eligibility for implicit configuration-proposal continuation. Proposal and approval state remain in chat only. If no latest complete Implementation Configuration Proposal is unambiguously available, these controls do not authorize file changes; invoke `/spark-config` with the configuration request or sufficient proposal context.

Finalized implementation configuration does not activate `/spark-impl`. The user must invoke that command separately after reviewing the profile and guidance.

---

# Working in a Sparkwell Project

This section applies only while handling an explicitly invoked SparkWell workflow.

During that workflow, think in terms of **software concepts** represented by Sparks, not source files or engineering artifacts alone.

Sparks and engineering artifacts serve different and complementary purposes:

- Sparks provide durable, clarified design for meaningful software concepts.
- Engineering artifacts realize that design within the established project and target platform.

A Spark is not a compacted or partial version of the user's request. It narrows conceptual scope, not detail. Do not discard requested outcomes or constraints when translating them into Sparks.

During `/spark-design`, when the requested design changes the software intent of a concept, including its responsibilities, observable behavior, constraints, composition, or relationships:

1. Identify the affected Spark(s).
2. Present a concise Spark Proposal in chat without modifying project files.
3. Wait for `Revise:`, `Finalize`, or `Cancel`.
4. After `Finalize`, revalidate the proposal against the current workspace and create or update the corresponding Spark Documents.
5. Present the generated Spark Documents for human review.
6. Stop before engineering artifacts are generated.

The proposal review and generated-document review are separate human checkpoints. Neither requires approval status or other workflow metadata in the Spark Document.

Before generated-document review, capture every implementation-critical requested outcome, clarification, accepted constraint, and decision rationale whose loss could reverse the design in the affected Spark Documents. Do not rely on the design conversation as the only source of information needed for correct implementation.

Keep Spark Documents concise. State each decision once in the Spark that owns it, reference related Sparks instead of restating their behavior, and omit generic engineering expectations or implementation-freedom disclaimers already established by project guidance.

Designing Sparks and producing engineering artifacts are **separate explicitly invoked tasks**.

Do not continue from Spark design into engineering artifact generation. Stop and tell the user to invoke `/spark-impl` after review.

Configuring a project implementation and generating code are also separate explicitly invoked tasks. `/spark-config` may update profiles and guidance only; it must stop before product generation.

Changes to engineering artifacts do not necessarily require Spark changes.

Evolve a Spark when its software intent changes, including conceptual changes to its responsibilities, observable behavior, constraints, composition, or relationships.

A Spark Document may also be corrected or clarified without changing the software intent it represents. Such maintenance does not constitute evolution of the Spark.

Within an active SparkWell workflow, resolve design questions at the Spark level before changing engineering artifacts.

When reasoning about a software system, use reviewed Sparks to understand concept design and engineering artifacts to preserve established architecture and integration context. Do not let either layer silently erase compatible information from the other.

If a Spark and its engineering artifacts appear inconsistent, do not silently assume either one is correct.

Instead:

- identify the inconsistency;
- explain the possible cause;
- determine whether the Spark should evolve or the engineering artifacts should evolve.

---

# Follow the Spark Specification

The Spark Specification defines:

- Spark concepts
- Spark semantics
- Spark document structure
- Spark relationships
- Spark design principles

When working with Sparks:

- Follow the project specification.
- Follow the specification for Spark concepts, semantics, and document structure.
- Follow project instructions or Sparkwell Skills for creation, review, storage, and artifact-generation workflows. If no applicable workflow exists, ask for clarification.

For the complete Spark Specification, refer to:

`.sparkwell/specification.md`

The specification is the single source of truth for Spark concepts.

---

# Use Sparkwell Skills

Use a SparkWell Skill only through its explicit slash command. Never select one automatically from request semantics.

Typical Spark-related tasks include:

- creating Sparks;
- evolving existing Sparks;
- configuring implementation profiles and project architecture guidance;
- generating engineering artifacts;
- creating or improving test artifacts as a separate workflow;
- reconciling Sparks and engineering artifacts.

---

# Guiding Principles

When a SparkWell workflow is explicitly active:

- Think in Sparks before thinking in implementation.
- Review software intent before generating engineering artifacts whenever practical.
- Prefer keeping Sparks independent of implementation technologies whenever practical.
- Treat engineering artifacts as realizations of Sparks rather than the primary representation of software design.
- Treat reviewed Sparks as required design contracts, not ceilings on implementation quality. Preserve compatible established architecture, platform conventions, security, accessibility, reliability, maintainability, and other normal engineering quality expectations even when every such expectation is not repeated in a Spark.
- Do not invent observable product behavior under the banner of engineering quality. Return unresolved product decisions to Spark design.
