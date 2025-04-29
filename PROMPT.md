# Development Guide

## Project Overview
- Review `SPECS.md` and `specs/*` for complete functional specifications
- Check `IMPLEMENTATION_STATUS.md` to understand current project status

## Development Workflow

### 1. Understand Requirements
- Study the specifications thoroughly before making changes
- Identify the highest priority unimplemented features from `IMPLEMENTATION_STATUS.md`

### 2. Development Process
- Implement features according to specifications
- Follow TypeScript best practices:
  - Maintain proper typing for all functions and parameters
  - Follow Single Responsibility Principle
  - Use async/await patterns appropriately
  - Implement proper error handling

### 3. Quality Assurance
Run the following commands to ensure code quality:
```bash
pnpm run test:coverage  # Run tests with coverage reports
pnpm run lint           # Run ESLint for code linting
pnpm run typecheck      # Run TypeScript type checking
pnpm run prettier:fix   # Format code with Prettier
pnpm run build          # Build the project
```

**IMPORTANT**: Fix any failing tests, lint errors, or type errors before proceeding with further development.

### 4. Documentation
- Update `IMPLEMENTATION_STATUS.md` after each feature implementation
- Document any API changes or new functionality

### 5. Version Control
- After completing changes:
  1. Run the formatter: `pnpm run prettier:fix`
  2. Create a commit following conventional commit format:
     - Use appropriate type (feat, fix, docs, etc.)
     - Include clear description of changes
     - Reference related specifications

## Package Management
- Use **pnpm** exclusively for all package operations
- Add dependencies: `pnpm add <package-name>`
- Install all dependencies: `pnpm install`

## Quality Standards
- Ensure all quality checks pass before submitting code
- Follow the quality check order:
  1. Build
  2. Lint
  3. Type check
  4. Test
  5. Format

Remember to implement the highest priority features first and maintain specification compliance throughout development.