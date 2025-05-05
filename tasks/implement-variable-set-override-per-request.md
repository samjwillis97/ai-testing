# Task: Implement Variable Set Override Per Request

## Overview
Extend the CLI package to support overriding variable sets on a per-request basis, allowing users to specify different variable sets for individual requests without changing the global configuration or collection-level variable set overrides.

## Status
🔄 **IN PROGRESS** - May 5, 2025

## Background
Currently, the SHC system supports variable sets at two levels:
1. Global variable sets defined in the main configuration file
2. Collection-level variable set overrides defined in each collection file

However, there's no way to override variable sets for a specific request execution without modifying the configuration or collection files. This feature would enhance flexibility by allowing users to specify different variable sets for different requests in the same session, which is particularly useful for testing across environments or with different data sets.

## Requirements

1. Add Command-Line Option for Variable Set Override:
   - Implement a new option `--var-set <namespace>=<value>` to specify a variable set for a specific request
   - Support multiple variable set overrides in a single command (e.g., `--var-set api=production --var-set resource=test-data`)
   - Ensure this option works in both direct request mode and collection request mode

2. Extend Request Context with Variable Set Overrides:
   - Modify the request context to include the variable set overrides
   - Implement a precedence hierarchy for variable resolution:
     1. Command-line variable set overrides (highest precedence)
     2. Collection-level variable set overrides
     3. Global configuration variable sets (lowest precedence)

3. Update Variable Resolution in Template Engine:
   - Ensure the template engine respects the variable set override precedence
   - Maintain compatibility with the existing template resolution system
   - Preserve the nested template function resolution capabilities

4. Update CLI Documentation:
   - Update the CLI interface specification to include the new option
   - Add examples showing how to use variable set overrides
   - Document the precedence rules for variable resolution

## Implementation Details

### Files to Update in CLI Package
- `/packages/cli/src/index.ts`: 
  - Add the new `--var-set` option to command definitions
  - Update option parsing to handle variable set overrides

- `/packages/cli/src/utils/config.ts`:
  - Extend configuration handling to support request-specific variable sets
  - Implement the variable set override precedence logic

- `/packages/cli/src/commands/request.ts`:
  - Update request execution to include variable set overrides in the request context
  - Pass the overrides to the core package's template resolution system

- `/packages/cli/src/types/config.types.ts`:
  - Add types for variable set overrides in request options
  - Ensure type compatibility with the core package's types

### Testing
- Create tests for variable set override functionality:
  - Test single variable set override
  - Test multiple variable set overrides
  - Test precedence hierarchy (command-line > collection > global)
  - Test integration with the template engine
  - Test variable resolution with complex nested templates

## Acceptance Criteria
- The `--var-set` option correctly overrides variable sets for a specific request
- Multiple variable set overrides can be specified in a single command
- Variable resolution correctly follows the precedence hierarchy
- The feature works in both direct request mode and collection request mode
- Template resolution works correctly with variable set overrides
- Documentation is updated to reflect the new functionality
- All tests pass with coverage meeting the established thresholds (80% for statements, functions, and lines; 65% for branches)

## Priority
Medium - This task enhances the flexibility of the CLI by allowing more granular control over variable sets, improving the user experience for complex workflows and testing scenarios.

## Notes
- This implementation should leverage the existing ConfigManager and template engine in the core package
- The feature should maintain backward compatibility with existing variable resolution mechanisms
- Consider adding a shorthand option (e.g., `-vs`) for the variable set override
- Ensure proper error handling for invalid variable set names or values
- The implementation should align with TypeScript best practices as specified in the project rules
- Consider adding this feature to the API for programmatic use in the future
- Ensure that the implementation is consistent with the existing plugin system and doesn't interfere with plugin-based variable resolution
