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
  assert.equal(result.created, 24)
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
    path.join(target, '.github', 'skills', 'spark-design', 'SKILL.md'),
    'file',
  )
  await assertPathExists(
    path.join(target, '.github', 'skills', 'spark-impl', 'SKILL.md'),
    'file',
  )
  await assertPathExists(
    path.join(target, '.github', 'skills', 'spark-config', 'SKILL.md'),
    'file',
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
  assert.equal(result.created, 24)
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
  assert.equal(result.created, 24)
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
  assert.equal(result.created, 43)
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

test('is idempotent when managed files are unchanged', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target })

  const result = await initializeProject({ destination: target })

  assert.equal(result.created, 0)
  assert.equal(result.updated, 0)
  assert.equal(result.unchanged, 24)
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

  assert.equal(result.created, 23)
  assert.equal(result.updated, 1)
  assert.ok(merged.startsWith(projectInstructions))
  assert.match(merged, /# Sparkwell Project Instructions/)
  assert.equal(countOccurrences(merged, '<!-- sparkwell:start -->'), 1)
  assert.equal(countOccurrences(merged, '<!-- sparkwell:end -->'), 1)

  const repeated = await initializeProject({ destination: target })
  assert.equal(repeated.updated, 0)
  assert.equal(repeated.unchanged, 24)
})

test('updates only the valid Sparkwell managed section', async (context) => {
  const target = await createTemporaryTarget(context)
  await initializeProject({ destination: target })
  const instructionsPath = path.join(target, '.github', 'copilot-instructions.md')
  const initialized = await readFile(instructionsPath, 'utf8')
  const customized = `# Team Instructions

Keep this content before SparkWell.

${initialized.replace(
  'SparkWell is opt-in through `/spark-design`, `/spark-config`, `/spark-impl`, and `/spark-test`. Each command runs only its named Agent Skill.',
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
  assert.match(refreshed, /SparkWell is opt-in through `\/spark-design`, `\/spark-config`, `\/spark-impl`, and `\/spark-test`\. Each command runs only its named Agent Skill\./)
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

  assert.ok(relativeFiles.includes('spark-impl/references/contract.md'))
  assert.ok(relativeFiles.includes('spark-config/SKILL.md'))
  assert.ok(relativeFiles.includes('spark-impl/references/api-service.md'))
  assert.ok(relativeFiles.includes('spark-impl/references/openapi-client.md'))
  assert.ok(relativeFiles.includes('spark-impl/references/android.md'))
  assert.ok(relativeFiles.includes('spark-impl/references/ios.md'))
  assert.ok(relativeFiles.includes('spark-test/references/web.md'))
  assert.ok(relativeFiles.includes('spark-test/references/windows.md'))
  assert.ok(relativeFiles.includes('spark-test/references/contract.md'))
  assert.ok(relativeFiles.includes('spark-test/references/api-service.md'))

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
  const sparkConfigSkill = await readFile(
    path.join(repositoryRoot, 'skills', 'spark-config', 'SKILL.md'),
    'utf8',
  )
  const contractReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-impl',
      'references',
      'contract.md',
    ),
    'utf8',
  )
  const apiServiceReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-impl',
      'references',
      'api-service.md',
    ),
    'utf8',
  )
  const openApiClientReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-impl',
      'references',
      'openapi-client.md',
    ),
    'utf8',
  )
  const webReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-impl',
      'references',
      'web.md',
    ),
    'utf8',
  )
  const windowsReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-impl',
      'references',
      'windows.md',
    ),
    'utf8',
  )
  const androidReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-impl',
      'references',
      'android.md',
    ),
    'utf8',
  )
  const iosReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-impl',
      'references',
      'ios.md',
    ),
    'utf8',
  )
  const apiServiceTestReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-test',
      'references',
      'api-service.md',
    ),
    'utf8',
  )
  const contractTestReference = await readFile(
    path.join(
      repositoryRoot,
      'skills',
      'spark-test',
      'references',
      'contract.md',
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
  assert.match(specification, /`-model` for `domain-model`, `-service` for `service`, and `-ui` for `ui-component`/)
  assert.match(specification, /This is a naming suggestion only/)
  assert.match(specification, /workflows must not infer kind, validity, applicability, or behavior from an ID suffix/)
  assert.match(specification, /Changing a Spark's kind does not by itself change its stable ID/)
  assert.match(specification, /minimum sufficient intent for correct review and realization/)
  assert.match(specification, /State each decision once in the Spark that owns it/)
  assert.doesNotMatch(specification, /project default/)
  assert.doesNotMatch(specification, /`(?:application|feature|workflow|screen|function|reusable-element)`/)
  assert.match(projectInstructions, /## Activation/)
  assert.match(projectInstructions, /SparkWell is opt-in through `\/spark-design`, `\/spark-config`, `\/spark-impl`, and `\/spark-test`/)
  assert.match(projectInstructions, /Each command runs only its named Agent Skill/)
  assert.doesNotMatch(projectInstructions, /use the normal coding-agent workflow/)
  assert.doesNotMatch(projectInstructions, /Mentioning Sparks or changing software intent/)
  assert.doesNotMatch(projectInstructions, /report the next slash command and stop/)
  assert.match(projectInstructions, /## Pending Proposals/)
  assert.match(projectInstructions, /use a host-provided decision UI when available/)
  assert.match(projectInstructions, /continue the latest unambiguous proposal only from a direct/)
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
  assert.match(usage, /use the host's decision UI when available; otherwise reply directly/)
  assert.match(usage, /Dismissing the UI or giving ambiguous approval/)
  assert.match(usage, /Propose a Spark map, then generate documents only after finalization/)
  assert.match(usage, /No Spark Documents, realization state, source code, tests, contracts, profiles, or proposal-state files are changed during this phase/)
  assert.match(usage, /`\/spark-config` \| Propose and finalize one implementation profile/)
  assert.match(usage, /Missing referenced guidance, unresolved consequential architecture, or conflicts make `\/spark-impl` \*\*Blocked\*\*/)
  assert.doesNotMatch(usage, /## Bypass SparkWell for a Task/)
  assert.match(contractReference, /A `service` Spark is applicable whenever it is in candidate scope/)
  assert.match(contractReference, /construct a transient Effective Service Definition/)
  assert.match(contractReference, /Do not persist it or add it to realization state/)
  assert.match(config, /contracts:\r?\n  root: src\/contracts\r?\n  service-format: openapi-3\.1/)
  assert.match(conventions, /Review must evaluate substance/)
  assert.match(conventions, /Before modifying Spark Documents, present a concise Spark Proposal in chat/)
  assert.match(conventions, /Proposal review and generated-document review are separate checkpoints/)
  assert.match(conventions, /\| Field \| Meaning \| Type \| Required \| Default \| Constraints \| Mutability \|/)
  assert.match(conventions, /\| Capability \| Purpose \| Inputs \| Output \| Failure Behavior \|/)
  assert.match(conventions, /whatever prose, lists, tables, or sections communicate that intent most clearly/)
  assert.match(conventions, /When `composes` is non-empty, explain any parent-child responsibilities/)
  assert.match(conventions, /Do not repeat the frontmatter summary as a Purpose section/)
  assert.match(conventions, /Include boundaries only when they resolve plausible ownership or scope ambiguity/)
  assert.doesNotMatch(conventions, /Every UI Component Spark body contains these sections in this order/)
  assert.doesNotMatch(conventions, /This component (receives no conceptual inputs|reports no interactions|owns no distinct observable states)/)
  assert.match(conventions, /Bundled SparkWell workflows support exactly these kinds/)
  assert.match(conventions, /\| `domain-model` \| `-model` \| `todo-item-model` \|/)
  assert.match(conventions, /\| `service` \| `-service` \| `todo-management-service` \|/)
  assert.match(conventions, /\| `ui-component` \| `-ui` \| `todo-entry-ui` \|/)
  assert.match(conventions, /\| Kind \| Suggested suffix \| Example ID \|/)
  assert.match(conventions, /They are optional naming hints/)
  assert.match(conventions, /Do not infer kind, validity, applicability, or behavior from a suffix/)
  assert.match(conventions, /Omit `service-exposure` when no model-derived public service/)
  assert.match(conventions, /non-empty, duplicate-free list containing only `create`, `get`, `list`, `update`, and `delete`/)
  assert.match(conventions, /must not cross any public service boundary/)
  assert.doesNotMatch(conventions, /project defaults/)
  assert.doesNotMatch(conventions, /`data-model`\s*$/m)
  assert.match(designSkill, /For `domain-model`, follow the standardized kind semantics/)
  assert.match(designSkill, /For `service`, follow the standardized kind semantics/)
  assert.match(designSkill, /Use the standardized `domain-model`, `service`, and `ui-component` kinds/)
  assert.match(designSkill, /identify a root `ui-component`/)
  assert.match(designSkill, /When it improves readability, consider `-model`/)
  assert.match(designSkill, /This is optional naming guidance/)
  assert.match(designSkill, /### Minimum Sufficient Intent/)
  assert.match(designSkill, /There is no target line count/)
  assert.match(designSkill, /### 5\. Prepare the Spark Proposal/)
  assert.match(designSkill, /For each proposed new Spark, provide only/)
  assert.match(designSkill, /For each proposed evolution, provide only/)
  assert.match(designSkill, /do not modify Spark Documents, realization state, source code, tests, contracts, profiles, or any other project file/)
  assert.match(designSkill, /present one complete replacement proposal/)
  assert.match(designSkill, /Handle a UI decision or direct control only when the latest complete proposal is unambiguously available/)
  assert.match(designSkill, /### 8\. Finalize Spark Documents/)
  assert.match(designSkill, /Before writing, re-read every affected existing Spark/)
  assert.match(designSkill, /present a revised complete proposal and wait for confirmation again/)
  assert.match(designSkill, /### 10\. Present Spark Documents for Review/)
  assert.match(designSkill, /does not bypass either review checkpoint/)
  assert.doesNotMatch(designSkill, /`(?:application|feature|workflow|screen|function|reusable-element)`/)
  assert.match(designExamples, /## UI Component Composition Versus Rendered Tree/)
  assert.match(designExamples, /`add-requested` interaction/)
  assert.match(designExamples, /## Domain Model and Standard Service Behavior/)
  assert.match(designExamples, /## Explicit Service Spark/)
  assert.match(designExamples, /id: todo-item-model/)
  assert.match(designExamples, /id: todo-management-service/)
  assert.match(designExamples, /# Todo Item\r?\n\r?\n## Data/)
  assert.match(designExamples, /# Todo Management\r?\n\r?\n## Capabilities/)
  assert.match(implementationProfiles, /`contracts\.root` is the project-relative folder where the Contract target writes contracts and other targets read them/)
  assert.match(implementationProfiles, /Profiles do not inherit and must not contain secrets/)
  assert.match(implementationProfiles, /## Project Implementation Guidance/)
  assert.match(implementationProfiles, /recommended location is `\.sparkwell\/guidance\/<profile-id>\.md`/)
  assert.match(implementationProfiles, /Every referenced guidance file must be read before implementation planning/)
  assert.match(implementationProfiles, /## Architecture Readiness/)
  assert.match(implementationProfiles, /A new runtime implementation requires a named profile/)
  assert.match(implementationProfiles, /## Resolution and Conflicts/)
  assert.match(implementationProfiles, /Profile-referenced project guidance/)
  assert.doesNotMatch(implementationProfiles, /`contract-root`/)
  assert.doesNotMatch(implementationProfiles, /`contract-source`/)
  assert.doesNotMatch(implementationSkill, /`contract-root`/)
  assert.match(implementationSkill, /do not infer a competing wire format/)
  assert.match(implementationSkill, /\[api-service\]\(\.\/references\/api-service\.md\)/)
  assert.match(implementationSkill, /\.\/references\/openapi-client\.md/)
  assert.match(implementationSkill, /must have an identifiable runtime component boundary/)
  assert.match(implementationSkill, /Have children report user intent or other outcomes to their owner/)
  assert.match(implementationSkill, /Every guidance file referenced by the selected profile/)
  assert.match(implementationSkill, /## Resolve Project Architecture/)
  assert.match(implementationSkill, /Established implementation/)
  assert.match(implementationSkill, /New implementation/)
  assert.match(implementationSkill, /Do not select MVC, MVVM, Clean Architecture/)
  assert.match(implementationSkill, /A new runtime implementation requires a named profile/)
  assert.match(implementationSkill, /`\/spark-impl` reads but never creates or edits implementation profiles or project guidance/)
  assert.match(implementationSkill, /present a concise Implementation Plan/)
  assert.doesNotMatch(implementationSkill, /suffix/i)
  assert.match(webReference, /framework-native component boundary/)
  assert.match(windowsReference, /framework-native view boundary/)
  for (const runtimeReference of [
    webReference,
    windowsReference,
    androidReference,
    iosReference,
    apiServiceReference,
  ]) {
    assert.match(runtimeReference, /## Architecture Boundary/)
    assert.match(runtimeReference, /direct the user to `\/spark-config`/)
  }
  assert.match(apiServiceReference, /A `ui-component` Spark is \*\*Not applicable\*\*/)
  assert.match(apiServiceReference, /Implement every selected contract operation by its `operationId`/)
  assert.match(apiServiceReference, /duplicate path and HTTP method pairs/)
  assert.match(apiServiceReference, /Do not reconstruct the public interface from Sparks/)
  assert.match(apiServiceReference, /The API Service owns the data-access code and provider-specific artifacts it needs/)
  assert.match(implementationSkill, /Keep persistence access and provider-specific artifacts in the current target/)
  assert.match(implementationSkill, /Mark an independently managed persistence boundary \*\*Blocked\*\*/)
  assert.match(openApiClientReference, /Select one contract operation by `operationId`/)
  assert.match(openApiClientReference, /Prefer established client-generation tooling/)
  assert.match(apiServiceTestReference, /Verify HTTP method, path, parameter location/)
  assert.doesNotMatch(testSkill, /suffix/i)
  assert.match(contractTestReference, /operations exactly match `service-exposure\.standard-operations`/)
  assert.match(contractTestReference, /Compare an updated contract with the existing interface/)
  assert.match(contractReference, /Record every generated or materially updated contract file in `\.sparkwell\/state\/realizations\/contract\.yaml`/)
  assert.doesNotMatch(contractReference, /profile's `source-root`|constraints\.service-format/)
  assert.match(realizationState, /Map each contract file to its source Sparks/)
  assert.match(realizationState, /- todo-list-ui/)
  assert.match(realizationState, /- todo-item-model/)
  assert.match(designExamples, /omit `service-exposure`/)
  for (const explicitSkill of [
    designSkill,
    sparkConfigSkill,
    implementationSkill,
    testSkill,
  ]) {
    assert.match(explicitSkill, /user-invocable: true/)
    assert.match(explicitSkill, /disable-model-invocation: true/)
    assert.match(explicitSkill, /description: 'User-invoked SparkWell workflow/)
  }
  assert.match(sparkConfigSkill, /name: spark-config/)
  assert.match(sparkConfigSkill, /## Prepare the Configuration Proposal/)
  assert.match(sparkConfigSkill, /During the proposal phase, do not modify `\.sparkwell\/config\.yaml`/)
  assert.match(sparkConfigSkill, /Handle a UI decision or direct control only when the latest complete Implementation Configuration Proposal is unambiguously available/)
  assert.match(sparkConfigSkill, /Before writing, re-read `\.sparkwell\/config\.yaml`/)
  assert.match(sparkConfigSkill, /Do not scaffold, compile, install, or generate product artifacts/)
  assert.match(sparkConfigSkill, /user must separately invoke `\/spark-impl`/)
  assert.match(designSkill, /user must explicitly invoke `\/spark-impl` or `\/spark-test`/)
  assert.match(implementationSkill, /tell the user to invoke `\/spark-design`\. Do not invoke it automatically/)
  assert.match(testSkill, /Do not invoke either workflow automatically/)
  assert.doesNotMatch(testSkill, /disabled placeholder/)
  assert.match(testSkill, /Do not modify production runtime artifacts/)

  for (const proposalSkill of [designSkill, sparkConfigSkill]) {
    assert.match(proposalSkill, /user-question tool such as `vscode_askQuestions`/)
    assert.match(proposalSkill, /decision UI offering exactly `Finalize`, `Revise`, and `Cancel`/)
    assert.match(proposalSkill, /Do not recommend or preselect `Finalize`/)
    assert.match(proposalSkill, /collect revision comments through the UI/)
    assert.match(proposalSkill, /If no suitable decision UI is available, ask the user to reply with `Revise: <comments>`, `Finalize`, or `Cancel`/)
    assert.match(proposalSkill, /If the UI is dismissed or returns no decision, stop without modifying files/)
  }
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