// Sam's HTTP Client (SHC) Core Package
export * from './types/client.types';
export * from './types/collection.types';
export type { 
  RequestConfig, 
  ConfigManagerOptions, 
  TemplateFunction, 
  TemplateContext, 
  ValidationResult, 
  PluginConfig,
  CLIConfig,
  AnyObject,
  TemplateFunctionType
} from './types/config.types';
export * from './types/plugin.types';
export * from './types/plugin-manager.types';

// Export logging types and classes
export type { LogEmitter, LogLevel, LogEvent } from './types/log-emitter.types';
export { ClientLogger, NoopLogger } from './services/logger';

// Export schemas
export { CollectionSchemas, validateCollection, safeValidateCollection, formatCollectionValidationErrors } from './schemas/collection.schema';
export type { 
  AuthenticationSchema,
  RequestSchema,
  VariableSetSchema,
  CollectionSchema
} from './schemas/collection.schema';

export { PluginSchemas, validatePlugin, safeValidatePlugin, formatPluginValidationErrors } from './schemas/plugin.schema';
export type { PluginSchema } from './schemas/plugin.schema';

// Export file utilities
export { 
  getFileFormat,
  fileExists,
  readAndParseFile,
  findFilesByExtension,
  findFileWithExtensions
} from './utils/file-utils';
export type { FileFormat } from './utils/file-utils';

// Export implementations
import { SHCClient as SHCClientImpl } from './services/client';
export const SHCClient = {
  ...SHCClientImpl,
  create: SHCClientImpl.create
};
export { ConfigManagerImpl as ConfigManager } from './config-manager';
export { CollectionManagerImpl, createCollectionManager } from './services/collection-manager';
export { PluginManagerImpl, createPluginManager } from './services/plugin-manager';