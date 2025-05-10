# Web UI Components Specification

## Overview

This document specifies the UI components that make up the Web UI package (@shc/web-ui). These components provide a rich, interactive interface for managing and executing HTTP requests.

## Main Layout Components

### Application Shell

The application shell provides the overall structure for the Web UI.

```typescript
interface AppShellProps {
  sidebarWidth: number;
  defaultSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}
```

#### Features
- Responsive layout with collapsible sidebar
- Theme switching (light/dark/system)
- Keyboard shortcut overlay
- Global notification system
- Status bar with connection information

### Navigation Sidebar

The sidebar provides navigation between different sections of the application.

```typescript
interface SidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemSelect: (id: string) => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number | string;
}
```

#### Features
- Collection browser
- History view
- Settings access
- Environment selector
- Variable set selector
- Plugin management

### Main Content Area

The main content area displays the active component based on the current navigation state.

```typescript
interface ContentAreaProps {
  activeView: 'request' | 'collection' | 'history' | 'settings';
  viewProps: Record<string, unknown>;
}
```

## Request Management Components

### Request Builder

The request builder allows users to create and edit HTTP requests.

```typescript
interface RequestBuilderProps {
  initialRequest?: Request;
  onChange?: (request: Request) => void;
  onSave?: (request: Request) => void;
  onExecute?: (request: Request) => void;
}
```

#### Features
- Method selector
- URL input with validation
- Header editor
- Query parameter editor
- Request body editor
- Authentication configuration
- Request options (timeout, redirects, etc.)

### URL Bar Component

```typescript
interface URLBarProps {
  baseUrl?: string;
  path: string;
  method: HTTPMethod;
  onMethodChange: (method: HTTPMethod) => void;
  onPathChange: (path: string) => void;
  onExecute: () => void;
}
```

### Header Editor

```typescript
interface HeaderEditorProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
  suggestions?: string[];
}
```

### Query Parameter Editor

```typescript
interface QueryParamEditorProps {
  params: Record<string, string>;
  onChange: (params: Record<string, string>) => void;
}
```

### Body Editor

```typescript
interface BodyEditorProps {
  contentType: string;
  body: any;
  onChange: (body: any, contentType: string) => void;
}
```

#### Body Editor Variants
- JSON Editor
- Form Data Editor
- Raw Text Editor
- File Upload

## Response Viewer Components

### Response Container

```typescript
interface ResponseContainerProps {
  response?: Response;
  isLoading: boolean;
  error?: Error;
}
```

### Response Header Viewer

```typescript
interface ResponseHeaderProps {
  headers: Record<string, string>;
  statusCode: number;
  statusText: string;
  time: number;
  size: number;
}
```

### Response Body Viewer

```typescript
interface ResponseBodyProps {
  body: any;
  contentType: string;
  prettify?: boolean;
  wrap?: boolean;
}
```

#### Body Viewer Variants
- JSON Viewer with syntax highlighting and collapsible nodes
- XML Viewer with syntax highlighting and collapsible nodes
- Image Viewer for image responses
- Text Viewer for plain text and HTML
- Binary Viewer for other content types

### Response Metadata

```typescript
interface ResponseMetadataProps {
  time: number;
  size: number;
  redirectCount: number;
  cookies: Cookie[];
}
```

## Collection Management Components

### Collection Tree

```typescript
interface CollectionTreeProps {
  collections: Collection[];
  activeItemId?: string;
  onItemSelect: (itemId: string, type: 'collection' | 'folder' | 'request') => void;
  onItemAction: (action: 'edit' | 'delete' | 'duplicate', itemId: string) => void;
}
```

### Collection Editor

```typescript
interface CollectionEditorProps {
  collection: Collection;
  onChange: (collection: Collection) => void;
  onSave: (collection: Collection) => void;
}
```

### Request List

```typescript
interface RequestListProps {
  requests: Request[];
  activeRequestId?: string;
  onRequestSelect: (requestId: string) => void;
  onRequestAction: (action: 'edit' | 'delete' | 'duplicate', requestId: string) => void;
}
```

## Environment and Variable Components

### Environment Selector

```typescript
interface EnvironmentSelectorProps {
  environments: Environment[];
  activeEnvironmentId: string;
  onEnvironmentSelect: (environmentId: string) => void;
  onEnvironmentEdit: (environmentId: string) => void;
  onEnvironmentCreate: () => void;
}
```

### Variable Set Editor

```typescript
interface VariableSetEditorProps {
  variableSet: VariableSet;
  onChange: (variableSet: VariableSet) => void;
  onSave: (variableSet: VariableSet) => void;
}
```

## Implementation Requirements

All components must follow these requirements:

1. **Accessibility**:
   - ARIA attributes for screen readers
   - Keyboard navigation support
   - Sufficient color contrast
   - Focus management

2. **Responsiveness**:
   - Adapt to different screen sizes
   - Mobile-friendly interactions
   - Touch support

3. **Performance**:
   - Lazy loading for heavy components
   - Virtualized lists for large collections
   - Memoization for expensive computations

4. **TypeScript Integration**:
   - Proper typing for all props and state
   - Generic components where appropriate
   - Strict null checks

5. **Testing**:
   - Unit tests for all components
   - Integration tests for component interactions
   - Visual regression tests for UI components
