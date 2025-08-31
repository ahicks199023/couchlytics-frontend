# 🔧 API Configuration Test Guide

## 🎯 **Test the Current API Configuration**

### **Step 1: Check Console Output**
1. Open your browser's Developer Tools
2. Go to the Console tab
3. Navigate to the Trade Calculator page
4. Look for these log messages:
   ```
   [Auth] Making request to: https://api.couchlytics.com/leagues/12335716/players?page=1&pageSize=5000
   [Auth] Response status: 200 (or 403)
   ```

### **Step 2: Check Network Tab**
1. Go to the Network tab in Developer Tools
2. Try to load the Trade Calculator
3. Look for requests to:
   - `https://api.couchlytics.com/leagues/12335716/players`
   - `https://api.couchlytics.com/leagues/12335716/teams`

### **Step 3: Verify Environment Variables**
The frontend should be using:
- `API_BASE = 'https://api.couchlytics.com'` (from config.ts)
- **NOT** `https://www.couchlytics.com`

## 🚨 **If You See Wrong Domain**

If you see requests going to `www.couchlytics.com` instead of `api.couchlytics.com`, check:

1. **Browser Cache**: Clear cache and reload
2. **Environment Variables**: Check if any `.env` files override the config
3. **Build Issues**: Ensure the latest code is deployed

## 🔧 **Quick Fix Test**

Add this temporary debug code to the Trade Calculator:

```typescript
// Add this at the top of the component
console.log('🔍 API Configuration Debug:', {
  API_BASE,
  env_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  env_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  fullUrl: `${API_BASE}/leagues/${league_id}/players`
});
```

This will show exactly what URLs are being constructed.

## 📋 **Expected Results**

✅ **Correct Configuration:**
- API_BASE = `https://api.couchlytics.com`
- Requests go to: `https://api.couchlytics.com/leagues/...`
- Should get 200 responses (if backend is working)

❌ **Wrong Configuration:**
- API_BASE = `https://www.couchlytics.com` or `/backend-api`
- Requests go to wrong domain
- Will get 403/404 errors

## 🚀 **Next Steps**

1. **Run the test** above
2. **Check console output** for actual URLs being called
3. **Verify network requests** in browser dev tools
4. **Report findings** so we can fix the exact issue
