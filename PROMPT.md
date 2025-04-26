Study SPECS.md and specs/* for functional specifications.
Implement what is not implemented

Study IMPLEMENTATION_STATUS.md and implement the most important piece (ensure tests are authored) if it has not been implemented.

After each change run `pnpm run test:coverage` resolve any errors, run `pnpm run lint` and `pnpm run typecheck` fix any issues, and build with `pnpm run build`. Once completed update the IMPLEMENTATION_STATUS.md file, run `pnpm run prettier:fix` and create a commit.