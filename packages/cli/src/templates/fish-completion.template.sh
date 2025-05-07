# SHC Fish completion script

function __shc_commands
  echo "{{COMMAND_LIST}}"
end

function __shc_subcommands
  set -l cmd $argv[1]
  switch $cmd
    {{COMMAND_CASES}}
  end
end

function __shc_options
  set -l cmd $argv[1]
  set -l subcmd $argv[2]
  set -l cmd_context $cmd

  if test -n "$subcmd"
    set cmd_context "$cmd $subcmd"
  end

  switch $cmd_context
    {{OPTION_CASES}}
    case '*'
      echo "--help --version --verbose --config --env --no-color --var-set --set --output"
  end
end

# Main completion function
complete -c shc -f

# Global options
complete -c shc -l help -d "Show help"
complete -c shc -l version -d "Show version"
complete -c shc -l verbose -d "Enable verbose output"
complete -c shc -l config -d "Specify config file"
complete -c shc -l env -d "Specify environment"
complete -c shc -l no-color -d "Disable colored output"
complete -c shc -l var-set -d "Set a variable"
complete -c shc -l set -d "Set a config value"
complete -c shc -l output -d "Specify output format"

# Commands
{{COMMAND_COMPLETIONS}}

# Subcommands
{{SUBCOMMAND_COMPLETIONS}}
