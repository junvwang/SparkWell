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
import { parsePackDefinition } from '../scripts/pack-registry.js'
import {
  InitConflictError,
  initializeProject,
  normalizeAgents,
  normalizePacks,
  SUPPORTED_AGENTS,
  SUPPORTED_PACKS,
} from '../scripts/init-project.js'

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))

test('initializes core contracts and GitHub Copilot workflows by default', async (context) => {
  const target = await createTemporaryTarget(context)

  const result = await initializeProject({ destination: target })

  assert.equal(result.agent, 'github-copilot')
  assert.deepEqual(result.packs, [])
  assert.equal(result.created, 14)
  assert.equal(result.updated, 0)
  assert.match(
    await readFile(path.join(target, '.sparkwell', 'config.yaml'), 'utf8'),
    /profiles:\s*\{\}/,
  )
  assert.match(
    await readFile(path.join(target, '.sparkwell', 'config.yaml'), 'utf8'),
    /#\s+web:\r?\n#\s+target: web\r?\n#\s+source-root: src\/web\r?\n#\s+packs: \{\}\r?\n#\s+guidance:/,
  )
  await assertPathExists(path.join(target, 'sparks'), 'directory')
  await assertPathExists(
    path.join(target, '.sparkwell', 'guidance'),
    'directory',
  )
  await assertPathExists(
    path.join(target, '.sparkwell', 'state', 'realizations'),
    'directory',
  )
  await assert.rejects(access(path.join(target, '.sparkwell', 'packs')), {
    code: 'ENOENT',
  })
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
    path.join(target, '.github', 'skills', 'spark-design', 'SKILL.md'),
    'file',
  )
  await assertPathExists(
    path.join(target, '.github', 'skills', 'spark-impl', 'SKILL.md'),
    'file',
  )
  await assert.rejects(
    access(path.join(target, '.github', 'skills', 'spark-config')),
    { code: 'ENOENT' },
  )
  assert.equal(
    await readFile(
      path.join(target, '.github', 'skills', 'spark-design', 'SKILL.md'),
      'utf8',
    ),
    await readFile(
      path.join(repositoryRoot, 'skills', 'spark-design', 'SKILL.md'),
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
  assert.equal(result.created, 14)
  await assertPathExists(path.join(target, 'CLAUDE.md'), 'file')
  await assertPathExists(
    path.join(target, '.claude', 'skills', 'spark-design', 'SKILL.md'),
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
  assert.equal(result.created, 14)
  await assertPathExists(path.join(target, 'AGENTS.md'), 'file')
  await assertPathExists(
    path.join(target, '.agents', 'skills', 'spark-impl', 'SKILL.md'),
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
  assert.equal(result.created, 23)
  await assertPathExists(
    path.join(target, '.github', 'copilot-instructions.md'),
    'file',
  )
  await assertPathExists(path.join(target, 'CLAUDE.md'), 'file')
  await assertPathExists(
    path.join(target, '.github', 'skills', 'spark-design', 'SKILL.md'),
    'file',
  )
  await assertPathExists(
    path.join(target, '.claude', 'skills', 'spark-design', 'SKILL.md'),
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

test('installs only explicitly selected implementation packs', async (context) => {
  const target = await createTemporaryTarget(context)
  const packRoot = path.join(repositoryRoot, 'packs', 'openapi')
  const packFiles = await collectRelativeFiles(packRoot)
  const packFileCount = packFiles.length

  assert.ok(packFiles.includes('PACK.md'))
  assert.ok(!packFiles.includes('pack.json'))

  const first = await initializeProject({
    destination: target,
    agent: 'none',
    packs: ['openapi', 'openapi'],
  })

  assert.deepEqual(first.packs, ['openapi'])
  assert.equal(first.created, 5 + packFileCount)
  for (const relativeFile of packFiles) {
    assert.equal(
      await readFile(
        path.join(target, '.sparkwell', 'packs', 'openapi', relativeFile),
        'utf8',
      ),
      await readFile(path.join(packRoot, relativeFile), 'utf8'),
      relativeFile,
    )
  }

  const second = await initializeProject({
    destination: target,
    agent: 'none',
    packs: ['openapi'],
  })
  assert.equal(second.created, 0)
  assert.equal(second.updated, 0)
  assert.equal(second.unchanged, 5 + packFileCount)
})

test('discovers implementation packs and rejects unknown ids', () => {
  assert.deepEqual(SUPPORTED_PACKS, ['openapi'])
  assert.deepEqual(normalizePacks(['openapi', 'openapi']), ['openapi'])
  assert.throws(() => normalizePacks(['unknown']), /Unsupported implementation pack/)
})

test('parses and validates implementation pack frontmatter', () => {
  const valid = `---
id: example-pack
description: 'Example implementation pack.'
schema-version: 1
---

# Example Pack
`

  assert.deepEqual(parsePackDefinition(valid, 'example-pack'), {
    id: 'example-pack',
    description: 'Example implementation pack.',
    schemaVersion: 1,
  })
  assert.throws(
    () => parsePackDefinition('# Missing frontmatter\n', 'example-pack'),
    /must begin with YAML frontmatter/,
  )
  assert.throws(
    () => parsePackDefinition(valid.replace('id: example-pack', 'id: other'), 'example-pack'),
    /id must match/,
  )
  assert.throws(
    () => parsePackDefinition(valid.replace('schema-version: 1', 'schema-version: 2'), 'example-pack'),
    /unsupported schema-version/,
  )
  assert.throws(
    () => parsePackDefinition(valid.replace('description:', 'id: example-pack\ndescription:'), 'example-pack'),
    /duplicate id/,
  )
})

test('is idempotent when managed files are unchanged', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target })

  const result = await initializeProject({ destination: target })

  assert.equal(result.created, 0)
  assert.equal(result.updated, 0)
  assert.equal(result.unchanged, 14)
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

test('preserves project-owned configuration and conventions on reinitialization', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target, agent: 'none' })
  const configPath = path.join(target, '.sparkwell', 'config.yaml')
  const conventionsPath = path.join(target, '.sparkwell', 'conventions.md')
  const configuredProfiles = `schema-version: 1

implementations:
  profiles:
    web-react:
      target: web
      source-root: src/web-react
`
  await writeFile(configPath, configuredProfiles)
  await writeFile(conventionsPath, '# Project Spark Document Conventions\n')

  const result = await initializeProject({ destination: target, agent: 'none' })

  assert.equal(result.updated, 0)
  assert.equal(result.unchanged, 5)
  assert.equal(await readFile(configPath, 'utf8'), configuredProfiles)
  assert.equal(
    await readFile(conventionsPath, 'utf8'),
    '# Project Spark Document Conventions\n',
  )
})

test('appends a managed section to existing Copilot instructions', async (context) => {
  const target = await createTemporaryTarget(context)
  const instructionsPath = path.join(target, '.github', 'copilot-instructions.md')
  const projectInstructions = '# Project Instructions\n\nUse the project formatter.\n'
  await mkdir(path.dirname(instructionsPath), { recursive: true })
  await writeFile(instructionsPath, projectInstructions)

  const result = await initializeProject({ destination: target })
  const merged = await readFile(instructionsPath, 'utf8')

  assert.equal(result.created, 13)
  assert.equal(result.updated, 1)
  assert.ok(merged.startsWith(projectInstructions))
  assert.match(merged, /# Sparkwell Project Instructions/)
  assert.equal(countOccurrences(merged, '<!-- sparkwell:start -->'), 1)
  assert.equal(countOccurrences(merged, '<!-- sparkwell:end -->'), 1)

  const repeated = await initializeProject({ destination: target })
  assert.equal(repeated.updated, 0)
  assert.equal(repeated.unchanged, 14)
})

test('updates only the valid Sparkwell managed section', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target })
  const instructionsPath = path.join(target, '.github', 'copilot-instructions.md')
  const initialized = await readFile(instructionsPath, 'utf8')
  const customized = `# Team Instructions

Keep this content before SparkWell.

${initialized.replace(
  'SparkWell is opt-in through `/spark-design`, `/spark-impl`, and `/spark-test`. Each command runs only its named Agent Skill.',
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
  assert.match(refreshed, /SparkWell is opt-in through `\/spark-design`, `\/spark-impl`, and `\/spark-test`\. Each command runs only its named Agent Skill\./)
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

test('CLI installs repeated implementation pack selections once', async (context) => {
  const target = await createTemporaryTarget(context)
  const output = createOutputCapture()
  const errors = createOutputCapture()

  const exitCode = await runCli(
    ['init', target, '--agent', 'none', '--pack', 'openapi', '--pack', 'openapi'],
    { cwd: repositoryRoot, stdout: output, stderr: errors },
  )

  assert.equal(exitCode, 0)
  assert.match(output.text, /Implementation packs: openapi/)
  assert.equal(errors.text, '')
  await assertPathExists(
    path.join(target, '.sparkwell', 'packs', 'openapi', 'PACK.md'),
    'file',
  )
})

test('CLI rejects unknown implementation packs', async () => {
  const output = createOutputCapture()
  const errors = createOutputCapture()

  const exitCode = await runCli(
    ['init', '.', '--pack', 'unknown'],
    { cwd: repositoryRoot, stdout: output, stderr: errors },
  )

  assert.equal(exitCode, 1)
  assert.equal(output.text, '')
  assert.match(errors.text, /Unsupported implementation pack: unknown/)
  assert.match(errors.text, /Supported implementation packs: openapi/)
})

test('CLI help lists optional implementation packs', async () => {
  const output = createOutputCapture()
  const errors = createOutputCapture()

  const exitCode = await runCli(
    ['--help'],
    { cwd: repositoryRoot, stdout: output, stderr: errors },
  )

  assert.equal(exitCode, 0)
  assert.match(output.text, /--pack <id>/)
  assert.match(output.text, /Supported: openapi/)
  assert.equal(errors.text, '')
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

  assert.ok(!relativeFiles.some((relativeFile) => relativeFile.startsWith('spark-config/')))
  assert.ok(!relativeFiles.some((relativeFile) => relativeFile.startsWith('spark-impl/references/')))
  assert.ok(relativeFiles.includes('spark-test/references/web.md'))
  assert.ok(relativeFiles.includes('spark-test/references/windows.md'))
  assert.ok(!relativeFiles.some((relativeFile) => /contract|openapi|api-service/.test(relativeFile)))

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
  const projectInstructions = await readFile(
    path.join(repositoryRoot, 'core', 'instructions', 'sparkwell.md'),
    'utf8',
  )
  const readme = await readFile(
    path.join(repositoryRoot, 'README.md'),
    'utf8',
  )
  const usage = await readFile(
    path.join(repositoryRoot, 'docs', 'usage.md'),
    'utf8',
  )
  const implementationPacks = await readFile(
    path.join(repositoryRoot, 'docs', 'implementation-packs.md'),
    'utf8',
  )
  const config = await readFile(
    path.join(coreRoot, 'config.yaml'),
    'utf8',
  )
  const conventions = await readFile(
    path.join(coreRoot, 'conventions.md'),
    'utf8',
  )
  const implementationProfiles = await readFile(
    path.join(coreRoot, 'implementation-profiles.md'),
    'utf8',
  )
  const realizationState = await readFile(
    path.join(coreRoot, 'realization-state.md'),
    'utf8',
  )
  const implementationSkill = await readFile(
    path.join(repositoryRoot, 'skills', 'spark-impl', 'SKILL.md'),
    'utf8',
  )
  const openApiPack = await readFile(
    path.join(repositoryRoot, 'packs', 'openapi', 'PACK.md'),
    'utf8',
  )
  const contractReference = await readFile(
    path.join(
      repositoryRoot,
      'packs',
      'openapi',
      'references',
      'openapi-contract.md',
    ),
    'utf8',
  )
  const apiServiceReference = await readFile(
    path.join(
      repositoryRoot,
      'packs',
      'openapi',
      'references',
      'api-service.md',
    ),
    'utf8',
  )
  const openApiClientReference = await readFile(
    path.join(
      repositoryRoot,
      'packs',
      'openapi',
      'references',
      'openapi-client.md',
    ),
    'utf8',
  )
  const apiServiceTestReference = await readFile(
    path.join(
      repositoryRoot,
      'packs',
      'openapi',
      'references',
      'api-service-test.md',
    ),
    'utf8',
  )
  const contractTestReference = await readFile(
    path.join(
      repositoryRoot,
      'packs',
      'openapi',
      'references',
      'openapi-contract-test.md',
    ),
    'utf8',
  )
  const testSkill = await readFile(
    path.join(repositoryRoot, 'skills', 'spark-test', 'SKILL.md'),
    'utf8',
  )
  const designSkill = await readFile(
    path.join(repositoryRoot, 'skills', 'spark-design', 'SKILL.md'),
    'utf8',
  )
  const designExamples = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-design',
      'references',
      'examples.md',
    ),
    'utf8',
  )

  assert.match(specification, /Sparks are not summaries, subsets, or compressed copies/)
  assert.match(specification, /kind: domain-model/)
  assert.match(specification, /DTOs, API schemas, ORM entities, database records/)
  assert.match(specification, /A Spark with `kind: service`/)
  assert.match(specification, /A Spark with `kind: ui-component`/)
  assert.match(specification, /support exactly these standardized kinds/)
  assert.doesNotMatch(specification, /Suggested suffix|naming suggestion|ID suffix/)
  assert.match(specification, /Changing a Spark's kind does not by itself change its stable ID/)
  assert.match(specification, /minimum sufficient intent for correct review and realization/)
  assert.match(specification, /State each decision once in the Spark that owns it/)
  assert.match(specification, /familiar create, retrieve, update, or delete capabilities are explicit Service intent/)
  assert.doesNotMatch(specification, /service-exposure|OpenAPI|contracts\.root/)
  assert.doesNotMatch(specification, /project default/)
  assert.doesNotMatch(specification, /`(?:application|feature|workflow|screen|function|reusable-element)`/)
  assert.match(projectInstructions, /## Activation/)
  assert.match(projectInstructions, /SparkWell is opt-in through `\/spark-design`, `\/spark-impl`, and `\/spark-test`/)
  assert.doesNotMatch(projectInstructions, /spark-config/)
  assert.match(projectInstructions, /Each command runs only its named Agent Skill/)
  assert.doesNotMatch(projectInstructions, /use the normal coding-agent workflow/)
  assert.doesNotMatch(projectInstructions, /Mentioning Sparks or changing software intent/)
  assert.doesNotMatch(projectInstructions, /report the next slash command and stop/)
  assert.match(projectInstructions, /## Pending Design Proposal/)
  assert.match(projectInstructions, /use a host-provided decision UI when available/)
  assert.match(projectInstructions, /continue the latest unambiguous Spark Proposal only from a direct/)
  assert.match(projectInstructions, /`Revise: <comments>`/)
  assert.match(projectInstructions, /`Finalize`/)
  assert.match(projectInstructions, /`Cancel`/)
  assert.match(projectInstructions, /UI dismissal, silence, and other feedback do not finalize a proposal/)
  assert.match(projectInstructions, /Keep proposal and approval state in chat only/)
  assert.doesNotMatch(projectInstructions, /For product development, follow the Spark-first workflow/)
  assert.doesNotMatch(projectInstructions, /# Working in a Sparkwell Project/)
  assert.doesNotMatch(projectInstructions, /# Guiding Principles/)
  assert.match(readme, /SparkWell is opt-in/)
  assert.match(readme, /When the host provides a decision UI, choose `Revise`, `Finalize`, or `Cancel`/)
  assert.match(readme, /choosing `Revise` opens a prompt for comments/)
  assert.match(readme, /Each slash command activates only that workflow for the current request/)
  assert.match(readme, /It first presents a concise Spark Proposal in chat/)
  assert.match(readme, /It does not modify files before confirmation/)
  assert.match(readme, /Finalized documents then receive a second human review/)
  assert.match(readme, /SparkWell provides the shared realization process, not a universal project architecture/)
  assert.match(usage, /## Explicit Activation/)
  assert.match(usage, /SparkWell is inactive by default/)
  assert.match(usage, /agent-neutral SparkWell Core files/)
  assert.doesNotMatch(usage, /reviewed Sparks|reviewed Spark intent/i)
  assert.match(usage, /use the host's decision UI when available; otherwise reply directly/)
  assert.match(usage, /Dismissing the UI or giving ambiguous approval/)
  assert.match(usage, /Propose a Spark map, then generate documents only after finalization/)
  assert.match(usage, /No Spark Documents, realization state, source code, tests, contracts, profiles, or proposal-state files are changed during this phase/)
  assert.doesNotMatch(usage, /`\/spark-config`|Implementation Configuration Proposal/)
  assert.match(usage, /A missing selected pack, missing referenced guidance, unresolved consequential architecture, or conflict makes `\/spark-impl` \*\*Blocked\*\*/)
  assert.doesNotMatch(usage, /## Bypass SparkWell for a Task/)
  assert.match(contractReference, /A `service` Spark is applicable and produces one contract/)
  assert.match(contractReference, /construct a transient Effective Service Definition/)
  assert.match(contractReference, /Do not persist it or add it to realization state/)
  assert.match(config, /schema-version: 1\r?\n\r?\nimplementations:\r?\n  profiles: \{\}/)
  assert.doesNotMatch(config, /contracts:|openapi/i)
  assert.match(conventions, /# Spark Document Conventions/)
  assert.match(conventions, /This project-owned document defines Spark Document storage, naming, serialization, and kind-specific format/)
  assert.match(conventions, /The `\/spark-design` Skill owns proposal, finalization, and review workflow/)
  assert.doesNotMatch(conventions, /# Proposal, Creation, and Review|Spark Proposal|explicit finalization/)
  assert.match(conventions, /\| Field \| Meaning \| Type \| Required \| Default \| Constraints \| Mutability \|/)
  assert.match(conventions, /\| Capability \| Purpose \| Inputs \| Output \| Failure Behavior \|/)
  assert.match(conventions, /whatever prose, lists, tables, or sections communicate the applicable intent from the Spark Specification most clearly/)
  assert.match(conventions, /When `composes` is non-empty, explain any parent-child responsibilities/)
  assert.match(conventions, /Do not repeat the frontmatter summary as a Purpose section/)
  assert.match(conventions, /Include boundaries only when they resolve plausible ownership or scope ambiguity/)
  assert.doesNotMatch(conventions, /Every UI Component Spark body contains these sections in this order/)
  assert.doesNotMatch(conventions, /This component (receives no conceptual inputs|reports no interactions|owns no distinct observable states)/)
  assert.match(conventions, /\| `domain-model` \| `-model` \| `todo-item-model` \|/)
  assert.match(conventions, /\| `service` \| `-service` \| `todo-management-service` \|/)
  assert.match(conventions, /\| `ui-component` \| `-ui` \| `todo-entry-ui` \|/)
  assert.match(conventions, /\| Kind \| Suggested suffix \| Example ID \|/)
  assert.match(conventions, /They are optional naming hints/)
  assert.match(conventions, /Do not infer kind, validity, applicability, or behavior from a suffix/)
  assert.match(conventions, /Never infer capability rows from a Domain Model/)
  assert.doesNotMatch(conventions, /service-exposure|OpenAPI|contracts\.root/)
  assert.doesNotMatch(conventions, /project defaults/)
  assert.doesNotMatch(conventions, /`data-model`\s*$/m)
  assert.match(designSkill, /The Specification owns semantics; Conventions own representation/)
  assert.match(designSkill, /## Classify the Request/)
  assert.match(designSkill, /No Spark change/)
  assert.match(designSkill, /Clarify/)
  assert.match(designSkill, /## Design/)
  assert.match(designSkill, /\[granularity guide\]\(\.\/references\/granularity\.md\)/)
  assert.match(designSkill, /\[worked examples\]\(\.\/references\/examples\.md\)/)
  assert.match(designSkill, /minimum sufficient intent/)
  assert.match(designSkill, /Do not turn DTOs, endpoints, framework components, controls, tables/)
  assert.match(designSkill, /## Proposal Checkpoint/)
  assert.match(designSkill, /Before modifying any file, present one complete, concise Spark Proposal/)
  assert.match(designSkill, /new Sparks: ID, kind, and one-sentence `summary`/)
  assert.match(designSkill, /`Finalize` approves the latest Proposal and permits applying it to Spark Documents/)
  assert.match(designSkill, /It does not approve the generated documents or start implementation/)
  assert.match(designSkill, /`Revise` collects comments and returns one rechecked, complete replacement Proposal without writing files/)
  assert.match(designSkill, /Act only when the latest complete Proposal is unambiguous/)
  assert.match(designSkill, /Keep Proposal and approval state in chat only/)
  assert.match(designSkill, /## Apply the Proposal/)
  assert.match(designSkill, /After `Finalize`, re-read affected Sparks/)
  assert.match(designSkill, /present a revised complete Proposal and require confirmation again/)
  assert.match(designSkill, /Apply only the confirmed create, evolve, rename, kind-change, and removal scope/)
  assert.match(designSkill, /Do not modify engineering artifacts, profiles, guidance, or realization state/)
  assert.match(designSkill, /## Validate and Report/)
  assert.match(designSkill, /the written changes match the confirmed Proposal/)
  assert.match(designSkill, /stop for human review of the generated Spark Documents/)
  assert.match(designSkill, /does not bypass either review checkpoint/)
  assert.doesNotMatch(designSkill, /`(?:application|feature|workflow|screen|function|reusable-element)`/)
  assert.match(designExamples, /## UI Component Composition Versus Rendered Tree/)
  assert.match(designExamples, /`add-requested` interaction/)
  assert.match(designExamples, /## Domain Model and Service Boundaries/)
  assert.match(designExamples, /## Explicit Service Spark/)
  assert.match(designExamples, /id: todo-item-model/)
  assert.match(designExamples, /id: todo-management-service/)
  assert.match(designExamples, /# Todo Item\r?\n\r?\n## Data/)
  assert.match(designExamples, /# Todo Management\r?\n\r?\n## Capabilities/)
  assert.match(implementationProfiles, /Profiles do not inherit and must not contain secrets/)
  assert.match(implementationProfiles, /YAML is limited to information that workflows must parse deterministically/)
  assert.match(implementationProfiles, /Map of activated pack IDs to pack-owned configuration/)
  assert.doesNotMatch(implementationProfiles, /Profile `constraints`|Profile `preferences`|\bconstraints:\s*$|\bpreferences:\s*$/m)
  assert.match(implementationProfiles, /## Implementation Packs/)
  assert.match(implementationProfiles, /Installation alone does not activate a pack/)
  assert.match(implementationProfiles, /\.sparkwell\/packs\/<pack-id>\/PACK\.md/)
  assert.match(implementationProfiles, /Pack requirements cannot be overridden by project guidance/)
  assert.match(implementationProfiles, /Pack references must remain inside that pack's directory/)
  assert.match(implementationProfiles, /## Project Implementation Guidance/)
  assert.match(implementationProfiles, /recommended location is `\.sparkwell\/guidance\/<profile-id>\.md`/)
  assert.match(implementationProfiles, /Every referenced guidance file must be read before implementation planning/)
  assert.match(implementationProfiles, /## Architecture Readiness/)
  assert.match(implementationProfiles, /A new runtime implementation requires a named profile/)
  assert.match(implementationProfiles, /Profiles and guidance are project-owned inputs maintained manually or with ordinary coding-agent assistance/)
  assert.doesNotMatch(implementationProfiles, /spark-config/)
  assert.match(implementationProfiles, /## Resolution and Conflicts/)
  assert.match(implementationProfiles, /authoritative order for implementation decisions/)
  assert.match(implementationProfiles, /The order applies only to compatible decisions/)
  assert.match(implementationProfiles, /Profile-referenced project guidance/)
  assert.match(implementationProfiles, /## Decision Boundaries/)
  assert.match(implementationProfiles, /\| Sparks \| Product behavior, domain rules, observable states and failures/)
  assert.match(implementationProfiles, /\| Profile \| Target and artifact routing, Pack activation/)
  assert.match(implementationProfiles, /\| Project guidance \| Architecture, mappings, data flow/)
  assert.match(implementationProfiles, /\| Implementation packs \| Reusable technology-specific realization and validation rules/)
  assert.doesNotMatch(implementationProfiles, /Reviewed Sparks|SQLite[^\n]+profile or guidance/)
  assert.match(implementationProfiles, /Packs own technology-specific realization and validation, not observable product behavior/)
  assert.doesNotMatch(implementationProfiles, /contracts\.root|openapi-3\.1|Contract target/)
  assert.doesNotMatch(implementationProfiles, /`contract-root`/)
  assert.doesNotMatch(implementationProfiles, /`contract-source`/)
  assert.doesNotMatch(implementationSkill, /`contract-root`/)
  assert.match(implementationSkill, /\.sparkwell\/packs\/<pack-id>\/PACK\.md/)
  assert.match(implementationSkill, /Apply the authoritative \*\*Resolution and Conflicts\*\* order from `\.sparkwell\/implementation-profiles\.md`/)
  assert.doesNotMatch(implementationSkill, /Apply decisions in this order/)
  assert.match(implementationSkill, /Installed Packs are inactive unless selected by the profile/)
  assert.doesNotMatch(implementationSkill, /Profile constraints|constraints, preferences|profile constraints and guidance/i)
  assert.match(implementationSkill, /Validate every selected Pack's required fields and cross-profile references/)
  assert.match(implementationSkill, /Reject absolute paths, `\.\.` components, paths outside the project root/)
  assert.doesNotMatch(implementationSkill, /OpenAPI|contracts\.root|\.\/references\/<target>\.md|Bundled target guidance/)
  assert.match(implementationSkill, /one identifiable runtime boundary for each applicable root and composed child/)
  assert.match(implementationSkill, /owner supplies child information, handles child outcomes, and owns cross-child coordination/)
  assert.match(implementationSkill, /Every guidance file referenced by the profile/)
  assert.match(implementationSkill, /A new implementation requires a named profile and complete project guidance/)
  assert.match(implementationSkill, /Do not choose or migrate architecture, framework, state ownership, persistence, synchronization, dependency injection, or module structure/)
  assert.match(implementationSkill, /Treat material platform-specific quality, lifecycle, permission, packaging, and validation rules as Spark intent, project guidance, Pack rules, or established native configuration/)
  assert.match(implementationSkill, /Do not modify Sparks, profiles, guidance, Packs, tests, test infrastructure, or diagrams/)
  assert.match(implementationSkill, /Before editing, present a concise Implementation Plan/)
  assert.doesNotMatch(implementationSkill, /suffix/i)
  assert.match(apiServiceReference, /A `ui-component` Spark is \*\*Not applicable\*\*/)
  assert.match(apiServiceReference, /Implement every selected operation by `operationId`/)
  assert.match(apiServiceReference, /duplicate path and HTTP method pairs/)
  assert.match(apiServiceReference, /Do not reconstruct a public interface from Sparks/)
  assert.match(apiServiceReference, /packs\.openapi\.contract-profile/)
  assert.match(implementationSkill, /Maintain `\.sparkwell\/state\/realizations\/<implementation-id>\.yaml`/)
  assert.match(implementationSkill, /treat mappings as provenance, not ownership or overwrite permission/)
  assert.match(openApiClientReference, /Select one unique `operationId`/)
  assert.match(openApiClientReference, /Prefer established client-generation tooling/)
  assert.match(apiServiceTestReference, /Verify method, path, parameter location/)
  assert.doesNotMatch(testSkill, /suffix/i)
  assert.match(contractTestReference, /one operation per Service capability/)
  assert.match(contractTestReference, /Compare updates with the existing interface/)
  assert.match(contractReference, /Record every generated or materially updated file in `\.sparkwell\/state\/realizations\/<implementation-id>\.yaml`/)
  assert.match(contractReference, /selected producer profile's `source-root`/)
  assert.match(openApiPack, /never publishes a Domain Model or derives CRUD operations merely because a model exists/)
  assert.match(openApiPack, /^---\r?\nid: openapi\r?\ndescription: .+\r?\nschema-version: 1\r?\n---/)
  assert.match(openApiPack, /target: openapi-contract/)
  assert.match(openApiPack, /packs\.openapi\.contract-profile/)
  assert.match(openApiPack, /require `packs\.openapi\.version: '3\.1'`/)
  assert.match(openApiPack, /These are pack-owned configuration requirements/)
  assert.doesNotMatch(openApiPack, /\bconstraints\b|\bpreferences\b/)
  assert.doesNotMatch(openApiPack, /\t/)
  assert.match(realizationState, /Map each artifact to every Spark whose intent it materially realizes/)
  assert.match(realizationState, /implementation packs may define more specific artifact-granularity rules/)
  assert.match(realizationState, /- todo-list-ui/)
  assert.match(realizationState, /- todo-item-model/)
  assert.match(designExamples, /create a Service Spark and state each public capability explicitly/)
  assert.doesNotMatch(designExamples, /service-exposure/)
  for (const explicitSkill of [
    designSkill,
    implementationSkill,
    testSkill,
  ]) {
    assert.match(explicitSkill, /user-invocable: true/)
    assert.match(explicitSkill, /disable-model-invocation: true/)
    assert.match(explicitSkill, /description: 'User-invoked SparkWell workflow/)
  }
  assert.match(designSkill, /user must explicitly invoke `\/spark-impl` or `\/spark-test`/)
  assert.match(implementationSkill, /tell the user to invoke `\/spark-design`; never invoke it automatically/)
  assert.match(testSkill, /Do not invoke either workflow automatically/)
  assert.doesNotMatch(testSkill, /disabled placeholder/)
  assert.match(testSkill, /Do not modify production runtime artifacts/)
  assert.match(testSkill, /Installed packs are inactive unless the selected profile lists them/)
  assert.doesNotMatch(testSkill, /Profile constraints|profile preferences/i)
  assert.match(testSkill, /Validate every pack-defined required field, value, and cross-profile reference/)
  assert.match(testSkill, /Reject absolute paths, `\.\.` components/)
  assert.match(implementationPacks, /## Migration From the Former Contract Model/)
  assert.match(implementationPacks, /Projects own:/)
  assert.match(implementationPacks, /Packs own reusable technology-specific/)
  assert.doesNotMatch(implementationPacks, /Reviewed Sparks|reviewed Service Spark/)
  assert.match(implementationPacks, /Replace Domain Model `service-exposure` with explicit Service capabilities/)
  assert.match(implementationPacks, /\| `create-todo` \|/)

  assert.match(designSkill, /user-question tool such as `vscode_askQuestions`/)
  assert.match(designSkill, /offering exactly `Finalize`, `Revise`, and `Cancel`/)
  assert.match(designSkill, /Do not recommend or preselect `Finalize`/)
  assert.match(designSkill, /If no suitable UI is available, accept a direct `Revise: <comments>`, `Finalize`, or `Cancel` reply/)
  assert.match(designSkill, /UI dismissal, silence, generic approval, or a control without a pending Proposal changes nothing/)
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