# Variable Set Override Per Request

## Overview

The SHC CLI supports overriding variable sets on a per-request basis. This allows you to specify different variable sets for individual requests without changing the global configuration or collection-level variable set overrides.

## Variable Set Precedence

When resolving variables, SHC follows this precedence hierarchy (from highest to lowest priority):

1. **Command-line variable set overrides** (specified with `--var-set`)
2. **Collection-level variable set overrides** (defined in collection files)
3. **Global configuration variable sets** (defined in the main configuration file)

## Usage

### Command-Line Option

Use the `--var-set` option to specify a variable set for a specific request:

```bash
# Override the 'api' variable set to use 'production' value
shc get https://example.com/api/users --var-set api=production

# Multiple variable set overrides in a single command
shc collection my-collection get-user --var-set api=production --var-set env=test
```

### Syntax

The `--var-set` option uses the following syntax:

```
--var-set <namespace>=<value>
```

Where:
- `<namespace>` is the name of the variable set (e.g., 'api', 'env')
- `<value>` is the value to activate for that variable set (e.g., 'production', 'test')

## Examples

### Direct Request Mode

```bash
# Use production API endpoint for a single request
shc get https://example.com/api/users --var-set api=production

# Use production API and test data for a single request
shc post https://example.com/api/users --data '{"name":"Test User"}' --var-set api=production --var-set data=test
```

### Collection Request Mode

```bash
# Run the 'get-users' request from 'my-api' collection with production API
shc collection my-api get-users --var-set api=production

# Run the 'create-user' request with production API but test data
shc collection my-api create-user --var-set api=production --var-set data=test
```

## Template Usage

In your request templates, you can use the variable sets with the standard template syntax:

```yaml
# Example collection request using variable sets
name: get-users
method: GET
url: ${var.get('api')}/users
headers:
  Authorization: Bearer ${var.get('auth', 'token')}
```

The `var.get()` function will automatically resolve variables according to the precedence hierarchy, checking request-specific overrides first, then collection-level overrides, and finally global variable sets.

## Benefits

- **Flexibility**: Test requests with different environments without modifying configuration files
- **Convenience**: Quickly switch between variable sets for different testing scenarios
- **Consistency**: Maintain a clear precedence hierarchy for variable resolution
- **Isolation**: Changes only affect the current request, not global state

## Notes

- Variable set overrides are temporary and only apply to the current request execution
- The variable set must exist in your configuration for the override to work
- If a variable set doesn't exist, a warning will be displayed, and the override will be ignored
