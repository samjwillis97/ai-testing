/**
 * Command introspection utilities for dynamic completion generation
 */
import { Command, Option } from 'commander';

/**
 * Represents a command option
 */
export interface OptionInfo {
  flags: string;
  description: string;
  required: boolean;
  optional: boolean;
  variadic: boolean;
  isArray: boolean;
  defaultValue?: unknown;
  choices?: string[];
  short?: string;
  long?: string;
  takesValue: boolean;
}

/**
 * Represents a command argument
 */
export interface ArgumentInfo {
  name: string;
  description: string;
  required: boolean;
  variadic: boolean;
  defaultValue?: unknown;
  choices?: string[];
}

/**
 * Represents a command and its subcommands
 */
export interface CommandInfo {
  name: string;
  description: string;
  aliases: string[];
  options: OptionInfo[];
  arguments: ArgumentInfo[];
  subcommands: CommandInfo[];
  isHidden: boolean;
  parent?: string;
  usage?: string;
}

/**
 * Extract option information from a Commander Option object
 */
function extractOptionInfo(option: Option): OptionInfo {
  const flags = option.flags;
  const flagsArray = flags.split(/[ ,|]+/);

  // Extract short and long options
  const shortOption = flagsArray.find((flag) => flag.startsWith('-') && !flag.startsWith('--'));
  const longOption = flagsArray.find((flag) => flag.startsWith('--'));

  // Determine if the option takes a value
  const takesValue = flags.includes('<') || flags.includes('[');

  // Check if it's an array option
  const isArray = option.argChoices?.toString().includes(',') || false;

  return {
    flags: option.flags,
    description: option.description || '',
    required: option.required || false,
    optional: !option.required,
    variadic: option.variadic || false,
    isArray,
    defaultValue: option.defaultValue,
    choices: option.argChoices,
    short: shortOption?.replace(/-/g, '') || undefined,
    long: longOption?.replace(/--/g, '') || undefined,
    takesValue,
  };
}

/**
 * Extract argument information from a Commander Command object
 */
function extractArgumentInfo(command: Command): ArgumentInfo[] {
  // Safe cast for registeredArguments which might not be in the type definition
  // First cast to unknown to avoid type errors
  const commandAsUnknown = command as unknown;
  const commandWithArgs = commandAsUnknown as {
    registeredArguments?: Array<{
      name: () => string;
      description?: string;
      required?: boolean;
      variadic?: boolean;
      defaultValue?: unknown;
      choices?: unknown;
    }>;
  };

  const registeredArgs = commandWithArgs.registeredArguments || [];

  return registeredArgs.map((arg) => {
    // Handle the case where choices is a function or undefined
    let choicesArray: string[] | undefined = undefined;

    // Only process choices if it exists
    if (arg.choices) {
      // If it's an object but not an array or function, extract keys
      if (
        typeof arg.choices === 'object' &&
        !Array.isArray(arg.choices) &&
        typeof arg.choices !== 'function'
      ) {
        choicesArray = Object.keys(arg.choices);
      }
      // If it's an array, use it directly
      else if (Array.isArray(arg.choices)) {
        choicesArray = arg.choices;
      }
      // If it's a function, we can't use it directly in completions
      // so we leave it as undefined
    }

    return {
      name: arg.name(),
      description: arg.description || '',
      required: arg.required || false,
      variadic: arg.variadic || false,
      defaultValue: arg.defaultValue,
      choices: choicesArray,
    };
  });
}

/**
 * Recursively introspect a Commander Command object and its subcommands
 */
export function introspectCommand(command: Command, parentName?: string): CommandInfo {
  const options = (command.options || []).map(extractOptionInfo);
  const arguments_ = extractArgumentInfo(command);
  const subcommands = (command.commands || []).map((cmd) => introspectCommand(cmd, command.name()));

  // Get aliases safely
  let aliasesArray: string[] = [];
  try {
    // Commander.js has different forms of the aliases property
    // We need to handle it carefully to avoid type errors
    // First cast to unknown to avoid type errors
    const commandAsUnknown = command as unknown;
    const commandWithInternals = commandAsUnknown as { _aliases?: unknown[] };

    if (commandWithInternals._aliases && Array.isArray(commandWithInternals._aliases)) {
      // Direct access to the internal _aliases property which is the most reliable
      aliasesArray = commandWithInternals._aliases.map((alias) => String(alias));
    } else if (typeof command.aliases === 'function') {
      // Try to call the function if it exists
      try {
        const result = command.aliases();
        if (Array.isArray(result)) {
          aliasesArray = result.map((alias) => String(alias));
        }
      } catch {
        // Ignore errors
      }
    }
  } catch (e) {
    // Ignore errors, use empty array
  }

  // Check if command is hidden
  const isHidden = !!(command as { _hidden?: boolean })._hidden;

  return {
    name: command.name(),
    description: command.description() || '',
    aliases: aliasesArray,
    options,
    arguments: arguments_,
    subcommands,
    isHidden,
    parent: parentName,
    usage: command.usage(),
  };
}

/**
 * Introspect the entire Commander program and return a structured representation
 */
export function introspectProgram(program: Command): CommandInfo[] {
  // Get the root command info
  const rootInfo = introspectCommand(program);

  // Return the subcommands (we don't need the root command itself)
  return rootInfo.subcommands;
}
