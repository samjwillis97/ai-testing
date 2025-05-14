# Neovim UI Configuration Specification

## Overview

This document specifies the configuration options for the Neovim UI package (@shc/neovim-ui). It outlines the available configuration options, their default values, and how they affect the behavior of the Neovim UI.

## Configuration Architecture

The Neovim UI configuration is managed through a combination of:

1. **Global SHC Configuration**: Core configuration shared across all SHC packages
2. **Neovim-Specific Configuration**: Configuration specific to the Neovim UI
3. **Runtime Configuration**: Configuration that can be changed during runtime

```
┌─────────────────────────────────────────────┐
│            Configuration Sources            │
│                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────┐  │
│  │ Global SHC  │  │ Neovim UI   │  │User │  │
│  │ Config File │  │ Config File │  │Init │  │
│  └─────────────┘  └─────────────┘  └─────┘  │
└───────────────────────┬─────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│         Configuration Manager               │
└───────────────────────┬─────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│            Neovim UI Components             │
└─────────────────────────────────────────────┘
```

## Configuration File

The Neovim UI configuration can be defined in a Lua file at `~/.config/nvim/lua/shc/config.lua` or through the global SHC configuration file.

### Example Configuration

```lua
-- ~/.config/nvim/lua/shc/config.lua
return {
  -- UI configuration
  ui = {
    -- Layout configuration
    layout = 'default', -- 'default', 'horizontal', 'vertical', or custom layout name
    
    -- Theme configuration
    theme = {
      use_neovim_colors = true, -- Use Neovim colorscheme
      custom_highlights = {
        -- Custom highlight groups
        SHCStatusLine = { fg = '#61afef', bg = '#282c34' },
        SHCStatusSuccess = { fg = '#98c379', bg = '#282c34' },
        SHCStatusError = { fg = '#e06c75', bg = '#282c34' },
      },
    },
    
    -- Component configuration
    components = {
      explorer = {
        width = 30,
        show_icons = true,
      },
      request_editor = {
        syntax_highlighting = true,
        auto_completion = true,
      },
      response_viewer = {
        max_height = 15,
        pretty_print = true,
        syntax_highlighting = true,
      },
    },
  },
  
  -- Key mappings
  mappings = {
    -- Global mappings
    open_explorer = '<leader>se',
    execute_request = '<leader>sr',
    
    -- Buffer-specific mappings
    request = {
      send_request = '<leader>ss',
      save_request = '<leader>sa',
    },
    response = {
      copy_response = '<leader>sc',
      save_response = '<leader>sv',
    },
    explorer = {
      open_item = '<CR>',
      create_item = 'a',
      delete_item = 'd',
    },
  },
  
  -- Integration configuration
  integration = {
    -- Telescope integration
    telescope = {
      enabled = true,
      mappings = {
        find_request = '<leader>sf',
      },
    },
    
    -- Which-key integration
    which_key = {
      enabled = true,
      register_mappings = true,
    },
  },
  
  -- Advanced configuration
  advanced = {
    -- Node.js bridge configuration
    bridge = {
      timeout = 10000, -- Timeout for bridge calls in ms
      debug = false, -- Enable debug logging for bridge
    },
    
    -- Cache configuration
    cache = {
      enabled = true,
      ttl = 3600, -- Cache TTL in seconds
    },
  },
}
```

## Configuration Options

### UI Configuration

#### Layout Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ui.layout` | string | `'default'` | Layout to use for UI components. Can be 'default', 'horizontal', 'vertical', or a custom layout name. |
| `ui.custom_layouts` | table | `{}` | Custom layout definitions. |

#### Theme Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ui.theme.use_neovim_colors` | boolean | `true` | Use Neovim colorscheme for UI components. |
| `ui.theme.custom_highlights` | table | `{}` | Custom highlight group definitions. |

#### Component Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ui.components.explorer.width` | number | `30` | Width of the collection explorer window. |
| `ui.components.explorer.show_icons` | boolean | `true` | Show icons in the collection explorer. |
| `ui.components.request_editor.syntax_highlighting` | boolean | `true` | Enable syntax highlighting in the request editor. |
| `ui.components.request_editor.auto_completion` | boolean | `true` | Enable auto-completion in the request editor. |
| `ui.components.response_viewer.max_height` | number | `15` | Maximum height of the response viewer window. |
| `ui.components.response_viewer.pretty_print` | boolean | `true` | Pretty-print response body when possible. |
| `ui.components.response_viewer.syntax_highlighting` | boolean | `true` | Enable syntax highlighting in the response viewer. |

### Key Mappings

#### Global Mappings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mappings.open_explorer` | string | `'<leader>se'` | Mapping to open the collection explorer. |
| `mappings.execute_request` | string | `'<leader>sr'` | Mapping to execute the current request. |
| `mappings.select_environment` | string | `'<leader>sE'` | Mapping to open the environment selector. |
| `mappings.show_help` | string | `'<leader>sh'` | Mapping to show help information. |

#### Buffer-Specific Mappings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mappings.request.send_request` | string | `'<leader>ss'` | Mapping to send the current request (in request buffer). |
| `mappings.request.save_request` | string | `'<leader>sa'` | Mapping to save the current request (in request buffer). |
| `mappings.response.copy_response` | string | `'<leader>sc'` | Mapping to copy the response (in response buffer). |
| `mappings.response.save_response` | string | `'<leader>sv'` | Mapping to save the response (in response buffer). |
| `mappings.explorer.open_item` | string | `'<CR>'` | Mapping to open the selected item (in explorer buffer). |
| `mappings.explorer.create_item` | string | `'a'` | Mapping to create a new item (in explorer buffer). |
| `mappings.explorer.delete_item` | string | `'d'` | Mapping to delete the selected item (in explorer buffer). |

### Integration Configuration

#### Telescope Integration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `integration.telescope.enabled` | boolean | `true` | Enable Telescope integration. |
| `integration.telescope.mappings.find_request` | string | `'<leader>sf'` | Mapping to find requests using Telescope. |

#### Which-Key Integration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `integration.which_key.enabled` | boolean | `true` | Enable which-key integration. |
| `integration.which_key.register_mappings` | boolean | `true` | Automatically register mappings with which-key. |

### Advanced Configuration

#### Node.js Bridge Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `advanced.bridge.timeout` | number | `10000` | Timeout for bridge calls in milliseconds. |
| `advanced.bridge.debug` | boolean | `false` | Enable debug logging for bridge. |

#### Cache Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `advanced.cache.enabled` | boolean | `true` | Enable caching of responses and collections. |
| `advanced.cache.ttl` | number | `3600` | Cache TTL in seconds. |

## Configuration Loading

The configuration is loaded in the following order, with later sources overriding earlier ones:

1. Default configuration
2. Global SHC configuration file
3. Neovim UI configuration file
4. User init.vim/init.lua settings

```lua
-- Configuration loading
function M.load_config()
  -- Load default configuration
  local config = require('shc.config.defaults')
  
  -- Load global SHC configuration
  local global_config = require('shc.core').get_config()
  if global_config and global_config.neovim_ui then
    config = vim.tbl_deep_extend('force', config, global_config.neovim_ui)
  end
  
  -- Load Neovim UI configuration
  local ok, user_config = pcall(require, 'shc.config')
  if ok then
    config = vim.tbl_deep_extend('force', config, user_config)
  end
  
  -- Apply user settings from init.vim/init.lua
  -- These are set using vim.g.shc_* variables
  for key, value in pairs(vim.g) do
    if key:match('^shc_') then
      local config_key = key:gsub('^shc_', ''):gsub('_', '.')
      config = set_nested_value(config, config_key, value)
    end
  end
  
  return config
end

-- Set nested value in table
function set_nested_value(tbl, key, value)
  local keys = {}
  for k in key:gmatch('[^.]+') do
    table.insert(keys, k)
  end
  
  local current = tbl
  for i = 1, #keys - 1 do
    if current[keys[i]] == nil then
      current[keys[i]] = {}
    end
    current = current[keys[i]]
  end
  
  current[keys[#keys]] = value
  
  return tbl
end
```

## Runtime Configuration

Some configuration options can be changed during runtime using Vim commands or Lua functions.

### Vim Commands

```
:SHCSetConfig ui.theme.use_neovim_colors false
:SHCSetConfig mappings.execute_request <leader>sx
```

### Lua Functions

```lua
require('shc').set_config('ui.theme.use_neovim_colors', false)
require('shc').set_config('mappings.execute_request', '<leader>sx')
```

## Configuration Validation

The configuration is validated to ensure that it contains valid values.

```lua
-- Configuration validation
function M.validate_config(config)
  -- Validate layout
  if config.ui.layout ~= 'default' and config.ui.layout ~= 'horizontal' and config.ui.layout ~= 'vertical' and not config.ui.custom_layouts[config.ui.layout] then
    error(string.format('Invalid layout: %s', config.ui.layout))
  end
  
  -- Validate component configuration
  if type(config.ui.components.explorer.width) ~= 'number' or config.ui.components.explorer.width < 10 then
    error(string.format('Invalid explorer width: %s', config.ui.components.explorer.width))
  end
  
  -- Validate bridge timeout
  if type(config.advanced.bridge.timeout) ~= 'number' or config.advanced.bridge.timeout < 1000 then
    error(string.format('Invalid bridge timeout: %s', config.advanced.bridge.timeout))
  end
  
  -- Additional validation
  
  return true
end
```

## Configuration Access

The configuration is accessed through a configuration manager that provides methods for getting and setting configuration values.

```lua
-- Configuration manager
local M = {}

-- Configuration instance
local config = nil

-- Get configuration
function M.get(path, default)
  if not config then
    config = require('shc.config.loader').load_config()
  end
  
  if not path or path == '' then
    return config
  end
  
  local value = config
  for key in path:gmatch('[^.]+') do
    if type(value) ~= 'table' or value[key] == nil then
      return default
    end
    value = value[key]
  end
  
  return value
end

-- Set configuration
function M.set(path, value)
  if not config then
    config = require('shc.config.loader').load_config()
  end
  
  if not path or path == '' then
    error('Invalid configuration path')
  end
  
  local keys = {}
  for key in path:gmatch('[^.]+') do
    table.insert(keys, key)
  end
  
  local current = config
  for i = 1, #keys - 1 do
    if current[keys[i]] == nil then
      current[keys[i]] = {}
    elseif type(current[keys[i]]) ~= 'table' then
      error(string.format('Cannot set nested key on non-table value: %s', keys[i]))
    end
    current = current[keys[i]]
  end
  
  current[keys[#keys]] = value
  
  -- Validate configuration
  require('shc.config.validator').validate_config(config)
  
  -- Apply configuration changes
  require('shc.config.applier').apply_changes(path, value)
  
  return true
end

return M
```

## Configuration Application

When configuration changes are made at runtime, they are applied to the UI components.

```lua
-- Configuration applier
local M = {}

-- Apply configuration changes
function M.apply_changes(path, value)
  local ui = require('shc.ui')
  
  if path:match('^ui%.theme') then
    -- Apply theme changes
    ui.apply_theme()
  elseif path:match('^ui%.layout') then
    -- Apply layout changes
    ui.apply_layout()
  elseif path:match('^ui%.components') then
    -- Apply component changes
    local component = path:match('ui%.components%.([^.]+)')
    if component then
      ui.update_component(component)
    end
  elseif path:match('^mappings') then
    -- Apply mapping changes
    require('shc.mappings').apply_mappings()
  elseif path:match('^advanced%.bridge') then
    -- Apply bridge changes
    require('shc.bridge').configure(require('shc.config').get('advanced.bridge'))
  end
  
  -- Additional change handlers
  
  return true
end

return M
```

## Implementation Requirements

The configuration system implementation must follow these requirements:

1. **Flexibility**:
   - Support for multiple configuration sources
   - Override mechanism for user preferences
   - Runtime configuration changes

2. **Validation**:
   - Type checking for configuration values
   - Range validation for numeric values
   - Dependency validation for related options

3. **Performance**:
   - Efficient configuration loading
   - Minimal overhead for configuration access
   - Lazy loading of configuration when possible

4. **Extensibility**:
   - Plugin-specific configuration
   - Custom configuration options
   - Configuration hooks for extensions

5. **Documentation**:
   - Clear documentation of all configuration options
   - Examples for common configurations
   - Troubleshooting guidance for configuration issues

The implementation should align with the TypeScript best practices for the Node.js components and Lua best practices for the Neovim integration, ensuring proper typing, error handling, and test coverage.
