# TypeScript Function and Method Design Best Practices

## Description
This rule establishes best practices for designing functions and methods in TypeScript, focusing on readability, maintainability, and type safety.

## Rule
When writing functions and methods in TypeScript:

1. MUST follow Single Responsibility Principle
   - Each function should do one thing and do it well
   - Break complex functions into smaller, focused functions

2. MUST use proper parameter typing
   ```typescript
   // ✅ Good
   function updateUser(id: number, data: Partial<User>): Promise<User> {
     // implementation
   }

   // ❌ Bad
   function updateUser(id, data) {
     // implementation
   }
   ```

3. MUST use function overloads for complex type relationships
   ```typescript
   // ✅ Good
   function createElement(tag: 'a'): HTMLAnchorElement;
   function createElement(tag: 'div'): HTMLDivElement;
   function createElement(tag: string): HTMLElement {
     return document.createElement(tag);
   }
   ```

4. MUST use proper async/await patterns
   - Always return Promise<T> for async functions
   - Handle errors appropriately in async functions
   - Avoid mixing Promise chains with async/await

5. MUST use parameter destructuring for objects
   ```typescript
   // ✅ Good
   function createUser({ name, email, age }: UserCreateParams): User {
     // implementation
   }

   // ❌ Bad
   function createUser(params: UserCreateParams): User {
     const name = params.name;
     const email = params.email;
     // implementation
   }
   ```

6. MUST use function composition with proper typing
   ```typescript
   // ✅ Good
   type Transformer<T, U> = (input: T) => U;

   function compose<A, B, C>(
     f: Transformer<B, C>,
     g: Transformer<A, B>
   ): Transformer<A, C> {
     return (x: A) => f(g(x));
   }

   // Usage
   const toString = (x: number): string => x.toString();
   const toUpperCase = (x: string): string => x.toUpperCase();
   const numberToUpperCase = compose(toUpperCase, toString);
   ```

7. MUST implement currying with proper type inference
   ```typescript
   // ✅ Good
   function curry<A, B, C>(
     f: (a: A, b: B) => C
   ): (a: A) => (b: B) => C {
     return (a: A) => (b: B) => f(a, b);
   }

   // Usage
   const add = (a: number, b: number) => a + b;
   const curriedAdd = curry(add);
   const add5 = curriedAdd(5); // Type: (b: number) => number
   ```

8. MUST use generic constraints effectively
   ```typescript
   // ✅ Good
   interface HasId {
     id: string | number;
   }

   function findById<T extends HasId>(
     items: T[],
     id: T['id']
   ): T | undefined {
     return items.find(item => item.id === id);
   }

   // ❌ Bad
   function findById<T>(items: T[], id: any): T | undefined {
     return items.find(item => (item as any).id === id);
   }
   ```

## Benefits
- Improved code readability
- Better type inference
- Reduced bugs through type safety
- Easier maintenance
- Better IDE support
- Clearer function contracts
- Enhanced composability
- Type-safe functional programming

## Examples

✅ Correct:
```typescript
// Function composition with generics
type Pipeline<T> = {
  pipe<U>(fn: (value: T) => U): Pipeline<U>;
  value(): T;
};

function createPipeline<T>(initialValue: T): Pipeline<T> {
  return {
    pipe<U>(fn: (value: T) => U): Pipeline<U> {
      return createPipeline(fn(initialValue));
    },
    value: () => initialValue,
  };
}

// Usage
const result = createPipeline(5)
  .pipe(n => n * 2)
  .pipe(n => n.toString())
  .pipe(s => s.toUpperCase())
  .value(); // "10"

// Curried function with type inference
function curry3<A, B, C, D>(
  f: (a: A, b: B, c: C) => D
): (a: A) => (b: B) => (c: C) => D {
  return a => b => c => f(a, b, c);
}

const curriedFetch = curry3((url: string, method: string, body: object) =>
  fetch(url, { method, body: JSON.stringify(body) })
);

const apiPost = curriedFetch('https://api.example.com')('POST');
// Type: (body: object) => Promise<Response>

// Generic constraints with multiple bounds
interface Lengthwise {
  length: number;
}

interface Printable {
  toString(): string;
}

function logWithLength<T extends Lengthwise & Printable>(value: T): void {
  console.log(`${value.toString()} - Length: ${value.length}`);
}
```

❌ Incorrect:
```typescript
// Bad: No type safety in composition
const compose = (...fns: any[]) => (x: any) =>
  fns.reduceRight((y, f) => f(y), x);

// Bad: Manual currying without types
const curry = (fn: any) => (...args: any[]) =>
  args.length >= fn.length
    ? fn(...args)
    : curry(fn.bind(null, ...args));

// Bad: Generic constraints too loose
function processItems<T>(items: T[]): T[] {
  return items.filter(item => (item as any).isValid);
}
```

## Additional Guidelines

1. Function Composition:
   - Use proper generic types for composed functions
   - Maintain type safety throughout the composition chain
   - Consider using a pipe operator for readability
   - Use composition for reusable transformations

2. Currying:
   - Maintain type inference in curried functions
   - Use proper generic constraints
   - Consider performance implications
   - Document curried function usage

3. Generic Constraints:
   - Use multiple constraints when needed
   - Prefer interface constraints over type constraints
   - Use conditional types with constraints
   - Document constraint requirements

4. Type Inference:
   - Let TypeScript infer return types when possible
   - Use explicit return types for public APIs
   - Use type parameters to improve inference
   - Test type inference with different inputs