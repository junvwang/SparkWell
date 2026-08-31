# Windows Test Guidance

Use this optional reference when the effective target is `windows`. The selected profile, project guidance, and established native test stack take precedence.

## Test Integration

- Preserve the established solution, test projects, framework, deployment model, fixtures, and CI commands.
- Keep framework-free domain behavior in ordinary unit tests when the existing architecture supports it.
- Use native UI Automation or the project's established UI harness for user-visible Windows interactions rather than testing XAML or control internals directly.

## Behavioral Coverage

- For composed UI Components, exercise the child through its native user-visible surface and verify the parent's observable coordination outcome. Do not assert XAML file boundaries, view-model types, binding paths, command names, or control-tree structure unless one is itself a required compatibility surface.
- Cover keyboard navigation, access keys, accessible names, focus order, high contrast, scaling, resizing, windowing, and supported input methods only when relevant to reviewed intent or material regression risk.
- Verify the launched application consumes the current build before diagnosing UI behavior.
- Test packaging, installation, signing, or elevation only when the profile or request includes those concerns.

## Execution

- Run the narrowest test project or scenario first, then the smallest relevant solution-level regression scope.
- Never invoke an interactive elevation prompt. Report checks requiring elevation for the user to run.
- Distinguish application failures from package registration, runtime availability, display-session, and UI Automation environment failures.