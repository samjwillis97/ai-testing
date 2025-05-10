# CLI Core Integration Specification

## Overview

This document specifies how the CLI package (@shc/cli) integrates with the Core package (@shc/core). It outlines the integration points, data flow, and communication patterns between the two packages.

## Integration Architecture

The CLI package uses the Core package as a dependency, leveraging its HTTP client, configuration management, and plugin system capabilities. The integration follows a clean architecture approach, with the CLI layer consuming the core functionality through well-defined interfaces.

```
┌────────────────────────────────────────┐
│               @shc/cli                 │
│                                        │
│  ┌─────────────┐      ┌─────────────┐  │
│  │  Commands   │      │   Logging   │  │
│  └─────────────┘      └─────────────┘  │
│           │                  │         │
│           ▼                  ▼         │
│  ┌─────────────────────────────────┐   │
│  │        Integration Layer        │   │
│  └─────────────────────────────────┘   │
│                    │                    │
└────────────────────┼────────────────────┘
                     │
┌────────────────────┼────────────────────┐
│                    ▼                    │
│  ┌─────────────────────────────────┐   │
│  │           @shc/core             │   │
│  └─────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

## Core Service Integration

### HTTP Client Integration

The CLI package wraps the Core HTTP client to provide a command-line interface for making HTTP requests.

```typescript
// CLI HTTP Client wrapper
export class CLIHttpClient {
  private client: SHCClient;
  private logger: Logger;
  
  constructor(config: ClientConfig) {
    this.client = createSHCClient(config);
    this.logger = Logger.getInstance();
  }
  
  async request<T>(config: RequestConfig): Promise<Response<T>> {
    const spinner = this.logger.createSpinner('Executing request...');
    spinner.start();
    
    try {
      const response = await this.client.request<T>(config);
      
      spinner.succeed('Request completed successfully');
      this.logResponse(response);
      
      return response;
    } catch (error) {
      spinner.fail(`Request failed: ${error.message}`);
      throw error;
    }
  }
  
  private logResponse(response: Response<any>): void {
    this.logger.info(`Status: ${response.status} ${response.statusText}`);
    this.logger.info(`Time: ${response.time}ms`);
    this.logger.info(`Size: ${this.formatSize(response.size)}`);
    
    if (this.logger.getLevel() === 'debug') {
      this.logger.debug('Headers:');
      Object.entries(response.headers).forEach(([key, value]) => {
        this.logger.debug(`  ${key}: ${value}`);
      });
    }
    
    // Format response body based on content type
    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      this.logger.json(response.data);
    } else {
      this.logger.info('Response Body:');
      this.logger.info(response.data);
    }
  }
  
  private formatSize(bytes: number): string {
    // Implementation for formatting size
    return '';
  }
}
```

#### Integration Points

1. **Request Command**:
   - CLI commands transform command-line arguments into RequestConfig objects
   - Core client executes the requests
   - CLI formats and displays the response

2. **Request Options**:
   - CLI options map directly to Core request options
   - Core validation ensures request integrity
   - CLI provides sensible defaults for options

### Configuration Management Integration

The CLI package provides commands for managing the Core configuration.

```typescript
// CLI Configuration Manager wrapper
export class CLIConfigManager {
  private configManager: ConfigManager;
  private logger: Logger;
  
  constructor() {
    this.configManager = createConfigManager();
    this.logger = Logger.getInstance();
  }
  
  async loadConfig(filePath: string): Promise<void> {
    const spinner = this.logger.createSpinner(`Loading configuration from ${filePath}...`);
    spinner.start();
    
    try {
      await this.configManager.loadFromFile(filePath);
      spinner.succeed('Configuration loaded successfully');
    } catch (error) {
      spinner.fail(`Failed to load configuration: ${error.message}`);
      throw error;
    }
  }
  
  getConfig(path?: string): any {
    if (path) {
      return this.configManager.get(path);
    } else {
      // Return the entire configuration
      return this.configManager.get('');
    }
  }
  
  setConfig(path: string, value: any): void {
    try {
      this.configManager.set(path, value);
      this.logger.success(`Configuration updated: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to update configuration: ${error.message}`);
      throw error;
    }
  }
  
  async saveConfig(filePath: string): Promise<void> {
    const spinner = this.logger.createSpinner(`Saving configuration to ${filePath}...`);
    spinner.start();
    
    try {
      // Implementation for saving configuration
      spinner.succeed('Configuration saved successfully');
    } catch (error) {
      spinner.fail(`Failed to save configuration: ${error.message}`);
      throw error;
    }
  }
}
```

#### Integration Points

1. **Configuration Commands**:
   - CLI commands for viewing, setting, and resetting configuration
   - Core validation ensures configuration integrity
   - CLI formats and displays configuration values

2. **Configuration Loading**:
   - CLI loads configuration from file
   - Core handles parsing and validation
   - CLI displays validation errors in a user-friendly format

### Plugin System Integration

The CLI package provides commands for managing the Core plugin system.

```typescript
// CLI Plugin Manager wrapper
export class CLIPluginManager {
  private pluginManager: PluginManager;
  private logger: Logger;
  
  constructor() {
    this.pluginManager = createPluginManager();
    this.logger = Logger.getInstance();
  }
  
  async installPlugin(source: string, options: PluginInstallOptions = {}): Promise<void> {
    const spinner = this.logger.createSpinner(`Installing plugin from ${source}...`);
    spinner.start();
    
    try {
      await this.pluginManager.installPlugin(source, options);
      spinner.succeed('Plugin installed successfully');
    } catch (error) {
      spinner.fail(`Failed to install plugin: ${error.message}`);
      throw error;
    }
  }
  
  listPlugins(): Plugin[] {
    return this.pluginManager.getPlugins();
  }
  
  async enablePlugin(name: string): Promise<void> {
    const spinner = this.logger.createSpinner(`Enabling plugin ${name}...`);
    spinner.start();
    
    try {
      await this.pluginManager.enablePlugin(name);
      spinner.succeed(`Plugin ${name} enabled successfully`);
    } catch (error) {
      spinner.fail(`Failed to enable plugin: ${error.message}`);
      throw error;
    }
  }
  
  async disablePlugin(name: string): Promise<void> {
    const spinner = this.logger.createSpinner(`Disabling plugin ${name}...`);
    spinner.start();
    
    try {
      await this.pluginManager.disablePlugin(name);
      spinner.succeed(`Plugin ${name} disabled successfully`);
    } catch (error) {
      spinner.fail(`Failed to disable plugin: ${error.message}`);
      throw error;
    }
  }
  
  async removePlugin(name: string, options: PluginRemoveOptions = {}): Promise<void> {
    const spinner = this.logger.createSpinner(`Removing plugin ${name}...`);
    spinner.start();
    
    try {
      await this.pluginManager.removePlugin(name, options);
      spinner.succeed(`Plugin ${name} removed successfully`);
    } catch (error) {
      spinner.fail(`Failed to remove plugin: ${error.message}`);
      throw error;
    }
  }
}

interface PluginInstallOptions {
  name?: string;
  disable?: boolean;
}

interface PluginRemoveOptions {
  force?: boolean;
}
```

#### Integration Points

1. **Plugin Commands**:
   - CLI commands for installing, listing, enabling, disabling, and removing plugins
   - Core handles plugin lifecycle management
   - CLI displays plugin status and errors

2. **Plugin Discovery**:
   - CLI discovers available plugins
   - Core provides plugin metadata
   - CLI displays plugin information in a user-friendly format

### Collection Management Integration

The CLI package provides commands for managing the Core collection system.

```typescript
// CLI Collection Manager wrapper
export class CLICollectionManager {
  private collectionManager: CollectionManager;
  private logger: Logger;
  
  constructor() {
    this.collectionManager = createCollectionManager();
    this.logger = Logger.getInstance();
  }
  
  async importCollection(filePath: string, options: ImportOptions = {}): Promise<void> {
    const spinner = this.logger.createSpinner(`Importing collection from ${filePath}...`);
    spinner.start();
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      await this.collectionManager.importCollection(content, options);
      spinner.succeed('Collection imported successfully');
    } catch (error) {
      spinner.fail(`Failed to import collection: ${error.message}`);
      throw error;
    }
  }
  
  async exportCollection(collectionId: string, filePath: string, options: ExportOptions = {}): Promise<void> {
    const spinner = this.logger.createSpinner(`Exporting collection to ${filePath}...`);
    spinner.start();
    
    try {
      const content = await this.collectionManager.exportCollection(collectionId, options);
      await fs.writeFile(filePath, content);
      spinner.succeed('Collection exported successfully');
    } catch (error) {
      spinner.fail(`Failed to export collection: ${error.message}`);
      throw error;
    }
  }
  
  listCollections(): Collection[] {
    return this.collectionManager.getCollections();
  }
  
  async createCollection(name: string, options: CreateCollectionOptions = {}): Promise<string> {
    try {
      const id = await this.collectionManager.createCollection(name, options);
      this.logger.success(`Collection created with ID: ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to create collection: ${error.message}`);
      throw error;
    }
  }
  
  async executeCollection(collectionId: string, options: ExecuteCollectionOptions = {}): Promise<void> {
    const spinner = this.logger.createSpinner(`Executing collection...`);
    spinner.start();
    
    try {
      const results = await this.collectionManager.executeCollection(collectionId, options);
      spinner.succeed('Collection executed successfully');
      this.logCollectionResults(results);
    } catch (error) {
      spinner.fail(`Failed to execute collection: ${error.message}`);
      throw error;
    }
  }
  
  private logCollectionResults(results: CollectionExecutionResult[]): void {
    // Implementation for logging collection execution results
  }
}

interface ImportOptions {
  merge?: boolean;
  format?: 'yaml' | 'json';
}

interface ExportOptions {
  format?: 'yaml' | 'json';
  pretty?: boolean;
}

interface CreateCollectionOptions {
  description?: string;
  baseUrl?: string;
}

interface ExecuteCollectionOptions {
  environment?: string;
  delay?: number;
  parallel?: boolean;
}

interface CollectionExecutionResult {
  requestId: string;
  requestName: string;
  success: boolean;
  response?: Response<any>;
  error?: Error;
  time: number;
}
```

#### Integration Points

1. **Collection Commands**:
   - CLI commands for importing, exporting, creating, and executing collections
   - Core handles collection management and execution
   - CLI displays collection information and execution results

2. **Collection Execution**:
   - CLI executes collections with options
   - Core handles request execution and variable resolution
   - CLI displays execution progress and results

## Command-Line Argument Mapping

The CLI package maps command-line arguments to Core package interfaces. This mapping ensures that CLI commands can be easily translated into Core function calls.

### Request Command Mapping

```typescript
// Command-line arguments to RequestConfig mapping
function mapRequestArgs(args: any, options: any): RequestConfig {
  return {
    method: options.method || 'GET',
    url: args.url,
    headers: parseHeaders(options.header || []),
    params: parseQueryParams(options.query || []),
    data: parseData(options.data, options.form),
    timeout: options.timeout,
    maxRedirects: options.maxRedirects,
    proxy: options.proxy ? {
      http: options.proxy,
      https: options.proxy,
    } : undefined,
    validateStatus: (status) => true, // Accept all status codes for CLI
    // Additional options
  };
}

// Helper functions for parsing command-line arguments
function parseHeaders(headers: string[]): Record<string, string> {
  // Implementation for parsing header arguments
  return {};
}

function parseQueryParams(params: string[]): Record<string, string> {
  // Implementation for parsing query parameter arguments
  return {};
}

function parseData(data?: string, form?: string[]): any {
  // Implementation for parsing data arguments
  return {};
}
```

### Configuration Command Mapping

```typescript
// Command-line arguments to configuration operations mapping
function handleConfigCommand(args: any, options: any): Promise<void> {
  const configManager = new CLIConfigManager();
  
  switch (args.action) {
    case 'view':
      const config = configManager.getConfig(args.path);
      // Format and display config
      break;
    case 'set':
      configManager.setConfig(args.path, args.value);
      break;
    case 'reset':
      // Implementation for reset
      break;
    default:
      throw new Error(`Unknown action: ${args.action}`);
  }
}
```

## Error Handling Integration

The CLI package transforms Core errors into user-friendly CLI errors and displays them appropriately.

```typescript
// Error handling in CLI commands
async function executeCommand(fn: () => Promise<any>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

function handleError(error: any): void {
  const logger = Logger.getInstance();
  
  if (error instanceof ValidationError) {
    // Handle validation errors
    logger.error('Validation Error:');
    error.errors.forEach((err) => {
      logger.error(`  ${err.path}: ${err.message}`);
    });
  } else if (error instanceof NetworkError) {
    // Handle network errors
    logger.error(`Network Error: ${error.message}`);
    if (error.code) {
      logger.error(`Error Code: ${error.code}`);
    }
  } else if (error instanceof PluginError) {
    // Handle plugin errors
    logger.error(`Plugin Error: ${error.message}`);
    logger.error(`Plugin: ${error.pluginName}`);
  } else {
    // Handle generic errors
    logger.error(`Error: ${error.message}`);
  }
  
  // Log debug information if in debug mode
  if (logger.getLevel() === 'debug' && error.stack) {
    logger.debug('Stack Trace:');
    logger.debug(error.stack);
  }
}
```

## Implementation Requirements

The integration between the CLI and Core packages must follow these requirements:

1. **Loose Coupling**:
   - CLI should not depend on Core implementation details
   - Changes to Core should not require CLI changes unless the interface changes
   - CLI should use well-defined interfaces to interact with Core

2. **Error Handling**:
   - All Core errors must be caught and transformed for CLI consumption
   - CLI should provide meaningful error messages
   - Error handling should be consistent across all commands

3. **Performance**:
   - CLI should not block on Core operations unnecessarily
   - Long-running Core operations should show progress
   - CLI should provide feedback during Core operations

4. **Testing**:
   - Integration tests should verify correct interaction between CLI and Core
   - Mock Core implementations should be used for CLI component testing
   - End-to-end tests should verify complete workflows

5. **TypeScript Integration**:
   - Shared types between CLI and Core should be defined in a common location
   - CLI should use Core types where appropriate
   - Type safety should be maintained across the integration boundary

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage.
