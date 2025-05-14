# TypeScript Null and Undefined Handling Best Practices

## Description
This rule establishes best practices for handling null and undefined values in TypeScript, ensuring type safety and preventing null reference errors.

## Rule
When handling null and undefined in TypeScript:

1. MUST use strict null checks
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "strictNullChecks": true
     }
   }
   ```

2. MUST explicitly handle nullable values
   ```typescript
   // ✅ Good
   function getUsername(user: User | null): string {
     if (!user) {
       return 'Guest';
     }
     return user.name;
   }

   // ❌ Bad
   function getUsername(user: User): string {
     return user.name; // Might crash if user is null
   }
   ```

3. MUST use null coalescing and optional chaining
   ```typescript
   // ✅ Good
   const name = user?.name ?? 'Guest';
   const street = address?.street?.line1;

   // ❌ Bad
   const name = user && user.name ? user.name : 'Guest';
   const street = address && address.street && address.street.line1;
   ```

4. MUST use non-null assertion operator sparingly
   ```typescript
   // ❌ Bad: Overuse of non-null assertion
   function processUser(user?: User) {
     console.log(user!.name); // Dangerous!
   }

   // ✅ Good: Proper null checking
   function processUser(user?: User) {
     if (!user) {
       throw new Error('User is required');
     }
     console.log(user.name);
   }
   ```

5. MUST prefer union types with null over optional properties
   ```typescript
   // ✅ Good
   interface User {
     name: string;
     email: string | null;
   }

   // ❌ Bad
   interface User {
     name: string;
     email?: string;
   }
   ```

## Benefits
- Prevents null reference errors
- Makes null handling explicit
- Improves code reliability
- Better type inference
- Clearer intent in the code

## Examples

✅ Correct:
```typescript
// Proper null handling with type guards
function isNonNullUser(user: User | null): user is User {
  return user !== null;
}

const users: (User | null)[] = getUsers();
const activeUsers = users.filter(isNonNullUser);

// Safe property access
interface DeepObject {
  nested?: {
    property?: string;
  };
}

function getNestedValue(obj: DeepObject): string {
  return obj?.nested?.property ?? 'default';
}

// Explicit null handling in async operations
async function fetchUserData(id: string): Promise<User | null> {
  const response = await api.get(`/users/${id}`);
  return response.data || null;
}
```

❌ Incorrect:
```typescript
// Bad: Implicit null handling
function processUser(user: User | null) {
  // Dangerous! Will throw if user is null
  const name = user.name;
}

// Bad: Unnecessary non-null assertions
function updateUser(user?: User) {
  database.update(user!);
}

// Bad: Mixing undefined and null
interface Config {
  apiKey?: string | null; // Confusing! Use either optional or null, not both
}