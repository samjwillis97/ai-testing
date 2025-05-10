# CLI Shell Completions Specification

## Overview

This document specifies the dynamic shell completion system for the CLI package (@shc/cli). It outlines the architecture, components, and implementation details for generating shell completions based on the actual command structure.

## Completion System Architecture

The CLI package uses a dynamic completion generation system that introspects the Commander.js command structure at runtime to generate completions for all registered commands and options. This ensures that completions are always in sync with the actual CLI implementation.

```
┌─────────────────────────────────────────────┐
│              Command Structure              │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│           Command Introspection             │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│          Completion Generator               │
│                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────┐  │
│  │ Bash Script │  │ Zsh Script  │  │Fish │  │
│  └─────────────┘  └─────────────┘  └─────┘  │
└─────────────────────────────────────────────┘
```

## Command Introspection

The command introspection utility traverses the Commander.js command object to extract all commands, subcommands, arguments, and options.

```typescript
export interface CommandInfo {
  name: string;
  description: string;
  arguments: ArgumentInfo[];
  options: OptionInfo[];
  subcommands: CommandInfo[];
  parent?: string;
  path: string[];
}

export interface ArgumentInfo {
  name: string;
  description: string;
  required: boolean;
  variadic: boolean;
  defaultValue?: any;
}

export interface OptionInfo {
  flags: string;
  short?: string;
  long: string;
  description: string;
  required: boolean;
  optional: boolean;
  variadic: boolean;
  defaultValue?: any;
  choices?: string[];
}

export class CommandIntrospector {
  /**
   * Extracts command information from a Commander.js command object
   */
  static extractCommandInfo(program: Command): CommandInfo {
    // Implementation details for extracting command structure
    return {
      name: program.name(),
      description: program.description(),
      arguments: this.extractArguments(program),
      options: this.extractOptions(program),
      subcommands: this.extractSubcommands(program),
      path: [program.name()],
    };
  }
  
  private static extractArguments(command: Command): ArgumentInfo[] {
    // Implementation details for extracting arguments
    return [];
  }
  
  private static extractOptions(command: Command): OptionInfo[] {
    // Implementation details for extracting options
    return [];
  }
  
  private static extractSubcommands(command: Command): CommandInfo[] {
    // Implementation details for extracting subcommands
    return [];
  }
}
```

## Completion Generator

The completion generator uses the extracted command information to generate shell completion scripts.

```typescript
export class CompletionGenerator {
  /**
   * Generates a completion script for the specified shell
   */
  static generateCompletionScript(
    commandInfo: CommandInfo,
    shell: 'bash' | 'zsh' | 'fish'
  ): string {
    switch (shell) {
      case 'bash':
        return this.generateBashCompletionScript(commandInfo);
      case 'zsh':
        return this.generateZshCompletionScript(commandInfo);
      case 'fish':
        return this.generateFishCompletionScript(commandInfo);
      default:
        throw new Error(`Unsupported shell: ${shell}`);
    }
  }
  
  private static generateBashCompletionScript(commandInfo: CommandInfo): string {
    // Implementation details for generating Bash completion script
    return '';
  }
  
  private static generateZshCompletionScript(commandInfo: CommandInfo): string {
    // Implementation details for generating Zsh completion script
    return '';
  }
  
  private static generateFishCompletionScript(commandInfo: CommandInfo): string {
    // Implementation details for generating Fish completion script
    return '';
  }
}
```

## Bash Completion Template

```bash
#!/usr/bin/env bash
# shc bash completion script

_shc_completion() {
  local cur prev words cword
  _init_completion || return

  # Get the command line up to the cursor position
  local cmd="${words[0]}"
  local cmdline="${COMP_LINE:0:$COMP_POINT}"
  
  # Call shc completion command to get completions
  local completions
  completions=$(${cmd} completion --generate bash "${cmdline}" "${prev}" "${cur}" 2>/dev/null)
  
  # Apply completions
  COMPREPLY=($(compgen -W "${completions}" -- "${cur}"))
  
  # Handle special cases like file completions
  if [[ "${completions}" == "__FILE__" ]]; then
    _filedir
    return 0
  fi
  
  return 0
}

complete -F _shc_completion shc
```

## Zsh Completion Template

```zsh
#compdef shc

_shc_completion() {
  local curcontext="$curcontext" state line
  typeset -A opt_args
  
  # Get the command line up to the cursor position
  local cmd="$words[1]"
  local cmdline="${BUFFER[1,$CURSOR]}"
  local curr="${words[$CURRENT]}"
  local prev="${words[$CURRENT-1]}"
  
  # Call shc completion command to get completions
  local completions
  completions=$(${cmd} completion --generate zsh "${cmdline}" "${prev}" "${curr}" 2>/dev/null)
  
  # Handle special cases
  case "${completions}" in
    __FILE__)
      _files
      return 0
      ;;
    *)
      compadd -X "Completions" ${=completions}
      ;;
  esac
  
  return 0
}

_shc_completion "$@"
```

## Fish Completion Template

```fish
function __shc_completion
  # Get the command line up to the cursor position
  set -l cmd (commandline -o)[1]
  set -l cmdline (commandline -cp)
  set -l curr (commandline -t)
  set -l prev (commandline -o)[-1]
  
  # Call shc completion command to get completions
  set -l completions ($cmd completion --generate fish "$cmdline" "$prev" "$curr" 2>/dev/null)
  
  # Handle special cases
  switch "$completions"
    case "__FILE__"
      __fish_complete_path
    case "*"
      printf "%s\n" $completions
  end
end

complete -f -c shc -a "(__shc_completion)"
```

## Completion Command Implementation

The completion command is implemented as a special command in the CLI that generates completions based on the current command line.

```typescript
export function createCompletionCommand(program: Command): Command {
  return new Command('completion')
    .description('Generate shell completion script')
    .argument('<shell>', 'Shell type (bash, zsh, fish)')
    .option('--output <file>', 'Output file')
    .option('--generate <shell>', 'Generate completions for the current command line (internal use)')
    .action(async (shell, options, command) => {
      const logger = Logger.getInstance();
      
      if (options.generate) {
        // Internal mode for generating completions
        const cmdline = command.args[1] || '';
        const prev = command.args[2] || '';
        const curr = command.args[3] || '';
        
        // Generate completions based on command line state
        const completions = generateCompletions(program, cmdline, prev, curr);
        process.stdout.write(completions.join(' '));
        return;
      }
      
      // Normal mode for generating completion script
      const commandInfo = CommandIntrospector.extractCommandInfo(program);
      const script = CompletionGenerator.generateCompletionScript(commandInfo, shell);
      
      if (options.output) {
        // Write to file
        await fs.writeFile(options.output, script);
        logger.success(`Completion script written to ${options.output}`);
      } else {
        // Write to stdout
        process.stdout.write(script);
      }
    });
}

/**
 * Generates completions based on the current command line state
 */
function generateCompletions(
  program: Command,
  cmdline: string,
  prev: string,
  curr: string
): string[] {
  // Parse command line to determine context
  const context = parseCommandLine(program, cmdline);
  
  if (context.isOption) {
    // Complete option value
    return completeOptionValue(context.option, prev, curr);
  } else if (context.isArgument) {
    // Complete argument value
    return completeArgumentValue(context.argument, prev, curr);
  } else {
    // Complete command or option name
    return [
      ...context.availableCommands,
      ...context.availableOptions,
    ];
  }
}
```

## Dynamic Completion Generation

The dynamic completion generation system ensures that completions are always in sync with the actual CLI implementation. This is achieved by:

1. **Command Structure Introspection**:
   - Traversing the Commander.js command object at runtime
   - Extracting all commands, subcommands, arguments, and options
   - Building a structured representation of the CLI interface

2. **Context-Aware Completion**:
   - Parsing the current command line to determine context
   - Generating appropriate completions based on context
   - Handling special cases like file paths and choices

3. **Shell-Specific Output**:
   - Generating shell-specific completion scripts
   - Handling differences in completion behavior between shells
   - Supporting Bash, Zsh, and Fish shells

## Special Completion Types

The completion system supports several special completion types:

1. **File Path Completion**:
   - Triggered by returning `__FILE__` as a completion
   - Uses shell's native file completion mechanism
   - Supports file type filtering

2. **Directory Path Completion**:
   - Triggered by returning `__DIR__` as a completion
   - Uses shell's native directory completion mechanism

3. **Choice Completion**:
   - For options with predefined choices
   - Only valid choices are suggested

4. **Dynamic Completion**:
   - For arguments that depend on external data
   - Custom completion functions can be registered

## Installation Instructions

The completion scripts can be installed using the following commands:

### Bash

```bash
# Generate and install completion script
shc completion bash > ~/.bash_completion.d/shc
# Source the completion script
echo "source ~/.bash_completion.d/shc" >> ~/.bashrc
```

### Zsh

```zsh
# Generate and install completion script
shc completion zsh > ~/.zsh/completions/_shc
# Ensure completions directory is in fpath
echo "fpath=(~/.zsh/completions $fpath)" >> ~/.zshrc
```

### Fish

```fish
# Generate and install completion script
shc completion fish > ~/.config/fish/completions/shc.fish
```

## Implementation Requirements

The completion system implementation must follow these requirements:

1. **Accuracy**:
   - Completions must accurately reflect the actual command structure
   - Changes to commands or options must be automatically reflected in completions
   - No manual maintenance of completion scripts should be required

2. **Performance**:
   - Completion generation should be fast enough for interactive use
   - Caching mechanisms should be used where appropriate
   - Minimal overhead for command execution

3. **Robustness**:
   - Handle edge cases gracefully
   - Provide meaningful error messages
   - Fail gracefully when completions cannot be generated

4. **Extensibility**:
   - Support for custom completion types
   - Plugin integration for additional completions
   - Extensible architecture for future shell support

5. **Testing**:
   - Unit tests for introspection and generation logic
   - Integration tests for completion command
   - Tests for different shell types

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage.
