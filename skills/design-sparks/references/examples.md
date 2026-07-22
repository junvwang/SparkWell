# Spark Design Examples

These examples calibrate judgment. Adapt them to the vocabulary, boundaries, and granularity of the current project.

## One Requirement Affecting Multiple Sparks

Requirement: Users can sign in with credentials and remain signed in across browser sessions.

Possible result:

- Evolve or create a Credential Sign-In Spark that owns credential submission, success, rejection, and user-visible failure behavior.
- Evolve or create a User Session Spark that owns session establishment, persistence, expiration, and termination.
- Model sign-in as using session management when the concepts are independently owned.

This is one requirement mapped to multiple Sparks because it changes two independently meaningful responsibilities.

## Multiple Requirements Belonging to One Spark

Requirements:

- Reject invalid credentials without revealing which field was wrong.
- Prevent repeated submission while authentication is in progress.
- Show a recoverable error when authentication is unavailable.

Possible result: Represent all three behaviors in one Credential Sign-In Spark when that Spark owns the complete sign-in interaction. Do not create separate Sparks for each acceptance criterion.

## Evolve Instead of Create

Requirement: Add an optional "remember this device" choice to an existing sign-in experience.

Possible result: Evolve the existing Credential Sign-In and User Session Sparks if the choice changes their behavior. Do not create a Remember Device Checkbox Spark merely because the implementation will add a UI control.

A separate trusted-device concept may be justified only when it owns independent security rules, lifecycle, or reuse beyond the sign-in form.

## Appropriate Decomposition

Requirement: Customers can complete checkout by reviewing an order, paying, and receiving confirmation.

Possible result:

- A Checkout Workflow Spark owns the end-to-end customer flow and composes independently meaningful steps.
- A Payment Spark owns payment authorization and failure behavior.
- An Order Placement Spark owns creation of the committed order and its invariants.

The parent remains meaningful because it owns the overall flow and transitions. The children are meaningful because they own behavior and constraints that can evolve independently.

## Domain Model and Standard Service Behavior

Requirement: People can create Todo Items, give each one a non-empty title, mark it complete or active, rename it, and delete it.

Possible result: Create one `todo-item` Domain Model Spark because a Todo Item has stable identity, independently meaningful fields and invariants, model-level state changes, and a reason to be used by several realizations.

```markdown
---
id: todo-item
name: Todo Item
kind: domain-model
summary: Represents one piece of work a person wants to track.
composes: []
uses: []
service-exposure:
  standard-operations:
    - create
    - get
    - list
    - update
    - delete
---

# Todo Item

## Purpose

Represent one piece of work from creation through completion.

## Data

| Field | Meaning | Type | Required | Default | Constraints | Mutability |
|---|---|---|---|---|---|---|
| `id` | Stable identity of the Todo Item | identifier | Yes | Generated | Unique and non-empty | Immutable |
| `title` | Work the person wants to remember | string | Yes | None | Trimmed; 1-200 characters | Mutable |
| `completed` | Whether the work is complete | boolean | Yes | `false` | None | Mutable |

## Behavior

- Change the title while preserving identity.
- Mark an active Todo Item complete.
- Return a completed Todo Item to active.

## Invariants

- The title remains non-empty after trimming.
- Changing title or completion does not change identity.

## Boundaries

This Spark does not define visual presentation, transport schemas, persistence layout, or framework types.
```

A Todo List UI Spark can `use` `todo-item` and state which standard operations its interactions require. Do not create an automatic Todo Item Service Spark merely to repeat default CRUD. Create an explicit Service Spark only when independently meaningful service behavior exists, such as bulk archival, authorization, specialized queries, or cross-model operations.

Do not create separate Sparks for `CreateTodoInput`, `TodoItemDto`, an ORM `TodoEntity`, or a `todos` table. Those are possible engineering realizations of `todo-item`.

If Todo Items must not receive an automatically derived public service, omit `service-exposure`. This still permits a reviewed explicit Service Spark to use Todo Items. If Todo Items must never cross a public service boundary, state that stronger rule explicitly in the Domain Model Spark.

## Explicit Service Spark

Requirement: People can mark every active Todo Item complete in one operation. The operation must not leave only part of the selected set completed if it fails.

Possible result: Create a `todo-management` Service Spark because bulk completion coordinates behavior across multiple Todo Items and owns distinct all-or-nothing failure semantics. It uses `todo-item` rather than duplicating Todo Item fields and invariants.

```markdown
---
id: todo-management
name: Todo Management
kind: service
summary: Coordinates operations across Todo Items.
composes: []
uses:
  - todo-item
---

# Todo Management

## Purpose

Coordinate Todo Item operations that are broader than one model-level change.

## Capabilities

| Capability | Purpose | Inputs | Output | Failure Behavior |
|---|---|---|---|---|
| `complete-all` | Mark every active Todo Item complete | None | Number of `todo-item` models changed | Fails without partial completion if the operation cannot complete |

## Rules

- Already completed Todo Items remain unchanged.
- The result counts only Todo Items changed by this operation.

## Boundaries

This Spark does not define transport routes, persistence, or Todo Item fields and invariants.
```

A UI Spark uses `todo-management` when it needs `complete-all`. Contract and target implementations may realize that capability through an API operation, but the Service Spark does not prescribe an HTTP route, verb, DTO, or generated client method.

## Under-Decomposition

Candidate: One Application Spark describes authentication, product discovery, purchasing, billing, and account administration in detail.

Problem: The Spark combines independently meaningful capabilities with different responsibilities and evolution paths.

Better direction: Keep an Application Spark only if it owns meaningful system-level purpose and composition, then represent major independent capabilities as composed or used Sparks.

## Implementation-Shaped Over-Decomposition

Candidate Sparks for sign-in:

- Email Input
- Password Input
- Submit Button
- Form Hook
- Authentication Endpoint
- Credentials DTO

Problem: These candidates mostly mirror likely engineering artifacts. They do not each own independently meaningful software intent.

Better direction: Start with the sign-in interaction and session concepts. Introduce a smaller UI or service Spark only when it has a distinct purpose, behavior, constraints, and independent reason to evolve or be reused.

## Implementation-Only Change

Request: Replace local form state with a form-management library without changing sign-in behavior, responsibilities, constraints, or relationships.

Possible result: No Spark change. This is an engineering-artifact change, assuming the current Spark already represents the observed behavior accurately.

## Ambiguous Boundary

Requirement: Support account recovery.

Problem: This could mean password reset, username recovery, administrator-assisted recovery, recovery codes, or several of these. The alternatives have materially different behavior, actors, and security constraints.

Possible result: Ask focused questions before selecting Spark boundaries. Do not invent a generic Account Recovery Spark whose intent hides the unresolved decisions.

## Presentation-Only UI Change

Request: As a local visual-polish adjustment, with no intended provider preference, platform-specific rule, accessibility constraint, or reusable design rule, move the Google sign-in button above the Apple sign-in button and reduce the spacing between provider buttons. Keep keyboard and assistive-technology navigation consistent with the resulting visual order.

Possible result: No Spark change.

Reasoning:

- The supported authentication methods remain unchanged.
- Authentication capabilities, outcomes, and interaction rules remain unchanged.
- The ordering does not represent provider priority, and the spacing does not establish an enduring design rule.
- Validation, loading states, error handling, responsive behavior, and ownership remain unchanged.
- Accessible navigation remains consistent with the visual order without introducing a distinct accessibility behavior or constraint.
- The request explicitly limits the change to presentation of an existing engineering artifact.

Update the relevant UI artifact without changing the Credential Sign-In Spark, assuming that Spark intentionally leaves incidental styling unspecified.

If the original request does not establish these premises, clarify whether the ordering or spacing expresses enduring product intent before classifying the change.

A Spark change would be appropriate if the request instead changed the software intent, for example:

- Make Google the preferred sign-in method.
- Require Apple sign-in to appear first on iOS.
- Hide unavailable providers dynamically.
- Change the provider hierarchy as part of the product interaction design.
- Add accessibility or platform constraints that must persist across implementations.

This example illustrates that visual implementation details do not automatically belong in a Spark. However, presentation rules should be represented when they express enduring product behavior or constraints.