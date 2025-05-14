import { TemplateFunction, TemplateContext } from '../types/config.types';

/**
 * Template Engine for resolving dynamic templates in configuration and requests
 */
export class TemplateEngine {
  private functions: Map<string, TemplateFunction> = new Map();

  /**
   * Register a template function with a namespace
   * @param namespace The namespace for the function (typically plugin name)
   * @param func The template function to register
   */
  registerFunction(namespace: string, func: TemplateFunction): void {
    const key = `${namespace}.${func.name}`;
    this.functions.set(key, func);
  }

  /**
   * Get a template function by its full path
   * @param path The full path to the function (namespace.functionName)
   * @returns The template function or undefined if not found
   */
  getFunction(path: string): TemplateFunction | undefined {
    // Only return a function if the path exactly matches a registered function path
    // This ensures namespaces themselves don't return a function
    if (this.functions.has(path)) {
      return this.functions.get(path);
    }
    return undefined;
  }

  /**
   * List all registered template functions
   * @returns Array of registered function paths
   */
  listFunctions(): string[] {
    return Array.from(this.functions.keys());
  }

  /**
   * Parse template arguments from a string
   * @param argsString The arguments string to parse
   * @returns Array of parsed arguments
   */
  private parseTemplateArgs(argsString: string): unknown[] {
    if (!argsString.trim()) {
      return [];
    }

    // Split by commas, but respect quotes and nested structures
    const args: unknown[] = [];
    let currentArg = '';
    let inQuotes = false;
    let quoteChar = '';
    let bracketCount = 0;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      // Handle quotes
      if ((char === '"' || char === "'") && (i === 0 || argsString[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
        } else {
          currentArg += char;
        }
        continue;
      }

      // Handle brackets
      if (char === '{' || char === '[' || char === '(') {
        bracketCount++;
      } else if (char === '}' || char === ']' || char === ')') {
        bracketCount--;
      }

      // Handle commas
      if (char === ',' && !inQuotes && bracketCount === 0) {
        args.push(this.parseArgValue(currentArg.trim()));
        currentArg = '';
        continue;
      }

      currentArg += char;
    }

    // Add the last argument
    if (currentArg.trim()) {
      args.push(this.parseArgValue(currentArg.trim()));
    }

    return args;
  }

  /**
   * Parse a single argument value to the appropriate type
   * @param arg The argument string to parse
   * @returns The parsed argument value
   */
  private parseArgValue(arg: string): unknown {
    // Handle string literals
    if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
      return arg.slice(1, -1);
    }

    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(arg)) {
      return Number(arg);
    }

    // Handle booleans
    if (arg === 'true') return true;
    if (arg === 'false') return false;
    if (arg === 'null') return null;
    if (arg === 'undefined') return undefined;

    // Handle objects and arrays
    try {
      return JSON.parse(arg);
    } catch {
      // Not valid JSON, return as string
      return arg;
    }
  }

  /**
   * Resolve a template string using registered functions
   * @param template The template string to resolve
   * @param context The context for template resolution
   * @returns The resolved string
   */
  async resolve(template: string, context: Partial<TemplateContext> = {}): Promise<string> {
    // Create a complete context with defaults
    const fullContext: TemplateContext = {
      env: context.env || {},
      config: context.config || {},
      variables: context.variables || {},
      secrets: context.secrets || {},
      ...context,
    };

    // First, handle environment variable syntax: ${env.VARIABLE_NAME}
    let result = template.replace(/\${env\.([^}]+)}/g, (_, envVar) => {
      return String(fullContext.env[envVar] || '');
    });

    // Handle config variable syntax: ${config.path.to.value}
    result = result.replace(/\${config\.([^}]+)}/g, (_, path) => {
      return String(this.getValueByPath(fullContext.config, path) || '');
    });

    // Handle variable syntax: ${variables.name}
    result = result.replace(/\${variables\.([^}]+)}/g, (_, path) => {
      return String(this.getValueByPath(fullContext.variables, path) || '');
    });

    // Handle secret syntax: ${secrets.SECRET_NAME}
    result = result.replace(/\${secrets\.([^}]+)}/g, (_, secret) => {
      return String(fullContext.secrets?.[secret] || '');
    });

    // Handle function calls: ${namespace.function(args)}
    result = await this.resolveTemplateFunctions(result, fullContext);

    return result;
  }

  /**
   * Resolve template functions in a string
   * @param template The template string with function calls
   * @param context The context for template resolution
   * @returns The resolved string
   */
  private async resolveTemplateFunctions(
    template: string,
    context: TemplateContext
  ): Promise<string> {
    // Match pattern: ${namespace.function(args)}
    const functionPattern = /\${([^.}]+)\.([^(}]+)(?:\(([^)]*)\))?}/g;

    // Use a Set to track processed matches and avoid infinite loops
    const processedMatches = new Set<string>();

    let match: RegExpExecArray | null;
    let result = template;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    // First, pre-process nested function calls
    // This handles cases like ${math.add(${math.double(2)}, 3)}
    result = await this.preProcessNestedFunctions(result, context);

    // Continue resolving until no more matches or max iterations reached
    while ((match = functionPattern.exec(result)) !== null && iterations < maxIterations) {
      iterations++;

      const [fullMatch, namespace, funcName, args] = match;

      // Skip if already processed this exact match
      if (processedMatches.has(fullMatch)) {
        continue;
      }

      processedMatches.add(fullMatch);

      // Get the function
      const funcPath = `${namespace}.${funcName}`;
      const func = this.getFunction(funcPath);

      if (!func) {
        // Function not found, leave as is
        continue;
      }

      try {
        // Parse arguments
        const parsedArgs = args ? this.parseTemplateArgs(args) : [];

        // Execute the function
        const funcResult = await func.execute(...parsedArgs);

        // Replace the function call with the result
        result = result.replace(fullMatch, String(funcResult));

        // Reset the regex to find more matches
        functionPattern.lastIndex = 0;
      } catch (error) {
        // On error, replace with error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        result = result.replace(fullMatch, `[Error: ${errorMessage}]`);

        // Reset the regex to find more matches
        functionPattern.lastIndex = 0;
      }
    }

    return result;
  }

  /**
   * Pre-process nested function calls in a template
   * @param template The template string with potentially nested function calls
   * @param context The context for template resolution
   * @returns The template with nested function calls resolved
   */
  private async preProcessNestedFunctions(
    template: string,
    context: TemplateContext
  ): Promise<string> {
    // Match pattern for nested function calls: ${namespace.function(${...})}
    const nestedPattern = /\${([^.}]+)\.([^(}]+)\(([^)]*\${[^}]+}[^)]*)\)}/g;

    let match: RegExpExecArray | null;
    let result = template;
    let iterations = 0;
    const maxIterations = 10; // Increased from 5 to handle more complex nesting

    // Continue resolving nested calls until no more matches or max iterations reached
    while ((match = nestedPattern.exec(result)) !== null && iterations < maxIterations) {
      iterations++;

      const [fullMatch, namespace, funcName, argsWithNested] = match;

      // First, resolve any nested templates in the arguments
      let resolvedArgs = argsWithNested;

      // Look for nested templates within the arguments
      const nestedTemplatePattern = /\${([^}]+)}/g;
      let nestedMatch;

      // Process each nested template within the arguments
      while ((nestedMatch = nestedTemplatePattern.exec(argsWithNested)) !== null) {
        const [nestedFullMatch, nestedTemplate] = nestedMatch;
        // Resolve the nested template
        const resolvedNestedTemplate = await this.resolve(`\${${nestedTemplate}}`, context);
        // Replace in the args string
        resolvedArgs = resolvedArgs.replace(nestedFullMatch, resolvedNestedTemplate);
      }

      // Replace the nested function call with the non-nested version
      const replacementTemplate = `\${${namespace}.${funcName}(${resolvedArgs})}`;
      result = result.replace(fullMatch, replacementTemplate);

      // Reset the regex to find more matches
      nestedPattern.lastIndex = 0;
    }

    return result;
  }

  /**
   * Resolve all templates in an object
   * @param obj The object containing templates to resolve
   * @param context The context for template resolution
   * @returns The resolved object
   */
  async resolveObject<T>(
    obj: T,
    context: Partial<TemplateContext> = {},
    visited: WeakMap<object, boolean> = new WeakMap()
  ): Promise<T> {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return (await this.resolve(obj, context)) as unknown as T;
    }

    if (Array.isArray(obj)) {
      // Check for circular references in arrays
      if (visited.has(obj)) {
        return obj; // Return the object as is to break the circular reference
      }
      visited.set(obj, true);

      return (await Promise.all(
        obj.map((item) => this.resolveObject(item, context, visited))
      )) as unknown as T;
    }

    if (typeof obj === 'object') {
      // Check for circular references in objects
      if (visited.has(obj)) {
        return obj; // Return the object as is to break the circular reference
      }
      visited.set(obj, true);

      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
        result[key] = await this.resolveObject(value, context, visited);
      }

      return result as T;
    }

    return obj;
  }

  /**
   * Get a value from an object by dot-notation path
   * @param obj The object to get the value from
   * @param path The dot-notation path to the value
   * @returns The value at the path or undefined if not found
   */
  private getValueByPath(obj: unknown, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return current;
  }
}

/**
 * Create a new template engine instance
 * @returns A new TemplateEngine instance
 */
export function createTemplateEngine(): TemplateEngine {
  return new TemplateEngine();
}
