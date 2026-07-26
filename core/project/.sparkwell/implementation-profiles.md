# Sparkwell Implementation Profiles

Implementation profiles hold project-specific target, framework, source-layout, and architecture choices outside Spark Documents. SparkWell supplies the shared realization workflow; each project supplies the implementation decisions that workflow must follow.

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
| `guidance` | no | Ordered list of project-relative implementation-guidance documents |

Constraint and preference keys are extensible. Constraints are mandatory implementation decisions. Preferences are defaults that a compatible explicit request may override.

Paths use `/` and are relative to the project root. Guidance paths must resolve to readable files and must not escape the project root. The recommended location is `.sparkwell/guidance/<profile-id>.md`.

Profiles do not inherit and must not contain secrets. `.sparkwell/config.yaml` is the single profile-configuration source.

## Decision Ownership

Keep each decision in its owning layer:

| Layer | Owns |
|---|---|
| Reviewed Sparks | Product behavior, domain rules, user-visible states, failures, lifecycle, and platform intent |
| Profile `constraints` | Structured choices the implementation workflow must not change |
| Profile `preferences` | Structured defaults that may be overridden compatibly |
| Profile `guidance` | Nuanced project architecture and code-generation rules |
| Native project files and source | Actual dependencies, versions, commands, build state, and existing implementation structure |

Do not move product decisions into implementation guidance. For example, whether offline work is allowed and how conflicts appear to users belong in Sparks; SQLite, repository organization, and synchronization adapters belong in the profile or guidance.

## Project Implementation Guidance

Guidance describes architecture choices that are too nuanced for concise YAML. Use the minimum content needed to direct implementation consistently. Depending on the target, it may define:

- architecture and module boundaries;
- state ownership and data flow;
- domain, contract, DTO, and persistence-model mappings;
- local and remote persistence responsibilities;
- repository, dependency-injection, error-handling, concurrency, and synchronization patterns;
- how UI Components map to the established target architecture;
- artifact placement and ownership;
- generated, workflow-maintained, and human-maintained boundaries.

Guidance must not duplicate package versions, build commands, formatter settings, or other facts already owned by native files. Multiple guidance documents have equal authority; their list order is for reading only and does not resolve conflicts.

Every referenced guidance file must be read before implementation planning. Missing, unreadable, contradictory, or profile-incompatible guidance makes the implementation task **Blocked**.

## Architecture Readiness

For a new runtime implementation, use a named profile and resolve consequential architecture choices before generating code. Relevant choices include:

- framework or project type;
- primary architecture and module boundaries;
- state ownership;
- persistence boundary and strategy;
- local and remote data flow when applicable;
- source root and artifact ownership.

Record structured choices in `constraints` or `preferences` and nuanced choices in guidance. Explicitly record `none` when the absence of persistence, remote data, or shared state is a deliberate decision. Do not require irrelevant choices for a target.

For an established implementation, existing native architecture may supply decisions not yet recorded in a profile. Preserve that architecture. If the profile or guidance conflicts with the existing project, stop as **Blocked** rather than silently migrating or replacing the architecture.

Use `/spark-config` to create or revise profiles and project guidance. `/spark-impl` does not write implementation configuration or choose unresolved consequential architecture.

## Resolution and Conflicts

Apply compatible decisions in this order:

1. Reviewed Spark intent.
2. Profile `constraints`.
3. Profile-referenced project guidance.
4. Compatible explicit user choices.
5. Established native architecture and configuration.
6. Profile `preferences`.
7. Optional SparkWell target defaults.

This order does not authorize silent conflict resolution. Stop as **Blocked** when Spark intent, constraints, guidance, explicit choices, or established architecture contradict one another. Preferences and target defaults apply only when they are compatible with all higher-authority sources.

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
      source-root: src/web
      constraints:
        framework: react
        architecture: feature-modules
        persistence:
          provider: indexeddb
      preferences:
        state-management: zustand
      guidance:
        - .sparkwell/guidance/web-react.md

    todo-api:
      target: api-service
      source-root: src/todo-api
      constraints:
        runtime: dotnet
        framework: aspnet-core
        architecture: clean-architecture
        persistence:
          provider: sqlite
      guidance:
        - .sparkwell/guidance/todo-api.md
```

## Selection

- Select a named profile when it exists and matches any requested target.
- For a target with exactly one profile, select it automatically.
- For multiple matching profiles, ask for a profile ID.
- With no matching profile, use an unambiguous established implementation only when its architecture is clear and no new implementation surface is required.
- A new runtime implementation requires a named profile and resolved consequential choices. Stop and direct the user to `/spark-config` when either is missing.