/**
 * CLI Plugin Manager
 * Manages loading and registering plugins for the CLI
 */
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { SHCConfig } from '@shc/core';

/**
 * CLI Plugin Types
 */
export enum CLIPluginType {
  OUTPUT_FORMATTER = 'output_formatter',
  CUSTOM_COMMAND = 'custom_command',
  SHELL_COMPLETION = 'shell_completion',
  RESPONSE_VISUALIZER = 'response_visualizer',
}

/**
 * CLI Plugin Context
 * Provides access to CLI functionality for plugins
 */
export interface CLIPluginContext {
  registerOutputFormatter: (name: string, formatter: OutputFormatter) => void;
  registerCommand: (name: string, handler: CommandHandler) => void;
  registerShellCompletion: (shell: string, handler: CompletionHandler) => void;
  registerResponseVisualizer: (name: string, visualizer: ResponseVisualizer) => void;
}

/**
 * CLI Plugin interface
 */
export interface CLIPlugin {
  name: string;
  type: CLIPluginType;
  version?: string;
  description?: string;
  register: (context: CLIPluginContext) => void;
}

/**
 * Output formatter function
 */
export type OutputFormatter = (data: unknown) => string;

/**
 * Command handler function
 */
export type CommandHandler = (args: string[], options: Record<string, unknown>) => Promise<void>;

/**
 * Completion handler function
 */
export type CompletionHandler = (line: string, point: number) => string[];

/**
 * Response visualizer function
 */
export type ResponseVisualizer = (response: unknown) => void;

/**
 * CLI Plugin Manager
 */
export class CLIPluginManager implements CLIPluginContext {
  private outputFormatters: Map<string, OutputFormatter> = new Map();
  private commands: Map<string, CommandHandler> = new Map();
  private shellCompletions: Map<string, CompletionHandler> = new Map();
  private responseVisualizers: Map<string, ResponseVisualizer> = new Map();
  private loadedPlugins: Map<string, CLIPlugin> = new Map();

  /**
   * Create a new CLI Plugin Manager
   */
  constructor() {}

  /**
   * Load plugins from configuration
   */
  async loadPlugins(config: SHCConfig): Promise<void> {
    // Load built-in example plugins for development and testing
    try {
      const { loadExamplePlugins } = await import('./examples/index.js');
      loadExamplePlugins(this);
    } catch (error) {
      console.warn('Failed to load example plugins:', error);
    }

    if (!config.cli?.plugins) {
      return;
    }

    for (const pluginConfig of config.cli.plugins) {
      try {
        let plugin: CLIPlugin | null = null;

        // Skip disabled plugins
        if (pluginConfig.enabled === false) {
          continue;
        }

        // Load from npm package
        if (pluginConfig.package) {
          plugin = await this.loadNpmPlugin(pluginConfig.package, pluginConfig.version);
        }
        // Load from local path
        else if (pluginConfig.path) {
          plugin = await this.loadPathPlugin(pluginConfig.path);
        }
        // Load from git repository
        else if (pluginConfig.git) {
          plugin = await this.loadGitPlugin(
            pluginConfig.git,
            pluginConfig.ref || 'main'
          );
        }

        if (plugin) {
          this.registerPlugin(plugin);
        }
      } catch (error) {
        console.error(`Failed to load plugin ${pluginConfig.name}:`, error);
      }
    }
  }

  /**
   * Load a plugin from an npm package
   */
  private async loadNpmPlugin(
    packageName: string,
    version?: string
  ): Promise<CLIPlugin> {
    try {
      const fullPackageName = version ? `${packageName}@${version}` : packageName;
      
      // Check if package is already installed
      try {
        return require(packageName);
      } catch (e) {
        // Package not installed, install it
        console.log(`Installing CLI plugin: ${fullPackageName}`);
        execSync(`pnpm add ${fullPackageName} --no-save`, { stdio: 'inherit' });
        return require(packageName);
      }
    } catch (error) {
      throw new Error(`Failed to load npm plugin ${packageName}: ${error}`);
    }
  }

  /**
   * Load a plugin from a local path
   */
  private async loadPathPlugin(pluginPath: string): Promise<CLIPlugin> {
    try {
      const resolvedPath = path.resolve(pluginPath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Plugin path does not exist: ${resolvedPath}`);
      }
      return require(resolvedPath);
    } catch (error) {
      throw new Error(`Failed to load path plugin ${pluginPath}: ${error}`);
    }
  }

  /**
   * Load a plugin from a git repository
   */
  private async loadGitPlugin(repoUrl: string, ref: string): Promise<CLIPlugin> {
    try {
      // Create a temporary directory for the git clone
      const tempDir = path.join(process.cwd(), '.shc', 'plugins', 'git');
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'plugin';
      const pluginDir = path.join(tempDir, repoName);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Clone the repository if it doesn't exist
      if (!fs.existsSync(pluginDir)) {
        console.log(`Cloning plugin repository: ${repoUrl}`);
        execSync(`git clone ${repoUrl} ${pluginDir}`, { stdio: 'inherit' });
      }
      
      // Checkout the specified ref
      console.log(`Checking out ref: ${ref}`);
      execSync(`cd ${pluginDir} && git fetch && git checkout ${ref}`, { stdio: 'inherit' });
      
      // Install dependencies
      console.log('Installing plugin dependencies');
      execSync(`cd ${pluginDir} && pnpm install`, { stdio: 'inherit' });
      
      // Load the plugin
      return require(pluginDir);
    } catch (error) {
      throw new Error(`Failed to load git plugin ${repoUrl}: ${error}`);
    }
  }

  /**
   * Register a plugin
   */
  private registerPlugin(plugin: CLIPlugin): void {
    if (this.loadedPlugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered. Skipping.`);
      return;
    }

    // Register the plugin
    plugin.register(this);
    this.loadedPlugins.set(plugin.name, plugin);
    console.log(`Registered CLI plugin: ${plugin.name}`);
  }

  /**
   * Register an output formatter
   */
  registerOutputFormatter(name: string, formatter: OutputFormatter): void {
    this.outputFormatters.set(name, formatter);
    console.log(`Registered output formatter: ${name}`);
  }

  /**
   * Register a command
   */
  registerCommand(name: string, handler: CommandHandler): void {
    this.commands.set(name, handler);
    console.log(`Registered command: ${name}`);
  }

  /**
   * Register a shell completion
   */
  registerShellCompletion(shell: string, handler: CompletionHandler): void {
    this.shellCompletions.set(shell, handler);
    console.log(`Registered shell completion for: ${shell}`);
  }

  /**
   * Register a response visualizer
   */
  registerResponseVisualizer(name: string, visualizer: ResponseVisualizer): void {
    this.responseVisualizers.set(name, visualizer);
    console.log(`Registered response visualizer: ${name}`);
  }

  /**
   * Get an output formatter by name
   */
  getOutputFormatter(name: string): OutputFormatter | undefined {
    return this.outputFormatters.get(name);
  }

  /**
   * Get all registered output formatters
   */
  getAllOutputFormatters(): Map<string, OutputFormatter> {
    return this.outputFormatters;
  }

  /**
   * Get a command handler by name
   */
  getCommand(name: string): CommandHandler | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all registered commands
   */
  getAllCommands(): Map<string, CommandHandler> {
    return this.commands;
  }

  /**
   * Get a shell completion handler by shell name
   */
  getShellCompletion(shell: string): CompletionHandler | undefined {
    return this.shellCompletions.get(shell);
  }

  /**
   * Get all registered shell completions
   */
  getAllShellCompletions(): Map<string, CompletionHandler> {
    return this.shellCompletions;
  }

  /**
   * Get a response visualizer by name
   */
  getResponseVisualizer(name: string): ResponseVisualizer | undefined {
    return this.responseVisualizers.get(name);
  }

  /**
   * Get all registered response visualizers
   */
  getAllResponseVisualizers(): Map<string, ResponseVisualizer> {
    return this.responseVisualizers;
  }
}

// Export a singleton instance
export const cliPluginManager = new CLIPluginManager();
