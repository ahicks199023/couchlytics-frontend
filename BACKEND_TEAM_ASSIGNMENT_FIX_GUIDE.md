# 🛠️ Backend Team Assignment Fix Guide

## 🎯 **Issue Summary**
User `kyokosarchet@gmail.com` (User ID: 12) is incorrectly assigned to the **Ravens (Team ID: 1)** when they should be assigned to the **49ers**.

## 🔍 **Frontend Evidence**
The frontend is correctly receiving and displaying the backend data:
```
✅ User team assigned: {abbreviation: 'RAV', city: 'Ravens', financials: {…}, id: 1, name: 'Ravens'}
🔍 Team details: {id: 1, name: 'Ravens', city: 'Ravens', abbreviation: 'RAV'}
🔍 Team Detection Debug: {userId: 12, teamsCount: 32, userTeam: {…}, userTeamId: 1}
```

## 🗄️ **Database Investigation**

### **Step 1: Check Current Team Assignment**
Run this SQL query to see the current assignment:

```sql
-- Check current team assignment for User ID 12
SELECT 
    u.id as user_id,
    u.email,
    ut.team_id,
    t.name as team_name,
    t.city as team_city,
    t.abbreviation as team_abbreviation
FROM users u
LEFT JOIN user_teams ut ON u.id = ut.user_id
LEFT JOIN teams t ON ut.team_id = t.id
WHERE u.id = 12;
```

### **Step 2: Find the 49ers Team ID**
```sql
-- Find the 49ers team ID
SELECT id, name, city, abbreviation 
FROM teams 
WHERE name LIKE '%49ers%' OR city LIKE '%San Francisco%' OR abbreviation = 'SF';
```

### **Step 3: Check League-Specific Assignment**
```sql
-- Check if there's a league-specific team assignment
SELECT 
    u.id as user_id,
    u.email,
    lta.league_id,
    lta.team_id,
    t.name as team_name,
    t.city as team_city
FROM users u
LEFT JOIN league_team_assignments lta ON u.id = lta.user_id
LEFT JOIN teams t ON lta.team_id = t.id
WHERE u.id = 12 AND lta.league_id = 12335716;
```

## 🔧 **Fix Implementation**

### **Option 1: Update User-Teams Table (Global Assignment)**
If the assignment is in the `user_teams` table:

```sql
-- Update the team assignment
UPDATE user_teams 
SET team_id = [49ERS_TEAM_ID]  -- Replace with actual 49ers team ID
WHERE user_id = 12;
```

### **Option 2: Update League-Specific Assignment**
If the assignment is league-specific:

```sql
-- Update league-specific team assignment
UPDATE league_team_assignments 
SET team_id = [49ERS_TEAM_ID]  -- Replace with actual 49ers team ID
WHERE user_id = 12 AND league_id = 12335716;
```

### **Option 3: Insert New Assignment (If Missing)**
If no assignment exists:

```sql
-- Insert new league-specific team assignment
INSERT INTO league_team_assignments (user_id, league_id, team_id, assigned_at)
VALUES (12, 12335716, [49ERS_TEAM_ID], NOW());
```

## 🧪 **Verification Steps**

### **Step 1: Verify the Fix**
```sql
-- Verify the team assignment is correct
SELECT 
    u.id as user_id,
    u.email,
    lta.league_id,
    lta.team_id,
    t.name as team_name,
    t.city as team_city,
    t.abbreviation
FROM users u
LEFT JOIN league_team_assignments lta ON u.id = lta.user_id
LEFT JOIN teams t ON lta.team_id = t.id
WHERE u.id = 12 AND lta.league_id = 12335716;
```

### **Step 2: Test the API Endpoint**
Test the `/leagues/12335716/user-team` endpoint to ensure it returns the correct team:

```bash
curl -X GET "https://api.couchlytics.com/leagues/12335716/user-team" \
  -H "Content-Type: application/json" \
  -b "session_cookie=your_session_cookie"
```

Expected response:
```json
{
  "success": true,
  "team": {
    "id": [49ERS_TEAM_ID],
    "name": "49ers",
    "city": "San Francisco",
    "abbreviation": "SF"
  }
}
```

## 🔄 **Backend Code Review**

### **Check the User-Team Endpoint**
Review your backend code for the `/leagues/{leagueId}/user-team` endpoint:

```python
# Example endpoint logic to check
@router.get("/leagues/{league_id}/user-team")
async def get_user_team(league_id: int, current_user: User = Depends(get_current_user)):
    # Check if this logic is correct
    team_assignment = await get_team_assignment(current_user.id, league_id)
    if not team_assignment:
        raise HTTPException(status_code=404, detail="No team assignment found")
    
    return {
        "success": True,
        "team": team_assignment.team
    }
```

### **Check Team Assignment Logic**
Ensure your team assignment logic is correct:

```python
async def get_team_assignment(user_id: int, league_id: int):
    # Check league-specific assignment first
    assignment = await db.query(
        "SELECT t.* FROM league_team_assignments lta "
        "JOIN teams t ON lta.team_id = t.id "
        "WHERE lta.user_id = ? AND lta.league_id = ?",
        (user_id, league_id)
    ).first()
    
    if assignment:
        return assignment
    
    # Fallback to global assignment
    assignment = await db.query(
        "SELECT t.* FROM user_teams ut "
        "JOIN teams t ON ut.team_id = t.id "
        "WHERE ut.user_id = ?",
        (user_id,)
    ).first()
    
    return assignment
```

## 🚨 **Common Issues to Check**

### **1. Multiple Assignments**
Check if there are conflicting assignments:

```sql
-- Check for multiple team assignments
SELECT 
    u.id as user_id,
    u.email,
    COUNT(*) as assignment_count,
    GROUP_CONCAT(t.name) as assigned_teams
FROM users u
LEFT JOIN league_team_assignments lta ON u.id = lta.user_id
LEFT JOIN teams t ON lta.team_id = t.id
WHERE u.id = 12 AND lta.league_id = 12335716
GROUP BY u.id, u.email;
```

### **2. Team ID Mismatch**
Verify the 49ers team exists and has the correct ID:

```sql
-- List all teams to find the correct 49ers ID
SELECT id, name, city, abbreviation 
FROM teams 
ORDER BY name;
```

### **3. League ID Verification**
Ensure you're working with the correct league:

```sql
-- Verify the league exists
SELECT id, name, season_year 
FROM leagues 
WHERE id = 12335716;
```

## 📋 **Testing Checklist**

- [ ] Run database queries to identify current assignment
- [ ] Find the correct 49ers team ID
- [ ] Update the team assignment in the database
- [ ] Verify the change with a SELECT query
- [ ] Test the `/leagues/12335716/user-team` API endpoint
- [ ] Check the frontend Trade Calculator displays the correct team
- [ ] Verify no other users are affected

## 🔍 **Debugging Tips**

1. **Check the logs** for the `/leagues/{leagueId}/user-team` endpoint
2. **Verify session authentication** is working correctly
3. **Check for caching issues** that might return old data
4. **Ensure database transactions** are committed properly

## 📞 **Support**

If you need help with the SQL queries or backend code, provide:
1. The current database schema for team assignments
2. The backend code for the user-team endpoint
3. Any error messages from the database or API logs

---

**Note**: This is a backend data issue. The frontend is working correctly and will automatically display the correct team once the backend data is fixed.

