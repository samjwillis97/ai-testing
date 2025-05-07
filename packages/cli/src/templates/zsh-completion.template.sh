#compdef shc
# SHC Zsh completion script

_shc() {
  local curcontext="$curcontext" state line
  typeset -A opt_args

  # Command descriptions
  local -a commandDescriptions
  {{COMMAND_DESCRIPTIONS}}

  # Command mapping
  typeset -A commandMapping
  {{COMMAND_MAPPING}}

  # Option mapping
  typeset -A optionsMapping
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

{{EVAL_MODE}}

_shc "$@"
