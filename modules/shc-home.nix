{
  config, lib, pkgs, ...
}:
with lib; let
  cfg = config.shc;
in
{
  options.shc = {
    package = mkPackageOption pkgs "shc" {};

    enable = mkOption {
      type = types.bool;
      default = false;
      description = "Enable SHC";
    };

    enableZshIntegration = mkOption {
      type = types.bool;
      default = false;
      description = "Enable Zsh integration";
    };
  };

  config = mkIf cfg.enable {
    home.packages = [ cfg.package ];

    # Zsh integration
    programs.zsh.initContent = mkIf cfg.enableZshIntegration ''
      eval "$(${getExe cfg.package} completion zsh)"
    '';
  };
}
