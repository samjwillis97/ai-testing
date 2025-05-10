# Neovim UI Components Specification

## Overview

This document specifies the UI components for the Neovim UI package (@shc/neovim-ui). It outlines the layout, behavior, and interactions of the various UI elements that make up the Neovim interface for SHC.

## UI Architecture

The Neovim UI uses a buffer-based approach with floating windows for auxiliary information. The UI components are organized into a cohesive interface that integrates seamlessly with the Neovim editor.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Neovim Editor                            │
│                                                                 │
│  ┌─────────────────┐                   ┌─────────────────────┐  │
│  │                 │                   │                     │  │
│  │  Collection     │                   │  Request Editor     │  │
│  │  Explorer       │                   │                     │  │
│  │                 │                   │                     │  │
│  │                 │                   │                     │  │
│  └─────────────────┘                   └─────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Response Viewer                         ││
│  │                                                             ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                       Status Line                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Buffer Types

### Request Editor Buffer

The request editor buffer allows users to create and edit HTTP requests using a structured format.

```
# GET https://api.example.com/users
Content-Type: application/json
Authorization: Bearer ${env.TOKEN}

{
  "query": "example"
}
```

#### Features

- Syntax highlighting for request components
- Auto-completion for headers and methods
- Template variable resolution preview
- Inline validation of request syntax
- Key mappings for executing requests

#### Implementation

```lua
-- Request editor buffer creation
function M.create_request_editor()
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf, 'filetype', 'shc_request')
  vim.api.nvim_buf_set_name(buf, 'SHC Request Editor')
  
  -- Set buffer-local key mappings
  vim.api.nvim_buf_set_keymap(buf, 'n', '<leader>sr', ':SHCExecuteRequest<CR>', { noremap = true })
  
  -- Set buffer-local autocommands
  vim.api.nvim_create_autocmd('BufWritePost', {
    buffer = buf,
    callback = function()
      -- Validate request on save
    end,
  })
  
  return buf
end
```

### Response Viewer Buffer

The response viewer buffer displays the response from executed requests with syntax highlighting and formatting.

```
HTTP/1.1 200 OK
Content-Type: application/json
Date: Mon, 01 Jan 2023 12:00:00 GMT

{
  "id": 1,
  "name": "Example User",
  "email": "user@example.com"
}
```

#### Features

- Syntax highlighting based on content type
- Collapsible sections for headers and body
- Pretty-printing for JSON and XML responses
- Response statistics (time, size, status)
- Key mappings for copying response data

#### Implementation

```lua
-- Response viewer buffer creation
function M.create_response_viewer()
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf, 'filetype', 'shc_response')
  vim.api.nvim_buf_set_option(buf, 'modifiable', false)
  vim.api.nvim_buf_set_name(buf, 'SHC Response Viewer')
  
  -- Set buffer-local key mappings
  vim.api.nvim_buf_set_keymap(buf, 'n', '<leader>sc', ':SHCCopyResponse<CR>', { noremap = true })
  
  return buf
end

-- Update response viewer with response data
function M.update_response_viewer(buf, response)
  vim.api.nvim_buf_set_option(buf, 'modifiable', true)
  
  -- Clear buffer
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, {})
  
  -- Add status line
  local status_line = string.format('HTTP/%s %s %s', 
    response.httpVersion or '1.1',
    response.status,
    response.statusText)
  vim.api.nvim_buf_set_lines(buf, 0, 0, false, {status_line, ''})
  
  -- Add headers
  local header_lines = {}
  for key, value in pairs(response.headers) do
    table.insert(header_lines, string.format('%s: %s', key, value))
  end
  vim.api.nvim_buf_set_lines(buf, 2, 2, false, header_lines)
  
  -- Add empty line between headers and body
  vim.api.nvim_buf_set_lines(buf, 2 + #header_lines, 2 + #header_lines, false, {''})
  
  -- Add body with appropriate formatting
  local body_lines = format_response_body(response)
  vim.api.nvim_buf_set_lines(buf, 3 + #header_lines, 3 + #header_lines, false, body_lines)
  
  vim.api.nvim_buf_set_option(buf, 'modifiable', false)
end
```

### Collection Explorer Buffer

The collection explorer buffer displays a tree view of collections, folders, and requests.

```
Collections
├── API Collection
│   ├── Authentication
│   │   ├── Login
│   │   └── Refresh Token
│   └── Users
│       ├── Get User
│       └── Update User
└── Another Collection
    └── Example Request
```

#### Features

- Tree view of collections and requests
- Icons for different item types
- Folding support for collections and folders
- Key mappings for navigation and actions
- Context menu for additional operations

#### Implementation

```lua
-- Collection explorer buffer creation
function M.create_collection_explorer()
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf, 'filetype', 'shc_explorer')
  vim.api.nvim_buf_set_name(buf, 'SHC Collection Explorer')
  
  -- Set buffer-local key mappings
  vim.api.nvim_buf_set_keymap(buf, 'n', '<CR>', ':SHCOpenItem<CR>', { noremap = true })
  vim.api.nvim_buf_set_keymap(buf, 'n', 'a', ':SHCAddItem<CR>', { noremap = true })
  vim.api.nvim_buf_set_keymap(buf, 'n', 'd', ':SHCDeleteItem<CR>', { noremap = true })
  
  return buf
end

-- Update collection explorer with collections data
function M.update_collection_explorer(buf, collections)
  vim.api.nvim_buf_set_option(buf, 'modifiable', true)
  
  -- Clear buffer
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, {})
  
  -- Add collections header
  vim.api.nvim_buf_set_lines(buf, 0, 0, false, {'Collections'})
  
  -- Add collections tree
  local lines = {}
  for i, collection in ipairs(collections) do
    table.insert(lines, string.format('├── %s', collection.name))
    
    -- Add folders and requests
    for j, item in ipairs(collection.items) do
      if item.type == 'folder' then
        table.insert(lines, string.format('│   ├── %s', item.name))
        -- Add folder contents
      else
        table.insert(lines, string.format('│   ├── %s', item.name))
      end
    end
  end
  
  vim.api.nvim_buf_set_lines(buf, 1, 1, false, lines)
  
  vim.api.nvim_buf_set_option(buf, 'modifiable', false)
end
```

### Environment Selector

The environment selector is a floating window that allows users to select and manage environments.

#### Features

- List of available environments
- Current environment indicator
- Key mappings for selecting environments
- Quick editing of environment variables

#### Implementation

```lua
-- Environment selector creation
function M.create_environment_selector()
  local width = 60
  local height = 10
  
  -- Calculate position
  local win_width = vim.api.nvim_get_option('columns')
  local win_height = vim.api.nvim_get_option('lines')
  local row = math.floor((win_height - height) / 2)
  local col = math.floor((win_width - width) / 2)
  
  -- Create buffer
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf, 'filetype', 'shc_environment')
  
  -- Create window
  local win = vim.api.nvim_open_win(buf, true, {
    relative = 'editor',
    width = width,
    height = height,
    row = row,
    col = col,
    style = 'minimal',
    border = 'rounded',
  })
  
  -- Set window-local options
  vim.api.nvim_win_set_option(win, 'winhl', 'Normal:SHCEnvironmentNormal')
  
  return { buf = buf, win = win }
end

-- Update environment selector with environments data
function M.update_environment_selector(buf, environments, active_env)
  vim.api.nvim_buf_set_option(buf, 'modifiable', true)
  
  -- Clear buffer
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, {})
  
  -- Add header
  vim.api.nvim_buf_set_lines(buf, 0, 0, false, {'Select Environment:', ''})
  
  -- Add environments
  local lines = {}
  for i, env in ipairs(environments) do
    local prefix = env.name == active_env and '* ' or '  '
    table.insert(lines, string.format('%s%s', prefix, env.name))
  end
  
  vim.api.nvim_buf_set_lines(buf, 2, 2, false, lines)
  
  vim.api.nvim_buf_set_option(buf, 'modifiable', false)
end
```

### Variable Editor

The variable editor is a buffer that allows users to edit variables in a structured format.

#### Features

- Syntax highlighting for variable definitions
- Auto-completion for variable names
- Validation of variable values
- Secret variable handling

#### Implementation

```lua
-- Variable editor buffer creation
function M.create_variable_editor(variables)
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf, 'filetype', 'shc_variables')
  vim.api.nvim_buf_set_name(buf, 'SHC Variables')
  
  -- Set buffer-local key mappings
  vim.api.nvim_buf_set_keymap(buf, 'n', '<leader>sv', ':SHCSaveVariables<CR>', { noremap = true })
  
  -- Initialize buffer with variables
  update_variable_editor(buf, variables)
  
  return buf
end

-- Update variable editor with variables data
function M.update_variable_editor(buf, variables)
  vim.api.nvim_buf_set_option(buf, 'modifiable', true)
  
  -- Clear buffer
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, {})
  
  -- Add header
  vim.api.nvim_buf_set_lines(buf, 0, 0, false, {'# Variables', ''})
  
  -- Add variables
  local lines = {}
  for name, value in pairs(variables) do
    if type(value) == 'table' then
      table.insert(lines, string.format('%s:', name))
      for k, v in pairs(value) do
        table.insert(lines, string.format('  %s: %s', k, v))
      end
    else
      table.insert(lines, string.format('%s: %s', name, value))
    end
  end
  
  vim.api.nvim_buf_set_lines(buf, 2, 2, false, lines)
  
  vim.api.nvim_buf_set_option(buf, 'modifiable', false)
end
```

### Status Line Integration

The status line integration provides information about the current request, environment, and plugin status.

#### Features

- Current environment indicator
- Request status indicator
- Last response status
- Plugin status indicators

#### Implementation

```lua
-- Status line component
function M.statusline()
  local parts = {}
  
  -- Add SHC indicator
  table.insert(parts, '%#SHCStatusLine#SHC')
  
  -- Add environment
  local env = get_active_environment()
  if env then
    table.insert(parts, string.format('ENV:%s', env))
  end
  
  -- Add last response status if available
  local last_response = get_last_response()
  if last_response then
    local status_color = last_response.status < 400 and 'SHCStatusSuccess' or 'SHCStatusError'
    table.insert(parts, string.format('%%#%s#%d', status_color, last_response.status))
  end
  
  -- Add plugin status
  local plugin_status = get_plugin_status()
  if plugin_status.active > 0 then
    table.insert(parts, string.format('Plugins:%d', plugin_status.active))
  end
  
  -- Reset highlight
  table.insert(parts, '%#StatusLine#')
  
  return table.concat(parts, ' | ')
end
```

## Floating Windows

### Request Preview

The request preview is a floating window that shows the resolved request before execution.

#### Features

- Preview of the request with resolved variables
- Syntax highlighting for request components
- Key mappings for executing or editing the request

#### Implementation

```lua
-- Request preview creation
function M.create_request_preview(request)
  local width = 80
  local height = 20
  
  -- Calculate position
  local win_width = vim.api.nvim_get_option('columns')
  local win_height = vim.api.nvim_get_option('lines')
  local row = math.floor((win_height - height) / 2)
  local col = math.floor((win_width - width) / 2)
  
  -- Create buffer
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf, 'filetype', 'shc_request')
  
  -- Create window
  local win = vim.api.nvim_open_win(buf, true, {
    relative = 'editor',
    width = width,
    height = height,
    row = row,
    col = col,
    style = 'minimal',
    border = 'rounded',
  })
  
  -- Set window-local options
  vim.api.nvim_win_set_option(win, 'winhl', 'Normal:SHCPreviewNormal')
  
  -- Fill buffer with request data
  update_request_preview(buf, request)
  
  return { buf = buf, win = win }
end

-- Update request preview with request data
function M.update_request_preview(buf, request)
  vim.api.nvim_buf_set_option(buf, 'modifiable', true)
  
  -- Clear buffer
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, {})
  
  -- Add request line
  local request_line = string.format('%s %s', request.method, request.url)
  vim.api.nvim_buf_set_lines(buf, 0, 0, false, {request_line, ''})
  
  -- Add headers
  local header_lines = {}
  for key, value in pairs(request.headers) do
    table.insert(header_lines, string.format('%s: %s', key, value))
  end
  vim.api.nvim_buf_set_lines(buf, 2, 2, false, header_lines)
  
  -- Add empty line between headers and body
  vim.api.nvim_buf_set_lines(buf, 2 + #header_lines, 2 + #header_lines, false, {''})
  
  -- Add body if present
  if request.body then
    local body_lines = {}
    if type(request.body) == 'string' then
      body_lines = vim.split(request.body, '\n')
    else
      body_lines = vim.split(vim.json.encode(request.body, { indent = 2 }), '\n')
    end
    vim.api.nvim_buf_set_lines(buf, 3 + #header_lines, 3 + #header_lines, false, body_lines)
  end
  
  vim.api.nvim_buf_set_option(buf, 'modifiable', false)
end
```

### Help Window

The help window is a floating window that displays context-sensitive help information.

#### Features

- Context-sensitive help based on cursor position
- Key mapping reference
- Quick navigation to documentation

#### Implementation

```lua
-- Help window creation
function M.create_help_window(context)
  local width = 80
  local height = 20
  
  -- Calculate position
  local win_width = vim.api.nvim_get_option('columns')
  local win_height = vim.api.nvim_get_option('lines')
  local row = math.floor((win_height - height) / 2)
  local col = math.floor((win_width - width) / 2)
  
  -- Create buffer
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf, 'filetype', 'shc_help')
  
  -- Create window
  local win = vim.api.nvim_open_win(buf, true, {
    relative = 'editor',
    width = width,
    height = height,
    row = row,
    col = col,
    style = 'minimal',
    border = 'rounded',
  })
  
  -- Set window-local options
  vim.api.nvim_win_set_option(win, 'winhl', 'Normal:SHCHelpNormal')
  
  -- Fill buffer with help content
  update_help_window(buf, context)
  
  return { buf = buf, win = win }
end

-- Update help window with context-specific content
function M.update_help_window(buf, context)
  vim.api.nvim_buf_set_option(buf, 'modifiable', true)
  
  -- Clear buffer
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, {})
  
  -- Add header
  vim.api.nvim_buf_set_lines(buf, 0, 0, false, {'SHC Help', '========', ''})
  
  -- Add context-specific help
  local help_content = get_help_content(context)
  vim.api.nvim_buf_set_lines(buf, 3, 3, false, help_content)
  
  vim.api.nvim_buf_set_option(buf, 'modifiable', false)
end
```

## UI Layout Management

The UI layout management handles the arrangement and resizing of the various buffers and windows.

### Default Layout

```lua
-- Create default layout
function M.create_default_layout()
  -- Create buffers
  local explorer_buf = create_collection_explorer()
  local request_buf = create_request_editor()
  local response_buf = create_response_viewer()
  
  -- Split windows
  vim.cmd('vsplit')
  vim.cmd('wincmd h')
  vim.api.nvim_win_set_buf(0, explorer_buf)
  vim.cmd('wincmd l')
  vim.api.nvim_win_set_buf(0, request_buf)
  vim.cmd('split')
  vim.cmd('wincmd j')
  vim.api.nvim_win_set_buf(0, response_buf)
  
  -- Set window sizes
  vim.cmd('wincmd h')
  vim.cmd('vertical resize 30')
  vim.cmd('wincmd l')
  vim.cmd('wincmd k')
  
  -- Return to request editor
  vim.cmd('wincmd l')
  vim.cmd('wincmd k')
end
```

### Layout Customization

```lua
-- Apply custom layout
function M.apply_custom_layout(layout)
  -- Clear existing windows
  vim.cmd('only')
  
  -- Create buffers
  local buffers = {}
  for name, config in pairs(layout.buffers) do
    buffers[name] = create_buffer_by_type(config.type)
  end
  
  -- Create windows according to layout
  create_windows_from_layout(layout.windows, buffers)
end

-- Create buffer by type
function M.create_buffer_by_type(type)
  if type == 'explorer' then
    return create_collection_explorer()
  elseif type == 'request' then
    return create_request_editor()
  elseif type == 'response' then
    return create_response_viewer()
  elseif type == 'variables' then
    return create_variable_editor({})
  else
    error('Unknown buffer type: ' .. type)
  end
end

-- Create windows from layout
function M.create_windows_from_layout(windows, buffers)
  -- Implementation for creating windows based on layout configuration
end
```

## Theming

The UI components support theming through Neovim's highlight groups.

### Default Highlight Groups

```lua
-- Define default highlight groups
function M.setup_highlights()
  -- Define highlight groups
  local highlights = {
    SHCStatusLine = { fg = '#61afef', bg = '#282c34' },
    SHCStatusSuccess = { fg = '#98c379', bg = '#282c34' },
    SHCStatusError = { fg = '#e06c75', bg = '#282c34' },
    SHCPreviewNormal = { bg = '#2c323c' },
    SHCEnvironmentNormal = { bg = '#2c323c' },
    SHCHelpNormal = { bg = '#2c323c' },
  }
  
  -- Apply highlights
  for name, attrs in pairs(highlights) do
    vim.api.nvim_set_hl(0, name, attrs)
  end
end
```

### Syntax Highlighting

```lua
-- Define syntax highlighting for SHC filetypes
function M.setup_syntax()
  -- Request syntax
  vim.cmd([[
    syntax match shcRequestMethod "^[A-Z]\+" contained
    syntax match shcRequestUrl "\s\+\S\+" contained
    syntax match shcRequestLine "^[A-Z]\+\s\+\S\+" contains=shcRequestMethod,shcRequestUrl
    syntax match shcHeaderKey "^[^:]\+:" contained
    syntax match shcHeaderValue ":.*" contained
    syntax match shcHeader "^[^:]\+:.*" contains=shcHeaderKey,shcHeaderValue
    
    highlight default link shcRequestMethod Keyword
    highlight default link shcRequestUrl String
    highlight default link shcHeaderKey Identifier
    highlight default link shcHeaderValue String
  ]])
  
  -- Response syntax
  vim.cmd([[
    syntax match shcResponseStatus "^HTTP/[0-9.]\+\s\+\d\+\s\+.*$"
    syntax match shcResponseHeaderKey "^[^:]\+:" contained
    syntax match shcResponseHeaderValue ":.*" contained
    syntax match shcResponseHeader "^[^:]\+:.*" contains=shcResponseHeaderKey,shcResponseHeaderValue
    
    highlight default link shcResponseStatus Statement
    highlight default link shcResponseHeaderKey Identifier
    highlight default link shcResponseHeaderValue String
  ]])
  
  -- Explorer syntax
  vim.cmd([[
    syntax match shcExplorerCollection "^[├└]── .*$"
    syntax match shcExplorerFolder "^│\s\+[├└]── .*$"
    syntax match shcExplorerRequest "^│\s\+│\s\+[├└]── .*$"
    
    highlight default link shcExplorerCollection Directory
    highlight default link shcExplorerFolder Function
    highlight default link shcExplorerRequest String
  ]])
end
```

## Implementation Requirements

The UI components implementation must follow these requirements:

1. **Performance**:
   - Efficient buffer and window management
   - Minimal redrawing and updates
   - Lazy loading of components when possible

2. **Compatibility**:
   - Support for different Neovim versions
   - Graceful degradation for missing features
   - Compatibility with popular Neovim plugins

3. **Extensibility**:
   - Component-based architecture
   - Hooks for customization
   - Event system for component communication

4. **Accessibility**:
   - Clear visual indicators
   - Keyboard-driven interface
   - Configurable colors and highlighting

5. **Testing**:
   - Unit tests for component logic
   - Integration tests for component interactions
   - Visual tests for UI rendering

The implementation should align with the TypeScript best practices for the Node.js components and Lua best practices for the Neovim integration, ensuring proper typing, error handling, and test coverage.
