# Implement External Variable Sets

## Overview

Currently, all variable sets must be defined directly within the main configuration file, which can make the configuration noisy and difficult to manage when dealing with large variable sets. This task involves implementing support for importing variable sets from external files, allowing for better organization and management of configuration.

## Status
 **PLANNED** - May 6, 2025

## Background

Variable sets are a key part of the SHC configuration, allowing users to define reusable variables for different environments or contexts. Currently, these variable sets must be defined directly in the main `shc.config.yaml` file under the `variable_sets` section. For projects with many variables or complex configurations, this approach leads to:

1. Overly large and complex configuration files
2. Difficulty in managing and updating variable sets independently
3. Challenges in sharing variable sets between projects
4. Limited ability to organize variables by domain or purpose

## Requirements

1. Support External Variable Set Files:
   - Allow variable sets to be defined in separate YAML/JSON files
   - Support both absolute and relative file paths (relative to the main config file)
   - Support importing multiple variable set files
   - Maintain backward compatibility with inline variable sets

2. Extend Configuration Schema:
   - Update the `variable_sets` schema to support file references
   - Allow mixing of inline variables and file references
   - Support glob patterns for importing multiple files at once

3. Implement Import Mechanism:
   - Add file loading and parsing functionality to the ConfigManager
   - Handle variable set merging and precedence rules
   - Support deep merging of variable sets from different sources
   - Implement proper error handling for missing or invalid files

4. Add Template Resolution:
   - Ensure template resolution works with imported variable sets
   - Support cross-references between variable sets
   - Maintain context isolation between different variable sets when needed

5. Update Documentation:
   - Document the new external variable sets feature
   - Provide examples of different usage patterns
   - Update schema documentation

## Implementation Details

### 1. Schema Updates

The current `variableSetsSchema` in `packages/core/src/schemas/config.schema.ts` is defined as:

```typescript
export const variableSetsSchema = z.object({
  global: z.record(z.string(), z.any()).default({}),
  collection_defaults: z.record(z.string(), z.any()).default({}),
});
```

We need to update it to support file references while maintaining compatibility:

```typescript
// Define a schema for file reference
const fileReferenceSchema = z.object({
  file: z.string(),
  glob: z.string().optional(),
});

// Define a schema for variable values that can be either inline or from a file
const variableValuesSchema = z.union([
  z.record(z.string(), z.any()),
  fileReferenceSchema
]);

export const variableSetsSchema = z.object({
  global: variableValuesSchema.default({}),
  collection_defaults: variableValuesSchema.default({}),
}).catchall(variableValuesSchema);  // Allow additional named variable sets
```

This schema update allows variable sets to be defined either inline or via file references, while maintaining backward compatibility.

### 2. ConfigManager Updates

Enhance the `ConfigManagerImpl` class in `packages/core/src/config-manager.ts` to handle external variable sets:

1. Add a new method to load variable sets from files:
   ```typescript
   private async loadVariableSetFromFile(filePath: string): Promise<Record<string, unknown>> {
     try {
       const resolvedPath = this.resolveConfigPath(filePath);
       const fileExt = path.extname(resolvedPath).toLowerCase();
       const fileContent = await fs.readFile(resolvedPath, 'utf8');
       
       if (fileExt === '.yaml' || fileExt === '.yml') {
         return yaml.load(fileContent) as Record<string, unknown>;
       } else if (fileExt === '.json') {
         return JSON.parse(fileContent);
       } else {
         throw new Error(`Unsupported file type: ${fileExt}`);
       }
     } catch (error) {
       throw new Error(`Failed to load variable set from ${filePath}: ${error instanceof Error ? error.message : error}`);
     }
   }
   ```

2. Add a method to handle glob patterns:
   ```typescript
   private async loadVariableSetFromGlob(globPattern: string): Promise<Record<string, unknown>> {
     try {
       const resolvedPattern = this.resolveConfigPath(globPattern);
       const files = await glob(resolvedPattern);
       
       const result: Record<string, unknown> = {};
       for (const file of files) {
         const fileVariables = await this.loadVariableSetFromFile(file);
         merge(result, fileVariables);
       }
       
       return result;
     } catch (error) {
       throw new Error(`Failed to load variable sets from glob ${globPattern}: ${error instanceof Error ? error.message : error}`);
     }
   }
   ```

3. Modify the `loadFromFile` method to process external variable sets:
   ```typescript
   async loadFromFile(filePath: string): Promise<void> {
     try {
       // Existing code...
       
       // Process variable sets with file references
       if (parsedConfig.variable_sets) {
         const variableSets = parsedConfig.variable_sets;
         
         // Process global variable set
         if (variableSets.global && typeof variableSets.global === 'object' && 'file' in variableSets.global) {
           const fileRef = variableSets.global as { file: string; glob?: string };
           if (fileRef.glob) {
             variableSets.global = await this.loadVariableSetFromGlob(fileRef.glob);
           } else if (fileRef.file) {
             variableSets.global = await this.loadVariableSetFromFile(fileRef.file);
           }
         }
         
         // Process collection_defaults variable set
         if (variableSets.collection_defaults && typeof variableSets.collection_defaults === 'object' && 'file' in variableSets.collection_defaults) {
           const fileRef = variableSets.collection_defaults as { file: string; glob?: string };
           if (fileRef.glob) {
             variableSets.collection_defaults = await this.loadVariableSetFromGlob(fileRef.glob);
           } else if (fileRef.file) {
             variableSets.collection_defaults = await this.loadVariableSetFromFile(fileRef.file);
           }
         }
         
         // Process named variable sets
         for (const [key, value] of Object.entries(variableSets)) {
           if (key !== 'global' && key !== 'collection_defaults' && value && typeof value === 'object' && 'file' in value) {
             const fileRef = value as { file: string; glob?: string };
             if (fileRef.glob) {
               variableSets[key] = await this.loadVariableSetFromGlob(fileRef.glob);
             } else if (fileRef.file) {
               variableSets[key] = await this.loadVariableSetFromFile(fileRef.file);
             }
           }
         }
       }
       
       // Continue with existing code...
     } catch (error) {
       throw new Error(`Failed to load configuration from ${filePath}: ${error instanceof Error ? error.message : error}`);
     }
   }
   ```

### 3. Testing

1. Create unit tests for external variable set loading:
   - Test loading from absolute paths
   - Test loading from relative paths
   - Test loading with glob patterns
   - Test error handling for missing files
   - Test merging of variable sets from multiple sources

2. Create integration tests:
   - Test variable resolution with external variable sets
   - Test template resolution with external variable sets
   - Test cross-references between variable sets

### 4. Documentation

Update documentation to explain the new feature:

```markdown
## External Variable Sets

You can now define variable sets in external files to keep your main configuration clean:

```yaml
# Main config file (shc.config.yaml)
variable_sets:
  global:
    file: ./variables/global.yaml
  collection_defaults:
    file: ./variables/collection-defaults.yaml
  staging:
    file: ./variables/staging.yaml
  test:
    # You can also use glob patterns to import multiple files
    glob: ./variables/test/*.yaml
```

```yaml
# ./variables/global.yaml
# This follows the variable set structure expected by SHC
api:
  description: "API configuration for different environments"
  default_value: "httpbin"
  active_value: "httpbin"
  values:
    httpbin:
      url: "https://httpbin.org"
      timeout: 5000
      debug: true
    github:
      url: "https://api.github.com"
      timeout: 10000
      debug: false

auth:
  description: "Authentication configuration"
  default_value: "default"
  active_value: "default"
  values:
    default:
      token: "${env.API_TOKEN}"
      username: "${env.API_USERNAME}"
```

```yaml
# ./variables/collection-defaults.yaml
user:
  description: "Default user configurations"
  default_value: "default"
  active_value: "default"
  values:
    default:
      id: 1
      name: "John Doe"
      email: "john.doe@example.com"
```

## Benefits

1. **Improved Organization**: Keep configuration files clean and focused
2. **Better Maintainability**: Update variable sets independently
3. **Reusability**: Share variable sets between projects
4. **Scalability**: Support for large and complex variable sets
5. **Flexibility**: Mix inline and file-based variable definitions

## Implementation Status

- [ ] Update variable sets schema in `config.schema.ts`
- [ ] Implement file loading methods in `ConfigManagerImpl`
- [ ] Add glob pattern support
- [ ] Update `loadFromFile` method to process external variable sets
- [ ] Create unit tests for external variable set loading
- [ ] Create integration tests for variable resolution
- [ ] Update documentation with examples and usage patterns

## Acceptance Criteria

1. Users can define variable sets in external files
2. Variable sets can be loaded from both absolute and relative paths
3. Glob patterns are supported for importing multiple files
4. Inline variable definitions and file references can be mixed
5. Template resolution works correctly with external variable sets
6. Proper error handling for missing or invalid files
7. Documentation is updated with examples and usage patterns
