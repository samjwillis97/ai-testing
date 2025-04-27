/**
 * Type definitions
 */

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Request options
export interface RequestOptions {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  data?: unknown;
  auth?: {
    type: string;
    credentials: string;
  };
  timeout?: number;
}

// Output options
export interface OutputOptions {
  format: 'json' | 'yaml' | 'raw' | 'table';
  color: boolean;
  verbose: boolean;
  silent: boolean;
}

// Global options
export interface GlobalOptions {
  verbose?: boolean;
  silent?: boolean;
  color?: boolean;
  config?: string;
  env?: string;
}

// Collection options
export interface CollectionOptions {
  collectionDir?: string;
  save?: boolean;
  export?: string;
  import?: string;
}
