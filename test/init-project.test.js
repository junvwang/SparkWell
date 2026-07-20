import assert from 'node:assert/strict'
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { runCli } from '../scripts/cli.js'
import {
  InitConflictError,
  initializeProject,
  normalizeAgents,
  SUPPORTED_AGENTS,
} from '../scripts/init-project.js'

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))

test('initializes core contracts and GitHub Copilot workflows by default', async (context) => {
  const target = await createTemporaryTarget(context)

  const result = await initializeProject({ destination: target })

  assert.equal(result.agent, 'github-copilot')
  assert.equal(result.created, 18)
  assert.equal(result.updated, 0)
  assert.match(
    await readFile(path.join(target, '.sparkwell', 'config.yaml'), 'utf8'),
    /profiles:\s*\{\}/,
  )
  await assertPathExists(path.join(target, 'sparks'), 'directory')
  await assertPathExists(
    path.join(target, '.sparkwell', 'state', 'realizations'),
    'directory',
  )
  await assertPathExists(
    path.join(target, '.github', 'copilot-instructions.md'),
    'file',
  )
  const copilotInstructions = await readFile(
    path.join(target, '.github', 'copilot-instructions.md'),
    'utf8',
  )
  assert.equal(countOccurrences(copilotInstructions, '<!-- sparkwell:start -->'), 1)
  assert.equal(countOccurrences(copilotInstructions, '<!-- sparkwell:end -->'), 1)
  await assertPathExists(
    path.join(target, '.github', 'skills', 'design-sparks', 'SKILL.md'),
    'file',
  )
  await assertPathExists(
    path.join(target, '.github', 'skills', 'implement-sparks', 'SKILL.md'),
    'file',
  )
  assert.equal(
    await readFile(
      path.join(target, '.github', 'skills', 'design-sparks', 'SKILL.md'),
      'utf8',
    ),
    await readFile(
      path.join(repositoryRoot, 'skills', 'design-sparks', 'SKILL.md'),
      'utf8',
    ),
  )
})

test('supports an agent-neutral core-only initialization', async (context) => {
  const target = await createTemporaryTarget(context)

  const result = await initializeProject({
    destination: target,
    agent: 'none',
  })

  assert.equal(result.created, 5)
  await assertPathExists(path.join(target, '.sparkwell', 'specification.md'), 'file')
  await assert.rejects(access(path.join(target, '.github')), { code: 'ENOENT' })
})

test('initializes Claude Code instructions and shared skills', async (context) => {
  const target = await createTemporaryTarget(context)

  const result = await initializeProject({
    destination: target,
    agent: 'claude',
  })

  assert.equal(result.agent, 'claude-code')
  assert.deepEqual(result.agents, ['claude-code'])
  assert.equal(result.created, 18)
  await assertPathExists(path.join(target, 'CLAUDE.md'), 'file')
  await assertPathExists(
    path.join(target, '.claude', 'skills', 'design-sparks', 'SKILL.md'),
    'file',
  )
  await assert.rejects(access(path.join(target, '.github')), { code: 'ENOENT' })
})

test('initializes AGENTS.md-compatible instructions and skills', async (context) => {
  const target = await createTemporaryTarget(context)

  const result = await initializeProject({
    destination: target,
    agent: 'generic',
  })

  assert.equal(result.agent, 'agents-md')
  assert.equal(result.created, 18)
  await assertPathExists(path.join(target, 'AGENTS.md'), 'file')
  await assertPathExists(
    path.join(target, '.agents', 'skills', 'implement-sparks', 'SKILL.md'),
    'file',
  )
})

test('composes multiple selected agent adapters', async (context) => {
  const target = await createTemporaryTarget(context)

  const result = await initializeProject({
    destination: target,
    agents: ['copilot', 'claude-code'],
  })

  assert.equal(result.agent, undefined)
  assert.deepEqual(result.agents, ['github-copilot', 'claude-code'])
  assert.equal(result.created, 31)
  await assertPathExists(
    path.join(target, '.github', 'copilot-instructions.md'),
    'file',
  )
  await assertPathExists(path.join(target, 'CLAUDE.md'), 'file')
  await assertPathExists(
    path.join(target, '.github', 'skills', 'design-sparks', 'SKILL.md'),
    'file',
  )
  await assertPathExists(
    path.join(target, '.claude', 'skills', 'design-sparks', 'SKILL.md'),
    'file',
  )
})

test('discovers adapter ids and aliases from manifests', () => {
  assert.deepEqual(
    new Set(SUPPORTED_AGENTS),
    new Set(['agents-md', 'claude-code', 'github-copilot', 'none']),
  )
  assert.deepEqual(normalizeAgents(['agents', 'claude', 'copilot', 'copilot']), [
    'agents-md',
    'claude-code',
    'github-copilot',
  ])
  assert.throws(
    () => normalizeAgents(['none', 'claude']),
    /cannot be combined/,
  )
})

test('is idempotent when managed files are unchanged', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target })

  const result = await initializeProject({ destination: target })

  assert.equal(result.created, 0)
  assert.equal(result.updated, 0)
  assert.equal(result.unchanged, 18)
})

test('treats line-ending and final-newline differences as unchanged', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target, agent: 'none' })
  const specificationPath = path.join(target, '.sparkwell', 'specification.md')
  const specification = await readFile(specificationPath, 'utf8')
  await writeFile(
    specificationPath,
    specification
      .replaceAll('\r\n', '\n')
      .replaceAll('\n', '\r\n')
      .replace(/\r\n$/, ''),
  )

  const result = await initializeProject({ destination: target, agent: 'none' })

  assert.equal(result.updated, 0)
  assert.equal(result.unchanged, 5)
})

test('preserves project-owned implementation profiles on reinitialization', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target, agent: 'none' })
  const configPath = path.join(target, '.sparkwell', 'config.yaml')
  const configuredProfiles = `schema-version: 1

implementations:
  profiles:
    web-react:
      target: web
      source-root: src/web-react
`
  await writeFile(configPath, configuredProfiles)

  const result = await initializeProject({ destination: target, agent: 'none' })

  assert.equal(result.updated, 0)
  assert.equal(result.unchanged, 5)
  assert.equal(await readFile(configPath, 'utf8'), configuredProfiles)
})

test('appends a managed section to existing Copilot instructions', async (context) => {
  const target = await createTemporaryTarget(context)
  const instructionsPath = path.join(target, '.github', 'copilot-instructions.md')
  const projectInstructions = '# Project Instructions\n\nUse the project formatter.\n'
  await mkdir(path.dirname(instructionsPath), { recursive: true })
  await writeFile(instructionsPath, projectInstructions)

  const result = await initializeProject({ destination: target })
  const merged = await readFile(instructionsPath, 'utf8')

  assert.equal(result.created, 17)
  assert.equal(result.updated, 1)
  assert.ok(merged.startsWith(projectInstructions))
  assert.match(merged, /# Sparkwell Project Instructions/)
  assert.equal(countOccurrences(merged, '<!-- sparkwell:start -->'), 1)
  assert.equal(countOccurrences(merged, '<!-- sparkwell:end -->'), 1)

  const repeated = await initializeProject({ destination: target })
  assert.equal(repeated.updated, 0)
  assert.equal(repeated.unchanged, 18)
})

test('updates only the valid Sparkwell managed section', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target })
  const instructionsPath = path.join(target, '.github', 'copilot-instructions.md')
  const initialized = await readFile(instructionsPath, 'utf8')
  const customized = `# Team Instructions

Keep this content before SparkWell.

${initialized.replace(
  'This project is developed using **Sparkwell**.',
  'Outdated managed content.',
).trim()}

Keep this content after SparkWell.
`
  await writeFile(instructionsPath, customized)

  const result = await initializeProject({ destination: target })
  const refreshed = await readFile(instructionsPath, 'utf8')

  assert.equal(result.updated, 1)
  assert.match(refreshed, /Keep this content before SparkWell\./)
  assert.match(refreshed, /Keep this content after SparkWell\./)
  assert.match(refreshed, /This project is developed using \*\*Sparkwell\*\*\./)
  assert.doesNotMatch(refreshed, /Outdated managed content/)
  assert.equal(countOccurrences(refreshed, '<!-- sparkwell:start -->'), 1)
  assert.equal(countOccurrences(refreshed, '<!-- sparkwell:end -->'), 1)
})

test('wraps a legacy SparkWell-only instruction file without duplication', async (context) => {
  const target = await createTemporaryTarget(context)
  const instructionsPath = path.join(target, '.github', 'copilot-instructions.md')
  const templatePath = path.join(
    repositoryRoot,
    'core',
    'instructions',
    'sparkwell.md',
  )
  await mkdir(path.dirname(instructionsPath), { recursive: true })
  await writeFile(instructionsPath, await readFile(templatePath, 'utf8'))

  const result = await initializeProject({ destination: target })
  const migrated = await readFile(instructionsPath, 'utf8')

  assert.equal(result.updated, 1)
  assert.equal(countOccurrences(migrated, '# Sparkwell Project Instructions'), 1)
  assert.equal(countOccurrences(migrated, '<!-- sparkwell:start -->'), 1)
  assert.equal(countOccurrences(migrated, '<!-- sparkwell:end -->'), 1)
})

test('rejects malformed or duplicate Sparkwell markers before writing', async (context) => {
  for (const {
    malformedInstructions,
    preservedContent,
    preservedTrailingContent,
  } of [
    {
      malformedInstructions:
        '# Existing\n\n<!-- sparkwell:start -->\nUnclosed block\n',
      preservedContent: '# Existing',
    },
    {
      malformedInstructions:
        '# Before\n\n<!-- sparkwell:start -->\nOne\n<!-- sparkwell:start -->\nTwo\n<!-- sparkwell:end -->\n\n# After\n',
      preservedContent: '# Before\n\n',
      preservedTrailingContent: '# After',
    },
    {
      malformedInstructions:
        'Unopened block\n<!-- sparkwell:end -->\n\n# Existing after\n',
      preservedContent: '# Existing after',
    },
  ]) {
    const target = await createTemporaryTarget(context)
    const instructionsPath = path.join(
      target,
      '.github',
      'copilot-instructions.md',
    )
    await mkdir(path.dirname(instructionsPath), { recursive: true })
    await writeFile(instructionsPath, malformedInstructions)

    await assert.rejects(
      initializeProject({ destination: target }),
      (error) =>
        error instanceof InitConflictError &&
        error.conflicts.includes('.github/copilot-instructions.md'),
    )
    assert.equal(await readFile(instructionsPath, 'utf8'), malformedInstructions)
    await assert.rejects(access(path.join(target, '.sparkwell')), {
      code: 'ENOENT',
    })

    const repairedResult = await initializeProject({
      destination: target,
      force: true,
    })
    const repaired = await readFile(instructionsPath, 'utf8')
    assert.equal(repairedResult.updated, 1)
    assert.equal(countOccurrences(repaired, '<!-- sparkwell:start -->'), 1)
    assert.equal(countOccurrences(repaired, '<!-- sparkwell:end -->'), 1)
    assert.match(repaired, /# Sparkwell Project Instructions/)
    assert.ok(repaired.includes(preservedContent))
    if (preservedTrailingContent) {
      assert.ok(repaired.includes(preservedTrailingContent))
    }
  }
})

test('preflights conflicts and writes nothing without force', async (context) => {
  const target = await createTemporaryTarget(context)
  const specificationPath = path.join(target, '.sparkwell', 'specification.md')
  await mkdir(path.dirname(specificationPath), { recursive: true })
  await writeFile(specificationPath, 'conflicting specification\n')

  await assert.rejects(
    initializeProject({ destination: target, agent: 'none' }),
    (error) =>
      error instanceof InitConflictError &&
      error.conflicts.includes('.sparkwell/specification.md'),
  )

  assert.equal(
    await readFile(specificationPath, 'utf8'),
    'conflicting specification\n',
  )
  await assert.rejects(
    access(path.join(target, '.sparkwell', 'conventions.md')),
    { code: 'ENOENT' },
  )
})

test('force replaces only conflicting managed files', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target, agent: 'none' })
  const specificationPath = path.join(target, '.sparkwell', 'specification.md')
  const readmePath = path.join(target, 'README.md')
  await writeFile(specificationPath, 'conflicting specification\n')
  await writeFile(readmePath, 'Keep this project file.\n')

  const result = await initializeProject({
    destination: target,
    agent: 'none',
    force: true,
  })

  assert.equal(result.updated, 1)
  assert.match(
    await readFile(specificationPath, 'utf8'),
    /# Sparkwell Specification/,
  )
  assert.equal(await readFile(readmePath, 'utf8'), 'Keep this project file.\n')
})

test('dry-run reports changes without creating the destination', async (context) => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'sparkwell-test-'))
  const target = path.join(parent, 'new-project')
  context.after(() => rm(parent, { recursive: true, force: true }))

  const result = await initializeProject({
    destination: target,
    agent: 'none',
    dryRun: true,
  })

  assert.equal(result.dryRun, true)
  assert.equal(result.created, 5)
  await assert.rejects(access(target), { code: 'ENOENT' })
})

test('CLI accepts the copilot alias', async (context) => {
  const target = await createTemporaryTarget(context)
  const output = createOutputCapture()
  const errors = createOutputCapture()

  const exitCode = await runCli(
    ['init', target, '--agent', 'copilot'],
    { cwd: repositoryRoot, stdout: output, stderr: errors },
  )

  assert.equal(exitCode, 0)
  assert.match(output.text, /Agent integration: github-copilot/)
  assert.equal(errors.text, '')
})

test('CLI accepts repeated agent selections', async (context) => {
  const target = await createTemporaryTarget(context)
  const output = createOutputCapture()
  const errors = createOutputCapture()

  const exitCode = await runCli(
    ['init', target, '--agent', 'copilot', '--agent', 'claude'],
    { cwd: repositoryRoot, stdout: output, stderr: errors },
  )

  assert.equal(exitCode, 0)
  assert.match(
    output.text,
    /Agent integrations: github-copilot, claude-code/,
  )
  assert.equal(errors.text, '')
  await assertPathExists(path.join(target, 'CLAUDE.md'), 'file')
  await assertPathExists(
    path.join(target, '.github', 'copilot-instructions.md'),
    'file',
  )
})

test('CLI exposes initialization only', async () => {
  const output = createOutputCapture()
  const errors = createOutputCapture()

  const exitCode = await runCli(
    ['enable'],
    { cwd: repositoryRoot, stdout: output, stderr: errors },
  )

  assert.equal(exitCode, 1)
  assert.equal(output.text, '')
  assert.match(errors.text, /sparkwell init/)
  assert.doesNotMatch(errors.text, /sparkwell enable|sparkwell disable/)
})

test('canonical Agent Skills have valid metadata and project unchanged', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target })
  const skillsRoot = path.join(repositoryRoot, 'skills')
  const projectedRoot = path.join(target, '.github', 'skills')
  const relativeFiles = await collectRelativeFiles(skillsRoot)

  assert.ok(relativeFiles.includes('implement-sparks/references/android.md'))
  assert.ok(relativeFiles.includes('implement-sparks/references/ios.md'))
  assert.ok(relativeFiles.includes('test-sparks/references/web.md'))
  assert.ok(relativeFiles.includes('test-sparks/references/windows.md'))

  for (const relativeFile of relativeFiles) {
    assert.equal(
      await readFile(path.join(projectedRoot, relativeFile), 'utf8'),
      await readFile(path.join(skillsRoot, relativeFile), 'utf8'),
      relativeFile,
    )
  }

  const skillDirectories = await readdir(skillsRoot, { withFileTypes: true })
  for (const entry of skillDirectories.filter((item) => item.isDirectory())) {
    const skill = await readFile(
      path.join(skillsRoot, entry.name, 'SKILL.md'),
      'utf8',
    )
    const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    assert.ok(frontmatter, `${entry.name} has YAML frontmatter`)
    assert.match(frontmatter[1], new RegExp(`^name:\\s*${entry.name}$`, 'm'))
    assert.match(frontmatter[1], /^description:\s*.+$/m)
  }
})

test('core project templates preserve the methodology quality contract', async () => {
  const coreRoot = path.join(repositoryRoot, 'core', 'project', '.sparkwell')
  const files = (await readdir(coreRoot)).sort()
  assert.deepEqual(files, [
    'config.yaml',
    'conventions.md',
    'implementation-profiles.md',
    'realization-state.md',
    'specification.md',
  ])

  const specification = await readFile(
    path.join(coreRoot, 'specification.md'),
    'utf8',
  )
  const conventions = await readFile(
    path.join(coreRoot, 'conventions.md'),
    'utf8',
  )
  const testSkill = await readFile(
    path.join(repositoryRoot, 'skills', 'test-sparks', 'SKILL.md'),
    'utf8',
  )

  assert.match(specification, /Sparks are not summaries, subsets, or compressed copies/)
  assert.match(conventions, /Review must evaluate substance/)
  assert.doesNotMatch(testSkill, /disabled placeholder|disable-model-invocation/)
  assert.match(testSkill, /Do not modify production runtime artifacts/)
})

async function createTemporaryTarget(context) {
  const target = await mkdtemp(path.join(os.tmpdir(), 'sparkwell-test-'))
  context.after(() => rm(target, { recursive: true, force: true }))
  return target
}

async function assertPathExists(targetPath, expectedType) {
  const targetStat = await stat(targetPath)
  assert.equal(
    expectedType === 'directory' ? targetStat.isDirectory() : targetStat.isFile(),
    true,
    targetPath,
  )
}

function createOutputCapture() {
  return {
    text: '',
    write(chunk) {
      this.text += chunk
    },
  }
}

function countOccurrences(content, value) {
  return content.split(value).length - 1
}

async function collectRelativeFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(current, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectRelativeFiles(root, absolutePath)))
    } else if (entry.isFile()) {
      files.push(path.relative(root, absolutePath).split(path.sep).join('/'))
    }
  }
  return files
}