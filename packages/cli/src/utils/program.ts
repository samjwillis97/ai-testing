/**
 * Program creation utility
 * Creates a Commander program instance for use in the CLI and tests
 */
import { Command } from 'commander';
import { addDirectCommand } from '../commands/direct-request.js';
import { addCollectionCommand } from '../commands/collection-request.js';
import { addCompletionCommand } from '../commands/completion.js';
import { addListCommand } from '../commands/list.js';
import { initializePlugins, cliPluginManager } from '../plugins/index.js';

/**
 * Options for program creation
 */
export interface MakeProgramOptions {
  /**
   * Whether to override the exit behavior (for testing)
   */
  exitOverride?: boolean;

  /**
   * Whether to suppress output (for testing)
   */
  suppressOutput?: boolean;

  /**
   * Whether to initialize plugins
   */
  initPlugins?: boolean;

  /**
   * Mock console methods for testing
   */
  mockConsole?: {
    log?: (message?: unknown, ...optionalParams: unknown[]) => void;
    info?: (message?: unknown, ...optionalParams: unknown[]) => void;
    warn?: (message?: unknown, ...optionalParams: unknown[]) => void;
    error?: (message?: unknown, ...optionalParams: unknown[]) => void;
    debug?: (message?: unknown, ...optionalParams: unknown[]) => void;
  };

  /**
   * Mock process.exit for testing
   */
  mockExit?: (code?: number) => never;
}

/**
 * Create a new Commander program instance
 * @param options Options for program creation
 * @returns A configured Commander program instance
 */
export async function makeProgram(options: MakeProgramOptions = {}): Promise<Command> {
  const program = new Command();

  // Configure program for testing if needed
  if (options.exitOverride) {
    program.exitOverride();
  }

  if (options.suppressOutput) {
    program.configureOutput({
      writeOut: () => {},
      writeErr: () => {},
    });
  }

  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  // Apply mock console methods if provided
  if (options.mockConsole) {
    if (options.mockConsole.log) console.log = options.mockConsole.log;
    if (options.mockConsole.info) console.info = options.mockConsole.info;
    if (options.mockConsole.warn) console.warn = options.mockConsole.warn;
    if (options.mockConsole.error) console.error = options.mockConsole.error;
    if (options.mockConsole.debug) console.debug = options.mockConsole.debug;
  }

  // Configure the program
  program
    .name('shc')
    .description('SHC Command Line Interface')
    .version('0.1.0')
    .option('-c, --config <PATH>', 'Config file path')
    .option(
      '-V, --set <key>=<value>',
      'Set config value, (i.e. --set storage.collections.path="./collections")',
      (value: string, previous: string[]) => {
        // Allow multiple --set options
        const values = previous || [];
        values.push(value);
        return values;
      },
      []
    )
    .option('-e, --env <n>', 'Environment name')
    .option(
      '--var-set <namespace>=<value>',
      'Override variable set for this request (i.e. --var-set api=production)',
      (value: string, previous: string[]) => {
        // Allow multiple --var-set options
        const values = previous || [];
        values.push(value);
        return values;
      },
      []
    )
    .option('-v, --verbose', 'Verbose output')
    .option(
      '-q, --quiet',
      'Quiet mode - output only the response data without any formatting or decorations'
    )
    .option('-o, --output <format>', 'Output format (json, yaml, raw, table)', 'json')
    .option('--no-color', 'Disable colors');

  // Enable passing global options to subcommands
  program.passThroughOptions();

  // Initialize plugins first if requested
  if (options.initPlugins !== false) {
    try {
      const cmdOptions = program.opts();
      // Initialize plugins with the current options
      await initializePlugins(cmdOptions);
    } catch (error) {
      // Use the global logger for error messages
      const { globalLogger } = await import('./logger.js');
      globalLogger.error('Error initializing plugins:', error);
    }
  }

  // Add commands
  addDirectCommand(program);
  addCollectionCommand(program);
  addListCommand(program);
  addCompletionCommand(program);

  // Register custom commands from plugins
  if (options.initPlugins !== false) {
    await registerCustomCommands(program);
  }

  // Add a hook to update logger and plugin options when they change
  program.hook('preAction', async (thisCommand) => {
    // Get options
    const cmdOptions = thisCommand.opts();

    // Import logger dynamically to avoid circular dependencies
    const { configureGlobalLogger, LogLevel } = await import('./logger.js');

    // Update global logger configuration based on command options
    configureGlobalLogger({
      level: cmdOptions.verbose
        ? LogLevel.DEBUG
        : cmdOptions.quiet
          ? LogLevel.ERROR
          : LogLevel.INFO,
      quiet: Boolean(cmdOptions.quiet),
      verbose: Boolean(cmdOptions.verbose),
      color: cmdOptions.color !== false,
    });

    // Update plugin manager with quiet mode
    if (cmdOptions.quiet !== undefined) {
      cliPluginManager.setQuietMode(Boolean(cmdOptions.quiet));
    }
  });

  // Restore original console methods if they were mocked
  if (options.mockConsole) {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  }

  return program;
}

/**
 * Register custom commands from plugins
 * @param program The Commander program instance
 */
async function registerCustomCommands(program: Command): Promise<void> {
  // Get all registered commands from the plugin manager
  const customCommands = cliPluginManager.getAllCommands();

  // Register each custom command
  if (customCommands && typeof customCommands.entries === 'function') {
    for (const [name, handler] of customCommands.entries()) {
      program
        .command(name)
        .description(`Custom command: ${name}`)
        .allowUnknownOption(true)
        .action(async (options) => {
          const args = program.args.filter((arg) => typeof arg === 'string');
          await handler(args, options);
        });
    }
  }
}
