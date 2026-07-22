# Web Test Guidance

Use this optional reference when the effective target is `web`. The selected profile, project guidance, and established native test stack take precedence.

## Test Integration

- Preserve the established package manager, test runner, browser harness, helpers, fixtures, and CI commands.
- Prefer semantic queries and user-observable interactions over component internals, implementation classes, or brittle selectors.
- Separate fast logic or component scenarios from browser scenarios according to established project patterns.

## Behavioral Coverage

- For composed UI Components, exercise child interactions through semantic rendered controls and verify the parent's observable coordination outcome. Do not assert framework component trees, implementation props, emitted-event names, hooks, or source-module boundaries.
- Cover relevant keyboard, focus, accessible-name, reading-order, and error-announcement behavior when the selected Sparks own those interactions.
- Check representative viewport sizes only when responsive behavior or layout risk is material.
- Use screenshots or pixel assertions only when visual presentation itself is required intent and semantic assertions cannot distinguish it.
- Prefer event-driven readiness and stable conditions over arbitrary delays.
- Verify state lifetime, persistence, loading, empty, failure, and recovery behavior only where specified by selected Sparks.

## Execution

- Start a development or preview server only when the selected test harness requires it.
- Use the smallest relevant browser and viewport matrix unless profile or project guidance requires broader support.
- Report browser, environment, and accessibility checks that could not run.