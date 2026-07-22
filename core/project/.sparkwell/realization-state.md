# Sparkwell Realization State

Realization state is a human-readable, version-controlled provenance index for artifacts generated or materially maintained from Sparks.

## Storage and Identity

Store one manifest per implementation at `.sparkwell/state/realizations/<implementation-id>.yaml`.

Use the selected profile ID as the implementation ID. Without a profile, use the effective target only when it identifies one unambiguous implementation. Multiple implementations of one target require profiles. IDs use lowercase kebab-case.

## Format

```yaml
schema-version: 1
implementation-id: web-react

artifacts:
  - path: src/web-react/TodoList.tsx
    derived-from:
      - todo-list

  - path: src/web-react/TodoList.test.tsx
    derived-from:
      - todo-list
      - todo-item
```

Each artifact entry has a unique project-relative `path` and a non-empty, duplicate-free list of stable Spark IDs in `derived-from`. Paths use `/`.

## Semantics

- Reviewed Sparks remain authoritative for detailed concept design; native files remain authoritative for artifact content and existence. Surface conflicts rather than silently choosing one.
- State supports discovery and impact analysis. It does not prove correctness, validation, ownership, or permission to overwrite.
- Artifacts and Sparks have a many-to-many relationship.
- Map files created or changed to implement Spark intent, not files merely inspected or validated.
- Exclude caches, build outputs, lock files, and generic tooling unless intentionally derived from Spark intent.
- Do not store hashes, validation results, timestamps, secrets, or absolute paths.
- Test artifacts may be mapped like other engineering artifacts. State records their Spark provenance, not requirement coverage, pass status, or completeness.
- Map each contract file to its source Sparks: a model-derived contract to its Domain Model; an explicit service contract to its Service and any represented Domain Models. Do not map individual operations or schemas.

## Lifecycle

Before planning, load the manifest, verify IDs and paths, inspect mapped files, and discover relevant unmapped files. Missing or stale state does not prove that no implementation exists.

During edits, track provenance changes but never map a file before it exists.

After final artifact edits, add or update changed mappings, remove deleted paths, preserve valid out-of-scope entries, and write a manifest matching the working tree. Reconcile again after validation-driven edits. Validation failure does not remove factual mappings; report it separately.