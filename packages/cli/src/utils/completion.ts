/**
 * Tab completion utilities
 */
import { getCollections, getRequests } from './collections.js';
import { getCollectionDir } from './config.js';
import { cliPluginManager } from '../plugins/index.js';
import { Command } from 'commander';
import { introspectProgram } from './command-introspection.js';
import {
  generateBashCompletionScript as generateDynamicBashCompletionScript,
  generateZshCompletionScript as generateDynamicZshCompletionScript,
  generateFishCompletionScript as generateDynamicFishCompletionScript,
} from './completion-generators.js';
import { createSilentLogger } from './logger.js';

// Store the program instance for introspection
let programInstance: Command | null = null;

/**
 * Set the program instance for introspection
 */
export function setProgramForCompletion(program: Command): void {
  programInstance = program;
}

/**
 * Generate completion script for the specified shell
 */
export function generateCompletionScript(shell: 'bash' | 'zsh' | 'fish'): string {
  // Check if we have a plugin for this shell
  const completionHandler = cliPluginManager.getShellCompletion(shell);
  if (completionHandler) {
    // Use the plugin to generate completions
    const completions = completionHandler('', 0); // Empty line for initial script generation
    if (
      Array.isArray(completions) &&
      completions.length === 1 &&
      typeof completions[0] === 'string' &&
      completions[0].startsWith('#!')
    ) {
      // If the plugin returns a shell script, use it directly
      return completions[0];
    }
  }

  // Check if we should generate an eval-compatible script
  const isEvalMode = process.env.SHC_COMPLETION_EVAL_MODE === 'true';

  // If we have a program instance, use dynamic completion generation
  if (programInstance) {
    const commands = introspectProgram(programInstance);

    switch (shell) {
      case 'bash':
        return generateDynamicBashCompletionScript(commands);
      case 'zsh':
        return generateDynamicZshCompletionScript(commands, isEvalMode);
      case 'fish':
        return generateDynamicFishCompletionScript(commands);
      default:
        throw new Error(`Unsupported shell: ${shell}`);
    }
  }

  // Fall back to built-in static completion scripts if no program instance is available
  switch (shell) {
    case 'bash':
      return generateBashCompletionScript();
    case 'zsh':
      return isEvalMode ? generateZshEvalCompletionScript() : generateZshCompletionScript();
    case 'fish':
      return generateFishCompletionScript();
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

/**
 * Generate Bash completion script
 */
function generateBashCompletionScript(): string {
  return `#!/usr/bin/env bash

_shc_completion() {
  local cur prev words cword
  _init_completion || return

  case $prev in
    collection|c)
      # Complete collection names
      COMPREPLY=($(compgen -W "$(shc --get-collections 2>/dev/null)" -- "$cur"))
      return
      ;;
    completion)
      # Complete shell types
      COMPREPLY=($(compgen -W "bash zsh fish" -- "$cur"))
      return
      ;;
    shc)
      if [[ "$cur" == c* ]]; then
        COMPREPLY=($(compgen -W "collection completion" -- "$cur"))
        return
      fi
      ;;
  esac

  # Check if we're completing a request name
  if [[ \${words[1]} == "collection" || \${words[1]} == "c" ]] && [[ $cword -eq 3 ]]; then
    local collection="\${words[2]}"
    COMPREPLY=($(compgen -W "$(shc --get-requests "$collection" 2>/dev/null)" -- "$cur"))
    return
  fi

  # Complete command options
  if [[ "$cur" == -* ]]; then
    COMPREPLY=($(compgen -W "--help --version --verbose --silent --config --env --no-color --var-set --set --output --eval" -- "$cur"))
    return
  fi

  # Complete subcommands
  COMPREPLY=($(compgen -W "collection c get post put patch delete head options direct completion" -- "$cur"))
  return
}

complete -F _shc_completion shc
`;
}

/**
 * Generate Zsh completion script
 */
function generateZshCompletionScript(): string {
  return `#compdef shc

_shc() {
  local -a commands
  local -a collection_commands

  commands=(
    'collection:Execute a request from a collection'
    'c:Execute a request from a collection'
    'get:Execute a GET request'
    'post:Execute a POST request'
    'put:Execute a PUT request'
    'patch:Execute a PATCH request'
    'delete:Execute a DELETE request'
    'head:Execute a HEAD request'
    'options:Execute an OPTIONS request'
    'direct:Execute an HTTP request with the specified method'
    'completion:Generate shell completion script'
  )

  _arguments -C \\
    '--help[Show help]' \\
    '--version[Show version]' \\
    '--verbose[Enable verbose output]' \\
    '--silent[Disable all output]' \\
    '--config[Specify config file]:config file:_files' \\
    '--env[Specify environment]:environment name:' \\
    '--no-color[Disable colors]' \\
    '--var-set[Override variable set for this request]:namespace=value:' \\
    '-V[Set config value]:key=value:' \\
    '--set[Set config value]:key=value:' \\
    '-o[Output format]:format:(json yaml raw table)' \\
    '--output[Output format]:format:(json yaml raw table)' \\
    '--eval[Generate completion script suitable for eval]' \\
    '1: :{_describe "command" commands}' \\
    '*::arg:->args'

  case $state in
    args)
      case $words[1] in
        collection|c)
          if [[ $CURRENT -eq 2 ]]; then
            local -a collections
            collections=(\${(f)"$(shc --get-collections 2>/dev/null)"})
            _describe 'collections' collections
          elif [[ $CURRENT -eq 3 ]]; then
            local -a requests
            requests=(\${(f)"$(shc --get-requests $words[2] 2>/dev/null)"})
            _describe 'requests' requests
          else
            _arguments \\
              '--collection-dir[Specify collection directory]:directory:_files -/' \\
              '-o[Output format]:format:(json yaml raw table)' \\
              '--output[Output format]:format:(json yaml raw table)' \\
              '-H[Add header]:header:' \\
              '--header[Add header]:header:' \\
              '-q[Add query parameter]:query:' \\
              '--query[Add query parameter]:query:' \\
              '-d[Request body]:data:' \\
              '--data[Request body]:data:' \\
              '-u[Authentication]:auth:' \\
              '--auth[Authentication]:auth:' \\
              '-t[Request timeout]:timeout:' \\
              '--timeout[Request timeout]:timeout:' \\
              '--var-set[Override variable set for this request]:namespace=value:'
          fi
          ;;
        completion)
          _arguments \\
            '--eval[Generate completion script suitable for eval]'
          ;;
        get|post|put|patch|delete|head|options|direct)
          _arguments \\
            '-c[Config file path]:config file:_files' \\
            '--config[Config file path]:config file:_files' \\
            '-H[Add header]:header:' \\
            '--header[Add header]:header:' \\
            '-q[Add query parameter]:query:' \\
            '--query[Add query parameter]:query:' \\
            '-d[Request body]:data:' \\
            '--data[Request body]:data:' \\
            '-u[Authentication]:auth:' \\
            '--auth[Authentication]:auth:' \\
            '-t[Request timeout]:timeout:' \\
            '--timeout[Request timeout]:timeout:' \\
            '-o[Output format]:format:(json yaml raw table)' \\
            '--output[Output format]:format:(json yaml raw table)' \\
            '-v[Verbose output]' \\
            '--verbose[Verbose output]' \\
            '-s[Silent mode]' \\
            '--silent[Silent mode]' \\
            '--no-color[Disable colors]' \\
            '--var-set[Override variable set for this request]:namespace=value:'
          ;;
      esac
      ;;
  esac
}

_shc
`;
}

/**
 * Generate Zsh completion script compatible with eval
 */
function generateZshEvalCompletionScript(): string {
  return `# Zsh completion script for shc (eval compatible)

# Define the completion function
function _shc {
  local -a commands
  local -a collection_commands

  commands=(
    'collection:Execute a request from a collection'
    'c:Execute a request from a collection'
    'get:Execute a GET request'
    'post:Execute a POST request'
    'put:Execute a PUT request'
    'patch:Execute a PATCH request'
    'delete:Execute a DELETE request'
    'head:Execute a HEAD request'
    'options:Execute an OPTIONS request'
    'direct:Execute an HTTP request with the specified method'
    'completion:Generate shell completion script'
  )

  _arguments -C \\
    '--help[Show help]' \\
    '--version[Show version]' \\
    '--verbose[Enable verbose output]' \\
    '--silent[Disable all output]' \\
    '--config[Specify config file]:config file:_files' \\
    '--env[Specify environment]:environment name:' \\
    '--no-color[Disable colors]' \\
    '--var-set[Override variable set for this request]:namespace=value:' \\
    '-V[Set config value]:key=value:' \\
    '--set[Set config value]:key=value:' \\
    '-o[Output format]:format:(json yaml raw table)' \\
    '--output[Output format]:format:(json yaml raw table)' \\
    '--eval[Generate completion script suitable for eval]' \\
    '1: :{_describe "command" commands}' \\
    '*::arg:->args'

  case $state in
    args)
      case $words[1] in
        collection|c)
          if [[ $CURRENT -eq 2 ]]; then
            local -a collections
            collections=(\${(f)"$(shc --get-collections 2>/dev/null)"})
            _describe 'collections' collections
          elif [[ $CURRENT -eq 3 ]]; then
            local -a requests
            requests=(\${(f)"$(shc --get-requests $words[2] 2>/dev/null)"})
            _describe 'requests' requests
          else
            _arguments \\
              '--collection-dir[Specify collection directory]:directory:_files -/' \\
              '-o[Output format]:format:(json yaml raw table)' \\
              '--output[Output format]:format:(json yaml raw table)' \\
              '-H[Add header]:header:' \\
              '--header[Add header]:header:' \\
              '-q[Add query parameter]:query:' \\
              '--query[Add query parameter]:query:' \\
              '-d[Request body]:data:' \\
              '--data[Request body]:data:' \\
              '-u[Authentication]:auth:' \\
              '--auth[Authentication]:auth:' \\
              '-t[Request timeout]:timeout:' \\
              '--timeout[Request timeout]:timeout:' \\
              '--var-set[Override variable set for this request]:namespace=value:'
          fi
          ;;
        completion)
          _arguments \\
            '--eval[Generate completion script suitable for eval]'
          ;;
        get|post|put|patch|delete|head|options|direct)
          _arguments \\
            '-c[Config file path]:config file:_files' \\
            '--config[Config file path]:config file:_files' \\
            '-H[Add header]:header:' \\
            '--header[Add header]:header:' \\
            '-q[Add query parameter]:query:' \\
            '--query[Add query parameter]:query:' \\
            '-d[Request body]:data:' \\
            '--data[Request body]:data:' \\
            '-u[Authentication]:auth:' \\
            '--auth[Authentication]:auth:' \\
            '-t[Request timeout]:timeout:' \\
            '--timeout[Request timeout]:timeout:' \\
            '-o[Output format]:format:(json yaml raw table)' \\
            '--output[Output format]:format:(json yaml raw table)' \\
            '-v[Verbose output]' \\
            '--verbose[Verbose output]' \\
            '-s[Silent mode]' \\
            '--silent[Silent mode]' \\
            '--no-color[Disable colors]' \\
            '--var-set[Override variable set for this request]:namespace=value:'
          ;;
      esac
      ;;
  esac
}

# Register the completion function
compdef _shc shc
`;
}

/**
 * Generate Fish completion script
 */
function generateFishCompletionScript(): string {
  return `function __shc_collections
  shc --get-collections 2>/dev/null
end

function __shc_requests
  set -l collection $argv[1]
  shc --get-requests $collection 2>/dev/null
end

# Main commands
complete -c shc -f
complete -c shc -n "__fish_use_subcommand" -a "collection" -d "Execute a request from a collection"
complete -c shc -n "__fish_use_subcommand" -a "c" -d "Execute a request from a collection"
complete -c shc -n "__fish_use_subcommand" -a "completion" -d "Generate shell completion script"
complete -c shc -n "__fish_use_subcommand" -a "get" -d "Execute a GET request"
complete -c shc -n "__fish_use_subcommand" -a "post" -d "Execute a POST request"
complete -c shc -n "__fish_use_subcommand" -a "put" -d "Execute a PUT request"
complete -c shc -n "__fish_use_subcommand" -a "patch" -d "Execute a PATCH request"
complete -c shc -n "__fish_use_subcommand" -a "delete" -d "Execute a DELETE request"
complete -c shc -n "__fish_use_subcommand" -a "head" -d "Execute a HEAD request"
complete -c shc -n "__fish_use_subcommand" -a "options" -d "Execute an OPTIONS request"
complete -c shc -n "__fish_use_subcommand" -a "direct" -d "Execute an HTTP request with the specified method"

# Global options
complete -c shc -l help -d "Show help"
complete -c shc -l version -d "Show version"
complete -c shc -l verbose -d "Enable verbose output"
complete -c shc -l silent -d "Disable all output"
complete -c shc -l config -d "Specify config file" -r
complete -c shc -l env -d "Specify environment" -r
complete -c shc -l no-color -d "Disable colors"
complete -c shc -l var-set -d "Override variable set for this request" -r
complete -c shc -s V -l set -d "Set config value" -r
complete -c shc -s o -l output -d "Output format" -a "json yaml raw table"
complete -c shc -l eval -d "Generate completion script suitable for eval"

# HTTP method commands options
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -s H -l header -d "Add header" -r
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -s q -l query -d "Add query parameter" -r
complete -c shc -n "__fish_seen_subcommand_from post put patch direct" -s d -l data -d "Request body" -r
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -s u -l auth -d "Authentication" -r
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -s t -l timeout -d "Request timeout" -r
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -s o -l output -d "Output format" -a "json yaml raw table"
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -s v -l verbose -d "Verbose output"
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -s s -l silent -d "Silent mode"
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -l var-set -d "Override variable set for this request" -r
complete -c shc -n "__fish_seen_subcommand_from get post put patch delete head options direct" -l no-color -d "Disable colors"

# Completion command options
complete -c shc -n "__fish_seen_subcommand_from completion" -l eval -d "Generate completion script suitable for eval"

# Collection command
complete -c shc -n "__fish_seen_subcommand_from collection c" -a "(__shc_collections)" -d "Collection"
complete -c shc -n "__fish_seen_subcommand_from collection c && __fish_is_token_n 3" -a "(__shc_requests (__fish_arg_at 2))" -d "Request"

# Collection options
complete -c shc -n "__fish_seen_subcommand_from collection c" -l collection-dir -d "Specify collection directory" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s o -l output -d "Output format" -a "json yaml raw table"
complete -c shc -n "__fish_seen_subcommand_from collection c" -s H -l header -d "Add header" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s q -l query -d "Add query parameter" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s d -l data -d "Request body" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s u -l auth -d "Authentication" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s t -l timeout -d "Request timeout" -r
`;
}

/**
 * Options for completion
 */
interface CompletionOptions {
  collectionDir?: string;
  config?: string;
  env?: string;
  [key: string]: unknown;
}

/**
 * Get collections for tab completion
 */
export async function getCollectionsForCompletion(
  options: CompletionOptions = {}
): Promise<string[]> {
  try {
    const collectionDir = await getCollectionDir(options);
    return await getCollections(collectionDir, createSilentLogger().logger);
  } catch (error) {
    return [];
  }
}

/**
 * Get requests for tab completion
 */
export async function getRequestsForCompletion(
  collectionName: string,
  options: CompletionOptions = {}
): Promise<string[]> {
  try {
    const collectionDir = await getCollectionDir(options);
    const requests = await getRequests(collectionDir, collectionName, createSilentLogger().logger);
    // Return just the request IDs for completion
    return requests.map((req) => req.id);
  } catch (error) {
    return [];
  }
}
