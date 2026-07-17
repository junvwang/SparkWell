import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const adaptersDirectory = path.join(packageRoot, 'adapters')
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const registry = await loadAdapterRegistry()

export const DEFAULT_AGENT = registry.defaultAgent
export const SUPPORTED_AGENTS = [...registry.adapters.keys(), 'none']

export function getAdapter(agent) {
  const adapter = registry.adapters.get(agent)
  if (!adapter) {
    throw new TypeError(`Unsupported agent: ${agent}`)
  }
  return adapter
}

export function normalizeAgent(agent) {
  if (agent === 'none') {
    return agent
  }

  const normalized = registry.aliases.get(agent) ?? agent
  if (!registry.adapters.has(normalized)) {
    throw new TypeError(`Unsupported agent: ${agent}`)
  }
  return normalized
}

export function normalizeAgents(agents) {
  const requested = agents?.length ? agents : [DEFAULT_AGENT]
  const normalized = [...new Set(requested.map(normalizeAgent))]

  if (normalized.includes('none') && normalized.length > 1) {
    throw new TypeError('Agent "none" cannot be combined with other agents.')
  }
  return normalized
}

async function loadAdapterRegistry() {
  const entries = await readdir(adaptersDirectory, { withFileTypes: true })
  const adapters = new Map()
  const aliases = new Map()
  const defaults = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isFile() || path.extname(entry.name) !== '.json') {
      continue
    }

    const manifestPath = path.join(adaptersDirectory, entry.name)
    const adapter = JSON.parse(await readFile(manifestPath, 'utf8'))
    validateAdapter(adapter, entry.name)
    await validateAdapterSources(adapter, entry.name)

    if (adapters.has(adapter.id) || aliases.has(adapter.id)) {
      throw new Error(`Duplicate agent adapter id: ${adapter.id}`)
    }
    adapters.set(adapter.id, adapter)
    aliases.set(adapter.id, adapter.id)

    for (const alias of adapter.aliases) {
      if (aliases.has(alias) || alias === 'none') {
        throw new Error(`Duplicate agent adapter alias: ${alias}`)
      }
      aliases.set(alias, adapter.id)
    }

    if (adapter.default) {
      defaults.push(adapter.id)
    }
  }

  if (adapters.size === 0) {
    throw new Error('SparkWell contains no agent adapters.')
  }
  if (defaults.length !== 1) {
    throw new Error('SparkWell must define exactly one default agent adapter.')
  }

  return { adapters, aliases, defaultAgent: defaults[0] }
}

function validateAdapter(adapter, filename) {
  if (adapter.schemaVersion !== 1) {
    throw new Error(`${filename} has an unsupported schemaVersion.`)
  }
  if (!idPattern.test(adapter.id) || filename !== `${adapter.id}.json`) {
    throw new Error(`${filename} must match its lowercase kebab-case adapter id.`)
  }
  if (!Array.isArray(adapter.aliases) || !adapter.aliases.every(isValidId)) {
    throw new Error(`${filename} contains invalid aliases.`)
  }
  if (!Array.isArray(adapter.instructions) || adapter.instructions.length === 0) {
    throw new Error(`${filename} must define at least one instruction projection.`)
  }
  if (!Array.isArray(adapter.skills)) {
    throw new Error(`${filename} contains invalid skill projections.`)
  }

  for (const instruction of adapter.instructions) {
    validateRelativePath(instruction.source, filename)
    validateRelativePath(instruction.destination, filename)
    if (
      instruction.strategy !== 'managed-section' ||
      !instruction.startMarker ||
      !instruction.endMarker ||
      instruction.startMarker === instruction.endMarker
    ) {
      throw new Error(`${filename} contains an invalid instruction strategy.`)
    }
  }

  for (const skill of adapter.skills) {
    validateRelativePath(skill.source, filename)
    validateRelativePath(skill.destination, filename)
    if (
      skill.retainOnDisable !== undefined &&
      (!Array.isArray(skill.retainOnDisable) ||
        !skill.retainOnDisable.every(isValidId) ||
        new Set(skill.retainOnDisable).size !== skill.retainOnDisable.length)
    ) {
      throw new Error(`${filename} contains invalid retained skills.`)
    }
  }
}

function validateRelativePath(value, filename) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.split(/[\\/]/).includes('..')
  ) {
    throw new Error(`${filename} contains an invalid relative path.`)
  }
}

async function validateAdapterSources(adapter, filename) {
  for (const instruction of adapter.instructions) {
    await assertReadableSource(
      path.join(packageRoot, instruction.source),
      filename,
    )
  }

  for (const skill of adapter.skills) {
    const skillSource = path.join(packageRoot, skill.source)
    await assertReadableSource(skillSource, filename)
    for (const retainedSkill of skill.retainOnDisable ?? []) {
      await assertReadableSource(
        path.join(skillSource, retainedSkill, 'SKILL.md'),
        filename,
      )
    }
  }
}

async function assertReadableSource(sourcePath, filename) {
  try {
    await access(sourcePath)
  } catch {
    throw new Error(`${filename} references a missing source: ${sourcePath}`)
  }
}

function isValidId(value) {
  return typeof value === 'string' && idPattern.test(value)
}