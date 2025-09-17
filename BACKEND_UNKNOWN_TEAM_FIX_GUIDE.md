# Backend Fix Guide: "Unknown Team" Issue in Trade Committee Review

## 🚨 Problem Description

The Trade Committee Review page is displaying "Unknown Team" in the left panel instead of the actual team names. This is caused by the backend API returning `"Unknown Team"` as the team name in trade data instead of the proper team information.

## 🔍 Root Cause Analysis

**Frontend Debug Output:**
```
🔍 First trade team data: {from_team: {…}, to_team: {…}}
🔍 TeamLogo received teamName: Unknown Team
🔍 TeamLogo lookup result: {teamName: 'Unknown Team', teamFound: false, teamConfig: null}
```

**Issue:** The backend is sending `"Unknown Team"` as the actual team name instead of the real team name (e.g., "Ravens", "Colts", etc.).

## 🎯 Affected API Endpoints

### Primary Endpoint
- **URL:** `/leagues/{leagueId}/trades/committee/pending`
- **Method:** GET
- **Purpose:** Fetch pending trades for committee review

### Expected Response Structure
```json
{
  "total_pending": 2,
  "trades": [
    {
      "id": 123,
      "from_team": {
        "id": 1,
        "name": "Ravens",  // ❌ Currently returning "Unknown Team"
        "city": "Baltimore"
      },
      "to_team": {
        "id": 2,
        "name": "Colts",   // ❌ Currently returning "Unknown Team"
        "city": "Indianapolis"
      },
      "fromPlayers": [...],
      "toPlayers": [...],
      // ... other fields
    }
  ]
}
```

## 🛠️ Backend Fix Implementation

### 1. Database Query Fix

**Problem:** The team name lookup is failing in the database query.

**Solution:** Ensure proper JOIN with teams table and correct field mapping.

```sql
-- Example SQL query that should work
SELECT 
    t.id,
    t.name as trade_id,
    ft.id as from_team_id,
    ft.name as from_team_name,
    ft.city as from_team_city,
    tt.id as to_team_id,
    tt.name as to_team_name,
    tt.city as to_team_city,
    -- ... other fields
FROM trades t
LEFT JOIN teams ft ON t.from_team_id = ft.id
LEFT JOIN teams tt ON t.to_team_id = tt.id
WHERE t.status = 'pending_committee_review'
```

### 2. API Response Mapping

**Problem:** Team data is not being properly mapped in the API response.

**Solution:** Ensure team objects are properly constructed.

```python
# Example Python/Django implementation
def get_pending_trades(league_id):
    trades = Trade.objects.filter(
        league_id=league_id,
        status='pending_committee_review'
    ).select_related('from_team', 'to_team')
    
    trades_data = []
    for trade in trades:
        trade_data = {
            'id': trade.id,
            'from_team': {
                'id': trade.from_team.id,
                'name': trade.from_team.name,  # Ensure this is not "Unknown Team"
                'city': trade.from_team.city
            },
            'to_team': {
                'id': trade.to_team.id,
                'name': trade.to_team.name,    # Ensure this is not "Unknown Team"
                'city': trade.to_team.city
            },
            # ... other fields
        }
        trades_data.append(trade_data)
    
    return {
        'total_pending': len(trades_data),
        'trades': trades_data
    }
```

### 3. Team Name Validation

**Problem:** Team names are not being validated before being stored or returned.

**Solution:** Add validation to ensure team names are valid NFL team names.

```python
# Example validation function
VALID_TEAM_NAMES = [
    'Ravens', 'Steelers', 'Browns', 'Bengals',
    'Jaguars', 'Titans', 'Texans', 'Colts',
    'Dolphins', 'Jets', 'Patriots', 'Bills',
    'Raiders', 'Chargers', 'Chiefs', 'Broncos',
    'Lions', 'Packers', 'Vikings', 'Bears',
    'Falcons', 'Panthers', 'Saints', 'Buccaneers',
    'Cowboys', 'Giants', 'Commanders', 'Eagles',
    '49ers', 'Rams', 'Seahawks', 'Cardinals'
]

def validate_team_name(team_name):
    """Validate that team name is a valid NFL team name."""
    if not team_name or team_name == 'Unknown Team':
        return False
    return team_name in VALID_TEAM_NAMES

def get_team_name_safely(team):
    """Safely get team name with fallback."""
    if not team:
        return 'Team TBD'
    
    team_name = team.name if hasattr(team, 'name') else None
    if not validate_team_name(team_name):
        return 'Team TBD'
    
    return team_name
```

## 🔧 Specific Fixes Required

### 1. Check Database Integrity
```sql
-- Verify team names in database
SELECT id, name, city FROM teams WHERE name = 'Unknown Team';
SELECT id, name, city FROM teams WHERE name IS NULL OR name = '';

-- Check for trades with invalid team references
SELECT t.id, t.from_team_id, t.to_team_id, ft.name as from_team_name, tt.name as to_team_name
FROM trades t
LEFT JOIN teams ft ON t.from_team_id = ft.id
LEFT JOIN teams tt ON t.to_team_id = tt.id
WHERE ft.name = 'Unknown Team' OR tt.name = 'Unknown Team' OR ft.name IS NULL OR tt.name IS NULL;
```

### 2. Fix Team Name Lookup
```python
# Ensure proper team name resolution
def resolve_team_name(team_id):
    """Resolve team name from team ID."""
    try:
        team = Team.objects.get(id=team_id)
        if team.name and team.name != 'Unknown Team':
            return team.name
        else:
            # Log the issue for debugging
            logger.warning(f"Team {team_id} has invalid name: {team.name}")
            return 'Team TBD'
    except Team.DoesNotExist:
        logger.error(f"Team {team_id} not found")
        return 'Team TBD'
```

### 3. Update API Response
```python
# Update the API response to use resolved team names
def build_trade_response(trade):
    return {
        'id': trade.id,
        'from_team': {
            'id': trade.from_team_id,
            'name': resolve_team_name(trade.from_team_id),
            'city': get_team_city(trade.from_team_id)
        },
        'to_team': {
            'id': trade.to_team_id,
            'name': resolve_team_name(trade.to_team_id),
            'city': get_team_city(trade.to_team_id)
        },
        # ... other fields
    }
```

## 🧪 Testing Checklist

### 1. Database Tests
- [ ] Verify all teams have valid names (not "Unknown Team")
- [ ] Check for NULL or empty team names
- [ ] Validate team ID references in trades table

### 2. API Tests
- [ ] Test `/leagues/{leagueId}/trades/committee/pending` endpoint
- [ ] Verify team names in response are valid NFL team names
- [ ] Test with trades that have valid team references
- [ ] Test with trades that have invalid team references (should show "Team TBD")

### 3. Integration Tests
- [ ] Test Trade Committee Review page displays correct team names
- [ ] Verify team logos appear correctly
- [ ] Test team name display in trade cards

## 🚨 Potential Breaking Changes

### 1. Database Schema Changes
- **Risk:** Low - Only fixing data integrity, no schema changes
- **Mitigation:** Run data validation queries first

### 2. API Response Changes
- **Risk:** Low - Only fixing team names, structure remains same
- **Mitigation:** Frontend already handles fallbacks

### 3. Team Name Validation
- **Risk:** Medium - May affect existing trades with invalid team names
- **Mitigation:** Use fallback values instead of failing

## 📋 Implementation Steps

1. **Investigate Database**
   - Run diagnostic queries to find "Unknown Team" entries
   - Check for NULL or empty team names
   - Verify team ID references

2. **Fix Team Name Resolution**
   - Update team lookup logic
   - Add validation for team names
   - Implement fallback handling

3. **Update API Endpoints**
   - Fix `/leagues/{leagueId}/trades/committee/pending`
   - Ensure proper team data mapping
   - Add error handling for invalid teams

4. **Test Thoroughly**
   - Test with valid team data
   - Test with invalid team data
   - Verify frontend displays correctly

5. **Deploy and Monitor**
   - Deploy changes
   - Monitor for any issues
   - Verify Trade Committee Review page works

## 🔍 Debugging Information

### Frontend Debug Output
The frontend will show these debug messages in the console:
- `🔍 Pending trades data:` - Shows full API response
- `🔍 First trade team data:` - Shows team data structure
- `🔍 TeamLogo received teamName:` - Shows team name being passed to logo component
- `🔍 TeamLogo lookup result:` - Shows whether team lookup succeeded

### Expected vs Actual
**Expected:**
```json
{
  "from_team": {
    "id": 1,
    "name": "Ravens",
    "city": "Baltimore"
  }
}
```

**Currently Getting:**
```json
{
  "from_team": {
    "id": 1,
    "name": "Unknown Team",
    "city": "Baltimore"
  }
}
```

## 📞 Support

If you need help implementing these fixes or encounter any issues, please:
1. Check the frontend console for debug output
2. Verify database team data integrity
3. Test API endpoints with proper team names
4. Contact the frontend team if issues persist

---

**Priority:** High - This affects user experience in the Trade Committee Review feature
**Estimated Fix Time:** 2-4 hours
**Testing Required:** Yes - Full integration testing needed
