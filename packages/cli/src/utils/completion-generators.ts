/**
 * Shell completion script generators
 */
import { CommandInfo, OptionInfo } from './command-introspection.js';
import fs from 'fs';
import path from 'path';

/**
 * Generate a Bash completion script based on the command structure
 */
export function generateBashCompletionScript(commands: CommandInfo[]): string {
  // Create a list of all command names for top-level completion
  const commandList = commands
    .filter((cmd) => !cmd.isHidden)
    .map((cmd) => cmd.name)
    .concat(commands.flatMap((cmd) => cmd.aliases || []))
    .join(' ');

  // Create a mapping of command names to their subcommands
  const commandMapping = commands.reduce(
    (acc, cmd) => {
      // Add the main command
      acc[cmd.name] = cmd.subcommands
        .filter((subcmd) => !subcmd.isHidden)
        .map((subcmd) => subcmd.name)
        .concat(cmd.subcommands.flatMap((subcmd) => subcmd.aliases || []))
        .join(' ');

      // Add aliases with the same subcommands
      cmd.aliases?.forEach((alias) => {
        acc[alias] = acc[cmd.name];
      });

      return acc;
    },
    {} as Record<string, string>
  );

  // Create a mapping of command names to their options
  const optionsMapping = commands.reduce(
    (acc, cmd) => {
      // Get all options for this command
      const options = cmd.options
        .filter((opt) => opt.long || opt.short)
        .map((opt) => (opt.long ? `--${opt.long}` : `-${opt.short}`))
        .join(' ');

      // Add the main command
      acc[cmd.name] = options;

      // Add aliases with the same options
      cmd.aliases?.forEach((alias) => {
        acc[alias] = options;
      });

      // Process subcommands
      cmd.subcommands.forEach((subcmd) => {
        const subOptions = subcmd.options
          .filter((opt) => opt.long || opt.short)
          .map((opt) => (opt.long ? `--${opt.long}` : `-${opt.short}`))
          .join(' ');

        acc[`${cmd.name} ${subcmd.name}`] = subOptions;

        // Add aliases with the same options
        subcmd.aliases?.forEach((alias) => {
          acc[`${cmd.name} ${alias}`] = subOptions;
        });
      });

      return acc;
    },
    {} as Record<string, string>
  );

  // Format the command mapping as bash associative array assignments
  const commandMappingBash = Object.entries(commandMapping)
    .map(([cmd, subcommands]) => `  commandMapping["${cmd}"]="${subcommands}"`)
    .join('\n');

  // Format the options mapping as bash associative array assignments
  const optionsMappingBash = Object.entries(optionsMapping)
    .map(([cmd, options]) => `  optionsMapping["${cmd}"]="${options}"`)
    .join('\n');

  // Read the bash completion template
  const templatePath = path.join(new URL('..', import.meta.url).pathname, 'templates', 'bash-completion.template.sh');
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace placeholders with actual values
  template = template.replace('{{COMMAND_MAPPING}}', commandMappingBash);
  template = template.replace('{{OPTIONS_MAPPING}}', optionsMappingBash);
  template = template.replace('{{COMMAND_LIST}}', commandList);
  
  return template;
}

/**
 * Helper function to generate Zsh option strings
 */
function generateZshOptionsString(options: OptionInfo[]): string {
  return options
    .filter((opt) => opt.long || opt.short)
    .map((opt) => {
      const flag = opt.long ? `--${opt.long}` : `-${opt.short}`;
      const desc = opt.description.replace(/'/g, "''");
      return `'${flag}[${desc}]'`;
    })
    .join(' \\\n      ');
}

/**
 * Generate a Zsh completion script based on the command structure
 */
export function generateZshCompletionScript(commands: CommandInfo[], isEvalMode = false): string {
  // Create command descriptions for _describe
  const commandDescriptions = commands
    .filter((cmd) => !cmd.isHidden)
    .map((cmd) => `"${cmd.name}:${cmd.description.replace(/"/g, '\\"')}"`);
  
  // Format as a Zsh array initialization
  const commandDescriptionsStr = `commands=(
    ${commandDescriptions.join(' \
    ')}
  )`;

  // Create global options
  const globalOptions = `'--help[Show help]' \
    '--version[Show version]' \
    '--debug[Enable debug mode]' \
    '--config[Config file path]:config file:_files' \
    '--set[Set a config value]:key=value:' \
    '--output[Output format]:format:(json yaml text)'`;

  // Generate command handler functions
  const commandHandlers = commands
    .map((cmd) => {
      // Get options for this command
      const options = cmd.options
        .filter(opt => opt.long || opt.short)
        .map(opt => {
          const flag = opt.long ? `--${opt.long}` : `-${opt.short}`;
          const desc = opt.description.replace(/"/g, '\\"').replace(/'/g, "''");
          return `'${flag}[${desc}]'`;
        })
        .join(' ');

      // Generate handler function for this command
      let handlerFunction = `# Handler for ${cmd.name} command
_shc_${cmd.name.replace(/-/g, '_')}() {`;

      // Handle subcommands if any
      if (cmd.subcommands.length > 0) {
        const subcommandDescriptions = cmd.subcommands
          .filter(subcmd => !subcmd.isHidden)
          .map(subcmd => `"${subcmd.name}:${subcmd.description.replace(/"/g, '\\"')}"`);

        handlerFunction += `
  local -a subcmds
  subcmds=(
    ${subcommandDescriptions.join(' \
    ')}
  )

  _arguments -C \
    ${options ? options + ' \\' : ''}
    "1: :->subcmds" \
    "*::subcmd:->subcmd-options"

  case $state in
    subcmds)
      _describe "${cmd.name} subcommand" subcmds
      ;;
    subcmd-options)
      local subcmd="$words[1]"
      case $subcmd in`;

        // Add handler for each subcommand
        cmd.subcommands.forEach(subcmd => {
          const subcmdOptions = subcmd.options
            .filter(opt => opt.long || opt.short)
            .map(opt => {
              const flag = opt.long ? `--${opt.long}` : `-${opt.short}`;
              const desc = opt.description.replace(/"/g, '\\"').replace(/'/g, "''");
              return `'${flag}[${desc}]'`;
            })
            .join(' ');

          handlerFunction += `
        ${subcmd.name})
          _arguments ${subcmdOptions}
          ;;`;
        });

        handlerFunction += `
        *)
          _files
          ;;
      esac
      ;;
  esac`;
      } else {
        // Simple command with no subcommands
        handlerFunction += `
  _arguments ${options}`;
      }

      handlerFunction += `
}`;
      return handlerFunction;
    })
    .join('\n\n');

  // Create options mapping for direct access
  const optionsMappingEntries: string[] = [];
  
  // Add main command options
  commands.forEach(cmd => {
    const options = cmd.options
      .filter(opt => opt.long || opt.short)
      .map(opt => {
        const flag = opt.long ? `--${opt.long}` : `-${opt.short}`;
        const desc = opt.description.replace(/"/g, '\\"').replace(/'/g, "''");
        return `'${flag}[${desc}]'`;
      })
      .join(' ');
    
    if (options) {
      optionsMappingEntries.push(`# ${cmd.name} options\n_shc_${cmd.name.replace(/-/g, '_')}_opts="${options}"`);
    }
  });
  
  const optionsMappingStr = optionsMappingEntries.join('\n');

  // Read the appropriate zsh completion template based on eval mode
  const templateFileName = isEvalMode ? 'zsh-completion-eval.template.sh' : 'zsh-completion.template.sh';
  const templatePath = path.join(new URL('..', import.meta.url).pathname, 'templates', templateFileName);
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // Set eval mode for the standard template (not needed for eval-specific template)
  const evalMode = isEvalMode
    ? ''
    : '# If this completion file is loaded as a plugin, compdef will be available\n# If it is directly sourced, we need to explicitly call compdef\nif type compdef &>/dev/null; then\n  compdef _shc shc\nelse\n  autoload -U +X compinit && compinit\n  compdef _shc shc\nfi';
  
  // Replace placeholders with actual values
  template = template.replace('{{COMMAND_DESCRIPTIONS}}', commandDescriptionsStr);
  template = template.replace('{{OPTIONS_MAPPING}}', optionsMappingStr);
  template = template.replace('{{GLOBAL_OPTIONS}}', globalOptions);
  template = template.replace('{{COMMAND_HANDLERS}}', commandHandlers);
  template = template.replace('{{EVAL_MODE}}', evalMode);
  
  return template;
}

/**
 * Generate a Fish completion script based on the command structure
 */
export function generateFishCompletionScript(commands: CommandInfo[]): string {
  // Create a list of all command names for top-level completion
  const commandList = commands
    .filter((cmd) => !cmd.isHidden)
    .map((cmd) => cmd.name)
    .join(' ');

  // Generate command cases for subcommand handling
  const commandCases = commands
    .map((cmd) => {
      if (cmd.subcommands.length === 0) return '';
      
      const subcommands = cmd.subcommands
        .filter((subcmd) => !subcmd.isHidden)
        .map((subcmd) => subcmd.name)
        .join(' ');
      
      return `    case ${cmd.name}\n      echo "${subcommands}"`;  
    })
    .filter(Boolean)
    .join('\n');

  // Generate option cases for command-specific options
  const optionCases = commands
    .map((cmd) => {
      const options = cmd.options
        .filter((opt) => opt.long || opt.short)
        .map((opt) => (opt.long ? `--${opt.long}` : `-${opt.short}`))
        .join(' ');

      // Handle subcommands
      const subcommandCases = cmd.subcommands
        .map((subcmd) => {
          const subOptions = subcmd.options
            .filter((opt) => opt.long || opt.short)
            .map((opt) => (opt.long ? `--${opt.long}` : `-${opt.short}`))
            .join(' ');

          return `    case "${cmd.name} ${subcmd.name}"\n      echo "${subOptions}"`;  
        })
        .join('\n');

      return `    case ${cmd.name}\n      echo "${options}"\n${subcommandCases}`;  
    })
    .join('\n');

  // Generate command completions
  const commandCompletions = commands
    .filter((cmd) => !cmd.isHidden)
    .map((cmd) => {
      const escapedDesc = cmd.description.replace(/"/g, '\\"');
      return `complete -c shc -f -n "__fish_use_subcommand" -a "${cmd.name}" -d "${escapedDesc}"`;
    })
    .join('\n');

  // Generate subcommand completions
  const subcommandCompletions = commands
    .flatMap((cmd) => 
      cmd.subcommands
        .filter((subcmd) => !subcmd.isHidden)
        .map((subcmd) => {
          const escapedDesc = subcmd.description.replace(/"/g, '\\"');
          return `complete -c shc -f -n "__fish_seen_subcommand_from ${cmd.name}" -a "${subcmd.name}" -d "${escapedDesc}"`;
        })
    )
    .join('\n');

  // Read the fish completion template
  const templatePath = path.join(new URL('..', import.meta.url).pathname, 'templates', 'fish-completion.template.sh');
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace placeholders with actual values
  template = template.replace('{{COMMAND_LIST}}', commandList);
  template = template.replace('{{COMMAND_CASES}}', commandCases);
  template = template.replace('{{OPTION_CASES}}', optionCases);
  template = template.replace('{{COMMAND_COMPLETIONS}}', commandCompletions);
  template = template.replace('{{SUBCOMMAND_COMPLETIONS}}', subcommandCompletions);
  
  return template;
}
