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
      _describe "command" commandDescriptions
      ;;
    args)
      case $line[1] in
        {{COMMAND_CASES}}
        *)
          _files
          ;;
      esac
      ;;
  esac
}

{{EVAL_MODE}}

_shc "$@"
