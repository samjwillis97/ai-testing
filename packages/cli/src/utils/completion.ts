/**
 * Tab completion utilities
 */
import { getCollections, getRequests } from './collections.js';
import { getCollectionDir } from './config.js';

/**
 * Generate completion script for the specified shell
 */
export function generateCompletionScript(shell: 'bash' | 'zsh' | 'fish'): string {
  switch (shell) {
    case 'bash':
      return generateBashCompletionScript();
    case 'zsh':
      return generateZshCompletionScript();
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
    shc)
      if [[ "$cur" == c* ]]; then
        COMPREPLY=($(compgen -W "collection" -- "$cur"))
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
    COMPREPLY=($(compgen -W "--help --version --verbose --silent --config --env --no-color" -- "$cur"))
    return
  fi

  # Complete subcommands
  COMPREPLY=($(compgen -W "collection interactive" -- "$cur"))
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
    'interactive:Start interactive mode'
    'i:Start interactive mode'
  )

  _arguments -C \\
    '--help[Show help]' \\
    '--version[Show version]' \\
    '--verbose[Enable verbose output]' \\
    '--silent[Disable all output]' \\
    '--config[Specify config file]:config file:_files' \\
    '--env[Specify environment]:environment name:' \\
    '--no-color[Disable colors]' \\
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
              '--save[Save request to collection]' \\
              '--export[Export collection to file]:file:_files' \\
              '--import[Import collection from file]:file:_files' \\
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
              '--timeout[Request timeout]:timeout:'
          fi
          ;;
        interactive|i)
          _arguments \\
            '--collection-dir[Specify collection directory]:directory:_files -/'
          ;;
      esac
      ;;
  esac
}

_shc
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
complete -c shc -n "__fish_use_subcommand" -a "interactive" -d "Start interactive mode"
complete -c shc -n "__fish_use_subcommand" -a "i" -d "Start interactive mode"

# Global options
complete -c shc -l help -d "Show help"
complete -c shc -l version -d "Show version"
complete -c shc -l verbose -d "Enable verbose output"
complete -c shc -l silent -d "Disable all output"
complete -c shc -l config -d "Specify config file" -r
complete -c shc -l env -d "Specify environment" -r
complete -c shc -l no-color -d "Disable colors"

# Collection command
complete -c shc -n "__fish_seen_subcommand_from collection c" -a "(__shc_collections)" -d "Collection"
complete -c shc -n "__fish_seen_subcommand_from collection c && __fish_is_token_n 3" -a "(__shc_requests (__fish_arg_at 2))" -d "Request"

# Collection options
complete -c shc -n "__fish_seen_subcommand_from collection c" -l collection-dir -d "Specify collection directory" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -l save -d "Save request to collection"
complete -c shc -n "__fish_seen_subcommand_from collection c" -l export -d "Export collection to file" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -l import -d "Import collection from file" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s o -l output -d "Output format" -a "json yaml raw table"
complete -c shc -n "__fish_seen_subcommand_from collection c" -s H -l header -d "Add header" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s q -l query -d "Add query parameter" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s d -l data -d "Request body" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s u -l auth -d "Authentication" -r
complete -c shc -n "__fish_seen_subcommand_from collection c" -s t -l timeout -d "Request timeout" -r

# Interactive mode options
complete -c shc -n "__fish_seen_subcommand_from interactive i" -l collection-dir -d "Specify collection directory" -r
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
    return await getCollections(collectionDir);
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
    return await getRequests(collectionDir, collectionName);
  } catch (error) {
    return [];
  }
}
