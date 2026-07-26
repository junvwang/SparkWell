import { access, readFile, readdir } from 'node:fs/promises'
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
    const manifestPath = path.join(packRoot, 'pack.json')
    const pack = JSON.parse(await readFile(manifestPath, 'utf8'))
    validatePack(pack, entry.name)
    await access(path.join(packRoot, 'PACK.md'))

    if (packs.has(pack.id)) {
      throw new Error(`Duplicate implementation pack id: ${pack.id}`)
    }
    packs.set(pack.id, { ...pack, sourceRoot: packRoot })
  }

  return packs
}

function validatePack(pack, directoryName) {
  if (pack.schemaVersion !== 1) {
    throw new Error(`${directoryName}/pack.json has an unsupported schemaVersion.`)
  }
  if (!idPattern.test(pack.id) || pack.id !== directoryName) {
    throw new Error(`${directoryName}/pack.json must match its lowercase kebab-case directory.`)
  }
  if (typeof pack.description !== 'string' || pack.description.trim() === '') {
    throw new Error(`${directoryName}/pack.json must define a description.`)
  }
}