# Coding Guidelines

## Code Style & Patterns

-   Always use TypeScript
-   Use early returns whenever possible to make the code more readable
-   Always use Tailwind for styling HTML elements; avoid using CSS.
-   Prefer composition over inheritance
-   Use descriptive variable and function/const names. Also, event functions should be named with a "handle" prefix, like "handleClick" for onClick.
-   Use consts instead of functions, for example, “const toggle = () =>”. Also, define a type if possible.
-   Always use strict typing to make it as type safe as possible.

## Testing Standards

-   Unit tests required for business logic
-   Unit tests required for public interfaces
-   Integration tests for API endpoints
-   E2E tests for critical user flows
-   Tests that cover existing functionality should never be removed, only added to. The only time they should be removed is if the functionality no longer exists.