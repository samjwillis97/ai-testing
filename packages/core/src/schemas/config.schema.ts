import { z } from 'zod';

/**
 * Schema for HTTP retry configuration
 */
export const httpRetrySchema = z.object({
  attempts: z.number().int().min(0).default(3),
  backoff: z.enum(['linear', 'exponential', 'fixed']).default('exponential'),
});

/**
 * Schema for TLS configuration
 */
export const tlsSchema = z.object({
  verify: z.boolean().default(true),
  ca: z.string().optional(),
  cert: z.string().optional(),
  key: z.string().optional(),
  passphrase: z.string().optional(),
});

/**
 * Schema for HTTP configuration
 */
export const httpSchema = z.object({
  timeout: z.number().int().min(0).default(30000),
  max_redirects: z.number().int().min(0).default(5),
  retry: httpRetrySchema.default({}),
  tls: tlsSchema.default({}),
});

/**
 * Schema for logging configuration
 */
export const loggingSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  format: z.enum(['text', 'json']).default('text'),
  output: z.enum(['console', 'file']).default('console'),
  file_path: z.string().optional(),
});

/**
 * Schema for core configuration
 */
export const coreSchema = z.object({
  http: httpSchema.default({}),
  logging: loggingSchema.default({}),
});

/**
 * Schema for file reference for variable sets
 */
export const fileReferenceSchema = z.object({
  file: z.string(),
  glob: z.string().optional(),
});

/**
 * Schema for variable values that can be either inline or from a file
 */
export const variableValuesSchema = z.union([z.record(z.string(), z.any()), fileReferenceSchema]);

/**
 * Schema for variable sets
 */
export const variableSetsSchema = z
  .object({
    global: variableValuesSchema.default({}),
    collection_defaults: variableValuesSchema.default({}),
    request_overrides: variableValuesSchema.default({}), // Add request-specific overrides
  })
  .catchall(variableValuesSchema); // Allow additional named variable sets

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
 * Schema for CLI configuration
 */
export const cliSchema = z.object({
  plugins: z.array(pluginConfigSchema).optional(),
  outputFormats: z.array(z.string()).optional(),
  defaultFormat: z.string().optional(),
  autoComplete: z.boolean().optional(),
});

/**
 * Schema for plugins configuration
 */
export const pluginsSchema = z.object({
  auth: z.array(pluginConfigSchema).default([]),
  preprocessors: z.array(pluginConfigSchema).default([]),
  transformers: z.array(pluginConfigSchema).default([]),
});

/**
 * Schema for storage collections configuration
 */
export const storageCollectionsSchema = z.object({
  type: z.enum(['file', 'memory']).default('file'),
  path: z.string().default('./collections'),
});

/**
 * Schema for storage configuration
 */
export const storageSchema = z.object({
  collections: storageCollectionsSchema.default({}),
});

/**
 * Schema for the main SHC configuration
 */
export const configSchema = z.object({
  name: z.string().default('Default SHC Configuration'),
  version: z.string().default('1.0.0'),
  core: coreSchema.default({}),
  variable_sets: variableSetsSchema.default({}),
  plugins: pluginsSchema.default({}),
  storage: storageSchema.default({}),
  cli: cliSchema.optional(),
});

/**
 * Type for the SHC configuration derived from the schema
 */
export type SHCConfigSchema = z.infer<typeof configSchema>;

/**
 * Validate a configuration object against the schema
 * @param config The configuration object to validate
 * @returns The validated configuration with defaults applied
 * @throws If validation fails
 */
export function validateConfig(config: unknown): SHCConfigSchema {
  return configSchema.parse(config);
}

/**
 * Safely validate a configuration object against the schema
 * @param config The configuration object to validate
 * @returns A result object with success flag and either the validated config or error
 */
export function safeValidateConfig(config: unknown): {
  success: boolean;
  data?: SHCConfigSchema;
  error?: z.ZodError;
} {
  try {
    const validatedConfig = configSchema.parse(config);
    return { success: true, data: validatedConfig };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Validate a partial configuration object against the schema
 * @param config The partial configuration object to validate
 * @returns The validated partial configuration
 * @throws If validation fails
 */
export function validatePartialConfig(config: unknown): Partial<SHCConfigSchema> {
  return configSchema.partial().parse(config);
}

/**
 * Format Zod validation errors into a more readable format
 * @param error The Zod error to format
 * @returns A formatted error message
 */
export function formatValidationErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return `${path ? path + ': ' : ''}${err.message}`;
    })
    .join('\n');
}
