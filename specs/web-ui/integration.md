# Web UI Core Integration Specification

## Overview

This document specifies how the Web UI package (@shc/web-ui) integrates with the Core package (@shc/core). It outlines the integration points, data flow, and communication patterns between the two packages.

## Integration Architecture

The Web UI package uses the Core package as a dependency, leveraging its HTTP client, configuration management, and plugin system capabilities. The integration follows a clean architecture approach, with the UI layer consuming the core functionality through well-defined interfaces.

```
┌────────────────────────────────────────┐
│              @shc/web-ui               │
│                                        │
│  ┌─────────────┐      ┌─────────────┐  │
│  │    React    │      │    State    │  │
│  │ Components  │◄────►│  Management │  │
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

The Web UI package wraps the Core HTTP client to provide a React-friendly interface.

```typescript
// Web UI HTTP Client wrapper
export class WebUIHttpClient {
  private client: SHCClient;
  
  constructor(config: ClientConfig) {
    this.client = createSHCClient(config);
  }
  
  async request<T>(config: RequestConfig): Promise<Response<T>> {
    try {
      return await this.client.request<T>(config);
    } catch (error) {
      // Transform error for UI consumption
      throw new UIFriendlyError(error);
    }
  }
  
  // Additional methods that wrap core client methods
}
```

#### Integration Points

1. **Request Execution**:
   - UI components trigger HTTP requests through the wrapped client
   - Response data is transformed for UI display
   - Error handling is enhanced for user-friendly presentation

2. **Request Configuration**:
   - UI form data is transformed into core RequestConfig objects
   - Core request validation is used to validate UI inputs
   - UI-specific metadata is added to requests

### Configuration Management Integration

The Web UI package provides a UI layer on top of the Core configuration management system.

```typescript
// Web UI Configuration Manager wrapper
export class WebUIConfigManager {
  private configManager: ConfigManager;
  
  constructor() {
    this.configManager = createConfigManager();
  }
  
  async loadConfig(file: File): Promise<void> {
    const content = await this.readFileContent(file);
    return this.configManager.loadFromString(content);
  }
  
  getUIConfig(): UIConfig {
    // Transform core config into UI-specific format
    return {
      theme: this.configManager.get('ui.theme', 'system'),
      sidebarWidth: this.configManager.get('ui.sidebar.width', 250),
      // Other UI-specific settings
    };
  }
  
  // Additional methods for UI-specific configuration
}
```

#### Integration Points

1. **Configuration Loading**:
   - UI provides file upload or direct editing capabilities
   - Core validation is used to validate configuration
   - UI displays validation errors in a user-friendly format

2. **Configuration Usage**:
   - UI components consume configuration through the wrapper
   - Core template resolution is used for dynamic values
   - UI-specific configuration is managed separately

### Plugin System Integration

The Web UI package extends the Core plugin system with UI-specific plugins and visualizations.

```typescript
// Web UI Plugin Manager wrapper
export class WebUIPluginManager {
  private pluginManager: PluginManager;
  
  constructor() {
    this.pluginManager = createPluginManager();
  }
  
  async installPlugin(source: string): Promise<void> {
    try {
      await this.pluginManager.installPlugin(source);
      // Update UI state after successful installation
    } catch (error) {
      // Transform error for UI consumption
      throw new UIFriendlyError(error);
    }
  }
  
  getUIPlugins(): UIPlugin[] {
    // Transform core plugins into UI-specific format with additional metadata
    return this.pluginManager.getPlugins().map(plugin => ({
      ...plugin,
      hasUI: this.hasUIComponent(plugin),
      uiComponent: this.getUIComponent(plugin),
    }));
  }
  
  // Additional methods for UI-specific plugin management
}
```

#### Integration Points

1. **Plugin Management**:
   - UI provides installation, configuration, and removal interfaces
   - Core plugin lifecycle is managed through the wrapper
   - UI displays plugin status and errors

2. **Plugin UI Extensions**:
   - Core plugins can provide UI components through a defined interface
   - UI dynamically loads and renders plugin-provided components
   - Plugin configuration is edited through generated forms

## Collection Management Integration

The Web UI package provides a visual interface for the Core collection management system.

```typescript
// Web UI Collection Manager wrapper
export class WebUICollectionManager {
  private collectionManager: CollectionManager;
  
  constructor() {
    this.collectionManager = createCollectionManager();
  }
  
  async loadCollection(file: File): Promise<void> {
    const content = await this.readFileContent(file);
    return this.collectionManager.importCollection(content);
  }
  
  getUICollections(): UICollection[] {
    // Transform core collections into UI-specific format
    return this.collectionManager.getCollections().map(collection => ({
      ...collection,
      uiState: {
        expanded: false,
        selected: false,
      },
    }));
  }
  
  // Additional methods for UI-specific collection management
}
```

#### Integration Points

1. **Collection Editing**:
   - UI provides tree-based collection editing
   - Core validation ensures collection integrity
   - UI handles drag-and-drop and other interactive operations

2. **Request Execution from Collections**:
   - UI triggers execution of collection requests
   - Core handles request execution and variable resolution
   - UI displays results and allows saving responses

## Template Engine Integration

The Web UI package provides visual editing for templates used by the Core template engine.

```typescript
// Web UI Template Engine wrapper
export class WebUITemplateEngine {
  private templateEngine: TemplateEngine;
  
  constructor() {
    this.templateEngine = createTemplateEngine();
  }
  
  async resolveTemplate(template: string, context: any): Promise<string> {
    try {
      return await this.templateEngine.resolve(template, context);
    } catch (error) {
      // Transform error for UI consumption
      throw new UIFriendlyError(error);
    }
  }
  
  getTemplateFunctions(): UITemplateFunction[] {
    // Transform core template functions into UI-specific format with documentation
    return this.templateEngine.getFunctions().map(func => ({
      ...func,
      documentation: this.getFunctionDocumentation(func),
      examples: this.getFunctionExamples(func),
    }));
  }
  
  // Additional methods for UI-specific template management
}
```

#### Integration Points

1. **Template Editing**:
   - UI provides syntax highlighting and autocompletion
   - Core validation ensures template correctness
   - UI displays template resolution preview

2. **Template Function Documentation**:
   - UI displays available template functions with documentation
   - Core provides function metadata
   - UI allows interactive testing of template functions

## State Management Integration

The Web UI package uses a state management solution (React Query, Redux, etc.) to manage the state derived from Core package operations.

```typescript
// Example using React Query
export function useSHCRequest<T>(config: RequestConfig) {
  const client = useWebUIHttpClient();
  
  return useQuery<Response<T>, Error>({
    queryKey: ['request', config],
    queryFn: () => client.request<T>(config),
    // Additional React Query options
  });
}

// Example using React Context for configuration
export function useSHCConfig() {
  const configManager = useWebUIConfigManager();
  const [config, setConfig] = useState(configManager.getUIConfig());
  
  // Additional state management logic
  
  return {
    config,
    updateConfig: async (newConfig) => {
      await configManager.updateConfig(newConfig);
      setConfig(configManager.getUIConfig());
    },
  };
}
```

#### Integration Points

1. **Request State Management**:
   - UI uses React Query for request state management
   - Core handles the actual request execution
   - UI displays loading, error, and success states

2. **Configuration State Management**:
   - UI uses React Context for configuration state
   - Core handles configuration validation and persistence
   - UI updates when configuration changes

## Error Handling Integration

The Web UI package transforms Core errors into user-friendly UI errors.

```typescript
// UI-friendly error wrapper
export class UIFriendlyError extends Error {
  public readonly originalError: Error;
  public readonly userMessage: string;
  public readonly actionable: boolean;
  public readonly actions?: UIErrorAction[];
  
  constructor(error: Error) {
    super(error.message);
    this.originalError = error;
    this.userMessage = this.getUserMessage(error);
    this.actionable = this.isActionable(error);
    this.actions = this.getActions(error);
  }
  
  private getUserMessage(error: Error): string {
    // Transform technical error message into user-friendly message
    // based on error type and content
    return error.message; // Simplified for example
  }
  
  private isActionable(error: Error): boolean {
    // Determine if the error can be resolved by user action
    return false; // Simplified for example
  }
  
  private getActions(error: Error): UIErrorAction[] {
    // Generate possible actions to resolve the error
    return []; // Simplified for example
  }
}

// UI error display component
export function ErrorDisplay({ error }: { error: UIFriendlyError }) {
  return (
    <div className="error-container">
      <div className="error-message">{error.userMessage}</div>
      {error.actionable && (
        <div className="error-actions">
          {error.actions?.map(action => (
            <button key={action.id} onClick={action.handler}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Integration Points

1. **Error Transformation**:
   - Core errors are transformed into UI-friendly errors
   - Technical details are preserved for debugging
   - User-friendly messages are generated based on error type

2. **Error Recovery**:
   - UI provides actionable error recovery options when possible
   - Core provides error context for recovery options
   - UI guides users through error resolution

## Implementation Requirements

The integration between the Web UI and Core packages must follow these requirements:

1. **Loose Coupling**:
   - UI should not depend on Core implementation details
   - Changes to Core should not require UI changes unless the interface changes
   - UI should use well-defined interfaces to interact with Core

2. **Error Handling**:
   - All Core errors must be caught and transformed for UI consumption
   - UI should provide meaningful error messages and recovery options
   - Error boundaries should prevent UI crashes

3. **Performance**:
   - UI should not block on Core operations
   - Long-running Core operations should be cancelable
   - UI should provide feedback during Core operations

4. **Testing**:
   - Integration tests should verify correct interaction between UI and Core
   - Mock Core implementations should be used for UI component testing
   - End-to-end tests should verify complete workflows

5. **TypeScript Integration**:
   - Shared types between UI and Core should be defined in a common location
   - UI should use Core types where appropriate
   - Type safety should be maintained across the integration boundary
