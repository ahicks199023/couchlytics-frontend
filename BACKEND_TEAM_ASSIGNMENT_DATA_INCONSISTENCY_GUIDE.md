# 🛠️ Backend Team Assignment Data Inconsistency Fix Guide

## Problem
- **Frontend User Management** shows user assigned to **49ers**
- **Backend `/leagues/{leagueId}/user-team` endpoint** returns **Ravens (team ID 1)**
- This creates a mismatch where the trade calculator shows the wrong team

## Root Cause Analysis
The issue is likely one of these:
1. **Data inconsistency** between `user_leagues` and `league_members` tables
2. **Wrong team_id** stored in the database for this user
3. **Caching issue** where old data is being returned
4. **Multiple team assignments** for the same user in different tables

---

## Step-by-Step Backend Investigation

### 1. **Check User's Current Team Assignment in Database**

Run these SQL queries to investigate the data inconsistency:

```sql
-- Check user's team assignment in user_leagues table
SELECT 
    ul.user_id,
    ul.league_id,
    ul.team_id,
    t.name as team_name,
    t.city,
    ul.updated_at
FROM user_leagues ul
LEFT JOIN teams t ON ul.team_id = t.id
WHERE ul.user_id = 12 
  AND ul.league_id = 12335716;

-- Check user's team assignment in league_members table
SELECT 
    lm.user_id,
    lm.league_id,
    lm.team_id,
    t.name as team_name,
    t.city,
    lm.updated_at
FROM league_members lm
LEFT JOIN teams t ON lm.team_id = t.id
WHERE lm.user_id = 12 
  AND lm.league_id = 12335716;

-- Check if there are multiple team assignments
SELECT 
    'user_leagues' as table_name,
    team_id,
    updated_at
FROM user_leagues 
WHERE user_id = 12 AND league_id = 12335716
UNION ALL
SELECT 
    'league_members' as table_name,
    team_id,
    updated_at
FROM league_members 
WHERE user_id = 12 AND league_id = 12335716;
```

### 2. **Check Team IDs for 49ers and Ravens**

```sql
-- Find team IDs for 49ers and Ravens
SELECT id, name, city, abbreviation 
FROM teams 
WHERE name IN ('49ers', 'Ravens') 
  AND league_id = 12335716
ORDER BY name;
```

### 3. **Check Backend Logs**

Look for these log entries when the `/leagues/{leagueId}/user-team` endpoint is called:

```bash
# Search for user team assignment logs
grep -i "user.*team.*12" /path/to/backend/logs/app.log
grep -i "team.*assignment.*12335716" /path/to/backend/logs/app.log
```

### 4. **Test the Backend Endpoint Directly**

```bash
# Test the user-team endpoint directly
curl -X GET "https://api.couchlytics.com/leagues/12335716/user-team?include_financials=true" \
  -H "Content-Type: application/json" \
  -b "your-session-cookie" \
  -v
```

---

## Common Fixes

### Fix 1: **Update Database to Correct Team Assignment**

If the data shows the wrong team_id, update it:

```sql
-- Update user_leagues table
UPDATE user_leagues 
SET team_id = (SELECT id FROM teams WHERE name = '49ers' AND league_id = 12335716),
    updated_at = NOW()
WHERE user_id = 12 
  AND league_id = 12335716;

-- Update league_members table
UPDATE league_members 
SET team_id = (SELECT id FROM teams WHERE name = '49ers' AND league_id = 12335716),
    updated_at = NOW()
WHERE user_id = 12 
  AND league_id = 12335716;
```

### Fix 2: **Check Backend Code for Team Assignment Logic**

Look for the `/leagues/{leagueId}/user-team` endpoint implementation:

```python
# Search for this endpoint in your backend code
@app.route('/leagues/<int:league_id>/user-team', methods=['GET'])
def get_user_team(league_id):
    # Check which table it's querying from
    # Make sure it's using the correct user_id from session
```

### Fix 3: **Clear Any Caching**

If you have Redis or other caching:
```bash
# Clear user-specific cache
redis-cli DEL "user_team:12:12335716"
redis-cli DEL "league_member:12:12335716"
```

---

## Verification Steps

### 1. **Check Database After Fix**
```sql
-- Verify the fix worked
SELECT 
    ul.user_id,
    ul.team_id,
    t.name as team_name,
    t.city
FROM user_leagues ul
LEFT JOIN teams t ON ul.team_id = t.id
WHERE ul.user_id = 12 AND ul.league_id = 12335716;
```

### 2. **Test API Endpoint**
```bash
curl -X GET "https://api.couchlytics.com/leagues/12335716/user-team" \
  -H "Content-Type: application/json" \
  -b "your-session-cookie"
```

### 3. **Check Frontend**
- Clear browser cache
- Reload the trade calculator page
- Verify it now shows "49ers" instead of "Ravens"

---

## Prevention

### 1. **Add Data Validation**
```python
# In your team assignment endpoint
def assign_team_to_user(league_id, user_id, team_id):
    # Validate team exists in this league
    team = Team.query.filter_by(id=team_id, league_id=league_id).first()
    if not team:
        return jsonify({'error': 'Team not found in this league'}), 404
    
    # Update both tables atomically
    with db.session.begin():
        # Update user_leagues
        user_league = UserLeague.query.filter_by(
            user_id=user_id, league_id=league_id
        ).first()
        if user_league:
            user_league.team_id = team_id
            user_league.updated_at = datetime.utcnow()
        
        # Update league_members
        league_member = LeagueMember.query.filter_by(
            user_id=user_id, league_id=league_id
        ).first()
        if league_member:
            league_member.team_id = team_id
            league_member.updated_at = datetime.utcnow()
        
        db.session.commit()
```

### 2. **Add Database Constraints**
```sql
-- Ensure team_id references valid teams in the same league
ALTER TABLE user_leagues 
ADD CONSTRAINT fk_user_leagues_team 
FOREIGN KEY (team_id) REFERENCES teams(id);

ALTER TABLE league_members 
ADD CONSTRAINT fk_league_members_team 
FOREIGN KEY (team_id) REFERENCES teams(id);
```

---

## Summary Checklist

- [ ] Check database for data inconsistency between tables
- [ ] Verify team IDs for 49ers vs Ravens
- [ ] Check backend logs for team assignment logic
- [ ] Test API endpoint directly
- [ ] Update database with correct team assignment
- [ ] Clear any caching
- [ ] Verify fix works in frontend
- [ ] Add data validation to prevent future issues

---

## Expected Result

After fixing the data inconsistency:
- Database should show user 12 assigned to 49ers (not Ravens)
- `/leagues/12335716/user-team` endpoint should return 49ers
- Trade calculator should display "49ers" as the user's team
- User Management and Trade Calculator should show the same team

