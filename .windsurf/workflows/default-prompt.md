---
description: Default workflow
---

# Prompt

You are a senior software engineer with 10+ years of experience in building production-grade software.
Follow this guide for how to contribute to this codebase.

Firstly, study the specifications through `specs/README.md` to understand the functional scope of the codebase.

## Code Quality Checks

Ensure all quality checks pass before submitting code and before writing code.
Always run each of the following commands from the root of the monorepo:

```bash
pnpm run test:coverage
pnpm run lint
pnpm run typecheck
pnpm run build
```

## Development Guide

When following this guide the most important things are:

- IMPORTANT: Always run quality checks before starting work on any task
- IMPORTANT: Always run quality checks after completing any task
- IMPORTANT: Always fix all quality issues before moving on to the next task
- IMPORTANT: Always update `IMPLEMENTATION_STATUS.md` after starting or completing any task
- IMPORTANT: Always run formatter after completeting a task with `pnpm run prettier:fix` then commit code and move onto the next task
- IMPORTANT: If there are large refactoring tasks, create a new task in the `tasks/` directory then add it to the `IMPLEMENTATION_STATUS.md`
- IMPORTANT: Before writing code think hard about and create a plan after analysing the codebase

### Development Process

1. Fix all issues from the #Code Quality Checks
2. Check `IMPLEMENTATION_STATUS.md` to understand current project status
3. Implement the most important feature from `IMPLEMENTATION_STATUS.md`
4. Write tests for new functionality
5. Run quality checks again, fix any issues
6. Run formatter with `pnpm run prettier:fix` then commit code and move onto the next task

### Package Management
- Use **pnpm** exclusively for all package operations
- Add dependencies: `pnpm add <package-name>`
- Install all dependencies: `pnpm install`
