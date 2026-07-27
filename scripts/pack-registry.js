import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const packsDirectory = path.join(packageRoot, 'packs')
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const registry = await loadPackRegistry()

export const SUPPORTED_PACKS = [...registry.keys()]

export function getPack(packId) {
  const pack = registry.get(packId)
  if (!pack) {
    throw new TypeError(`Unsupported implementation pack: ${packId}`)
  }
  return pack
}

export function normalizePacks(packs = []) {
  return [...new Set(packs.map((packId) => getPack(packId).id))]
}

async function loadPackRegistry() {
  const entries = await readdir(packsDirectory, { withFileTypes: true })
  const packs = new Map()

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory() || !idPattern.test(entry.name)) {
      continue
    }

    const packRoot = path.join(packsDirectory, entry.name)
    const definitionPath = path.join(packRoot, 'PACK.md')
    const pack = parsePackDefinition(
      await readFile(definitionPath, 'utf8'),
      entry.name,
    )

    if (packs.has(pack.id)) {
      throw new Error(`Duplicate implementation pack id: ${pack.id}`)
    }
    packs.set(pack.id, { ...pack, sourceRoot: packRoot })
  }

  return packs
}

export function parsePackDefinition(content, directoryName) {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!frontmatter) {
    throw new Error(`${directoryName}/PACK.md must begin with YAML frontmatter.`)
  }

  const fields = new Map()
  for (const line of frontmatter[1].split(/\r?\n/)) {
    if (line.trim() === '') {
      continue
    }

    const field = line.match(/^([a-z][a-z0-9-]*):[ \t]*(.+)$/)
    if (!field) {
      throw new Error(`${directoryName}/PACK.md contains invalid frontmatter.`)
    }
    if (fields.has(field[1])) {
      throw new Error(`${directoryName}/PACK.md contains duplicate ${field[1]}.`)
    }
    fields.set(field[1], parseScalar(field[2], directoryName))
  }

  const allowedFields = new Set(['id', 'description', 'schema-version'])
  for (const field of fields.keys()) {
    if (!allowedFields.has(field)) {
      throw new Error(`${directoryName}/PACK.md contains unsupported field ${field}.`)
    }
  }

  const pack = {
    id: fields.get('id'),
    description: fields.get('description'),
    schemaVersion: Number(fields.get('schema-version')),
  }
  validatePack(pack, directoryName)
  return pack
}

function parseScalar(value, directoryName) {
  const trimmed = value.trim()
  if (trimmed.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(trimmed)) {
      throw new Error(`${directoryName}/PACK.md contains invalid quoted text.`)
    }
    return trimmed.slice(1, -1).replaceAll("''", "'")
  }
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      throw new Error(`${directoryName}/PACK.md contains invalid quoted text.`)
    }
  }
  return trimmed
}

function validatePack(pack, directoryName) {
  if (pack.schemaVersion !== 1) {
    throw new Error(`${directoryName}/PACK.md has an unsupported schema-version.`)
  }
  if (!idPattern.test(pack.id) || pack.id !== directoryName) {
    throw new Error(`${directoryName}/PACK.md id must match its lowercase kebab-case directory.`)
  }
  if (typeof pack.description !== 'string' || pack.description.trim() === '') {
    throw new Error(`${directoryName}/PACK.md must define a description.`)
  }
}