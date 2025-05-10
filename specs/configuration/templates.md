# Templates Specification

## Overview

The SHC template system provides a powerful way to include dynamic values in configuration, requests, and responses. Templates allow for environment variable references, function calls, and variable substitution, enabling flexible and reusable configurations.

## Template Syntax

Templates use the `${...}` syntax to denote a template expression. The expression inside the braces can be:

1. A simple variable reference: `${variableName}`
2. A function call: `${functionName(arg1, arg2)}`
3. A nested expression: `${outer(inner())}`
4. A conditional expression: `${condition ? trueValue : falseValue}`
5. A pipe expression: `${value|transform}`

## Template Contexts

Templates are resolved within a context that provides the values for variables and functions. The SHC template system supports several built-in contexts:

1. `env`: Environment variables
2. `config`: Configuration values
3. `request`: Request data
4. `response`: Response data
5. `variables`: User-defined variables

## Variable References

### Environment Variables

Environment variables can be referenced using the `env` namespace:

```
${env.API_KEY}
```

This will be replaced with the value of the `API_KEY` environment variable.

### Configuration Values

Configuration values can be referenced using the `config` namespace:

```
${config.client.baseUrl}/api
```

This will be replaced with the value of `client.baseUrl` from the configuration, followed by `/api`.

### Request Data

Request data can be referenced using the `request` namespace:

```
${request.headers.Authorization}
```

This will be replaced with the value of the `Authorization` header from the current request.

### Response Data

Response data can be referenced using the `response` namespace:

```
${response.data.token}
```

This will be replaced with the value of `token` from the response data.

### User-Defined Variables

User-defined variables can be referenced using the `variables` namespace:

```
${variables.apiVersion}
```

This will be replaced with the value of `apiVersion` from the user-defined variables.

## Function Calls

Templates support function calls that can perform dynamic operations:

```
${timestamp()}
```

This will be replaced with the current timestamp.

### Built-in Functions

SHC provides several built-in functions:

| Function | Description | Example |
|----------|-------------|---------|
| `timestamp()` | Current timestamp in milliseconds | `${timestamp()}` |
| `date(format?)` | Formatted date string | `${date('YYYY-MM-DD')}` |
| `uuid()` | Generate a UUID | `${uuid()}` |
| `base64(value)` | Base64 encode a value | `${base64('hello')}` |
| `base64decode(value)` | Base64 decode a value | `${base64decode('aGVsbG8=')}` |
| `md5(value)` | MD5 hash a value | `${md5('hello')}` |
| `sha1(value)` | SHA-1 hash a value | `${sha1('hello')}` |
| `sha256(value)` | SHA-256 hash a value | `${sha256('hello')}` |
| `random(min, max)` | Random number between min and max | `${random(1, 100)}` |
| `env(name, default?)` | Get environment variable with default | `${env('API_KEY', 'default')}` |
| `config(path, default?)` | Get configuration value with default | `${config('client.timeout', 5000)}` |
| `json(value)` | Convert value to JSON string | `${json({ key: 'value' })}` |
| `parse(value)` | Parse JSON string to object | `${parse('{"key":"value"}')}` |
| `urlEncode(value)` | URL encode a value | `${urlEncode('hello world')}` |
| `urlDecode(value)` | URL decode a value | `${urlDecode('hello%20world')}` |

### Custom Functions

Users can define custom functions in the configuration:

```yaml
templates:
  functions:
    hmacSha256: |
      (value, secret) => {
        const crypto = require('crypto');
        return crypto.createHmac('sha256', secret)
          .update(value)
          .digest('hex');
      }
```

This function can then be used in templates:

```
${hmacSha256('message', 'secret')}
```

## Pipe Expressions

Pipe expressions allow for chaining transformations:

```
${value|transform1|transform2}
```

This applies `transform1` to `value`, then applies `transform2` to the result.

### Built-in Transforms

SHC provides several built-in transforms:

| Transform | Description | Example |
|-----------|-------------|---------|
| `upper` | Convert to uppercase | `${value|upper}` |
| `lower` | Convert to lowercase | `${value|lower}` |
| `trim` | Trim whitespace | `${value|trim}` |
| `default(value)` | Default value if null or undefined | `${value|default('default')}` |
| `substring(start, end?)` | Get substring | `${value|substring(0, 5)}` |
| `replace(pattern, replacement)` | Replace pattern | `${value|replace('old', 'new')}` |
| `split(separator)` | Split string into array | `${value|split(',')}` |
| `join(separator)` | Join array into string | `${value|join(',')}` |
| `length` | Get length of string or array | `${value|length}` |
| `first` | Get first item of array | `${value|first}` |
| `last` | Get last item of array | `${value|last}` |
| `nth(index)` | Get nth item of array | `${value|nth(2)}` |
| `slice(start, end?)` | Slice array | `${value|slice(1, 3)}` |
| `map(template)` | Map array items | `${value|map('${item.name}')}` |
| `filter(template)` | Filter array items | `${value|filter('${item.active}')}` |
| `sort(key?)` | Sort array | `${value|sort('name')}` |
| `reverse` | Reverse array | `${value|reverse}` |
| `keys` | Get object keys | `${value|keys}` |
| `values` | Get object values | `${value|values}` |
| `entries` | Get object entries | `${value|entries}` |
| `pick(keys)` | Pick object properties | `${value|pick('name,age')}` |
| `omit(keys)` | Omit object properties | `${value|omit('password,token')}` |

### Custom Transforms

Users can define custom transforms in the configuration:

```yaml
templates:
  transforms:
    capitalize: |
      (value) => {
        if (typeof value !== 'string') return value;
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
```

This transform can then be used in templates:

```
${value|capitalize}
```

## Conditional Expressions

Templates support conditional expressions using the ternary operator:

```
${condition ? trueValue : falseValue}
```

For example:

```
${env.NODE_ENV === 'production' ? 'https://api.example.com' : 'https://dev-api.example.com'}
```

## Template Escaping

To include a literal `${` in a string, you can escape it with a backslash:

```
\${notATemplate}
```

This will be rendered as `${notATemplate}` without template processing.

## Template Resolution

Templates are resolved at different times depending on the context:

1. **Configuration Templates**: Resolved when the configuration is loaded
2. **Request Templates**: Resolved before the request is sent
3. **Response Templates**: Resolved after the response is received

## Example Usage

### Configuration Templates

```yaml
client:
  baseUrl: https://${env.API_HOST}/api/${variables.apiVersion}
  timeout: ${env.API_TIMEOUT|default(5000)}
  headers:
    Authorization: Bearer ${env.API_TOKEN}
    X-Request-ID: ${uuid()}
    X-Timestamp: ${timestamp()}
```

### Request Templates

```typescript
// Make a request with templates
client.get('/users/${userId}', {
  headers: {
    'X-Request-Time': '${date("YYYY-MM-DD HH:mm:ss")}',
  },
  params: {
    filter: '${filter|urlEncode}',
  },
});
```

### Response Templates

```typescript
// Process response with templates
client.get('/users')
  .then(response => {
    // Extract user names from response
    const names = client.resolveTemplate('${response.data.users|map("${item.name}")|join(", ")}');
    console.log(`User names: ${names}`);
  });
```

## Template Engine

The template system is implemented using the `TemplateEngine` class:

```typescript
export class TemplateEngine {
  /**
   * Register a custom function
   */
  registerFunction(namespace: string, func: TemplateFunction): void;
  
  /**
   * Register a custom transform
   */
  registerTransform(name: string, transform: TemplateTransform): void;
  
  /**
   * Resolve a template string
   */
  resolve(template: string, context: Partial<TemplateContext>): Promise<string>;
  
  /**
   * Resolve templates in an object
   */
  resolveObject<T>(obj: T, context: Partial<TemplateContext>): Promise<T>;
}
```

## Implementation Requirements

The template system implementation must follow these requirements:

1. **Performance**:
   - Efficient template parsing and resolution
   - Caching of parsed templates
   - Lazy evaluation of expensive operations

2. **Flexibility**:
   - Support for nested templates
   - Extensible function and transform system
   - Configurable template syntax

3. **Reliability**:
   - Proper error handling for invalid templates
   - Graceful fallback for missing variables
   - Comprehensive validation

4. **Security**:
   - Protection against template injection
   - Sandboxed execution of custom functions
   - Secure handling of sensitive values

5. **Usability**:
   - Clear error messages for template issues
   - Helpful debugging information
   - Comprehensive documentation

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
