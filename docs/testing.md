# NodeArch Testing Support

This VS Code extension provides enhanced support for working with NodeArch test cases. It integrates with VS Code's Test Explorer to discover, display, and run your NodeArch test cases.

## Features

- **Test Discovery**: Automatically finds and displays test cases defined with `@Test` and `@Case` decorators
- **Test Hierarchy**: Organizes tests by file and test suite
- **Run Tests**: Execute tests directly from the Test Explorer UI
- **Test Results**: Shows test statuses (passed/failed) with output

## Using the Test Explorer

The Test Explorer view in VS Code shows all your test cases in a tree hierarchy:

- **File Level**: Top level items represent test files
- **Suite Level**: Classes annotated with `@Test()` decorator
- **Test Level**: Individual test cases annotated with `@Case()` decorator

## Writing NodeArch Tests

### Test Suites

Test suites are classes decorated with the `@Test()` decorator:

```typescript
import { BeforeEach, Case, Test } from '@nodearch/mocha';

@Test()
export class UserTest {
  constructor(private userService: UserService) {}
  
  // Test cases go here...
}
```

The extension also supports test classes with multiple decorators:

```typescript
@Test()
@Override(UserRepoMock)
export class UserTest {
  // Test cases go here...
}
```

### Test Cases

Test cases are methods decorated with the `@Case()` decorator:

```typescript
@Test()
export class UserTest {
  // Basic test case - name is derived from method name
  @Case() 
  async getUsers() {
    // Test implementation
  }
  
  // Test case with custom description
  @Case('Get User by existing Id')
  async getUserById() {
    // Test implementation
  }
  
  // Test case with parameters
  @Case('Create new user', { params: { name: 'John' }})
  async createUser({ name }) {
    // Test implementation
  }
  
  // Multiple test cases for the same method
  @Case('Get User by existing Id', { params: { id: 1 }})
  @Case('Get User by non-existing Id', { params: { id: 2 }})
  async getUserById({ id }) {
    // Test implementation
  }
}
```

## Running Tests

You can run tests in several ways:

1. **Run All Tests**: Click the play button at the top of the Test Explorer
2. **Run Test File**: Click the play button next to a file
3. **Run Test Suite**: Click the play button next to a test suite
4. **Run Single Test**: Click the play button next to an individual test case

The extension uses `nodearch test -g "Test Name"` command to run the tests, so it integrates seamlessly with your NodeArch project's test configuration.

## Test Output

Test results are shown in the Test Explorer with status indicators:

- ✓ Green checkmark for passed tests
- ✗ Red X for failed tests

Test output is shown in the Test Output panel, which automatically opens when you run tests.
