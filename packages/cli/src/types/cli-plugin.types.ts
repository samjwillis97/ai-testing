/**
 * CLI Plugin Types
 * Defines interfaces and types for CLI plugins
 */

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
  silent: boolean; // Whether silent mode is enabled
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
 * Output formatter interface
 * Follows the specification in cli-interface.md
 */
export interface OutputFormatterPlugin {
  format: string; // Format identifier
  formatOutput: (data: unknown, options: Record<string, unknown>) => string;
  description: string; // Format description
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
export type ResponseVisualizer = (data: unknown) => string;

/**
 * CLI Plugin Configuration
 */
export interface CLIPluginConfig {
  name: string;
  package?: string;
  path?: string;
  git?: string;
  ref?: string;
  version?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}
