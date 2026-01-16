# Fail Hard Policy

> The single most important policy for reliable, maintainable software.

---

## Why Fail Hard?

Silent failures are the root cause of countless production incidents, debugging nightmares, and cascading system failures. The fail-hard policy ensures:

1. **Early Detection** — Problems surface immediately at their source
2. **Clear Diagnostics** — Stack traces point to actual failures
3. **Genuine Solutions** — No band-aids that hide deeper issues
4. **Trust in Tests** — Green tests mean the code actually works

---

## The Core Principle

> **When something goes wrong, make it obvious. Immediately.**

This means:
- Throw exceptions with meaningful context
- Let errors propagate to where they can be properly handled
- Never mask failures with fallback values
- Never modify tests to pass when code is broken

---

## Patterns: Good vs Bad

### Pattern 1: Data Fetching

```typescript
// ❌ BAD: Silent failure with fallback
async function getUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null; // Caller can't tell if user doesn't exist or if there was an error
  }
}

// Usage becomes error-prone:
const user = await getUser(id);
if (!user) {
  // Is this "user not found" or "network error"?
  // We have no idea, and will probably handle it wrong
}
```

```typescript
// ✅ GOOD: Explicit error propagation
async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new UserNotFoundError(id);
    }
    throw new ApiError(`Failed to fetch user: ${response.status}`, {
      status: response.status,
      userId: id
    });
  }
  
  return await response.json();
}

// Usage is clear:
try {
  const user = await getUser(id);
  displayUser(user);
} catch (error) {
  if (error instanceof UserNotFoundError) {
    showNotFound();
  } else {
    showError('Unable to load user');
    reportError(error); // We know something is actually wrong
  }
}
```

### Pattern 2: Configuration Loading

```typescript
// ❌ BAD: Default values hiding missing config
function getConfig(): Config {
  try {
    const raw = fs.readFileSync('config.json', 'utf8');
    return JSON.parse(raw);
  } catch {
    console.warn('Config not found, using defaults');
    return {
      port: 3000,
      database: 'localhost',
      // ... defaults that may not work in production
    };
  }
}
```

```typescript
// ✅ GOOD: Fail if config is required
function getConfig(): Config {
  const configPath = 'config.json';
  
  if (!fs.existsSync(configPath)) {
    throw new ConfigurationError(
      `Required configuration file not found: ${configPath}`
    );
  }
  
  const raw = fs.readFileSync(configPath, 'utf8');
  
  try {
    const config = JSON.parse(raw);
    return validateConfig(config); // Also throws if invalid
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigurationError(
        `Invalid JSON in configuration file: ${error.message}`
      );
    }
    throw error;
  }
}
```

### Pattern 3: Array/Collection Operations

```typescript
// ❌ BAD: Empty array hiding failures
async function getProducts(categoryId: string): Promise<Product[]> {
  try {
    const response = await api.get(`/products?category=${categoryId}`);
    return response.data;
  } catch {
    return []; // "No products" or "system is broken"?
  }
}

// This code silently does nothing when the API is down:
const products = await getProducts('electronics');
products.forEach(p => displayProduct(p)); // Nothing happens, seems fine!
```

```typescript
// ✅ GOOD: Distinguish "empty" from "error"
async function getProducts(categoryId: string): Promise<Product[]> {
  const response = await api.get(`/products?category=${categoryId}`);
  return response.data; // May be empty array, that's valid
  // Errors propagate naturally
}

// Caller knows the difference:
try {
  const products = await getProducts('electronics');
  if (products.length === 0) {
    showEmptyState(); // Intentionally empty
  } else {
    products.forEach(p => displayProduct(p));
  }
} catch (error) {
  showError('Could not load products'); // System problem
}
```

### Pattern 4: Input Validation

```typescript
// ❌ BAD: Silently coercing invalid input
function processAge(input: unknown): number {
  const age = Number(input);
  if (isNaN(age) || age < 0) {
    return 0; // "Fixing" bad input
  }
  return age;
}
```

```typescript
// ✅ GOOD: Reject invalid input immediately
function processAge(input: unknown): number {
  if (typeof input !== 'number' && typeof input !== 'string') {
    throw new ValidationError('Age must be a number or numeric string', {
      received: typeof input
    });
  }
  
  const age = Number(input);
  
  if (isNaN(age)) {
    throw new ValidationError('Age must be a valid number', {
      received: input
    });
  }
  
  if (age < 0 || age > 150) {
    throw new ValidationError('Age must be between 0 and 150', {
      received: age
    });
  }
  
  return age;
}
```

### Pattern 5: Resource Cleanup

```typescript
// ❌ BAD: Swallowing errors during cleanup
async function processFile(path: string): Promise<void> {
  const handle = await fs.open(path, 'r');
  try {
    await doProcessing(handle);
  } catch (error) {
    console.error('Processing failed:', error);
    // Error is swallowed!
  } finally {
    await handle.close();
  }
}
```

```typescript
// ✅ GOOD: Cleanup happens, errors propagate
async function processFile(path: string): Promise<void> {
  const handle = await fs.open(path, 'r');
  try {
    await doProcessing(handle);
  } finally {
    await handle.close(); // Always cleanup
  }
  // Errors from doProcessing propagate naturally
}
```

---

## Testing: Fail Hard Means Tests Fail When They Should

### Pattern 6: Test Assertions

```typescript
// ❌ BAD: Weakening tests to pass
test('should handle user data', () => {
  const result = processUser(invalidData);
  // Original test expected specific behavior, but code changed
  // expect(result.name).toBe('John'); // Commented out because it fails
  expect(result).toBeDefined(); // Weakened to pass
});
```

```typescript
// ✅ GOOD: Tests enforce expected behavior
test('should throw on invalid user data', () => {
  expect(() => processUser(invalidData)).toThrow(ValidationError);
});

test('should return processed user for valid data', () => {
  const result = processUser(validData);
  expect(result.name).toBe('John');
  expect(result.email).toBe('john@example.com');
});
```

### Pattern 7: Error Path Testing

```typescript
// ❌ BAD: Only testing happy path
test('should fetch user', async () => {
  const user = await getUser('123');
  expect(user.id).toBe('123');
});
// No tests for error cases!
```

```typescript
// ✅ GOOD: Test all paths including errors
test('should return user for valid ID', async () => {
  const user = await getUser('123');
  expect(user.id).toBe('123');
});

test('should throw UserNotFoundError for unknown ID', async () => {
  await expect(getUser('unknown')).rejects.toThrow(UserNotFoundError);
});

test('should throw ApiError for server errors', async () => {
  mockServer.error(500);
  await expect(getUser('123')).rejects.toThrow(ApiError);
});
```

---

## Common Excuses (And Why They're Wrong)

### "But the UI will break!"

**Bad reasoning:** "If we throw, the whole page crashes"

**Reality:** You should have error boundaries and proper error handling at the UI layer. Swallowing errors in utilities means you don't know your UI error handling is working.

```typescript
// The solution is proper error boundaries, not silent failures
<ErrorBoundary fallback={<ErrorPage />}>
  <UserProfile /> {/* Can throw, and that's fine */}
</ErrorBoundary>
```

### "But we need graceful degradation!"

**Bad reasoning:** "Users shouldn't see errors"

**Reality:** Graceful degradation means *handling* errors appropriately, not *hiding* them. You can only degrade gracefully if you know something went wrong.

```typescript
// Graceful degradation WITH fail-hard:
try {
  const recommendations = await getRecommendations(userId);
  showRecommendations(recommendations);
} catch (error) {
  // Graceful: show generic content instead
  showGenericContent();
  // But ALSO: we know something is wrong
  reportError(error);
}
```

### "But it's just a minor feature!"

**Bad reasoning:** "This isn't critical, don't need to be strict"

**Reality:** Today's "minor feature" is tomorrow's critical dependency. Silent failures compound. The habit of fail-hard should be universal.

### "But the tests were flaky!"

**Bad reasoning:** "The test sometimes passes, sometimes fails"

**Reality:** Flaky tests are revealing real issues—race conditions, timing dependencies, order-of-execution bugs. Fix the underlying issue, don't delete the test.

---

## How to Retrofit Fail-Hard

When working with code that doesn't follow fail-hard:

### Step 1: Identify Silent Failures

Look for:
- `catch` blocks that only log
- Functions returning `null`, `undefined`, `[]`, `{}` in catch blocks
- `|| defaultValue` patterns
- Commented-out error throws

### Step 2: Add Proper Error Types

```typescript
// Create specific error classes
class UserNotFoundError extends Error {
  constructor(public userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public details: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Step 3: Update Callers

Every place that was checking for `null` or empty results needs to be updated to handle errors explicitly.

### Step 4: Add Tests for Error Cases

For every new error path, add a test that verifies the error is thrown.

---

## Checklist

Before committing any code, verify:

- [ ] No `catch` blocks that only `console.log/error/warn`
- [ ] No `return null/undefined/[]/{}` in catch blocks
- [ ] No `|| defaultValue` hiding potential errors
- [ ] No tests modified to pass when behavior changed
- [ ] No tests deleted because they were "inconvenient"
- [ ] Error cases have explicit tests
- [ ] All errors include meaningful context
- [ ] Callers properly handle (not suppress) errors

---

## Quick Reference

| Situation | ❌ Don't | ✅ Do |
|-----------|---------|------|
| API call fails | `return null` | `throw ApiError` |
| Config missing | Use defaults | `throw ConfigError` |
| Invalid input | Coerce/ignore | `throw ValidationError` |
| Resource not found | Return empty | `throw NotFoundError` |
| Parse fails | Return partial | `throw ParseError` |
| Test fails | Modify assertion | Fix the code |
| Test is flaky | Delete test | Fix race condition |
