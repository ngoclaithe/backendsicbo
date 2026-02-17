# Cookie-Based Authentication Setup

## Backend Configuration

### 1. Cookie Settings
- **Development**: `sameSite: 'lax'` - works for same-domain
- **Production**: `sameSite: 'none'` + `secure: true` - required for cross-domain with HTTPS

### 2. CORS Configuration
```typescript
credentials: true // CRITICAL for cookies to work
origin: (origin, callback) => { /* whitelist your frontend URLs */ }
```

### 3. Environment Variables
Add to `.env`:
```
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=your-secret-key
```

For production:
```
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

## Frontend Integration

### 1. API Client Setup (Axios example)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  withCredentials: true, // CRITICAL - sends cookies with requests
});

export default api;
```

### 2. Login Example
```typescript
// No need to manually handle tokens!
const response = await api.post('/auth/login', {
  username: 'admin',
  password: 'admin123'
});

// Cookie is automatically set by browser
console.log(response.data.user);
```

### 3. Authenticated Requests
```typescript
// Cookie is automatically sent
const user = await api.get('/auth/me');
```

### 4. Logout
```typescript
await api.post('/auth/logout');
// Cookie is automatically cleared
```

## Testing

### Local Development
1. Start backend: `npm run start:dev`
2. Start frontend with same domain or localhost
3. Cookies work automatically with `sameSite: 'lax'`

### Production (Cross-Domain)
1. Backend must use HTTPS
2. Set `NODE_ENV=production`
3. Add frontend domain to CORS whitelist
4. Cookies will use `sameSite: 'none'` + `secure: true`

## Default Accounts
- **Admin**: username: `admin`, password: `admin123`
- **User**: username: `player1`, password: `player123`

## Troubleshooting

### Cookies not being set?
- Check `withCredentials: true` in frontend
- Check `credentials: true` in backend CORS
- Verify frontend URL is in CORS whitelist

### Cookies not being sent?
- Check browser DevTools > Application > Cookies
- Ensure `withCredentials: true` on all API calls
- In production, ensure HTTPS is used

### CORS errors?
- Verify exact frontend URL in whitelist (no trailing slash)
- Check browser console for specific CORS error
- Ensure `credentials: true` in CORS config
