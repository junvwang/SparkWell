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