# 🔐 CORS & AUTHENTICATION GUIDE

**Purpose:** Configure CORS and authentication for secure API communication

---

## 1. CORS Configuration

### What is CORS?

CORS (Cross-Origin Resource Sharing) allows your frontend to communicate with your backend API when they're on different domains.

### Frontend Domain
```
http://localhost:3000  (development)
https://yourdomain.com (production)
```

### Backend Domain
```
http://localhost:5000  (development)
https://api.yourdomain.com (production)
```

### Backend CORS Headers Required

Your backend must return these headers for **every** API response:

```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Node.js/Express Example

```typescript
import cors from 'cors';
import express from 'express';

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Your routes
app.get('/api/collections/:collectionId', (req, res) => {
  // Your logic
});
```

### Python/Flask Example

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

cors_config = {
    "origins": [os.getenv('FRONTEND_URL', 'http://localhost:3000')],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
    "supports_credentials": True,
    "max_age": 86400
}

CORS(app, resources={r"/api/*": cors_config})

@app.route('/api/collections/<collection_id>', methods=['GET'])
def get_collection(collection_id):
    # Your logic
    pass
```

### Java/Spring Boot Example

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(System.getenv("FRONTEND_URL") != null ? 
                System.getenv("FRONTEND_URL") : "http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("Content-Type", "Authorization", "X-Requested-With")
            .allowCredentials(true)
            .maxAge(86400);
    }
}
```

### Common CORS Errors & Solutions

#### Error: "No 'Access-Control-Allow-Origin' header"
```
Solution: Backend must include Access-Control-Allow-Origin header
Check: CORS middleware is enabled on backend
```

#### Error: "Credentials mode is 'include' but Access-Control-Allow-Credentials is missing"
```
Solution: Add Access-Control-Allow-Credentials: true to backend
Check: Frontend fetch includes credentials: 'include'
```

#### Error: "Method not allowed"
```
Solution: Add method to Access-Control-Allow-Methods
Check: Backend CORS config includes all needed methods
```

---

## 2. Authentication Strategy

### Current Implementation
- **Google Auth** - Primary authentication method
- **Wix Members** - Removed (no longer used)

### Recommended: JWT (JSON Web Token) Authentication

#### Flow Diagram
```
1. User logs in with credentials
2. Backend validates and returns JWT token
3. Frontend stores token (localStorage or sessionStorage)
4. Frontend includes token in Authorization header for all requests
5. Backend validates token on each request
6. Backend returns 401 if token invalid/expired
7. Frontend redirects to login on 401
```

### Backend: Generate JWT Token

```typescript
// Node.js/Express example
import jwt from 'jsonwebtoken';

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId, iat: Date.now() },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validate credentials
  const user = validateCredentials(email, password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = generateToken(user.id);
  
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});
```

### Backend: Validate JWT Token

```typescript
// Middleware to validate token
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Use middleware on protected routes
app.get('/api/collections/:collectionId', authMiddleware, (req, res) => {
  // Your logic
});
```

### Frontend: Store & Use Token

```typescript
// Location: /src/lib/auth.ts

export const storeToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const clearToken = () => {
  localStorage.removeItem('authToken');
};

export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};
```

### Frontend: Include Token in Requests

```typescript
// Update BaseCrudService to include token
export const BaseCrudService = {
  async getAll<T>(collectionId: string, refs?: any, options?: any) {
    const response = await fetch(`/api/collections/${collectionId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      ...options
    });
    
    if (response.status === 401) {
      // Token expired, redirect to login
      clearToken();
      window.location.href = '/login';
    }
    
    return response.json();
  }
};
```

### Frontend: Handle 401 Errors

```typescript
// Create interceptor for all fetch calls
const fetchWithAuth = async (url: string, options: any = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeaders()
    }
  });
  
  if (response.status === 401) {
    // Token expired
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  
  return response;
};
```

---

## 3. Token Refresh Strategy

### Refresh Token Flow

```
1. Access token expires after 24 hours
2. Frontend detects 401 error
3. Frontend sends refresh token to backend
4. Backend validates refresh token and returns new access token
5. Frontend retries original request with new token
6. If refresh token also expired, redirect to login
```

### Backend: Implement Refresh Token

```typescript
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
    const newAccessToken = generateToken(decoded.userId);
    
    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Refresh token expired' });
  }
});
```

### Frontend: Implement Token Refresh

```typescript
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      return null;
    }
    
    const { token } = await response.json();
    storeToken(token);
    return token;
  } catch {
    return null;
  }
};
```

---

## 4. Google Auth Integration

### Current Implementation
- Google Auth is already integrated in the app
- Used for user authentication

### Recommended: Use Google Auth with Backend

```typescript
// Frontend: Get Google token
const googleToken = await getGoogleToken();

// Send to backend for verification
const response = await fetch('/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ googleToken })
});

const { token, user } = await response.json();
storeToken(token);
```

### Backend: Verify Google Token

```typescript
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  const { googleToken } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const userId = payload.sub;
    
    // Create or update user in database
    const user = await findOrCreateUser(userId, payload);
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});
```

---

## 5. Security Best Practices

### ✅ DO

- [x] Use HTTPS in production
- [x] Store tokens securely (httpOnly cookies or secure localStorage)
- [x] Validate tokens on every request
- [x] Use short-lived access tokens (15-60 minutes)
- [x] Use long-lived refresh tokens (7-30 days)
- [x] Implement token rotation
- [x] Log authentication events
- [x] Rate limit login attempts
- [x] Use strong JWT secrets
- [x] Validate CORS origins strictly

### ❌ DON'T

- [ ] Store tokens in plain localStorage (use httpOnly cookies)
- [ ] Send tokens in URL parameters
- [ ] Use weak JWT secrets
- [ ] Allow all CORS origins (use specific domains)
- [ ] Expose sensitive data in error messages
- [ ] Log sensitive data (tokens, passwords)
- [ ] Use expired tokens
- [ ] Trust client-side token validation only

---

## 6. Environment Variables

### Backend (.env)

```
# CORS
FRONTEND_URL=https://yourdomain.com

# JWT
JWT_SECRET=your-super-secret-key-change-this
REFRESH_TOKEN_SECRET=your-refresh-secret-key-change-this
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Google Auth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=your-database-url
```

### Frontend (.env)

```
VITE_API_URL=https://api.yourdomain.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 7. Testing CORS & Auth

### Test CORS with curl

```bash
# Test preflight request
curl -X OPTIONS http://localhost:5000/api/collections/accessories \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test actual request
curl -X GET http://localhost:5000/api/collections/accessories \
  -H "Origin: http://localhost:3000" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v
```

### Test Auth with Postman

1. Create login request
2. Extract token from response
3. Add token to Authorization header
4. Test protected endpoints

---

## 8. Troubleshooting

### Issue: CORS error in browser console

**Solution:**
1. Check backend CORS headers
2. Verify frontend domain in CORS config
3. Check if preflight request (OPTIONS) is handled
4. Verify credentials: 'include' is set correctly

### Issue: 401 Unauthorized on protected routes

**Solution:**
1. Check if token is being sent
2. Verify token format (Bearer <token>)
3. Check if token is expired
4. Verify JWT secret matches on backend

### Issue: Token not persisting after page refresh

**Solution:**
1. Check localStorage/sessionStorage
2. Verify token is being stored correctly
3. Check if token is cleared on logout
4. Verify browser allows localStorage

---

## Summary

| Component | Status | Action |
|-----------|--------|--------|
| CORS | Not configured | Configure backend CORS headers |
| JWT Auth | Not implemented | Implement JWT authentication |
| Token Storage | Not implemented | Implement secure token storage |
| Token Refresh | Not implemented | Implement token refresh logic |
| Google Auth | Implemented | Integrate with backend |
| Error Handling | Partial | Implement 401 error handling |

---

**Next Steps:**
1. Configure CORS on backend
2. Implement JWT authentication
3. Add token storage and refresh logic
4. Test all authentication flows
5. Deploy to production with HTTPS
