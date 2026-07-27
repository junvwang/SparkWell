# Sparkwell Implementation Profiles

Implementation profiles route a realization to its target, artifact root, optional implementation packs, and project guidance. YAML is limited to information that workflows must parse deterministically. Architecture and code-generation decisions belong in guidance or established native project files.

## Configuration

`.sparkwell/config.yaml` is the single profile-configuration source. `implementations.profiles` maps a unique profile ID to each implementation profile. Profile, target, and pack IDs use lowercase kebab-case. Targets are extensible, and multiple profiles may share a target.

## Profile Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `target` | yes | Implementation target |
| `source-root` | yes | Project-relative artifact root |
| `packs` | no | Map of activated pack IDs to pack-owned configuration |
| `guidance` | no | Project-relative implementation-guidance documents, read in listed order |

Paths use `/` and are relative to the project root. Guidance paths must resolve to readable files and must not escape the project root. The recommended location is `.sparkwell/guidance/<profile-id>.md`.

Profiles do not inherit and must not contain secrets.

## Implementation Packs

A pack provides reusable technology-specific realization and test rules. Install bundled packs with `sparkwell init --pack <pack-id>`. Installation alone does not activate a pack.

- A profile activates the IDs used as keys in `packs`. Use `packs: {}` for no packs and `<pack-id>: {}` when an activated pack needs no configuration.
- `.sparkwell/packs/<pack-id>/PACK.md` defines the value's schema, target applicability, required references, generation, validation, and testing rules. Values contain only machine-required routing, references, and validation inputs; architecture belongs in project guidance.
- Before planning, read each selected `PACK.md` and its applicable references. Pack references must remain inside that pack's directory. Missing, unreadable, escaping, incompatible, or contradictory pack input makes the task **Blocked**.

Pack requirements cannot be overridden by project guidance. Packs own technology-specific realization and validation, not observable product behavior, Domain Model semantics, Service capabilities, or UI Component interaction boundaries. They may add compatible non-observable engineering quality and platform integration but must not change Spark intent. Multiple packs have equal authority; list order never resolves conflicts.

## Decision Boundaries

Keep each decision in its owning source:

| Source | Owns |
|---|---|
| Sparks | Product behavior, domain rules, observable states and failures, lifecycle, and observable platform requirements |
| Profile | Target and artifact routing, Pack activation, and Pack-owned machine-readable configuration |
| Project guidance | Architecture, mappings, data flow, artifact ownership, and implementation rules |
| Implementation packs | Reusable technology-specific realization and validation rules |
| Native project files and source | Actual dependencies, versions, commands, build state, and existing implementation structure |

Do not duplicate decisions across sources. Product intent belongs in Sparks. Architecture choices such as SQLite, repository boundaries, and synchronization adapters belong in project guidance; actual dependencies, versions, and build commands remain native project facts.

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

Record consequential choices in guidance. Explicitly state `none` when the absence of persistence, remote data, or shared state is deliberate. Do not require irrelevant choices for a target or duplicate facts already established by native project files.

For an established implementation, existing native architecture may supply decisions not yet recorded in a profile. Preserve that architecture. If the profile or guidance conflicts with the existing project, stop as **Blocked** rather than silently migrating or replacing the architecture.

Profiles and guidance are project-owned inputs maintained manually or with ordinary coding-agent assistance. `/spark-impl` reads but never edits them or chooses unresolved consequential architecture.

## Resolution and Conflicts

This section is the authoritative order for implementation decisions. Implementation-related Skills apply it rather than defining another order.

Apply compatible decisions in this order:

1. Spark intent.
2. Profile routing and pack configuration.
3. Profile-referenced project guidance.
4. Selected implementation packs.
5. Established native architecture and configuration.

The order applies only to compatible decisions and does not authorize silent conflict resolution. Stop as **Blocked** when Spark intent, profile routing, pack configuration, guidance, selected packs, or established architecture contradict one another. A task-local request may choose only ordinary details not owned by these sources; consequential project changes require updating the project-owned profile or guidance before retrying.

## Example

```yaml
schema-version: 1

implementations:
  profiles:
    web-react:
      target: web
      source-root: src/web
      packs: {}
      guidance:
        - .sparkwell/guidance/web-react.md
```

## Selection

- Select a named profile that matches the requested target. For exactly one match, select it automatically; for multiple matches, ask for a profile ID.
- With no matching profile, use an unambiguous established implementation only when its architecture is clear and no new implementation surface is required.
- A new runtime implementation requires a named profile and resolved consequential choices. Stop and identify the profile fields or guidance decisions the project must add when either is missing.