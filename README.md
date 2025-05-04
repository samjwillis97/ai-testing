# Project Overview

## Core Components

### HTTP Client

The project includes a powerful, extensible HTTP client with a plugin system:

- Flexible request handling
- Plugin-based architecture
- TypeScript support
- Performance tracking

#### Plugin System Highlights

- **Pre-Request Hooks**: Modify request configurations
- **Post-Request Hooks**: Transform responses
- **Error Handling Hooks**: Centralized error management

```typescript
const authPlugin: HttpClientPlugin = {
  onPreRequest: (config) => {
    const token = getAuthToken();
    config.headers['Authorization'] = `Bearer ${token}`;
  },
};

const client = new HttpClient('https://api.example.com');
client.registerPlugin(authPlugin);
```

For detailed documentation, see [Core HTTP Client Specification](/specs/core-http-client.md)

## Project Structure

- `/packages/core`: Core utilities and HTTP client
- `/packages/auth`: Authentication services
- `/packages/cli`: Command-line interface
- `/specs`: Project specifications and documentation

## Getting Started

### Installation

```bash
npm install @samjwillis97/core
```

### Basic Usage

```typescript
import HttpClient from '@samjwillis97/core';

const client = new HttpClient('https://api.example.com');

// Simple GET request
const response = await client.get<User>('/users');
```

## Plugin System

The HTTP client supports a powerful plugin system with three main hooks:

### Pre-Request Plugin

Modify request configuration before sending:

```typescript
const loggingPlugin: HttpClientPlugin = {
  onPreRequest: (config) => {
    console.log('Sending request', config.url);
    config.headers['X-Request-ID'] = generateRequestId();
  },
};
```

### Post-Request Plugin

Transform or log responses:

```typescript
const transformPlugin: HttpClientPlugin = {
  onPostRequest: (response) => {
    return {
      ...response,
      data: camelCaseKeys(response.data),
    };
  },
};
```

### Error Handling Plugin

Centralize error management:

```typescript
const errorPlugin: HttpClientPlugin = {
  onError: (error) => {
    if (error.response?.status === 401) {
      refreshToken();
    }
    logErrorToMonitoringService(error);
  },
};
```

## Nix Integration

SHC provides comprehensive Nix integration through a flake-based approach, allowing for reproducible builds, development environments, and easy installation.

### Development Environment

The project includes a Nix development shell with all necessary dependencies pre-configured:

```bash
# Clone the repository
git clone https://github.com/samjwillis97/ai-testing.git
cd ai-testing

# Enter the development environment
nix develop

# Build the project
pnpm build

# Run tests
pnpm test
```

### Installing SHC with Nix

#### Direct Installation

You can install SHC directly using the Nix package manager:

```bash
# Install from GitHub
nix profile install github:samjwillis97/ai-testing

# Or from a local checkout
nix profile install .
```

#### Using in a Nix Configuration

Add SHC to your system configuration:

```nix
{
  inputs.shc.url = "github:samjwillis97/ai-testing";
  
  outputs = { self, nixpkgs, shc, ... }: {
    nixosConfigurations.mySystem = nixpkgs.lib.nixosSystem {
      # ...
      modules = [
        ({ pkgs, ... }: {
          environment.systemPackages = [
            shc.packages.${pkgs.system}.default
          ];
        })
      ];
    };
  };
}
```

### Home Manager Integration

SHC provides a Home Manager module for easy integration into your user environment:

```nix
{
  inputs.shc.url = "github:samjwillis97/ai-testing";
  
  outputs = { self, nixpkgs, home-manager, shc, ... }: {
    homeConfigurations.myUser = home-manager.lib.homeManagerConfiguration {
      # ...
      modules = [
        shc.homeManagerModules.default
        {
          shc = {
            enable = true;
            enableZshIntegration = true;  # Optional: enables shell completion for Zsh
          };
        }
      ];
    };
  };
}
```

### Building from Source with Nix

The flake provides multiple ways to build and use SHC:

```bash
# Build the default package
nix build .

# Run without installing
nix run .

# Enter a development shell
nix develop
```

### Flake Structure

The project's Nix integration consists of:

- `flake.nix`: Main flake file defining packages, apps, and development shells
- `modules/shc-home.nix`: Home Manager module for user environment integration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
