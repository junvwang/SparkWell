# Implementation Packs

Implementation packs are optional reusable realization guidance installed by `sparkwell init --pack <id>`.

Each pack uses this structure:

```text
packs/<id>/
├── PACK.md
└── references/
```

`PACK.md` is the single pack definition. It begins with frontmatter containing `id`, `description`, and `schema-version: 1`; the ID must match the lowercase kebab-case directory. Its body defines activation, profile configuration, intent boundaries, and routing to workflow-specific references.

Pack guidance must:

- remain inactive unless selected by a profile;
- derive product behavior only from Sparks;
- define target applicability and required profile keys;
- identify artifact ownership and validation rules;
- keep secrets and machine-specific configuration out of profiles;
- report missing inputs and conflicts as **Blocked**;
- avoid modifying Core semantics to suit one technology.

Add pack registry, projection, idempotence, package, and Core-boundary tests with every bundled pack.