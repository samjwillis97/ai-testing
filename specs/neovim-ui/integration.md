# Neovim UI Core Integration Specification

## Overview

This document specifies how the Neovim UI package (@shc/neovim-ui) integrates with the Core package (@shc/core). It outlines the integration architecture, data flow, and communication patterns between the two packages.

## Integration Architecture

The Neovim UI package uses the Core package as a dependency, leveraging its HTTP client, configuration management, and plugin system capabilities. The integration follows a clean architecture approach, with the Neovim UI layer consuming the core functionality through well-defined interfaces.

```
┌────────────────────────────────────────┐
│            @shc/neovim-ui              │
│                                        │
│  ┌─────────────┐      ┌─────────────┐  │
│  │  Lua UI     │      │ Node.js     │  │
│  │  Components │◄────►│ Bridge      │  │
│  └─────────────┘      └─────────────┘  │
│                            │           │
└────────────────────────────┼───────────┘
                             │
┌────────────────────────────┼───────────┐
│                            ▼           │
│  ┌─────────────────────────────────┐   │
│  │           @shc/core             │   │
│  └─────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

## Node.js Bridge

The Node.js Bridge provides a communication layer between the Lua UI components and the Core package. It exposes Core functionality to the Neovim UI through a set of RPC methods.

```typescript
// Node.js Bridge class
export class NeovimBridge {
  private client: SHCClient;
  private configManager: ConfigManager;
  private pluginManager: PluginManager;
  private collectionManager: CollectionManager;
  
  constructor() {
    this.client = createSHCClient();
    this.configManager = createConfigManager();
    this.pluginManager = createPluginManager();
    this.collectionManager = createCollectionManager();
  }
  
  // HTTP Client methods
  async executeRequest(requestConfig: RequestConfig): Promise<Response<any>> {
    try {
      return await this.client.request(requestConfig);
    } catch (error) {
      throw this.formatError(error);
    }
  }
  
  // Configuration methods
  async loadConfig(filePath: string): Promise<void> {
    try {
      await this.configManager.loadFromFile(filePath);
    } catch (error) {
      throw this.formatError(error);
    }
  }
  
  // Collection methods
  async getCollections(): Promise<Collection[]> {
    try {
      return this.collectionManager.getCollections();
    } catch (error) {
      throw this.formatError(error);
    }
  }
  
  // Plugin methods
  async getPlugins(): Promise<Plugin[]> {
    try {
      return this.pluginManager.getPlugins();
    } catch (error) {
      throw this.formatError(error);
    }
  }
  
  // Error formatting
  private formatError(error: any): Error {
    // Format error for Lua consumption
    return new Error(error.message);
  }
}
```

## Lua Integration Layer

The Lua Integration Layer provides a Lua API for interacting with the Node.js Bridge.

```lua
-- Lua Integration Layer
local M = {}

-- Initialize the integration layer
function M.setup()
  -- Load the Node.js bridge
  M.bridge = vim.fn['shc#bridge#get']()
end

-- HTTP Client methods
function M.execute_request(request_config)
  return M.bridge.executeRequest(request_config)
end

-- Configuration methods
function M.load_config(file_path)
  return M.bridge.loadConfig(file_path)
end

-- Collection methods
function M.get_collections()
  return M.bridge.getCollections()
end

-- Plugin methods
function M.get_plugins()
  return M.bridge.getPlugins()
end

return M
```

## Core Service Integration

### HTTP Client Integration

The Neovim UI package wraps the Core HTTP client to provide a Neovim-friendly interface.

#### Integration Points

1. **Request Execution**:
   - Neovim UI components trigger HTTP requests through the bridge
   - Response data is transformed for Neovim display
   - Error handling is enhanced for user-friendly presentation

2. **Request Configuration**:
   - Neovim UI form data is transformed into core RequestConfig objects
   - Core request validation is used to validate UI inputs
   - UI-specific metadata is added to requests

### Configuration Management Integration

The Neovim UI package provides a UI layer on top of the Core configuration management system.

#### Integration Points

1. **Configuration Loading**:
   - Neovim UI provides file editing capabilities
   - Core validation is used to validate configuration
   - Neovim UI displays validation errors in a user-friendly format

2. **Configuration Usage**:
   - Neovim UI components consume configuration through the bridge
   - Core template resolution is used for dynamic values
   - UI-specific configuration is managed separately

### Plugin System Integration

The Neovim UI package extends the Core plugin system with UI-specific plugins and visualizations.

#### Integration Points

1. **Plugin Management**:
   - Neovim UI provides installation, configuration, and removal interfaces
   - Core plugin lifecycle is managed through the bridge
   - Neovim UI displays plugin status and errors

2. **Plugin UI Extensions**:
   - Core plugins can provide Neovim UI components through a defined interface
   - Neovim UI dynamically loads and renders plugin-provided components
   - Plugin configuration is edited through generated forms

## Collection Management Integration

The Neovim UI package provides a visual interface for the Core collection management system.

#### Integration Points

1. **Collection Editing**:
   - Neovim UI provides tree-based collection editing
   - Core validation ensures collection integrity
   - Neovim UI handles navigation and other interactive operations

2. **Request Execution from Collections**:
   - Neovim UI triggers execution of collection requests
   - Core handles request execution and variable resolution
   - Neovim UI displays results and allows saving responses

## Error Handling Integration

The Neovim UI package transforms Core errors into user-friendly Neovim errors.

```lua
-- Error handling in Neovim UI
function M.handle_error(error)
  local logger = require('shc.logger')
  
  if error.type == 'ValidationError' then
    -- Handle validation errors
    logger.error('Validation Error:')
    for _, err in ipairs(error.errors) do
      logger.error(string.format('  %s: %s', err.path, err.message))
    end
  elseif error.type == 'NetworkError' then
    -- Handle network errors
    logger.error(string.format('Network Error: %s', error.message))
    if error.code then
      logger.error(string.format('Error Code: %s', error.code))
    end
  else
    -- Handle generic errors
    logger.error(string.format('Error: %s', error.message))
  end
  
  -- Log debug information if in debug mode
  if logger.get_level() == 'debug' and error.stack then
    logger.debug('Stack Trace:')
    logger.debug(error.stack)
  end
end
```

## Implementation Requirements

The integration between the Neovim UI and Core packages must follow these requirements:

1. **Loose Coupling**:
   - Neovim UI should not depend on Core implementation details
   - Changes to Core should not require Neovim UI changes unless the interface changes
   - Neovim UI should use well-defined interfaces to interact with Core

2. **Error Handling**:
   - All Core errors must be caught and transformed for Neovim UI consumption
   - Neovim UI should provide meaningful error messages
   - Error handling should be consistent across all commands

3. **Performance**:
   - Neovim UI should not block on Core operations
   - Long-running Core operations should be cancelable
   - Neovim UI should provide feedback during Core operations

4. **Testing**:
   - Integration tests should verify correct interaction between Neovim UI and Core
   - Mock Core implementations should be used for Neovim UI component testing
   - End-to-end tests should verify complete workflows

5. **TypeScript Integration**:
   - Shared types between Neovim UI and Core should be defined in a common location
   - Neovim UI should use Core types where appropriate
   - Type safety should be maintained across the integration boundary

The implementation should align with the TypeScript best practices for the Node.js components and Lua best practices for the Neovim integration, ensuring proper typing, error handling, and test coverage.
