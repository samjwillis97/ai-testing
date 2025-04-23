import { PluginManager } from './PluginManager';
import { RequestPreprocessorPlugin, TemplateFunction } from '../types/plugin';

export interface TemplateFunctionCall {
  plugin: string;
  function: string;
  arguments: any[];
}

export class TemplateResolutionError extends Error {
  constructor(
    public readonly template: string,
    message: string,
    public readonly cause?: Error
  ) {
    super(`Failed to resolve template "${template}": ${message}`);
    this.name = 'TemplateResolutionError';
  }
}

export class TemplateResolver {
  private static readonly TEMPLATE_REGEX = /\${([^}]+)}/g;
  private static readonly FUNCTION_CALL_REGEX = /^([^.]+)\.([^(]+)(?:\((.*)\))?$/;

  constructor(private readonly pluginManager: PluginManager) {}

  /**
   * Parse a template string and extract all function calls
   */
  public parseTemplate(template: string): TemplateFunctionCall[] {
    const calls: TemplateFunctionCall[] = [];
    
    template.replace(TemplateResolver.TEMPLATE_REGEX, (match, expr) => {
      const functionCall = this.parseFunctionCall(expr.trim());
      if (functionCall) {
        calls.push(functionCall);
      }
      return match;
    });

    return calls;
  }

  /**
   * Parse a single function call expression
   */
  private parseFunctionCall(expr: string): TemplateFunctionCall | null {
    const match = expr.match(TemplateResolver.FUNCTION_CALL_REGEX);
    if (!match) {
      return null;
    }

    const [, plugin, func, args] = match;
    const parsedArgs = args ? this.parseArguments(args) : [];

    return {
      plugin,
      function: func,
      arguments: parsedArgs
    };
  }

  /**
   * Parse function arguments string into array of values
   */
  private parseArguments(args: string): any[] {
    // Simple argument parsing - split by comma and trim
    // In a real implementation, this would need to handle nested objects, arrays, quotes, etc.
    return args.split(',').map(arg => arg.trim());
  }

  /**
   * Execute a template function call
   */
  public async executeTemplateFunction(
    call: TemplateFunctionCall
  ): Promise<any> {
    try {
      const plugin = this.pluginManager.getPlugin(call.plugin) as RequestPreprocessorPlugin;
      
      if (!plugin) {
        throw new Error(`Plugin "${call.plugin}" not found`);
      }

      if (!plugin.providedFunctions) {
        throw new Error(`Plugin "${call.plugin}" does not provide any functions`);
      }

      const func = plugin.providedFunctions[call.function];
      if (!func) {
        throw new Error(
          `Function "${call.function}" not found in plugin "${call.plugin}"`
        );
      }

      // Validate arguments
      this.validateArguments(func, call.arguments);

      // Execute function
      return await func.execute(...call.arguments);
    } catch (error) {
      throw new TemplateResolutionError(
        `${call.plugin}.${call.function}(${call.arguments.join(', ')})`,
        (error as Error).message,
        error as Error
      );
    }
  }

  /**
   * Validate function arguments against parameter definitions
   */
  private validateArguments(func: TemplateFunction, args: any[]): void {
    if (!func.parameters) {
      if (args.length > 0) {
        throw new Error(
          `Function takes no parameters but received ${args.length}`
        );
      }
      return;
    }

    const requiredParams = func.parameters.filter(p => p.required);
    if (args.length < requiredParams.length) {
      throw new Error(
        `Function requires ${requiredParams.length} parameters but received ${args.length}`
      );
    }

    // In a real implementation, we would also validate argument types
  }

  /**
   * Resolve all template expressions in a string
   */
  public async resolveString(template: string): Promise<string> {
    const calls = this.parseTemplate(template);
    if (calls.length === 0) {
      return template;
    }

    const results = await Promise.all(
      calls.map(call => this.executeTemplateFunction(call))
    );

    return template.replace(TemplateResolver.TEMPLATE_REGEX, () => {
      const result = results.shift();
      return result?.toString() ?? '';
    });
  }

  /**
   * Recursively resolve all template expressions in an object
   */
  public async resolveObject<T>(obj: T): Promise<T> {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        return await this.resolveString(obj) as any;
      }
      return obj;
    }

    const result: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      result[key] = await this.resolveObject(value);
    }

    return result;
  }
} 