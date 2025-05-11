---
description: 
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

- IMPORTANT: Always update `IMPLEMENTATION_STATUS.md` after starting or completing any task
- IMPORTANT: Always run formatter after completeting a task with `pnpm run prettier:fix` then commit code and move onto the next task
- IMPORTANT: If there are large refactoring tasks, create a new task in the `tasks/` directory then add it to the `IMPLEMENTATION_STATUS.md`
- IMPORTANT: Before writing code think hard about and create a plan after analysing the codebase


### Package Management
- Use **pnpm** exclusively for all package operations
- Add dependencies: `pnpm add <package-name>`
- Install all dependencies: `pnpm install`