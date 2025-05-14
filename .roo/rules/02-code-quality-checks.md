# Code Quality Checks Rule

## Description
This rule ensures that after making meaningful changes to the codebase, all necessary code quality checks are performed including building the project, running linters, and executing tests to maintain code quality and prevent regressions.

## Rule
1. After meaningful code changes:
   - The project MUST be built
   - All linters MUST be run
   - All tests MUST be executed
   - All checks MUST pass before committing

2. Meaningful changes include:
   - Adding new features
   - Modifying existing functionality
   - Refactoring code
   - Updating dependencies
   - Changing configuration
   - Modifying test files

3. Quality Check Order:
   1. Build the project
   2. Run linters
   3. Execute tests
   4. Report any failures

4. Error Handling:
   - All failures MUST be addressed before proceeding
   - Build errors must be fixed immediately
   - Linter warnings should be reviewed and addressed
   - Test failures must be investigated and resolved

## Implementation
- Track meaningful code changes
- Automatically trigger quality checks
- Report results clearly
- Block commits if checks fail
- Provide error details for failures

## Benefits
- Maintains code quality
- Prevents regressions
- Ensures consistent style
- Catches issues early
- Maintains test coverage
- Prevents broken builds

## Examples

✅ Correct Quality Check Workflow:
```bash
# After making changes
pnpm run build
pnpm run lint
pnpm run test

# If all checks pass, proceed with commit
git add .
git commit -m "feat: add new feature"
```

❌ Incorrect Workflow:
```bash
# Don't skip quality checks
git add .
git commit -m "quick fix"
```

## Quality Check Commands

### Build
```bash
# Full build
pnpm run build

# Watch mode for development
pnpm run build:watch
```

### Lint
```bash
# Run all linters
pnpm run lint

# Fix auto-fixable issues
pnpm run lint:fix

# Run specific linter
pnpm run lint:ts     # TypeScript
pnpm run lint:style  # Style/CSS
pnpm run lint:test   # Test files
```

### Test
```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run specific test suite
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
```

## Quality Check Results

### Build Results
✅ Success:
```
Build completed successfully
Output: dist/
```

❌ Failure:
```
Build failed:
- TypeScript error in src/component.ts(10,5)
- Cannot find module './utils'
```

### Lint Results
✅ Success:
```
No linting errors found
Files checked: 100
```

❌ Failure:
```
src/component.ts
  10:5  error  Missing return type  @typescript-eslint/explicit-function-return-type
  15:10 error  Unused variable      @typescript-eslint/no-unused-vars
```

### Test Results
✅ Success:
```
Test Suites: 10 passed, 10 total
Tests:       50 passed, 50 total
Time:        3.45s
```

❌ Failure:
```
● Component › should render correctly
    expect(received).toBe(expected)
    Expected: true
    Received: false
```

## Validation Rules
1. No commits with failing builds
2. No commits with linter errors
3. No commits with failing tests
4. All new code must have tests
5. Maintain or improve coverage
6. Address all warnings

## Script Requirements
1. Build script must exist in package.json
2. Lint script must exist in package.json
3. Test script must exist in package.json
4. Scripts should be properly configured
5. Scripts should provide clear output

## Error Resolution
1. Build Errors:
   - Check compilation errors
   - Verify imports/exports
   - Check dependency versions
   - Verify config files

2. Lint Errors:
   - Apply auto-fixes when safe
   - Review style violations
   - Update config if needed
   - Document exceptions

3. Test Failures:
   - Review test output
   - Check test environment
   - Verify test data
   - Update snapshots if needed