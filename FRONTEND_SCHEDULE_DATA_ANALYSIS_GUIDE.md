# 🏈 Frontend Schedule Cache Fix Guide

## 🎯 **Issue Summary**

The schedule data appears to be "hardcoded" but is actually being fetched from the backend API correctly. The **backend has been verified to be working perfectly** and returning the correct data:

- ✅ **Week 1**: Browns vs Commanders (correct)
- ✅ **No Week 0 games** (already fixed)
- ✅ **Schedule properly sorted** (chronological order)
- ✅ **Team names consistent** (all correct)

The issue is **frontend caching** - the frontend is displaying stale/cached data instead of the latest data from the backend.

## 🔍 **Root Cause Analysis**

### ✅ **Backend is Working Correctly**
- Database contains correct data
- API endpoint `/leagues/{leagueId}/teams/{teamId}/detail` returns correct schedule
- Schedule processing logic works perfectly
- No Week 0 games exist
- Team names are consistent

### ❌ **Frontend Caching Issue**
The frontend is displaying cached data that shows:
- Week 1: Browns vs Steelers (incorrect - should be Commanders)
- Week 0 games (incorrect - should not exist)
- Unsorted schedule (incorrect - should be chronological)

## 🚀 **Solution: Frontend Cache Busting**

### 1. **Immediate Fix: Hard Refresh**
```javascript
// Force browser to clear cache and reload
// Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
// Or open DevTools > Network tab > check "Disable cache"
```

### 2. **API Call Cache Busting**
Update the frontend API calls to include cache busting:

```javascript
// In your team detail component
const fetchTeamData = async (leagueId, teamId) => {
  try {
    // Add timestamp for cache busting
    const timestamp = new Date().getTime();
    const url = `${API_BASE}/leagues/${leagueId}/teams/${teamId}/detail?t=${timestamp}`;
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Debug: Log the actual data received
    console.log('API Response - Schedule data:', data.schedule);
    console.log('Week 1 game:', data.schedule.find(g => g.week === 1));
    
    return data;
  } catch (error) {
    console.error('Error fetching team data:', error);
    throw error;
  }
};
```

### 3. **Service Worker Cache Clearing**
If using a service worker, clear the cache:

```javascript
// Clear service worker cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}
```

### 4. **Local Storage Cache Clearing**
Clear any cached data in local storage:

```javascript
// Clear cached team data
localStorage.removeItem('teamData');
localStorage.removeItem('scheduleData');
sessionStorage.clear();
```

### 5. **React Query/SWR Cache Clearing**
If using React Query or SWR, clear the cache:

```javascript
// React Query
import { useQueryClient } from 'react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries(['teamDetail', leagueId, teamId]);

// SWR
import { mutate } from 'swr';
mutate(`/leagues/${leagueId}/teams/${teamId}/detail`);
```

## 🔧 **Frontend Code Updates**

### 1. **Update API Base URL**
Ensure the frontend is calling the correct API endpoint:

```javascript
// In your API configuration
const API_BASE = 'https://api.couchlytics.com'; // or your backend URL

// Team detail endpoint
const teamDetailUrl = `${API_BASE}/leagues/${leagueId}/teams/${teamId}/detail`;
```

### 2. **Add Debug Logging**
Add comprehensive logging to see what data is actually received:

```javascript
// In your team detail component
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await fetchTeamData(leagueId, teamId);
      
      // Debug logging
      console.log('=== FRONTEND DEBUG ===');
      console.log('Raw API response:', data);
      console.log('Schedule data:', data.schedule);
      console.log('Schedule length:', data.schedule?.length);
      
      // Check Week 1 specifically
      const week1Game = data.schedule?.find(g => g.week === 1);
      console.log('Week 1 game details:', week1Game);
      
      // Check for Week 0 games
      const week0Games = data.schedule?.filter(g => g.week === 0);
      console.log('Week 0 games found:', week0Games.length);
      
      // Check schedule sorting
      const weeks = data.schedule?.map(g => g.week);
      console.log('Weeks in order:', weeks);
      const isSorted = weeks?.every((week, index) => index === 0 || week >= weeks[index - 1]);
      console.log('Schedule is sorted:', isSorted);
      
      setTeamData(data);
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };
  
  fetchData();
}, [leagueId, teamId]);
```

### 3. **Force Re-render on Data Change**
Ensure the component re-renders when new data is received:

```javascript
// Add key prop to force re-render
<div key={`team-${teamId}-${Date.now()}`}>
  {/* Team detail content */}
</div>
```

## 🧪 **Testing Steps**

### 1. **Clear All Caches**
```bash
# Clear browser cache
# Chrome: Ctrl+Shift+Delete > Clear browsing data
# Firefox: Ctrl+Shift+Delete > Clear recent history
# Safari: Cmd+Option+E > Empty Caches
```

### 2. **Test API Directly**
```bash
# Test the API endpoint directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.couchlytics.com/leagues/12335716/teams/4/detail?t=$(date +%s)"
```

### 3. **Check Network Tab**
1. Open DevTools > Network tab
2. Check "Disable cache"
3. Reload the page
4. Look for the team detail API call
5. Check the response data

### 4. **Verify Console Logs**
After implementing the debug logging, check the console for:
- "Week 1 game details: {opponent: 'Commanders', ...}"
- "Week 0 games found: 0"
- "Schedule is sorted: true"

## 📊 **Expected Results After Fix**

After implementing cache busting, the console logs should show:

```javascript
// Correct data from backend
Week 1 game details: {
  week: 1,
  home: 'Browns',
  away: 'Commanders', 
  opponent: 'Commanders',  // ✅ Correct!
  isHome: true,
  gameId: '543031001'
}

// No Week 0 games
Week 0 games found: 0  // ✅ Correct!

// Properly sorted schedule
Weeks in order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]  // ✅ Correct!
Schedule is sorted: true  // ✅ Correct!
```

## 🎉 **Summary**

The **backend is working perfectly** and returning the correct data. The issue is **frontend caching** that needs to be resolved with proper cache busting techniques.

**No backend changes are required** - the problem is entirely on the frontend side.

## 🔧 **Quick Fix Commands**

```bash
# 1. Clear browser cache (hard refresh)
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# 2. Clear local storage
# Open DevTools > Console > Run:
localStorage.clear();
sessionStorage.clear();

# 3. Disable cache in DevTools
# DevTools > Network tab > Check "Disable cache"

# 4. Test API directly
# DevTools > Network tab > Look for team detail API call > Check response
```

The schedule data is **not hardcoded** - it's being fetched from the backend correctly, but the frontend is displaying cached/stale data.
