import { constants } from 'node:fs'
import {
  access,
  mkdir,
  readFile,
  readdir,
  rm,
  rmdir,
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

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const requiredDirectories = ['sparks', '.sparkwell/state/realizations']
const projectOwnedSeeds = new Set(['.sparkwell/config.yaml'])

export { normalizeAgent, normalizeAgents, SUPPORTED_AGENTS }

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
  dryRun = false,
  force = false,
  includeCore = true,
}) {
  const normalizedAgents = normalizeAgents(agents ?? (agent ? [agent] : undefined))
  const templateSources = []
  if (includeCore) {
    templateSources.push({
      sourceRoot: path.join(packageRoot, 'core', 'project'),
      destinationRoot: '',
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

  if (includeCore) {
    for (const relativeDirectory of requiredDirectories) {
      const targetDirectory = path.join(destination, relativeDirectory)
      if ((await getPathState(targetDirectory)) === 'file') {
        fatalConflicts.push(toPortablePath(relativeDirectory))
      }
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
    if (includeCore) {
      for (const relativeDirectory of requiredDirectories) {
        await mkdir(path.join(destination, relativeDirectory), {
          recursive: true,
        })
      }
    }

    for (const pendingFile of pendingFiles) {
      await mkdir(path.dirname(pendingFile.targetPath), { recursive: true })
      await writeFile(pendingFile.targetPath, pendingFile.content)
    }
  }

  return {
    agent: normalizedAgents.length === 1 ? normalizedAgents[0] : undefined,
    agents: normalizedAgents,
    created,
    updated,
    unchanged,
    dryRun,
  }
}

export async function enableProject({
  destination,
  agent,
  agents,
  dryRun = false,
  force = false,
}) {
  await assertInitializedProject(destination)
  const normalizedAgents = normalizeIntegrationAgents(
    agents ?? (agent ? [agent] : undefined),
  )
  return initializeProject({
    destination,
    agents: normalizedAgents,
    dryRun,
    force,
    includeCore: false,
  })
}

export async function disableProject({
  destination,
  agent,
  agents,
  dryRun = false,
  force = false,
}) {
  await assertInitializedProject(destination)
  const normalizedAgents = normalizeIntegrationAgents(
    agents ?? (agent ? [agent] : undefined),
  )
  const agentTemplates = await collectAgentTemplates(normalizedAgents)

  for (const templateSource of agentTemplates.templateSources) {
    await access(templateSource.sourceRoot, constants.R_OK)
  }

  const templates = [
    ...(
      await Promise.all(
        agentTemplates.templateSources.map((source) =>
          collectTemplateFiles(source),
        ),
      )
    ).flat(),
    ...agentTemplates.instructionTemplates,
  ].sort((left, right) => left.relativePath.localeCompare(right.relativePath))
  assertUniqueTemplatePaths(templates)

  const conflicts = []
  const fatalConflicts = []
  const pendingFiles = []
  let unchanged = 0

  for (const template of templates) {
    const targetPath = path.join(destination, template.relativePath)
    const targetState = await getPathState(targetPath)
    const portablePath = toPortablePath(template.relativePath)

    if (template.retainOnDisable) {
      if (targetState === 'missing') {
        pendingFiles.push({
          targetPath,
          action: 'create',
          content: template.content,
        })
      } else if (targetState === 'directory') {
        fatalConflicts.push(portablePath)
      } else {
        unchanged += 1
      }
      continue
    }

    if (targetState === 'missing') {
      unchanged += 1
      continue
    }
    if (targetState === 'directory') {
      fatalConflicts.push(portablePath)
      continue
    }

    const currentContent = await readFile(targetPath)
    if (template.managedSection) {
      const removal = removeManagedSection(
        currentContent,
        template.content,
        template.managedSection,
        force,
      )
      if (removal.status === 'malformed') {
        fatalConflicts.push(portablePath)
      } else if (removal.status === 'unchanged') {
        unchanged += 1
      } else {
        pendingFiles.push({
          targetPath,
          action: removal.status,
          content: removal.content,
        })
      }
      continue
    }

    if (!contentsMatch(currentContent, template.content) && !force) {
      conflicts.push(portablePath)
      continue
    }
    pendingFiles.push({ targetPath, action: 'delete' })
  }

  if (fatalConflicts.length > 0 || conflicts.length > 0) {
    throw new InitConflictError([...fatalConflicts, ...conflicts].sort())
  }

  const created = pendingFiles.filter((file) => file.action === 'create').length
  const removed = pendingFiles.filter((file) => file.action === 'delete').length
  const updated = pendingFiles.filter((file) => file.action === 'update').length

  if (!dryRun) {
    for (const pendingFile of pendingFiles) {
      if (pendingFile.action === 'create') {
        await mkdir(path.dirname(pendingFile.targetPath), { recursive: true })
        await writeFile(pendingFile.targetPath, pendingFile.content)
      } else if (pendingFile.action === 'update') {
        await writeFile(pendingFile.targetPath, pendingFile.content)
      } else {
        await rm(pendingFile.targetPath)
      }
    }

    const parentDirectories = [
      ...new Set(
        pendingFiles
          .filter((file) => file.action === 'delete')
          .map((file) => path.dirname(file.targetPath)),
      ),
    ].sort((left, right) => right.length - left.length)
    for (const parentDirectory of parentDirectories) {
      await removeEmptyParents(parentDirectory, destination)
    }
  }

  return {
    agent: normalizedAgents.length === 1 ? normalizedAgents[0] : undefined,
    agents: normalizedAgents,
    created,
    removed,
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
        retainOnDisable: skillProjection.retainOnDisable ?? [],
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

function normalizeIntegrationAgents(agents) {
  const normalizedAgents = normalizeAgents(agents)
  if (normalizedAgents.includes('none')) {
    throw new TypeError('Agent "none" cannot be enabled or disabled.')
  }
  return normalizedAgents
}

async function assertInitializedProject(destination) {
  const configPath = path.join(destination, '.sparkwell', 'config.yaml')
  if ((await getPathState(configPath)) !== 'file') {
    throw new Error(
      `Sparkwell is not initialized in ${destination}. Run "sparkwell init" first.`,
    )
  }
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
      retainOnDisable: isRetainedSkill(
        templateSource,
        path.relative(templateSource.sourceRoot, absolutePath),
      ),
      relativePath: path.join(
        templateSource.destinationRoot,
        path.relative(templateSource.sourceRoot, absolutePath),
      ),
      content: await readFile(absolutePath),
    })
  }

  return files
}

function isRetainedSkill(templateSource, relativePath) {
  const skillName = relativePath.split(path.sep)[0]
  return templateSource.retainOnDisable?.includes(skillName) ?? false
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

function removeManagedSection(currentContent, templateContent, markers, force) {
  const currentText = currentContent.toString('utf8')
  const currentNormalized = currentText.replaceAll('\r\n', '\n')
  const currentBlock = findManagedBlock(currentNormalized, markers)

  if (currentBlock.status === 'absent') {
    const templateBlock = findManagedBlock(
      templateContent.toString('utf8').replaceAll('\r\n', '\n'),
      markers,
    )
    const legacyBody = templateBlock.lines.slice(1, -1).join('\n')
    if (normalizeText(currentContent) === normalizeText(Buffer.from(legacyBody))) {
      return { status: 'delete' }
    }
    return { status: 'unchanged' }
  }
  if (currentBlock.status === 'malformed' && !force) {
    return { status: 'malformed' }
  }

  let remaining
  if (currentBlock.status === 'malformed') {
    remaining = replaceMalformedManagedSection(
      currentNormalized,
      [],
      currentBlock,
    )
  } else {
    const lines = currentNormalized.split('\n')
    const before = lines
      .slice(0, currentBlock.startIndex)
      .join('\n')
      .replace(/\n+$/, '')
    const after = lines
      .slice(currentBlock.endIndex + 1)
      .join('\n')
      .replace(/^\n+|\n+$/g, '')
    remaining = [before, after].filter(Boolean).join('\n\n')
  }

  remaining = remaining.replace(/^\n+|\n+$/g, '')
  if (!remaining) {
    return { status: 'delete' }
  }

  const lineEnding = currentText.includes('\r\n') ? '\r\n' : '\n'
  return {
    status: 'update',
    content: Buffer.from(`${remaining.replaceAll('\n', lineEnding)}${lineEnding}`),
  }
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

async function removeEmptyParents(currentDirectory, stopDirectory) {
  const stop = path.resolve(stopDirectory)
  let current = path.resolve(currentDirectory)

  while (current !== stop && current.startsWith(`${stop}${path.sep}`)) {
    try {
      await rmdir(current)
    } catch (error) {
      if (error?.code === 'ENOENT') {
        current = path.dirname(current)
        continue
      }
      if (error?.code === 'ENOTEMPTY' || error?.code === 'EEXIST') {
        return
      }
      throw error
    }
    current = path.dirname(current)
  }
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