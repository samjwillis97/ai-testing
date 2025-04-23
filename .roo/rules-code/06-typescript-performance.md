# TypeScript Performance Best Practices

## Description
This rule establishes best practices for writing performant TypeScript code, focusing on compilation speed, runtime performance, and memory efficiency.

## Rule
When optimizing TypeScript code:

1. MUST use proper type inference
   ```typescript
   // ✅ Good: Let TypeScript infer simple types
   const numbers = [1, 2, 3]; // inferred as number[]
   const user = { name: 'John', age: 30 }; // inferred object type

   // ❌ Bad: Unnecessary type annotations
   const numbers: number[] = [1, 2, 3];
   const user: { name: string; age: number } = { name: 'John', age: 30 };
   ```

2. MUST optimize union types
   ```typescript
   // ✅ Good: Discriminated unions
   type Shape =
     | { kind: 'circle'; radius: number }
     | { kind: 'rectangle'; width: number; height: number };

   // ❌ Bad: Large unions without discriminator
   type Status = 'loading' | 'success' | 'error' | 'idle' | 'paused' | 'cancelled';
   ```

3. MUST use proper compilation settings
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "incremental": true,
       "skipLibCheck": true,
       "isolatedModules": true
     }
   }
   ```

4. MUST optimize type imports
   ```typescript
   // ✅ Good: Import specific types
   import type { User } from './types';

   // ❌ Bad: Import entire modules for types
   import * as Types from './types';
   ```

5. MUST use efficient data structures
   ```typescript
   // ✅ Good: Use Set for unique values
   const uniqueIds = new Set<string>();
   uniqueIds.add(id);

   // ❌ Bad: Array with indexOf
   const ids: string[] = [];
   if (ids.indexOf(id) === -1) {
     ids.push(id);
   }
   ```

6. MUST avoid excessive type computation
   ```typescript
   // ✅ Good: Cache complex types
   type DeepPartial<T> = {
     [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
   };

   // Use the cached type instead of recomputing
   type PartialUser = DeepPartial<User>;

   // ❌ Bad: Recomputing complex types
   function updateUser(user: {
     [P in keyof User]?: User[P] extends object
       ? { [K in keyof User[P]]?: User[P][K] }
       : User[P];
   }) {
     // implementation
   }
   ```

## Benefits
- Faster compilation times
- Better runtime performance
- Reduced memory usage
- Improved development experience
- Better scalability

## Examples

✅ Correct:
```typescript
// Efficient type guards
const isString = (value: unknown): value is string => typeof value === 'string';

// Optimized array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// Efficient object creation
const createUser = (data: Partial<User>): User => ({
  id: generateId(),
  createdAt: new Date(),
  ...data
});

// Using const assertions for literal types
const config = {
  api: 'https://api.example.com',
  timeout: 5000,
  retries: 3
} as const;
```

❌ Incorrect:
```typescript
// Bad: Excessive type checking
function processValue(value: any) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    // ...
  }
}

// Bad: Inefficient data structure
class Cache {
  private items: Array<{ key: string; value: any }> = [];
  
  set(key: string, value: any) {
    const index = this.items.findIndex(item => item.key === key);
    if (index >= 0) {
      this.items[index].value = value;
    } else {
      this.items.push({ key, value });
    }
  }
}

// Bad: Type computation in hot paths
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

function processData(data: DeepReadonly<ComplexType>) { // Expensive type computation
  // ...
}
```

## Additional Guidelines

1. Compilation Optimization:
   - Use project references for large projects
   - Enable incremental compilation
   - Use `skipLibCheck` when appropriate
   - Consider using `isolatedModules`

2. Runtime Performance:
   - Use appropriate data structures
   - Avoid excessive type checking at runtime
   - Optimize array and object operations
   - Use efficient algorithms and data structures

3. Memory Management:
   - Clean up event listeners and subscriptions
   - Use WeakMap/WeakSet when appropriate
   - Avoid memory leaks in closures
   - Be mindful of large object retention