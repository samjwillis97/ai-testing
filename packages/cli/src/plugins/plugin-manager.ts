/**
 * CLI Plugin Manager
 * Manages loading and registering plugins for the CLI
 */
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { SHCConfig } from '@shc/core';
import {
  CLIPlugin,
  CLIPluginType,
  CLIPluginContext,
  OutputFormatter,
  CommandHandler,
  CompletionHandler,
  ResponseVisualizer,
  CLIPluginConfig,
  OutputFormatterPlugin,
} from '../types/cli-plugin.types';
import { globalLogger } from '../utils/logger.js';

// We're exporting these types for documentation purposes
// Prefixing with _ to indicate they're exported but not used in this file
export type {
  CLIPlugin,
  CLIPluginType as _CLIPluginType,
  CLIPluginConfig as _CLIPluginConfig,
  OutputFormatterPlugin as _OutputFormatterPlugin,
};

/**
 * CLI Plugin Manager
 */
export class CLIPluginManager {
  private outputFormatters: Map<string, OutputFormatter> = new Map();
  private commands: Map<string, CommandHandler> = new Map();
  private shellCompletions: Map<string, CompletionHandler> = new Map();
  private responseVisualizers: Map<string, ResponseVisualizer> = new Map();
  private loadedPlugins: Map<string, CLIPlugin> = new Map();
  private quietMode = false;

  constructor() {}

  /**
   * Set quiet mode
   * @param quiet Whether to minimize log messages
   */
  setQuietMode(quiet: boolean): void {
    this.quietMode = quiet;
  }

  /**
   * Log a message if not in silent mode
   * @param message Message to log
   */
  log(message: string): void {
    if (!this.quietMode) {
      globalLogger.info(message);
    }
  }

  /**
   * Log an error if not in silent mode
   * @param message Error message
   * @param error Error object
   */
  logError(message: string, error?: unknown): void {
    if (!this.quietMode) {
      globalLogger.error(message, error);
    }
  }

  /**
   * Load plugins from configuration
   */
  async loadPlugins(config: SHCConfig): Promise<void> {
    // Load built-in example plugins only in development and testing environments
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Skip loading example plugins in production
    if (!isProduction) {
      try {
        const { loadExamplePlugins } = await import('./examples/index.js');
        loadExamplePlugins(this);
        this.log('Example plugins loaded (development/testing only)');
      } catch (error) {
        this.logError('Failed to load example plugins:', error);
      }
    } else {
      this.log('Example plugins disabled in production mode');
    }

    // Safely check if cli plugins exist in the config
    if (!config.cli || !config.cli.plugins || !Array.isArray(config.cli.plugins)) {
      return;
    }

    for (const pluginConfig of config.cli.plugins) {
      try {
        let plugin: CLIPlugin | null = null;

        // Skip disabled plugins
        if (pluginConfig.enabled === false) {
          continue;
        }

        // Load plugin based on source type
        if (pluginConfig.package) {
          // NPM package plugin
          plugin = await this.loadNpmPlugin(pluginConfig.package, pluginConfig.version);
        } else if (pluginConfig.path) {
          // Local path plugin
          plugin = await this.loadPathPlugin(pluginConfig.path);
        } else if (pluginConfig.git) {
          // Git repository plugin
          plugin = await this.loadGitPlugin(pluginConfig.git, pluginConfig.ref || 'main');
        }

        if (plugin) {
          this.registerPlugin(plugin);
          this.log(`Loaded plugin: ${plugin.name}`);
        }
      } catch (error) {
        this.logError(`Failed to load plugin ${pluginConfig.name}:`, error);
      }
    }

    // Load plugins from global and project-specific directories
    await this.loadPluginsFromDirectories(config);
  }

  /**
   * Load plugins from global and project-specific directories
   */
  private async loadPluginsFromDirectories(config: SHCConfig): Promise<void> {
    const directories: string[] = [];

    // Add global plugin directory
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (homeDir) {
      directories.push(path.join(homeDir, '.shc', 'cli-plugins'));
    }

    // Add project-specific plugin directory if config file path is available
    // We need to check for configFilePath which might be added by the CLI
    if ((config as Record<string, unknown>).configFilePath) {
      const configDir = path.dirname((config as Record<string, unknown>).configFilePath as string);
      directories.push(path.join(configDir, 'cli-plugins'));
    }

    // Load plugins from each directory
    for (const directory of directories) {
      try {
        if (fs.existsSync(directory) && fs.statSync(directory).isDirectory()) {
          const entries = fs.readdirSync(directory);

          for (const entry of entries) {
            const pluginPath = path.join(directory, entry);

            if (fs.statSync(pluginPath).isDirectory()) {
              try {
                const plugin = await this.loadPathPlugin(pluginPath);
                this.registerPlugin(plugin);
                this.log(`Loaded plugin from directory: ${plugin.name}`);
              } catch (error) {
                this.logError(`Failed to load plugin from ${pluginPath}:`, error);
              }
            }
          }
        }
      } catch (error) {
        this.logError(`Failed to load plugins from directory ${directory}:`, error);
      }
    }
  }

  /**
   * Load a plugin from an npm package
   */
  private async loadNpmPlugin(packageName: string, version?: string): Promise<CLIPlugin> {
    try {
      const fullPackageName = version ? `${packageName}@${version}` : packageName;

      // Check if package is already installed
      try {
        return await import(packageName);
      } catch (e) {
        // Package not installed, install it
        this.log(`Installing CLI plugin: ${fullPackageName}`);
        execSync(`pnpm add ${fullPackageName} --no-save`, { stdio: 'inherit' });
        return await import(packageName);
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
      // Resolve to absolute path if relative
      const absolutePath = path.isAbsolute(pluginPath)
        ? pluginPath
        : path.resolve(process.cwd(), pluginPath);

      // Check if path exists
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Plugin path does not exist: ${absolutePath}`);
      }

      // Check for plugin.json or package.json
      let pluginInfo: Record<string, unknown> | null = null;
      const pluginJsonPath = path.join(absolutePath, 'plugin.json');
      const packageJsonPath = path.join(absolutePath, 'package.json');

      if (fs.existsSync(pluginJsonPath)) {
        pluginInfo = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
      } else if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        pluginInfo = packageJson.shcCliPlugin || packageJson;
      } else {
        throw new Error(`No plugin.json or package.json found in ${absolutePath}`);
      }

      // Check for main file
      if (!pluginInfo) {
        throw new Error(`Failed to load plugin info from ${absolutePath}`);
      }

      const mainFile = (pluginInfo.main as string) || 'index.js';
      const mainFilePath = path.join(absolutePath, mainFile);

      if (!fs.existsSync(mainFilePath)) {
        throw new Error(`Plugin main file not found: ${mainFilePath}`);
      }

      // Load plugin
      const plugin = await import(mainFilePath);
      return plugin.default || plugin;
    } catch (error) {
      throw new Error(`Failed to load path plugin ${pluginPath}: ${error}`);
    }
  }

  /**
   * Load a plugin from a git repository
   */
  private async loadGitPlugin(repoUrl: string, ref: string): Promise<CLIPlugin> {
    try {
      // Create a temporary directory for the plugin
      const tempDir = path.join(process.cwd(), 'temp', `plugin-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // Clone the repository
      this.log(`Cloning plugin repository: ${repoUrl}#${ref}`);
      execSync(`git clone --depth 1 --branch ${ref} ${repoUrl} ${tempDir}`, {
        stdio: 'inherit',
      });

      // Install dependencies
      this.log('Installing plugin dependencies');
      execSync('pnpm install', { cwd: tempDir, stdio: 'inherit' });

      // Load the plugin
      return this.loadPathPlugin(tempDir);
    } catch (error) {
      throw new Error(`Failed to load git plugin ${repoUrl}: ${error}`);
    }
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: CLIPlugin): void {
    if (this.loadedPlugins.has(plugin.name)) {
      this.log(`Plugin ${plugin.name} already loaded, skipping`);
      return;
    }

    // Create plugin context
    const context: CLIPluginContext = {
      registerOutputFormatter: this.registerOutputFormatter.bind(this),
      registerCommand: this.registerCommand.bind(this),
      registerShellCompletion: this.registerShellCompletion.bind(this),
      registerResponseVisualizer: this.registerResponseVisualizer.bind(this),
      quiet: this.quietMode,
    };

    // Register plugin
    try {
      plugin.register(context);
      this.loadedPlugins.set(plugin.name, plugin);
    } catch (error) {
      this.logError(`Failed to register plugin ${plugin.name}:`, error);
    }
  }

  /**
   * Register an output formatter
   */
  registerOutputFormatter(name: string, formatter: OutputFormatter): void {
    this.outputFormatters.set(name, formatter);
  }

  /**
   * Register a command
   */
  registerCommand(name: string, handler: CommandHandler): void {
    this.commands.set(name, handler);
  }

  /**
   * Register a shell completion
   */
  registerShellCompletion(shell: string, handler: CompletionHandler): void {
    this.shellCompletions.set(shell, handler);
  }

  /**
   * Register a response visualizer
   */
  registerResponseVisualizer(name: string, visualizer: ResponseVisualizer): void {
    this.responseVisualizers.set(name, visualizer);
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

  /**
   * Check if quiet mode is enabled
   */
  get quiet(): boolean {
    return this.quietMode;
  }
}

// Export a singleton instance
export const cliPluginManager = new CLIPluginManager();
