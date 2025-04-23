# README Maintenance Rule

## Description
This rule ensures that every package in the project maintains a comprehensive and up-to-date README.md file that follows a consistent format and contains all necessary information for users and contributors.

## Rule
1. Every package MUST have a README.md file in its root directory
2. README.md files MUST be updated when:
   - New features are added
   - APIs change
   - Dependencies are modified
   - Scripts are added or modified
   - Project structure changes

3. Required README Sections:
   - Title (package name)
   - Description
   - Installation instructions
   - Usage examples
   - Available commands/APIs
   - Development setup
   - Project structure
   - Dependencies
   - Configuration (if applicable)
   - Contributing guidelines
   - License information

4. Format Requirements:
   - Use proper Markdown syntax
   - Maintain consistent heading hierarchy
   - Include code blocks with appropriate language tags
   - Use lists for better readability
   - Include command examples where relevant

## Implementation
- Check for README.md existence in new packages
- Validate README.md structure and sections
- Prompt for updates when related files change
- Ensure consistent formatting
- Verify installation instructions match package.json
- Keep dependencies section in sync with package.json

## Benefits
- Consistent documentation across packages
- Improved project maintainability
- Better onboarding experience
- Clear usage instructions
- Up-to-date package information

## Examples

✅ Correct README Structure:
```markdown
# Package Name

Brief description of the package.

## Installation

```bash
pnpm add package-name
```

## Usage

Usage examples with code blocks...

## Development

Prerequisites, setup instructions...

## Project Structure

Directory structure with explanations...

## Dependencies

List of main dependencies with purposes...

## License

License information...
```

❌ Incorrect README:
```markdown
# Package

Some code examples without proper sections or structure.
Installation: npm install
```

## README Checklist
- [ ] Package name and description
- [ ] Installation instructions using pnpm
- [ ] Usage examples with code blocks
- [ ] All commands/APIs documented
- [ ] Development setup instructions
- [ ] Project structure documented
- [ ] Dependencies listed with purposes
- [ ] Configuration details (if applicable)
- [ ] Contributing guidelines
- [ ] License information

## Section Requirements

### Title and Description
- Must match package.json name
- Clear, concise description of purpose
- Include any relevant badges

### Installation
- Must use pnpm commands
- Include all installation methods
- List any prerequisites

### Usage
- Include common use cases
- Provide code examples
- Document all options

### Development
- List prerequisites
- Include setup steps
- Document all scripts
- Explain testing process

### Project Structure
- Show directory tree
- Explain key files/directories
- Note configuration files

### Dependencies
- List main dependencies
- Explain purpose of each
- Note any version requirements

## Validation Rules
1. Check package.json exists
2. Verify README.md exists
3. Validate all required sections
4. Check code block syntax
5. Verify pnpm usage
6. Check dependencies match package.json
7. Validate command examples
8. Ensure proper markdown formatting