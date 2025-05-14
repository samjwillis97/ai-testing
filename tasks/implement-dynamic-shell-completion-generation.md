# Task: Implement Dynamic Shell Completion Generation

## Overview
Create a more reliable method for generating shell completions in the CLI package by implementing dynamic completion generation based on the actual command structure, ensuring completions are always in sync with the CLI implementation.

## Status
📋 **PLANNED** - May 5, 2025

## Background
The current implementation of shell completions in the CLI package is manually maintained, which leads to several issues:
1. Outdated completions when commands or options change
2. Inconsistencies between actual command implementations and completions
3. High maintenance burden when adding new commands or options
4. Risk of missing options or commands in completions

This was recently demonstrated when updating the shell completions for the variable set override feature, where outdated options had to be removed and missing commands had to be added manually.

## Requirements

1. Create Command Introspection Utility:
   - Develop a utility to traverse the Commander.js command object
   - Extract all commands, subcommands, arguments, and options
   - Build a structured representation of the CLI interface
   - Handle special cases like array options, variadic arguments, and hidden commands

2. Implement Template-Based Completion Generators:
   - Create templates for each supported shell (Bash, Zsh, Fish)
   - Dynamically populate templates with command data from introspection
   - Support special cases like array options and custom completions
   - Maintain support for collection and request name completions

3. Enhance Completion Command:
   - Update the completion command to use the dynamic generation system
   - Maintain backward compatibility with existing completion scripts
   - Add tests to verify completions match command structure
   - Support the `--eval` option for Zsh completions

4. Add Documentation:
   - Document the new completion generation system
   - Provide examples for extending completions for custom commands
   - Include instructions for users on how to use shell completions

## Implementation Details

### Files to Update in CLI Package
- `/packages/cli/src/utils/completion.ts`:
  - Implement command introspection utility
  - Create dynamic completion generators for each shell
  - Replace hardcoded completion scripts with dynamic generation

- `/packages/cli/src/commands/completion.ts`:
  - Update to use the new dynamic generation system
  - Ensure backward compatibility

- `/packages/cli/tests/utils/completion.test.ts`:
  - Add tests for command introspection
  - Add tests for dynamic completion generation
  - Verify completions match command structure

### Technical Approach
1. **Command Introspection**:
   ```typescript
   interface CommandInfo {
     name: string;
     description: string;
     aliases: string[];
     options: OptionInfo[];
     arguments: ArgumentInfo[];
     subcommands: CommandInfo[];
     isHidden: boolean;
   }

   function introspectCommands(program: Command): CommandInfo[] {
     // Traverse Commander.js command object
     // Extract command structure
   }
   ```

2. **Dynamic Completion Generation**:
   ```typescript
   function generateBashCompletions(commands: CommandInfo[]): string {
     // Generate Bash completion script from command structure
   }

   function generateZshCompletions(commands: CommandInfo[]): string {
     // Generate Zsh completion script from command structure
   }

   function generateFishCompletions(commands: CommandInfo[]): string {
     // Generate Fish completion script from command structure
   }
   ```

3. **Integration with Existing System**:
   ```typescript
   export function generateCompletionScript(shell: 'bash' | 'zsh' | 'fish'): string {
     // Get command structure
     const commands = introspectCommands(program);
     
     // Generate completions based on shell
     switch (shell) {
       case 'bash':
         return generateBashCompletions(commands);
       case 'zsh':
         return generateZshCompletions(commands);
       case 'fish':
         return generateFishCompletions(commands);
     }
   }
   ```

## Testing Strategy
1. **Unit Tests**:
   - Test command introspection with mock Commander.js commands
   - Test completion generation for each shell
   - Verify handling of special cases (array options, variadic arguments)

2. **Integration Tests**:
   - Test with actual CLI commands
   - Verify completions match command structure
   - Test backward compatibility

3. **Manual Testing**:
   - Test completions in actual shell environments
   - Verify tab completion works as expected for all commands and options

## Expected Benefits
1. **Maintainability**: Completions automatically stay in sync with CLI changes
2. **Consistency**: Ensures all commands and options have proper completions
3. **Extensibility**: Makes it easier to add new commands with proper completions
4. **Reliability**: Reduces the risk of outdated or incorrect completions

## Acceptance Criteria
1. All commands and options are correctly reflected in generated completions
2. Completions are dynamically generated based on the actual command structure
3. All supported shells (Bash, Zsh, Fish) have working completions
4. Tests verify that completions match the command structure
5. Documentation is updated to reflect the new completion system
6. Existing functionality for collection and request name completions is preserved

## Dependencies
- Commander.js library for command introspection
- Existing completion system for backward compatibility

## Related Tasks
- Implement variable set override per request (completed)
- Improve CLI test coverage
