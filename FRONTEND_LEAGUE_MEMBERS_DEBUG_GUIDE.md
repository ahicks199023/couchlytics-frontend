# 🔧 Frontend League Members Debug Guide

## 🚨 Problem Identified
**Backend is working perfectly** - 2 users are properly stored in the database, but the frontend is only showing 1 user. The issue is with the frontend API endpoint selection and data parsing.

## 🔍 Current Frontend Issue

The frontend is using the **wrong endpoint**:
- ❌ **Currently using**: `/leagues/12335716/commissioner/users` (returns 1 user)
- ✅ **Should use**: `/leagues/12335716/members` (returns 2 users)

## 🎯 Debug Steps

### 1. Test Both Endpoints Directly

Open browser console and run these commands:

```javascript
// Test the commissioner/users endpoint (currently used)
fetch('https://api.couchlytics.com/leagues/12335716/commissioner/users', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log('Commissioner/users response:', data))

// Test the members endpoint (should be used)
fetch('https://api.couchlytics.com/leagues/12335716/members', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log('Members response:', data))
```

### 2. Expected Responses

**Commissioner/users endpoint** (currently used):
```json
{
  "total": 1,
  "users": [
    {
      "id": 1,
      "email": "antoinehickssales@gmail.com",
      "first_name": "Antoine",
      "last_name": "Hicks",
      "display_name": "Antoine Hicks",
      "is_commissioner": true,
      "is_admin": true,
      "league_role": "user"
    }
  ]
}
```

**Members endpoint** (should be used):
```json
{
  "success": true,
  "members": [
    {
      "id": 1,
      "email": "antoinehickssales@gmail.com",
      "name": "Antoine Hicks",
      "role": "commissioner",
      "is_active": true
    },
    {
      "id": 2,
      "email": "antoinemariohicks@gmail.com",
      "name": "Antoine Mario Hicks", 
      "role": "member",
      "is_active": true
    }
  ],
  "total": 2
}
```

## 🛠️ Frontend Fix

### Option 1: Switch to Members Endpoint (Recommended)

Update `src/lib/api.ts` to use the correct endpoint:

```typescript
export const getLeagueMembers = async (leagueId: string) => {
  console.log('🔍 getLeagueMembers called for league:', leagueId)
  
  // Use the members endpoint directly (not commissioner/users)
  try {
    console.log('🔍 Using members endpoint...')
    const response = await fetch(`${API_BASE}/leagues/${leagueId}/members`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('🔍 Members response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ getLeagueMembers failed:', response.status, errorText)
      throw new Error(`Failed to fetch league members: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('🔍 Members response data:', data)
    
    return {
      ...data,
      debugInfo: {
        apiEndpointUsed: `/leagues/${leagueId}/members`,
        responseStatus: response.status,
        responseData: data
      }
    }
  } catch (error) {
    console.error('❌ Members endpoint failed:', error)
    throw error
  }
}
```

### Option 2: Fix Data Transformation (If keeping commissioner/users)

If you want to keep using the commissioner/users endpoint, fix the data transformation:

```typescript
// In the commissioner/users section, fix the transformation:
const transformedData = {
  success: true,
  members: (data.users || data.members || []).map(user => ({
    id: user.id,
    email: user.email,
    name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    role: user.is_commissioner ? 'commissioner' : 'member',
    is_active: true,
    team_id: user.team?.id,
    joined_at: user.joined_at
  })),
  total: data.total || (data.users ? data.users.length : 0),
  debugInfo: {
    apiEndpointUsed: `/leagues/${leagueId}/commissioner/users`,
    responseStatus: response.status,
    responseData: data
  }
}
```

## 🧪 Test the Fix

### 1. Use the Test Page
Navigate to `/test-league-members` and:
1. Click "Test getLeagueMembers()"
2. Click "Test Direct API Calls"
3. Compare the results

### 2. Check the Debug Panel
Go to Commissioner Dashboard → League Members tab:
1. Look for the debug panel
2. Click "Refresh Members"
3. Verify it shows 2 users

### 3. Verify API Calls
Open browser DevTools → Network tab:
1. Navigate to League Members tab
2. Look for the API call
3. Check the response shows 2 members

## 🎯 Expected Results After Fix

- **Debug Panel**: Should show 2 users
- **API Response**: Should return 2 members
- **Frontend Display**: Should list both users in the table
- **Console Logs**: Should show correct member count

## 🚨 Key Points

1. **Backend is perfect** - no changes needed
2. **Frontend endpoint selection** - use `/members` not `/commissioner/users`
3. **Data transformation** - ensure proper mapping of user data
4. **Debug tools** - use the test page to verify the fix

The issue is simply that the frontend is calling the wrong API endpoint. Once you switch to the correct `/members` endpoint, you should see both users immediately.
