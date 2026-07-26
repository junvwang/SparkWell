import { constants } from 'node:fs'
import {
  access,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  getAdapter,
  normalizeAgent,
  normalizeAgents,
  SUPPORTED_AGENTS,
} from './adapter-registry.js'
import {
  getPack,
  normalizePacks,
  SUPPORTED_PACKS,
} from './pack-registry.js'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const requiredDirectories = ['sparks', '.sparkwell/state/realizations']
const projectOwnedSeeds = new Set(['.sparkwell/config.yaml'])

export {
  normalizeAgent,
  normalizeAgents,
  normalizePacks,
  SUPPORTED_AGENTS,
  SUPPORTED_PACKS,
}

export class InitConflictError extends Error {
  constructor(conflicts) {
    super('Sparkwell found conflicting managed paths.')
    this.name = 'InitConflictError'
    this.conflicts = conflicts
  }
}

export async function initializeProject({
  destination,
  agent,
  agents,
  packs,
  dryRun = false,
  force = false,
}) {
  const normalizedAgents = normalizeAgents(agents ?? (agent ? [agent] : undefined))
  const normalizedPacks = normalizePacks(packs)
  const templateSources = [
    {
      sourceRoot: path.join(packageRoot, 'core', 'project'),
      destinationRoot: '',
    },
  ]

  for (const packId of normalizedPacks) {
    const pack = getPack(packId)
    templateSources.push({
      sourceRoot: pack.sourceRoot,
      destinationRoot: path.join('.sparkwell', 'packs', pack.id),
    })
  }

  const agentTemplates = await collectAgentTemplates(normalizedAgents)
  templateSources.push(...agentTemplates.templateSources)

  for (const templateSource of templateSources) {
    await access(templateSource.sourceRoot, constants.R_OK)
  }

  const templates = [
    ...(
    await Promise.all(templateSources.map((source) => collectTemplateFiles(source)))
    ).flat(),
    ...agentTemplates.instructionTemplates,
  ].sort((left, right) => left.relativePath.localeCompare(right.relativePath))
  assertUniqueTemplatePaths(templates)

  const destinationState = await getPathState(destination)
  if (destinationState === 'file') {
    throw new InitConflictError([destination])
  }

  const conflicts = []
  const fatalConflicts = []
  const pendingFiles = []
  let unchanged = 0

  for (const relativeDirectory of requiredDirectories) {
    const targetDirectory = path.join(destination, relativeDirectory)
    if ((await getPathState(targetDirectory)) === 'file') {
      fatalConflicts.push(toPortablePath(relativeDirectory))
    }
  }

  for (const template of templates) {
    const targetPath = path.join(destination, template.relativePath)
    const targetState = await getPathState(targetPath)
    const portablePath = toPortablePath(template.relativePath)

    if (targetState === 'missing') {
      pendingFiles.push({ ...template, targetPath, action: 'create' })
      continue
    }

    if (targetState === 'directory') {
      fatalConflicts.push(toPortablePath(template.relativePath))
      continue
    }

    const currentContent = await readFile(targetPath)
    const managedSection = template.managedSection
    if (managedSection) {
      const mergeResult = mergeManagedSection(
        currentContent,
        template.content,
        managedSection,
        force,
      )

      if (mergeResult.status === 'malformed') {
        fatalConflicts.push(portablePath)
      } else if (mergeResult.status === 'unchanged') {
        unchanged += 1
      } else {
        pendingFiles.push({
          ...template,
          targetPath,
          content: mergeResult.content,
          action: 'update',
        })
      }
      continue
    }

    if (contentsMatch(currentContent, template.content)) {
      unchanged += 1
      continue
    }

    if (projectOwnedSeeds.has(portablePath) && !force) {
      unchanged += 1
      continue
    }

    conflicts.push(portablePath)
    pendingFiles.push({ ...template, targetPath, action: 'update' })
  }

  if (fatalConflicts.length > 0 || (conflicts.length > 0 && !force)) {
    throw new InitConflictError([...fatalConflicts, ...conflicts].sort())
  }

  const created = pendingFiles.filter((file) => file.action === 'create').length
  const updated = pendingFiles.filter((file) => file.action === 'update').length

  if (!dryRun) {
    await mkdir(destination, { recursive: true })
    for (const relativeDirectory of requiredDirectories) {
      await mkdir(path.join(destination, relativeDirectory), {
        recursive: true,
      })
    }

    for (const pendingFile of pendingFiles) {
      await mkdir(path.dirname(pendingFile.targetPath), { recursive: true })
      await writeFile(pendingFile.targetPath, pendingFile.content)
    }
  }

  return {
    agent: normalizedAgents.length === 1 ? normalizedAgents[0] : undefined,
    agents: normalizedAgents,
    packs: normalizedPacks,
    created,
    updated,
    unchanged,
    dryRun,
  }
}

async function collectAgentTemplates(normalizedAgents) {
  const templateSources = []
  const instructionTemplates = []

  for (const normalizedAgent of normalizedAgents) {
    if (normalizedAgent === 'none') {
      continue
    }

    const adapter = getAdapter(normalizedAgent)
    for (const skillProjection of adapter.skills) {
      templateSources.push({
        sourceRoot: path.join(packageRoot, skillProjection.source),
        destinationRoot: skillProjection.destination,
      })
    }
    for (const instruction of adapter.instructions) {
      const sourcePath = path.join(packageRoot, instruction.source)
      await access(sourcePath, constants.R_OK)
      instructionTemplates.push({
        relativePath: instruction.destination,
        content: createManagedInstruction(
          await readFile(sourcePath),
          instruction,
        ),
        managedSection: {
          startMarker: instruction.startMarker,
          endMarker: instruction.endMarker,
        },
      })
    }
  }

  return { templateSources, instructionTemplates }
}

async function collectTemplateFiles(
  templateSource,
  currentDirectory = templateSource.sourceRoot,
) {
  const entries = await readdir(currentDirectory, { withFileTypes: true })
  const files = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(currentDirectory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectTemplateFiles(templateSource, absolutePath)))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    files.push({
      relativePath: path.join(
        templateSource.destinationRoot,
        path.relative(templateSource.sourceRoot, absolutePath),
      ),
      content: await readFile(absolutePath),
    })
  }

  return files
}

async function getPathState(targetPath) {
  try {
    const targetStat = await stat(targetPath)
    return targetStat.isDirectory() ? 'directory' : 'file'
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return 'missing'
    }
    throw error
  }
}

function toPortablePath(filePath) {
  return filePath.split(path.sep).join('/')
}

function contentsMatch(currentContent, templateContent) {
  if (currentContent.equals(templateContent)) {
    return true
  }

  if (currentContent.includes(0) || templateContent.includes(0)) {
    return false
  }

  return normalizeText(currentContent) === normalizeText(templateContent)
}

function normalizeText(content) {
  return content
    .toString('utf8')
    .replaceAll('\r\n', '\n')
    .replace(/\n*$/, '')
}

function mergeManagedSection(currentContent, templateContent, markers, force) {
  const currentText = currentContent.toString('utf8')
  const currentNormalized = currentText.replaceAll('\r\n', '\n')
  const templateNormalized = templateContent
    .toString('utf8')
    .replaceAll('\r\n', '\n')
    .replace(/\n*$/, '')
  const templateBlock = findManagedBlock(templateNormalized, markers)

  if (templateBlock.status !== 'valid') {
    throw new Error('The bundled Copilot instruction template has invalid Sparkwell markers.')
  }

  const currentBlock = findManagedBlock(currentNormalized, markers)
  if (currentBlock.status === 'malformed' && !force) {
    return { status: 'malformed' }
  }

  const lineEnding = currentText.includes('\r\n') ? '\r\n' : '\n'
  let mergedNormalized

  if (currentBlock.status === 'malformed') {
    mergedNormalized = replaceMalformedManagedSection(
      currentNormalized,
      templateBlock.lines,
      currentBlock,
    )
  } else if (currentBlock.status === 'absent') {
    const legacyBody = templateBlock.lines.slice(1, -1).join('\n')
    if (normalizeText(currentContent) === normalizeText(Buffer.from(legacyBody))) {
      mergedNormalized = templateBlock.text
    } else {
      const existing = currentNormalized.replace(/\n*$/, '')
      mergedNormalized = existing
        ? `${existing}\n\n${templateBlock.text}`
        : templateBlock.text
    }
  } else {
    const currentLines = currentNormalized.split('\n')
    currentLines.splice(
      currentBlock.startIndex,
      currentBlock.endIndex - currentBlock.startIndex + 1,
      ...templateBlock.lines,
    )
    mergedNormalized = currentLines.join('\n').replace(/\n*$/, '')
  }

  const mergedContent = Buffer.from(
    `${mergedNormalized.replaceAll('\n', lineEnding)}${lineEnding}`,
  )
  return contentsMatch(currentContent, mergedContent)
    ? { status: 'unchanged' }
    : { status: 'update', content: mergedContent }
}

function findManagedBlock(content, markers) {
  const lines = content.replace(/\n*$/, '').split('\n')
  const startIndexes = findMarkerIndexes(lines, markers.startMarker)
  const endIndexes = findMarkerIndexes(lines, markers.endMarker)

  if (startIndexes.length === 0 && endIndexes.length === 0) {
    return { status: 'absent' }
  }

  if (
    startIndexes.length !== 1 ||
    endIndexes.length !== 1 ||
    startIndexes[0] >= endIndexes[0]
  ) {
    return { status: 'malformed', lines, startIndexes, endIndexes }
  }

  const startIndex = startIndexes[0]
  const endIndex = endIndexes[0]
  const blockLines = lines.slice(startIndex, endIndex + 1)
  return {
    status: 'valid',
    startIndex,
    endIndex,
    lines: blockLines,
    text: blockLines.join('\n'),
  }
}

function findMarkerIndexes(lines, marker) {
  const indexes = []
  for (const [index, line] of lines.entries()) {
    if (line.trim() === marker) {
      indexes.push(index)
    }
  }
  return indexes
}

function replaceMalformedManagedSection(
  content,
  replacementLines,
  malformedBlock,
) {
  const markerIndexes = [
    ...malformedBlock.startIndexes,
    ...malformedBlock.endIndexes,
  ].sort((left, right) => left - right)
  let replaceFrom
  let replaceThrough

  if (
    malformedBlock.startIndexes.length > 0 &&
    malformedBlock.endIndexes.length > 0
  ) {
    replaceFrom = markerIndexes[0]
    replaceThrough = markerIndexes.at(-1)
  } else if (malformedBlock.startIndexes.length > 0) {
    replaceFrom = malformedBlock.startIndexes[0]
    replaceThrough = malformedBlock.lines.length - 1
  } else {
    replaceFrom = 0
    replaceThrough = malformedBlock.endIndexes.at(-1)
  }

  const lines = content.split('\n')
  lines.splice(
    replaceFrom,
    replaceThrough - replaceFrom + 1,
    ...replacementLines,
  )
  return lines.join('\n').replace(/\n*$/, '')
}

function assertUniqueTemplatePaths(templates) {
  const paths = new Set()
  for (const template of templates) {
    const portablePath = toPortablePath(template.relativePath)
    if (paths.has(portablePath)) {
      throw new Error(`Multiple Sparkwell sources map to ${portablePath}.`)
    }
    paths.add(portablePath)
  }
}

function createManagedInstruction(sourceContent, instruction) {
  const body = normalizeText(sourceContent)
  if (
    body.split('\n').some(
      (line) =>
        line.trim() === instruction.startMarker ||
        line.trim() === instruction.endMarker,
    )
  ) {
    throw new Error(`${instruction.source} must not contain adapter markers.`)
  }

  return Buffer.from(
    `${instruction.startMarker}\n${body}\n${instruction.endMarker}\n`,
  )
}