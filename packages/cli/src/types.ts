/**
 * Type definitions
 */

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Request options
export interface RequestOptions {
  id?: string;
  name?: string;
  description?: string;
  method: HttpMethod;
  url?: string;
  path?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  data?: unknown;
  body?: {
    type: string;
    content: string;
  };
  auth?: {
    type: string;
    credentials?: string;
    username?: string;
    password?: string;
    token?: string;
  };
  authentication?: {
    type: string;
    username?: string;
    password?: string;
    token?: string;
  };
  cookies?: Record<string, string>;
  timeout?: number;
}

/**
 * Request info for listing and selection
 */
export interface RequestInfo {
  id: string;
  name: string;
  description?: string;
  method?: string;
}

// Output options
export interface OutputOptions {
  format: 'json' | 'yaml' | 'raw' | 'table';
  color: boolean;
  verbose: boolean;
  quiet: boolean;
}

// Global options
export interface GlobalOptions {
  verbose?: boolean;
  quiet?: boolean;
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
