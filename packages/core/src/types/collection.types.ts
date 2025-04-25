import { AuthConfig } from './plugin.types';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface VariableSet {
  name: string;
  description?: string;
  defaultValue?: string;
  activeValue: string;
  values: Record<string, Record<string, any>>;
}

export interface Request {
  id: string;
  name: string;
  description?: string;
  method: HTTPMethod;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  authentication?: AuthConfig;
  variables?: Record<string, any>;
}

export interface Collection {
  name: string;
  version: string;
  baseUrl?: string;
  variableSets: VariableSet[];
  variableSetOverrides?: Record<string, string>;
  requests: Request[];
  authentication?: AuthConfig;
}

export interface ExecuteOptions {
  variableOverrides?: Record<string, any>;
  timeout?: number;
}

export interface CollectionManager {
  // Collection operations
  loadCollection(path: string): Promise<Collection>;
  saveCollection(collection: Collection): Promise<void>;
  createCollection(name: string, config?: Partial<Collection>): Promise<Collection>;
  deleteCollection(name: string): Promise<void>;
  
  // Request management
  addRequest(collection: string, request: Request): Promise<void>;
  updateRequest(collection: string, requestId: string, request: Request): Promise<void>;
  deleteRequest(collection: string, requestId: string): Promise<void>;
  
  // Global variable set management
  addGlobalVariableSet(variableSet: VariableSet): Promise<void>;
  updateGlobalVariableSet(name: string, variableSet: VariableSet): Promise<void>;
  getGlobalVariableSet(name: string): Promise<VariableSet>;
  setGlobalVariableSetValue(setName: string, valueName: string): Promise<void>;
  
  // Collection variable set management
  addVariableSet(collection: string, variableSet: VariableSet): Promise<void>;
  updateVariableSet(collection: string, name: string, variableSet: VariableSet): Promise<void>;
  getVariableSet(collection: string, name: string): Promise<VariableSet>;
  setVariableSetValue(collection: string, setName: string, valueName: string): Promise<void>;
  
  // Request execution
  executeRequest(collection: string, requestId: string, options?: ExecuteOptions): Promise<Response>;
}