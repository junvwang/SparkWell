# Agent Adapters

Agent adapters map SparkWell's canonical instructions and shared Agent Skills into coding-agent-specific discovery paths.

Adapters are declarative JSON files. Adding an adapter must not require a new initializer script or a fork of any skill.

## Manifest

```json
{
  "schemaVersion": 1,
  "id": "example-agent",
  "aliases": ["example"],
  "instructions": [
    {
      "source": "core/instructions/sparkwell.md",
      "destination": "AGENTS.md",
      "strategy": "managed-section",
      "startMarker": "<!-- sparkwell:start -->",
      "endMarker": "<!-- sparkwell:end -->"
    }
  ],
  "skills": [
    {
      "source": "skills",
      "destination": ".agents/skills"
    }
  ]
}
```

## Fields

| Field | Purpose |
|-------|---------|
| `schemaVersion` | Adapter schema version; currently `1` |
| `id` | Unique lowercase kebab-case CLI identifier; must match the filename |
| `default` | Optional boolean; exactly one bundled adapter must be the default |
| `aliases` | Alternative lowercase kebab-case CLI names |
| `instructions` | Canonical instruction source, project destination, and merge strategy |
| `skills` | Shared skill source and project discovery destination |

All source paths are relative to the SparkWell package root. All destination paths are relative to the initialized project root. Absolute paths and parent traversal are rejected.

The current instruction strategy is `managed-section`. It preserves project-authored content outside the adapter's markers and updates only the SparkWell-owned block.

Active SparkWell skills are user-invocable commands with automatic model invocation disabled. Adapters must preserve the canonical Skill frontmatter so ordinary coding requests do not activate SparkWell.

## Add an Agent

1. Confirm the agent supports the Agent Skills `SKILL.md` standard or document any genuine compatibility gap.
2. Confirm its project instruction and skill discovery locations from official documentation.
3. Add `<agent-id>.json` to this directory.
4. Reuse `core/instructions/sparkwell.md` and `skills/`; do not duplicate their content.
5. Add initialization, merge, alias, idempotence, and packaged-CLI coverage.
6. Update the supported-adapter table in the root README.

Agent-specific skill content is allowed only when the workflow genuinely depends on host-specific tools or syntax. Keep such content explicit and minimal rather than forking the complete shared skill.