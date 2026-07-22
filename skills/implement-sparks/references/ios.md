# iOS Target Guidance

Use this optional reference when the effective target is `ios`. The selected profile, project guidance, and established project take precedence.

## Resolve Project Ownership

- Determine whether the implementation is native iOS, a cross-platform application, or a web or hybrid application with an iOS host before choosing files or commands.
- For native iOS, inspect Xcode projects and workspaces, package and dependency manifests, schemes, targets, build settings, property lists, entitlements, asset catalogs, and existing source.
- For cross-platform or hybrid applications, inspect the owning framework's root manifests, source, and build configuration first. Treat the iOS host as an integration layer and do not edit generated project files unless the project clearly owns them or regeneration is part of the established workflow.
- Preserve the established language, UI framework, target structure, dependency management, application architecture, deployment target, and supported device families unless constrained by the profile or explicitly changed.

## UI Component Projection

- Realize a root `ui-component` through the established scene content, navigation destination, root SwiftUI view, view controller, or equivalent root boundary.
- Realize each composed child through an identifiable framework-native boundary, such as a SwiftUI `View`, UIKit view or view controller, or established cross-platform component.
- Map conceptual inputs to properties, bindings, observable state, or equivalent read boundaries, and map interactions to closures, actions, delegates, notifications, or equivalent owner-facing mechanisms.
- Keep cross-child state and coordination in the owning parent or established state holder. Keep child-local presentation and interaction state with the child boundary.
- Do not create a Spark-derived component for each UIKit control, SwiftUI modifier, view-builder fragment, or layout node.

## Platform Responsibilities

- Prefer standard iOS controls and platform behaviors when they satisfy the Spark intent.
- Preserve VoiceOver semantics, accessible labels and traits, logical focus order, Dynamic Type, sufficient touch targets, and supported keyboard or alternative-input behavior.
- Account for scene and application lifecycle transitions, interruption, memory pressure, termination, and state restoration when they can affect the selected Sparks.
- Respect safe areas, supported interface orientations and window sizes, appearance changes, and configured device families where relevant to the application.
- Keep loading, empty, error, success, navigation, state restoration, state lifetime, and persistence behavior aligned with the selected Sparks.
- Request protected-resource access in context and degrade safely when authorization is denied when those behaviors are part of the reviewed intent.

## Validation

- Discover build, lint, format, and static-analysis commands from the artifact-owning toolchain, project tasks, and CI configuration. When native iOS artifacts are affected, use an explicit Xcode scheme, configuration, and destination.
- Build, install, launch, and exercise the smallest material happy path on an available simulator or connected device when the environment permits it.
- Native iOS compilation, simulator or device execution, archiving, signing, and provisioning generally require macOS and Xcode. When the required Apple tooling, device, or credentials are unavailable, report the exact blocked check and do not infer success from source inspection alone.
- A successful simulator debug build does not establish device, release, signing, or store readiness. Validate those outputs only when the profile or request includes them.
- Leave comprehensive iOS-version, device, screen-size, orientation, accessibility, performance, lifecycle, and background-behavior matrices to `test-sparks`.

## Decision Boundaries

- Do not invent the bundle identifier, deployment target, supported device families, capabilities, entitlements, signing, provisioning, distribution, privacy declarations, deep links, notifications, or background modes.
- UI framework, navigation, dependency injection, concurrency, and internal state management remain engineering choices unless constrained by the profile or established project.