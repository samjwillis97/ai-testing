# Neovim UI Commands Specification

## Overview

This document specifies the command system for the Neovim UI package (@shc/neovim-ui). It outlines the available commands, their options, arguments, and behaviors.

## Command Architecture

The Neovim UI uses a combination of Vim commands, functions, and key mappings to provide a comprehensive interface for interacting with the SHC core functionality.

```
┌─────────────────────────────────────────────┐
│               User Input                    │
│                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────┐  │
│  │ Vim Commands│  │Key Mappings │  │ API │  │
│  └─────────────┘  └─────────────┘  └─────┘  │
└───────────────────────┬─────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│            Command Dispatcher               │
└───────────────────────┬─────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│            Command Handlers                 │
│                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────┐  │
│  │   Request   │  │ Collection  │  │ ... │  │
│  └─────────────┘  └─────────────┘  └─────┘  │
└───────────────────────┬─────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│               Core API                      │
└─────────────────────────────────────────────┘
```

## Command Types

### Vim Commands

Vim commands are registered with Neovim and can be executed from the command line.

```lua
-- Register Vim commands
function M.register_commands()
  local commands = {
    {
      name = 'SHCExecuteRequest',
      callback = function(opts)
        require('shc.commands.request').execute_request(opts.args)
      end,
      opts = { nargs = '?' },
    },
    {
      name = 'SHCOpenCollection',
      callback = function(opts)
        require('shc.commands.collection').open_collection(opts.args)
      end,
      opts = { nargs = '?' },
    },
    -- Additional commands
  }
  
  for _, cmd in ipairs(commands) do
    vim.api.nvim_create_user_command(cmd.name, cmd.callback, cmd.opts)
  end
end
```

### Key Mappings

Key mappings provide quick access to common functionality.

```lua
-- Register key mappings
function M.register_mappings(config)
  local mappings = {
    -- Global mappings
    global = {
      { mode = 'n', lhs = config.mappings.open_explorer, rhs = ':SHCOpenExplorer<CR>' },
      { mode = 'n', lhs = config.mappings.execute_request, rhs = ':SHCExecuteRequest<CR>' },
      -- Additional global mappings
    },
    -- Buffer-specific mappings
    request = {
      { mode = 'n', lhs = config.mappings.send_request, rhs = ':SHCExecuteRequest<CR>' },
      -- Additional request buffer mappings
    },
    response = {
      { mode = 'n', lhs = config.mappings.copy_response, rhs = ':SHCCopyResponse<CR>' },
      -- Additional response buffer mappings
    },
    explorer = {
      { mode = 'n', lhs = config.mappings.open_item, rhs = ':SHCOpenItem<CR>' },
      -- Additional explorer buffer mappings
    },
  }
  
  -- Apply global mappings
  for _, mapping in ipairs(mappings.global) do
    vim.api.nvim_set_keymap(mapping.mode, mapping.lhs, mapping.rhs, { noremap = true, silent = true })
  end
  
  -- Register buffer-specific mappings to be applied when buffers are created
  return {
    request = mappings.request,
    response = mappings.response,
    explorer = mappings.explorer,
  }
end
```

### API Functions

API functions provide programmatic access to SHC functionality.

```lua
-- API function for executing a request
function M.execute_request(request_data)
  -- Implementation for executing a request
end

-- API function for opening a collection
function M.open_collection(collection_id)
  -- Implementation for opening a collection
end

-- Additional API functions
```

## Command Categories

### Request Commands

Commands for creating, editing, and executing HTTP requests.

#### Execute Request

```
:SHCExecuteRequest [request_id]
```

Executes the current request or a specific request by ID.

##### Implementation

```lua
function M.execute_request(request_id)
  local logger = require('shc.logger')
  local ui = require('shc.ui')
  local core = require('shc.core')
  
  -- Get request data
  local request_data
  if request_id then
    -- Get request from collection by ID
    request_data = core.get_request_by_id(request_id)
  else
    -- Get request from current buffer
    request_data = ui.get_request_from_buffer()
  end
  
  if not request_data then
    logger.error('No request found')
    return
  end
  
  -- Show request preview
  local preview = ui.show_request_preview(request_data)
  
  -- Execute request
  logger.info(string.format('Executing %s request to %s', request_data.method, request_data.url))
  
  local spinner = ui.create_spinner('Executing request...')
  spinner:start()
  
  core.execute_request(request_data)
    :then(function(response)
      spinner:succeed('Request completed')
      
      -- Update response buffer
      ui.update_response_buffer(response)
      
      -- Show response buffer
      ui.show_buffer('response')
      
      -- Log response info
      logger.info(string.format('Response: %d %s', response.status, response.statusText))
    end)
    :catch(function(error)
      spinner:fail('Request failed')
      logger.error(string.format('Request failed: %s', error.message))
      
      -- Show error in response buffer
      ui.update_response_buffer_with_error(error)
    end)
end
```

#### Create Request

```
:SHCCreateRequest [method] [url]
```

Creates a new request with the specified method and URL.

##### Implementation

```lua
function M.create_request(method, url)
  local ui = require('shc.ui')
  
  -- Create request buffer
  local buf = ui.create_request_buffer()
  
  -- Set initial content
  local content = {}
  table.insert(content, string.format('%s %s', method or 'GET', url or 'https://'))
  table.insert(content, 'Content-Type: application/json')
  table.insert(content, '')
  table.insert(content, '{}')
  
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, content)
  
  -- Show buffer
  ui.show_buffer(buf)
end
```

#### Save Request

```
:SHCSaveRequest [collection_id] [name]
```

Saves the current request to a collection.

##### Implementation

```lua
function M.save_request(collection_id, name)
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- Get request from current buffer
  local request_data = ui.get_request_from_buffer()
  
  if not request_data then
    logger.error('No request found')
    return
  }
  
  -- If collection_id not provided, prompt user
  if not collection_id then
    ui.prompt_collection_selection(function(selected_id)
      if selected_id then
        M.save_request(selected_id, name)
      end
    end)
    return
  end
  
  -- If name not provided, prompt user
  if not name then
    ui.prompt_input('Request name', '', function(input_name)
      if input_name and input_name ~= '' then
        M.save_request(collection_id, input_name)
      end
    end)
    return
  end
  
  -- Save request
  core.save_request(collection_id, name, request_data)
    :then(function(request_id)
      logger.success(string.format('Request saved as "%s"', name))
      
      -- Update collection explorer
      ui.update_collection_explorer()
    end)
    :catch(function(error)
      logger.error(string.format('Failed to save request: %s', error.message))
    end)
end
```

### Collection Commands

Commands for managing collections of requests.

#### Open Collection Explorer

```
:SHCOpenExplorer
```

Opens the collection explorer.

##### Implementation

```lua
function M.open_explorer()
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- Create explorer buffer if it doesn't exist
  local buf = ui.get_buffer('explorer') or ui.create_explorer_buffer()
  
  -- Show buffer
  ui.show_buffer(buf)
  
  -- Update explorer content
  core.get_collections()
    :then(function(collections)
      ui.update_explorer_buffer(collections)
    end)
    :catch(function(error)
      logger.error(string.format('Failed to load collections: %s', error.message))
    end)
end
```

#### Create Collection

```
:SHCCreateCollection [name]
```

Creates a new collection.

##### Implementation

```lua
function M.create_collection(name)
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- If name not provided, prompt user
  if not name then
    ui.prompt_input('Collection name', '', function(input_name)
      if input_name and input_name ~= '' then
        M.create_collection(input_name)
      end
    end)
    return
  end
  
  -- Create collection
  core.create_collection(name)
    :then(function(collection_id)
      logger.success(string.format('Collection "%s" created', name))
      
      -- Update collection explorer
      ui.update_collection_explorer()
    end)
    :catch(function(error)
      logger.error(string.format('Failed to create collection: %s', error.message))
    end)
end
```

#### Import Collection

```
:SHCImportCollection [file_path]
```

Imports a collection from a file.

##### Implementation

```lua
function M.import_collection(file_path)
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- If file_path not provided, prompt user
  if not file_path then
    ui.prompt_file_selection(function(selected_path)
      if selected_path then
        M.import_collection(selected_path)
      end
    end)
    return
  end
  
  -- Import collection
  local spinner = ui.create_spinner(string.format('Importing collection from %s...', file_path))
  spinner:start()
  
  core.import_collection(file_path)
    :then(function(collection)
      spinner:succeed('Collection imported successfully')
      logger.success(string.format('Collection "%s" imported', collection.name))
      
      -- Update collection explorer
      ui.update_collection_explorer()
    end)
    :catch(function(error)
      spinner:fail('Import failed')
      logger.error(string.format('Failed to import collection: %s', error.message))
    end)
end
```

#### Export Collection

```
:SHCExportCollection [collection_id] [file_path]
```

Exports a collection to a file.

##### Implementation

```lua
function M.export_collection(collection_id, file_path)
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- If collection_id not provided, prompt user
  if not collection_id then
    ui.prompt_collection_selection(function(selected_id)
      if selected_id then
        M.export_collection(selected_id, file_path)
      end
    end)
    return
  end
  
  -- If file_path not provided, prompt user
  if not file_path then
    ui.prompt_file_save(function(selected_path)
      if selected_path then
        M.export_collection(collection_id, selected_path)
      end
    end)
    return
  end
  
  -- Export collection
  local spinner = ui.create_spinner(string.format('Exporting collection to %s...', file_path))
  spinner:start()
  
  core.export_collection(collection_id)
    :then(function(content)
      -- Write to file
      vim.fn.writefile(vim.split(content, '\n'), file_path)
      
      spinner:succeed('Collection exported successfully')
      logger.success(string.format('Collection exported to %s', file_path))
    end)
    :catch(function(error)
      spinner:fail('Export failed')
      logger.error(string.format('Failed to export collection: %s', error.message))
    end)
end
```

### Environment Commands

Commands for managing environments and variables.

#### Select Environment

```
:SHCSelectEnvironment
```

Opens the environment selector.

##### Implementation

```lua
function M.select_environment()
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- Get environments
  core.get_environments()
    :then(function(environments)
      -- Get active environment
      local active_env = core.get_active_environment()
      
      -- Show environment selector
      ui.show_environment_selector(environments, active_env, function(selected_env)
        if selected_env then
          -- Set active environment
          core.set_active_environment(selected_env)
            :then(function()
              logger.success(string.format('Environment set to "%s"', selected_env))
              
              -- Update status line
              ui.update_status_line()
            end)
            :catch(function(error)
              logger.error(string.format('Failed to set environment: %s', error.message))
            end)
        end
      end)
    end)
    :catch(function(error)
      logger.error(string.format('Failed to get environments: %s', error.message))
    end)
end
```

#### Edit Variables

```
:SHCEditVariables [environment]
```

Opens the variable editor for the specified environment.

##### Implementation

```lua
function M.edit_variables(environment)
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- If environment not provided, use active environment
  environment = environment or core.get_active_environment()
  
  if not environment then
    logger.error('No active environment')
    return
  end
  
  -- Get variables
  core.get_environment_variables(environment)
    :then(function(variables)
      -- Create variable editor
      local buf = ui.create_variable_editor(variables)
      
      -- Show buffer
      ui.show_buffer(buf)
      
      -- Store environment for later use
      vim.api.nvim_buf_set_var(buf, 'shc_environment', environment)
    end)
    :catch(function(error)
      logger.error(string.format('Failed to get variables: %s', error.message))
    end)
end
```

#### Save Variables

```
:SHCSaveVariables
```

Saves the variables from the variable editor.

##### Implementation

```lua
function M.save_variables()
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- Get current buffer
  local buf = vim.api.nvim_get_current_buf()
  
  -- Check if this is a variable editor buffer
  if vim.api.nvim_buf_get_option(buf, 'filetype') ~= 'shc_variables' then
    logger.error('Not a variable editor buffer')
    return
  end
  
  -- Get environment
  local environment = vim.api.nvim_buf_get_var(buf, 'shc_environment')
  
  if not environment then
    logger.error('No environment associated with this buffer')
    return
  end
  
  -- Get variables from buffer
  local variables = ui.get_variables_from_buffer(buf)
  
  -- Save variables
  core.set_environment_variables(environment, variables)
    :then(function()
      logger.success('Variables saved successfully')
    end)
    :catch(function(error)
      logger.error(string.format('Failed to save variables: %s', error.message))
    end)
end
```

### Configuration Commands

Commands for managing SHC configuration.

#### Open Configuration

```
:SHCOpenConfig
```

Opens the configuration file.

##### Implementation

```lua
function M.open_config()
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- Get config file path
  local config_path = core.get_config_path()
  
  -- Open file
  vim.cmd('edit ' .. config_path)
end
```

#### Reload Configuration

```
:SHCReloadConfig
```

Reloads the configuration file.

##### Implementation

```lua
function M.reload_config()
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- Reload configuration
  local spinner = ui.create_spinner('Reloading configuration...')
  spinner:start()
  
  core.reload_config()
    :then(function()
      spinner:succeed('Configuration reloaded successfully')
      logger.success('Configuration reloaded')
      
      -- Update UI components
      ui.update_collection_explorer()
      ui.update_status_line()
    end)
    :catch(function(error)
      spinner:fail('Reload failed')
      logger.error(string.format('Failed to reload configuration: %s', error.message))
    end)
end
```

### Plugin Commands

Commands for managing SHC plugins.

#### List Plugins

```
:SHCListPlugins
```

Lists all installed plugins.

##### Implementation

```lua
function M.list_plugins()
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- Get plugins
  core.get_plugins()
    :then(function(plugins)
      -- Create plugin list buffer
      local buf = ui.create_plugin_list_buffer(plugins)
      
      -- Show buffer
      ui.show_buffer(buf)
    end)
    :catch(function(error)
      logger.error(string.format('Failed to get plugins: %s', error.message))
    end)
end
```

#### Install Plugin

```
:SHCInstallPlugin [source]
```

Installs a plugin from a source.

##### Implementation

```lua
function M.install_plugin(source)
  local ui = require('shc.ui')
  local core = require('shc.core')
  local logger = require('shc.logger')
  
  -- If source not provided, prompt user
  if not source then
    ui.prompt_input('Plugin source', '', function(input_source)
      if input_source and input_source ~= '' then
        M.install_plugin(input_source)
      end
    end)
    return
  end
  
  -- Install plugin
  local spinner = ui.create_spinner(string.format('Installing plugin from %s...', source))
  spinner:start()
  
  core.install_plugin(source)
    :then(function(plugin)
      spinner:succeed('Plugin installed successfully')
      logger.success(string.format('Plugin "%s" installed', plugin.name))
      
      -- Update plugin list if open
      ui.update_plugin_list()
    end)
    :catch(function(error)
      spinner:fail('Installation failed')
      logger.error(string.format('Failed to install plugin: %s', error.message))
    end)
end
```

### Utility Commands

Utility commands for various SHC operations.

#### Show Help

```
:SHCHelp [topic]
```

Shows help information for a specific topic.

##### Implementation

```lua
function M.show_help(topic)
  local ui = require('shc.ui')
  local logger = require('shc.logger')
  
  -- If topic not provided, show general help
  topic = topic or 'general'
  
  -- Get help content
  local help_content = ui.get_help_content(topic)
  
  if not help_content then
    logger.error(string.format('No help available for topic "%s"', topic))
    return
  end
  
  -- Show help window
  ui.show_help_window(topic, help_content)
end
```

#### Copy Response

```
:SHCCopyResponse [format]
```

Copies the response to the clipboard.

##### Implementation

```lua
function M.copy_response(format)
  local ui = require('shc.ui')
  local logger = require('shc.logger')
  
  -- Get format (default to 'full')
  format = format or 'full'
  
  -- Get response data
  local response = ui.get_response_data()
  
  if not response then
    logger.error('No response data available')
    return
  end
  
  -- Format response based on format
  local content
  if format == 'body' then
    content = response.body
  elseif format == 'headers' then
    content = vim.json.encode(response.headers)
  else
    -- Full response
    content = string.format('%s %s\n', response.status, response.statusText)
    
    for key, value in pairs(response.headers) do
      content = content .. string.format('%s: %s\n', key, value)
    end
    
    content = content .. '\n' .. response.body
  end
  
  -- Copy to clipboard
  vim.fn.setreg('+', content)
  logger.success('Response copied to clipboard')
end
```

## Command Execution Flow

The command execution flow follows a consistent pattern:

1. **Command Invocation**:
   - User invokes a command via Vim command line, key mapping, or API call
   - Command arguments are parsed and validated

2. **Command Dispatch**:
   - Command is dispatched to the appropriate handler
   - Handler validates arguments and prepares for execution

3. **Core API Interaction**:
   - Handler calls Core API functions
   - UI feedback is provided during long-running operations

4. **Result Handling**:
   - Success or failure is handled appropriately
   - UI is updated to reflect the result
   - User is notified of the outcome

## Implementation Requirements

The command system implementation must follow these requirements:

1. **Consistency**:
   - Commands should follow a consistent naming convention
   - Command behavior should be predictable
   - Error handling should be consistent across all commands

2. **Feedback**:
   - Commands should provide clear feedback on success or failure
   - Long-running commands should show progress indicators
   - Error messages should be informative and actionable

3. **Extensibility**:
   - Command system should be extensible for plugins
   - Custom commands should be registerable
   - Command hooks should be available for customization

4. **Performance**:
   - Commands should be responsive
   - Long-running operations should be non-blocking
   - UI updates should be efficient

5. **Testing**:
   - Unit tests for command logic
   - Integration tests for command execution
   - Mock Core API for testing

The implementation should align with the TypeScript best practices for the Node.js components and Lua best practices for the Neovim integration, ensuring proper typing, error handling, and test coverage.
