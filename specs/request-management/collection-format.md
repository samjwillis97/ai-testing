# Collection Format Specification

## Overview

This document specifies the structure and format of collection files in the SHC system. Collections are stored in YAML or JSON format, providing a standardized structure for organizing API requests and their configurations.

## File Format

Collections can be stored in either YAML (preferred) or JSON format. The file extension should be `.shc.yaml` or `.shc.json` respectively.

## Collection Structure

```yaml
name: API Collection Name
version: 1.0.0

# Base URL for all requests in this collection
base_url: 'https://api.example.com'

# Variable set configuration
# See configuration.md for detailed variable sets documentation
variable_sets:
  - name: user
    description: "User information for requests"
    defaultValue: "john"
    activeValue: "john"
    values:
      john:
        firstName: "John"
        lastName: "Doe"
        email: "john@example.com"
      jane:
        firstName: "Jane"
        lastName: "Smith"
        email: "jane@example.com"

# Override global variable sets at collection level
variable_set_overrides:
  api: "staging"
  auth: "admin"

# Authentication configuration
authentication:
  type: bearer
  token: "${variables.auth.token}"

# Requests in this collection
requests:
  - id: get-user-profile
    name: Get User Profile
    description: "Retrieve the current user's profile"
    method: GET
    url: "/users/${variables.user.email}"
    headers:
      Accept: application/json
    query_params:
      include_details: true
    
  - id: create-user
    name: Create User
    description: "Create a new user"
    method: POST
    url: "/users"
    headers:
      Content-Type: application/json
      Accept: application/json
    body:
      type: json
      content: |
        {
          "firstName": "${variables.user.firstName}",
          "lastName": "${variables.user.lastName}",
          "email": "${variables.user.email}"
        }

# Folders for organizing requests
folders:
  - name: User Management
    description: "User-related API endpoints"
    requests:
      - get-user-profile
      - create-user
    
  - name: Admin Functions
    description: "Administrative API endpoints"
    requests: []
    folders:
      - name: User Administration
        description: "User administration endpoints"
        requests: []
```

## Collection Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Name of the collection |
| `version` | string | No | Version of the collection (semver format) |
| `base_url` | string | No | Base URL for all requests in the collection |
| `variable_sets` | array | No | Collection-specific variable sets |
| `variable_set_overrides` | object | No | Overrides for global variable sets |
| `authentication` | object | No | Default authentication for all requests |
| `requests` | array | No | List of requests in the collection |
| `folders` | array | No | List of folders for organizing requests |

## Request Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the request |
| `name` | string | Yes | Display name for the request |
| `description` | string | No | Description of the request |
| `method` | string | Yes | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `url` | string | Yes | URL path (appended to base_url) |
| `headers` | object | No | HTTP headers for the request |
| `query_params` | object | No | Query parameters for the request |
| `path_params` | object | No | Path parameters for the request |
| `body` | object | No | Request body configuration |
| `auth` | object | No | Request-specific authentication (overrides collection) |
| `pre_request_script` | string | No | Script to run before the request |
| `post_request_script` | string | No | Script to run after the request |
| `tests` | array | No | Tests to run against the response |

## Body Types

The `body` property supports different types of request bodies:

```yaml
# JSON body
body:
  type: json
  content: |
    {
      "key": "value"
    }

# Form data
body:
  type: form
  content:
    key1: value1
    key2: value2

# Raw text
body:
  type: text
  content: "Raw text content"
  content_type: "text/plain"

# Binary file
body:
  type: file
  path: "./files/image.jpg"
  content_type: "image/jpeg"

# GraphQL
body:
  type: graphql
  query: |
    query {
      user(id: $id) {
        name
        email
      }
    }
  variables:
    id: 123
```

## Folder Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Name of the folder |
| `description` | string | No | Description of the folder |
| `requests` | array | No | List of request IDs in the folder |
| `folders` | array | No | List of subfolders |

## Authentication Types

The `authentication` property supports different types of authentication:

```yaml
# Basic authentication
authentication:
  type: basic
  username: "${variables.auth.username}"
  password: "${variables.auth.password}"

# Bearer token authentication
authentication:
  type: bearer
  token: "${variables.auth.token}"

# API key authentication
authentication:
  type: apikey
  key: "X-API-Key"
  value: "${variables.auth.apiKey}"
  in: header  # or "query"

# OAuth 2.0 authentication
authentication:
  type: oauth2
  client_id: "${variables.auth.clientId}"
  client_secret: "${variables.auth.clientSecret}"
  token_url: "https://auth.example.com/token"
  scope: "read write"
```

## Template Variables

Collection files support template variables using the `${...}` syntax. These variables can reference:

1. Environment variables: `${env.API_KEY}`
2. Variable sets: `${variables.user.email}`
3. System variables: `${system.timestamp}`
4. Custom functions: `${uuid()}`

For more details on templates, see the [Templates Specification](../configuration/templates.md).

## Implementation Requirements

The collection format implementation must follow these requirements:

1. **Validation**:
   - Schema validation for collection files
   - Unique ID enforcement for requests
   - Reference validation for folder requests

2. **Compatibility**:
   - Support for both YAML and JSON formats
   - Backward compatibility with older versions
   - Forward compatibility with newer versions

3. **Performance**:
   - Efficient parsing of large collections
   - Lazy loading of request details
   - Optimized template resolution

4. **Security**:
   - Secure handling of sensitive information
   - Validation of user-provided templates
   - Protection against template injection

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
