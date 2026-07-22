# Sparkwell Implementation Profiles

Implementation profiles hold project-specific target, framework, and source-layout choices outside Spark Documents.

## Configuration

Define profiles in `.sparkwell/config.yaml`:

```yaml
schema-version: 1

contracts:
  root: src/contracts
  service-format: openapi-3.1

implementations:
  profiles: {}
```

`contracts` defines project-wide contract settings shared by every target. `contracts.root` is the project-relative folder where the Contract target writes contracts and other targets read them. `contracts.service-format` selects the service-contract format. The bundled Contract target supports `openapi-3.1`.

`implementations.profiles` maps a unique profile ID to each runtime implementation profile. Profile and target IDs use lowercase kebab-case. Targets are extensible, and multiple profiles may share a target.

## Profile Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `target` | yes | Implementation target |
| `source-root` | yes | Project-relative artifact root |
| `constraints` | no | Mandatory implementation choices |
| `preferences` | no | Overridable defaults |
| `guidance` | no | Project-relative implementation-guidance documents |

Constraint and preference keys are extensible. Constraints override conflicting requests; explicit compatible choices may override preferences.

Paths use `/` and are relative to the project root. Guidance is for nuanced conventions such as architecture, accessibility, state management, and testing. Do not duplicate dependencies, versions, commands, formatter rules, or linter settings owned by native project files.

Profiles do not inherit and must not contain secrets. `.sparkwell/config.yaml` is the single profile-configuration source.

## Example

```yaml
schema-version: 1

contracts:
  root: src/contracts
  service-format: openapi-3.1

implementations:
  profiles:
    web-react:
      target: web
      source-root: src/web-react
      constraints:
        framework: react
      preferences:
        language: typescript

    todo-api:
      target: api-service
      source-root: src/todo-api
      constraints:
        runtime: dotnet
        framework: aspnet-core
```

The Contract target uses `contracts.root` directly and does not require a profile. Runtime profiles, including API Service profiles, keep their own artifact roots in `source-root` and share contracts through the root-level `contracts` configuration. A human runs contract generation before any workflow that needs those files.

## Selection

- Select a named profile when it exists and matches any requested target.
- For a target with exactly one profile, select it automatically.
- For multiple matching profiles, ask for a profile ID.
- With no matching profile, use an unambiguous established implementation; for a new implementation, ask for consequential missing choices.