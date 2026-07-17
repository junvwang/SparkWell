# Windows Target Guidance

Use this optional reference when the effective target is `windows`. The selected profile, project guidance, and established native project take precedence.

## Project Integration

- Inspect solution files, project files, package manifests, target frameworks, application manifests, and existing source before editing.
- Preserve the established Windows framework and project type unless a compatible migration is explicitly requested.
- Use native SDK, dependency, packaging, and build configuration rather than duplicating it in Sparkwell files.

## Runtime Quality

- Prefer standard Windows controls and platform behaviors when they satisfy the Spark intent.
- Preserve keyboard navigation, access keys where appropriate, logical focus order, accessible names, and UI Automation behavior.
- Account for window resizing, display scaling, high-contrast operation, and supported input methods when relevant to the selected Sparks or project guidance.
- Keep application state lifetime, persistence, loading, empty, error, and success behavior aligned with the selected Sparks.

## Validation

- Discover and run applicable restore, build, format, and lint commands from solution and project files, build scripts, task definitions, and CI configuration.
- Run relevant existing tests when they provide a cheap regression signal, but do not create or modify tests or test infrastructure in this workflow.
- Launch the application and exercise the smallest material happy path needed to smoke-check the changed runtime behavior when the environment permits it.
- Leave comprehensive UI Automation, resizing, scaling, keyboard, accessibility, packaging, and installer test matrices to `test-sparks` unless one bounded check is needed to diagnose a runtime defect.
- Validate packaging or installer output only when the profile or request includes it.
- Never invoke an interactive elevation prompt. If a required validation needs elevation, report the blocked check for the user to run.

## Boundaries

- Packaging, signing, deployment, minimum Windows version, and store distribution require explicit project configuration or a user request.
- Framework architecture and dependency-injection choices are engineering decisions unless constrained by the profile or established project.