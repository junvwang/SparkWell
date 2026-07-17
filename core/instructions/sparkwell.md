# Sparkwell Project Instructions

This project is developed using **Sparkwell**.

This document defines how AI agents should work in a Sparkwell project. It complements the Spark Specification rather than replacing it.

Software in a Sparkwell project is designed around **Sparks** rather than engineering artifacts alone.

---

# Distinguish Toolkit Work from Product Work

This repository supports two kinds of work:

1. Developing the Sparkwell toolkit itself, including its specification, conventions, instructions, skills, and reusable workflows.
2. Using Sparkwell to design and realize the software represented by the project's Sparks and engineering artifacts.

Classify the request before applying the Spark-first workflow.

For Sparkwell toolkit development, work directly on the toolkit artifacts. Do not create product Sparks for changes to Sparkwell instructions, skills, specifications, conventions, or reusable agent workflows unless the user explicitly asks to model the toolkit itself as Sparks.

For product development, follow the Spark-first workflow below.

If the request could reasonably belong to either category and the distinction affects whether Sparks should change, ask for clarification.

---

# Working in a Sparkwell Project

When working in this project, think in terms of **software concepts** represented by Sparks—not source files or engineering artifacts.

Sparks and engineering artifacts serve different and complementary purposes:

- Sparks provide detailed, clarified design for meaningful software concepts.
- Engineering artifacts realize that design within the established project and target platform.

A Spark is not a compacted or partial version of the user's request. It narrows conceptual scope, not detail. Do not discard requested outcomes or constraints when translating them into Sparks.

Whenever a request changes the software intent of a concept, including its responsibilities, observable behavior, constraints, composition, or relationships:

1. Identify the affected Spark(s).
2. Create or update the corresponding Spark(s).
3. Present the proposed Spark changes for human review.
4. Stop so a human has an opportunity to review the Spark changes before engineering artifacts are generated.

This review is an offline human checkpoint. It does not require approval status or other workflow metadata in the Spark Document.

Before the checkpoint, capture every implementation-critical requested outcome, clarification, accepted constraint, and decision rationale whose loss could reverse the design in the affected Spark Documents. Do not rely on the design conversation as the only source of information needed for correct implementation.

Designing Sparks and producing engineering artifacts are **separate tasks**.

Do not automatically continue from Spark design into engineering artifact generation.

Changes to engineering artifacts do not necessarily require Spark changes.

Evolve a Spark when its software intent changes, including conceptual changes to its responsibilities, observable behavior, constraints, composition, or relationships.

A Spark Document may also be corrected or clarified without changing the software intent it represents. Such maintenance does not constitute evolution of the Spark.

Whenever practical, resolve design questions at the Spark level before changing engineering artifacts.

When reasoning about a software system, use reviewed Sparks to understand detailed concept design and engineering artifacts to preserve established architecture and integration context. Do not let either layer silently erase compatible information from the other.

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

Whenever an appropriate Sparkwell Skill is available, use it instead of inventing your own Spark workflow.

Typical Spark-related tasks include:

- creating Sparks;
- evolving existing Sparks;
- generating engineering artifacts;
- creating or improving test artifacts as a separate workflow;
- reconciling Sparks and engineering artifacts.

---

# Guiding Principles

When working in a Sparkwell project:

- Think in Sparks before thinking in implementation.
- Review software intent before generating engineering artifacts whenever practical.
- Prefer keeping Sparks independent of implementation technologies whenever practical.
- Treat engineering artifacts as realizations of Sparks rather than the primary representation of software design.
- Treat reviewed Sparks as required design contracts, not ceilings on implementation quality. Preserve compatible established architecture, platform conventions, security, accessibility, reliability, maintainability, and other normal engineering quality expectations even when every such expectation is not repeated in a Spark.
- Do not invent observable product behavior under the banner of engineering quality. Return unresolved product decisions to Spark design.
