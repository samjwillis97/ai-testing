# Configure npm Publishing for SHC Packages

## Goal

Set up npm publishing for the SHC monorepo packages, starting with the core package (`@shc/core`).

## Requirements

- Configure npm scoped packages under the `@shc` namespace
- Ensure all packages have correct metadata for npm registry
- Set up proper build scripts that run before publishing
- Implement version management and release workflow
- Document the publishing process
- Automate publishing using GitHub Actions with Nix flake integration

## Implementation Steps

### Core Package (@shc/core)

1. ✅ Create a comprehensive README.md file
   - Installation instructions
   - Basic usage examples
   - Feature overview
   - License information

2. ✅ Update package.json with npm publishing fields
   - Add `prepublishOnly` script to ensure build runs before publishing
   - Add `publishConfig` with `access: public` for scoped package
   - Add `repository` information
   - Add `files` array to specify what's included in the package

3. ✅ Set up GitHub Actions for automated publishing
   - Create workflow file (.github/workflows/npm-publish.yml)
   - Configure Nix environment using flake.nix
   - Set up CI/CD pipeline with test verification
   - Configure both manual and tag-based triggers
   - Handle publishing access with NPM_TOKEN secret

4. 🔄 Set up release workflow
   - Document version bumping process
   - Consider automated changelog generation
   - Decide on versioning strategy (semver)

### Additional Packages

Once @shc/core is successfully published, apply similar configuration to other packages:

- [ ] @shc/cli
- [ ] @shc/logging (plugin)
- [ ] @shc/rate-limit (plugin)
- [ ] @shc/oauth2 (plugin)
- [ ] @shc/cache (plugin)

### Testing Procedure

1. ✅ Verify package builds cleanly with `npm run build`
2. 🔄 Run a test publish with GitHub Actions in dry-run mode
3. 🔄 Test installation from local package with `npm install ./shc-core-0.1.0.tgz`
4. 🔄 Verify the package works as expected when installed

### Publishing Steps

#### Manual Publishing (Local Development)

```bash
# Log in to npm
npm login

# Build and publish the package
cd packages/core
npm publish

# Verify the package is available
npm view @shc/core
```

#### Automated Publishing (Recommended)

1. Create a semantic version tag for the release:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. The GitHub Actions workflow will automatically:
   - Build the package in the Nix environment
   - Run tests to verify package integrity
   - Publish to npm with the version from the tag

3. Alternatively, trigger a manual publish from the GitHub Actions tab:
   - Select the "NPM Publish" workflow
   - Choose the package to publish
   - Optionally enable dry-run mode for testing

#### Required GitHub Secrets

For the GitHub Actions workflow to function, you need to add an NPM_TOKEN secret:

1. Generate an npm access token with publish permissions
2. Add this token to your repository secrets as `NPM_TOKEN`

## Resources

- [npm Publishing Docs](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [npm scoped packages](https://docs.npmjs.com/cli/v8/using-npm/scope)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Nix Flakes with GitHub Actions](https://determinate.systems/posts/nix-github-actions)