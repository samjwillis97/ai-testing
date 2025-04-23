# TypeScript Type Safety Best Practices

## Description
This rule enforces strict type safety practices in TypeScript code to prevent runtime errors and improve code maintainability.

## Rule
When writing TypeScript code:

1. MUST enable strict mode in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true
     }
   }
   ```

2. MUST avoid using `any` type unless absolutely necessary
   - Use `unknown` instead of `any` for values of unknown type
   - Document why `any` is needed if used

3. MUST explicitly define return types for functions
   ```typescript
   // ✅ Good
   function calculateTotal(items: Item[]): number {
     return items.reduce((sum, item) => sum + item.price, 0);
   }

   // ❌ Bad
   function calculateTotal(items: Item[]) {
     return items.reduce((sum, item) => sum + item.price, 0);
   }
   ```

4. MUST use type assertions sparingly
   - Only use type assertions when you know more about the type than TypeScript
   - Prefer type guards over type assertions

5. MUST enable these strict flags in `tsconfig.json`:
   - `noImplicitAny`
   - `noImplicitThis`
   - `strictNullChecks`
   - `strictFunctionTypes`
   - `strictPropertyInitialization`

6. MUST use literal types and const assertions appropriately
   ```typescript
   // ✅ Good: Using const assertion for object literals
   const config = {
     environment: 'production',
     features: ['auth', 'api'] as const,
     limits: {
       maxUsers: 1000,
       maxRequests: 5000
     }
   } as const;

   // Type is readonly and exact
   type Config = typeof config;

   // ❌ Bad: Not using const assertion
   const config = {
     environment: 'production', // type is string, not "production"
     features: ['auth', 'api'] // type is string[], not readonly ["auth", "api"]
   };
   ```

7. MUST use the satisfies operator for type validation
   ```typescript
   // ✅ Good: Using satisfies to validate object shape
   const theme = {
     primary: '#007AFF',
     secondary: '#5856D6',
     success: '#34C759'
   } satisfies Record<string, string>;

   // Still maintains literal types
   theme.primary; // type is "#007AFF"

   // ❌ Bad: Using type assertion
   const theme = {
     primary: '#007AFF',
     secondary: '#5856D6',
     success: '#34C759'
   } as Record<string, string>;

   theme.primary; // type is string
   ```

8. MUST use template literal types for string patterns
   ```typescript
   // ✅ Good: Using template literal types
   type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
   type Path = `/${string}`;
   type Endpoint = `${HttpMethod} ${Path}`;

   // Type-safe endpoint
   const endpoint: Endpoint = 'GET /users';

   // ❌ Bad: Using plain string
   type Endpoint = string;
   ```

## Benefits
- Catches type-related bugs at compile time
- Improves code maintainability
- Enhances IDE support and tooling
- Makes refactoring safer
- Provides better documentation through types
- Ensures type-level constraints

## Examples

✅ Correct:
```typescript
// Using template literal types with generics
type PropEventType<T extends string> = `on${Capitalize<T>}`;
type ButtonEvent = PropEventType<'click' | 'hover'>; // 'onClick' | 'onHover'

// Using satisfies with complex objects
const api = {
  users: {
    get: (id: string) => Promise.resolve({ id, name: 'John' }),
    create: (data: { name: string }) => Promise.resolve({ id: '1', ...data })
  },
  posts: {
    get: (id: string) => Promise.resolve({ id, title: 'Post' }),
    create: (data: { title: string }) => Promise.resolve({ id: '1', ...data })
  }
} satisfies Record<string, Record<string, (...args: any[]) => Promise<any>>>;

// Using const assertions with arrays
const VALID_STATUSES = ['active', 'inactive', 'pending'] as const;
type Status = typeof VALID_STATUSES[number]; // 'active' | 'inactive' | 'pending'
```

❌ Incorrect:
```typescript
// Not using template literal types
type EventHandler = string;

// Not using satisfies operator
const theme = {
  primary: '#007AFF',
  secondary: '#5856D6'
} as const;

// Not using const assertions
const VALID_ROLES = ['admin', 'user', 'guest'];
type Role = typeof VALID_ROLES[number]; // string[]

// Using type assertion instead of satisfies
const config = {
  api: 'https://api.example.com',
  timeout: 5000
} as Config;
```

## Additional Guidelines

1. Literal Types:
   - Use literal types for finite sets of values
   - Combine literal types with unions for type-safe enums
   - Use const assertions to preserve literal types

2. Template Literal Types:
   - Use for URL patterns
   - Use for event handler names
   - Use for consistent string formatting
   - Combine with generics for flexible patterns

3. Satisfies Operator:
   - Use to validate object shapes
   - Preserve literal types while ensuring structure
   - Use instead of type assertions when possible
   - Validate configuration objects

4. Type Inference:
   - Let TypeScript infer types when obvious
   - Use explicit types for public APIs
   - Use type inference with const assertions
   - Balance inference with readability

✅ Correct:
```typescript
interface User {
  id: number;
  name: string;
  email: string | null;
}

function getUserEmail(user: User): string | null {
  return user.email;
}

// Using type guards
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

❌ Incorrect:
```typescript
// Using any
function processData(data: any) {
  return data.someProperty;
}

// Missing return type
function calculateAge(birthYear) {
  return new Date().getFullYear() - birthYear;
}

// Unsafe type assertion
const userInput = someValue as string;