# 🛠️ Couchlytics Frontend API Base URL Fix Guide

## 🚨 **Problem Summary**
- Some API requests (e.g., `/leagues/{leagueId}/members/me`) are being sent to `https://www.couchlytics.com` instead of `https://api.couchlytics.com`, resulting in 404 errors.
- The backend is working and returns 200 OK when requests are sent to the correct API base URL.

## 🔍 **Root Cause Analysis**

### **Current Configuration Status:**
✅ **API_BASE** (from `src/lib/config.ts`): `https://api.couchlytics.com`  
✅ **API_BASE_URL** (from `src/lib/http.ts`): `https://api.couchlytics.com`  
✅ **No hardcoded `www.couchlytics.com` URLs found in source code**  
✅ **All API calls use proper base URL variables**  

### **Potential Issues:**
1. **Browser Cache**: Old cached JavaScript might be using incorrect URLs
2. **Deployment Cache**: Vercel might be serving cached versions
3. **Environment Variables**: Production environment might have incorrect values
4. **Vercel Rewrites**: The rewrite rule might be interfering with API calls

## 🔧 **Step-by-Step Fix Process**

### **Step 1: Verify Current Configuration**

The configuration files are correctly set:

**`src/lib/config.ts`:**
```typescript
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.couchlytics.com';
```

**`src/lib/http.ts`:**
```typescript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'
```

### **Step 2: Test Configuration**

Visit `/test-api-base` to verify the configuration values:
- Check that both `API_BASE` and `API_BASE_URL` show `https://api.couchlytics.com`
- Test API calls to confirm they're going to the correct URL

### **Step 3: Clear All Caches**

#### **A. Clear Browser Cache**
```bash
# Hard refresh in browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or clear browser data completely
# Chrome: Settings > Privacy > Clear browsing data
# Firefox: Settings > Privacy > Clear Data
```

#### **B. Clear Vercel Cache**
```bash
# Redeploy to clear Vercel cache
git commit --allow-empty -m "Clear cache"
git push
```

#### **C. Clear Next.js Cache**
```bash
# Clear Next.js build cache
rm -rf .next
npm run build
```

### **Step 4: Check Environment Variables**

#### **A. Local Development**
```bash
# Check if any environment variables are set
echo $NEXT_PUBLIC_API_BASE
echo $NEXT_PUBLIC_API_BASE_URL
```

#### **B. Production (Vercel)**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Check if `NEXT_PUBLIC_API_BASE` or `NEXT_PUBLIC_API_BASE_URL` are set
5. If they are set to `www.couchlytics.com`, update them to `api.couchlytics.com`

### **Step 5: Fix Vercel Configuration**

The current `vercel.json` has a rewrite rule that might be interfering:

```json
{
  "rewrites": [
    {
      "source": "/backend-api/(.*)",
      "destination": "https://api.couchlytics.com/backend-api/$1"
    }
  ]
}
```

**Update to be more specific:**
```json
{
  "rewrites": [
    {
      "source": "/backend-api/(.*)",
      "destination": "https://api.couchlytics.com/backend-api/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-API-Base",
          "value": "https://api.couchlytics.com"
        }
      ]
    }
  ]
}
```

### **Step 6: Add Debugging to API Calls**

Add console logging to verify URLs being used:

```typescript
// In any component making API calls
const apiUrl = `${API_BASE}/leagues/${leagueId}/members/me`
console.log('🔍 Making API call to:', apiUrl)
console.log('🔍 API_BASE value:', API_BASE)

const response = await fetch(apiUrl, {
  credentials: 'include'
})
```

### **Step 7: Force Environment Variable Override**

If the issue persists, explicitly set the environment variable:

#### **A. Create `.env.local` file:**
```bash
# .env.local
NEXT_PUBLIC_API_BASE=https://api.couchlytics.com
NEXT_PUBLIC_API_BASE_URL=https://api.couchlytics.com
```

#### **B. Update Vercel Environment Variables:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add/Update:
   - `NEXT_PUBLIC_API_BASE` = `https://api.couchlytics.com`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://api.couchlytics.com`

### **Step 8: Verify Fix**

1. **Check Network Tab**: Open browser dev tools and verify API calls go to `api.couchlytics.com`
2. **Test Specific Endpoints**: Test `/leagues/{leagueId}/members/me` endpoint
3. **Check Console Logs**: Verify no 404 errors for API calls

## 🚀 **Quick Fix Checklist**

- [ ] Clear browser cache (hard refresh)
- [ ] Clear Vercel deployment cache (redeploy)
- [ ] Check Vercel environment variables
- [ ] Verify configuration values in `/test-api-base`
- [ ] Test API calls in browser dev tools
- [ ] Check for any remaining 404 errors

## 🔍 **Debugging Commands**

```bash
# Check current environment variables
echo $NEXT_PUBLIC_API_BASE
echo $NEXT_PUBLIC_API_BASE_URL

# Clear Next.js cache
rm -rf .next
npm run build

# Test build locally
npm run dev

# Check for hardcoded URLs
grep -r "www.couchlytics.com" src/
grep -r "couchlytics.com" src/ | grep -v "api.couchlytics.com"
```

## 📋 **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| Requests go to `www.couchlytics.com` | Browser cache | Hard refresh browser |
| 404 errors persist | Vercel cache | Redeploy application |
| Environment variables wrong | Vercel config | Update Vercel env vars |
| Configuration not loading | Build cache | Clear `.next` folder |

## 🎯 **Expected Outcome**

After implementing these fixes:
- ✅ All API requests use `https://api.couchlytics.com`
- ✅ No requests go to `www.couchlytics.com` for API endpoints
- ✅ `/leagues/{leagueId}/members/me` returns 200 OK
- ✅ Frontend displays correct team assignment data
- ✅ No more 404 errors in browser console

## 📞 **Next Steps**

1. **Clear all caches** (browser, Vercel, Next.js)
2. **Check environment variables** in Vercel dashboard
3. **Test the configuration** using `/test-api-base` page
4. **Verify API calls** in browser dev tools
5. **Redeploy if necessary** to ensure changes take effect

---

**Note**: This guide addresses the most common causes of API base URL issues. The specific fix will depend on whether the problem is in caching, environment variables, or deployment configuration.
