# 🛡️ ERROR HANDLING GUIDE

**Purpose:** Comprehensive error handling strategy for all integration points

---

## 1. BaseCrudService Error Handling

### Current Implementation
```typescript
// Location: /src/integrations/cms/service.ts
// Status: Placeholder with console.warn()
```

### Recommended Implementation

```typescript
export const BaseCrudService = {
  async getAll<T>(collectionId: string, refs?: any, options?: any) {
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[BaseCrudService] getAll failed for ${collectionId}:`, error);
      throw new Error(`Failed to fetch collection: ${collectionId}`);
    }
  },

  async getById<T>(collectionId: string, itemId: string, refs?: any) {
    try {
      const response = await fetch(`/api/collections/${collectionId}/${itemId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Item not found
        }
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[BaseCrudService] getById failed:`, error);
      throw error;
    }
  },

  async create<T>(collectionId: string, itemData: T, multiRefs?: any) {
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      
      if (!response.ok) {
        throw new Error(`Create failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[BaseCrudService] create failed:`, error);
      throw error;
    }
  },

  async update<T>(collectionId: string, itemData: Partial<T> & { _id: string }) {
    try {
      const response = await fetch(`/api/collections/${collectionId}/${itemData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[BaseCrudService] update failed:`, error);
      throw error;
    }
  },

  async delete(collectionId: string, itemId: string) {
    try {
      const response = await fetch(`/api/collections/${collectionId}/${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`[BaseCrudService] delete failed:`, error);
      throw error;
    }
  }
};
```

---

## 2. Cart Error Handling

### Current Implementation
```typescript
// Location: /src/integrations/cms/cms-ecom/cart.ts
// Status: Placeholder with console.warn()
```

### Recommended Implementation

```typescript
export const useCart = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const actions = {
    addToCart: async ({ collectionId, itemId, quantity = 1 }) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectionId, itemId, quantity })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to add item: ${response.statusText}`);
        }
        
        const data = await response.json();
        setItems(data.items);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[Cart] Add to cart failed:', message);
      } finally {
        setIsLoading(false);
      }
    },

    removeFromCart: async (item) => {
      try {
        const response = await fetch(`/api/cart/remove/${item.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove item');
        }
        
        const data = await response.json();
        setItems(data.items);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[Cart] Remove from cart failed:', message);
      }
    },

    checkout: async () => {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });
        
        if (!response.ok) {
          throw new Error('Checkout failed');
        }
        
        const data = await response.json();
        // Handle success
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Checkout failed';
        setError(message);
        console.error('[Cart] Checkout failed:', message);
      }
    }
  };

  return {
    items,
    error,
    isLoading,
    actions
  };
};
```

---

## 3. Checkout Error Handling

### Current Implementation
```typescript
// Location: /src/integrations/cms/cms-ecom/ecom-service.ts
// Status: Throws generic error
```

### Recommended Implementation

```typescript
export const buyNow = async (items: Array<{ collectionId: string; itemId: string; quantity: number }>) => {
  try {
    // Validate input
    if (!items || items.length === 0) {
      throw new Error('No items to checkout');
    }

    const response = await fetch('/api/checkout/buy-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Checkout failed: ${response.status}`);
    }

    const { checkoutUrl } = await response.json();
    
    if (!checkoutUrl) {
      throw new Error('No checkout URL returned');
    }

    // Redirect to payment
    window.location.href = checkoutUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    console.error('[Checkout] buyNow failed:', message);
    throw new Error(message);
  }
};
```

---

## 4. API Error Response Format

### Recommended Backend Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid item ID",
    "details": {
      "field": "itemId",
      "reason": "Item not found"
    }
  }
}
```

### Error Codes to Handle

```typescript
const ERROR_CODES = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Custom errors
  COLLECTION_NOT_FOUND: 'COLLECTION_NOT_FOUND',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  CART_ERROR: 'CART_ERROR',
  CHECKOUT_ERROR: 'CHECKOUT_ERROR',
};
```

---

## 5. Global Error Handler

### Recommended Implementation

```typescript
// Location: /src/lib/errorHandler.ts

export class APIError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: unknown): APIError => {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof TypeError) {
    return new APIError(
      'NETWORK_ERROR',
      0,
      'Network request failed. Check your connection.'
    );
  }

  if (error instanceof Error) {
    return new APIError(
      'UNKNOWN_ERROR',
      500,
      error.message
    );
  }

  return new APIError(
    'UNKNOWN_ERROR',
    500,
    'An unknown error occurred'
  );
};

export const logError = (error: APIError, context: string) => {
  console.error(`[${context}] ${error.code}: ${error.message}`, {
    status: error.status,
    details: error.details
  });
};
```

---

## 6. User-Facing Error Messages

### Recommended Approach

```typescript
const getUserFriendlyMessage = (error: APIError): string => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Connection error. Please check your internet connection.';
    case 'NOT_FOUND':
      return 'Item not found.';
    case 'UNAUTHORIZED':
      return 'Please sign in to continue.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'CART_ERROR':
      return 'Failed to update cart. Please try again.';
    case 'CHECKOUT_ERROR':
      return 'Checkout failed. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};
```

---

## 7. Retry Strategy

### Recommended Implementation

```typescript
export const retryFetch = async (
  fn: () => Promise<Response>,
  maxRetries = 3,
  delayMs = 1000
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn();
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      // Retry on server errors (5xx)
      if (response.ok) {
        return response;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
};
```

---

## 8. CORS Error Handling

### Common CORS Issues

```typescript
// Error: "Access to XMLHttpRequest at 'http://api.example.com' from origin 'http://localhost:3000' 
// has been blocked by CORS policy"

// Solution: Backend must include these headers:
// Access-Control-Allow-Origin: http://localhost:3000
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
// Access-Control-Allow-Headers: Content-Type, Authorization
// Access-Control-Allow-Credentials: true
```

---

## 9. Authentication Error Handling

### Recommended Implementation

```typescript
export const handleAuthError = (error: APIError) => {
  if (error.status === 401) {
    // Token expired or invalid
    // Redirect to login
    window.location.href = '/login';
    return;
  }

  if (error.status === 403) {
    // User doesn't have permission
    // Show error message
    return;
  }
};
```

---

## 10. Testing Error Scenarios

### Recommended Test Cases

```typescript
describe('Error Handling', () => {
  test('handles network errors', async () => {
    // Mock fetch to throw error
    // Verify error is caught and handled
  });

  test('handles 404 errors', async () => {
    // Mock fetch to return 404
    // Verify null is returned for getById
  });

  test('handles 500 errors', async () => {
    // Mock fetch to return 500
    // Verify error is thrown
  });

  test('handles validation errors', async () => {
    // Mock fetch to return 400 with validation error
    // Verify error details are accessible
  });

  test('retries on server errors', async () => {
    // Mock fetch to fail twice, then succeed
    // Verify retry logic works
  });
});
```

---

## Summary

| Component | Current Status | Required Action |
|-----------|----------------|-----------------|
| BaseCrudService | Placeholder | Implement error handling |
| useCart | Placeholder | Implement error handling |
| buyNow | Throws error | Implement error handling |
| Global errors | None | Create error handler |
| User messages | None | Create message mapping |
| Retry logic | None | Implement retry strategy |
| CORS | None | Configure backend |
| Auth errors | None | Implement auth error handling |

---

**Next Steps:**
1. Implement all error handling recommendations
2. Test error scenarios thoroughly
3. Add monitoring/logging for production
4. Document error codes for backend team
