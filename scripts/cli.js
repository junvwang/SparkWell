import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import {
  disableProject,
  enableProject,
  InitConflictError,
  initializeProject,
  normalizeAgents,
  SUPPORTED_AGENTS,
} from './init-project.js'

const usage = `Usage:
  sparkwell init [directory] [options]
  sparkwell enable [directory] [options]
  sparkwell disable [directory] [options]

Options:
  --agent <name>  Coding-agent integration; repeat for multiple agents
                  Supported: ${SUPPORTED_AGENTS.join(', ')}
  --dry-run       Show planned changes without writing files
  --force         Overwrite conflicting Sparkwell-managed files
  --help, -h      Show this help
  --version, -v   Show the CLI version`

export async function runCli(args, environment = {}) {
  const cwd = environment.cwd ?? process.cwd()
  const stdout = environment.stdout ?? process.stdout
  const stderr = environment.stderr ?? process.stderr

  try {
    const parsed = parseArgs({
      args,
      allowPositionals: true,
      strict: true,
      options: {
        agent: { type: 'string', multiple: true },
        'dry-run': { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    })

    if (parsed.values.version) {
      const packageJson = JSON.parse(
        await readFile(new URL('../package.json', import.meta.url), 'utf8'),
      )
      stdout.write(`${packageJson.version}\n`)
      return 0
    }

    if (parsed.values.help) {
      stdout.write(`${usage}\n`)
      return 0
    }

    const [command, destinationArgument, ...extraPositionals] =
      parsed.positionals

    if (!['init', 'enable', 'disable'].includes(command) || extraPositionals.length > 0) {
      stderr.write(`${usage}\n`)
      return 1
    }

    const agents = normalizeAgents(parsed.values.agent)
    const destination = path.resolve(cwd, destinationArgument ?? '.')
    const operation = {
      init: initializeProject,
      enable: enableProject,
      disable: disableProject,
    }[command]
    const result = await operation({
      destination,
      agents,
      dryRun: parsed.values['dry-run'],
      force: parsed.values.force,
    })

    const action = {
      init: result.dryRun ? 'Would initialize' : 'Initialized',
      enable: result.dryRun ? 'Would enable' : 'Enabled',
      disable: result.dryRun ? 'Would disable' : 'Disabled',
    }[command]
    stdout.write(`${action} Sparkwell in ${destination}\n`)
    const integrationLabel = agents.length === 1 ? 'integration' : 'integrations'
    stdout.write(`Agent ${integrationLabel}: ${agents.join(', ')}\n`)
    if (command === 'disable') {
      stdout.write(
        `Files: ${result.created} created, ${result.removed} removed, ${result.updated} updated, ${result.unchanged} unchanged\n`,
      )
    } else {
      stdout.write(
        `Files: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged\n`,
      )
    }
    return 0
  } catch (error) {
    if (error instanceof InitConflictError) {
      stderr.write('Sparkwell found conflicting managed paths:\n')
      for (const conflict of error.conflicts) {
        stderr.write(`  - ${conflict}\n`)
      }
      stderr.write(
        'No files were written. Resolve structural conflicts or re-run with --force to replace conflicting Sparkwell-managed content.\n',
      )
      return 2
    }

    if (error instanceof TypeError && error.message.includes('Unsupported agent')) {
      stderr.write(`${error.message}\n`)
      stderr.write(`Supported agents: ${SUPPORTED_AGENTS.join(', ')}\n`)
      return 1
    }

    stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    return 1
  }
}