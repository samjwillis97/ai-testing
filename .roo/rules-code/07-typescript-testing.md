# TypeScript Testing Best Practices

## Description
This rule establishes best practices for testing TypeScript code, ensuring type safety in tests, proper mocking, and maintainable test suites.

## Rule
When writing tests in TypeScript:

1. MUST use typed test frameworks and assertions
   ```typescript
   // ✅ Good
   import { expect } from '@jest/globals';
   
   interface User {
     id: string;
     name: string;
   }

   test('user has correct properties', () => {
     const user: User = { id: '1', name: 'John' };
     expect(user.id).toBe('1');
   });
   ```

2. MUST use proper type assertions in tests
   ```typescript
   // ✅ Good
   test('api response has correct type', async () => {
     const response = await api.getUser('1');
     expect(response).toMatchObject<Partial<User>>({
       id: expect.any(String),
       name: expect.any(String)
     });
   });

   // ❌ Bad
   test('api response has data', async () => {
     const response = await api.getUser('1');
     expect(response.data).toBeTruthy();
   });
   ```

3. MUST type mock functions and spies
   ```typescript
   // ✅ Good
   interface UserService {
     getUser(id: string): Promise<User>;
   }

   const mockUserService: jest.Mocked<UserService> = {
     getUser: jest.fn()
   };

   // ❌ Bad
   const mockUserService = {
     getUser: jest.fn()
   };
   ```

4. MUST use test fixtures with proper types
   ```typescript
   // ✅ Good
   interface TestFixture {
     user: User;
     posts: Post[];
   }

   function createTestFixture(): TestFixture {
     return {
       user: {
         id: '1',
         name: 'Test User'
       },
       posts: [
         { id: '1', title: 'Test Post' }
       ]
     };
   }
   ```

5. MUST type test utilities and helpers
   ```typescript
   // ✅ Good
   async function createTestUser(override: Partial<User> = {}): Promise<User> {
     const defaultUser: User = {
       id: generateId(),
       name: 'Test User',
       email: 'test@example.com'
     };
     return { ...defaultUser, ...override };
   }
   ```

## Benefits
- Type safety in tests
- Better test maintenance
- Clearer test intentions
- Improved debugging
- Better IDE support

## Examples

✅ Correct:
```typescript
// Typed test suite
describe('UserService', () => {
  let userService: UserService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      close: jest.fn()
    };
    userService = new UserService(mockDb);
  });

  it('should create user with correct type', async () => {
    const userData: CreateUserDto = {
      name: 'John',
      email: 'john@example.com'
    };

    mockDb.query.mockResolvedValueOnce({ id: '1', ...userData });

    const result = await userService.createUser(userData);
    
    expect(result).toMatchObject<User>({
      id: expect.any(String),
      name: userData.name,
      email: userData.email
    });
  });
});

// Type-safe test utilities
class TestBuilder<T> {
  private data: Partial<T> = {};

  with<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  build(): T {
    return this.data as T;
  }
}

// Typed test fixtures
const createTestPost = (override: Partial<Post> = {}): Post => ({
  id: '1',
  title: 'Test Post',
  content: 'Test Content',
  authorId: '1',
  createdAt: new Date(),
  ...override
});
```

❌ Incorrect:
```typescript
// Bad: Untyped mocks
const mockService = {
  getData: jest.fn().mockResolvedValue({ data: 'test' })
};

// Bad: Any assertions
test('should process data', () => {
  const result: any = processData(input);
  expect(result.success).toBe(true);
});

// Bad: Implicit any in test helpers
function createTestData(override = {}) {
  return {
    id: '1',
    ...override
  };
}
```

## Additional Guidelines

1. Test Organization:
   - Group tests by feature or module
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Keep tests focused and atomic

2. Mock Types:
   - Use `jest.Mocked<T>` for full mocks
   - Use `Partial<T>` for partial mocks
   - Type mock return values
   - Avoid `any` in mocks

3. Test Utils:
   - Create strongly-typed test factories
   - Use builder pattern for complex objects
   - Share test fixtures through typed helpers
   - Maintain type safety in utilities

4. Assertions:
   - Use type-aware assertions
   - Avoid type assertions in tests
   - Test type errors where appropriate
   - Use custom type matchers when needed