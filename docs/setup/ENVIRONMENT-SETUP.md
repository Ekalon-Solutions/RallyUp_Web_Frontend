# Environment Configuration System

This project now uses a centralized configuration system to easily switch between different environments (development, staging, production) without manually changing API endpoints throughout the codebase.

## 🚀 Quick Start

### Switch to Development (localhost:5000)
```bash
npm run env:dev
```

### Switch to Production (3.111.169.32:5050)
```bash
npm run env:prod
```

### Switch to Staging (3.111.169.32:5050)
```bash
npm run env:staging
```

## 📁 Configuration Files

### Main Config: `lib/config.ts`
- **Environment Selection**: Change `ENV.CURRENT` to switch environments
- **API Endpoints**: All endpoints are defined in one place
- **Helper Functions**: Easy URL building and environment detection

### Environment-Specific Settings
- **Development**: `http://localhost:5000/api` (with debug logging)
- **Production**: `http://3.111.169.32:5050/api` (no debug logging)
- **Staging**: `http://3.111.169.32:5050/api` (with debug logging)

## 🔧 How to Use

### 1. Import Configuration
```typescript
import { getApiUrl, API_ENDPOINTS, currentConfig } from '@/lib/config';
```

### 2. Use Predefined Endpoints
```typescript
// Instead of hardcoded URLs like:
// fetch('http://localhost:5000/api/users/register')

// Use:
fetch(getApiUrl(API_ENDPOINTS.users.register))
```

### 3. Environment Detection
```typescript
import { isDevelopment, isProduction, isStaging } from '@/lib/config';

if (isDevelopment()) {
  console.log('Running in development mode');
}
```

### 4. Debug Logging
```typescript
import { debugLog } from '@/lib/config';

debugLog('User logged in', { userId: '123' });
// Only logs in development/staging, not in production
```

## 📋 Available Endpoints

### Users
- `API_ENDPOINTS.users.register` → `/users/register`
- `API_ENDPOINTS.users.login` → `/users/login`
- `API_ENDPOINTS.users.profile` → `/users/profile`

### Admins
- `API_ENDPOINTS.admin.login` → `/admin/login`
- `API_ENDPOINTS.admin.profile` → `/admin/profile`

### System Owners
- `API_ENDPOINTS.systemOwner.create` → `/system-owner/create`
- `API_ENDPOINTS.systemOwner.login` → `/system-owner/login`

### Clubs
- `API_ENDPOINTS.clubs.public` → `/clubs/public`
- `API_ENDPOINTS.clubs.getById(id)` → `/clubs/${id}`

### Staff
- `API_ENDPOINTS.staff.getByClub(clubId)` → `/staff/club/${clubId}`
- `API_ENDPOINTS.staff.getStats(clubId)` → `/staff/club/${clubId}/stats`

### Volunteers
- `API_ENDPOINTS.volunteer.opportunities` → `/volunteer/opportunities`
- `API_ENDPOINTS.volunteer.assign` → `/volunteer/opportunities/assign`

## 🔄 Migration Guide

### Before (Hardcoded URLs)
```typescript
// ❌ Don't do this anymore
const response = await fetch('http://localhost:5000/api/users/register', {
  method: 'POST',
  // ...
});
```

### After (Using Config)
```typescript
// ✅ Do this instead
import { getApiUrl, API_ENDPOINTS } from '@/lib/config';

const response = await fetch(getApiUrl(API_ENDPOINTS.users.register), {
  method: 'POST',
  // ...
});
```

## 🛠️ Adding New Endpoints

To add a new endpoint:

1. **Add to config.ts**:
```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  newFeature: {
    create: '/new-feature/create',
    update: (id: string) => `/new-feature/${id}`,
    delete: (id: string) => `/new-feature/${id}`,
  },
};
```

2. **Use in your component**:
```typescript
import { getApiUrl, API_ENDPOINTS } from '@/lib/config';

const response = await fetch(getApiUrl(API_ENDPOINTS.newFeature.create), {
  method: 'POST',
  // ...
});
```

## 🌍 Environment Variables (Future Enhancement)

For even more flexibility, you can extend this system to use environment variables:

```typescript
// In config.ts
export const ENV = {
  CURRENT: process.env.NODE_ENV || 'development',
  // ... rest of config
};
```

Then set `NODE_ENV=production` in your deployment environment.

## 📝 Benefits

1. **Single Source of Truth**: All API endpoints defined in one place
2. **Easy Environment Switching**: One command to change all endpoints
3. **Type Safety**: TypeScript support for all endpoints
4. **Maintainability**: No more searching for hardcoded URLs
5. **Consistency**: All components use the same endpoint structure
6. **Debug Support**: Automatic logging in development/staging

## 🚨 Important Notes

- **Always use the config system** for new API calls
- **Don't hardcode URLs** anywhere in your components
- **Test both environments** after switching
- **Commit environment changes** when deploying

## 🔍 Troubleshooting

### Build Fails After Environment Switch
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Endpoint Not Found
Check that the endpoint is defined in `API_ENDPOINTS` in `lib/config.ts`

### Wrong Environment Active
Run the appropriate switch command:
```bash
npm run env:dev    # For localhost
npm run env:prod   # For production
```
