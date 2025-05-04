{
  description = "SHC - HTTP Client Tools";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }@inputs:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        node = pkgs.nodejs_20;
        pnpm = pkgs.pnpm_9;

        # Build the SHC CLI package using stdenv
        shc = pkgs.stdenv.mkDerivation (finalAttrs: rec {
          pname = "shc";
          version = "0.1.0";

          meta = {
            mainProgram = "shc";
          };

          src = ./.;

          nativeBuildInputs = [ 
            node
            pnpm.configHook
          ];

          # pnpmRoot = "cli";
          pnpmWorkspaces = [ "@shc/core" "@shc/cli" ];
          pnpmDeps = pnpm.fetchDeps {
            inherit (finalAttrs) pname version src pnpmWorkspaces;
            # sourceRoot = "${src}/packages/cli";
            hash = "sha256-5+PTF+OmV3GL3MDTMBbzqr4iQ+HRzPC75BArE+TobLc=";
          };

          buildPhase = ''
            runHook preBuild

            # Install dependencies and build
            pnpm --filter=@shc/core build
            pnpm --filter=@shc/cli build

            runHook postBuild
          '';

          installPhase = ''
            mkdir -p $out/bin $out/lib/${pname}
            cp -r packages node_modules $out/lib/${pname}

            # # We need to make a wrapper script because TSC doesn't write
            # # shebangs.
            cat <<EOF > $out/bin/${pname}
            #! ${pkgs.bash}/bin/bash
            exec ${node}/bin/node ${placeholder "out"}/lib/${pname}/packages/cli/dist/index.js "\$@"
            EOF

            chmod +x $out/bin/${pname}
          '';
        });

      in {
        packages = {
          default = shc;
          shc = shc;
        };

        homeManagerModules.shc = ./modules/shc-home.nix;

        apps = {
          default = {
            type = "app";
            program = "${shc}/bin/shc";
          };
        };

        devShells = {
          default = pkgs.mkShell {
            packages = with pkgs; [
              node
              pnpm
              git
              nodePackages.typescript
              nodePackages.typescript-language-server
              nodePackages.eslint
              nodePackages.prettier
            ];

            # Environment variables
            shellHook = ''
              export NODE_ENV="development"
              
              echo "SHC Development Environment"
              echo "Node.js: $(node --version)"
              echo "pnpm: $(pnpm --version)"
              echo ""
              echo "Available commands:"
              echo "  pnpm build      - Build all packages"
              echo "  pnpm test       - Run tests"
              echo "  pnpm lint       - Run linter"
              echo "  pnpm typecheck  - Run type checker"
              echo "  pnpm prettier:fix - Format code"
            '';
          };
        };
      }
    );
}
