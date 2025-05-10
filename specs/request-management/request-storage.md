# Request Storage Specification

## Overview

This document specifies the storage and organization mechanisms for request collections in the SHC system. It defines how collections are stored, loaded, and managed across different environments and interfaces.

## Storage Locations

SHC supports multiple storage locations for collections:

### Local File System

Collections are primarily stored in the local file system, with the following default locations:

```
~/.shc/
  ├── collections/            # Main collections directory
  │   ├── default/            # Default collection
  │   │   ├── collection.shc.yaml  # Collection definition
  │   │   └── requests/       # Individual request files
  │   ├── project-a/          # Project-specific collection
  │   └── project-b/          # Project-specific collection
  └── history/                # Request execution history
      ├── recent.shc.yaml     # Recent requests
      └── favorites.shc.yaml  # Favorite requests
```

### Remote Storage

SHC also supports remote storage for collections, enabling team collaboration:

1. **Git Repositories**: Collections can be stored in Git repositories for version control and sharing
2. **Cloud Storage**: Collections can be stored in cloud storage services (S3, Dropbox, etc.)
3. **SHC Server**: Collections can be stored on an SHC server for team collaboration

## Collection Organization

Collections are organized hierarchically:

1. **Workspace**: A workspace contains multiple collections
2. **Collection**: A collection contains folders and requests
3. **Folder**: A folder contains subfolders and requests
4. **Request**: An individual HTTP request

### Workspace Structure

```typescript
interface Workspace {
  name: string;
  description?: string;
  collections: Collection[];
  settings: WorkspaceSettings;
}

interface WorkspaceSettings {
  defaultCollection?: string;
  defaultEnvironment?: string;
  variableSets?: Record<string, VariableSet>;
}
```

### Collection Structure

```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  baseUrl?: string;
  folders: Folder[];
  requests: Request[];
  authentication?: Authentication;
  variableSets?: Record<string, VariableSet>;
  variableSetOverrides?: Record<string, string>;
}
```

## Storage Formats

Collections can be stored in different formats depending on the use case:

### Single File Format

For simple collections, all requests and folders are stored in a single YAML or JSON file:

```yaml
# collection.shc.yaml
name: API Collection
version: 1.0.0
requests:
  - id: request1
    name: Get Users
    # ...
folders:
  - name: User Management
    # ...
```

### Directory Format

For larger collections, requests can be stored in individual files within a directory structure:

```
collection/
├── collection.shc.yaml  # Collection metadata
└── requests/
    ├── request1.shc.yaml
    ├── request2.shc.yaml
    └── folders/
        └── user-management/
            ├── folder.shc.yaml  # Folder metadata
            └── requests/
                ├── request3.shc.yaml
                └── request4.shc.yaml
```

This format is preferred for:
- Collections with many requests
- Collections managed with version control
- Team collaboration on collections

## Collection Loading

Collections are loaded using the `CollectionManager` interface:

```typescript
interface CollectionManager {
  // Load a collection from a file
  loadFromFile(filePath: string): Promise<Collection>;
  
  // Load a collection from a directory
  loadFromDirectory(dirPath: string): Promise<Collection>;
  
  // Load a collection from a remote URL
  loadFromUrl(url: string): Promise<Collection>;
  
  // Get all available collections
  getCollections(): Promise<Collection[]>;
  
  // Get a collection by ID
  getCollection(id: string): Promise<Collection>;
  
  // Create a new collection
  createCollection(collection: Partial<Collection>): Promise<Collection>;
  
  // Update a collection
  updateCollection(id: string, collection: Partial<Collection>): Promise<Collection>;
  
  // Delete a collection
  deleteCollection(id: string): Promise<void>;
}
```

## Request Storage

Individual requests can be stored in different ways:

### Embedded Requests

Requests can be embedded directly in the collection file:

```yaml
# collection.shc.yaml
requests:
  - id: request1
    name: Get Users
    method: GET
    url: /users
    # ...
```

### Referenced Requests

Requests can be referenced by ID and stored separately:

```yaml
# collection.shc.yaml
requests:
  - request1
  - request2

# request1.shc.yaml
id: request1
name: Get Users
method: GET
url: /users
# ...
```

### Request Files

Individual request files follow the same structure as embedded requests:

```yaml
# request1.shc.yaml
id: request1
name: Get Users
method: GET
url: /users
headers:
  Accept: application/json
query_params:
  limit: 10
  offset: 0
```

## History and Favorites

SHC maintains a history of executed requests and allows users to save favorites:

### Request History

```typescript
interface RequestHistory {
  id: string;
  requestId: string;
  collectionId: string;
  timestamp: number;
  request: Request;
  response?: Response;
  duration?: number;
  environment?: string;
  variableSets?: Record<string, string>;
}
```

### Request Favorites

```typescript
interface RequestFavorite {
  id: string;
  requestId: string;
  collectionId: string;
  name: string;
  description?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}
```

## Synchronization

For team collaboration, SHC supports synchronization of collections:

### Git Integration

Collections can be synchronized using Git:

```typescript
interface GitSyncProvider {
  // Initialize Git repository
  init(dirPath: string): Promise<void>;
  
  // Clone a remote repository
  clone(url: string, dirPath: string): Promise<void>;
  
  // Pull changes from remote
  pull(dirPath: string): Promise<void>;
  
  // Push changes to remote
  push(dirPath: string, message: string): Promise<void>;
  
  // Get status of repository
  status(dirPath: string): Promise<GitStatus>;
}
```

### Cloud Synchronization

Collections can be synchronized with cloud storage:

```typescript
interface CloudSyncProvider {
  // Connect to cloud storage
  connect(config: CloudConfig): Promise<void>;
  
  // Upload a collection
  upload(collection: Collection, path: string): Promise<void>;
  
  // Download a collection
  download(path: string): Promise<Collection>;
  
  // List available collections
  list(): Promise<CloudItem[]>;
}
```

## Implementation Requirements

The request storage implementation must follow these requirements:

1. **Performance**:
   - Efficient loading of large collections
   - Lazy loading of request details
   - Caching of frequently accessed collections

2. **Reliability**:
   - Robust error handling for file operations
   - Automatic backup of collections
   - Recovery from corrupted files

3. **Flexibility**:
   - Support for multiple storage formats
   - Extensible storage providers
   - Customizable storage locations

4. **Security**:
   - Secure handling of sensitive information
   - Encryption of stored credentials
   - Access control for shared collections

5. **Compatibility**:
   - Cross-platform file path handling
   - Support for different file systems
   - Backward compatibility with older formats

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
