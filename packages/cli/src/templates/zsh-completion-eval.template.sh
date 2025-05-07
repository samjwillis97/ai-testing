#compdef shc
# SHC Zsh completion script (eval mode)

_shc() {
  local curcontext="$curcontext" state line
  typeset -A opt_args

  # Define command descriptions
  local -a commands
  {{COMMAND_DESCRIPTIONS}}

  # Define command options
  {{OPTIONS_MAPPING}}

  # Main completion function
  _arguments -C \
    {{GLOBAL_OPTIONS}} \
    "1: :->cmds" \
    "*::arg:->args"

  case $state in
    cmds)
      _describe "command" commands
      ;;
    args)
      local cmd="$words[1]"
      local cmdspec="_shc_${cmd//-/_}"
      
      # Check if we have a handler function for this command
      if (( $+functions[$cmdspec] )); then
        $cmdspec
      else
        _files
      fi
      ;;
  esac
}

# Command handler functions
{{COMMAND_HANDLERS}}

compdef _shc shc
