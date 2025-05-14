import { z } from 'zod';

// Import the HTTPMethod type to ensure compatibility
import { HTTPMethod } from '../types/collection.types';

/**
 * Schema for authentication configuration
 */
export const authenticationSchema = z.object({
  type: z.string(),
  name: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for request headers
 */
export const headersSchema = z.record(z.string(), z.string()).optional();

/**
 * Schema for request query parameters
 */
export const queryParamsSchema = z.record(z.string(), z.string()).optional();

/**
 * Schema for request body
 */
export const bodySchema = z.unknown().optional();

/**
 * Schema for a request
 */
export const requestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  path: z.string(),
  headers: headersSchema,
  query: queryParamsSchema,
  body: bodySchema,
  authentication: authenticationSchema.optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for a variable set
 */
export const variableSetSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  defaultValue: z.string().optional(),
  activeValue: z.string(),
  values: z.record(z.string(), z.record(z.string(), z.unknown())),
});

/**
 * Schema for a collection
 */
export const collectionSchema = z.object({
  name: z.string(),
  version: z.string(),
  baseUrl: z.string().optional(),
  authentication: authenticationSchema.optional(),
  requests: z.array(requestSchema).default([]),
  variableSets: z.array(variableSetSchema).default([]),
  variableSetOverrides: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Types for schemas derived from the Zod schemas
 */
export type AuthenticationSchema = z.infer<typeof authenticationSchema>;
export type RequestSchema = z.infer<typeof requestSchema>;
export type VariableSetSchema = z.infer<typeof variableSetSchema>;
export type CollectionSchema = z.infer<typeof collectionSchema>;

/**
 * Validate a collection object against the schema
 * @param collection The collection object to validate
 * @returns The validated collection with defaults applied
 * @throws If validation fails
 */
export function validateCollection(collection: unknown): CollectionSchema {
  return collectionSchema.parse(collection);
}

/**
 * Safely validate a collection object against the schema
 * @param collection The collection object to validate
 * @returns A result object with success flag and either the validated collection or error
 */
export function safeValidateCollection(collection: unknown): {
  success: boolean;
  data?: CollectionSchema;
  error?: z.ZodError;
} {
  try {
    const validatedCollection = collectionSchema.parse(collection);
    return { success: true, data: validatedCollection };
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
export function formatCollectionValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}

/**
 * Export all schemas and validation functions
 */
export const CollectionSchemas = {
  authentication: authenticationSchema,
  request: requestSchema,
  variableSet: variableSetSchema,
  collection: collectionSchema,
  validate: validateCollection,
  safeValidate: safeValidateCollection,
  formatErrors: formatCollectionValidationErrors,
};
