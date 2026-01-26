# HTTP Client Infrastructure

Production-ready HTTP client with automatic retry logic, timeout handling, and comprehensive error classification.

## Features

- **Automatic Retry**: Exponential backoff (1s, 2s, 4s) for network and server errors
- **Timeout Handling**: AbortController-based request cancellation
- **Request Size Validation**: Warns on large requests (>1MB), errors on excessive (>10MB)
- **Error Classification**: Distinguishes network, server, client, parse, and abort errors
- **Development Logging**: Detailed request/response logging in `__DEV__` mode only
- **Type-Safe**: Full TypeScript support with comprehensive type definitions

## Usage

### Basic Usage

```typescript
import { fetchWithRetry } from '@/lib/http';

// Simple GET request with automatic retry
const response = await fetchWithRetry('https://api.example.com/data');
const data = await response.json();
```

### POST with JSON

```typescript
import { postJSON } from '@/lib/http';

const result = await postJSON('https://api.example.com/create', {
  name: 'Test',
  value: 123,
});

console.log(result);
```

### GET with JSON Response

```typescript
import { getJSON } from '@/lib/http';

interface UserData {
  id: number;
  name: string;
}

const user = await getJSON<UserData>('https://api.example.com/user/123');
```

### Advanced Configuration

```typescript
import { fetchWithRetry } from '@/lib/http';

const response = await fetchWithRetry('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ key: 'value' }),

  // Retry configuration
  maxRetries: 3,          // Default: 3
  baseDelay: 1000,        // Default: 1000ms (1 second)
  timeout: 30000,         // Default: 30000ms (30 seconds)

  // Size validation
  validateSize: true,     // Default: true

  // Custom request ID for tracking
  requestId: 'custom-id',
});
```

## Error Handling

### Comprehensive Error Handling

```typescript
import {
  fetchWithRetry,
  NetworkRequestError,
  isNetworkError,
  isRetryableError,
  getErrorMessage
} from '@/lib/http';

try {
  const response = await fetchWithRetry('https://api.example.com/data');
  const data = await response.json();
} catch (error) {
  if (error instanceof NetworkRequestError) {
    console.log('Error type:', error.type);
    console.log('Status code:', error.statusCode);
    console.log('Details:', error.details);

    // Get user-friendly message
    const message = getErrorMessage(error);
    alert(message); // "Unable to connect. Please check your internet connection."
  }
}
```

### Error Type Classification

```typescript
import { NetworkRequestError, isRetryableError } from '@/lib/http';

try {
  await fetchWithRetry(url);
} catch (error) {
  if (error instanceof NetworkRequestError) {
    switch (error.type) {
      case 'network':
        // Connection failure, DNS error, etc.
        console.log('Network issue - check connection');
        break;
      case 'server':
        // 5xx server errors
        console.log('Server error - try again later');
        break;
      case 'client':
        // 4xx client errors (auth, validation, not found)
        console.log('Request issue - check your input');
        break;
      case 'abort':
        // Request timeout
        console.log('Request timed out');
        break;
      case 'parse':
        // Response parsing failed
        console.log('Invalid response format');
        break;
    }

    // Check if error is retryable
    if (isRetryableError(error)) {
      // Could implement custom retry logic here
    }
  }
}
```

### User-Friendly Error Messages

```typescript
import { getErrorMessage } from '@/lib/http';

try {
  await fetchWithRetry(url);
} catch (error) {
  // Automatically get appropriate message for users
  const userMessage = getErrorMessage(error);

  // Examples of returned messages:
  // - "Unable to connect. Please check your internet connection."
  // - "Server error. Please try again later."
  // - "Authentication required. Please sign in."
  // - "Access denied. You don't have permission to perform this action."
  // - "Resource not found."
  // - "Too many requests. Please wait a moment and try again."
  // - "Request timed out. Please try again."

  showToast(userMessage);
}
```

## Retry Behavior

### What Gets Retried

- ✅ Network errors (connection failures, DNS errors, timeouts)
- ✅ Server errors (5xx status codes)
- ✅ Aborted requests (timeouts)

### What Does NOT Get Retried

- ❌ Client errors (4xx status codes - auth, validation, not found)
- ❌ Parse errors (invalid response format)

### Exponential Backoff

Retries use exponential backoff to reduce load on failing services:

- Attempt 1: Immediate
- Retry 1: 1 second delay
- Retry 2: 2 seconds delay
- Retry 3: 4 seconds delay

```typescript
// Customize backoff timing
await fetchWithRetry(url, {
  maxRetries: 3,
  baseDelay: 2000, // 2s, 4s, 8s delays
});
```

## Request Size Validation

The client automatically validates request sizes to prevent issues:

```typescript
// Warns in development when body > 1 MB
await fetchWithRetry(url, {
  body: largeData, // Logs warning if > 1 MB
});

// Throws error when body > 10 MB
try {
  await fetchWithRetry(url, {
    body: veryLargeData, // Throws NetworkRequestError
  });
} catch (error) {
  // NetworkRequestError with type: 'client'
  // Message: "Request body too large: X MB (max: 10 MB)"
}

// Disable validation if needed
await fetchWithRetry(url, {
  body: largeData,
  validateSize: false,
});
```

## Logging

In development mode (`__DEV__ === true`), the HTTP client automatically logs:

- Request initiation (method, URL, timeout, retries)
- Response status and duration
- Retry attempts with context
- Errors with full details

Logs are automatically disabled in production for performance and security.

## Integration Examples

### With Supabase

```typescript
import { fetchWithRetry, getErrorMessage } from '@/lib/http';
import { supabase } from '@/lib/supabase';

async function uploadDocument(file: File) {
  try {
    // Get signed URL from Supabase
    const { data: { signedUrl } } = await supabase
      .storage
      .from('documents')
      .createSignedUploadUrl(file.name);

    // Upload with retry logic
    await fetchWithRetry(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
      maxRetries: 3,
      timeout: 60000, // 1 minute for large files
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}
```

### With LLM API Calls

```typescript
import { postJSON, isRetryableError } from '@/lib/http';

async function parseDocument(text: string) {
  try {
    const result = await postJSON('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: text }],
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      maxRetries: 3,
      timeout: 60000, // LLM calls can be slow
    });

    return result.choices[0].message.content;
  } catch (error) {
    logger.error('LLM parsing failed', error);
    throw error;
  }
}
```

## Architecture

### Design Principles

1. **Single Responsibility**: Each module has one clear purpose
   - `errors.ts`: Error types and classification
   - `httpClient.ts`: HTTP operations and retry logic
   - `index.ts`: Public API exports

2. **Open/Closed Principle**: Extensible through configuration
   - Retry count, delays, timeouts are all configurable
   - Validation can be disabled when needed

3. **Dependency Inversion**: Depends on abstractions
   - Uses native `fetch` API (can be mocked/replaced)
   - Uses logger interface (can be swapped)

4. **Strategy Pattern**: Pluggable algorithms
   - Exponential backoff for retries
   - Error classification strategy
   - Size validation strategy

### File Structure

```
lib/http/
├── errors.ts         # Error types and classification
├── httpClient.ts     # HTTP client with retry logic
├── index.ts          # Barrel exports
└── README.md         # This file

__tests__/lib/http/
├── errors.test.ts    # 48 tests for error handling
└── httpClient.test.ts # 33 tests for HTTP client
```

## Related Modules

- **Logger** (`@/lib/utils/logger`): Centralized logging used by HTTP client
- **Supabase** (`@/lib/supabase`): Database and storage integration
- **Document Parser** (upcoming): Will use HTTP client for LLM calls

## Migration Guide

### Replacing Direct `fetch` Calls

Before:
```typescript
const response = await fetch(url, { method: 'POST', body });
const data = await response.json();
```

After:
```typescript
const data = await postJSON(url, JSON.parse(body));
```

### Benefits of Migration

- ✅ Automatic retry on transient failures
- ✅ Timeout protection prevents hanging requests
- ✅ Better error messages for users
- ✅ Request size validation
- ✅ Detailed logging in development
- ✅ Type-safe error handling
