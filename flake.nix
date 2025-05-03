{
  description = "SHC - HTTP Client Tools";

  inputs = {
    nixpkgs.url = "github:cachix/devenv-nixpkgs/rolling";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }@inputs:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        # Build the SHC CLI package using stdenv
        shc = pkgs.stdenv.mkDerivation {
          pname = "shc";
          version = "0.1.0";
          src = ./.;
          
          buildInputs = with pkgs; [
            nodejs_20
            pnpm
            cacert
          ];
          
          nativeBuildInputs = [ pkgs.makeWrapper ];
          
          # Allow network access during build for pnpm
          __noChroot = true;
          
          buildPhase = ''
            # Set up environment
            export HOME=$(mktemp -d)
            export NODE_EXTRA_CA_CERTS="${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
            export SSL_CERT_FILE="${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
            
            # Disable strict SSL for pnpm to work in restricted Nix build environment
            pnpm config set strict-ssl false
            
            # Install dependencies and build
            pnpm install --frozen-lockfile
            pnpm build
          '';
          
          installPhase = ''
            # Create output directories
            mkdir -p $out/bin
            mkdir -p $out/lib/node_modules
            
            # Copy the entire node_modules directory to include all dependencies
            cp -r node_modules $out/lib/
            
            # Copy the packages to the correct locations
            mkdir -p $out/lib/node_modules/@shc/cli
            mkdir -p $out/lib/node_modules/@shc/core
            
            cp -r packages/cli/dist $out/lib/node_modules/@shc/cli/
            cp -r packages/cli/package.json $out/lib/node_modules/@shc/cli/
            
            cp -r packages/core/dist $out/lib/node_modules/@shc/core/
            cp -r packages/core/package.json $out/lib/node_modules/@shc/core/
            
            # Create executable wrapper
            makeWrapper ${pkgs.nodejs_20}/bin/node $out/bin/shc \
              --add-flags "$out/lib/node_modules/@shc/cli/dist/index.js" \
              --set NODE_PATH "$out/lib/node_modules:$out/lib/node_modules/@shc/cli/node_modules:$out/lib/node_modules/@shc/core/node_modules:$out/lib/node_modules"
          '';
        };

      in {
        packages = {
          default = shc;
          shc = shc;
        };

        apps = {
          default = {
            type = "app";
            program = "${shc}/bin/shc";
          };
        };

        devShells = {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_20
              pnpm
              git
              nodePackages.typescript
              nodePackages.typescript-language-server
              nodePackages.eslint
              nodePackages.prettier
              cacert # Add SSL certificates
            ];

            # Environment variables
            shellHook = ''
              export NODE_ENV="development"
              # Set SSL certificate path for Node.js
              export NODE_EXTRA_CA_CERTS="${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
              export SSL_CERT_FILE="${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
              
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
