# Web Target Guidance

Use this optional reference when the effective target is `web`. The selected profile, project guidance, and established native project take precedence.

## Project Integration

- Inspect package manifests, lock files, framework configuration, and existing source before editing.
- Preserve the established framework and package manager unless a compatible migration is explicitly requested.
- Use native package and workspace configuration rather than duplicating it in Sparkwell files.

## Architecture Boundary

- Resolve framework, architecture, module boundaries, state ownership, persistence, and local or remote data flow from the selected profile, its guidance, and an established native project.
- This target reference does not choose a component architecture, state library, repository pattern, persistence provider, synchronization strategy, or source layout.
- Preserve an established Web architecture. For a new implementation, mark unresolved consequential choices **Blocked**, identify them, and ask the user to document them in project guidance before retrying `/spark-impl`.

## UI Component Projection

- Realize a root `ui-component` through the established application root, route, page, or top-level framework component.
- Realize each composed child through an identifiable framework-native component boundary, such as a React, Vue, Svelte, Web Component, or established equivalent boundary. A boundary does not require one file when the project convention keeps several component declarations together.
- Map conceptual inputs to idiomatic properties, context, stores, or equivalent read boundaries, and map interactions to callbacks, emitted events, actions, or equivalent owner-facing mechanisms.
- Keep cross-child state and coordination in the owning parent. Keep child-local presentation and interaction state in the child.
- Preserve semantic HTML and native controls inside component boundaries; do not turn every element, hook, or styling unit into a Spark-derived component.

## Runtime Quality

- Use semantic HTML and native controls where they express the intended interaction.
- Preserve keyboard operation, focus behavior, accessible names, assistive-technology reading order, and visible focus.
- Keep content usable without overlap or clipping at supported viewport sizes.
- Keep loading, empty, error, success, state-lifetime, and persistence behavior aligned with the selected Sparks.

## Validation

- Discover and run applicable install, build, type-check, lint, and format commands from package scripts, workspace configuration, task definitions, and CI configuration.
- Run relevant existing tests when they provide a cheap regression signal, but do not create or modify tests or test infrastructure in this workflow.
- Run the final application in a browser when the environment supports it and exercise the smallest material happy path needed to smoke-check the changed runtime behavior.
- Leave comprehensive browser automation, screenshots, cross-viewport matrices, keyboard/accessibility test coverage, text-fit checks, and overlap campaigns to `spark-test`.
- After implementing a server-based web application, start its development server and report the local URL. If the experience works as a standalone file, report the file path instead.

## Boundaries

- Browser support, offline behavior, localization, and persistence are product or profile decisions when they materially affect the experience; do not invent them.
- Ordinary framework mechanics remain engineering choices only within the confirmed project architecture.