# SHC Example Configurations

This directory contains example configurations for demonstrating the SHC (Sam's HTTP Client) capabilities. These configurations are designed to work with public APIs that don't require authentication, making them perfect for testing and demonstration purposes.

## Structure

- `shc.config.yaml`: Main configuration file for SHC
- `collections/`: Directory containing API collections
  - `httpbin.yaml`: Collection for testing HTTP requests using HTTPBin
  - `jsonplaceholder.yaml`: Collection for testing REST API operations using JSONPlaceholder
  - `github.yaml`: Collection for interacting with the GitHub API

## Usage

### CLI

To use these configurations with the SHC CLI:

```bash
# Use the main configuration
pnpm --filter @shc/cli run dev --config /path/to/configs/shc.config.yaml

# Run a request from a collection
pnpm --filter @shc/cli run dev collection httpbin get-request --config /path/to/configs/shc.config.yaml

# Start interactive mode
pnpm --filter @shc/cli run dev interactive --config /path/to/configs/shc.config.yaml
```

### Environment Variables

Some requests may require environment variables for authentication:

```bash
# Set environment variables for authentication
export API_TOKEN="your_token_here"
export API_USERNAME="your_username"
export API_PASSWORD="your_password"
export GITHUB_CLIENT_ID="your_github_client_id"
export GITHUB_CLIENT_SECRET="your_github_client_secret"
```

## Collections

### HTTPBin Collection

The HTTPBin collection demonstrates basic HTTP functionality:

- GET, POST, PUT, DELETE requests
- Query parameters and headers
- JSON request bodies
- Status codes and delays
- Authentication (Basic and Bearer)
- Cookies

### JSONPlaceholder Collection

The JSONPlaceholder collection demonstrates REST API operations:

- Retrieving resources (users, posts, comments, etc.)
- Creating new resources
- Updating existing resources
- Deleting resources
- Filtering and querying

### GitHub Collection

The GitHub collection demonstrates more advanced API interactions:

- User and repository information
- Branches and commits
- Issues and pull requests
- Rate limiting

## Variable Sets

The configurations use variable sets to manage different environments and parameters:

- `api`: Configures the base URL and settings for different APIs
- `auth`: Manages authentication credentials
- `user`: Stores user-related information
- Collection-specific variable sets for specialized parameters

## Customization

Feel free to modify these configurations to suit your needs:

- Add new collections for other APIs
- Customize variable sets with your own values
- Add new requests to existing collections
- Modify authentication settings

## Security Note

These example configurations are designed for demonstration purposes. When using SHC in production:

- Never commit sensitive credentials to version control
- Use environment variables for secrets
- Consider using a secrets manager
- Implement proper access controls
