import { AuthConfig } from './plugin.types';
import { Response } from './client.types';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface VariableSet {
  name: string;
  description?: string;
  defaultValue?: string;
  activeValue: string;
  values: Record<string, Record<string, unknown>>;
}

export interface Request {
  id: string;
  name: string;
  description?: string;
  method: HTTPMethod;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  authentication?: AuthConfig;
  variables?: Record<string, unknown>;
}

export interface Collection {
  name: string;
  version: string;
  baseUrl?: string;
  variableSets: VariableSet[];
  variableSetOverrides?: Record<string, string>;
  requests: Request[];
  authentication?: AuthConfig;
  /**
   * Metadata about the collection
   * This is used internally by the system and not part of the user-facing API
   */
  metadata?: {
    /**
     * The file path where this collection was loaded from
     */
    filePath?: string;
    /**
     * The file name where this collection was loaded from
     */
    fileName?: string;
    /**
     * Any other metadata properties
     */
    [key: string]: unknown;
  };
}

export interface ExecuteOptions {
  variableOverrides?: Record<string, unknown>;
  timeout?: number;
}

export interface CollectionManager {
  // Collection operations
  loadCollection(path: string): Promise<Collection>;
  loadCollectionsFromDirectory(directoryPath: string): Promise<string[]>;


  // Request execution
  executeRequest<T = unknown>(
    collection: string,
    requestId: string,
    options?: ExecuteOptions
  ): Promise<Response<T>>;
}
