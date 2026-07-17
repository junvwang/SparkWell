# Web Target Guidance

Use this optional reference when the effective target is `web`. The selected profile, project guidance, and established native project take precedence.

## Project Integration

- Inspect package manifests, lock files, framework configuration, and existing source before editing.
- Preserve the established framework and package manager unless a compatible migration is explicitly requested.
- Use native package and workspace configuration rather than duplicating it in Sparkwell files.

## Runtime Quality

- Use semantic HTML and native controls where they express the intended interaction.
- Preserve keyboard operation, focus behavior, accessible names, assistive-technology reading order, and visible focus.
- Keep content usable without overlap or clipping at supported viewport sizes.
- Keep loading, empty, error, success, state-lifetime, and persistence behavior aligned with the selected Sparks.

## Validation

- Discover and run applicable install, build, type-check, lint, and format commands from package scripts, workspace configuration, task definitions, and CI configuration.
- Run relevant existing tests when they provide a cheap regression signal, but do not create or modify tests or test infrastructure in this workflow.
- Run the final application in a browser when the environment supports it and exercise the smallest material happy path needed to smoke-check the changed runtime behavior.
- Leave comprehensive browser automation, screenshots, cross-viewport matrices, keyboard/accessibility test coverage, text-fit checks, and overlap campaigns to `test-sparks`.
- After implementing a server-based web application, start its development server and report the local URL. If the experience works as a standalone file, report the file path instead.

## Boundaries

- Browser support, offline behavior, localization, and persistence are product or profile decisions when they materially affect the experience; do not invent them.
- Framework-specific architecture is an engineering choice unless constrained by the profile or established project.