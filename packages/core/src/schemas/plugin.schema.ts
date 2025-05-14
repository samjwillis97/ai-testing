import { z } from 'zod';
import { SHCPlugin, PluginType } from '../types/plugin.types';

/**
 * Schema for plugin configuration
 */
export const pluginConfigSchema = z.object({
  name: z.string(),
  package: z.string().optional(),
  path: z.string().optional(),
  git: z.string().optional(),
  ref: z.string().optional(),
  version: z.string().optional(),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).optional(),
  dependencies: z
    .array(
      z.object({
        name: z.string(),
        package: z.string(),
      })
    )
    .optional(),
  permissions: z
    .object({
      filesystem: z
        .object({
          read: z.array(z.string()).optional(),
          write: z.array(z.string()).optional(),
        })
        .optional(),
      network: z.array(z.string()).optional(),
      env: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Schema for SHC Plugin
 */
export const pluginSchema = z.object({
  name: z.string(),
  version: z.string(),
  type: z.nativeEnum(PluginType),
  description: z.string().optional(),
  author: z.string().optional(),
  homepage: z.string().optional(),
  execute: z.function().args(z.any()).returns(z.any()),
  initialize: z.function().args().returns(z.promise(z.void())).optional(),
  configure: z.function().args(z.record(z.string(), z.unknown())).returns(z.promise(z.void())).optional(),
  destroy: z.function().args().returns(z.promise(z.void())).optional(),
});

/**
 * Type for the plugin schema derived from the Zod schema
 */
export type PluginSchema = z.infer<typeof pluginSchema>;

/**
 * Validate a plugin object against the schema
 * @param plugin The plugin object to validate
 * @returns The validated plugin with defaults applied
 * @throws If validation fails
 */
export function validatePlugin(plugin: unknown): SHCPlugin {
  return pluginSchema.parse(plugin) as SHCPlugin;
}

/**
 * Safely validate a plugin object against the schema
 * @param plugin The plugin object to validate
 * @returns A result object with success flag and either the validated plugin or error
 */
export function safeValidatePlugin(plugin: unknown): {
  success: boolean;
  data?: SHCPlugin;
  error?: z.ZodError;
} {
  try {
    const validatedPlugin = pluginSchema.parse(plugin) as SHCPlugin;
    return { success: true, data: validatedPlugin };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Format validation errors from a ZodError
 * @param error The ZodError to format
 * @returns An array of formatted error messages
 */
export function formatPluginValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}

/**
 * Export all schemas and validation functions
 */
export const PluginSchemas = {
  plugin: pluginSchema,
  config: pluginConfigSchema,
  validate: validatePlugin,
  safeValidate: safeValidatePlugin,
  formatErrors: formatPluginValidationErrors,
};
