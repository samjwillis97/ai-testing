# External Variable Sets

## Overview

The external variable sets feature allows you to define variable sets in separate files, making your configuration more maintainable and organized. This is especially useful for large projects with many variables or when you need to share variable sets between different configurations.

## Benefits

1. **Improved Organization**: Keep your main configuration file clean and focused
2. **Better Maintainability**: Update variable sets independently without modifying the main config
3. **Reusability**: Share variable sets between different projects or configurations
4. **Scalability**: Support for large and complex variable sets
5. **Flexibility**: Mix inline and file-based variable definitions as needed

## Usage

### Basic File Reference

To reference a variable set from an external file, use the `file` property:

```yaml
variable_sets:
  global:
    file: "./variable-sets/api-environments.yaml"
```

The referenced file should contain a valid variable set structure:

```yaml
# api-environments.yaml
api:
  description: "API configuration for different environments"
  default_value: "development"
  active_value: "development"
  values:
    development:
      url: "http://localhost:3000"
      timeout: 5000
    production:
      url: "https://api.example.com"
      timeout: 3000
```

### Using Glob Patterns

You can use glob patterns to load and merge multiple variable set files:

```yaml
variable_sets:
  global:
    glob: "./variable-sets/*.yaml"
```

This will load all `.yaml` files in the `variable-sets` directory and merge them into a single variable set.

### Named Variable Sets

You can also load named variable sets from external files:

```yaml
variable_sets:
  global:
    file: "./variable-sets/global.yaml"
  development:
    file: "./variable-sets/development.yaml"
  production:
    file: "./variable-sets/production.yaml"
```

### Mixing Inline and External Variable Sets

You can mix inline and external variable sets in the same configuration:

```yaml
variable_sets:
  global:
    file: "./variable-sets/global.yaml"
  custom:
    inline_var: "value"
    another_var: 123
```

## Path Resolution

Paths to external variable set files can be:

1. **Absolute paths**: `/path/to/variable-sets/global.yaml`
2. **Relative paths**: `./variable-sets/global.yaml` (relative to the config file)

## Error Handling

The system will throw an error if:

1. The referenced file does not exist
2. The file format is invalid (not YAML or JSON)
3. The file content does not match the expected variable set structure
4. A glob pattern does not match any files

## Example Configuration

Here's a complete example of a configuration using external variable sets:

```yaml
# shc.config.yaml
version: "1.0.0"
name: "SHC Demo with External Variable Sets"

variable_sets:
  # Global variable sets loaded from external file
  global:
    file: "./variable-sets/api-environments.yaml"
  
  # Collection defaults loaded from external file
  collection_defaults:
    file: "./variable-sets/user-defaults.yaml"
  
  # Named variable set loaded from external file
  auth_config:
    file: "./variable-sets/auth-config.yaml"
  
  # Example of using glob pattern to load multiple files
  all_configs:
    glob: "./variable-sets/*.yaml"
```

## Best Practices

1. **Organize by Domain**: Group related variables in the same file
2. **Use Descriptive Filenames**: Name files based on their content (e.g., `api-environments.yaml`)
3. **Version Control**: Store variable set files in version control alongside your config
4. **Environment-Specific Files**: Use separate files for different environments
5. **Documentation**: Document the purpose and structure of each variable set file
