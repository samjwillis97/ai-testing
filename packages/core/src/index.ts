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

// Export implementations
import { SHCClient as SHCClientImpl } from './services/client';
export const SHCClient = {
  ...SHCClientImpl,
  create: SHCClientImpl.create
};
export { ConfigManagerImpl as ConfigManager } from './config-manager';
export { CollectionManagerImpl, createCollectionManager } from './services/collection-manager';
export { PluginManagerImpl, createPluginManager } from './services/plugin-manager';