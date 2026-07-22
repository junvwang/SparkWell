# Android Target Guidance

Use this optional reference when the effective target is `android`. The selected profile, project guidance, and established project take precedence.

## Resolve Project Ownership

- Determine whether the implementation is native Android, a cross-platform application, or a web or hybrid application with an Android host before choosing files or commands.
- For native Android, inspect Gradle settings and build files, the Gradle wrapper, version catalogs, Android manifests, modules, source sets, build variants, and existing source.
- For cross-platform or hybrid applications, inspect the owning framework's root manifests, source, and build configuration first. Treat the Android host as an integration layer and do not edit generated host files unless the project clearly owns them or regeneration is part of the established workflow.
- Preserve the established language, UI framework, module structure, dependency management, application architecture, minimum SDK, and target SDK unless constrained by the profile or explicitly changed.

## UI Component Projection

- Realize a root `ui-component` through the established activity content, navigation destination, screen-level composable, fragment view, or equivalent root boundary.
- Realize each composed child through an identifiable framework-native boundary, such as a Jetpack Compose composable, custom view, fragment-owned view, or established cross-platform component.
- Map conceptual inputs to parameters, observable state, bindings, or equivalent read boundaries, and map interactions to callbacks, events, intents, or equivalent owner-facing mechanisms.
- Keep cross-child state and coordination in the owning parent or established state holder. Keep child-local presentation and interaction state with the child boundary.
- Do not create a Spark-derived component for each Android view, composable call, resource, or layout node.

## Platform Responsibilities

- Prefer standard Android components and platform behaviors when they satisfy the Spark intent.
- Preserve TalkBack semantics, accessible names and roles, logical focus order, scalable text, sufficient touch targets, and supported keyboard or alternative-input behavior.
- Account for configuration changes, activity and process recreation, lifecycle transitions, state restoration, and system back behavior when they can affect the selected Sparks.
- Respect system bars, display cutouts, supported window sizes, orientations, and form factors where relevant to the configured application.
- Keep loading, empty, error, success, navigation, state restoration, state lifetime, and persistence behavior aligned with the selected Sparks.
- Request permissions in context and degrade safely when a permission is denied when those behaviors are part of the reviewed intent.

## Validation

- Discover build, lint, format, and static-analysis commands from the artifact-owning toolchain, project tasks, and CI configuration. When native Android artifacts are affected, use the project's Gradle wrapper and relevant variant tasks.
- Build, install, launch, and exercise the smallest material happy path on an available emulator or connected device when the environment permits it.
- If the required Android SDK, build tools, emulator, device, or credentials are unavailable, report the exact blocked check and do not infer success from source inspection alone.
- A successful debug build does not establish release, signing, or store readiness. Validate those outputs only when the profile or request includes them.
- Leave comprehensive API-level, device, screen-size, orientation, accessibility, performance, lifecycle, and background-behavior matrices to `test-sparks`.

## Decision Boundaries

- Do not invent the application ID, minimum or target SDK, supported form factors, build variants, signing, distribution, permissions, deep links, notifications, or background-execution policy.
- UI framework, navigation, dependency injection, concurrency, and internal state management remain engineering choices unless constrained by the profile or established project.