# Neovim UI Extension System Specification

## Overview

This document specifies the extension system for the Neovim UI package (@shc/neovim-ui). It outlines the architecture, extension points, and implementation details for extending the Neovim UI functionality.

## Extension Architecture

The Neovim UI extension system provides a way to extend the functionality of the Neovim UI through plugins. Extensions can add new UI components, commands, and behaviors to the Neovim UI.

```
┌─────────────────────────────────────────────┐
│            Extension Sources                │
│                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────┐  │
│  │ Core Plugins│  │ Neovim UI   │  │User │  │
│  │             │  │ Extensions  │  │Exts │  │
│  └─────────────┘  └─────────────┘  └─────┘  │
└───────────────────────┬─────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│         Extension Manager                   │
└───────────────────────┬─────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│            Extension Points                 │
│                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────┐  │
│  │ UI Components│  │ Commands    │  │Hooks│  │
│  └─────────────┘  └─────────────┘  └─────┘  │
└─────────────────────────────────────────────┘
```

## Extension Types

### UI Component Extensions

UI component extensions add new UI components or modify existing ones.

```lua
-- UI component extension
local M = {}

-- Extension metadata
M.name = "JSON Formatter"
M.description = "Adds JSON formatting capabilities to the response viewer"
M.version = "1.0.0"
M.author = "SHC Team"

-- Extension initialization
function M.init()
  -- Register UI components
  require('shc.ui').register_component('json_formatter', {
    create = function()
      -- Create component
      return {
        buf = vim.api.nvim_create_buf(false, true),
        create_win = function(opts)
          -- Create window
          return vim.api.nvim_open_win(buf, false, opts)
        end,
      }
    end,
    update = function(component, data)
      -- Update component with data
      if data.content_type and data.content_type:match('application/json') then
        local formatted = vim.json.encode(vim.json.decode(data.body), { indent = 2 })
        vim.api.nvim_buf_set_lines(component.buf, 0, -1, false, vim.split(formatted, '\n'))
      end
    end,
    destroy = function(component)
      -- Clean up component
      if vim.api.nvim_buf_is_valid(component.buf) then
        vim.api.nvim_buf_delete(component.buf, { force = true })
      end
    end,
  })
  
  return true
end

-- Extension cleanup
function M.cleanup()
  -- Unregister UI components
  require('shc.ui').unregister_component('json_formatter')
  
  return true
end

return M
```

### Command Extensions

Command extensions add new commands or modify existing ones.

```lua
-- Command extension
local M = {}

-- Extension metadata
M.name = "Request History"
M.description = "Adds commands for managing request history"
M.version = "1.0.0"
M.author = "SHC Team"

-- Extension initialization
function M.init()
  -- Register commands
  vim.api.nvim_create_user_command('SHCHistory', function(opts)
    require('shc.extensions.history').show_history(opts.args)
  end, { nargs = '?' })
  
  vim.api.nvim_create_user_command('SHCHistoryClear', function()
    require('shc.extensions.history').clear_history()
  end, {})
  
  -- Register key mappings
  vim.api.nvim_set_keymap('n', '<leader>sh', ':SHCHistory<CR>', { noremap = true, silent = true })
  
  return true
end

-- Extension cleanup
function M.cleanup()
  -- Unregister commands
  pcall(vim.api.nvim_del_user_command, 'SHCHistory')
  pcall(vim.api.nvim_del_user_command, 'SHCHistoryClear')
  
  -- Unregister key mappings
  pcall(vim.api.nvim_del_keymap, 'n', '<leader>sh')
  
  return true
end

-- Extension implementation
function M.show_history(filter)
  -- Implementation for showing history
end

function M.clear_history()
  -- Implementation for clearing history
end

return M
```

### Hook Extensions

Hook extensions add hooks to existing functionality.

```lua
-- Hook extension
local M = {}

-- Extension metadata
M.name = "Request Logger"
M.description = "Logs all requests to a file"
M.version = "1.0.0"
M.author = "SHC Team"

-- Extension initialization
function M.init()
  -- Register hooks
  require('shc.hooks').register('before_request', function(request)
    -- Log request
    M.log_request(request)
    return request
  end)
  
  require('shc.hooks').register('after_response', function(response)
    -- Log response
    M.log_response(response)
    return response
  end)
  
  return true
end

-- Extension cleanup
function M.cleanup()
  -- Unregister hooks
  require('shc.hooks').unregister('before_request', M.log_request)
  require('shc.hooks').unregister('after_response', M.log_response)
  
  return true
end

-- Extension implementation
function M.log_request(request)
  -- Implementation for logging request
end

function M.log_response(response)
  -- Implementation for logging response
end

return M
```

## Extension Points

### UI Component Extension Points

| Extension Point | Description |
|-----------------|-------------|
| `register_component` | Register a new UI component |
| `extend_component` | Extend an existing UI component |
| `register_renderer` | Register a custom renderer for a content type |
| `register_formatter` | Register a custom formatter for a content type |

### Command Extension Points

| Extension Point | Description |
|-----------------|-------------|
| `register_command` | Register a new command |
| `extend_command` | Extend an existing command |
| `register_command_alias` | Register an alias for a command |
| `register_keymapping` | Register a key mapping |

### Hook Extension Points

| Extension Point | Description |
|-----------------|-------------|
| `before_request` | Hook called before a request is sent |
| `after_response` | Hook called after a response is received |
| `before_save_request` | Hook called before a request is saved |
| `after_load_request` | Hook called after a request is loaded |
| `before_ui_render` | Hook called before UI rendering |
| `after_ui_render` | Hook called after UI rendering |

## Extension Manager

The extension manager is responsible for loading, unloading, and managing extensions.

```lua
-- Extension manager
local M = {}

-- Loaded extensions
M.extensions = {}

-- Load extension
function M.load_extension(name)
  local ok, ext = pcall(require, 'shc.extensions.' .. name)
  if not ok then
    error(string.format('Failed to load extension "%s": %s', name, ext))
  end
  
  -- Validate extension
  if not ext.name or not ext.init or not ext.cleanup then
    error(string.format('Invalid extension "%s": missing required fields', name))
  end
  
  -- Initialize extension
  local success, result = pcall(ext.init)
  if not success then
    error(string.format('Failed to initialize extension "%s": %s', name, result))
  end
  
  -- Store extension
  M.extensions[name] = ext
  
  return true
end

-- Unload extension
function M.unload_extension(name)
  local ext = M.extensions[name]
  if not ext then
    error(string.format('Extension "%s" is not loaded', name))
  end
  
  -- Clean up extension
  local success, result = pcall(ext.cleanup)
  if not success then
    error(string.format('Failed to clean up extension "%s": %s', name, result))
  end
  
  -- Remove extension
  M.extensions[name] = nil
  
  return true
end

-- Get extension
function M.get_extension(name)
  return M.extensions[name]
end

-- Get all extensions
function M.get_extensions()
  return vim.tbl_values(M.extensions)
end

-- Initialize all extensions
function M.init_extensions(config)
  local extensions = config.extensions or {}
  
  for name, enabled in pairs(extensions) do
    if enabled then
      local success, err = pcall(M.load_extension, name)
      if not success then
        require('shc.logger').error(string.format('Failed to load extension "%s": %s', name, err))
      end
    end
  end
  
  return true
end

return M
```

## Hook System

The hook system allows extensions to hook into various points in the Neovim UI.

```lua
-- Hook system
local M = {}

-- Registered hooks
M.hooks = {}

-- Register hook
function M.register(event, callback, priority)
  priority = priority or 100
  
  if not M.hooks[event] then
    M.hooks[event] = {}
  end
  
  table.insert(M.hooks[event], {
    callback = callback,
    priority = priority,
  })
  
  -- Sort hooks by priority (higher priority first)
  table.sort(M.hooks[event], function(a, b)
    return a.priority > b.priority
  end)
  
  return true
end

-- Unregister hook
function M.unregister(event, callback)
  if not M.hooks[event] then
    return false
  end
  
  for i, hook in ipairs(M.hooks[event]) do
    if hook.callback == callback then
      table.remove(M.hooks[event], i)
      return true
    end
  end
  
  return false
end

-- Run hooks
function M.run(event, data)
  if not M.hooks[event] then
    return data
  end
  
  local result = data
  
  for _, hook in ipairs(M.hooks[event]) do
    local success, new_result = pcall(hook.callback, result)
    if success and new_result ~= nil then
      result = new_result
    end
  end
  
  return result
end

return M
```

## Extension Configuration

Extensions can be configured through the Neovim UI configuration.

```lua
-- Extension configuration
return {
  -- Other configuration options
  
  -- Extension configuration
  extensions = {
    -- Built-in extensions
    json_formatter = true,
    request_history = true,
    request_logger = false,
    
    -- Custom extensions
    my_custom_extension = {
      enabled = true,
      options = {
        -- Extension-specific options
        log_file = '~/.shc/logs/requests.log',
        max_log_size = 1024 * 1024, -- 1MB
      },
    },
  },
}
```

## Extension Discovery

Extensions are discovered from multiple sources:

1. **Built-in Extensions**: Extensions that come with the Neovim UI package
2. **Core Plugin Extensions**: Extensions provided by Core plugins
3. **User Extensions**: Extensions created by the user

```lua
-- Extension discovery
function M.discover_extensions()
  local extensions = {}
  
  -- Discover built-in extensions
  local builtin_path = vim.fn.stdpath('data') .. '/site/pack/packer/start/shc.nvim/lua/shc/extensions'
  discover_from_path(builtin_path, extensions, 'builtin')
  
  -- Discover core plugin extensions
  local core_path = vim.fn.stdpath('data') .. '/site/pack/packer/start/shc.nvim/lua/shc/core/plugins'
  discover_from_path(core_path, extensions, 'core')
  
  -- Discover user extensions
  local user_path = vim.fn.stdpath('config') .. '/lua/shc/extensions'
  discover_from_path(user_path, extensions, 'user')
  
  return extensions
end

-- Discover extensions from path
function discover_from_path(path, extensions, source)
  if not vim.fn.isdirectory(path) then
    return
  end
  
  for _, file in ipairs(vim.fn.readdir(path)) do
    if file:match('%.lua$') then
      local name = file:gsub('%.lua$', '')
      local ok, ext = pcall(require, 'shc.extensions.' .. name)
      if ok and ext.name and ext.init and ext.cleanup then
        extensions[name] = {
          name = ext.name,
          description = ext.description,
          version = ext.version,
          author = ext.author,
          source = source,
        }
      end
    end
  end
end
```

## Extension Development

### Extension Template

```lua
-- Extension template
local M = {}

-- Extension metadata
M.name = "My Extension"
M.description = "Description of my extension"
M.version = "1.0.0"
M.author = "Your Name"

-- Extension initialization
function M.init()
  -- Initialize extension
  -- Register components, commands, hooks, etc.
  
  return true
end

-- Extension cleanup
function M.cleanup()
  -- Clean up extension
  -- Unregister components, commands, hooks, etc.
  
  return true
end

-- Extension implementation
-- Add your extension functionality here

return M
```

### Extension API

Extensions have access to the following APIs:

1. **UI API**: For registering and manipulating UI components
2. **Command API**: For registering and manipulating commands
3. **Hook API**: For registering hooks
4. **Core API**: For accessing Core functionality
5. **Logger API**: For logging messages
6. **Config API**: For accessing configuration

```lua
-- Example extension using APIs
function M.init()
  -- UI API
  local ui = require('shc.ui')
  ui.register_component('my_component', {
    -- Component definition
  })
  
  -- Command API
  local cmd = require('shc.commands')
  cmd.register('MyCommand', function(opts)
    -- Command implementation
  end, { nargs = '?' })
  
  -- Hook API
  local hooks = require('shc.hooks')
  hooks.register('before_request', function(request)
    -- Hook implementation
    return request
  end)
  
  -- Core API
  local core = require('shc.core')
  local client = core.get_client()
  
  -- Logger API
  local logger = require('shc.logger')
  logger.info('My extension initialized')
  
  -- Config API
  local config = require('shc.config')
  local my_config = config.get('extensions.my_extension', {})
  
  return true
end
```

## Implementation Requirements

The extension system implementation must follow these requirements:

1. **Modularity**:
   - Extensions should be self-contained
   - Extensions should not interfere with each other
   - Extensions should be loadable and unloadable at runtime

2. **Stability**:
   - Extension failures should not crash the Neovim UI
   - Extensions should be properly isolated
   - Extension errors should be properly reported

3. **Performance**:
   - Extensions should not significantly impact performance
   - Extension loading should be lazy when possible
   - Extension hooks should be efficient

4. **Compatibility**:
   - Extensions should work across different Neovim versions
   - Extensions should be compatible with other plugins
   - Extensions should follow Neovim best practices

5. **Documentation**:
   - Extensions should be well-documented
   - Extension APIs should be clearly defined
   - Extension development should be easy to understand

The implementation should align with the TypeScript best practices for the Node.js components and Lua best practices for the Neovim integration, ensuring proper typing, error handling, and test coverage.
