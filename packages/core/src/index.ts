// Sam's HTTP Client (SHC) Core Package
export * from './types/client.types';
export * from './types/collection.types';
export * from './types/config.types';
export * from './types/plugin.types';

// Export implementations
import { SHCClient as SHCClientImpl } from './services/client';
export const SHCClient = {
  ...SHCClientImpl,
  create: SHCClientImpl.create
};
export { ConfigManagerImpl as ConfigManager } from './config-manager';

// Placeholder exports for future implementation
export const CollectionManager = null;
export const PluginManager = null;