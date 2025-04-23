export * from './client.js';
export * from './types.js';
export { HttpClient } from './client.js';
export type { Collection, Request } from './types.js';

// Plugin system types
export {
  PluginType,
  SHCPlugin,
  RequestPreprocessorPlugin,
  ResponseTransformerPlugin,
  AuthProviderPlugin,
  TemplateFunction,
  TemplateFunctionParameter,
  HTTPRequest,
  HTTPResponse,
  HTTPMethod,
  AuthContext,
  AuthResult,
  PluginConfig
} from './types/plugin';

// Plugin management
export {
  PluginManager,
  PluginLoadError
} from './plugin/PluginManager';

// Template resolution
export {
  TemplateResolver,
  TemplateResolutionError,
  TemplateFunctionCall
} from './plugin/TemplateResolver';
