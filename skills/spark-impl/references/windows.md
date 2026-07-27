# Windows Target Guidance

Use this optional reference when the effective target is `windows`. The selected profile, project guidance, and established native project take precedence.

## Project Integration

- Inspect solution files, project files, package manifests, target frameworks, application manifests, and existing source before editing.
- Preserve the established Windows framework and project type unless a compatible migration is explicitly requested.
- Use native SDK, dependency, packaging, and build configuration rather than duplicating it in Sparkwell files.

## Architecture Boundary

- Resolve framework, project type, MVC or MVVM structure, state ownership, persistence, dependency injection, and local or remote data flow from the selected profile, its guidance, and an established native project.
- This target reference does not choose an architecture pattern, toolkit, repository pattern, ORM, persistence provider, synchronization strategy, or source layout.
- Preserve an established Windows architecture. For a new implementation, mark unresolved consequential choices **Blocked**, identify them, and ask the user to document them in project guidance before retrying `/spark-impl`.

## UI Component Projection

- Realize a root `ui-component` through the established window, page, application shell, or equivalent root view.
- Realize each composed child through an identifiable framework-native view boundary, such as a `UserControl`, `Page`, custom control, data template with an established owner, or equivalent component. A boundary may use code-behind, a view model, or both according to project architecture.
- Map conceptual inputs to idiomatic properties, bindings, or view-model state, and map interactions to events, commands, delegates, or equivalent owner-facing mechanisms.
- Keep cross-child state and coordination in the owning parent or its established controller or view model. Keep child-local presentation and interaction state with the child boundary.
- Do not create a custom control for a standard Windows control or split XAML solely to mirror Spark body sections.

## Runtime Quality

- Prefer standard Windows controls and platform behaviors when they satisfy the Spark intent.
- Preserve keyboard navigation, access keys where appropriate, logical focus order, accessible names, and UI Automation behavior.
- Account for window resizing, display scaling, high-contrast operation, and supported input methods when relevant to the selected Sparks or project guidance.
- Keep application state lifetime, persistence, loading, empty, error, and success behavior aligned with the selected Sparks.

## Validation

- Discover and run applicable restore, build, format, and lint commands from solution and project files, build scripts, task definitions, and CI configuration.
- Run relevant existing tests when they provide a cheap regression signal, but do not create or modify tests or test infrastructure in this workflow.
- Launch the application and exercise the smallest material happy path needed to smoke-check the changed runtime behavior when the environment permits it.
- Leave comprehensive UI Automation, resizing, scaling, keyboard, accessibility, packaging, and installer test matrices to `spark-test` unless one bounded check is needed to diagnose a runtime defect.
- Validate packaging or installer output only when the profile or request includes it.
- Never invoke an interactive elevation prompt. If a required validation needs elevation, report the blocked check for the user to run.

## Boundaries

- Packaging, signing, deployment, minimum Windows version, and store distribution require explicit project configuration or a user request.
- Ordinary framework mechanics remain engineering choices only within the confirmed project architecture.