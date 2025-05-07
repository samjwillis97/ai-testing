#!/usr/bin/env bash
# SHC Bash completion script

_shc_completion() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local prev="${COMP_WORDS[COMP_CWORD-1]}"
  local cword=$COMP_CWORD

  # Command mappings
  declare -A commandMapping
  {{COMMAND_MAPPING}}

  # Option mappings
  declare -A optionsMapping
  {{OPTIONS_MAPPING}}

  # Complete command options
  if [[ "$cur" == -* ]]; then
    # Get options for the current command context
    local options=""
    local cmd_context=""
    
    if [[ $cword -gt 1 ]]; then
      cmd_context="${COMP_WORDS[1]}"
      
      # Check if we have a subcommand
      if [[ $cword -gt 2 && "${COMP_WORDS[2]}" != -* ]]; then
        cmd_context="${COMP_WORDS[1]} ${COMP_WORDS[2]}"
      fi
      
      options="${optionsMapping[$cmd_context]:-}"
    fi
    
    # If no specific options found, use global options
    if [[ -z "$options" ]]; then
      options="--help --version --verbose --config --env --no-color --var-set --set --output"
    fi
    
    COMPREPLY=($(compgen -W "$options" -- "$cur"))
    return
  fi

  # Complete subcommands if a command is already typed
  if [[ $cword -eq 2 && -n "${COMP_WORDS[1]}" ]]; then
    local subcommands="${commandMapping[${COMP_WORDS[1]}]:-}"
    if [[ -n "$subcommands" ]]; then
      COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
      return
    fi
  fi

  # Complete top-level commands
  COMPREPLY=($(compgen -W "{{COMMAND_LIST}}" -- "$cur"))
  return
}

complete -F _shc_completion shc
