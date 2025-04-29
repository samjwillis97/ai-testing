# Development Guide

## Project Overview
- Review `SPECS.md` and `specs/*` for complete functional specifications

## Development Workflow

### 1. Initial Quality Check

When starting work on any task, the AI assistant should:

1. Run all quality checks from the root
   ```bash
   pnpm run test:coverage
   pnpm run lint
   pnpm run typecheck
   pnpm run prettier:check
   pnpm run build
   ```

### 2. Address Failing Tests First
If any tests are failing:

* Analyze and understand the failing tests
* Fix the failing tests before making any other changes
* Verify fixes by running the tests again

### 3. Fix Linting and Type Errors
After tests pass (or if there are no tests):

* Address any linting errors: `pnpm run lint`
* Fix type checking errors: `pnpm run typecheck`
* Verify all errors are fixed by running the checks again

### 4. Implementation Phase
Only after all quality checks pass:

* Check `IMPLEMENTATION_STATUS.md` to understand current project status
* Implement new features
* New feature should be chosen by highest priority from `IMPLEMENTATION_STATUS.md`
* Write tests for new functionality
* Ensure code quality kept to a high standard

### 5. Final Quality Check
After implementation:

* Run all quality checks again
* Fix any new issues that arise
* Format code: `pnpm run prettier:fix`

### 6. Documentation and Status Update

* Update `IMPLEMENTATION_STATUS.md`
* Document any API changes

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