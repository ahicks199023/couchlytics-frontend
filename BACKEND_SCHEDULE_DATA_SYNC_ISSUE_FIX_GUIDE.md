# Backend Schedule Data Sync Issue Fix Guide

## Problem Summary
The frontend is showing hardcoded schedule data with placeholder team records (0-20-0) and no game scores, despite successful data import from the companion app. The backend logs show data is being processed but not properly synced to the frontend.

## Key Issues Identified

### 1. Schedule Data Processing Issues
- **Frontend shows**: Hardcoded schedule with no scores, placeholder record (0-20-0)
- **Backend logs show**: Game schedule data is being received but not properly processed
- **Root cause**: Game schedule records are being skipped due to missing `rosterId/id` fields

### 2. Team Record Data Issues
- **Frontend shows**: Placeholder record (0-20-0)
- **Backend logs show**: Team stats are being updated but not reflected in team records
- **Root cause**: Team record calculation may not be using the updated team stats

### 3. Game Score Display Issues
- **Frontend shows**: No game scores displayed
- **Backend logs show**: Game schedule data with scores but not being processed correctly
- **Root cause**: Game schedule parsing is skipping records due to field validation

## Backend Investigation Steps

### Step 1: Check Game Schedule Data Processing
```sql
-- Check if game schedule data exists in database
SELECT * FROM game_schedules 
WHERE league_id = 12335716 
ORDER BY week_index, schedule_id;

-- Check for any game schedule records with scores
SELECT schedule_id, week_index, home_team_id, away_team_id, 
       home_score, away_score, status
FROM game_schedules 
WHERE league_id = 12335716 
  AND (home_score IS NOT NULL OR away_score IS NOT NULL)
ORDER BY week_index;
```

### Step 2: Verify Team Stats Updates
```sql
-- Check team stats table for recent updates
SELECT team_id, total_wins, total_losses, total_ties, week_index
FROM team_stats 
WHERE league_id = 12335716 
ORDER BY team_id, week_index DESC;

-- Check if team records are being calculated correctly
SELECT t.id, t.name, 
       COALESCE(ts.total_wins, 0) as wins,
       COALESCE(ts.total_losses, 0) as losses,
       COALESCE(ts.total_ties, 0) as ties
FROM teams t
LEFT JOIN team_stats ts ON t.id = ts.team_id 
WHERE t.league_id = 12335716
ORDER BY t.id;
```

### Step 3: Check Game Schedule Parsing Logic
The backend logs show this critical issue:
```
WARNING:parsers.parse_player_stats:Player stat record 1 missing rosterId/id, skipping. 
Available fields: ['status', 'away_score', 'away_team_id', 'week_index', 'home_score', 'home_team_id', 'schedule_id', 'season_index', 'is_game_of_the_week', 'stage_index', '_category']
```

**Issue**: Game schedule records are being processed as "player stats" instead of game schedule records, causing them to be skipped.

### Step 4: Fix Game Schedule Processing
The backend needs to be updated to properly handle game schedule data:

1. **Separate game schedule processing from player stats**
2. **Use correct field validation for game schedules**
3. **Ensure game schedule records are inserted/updated in the correct table**

## Backend Code Fixes Needed

### Fix 1: Game Schedule Parser
```python
# In parsers/parse_games.py or similar
def process_game_schedule_data(payload, league_id):
    """Process game schedule data separately from player stats"""
    if 'gameScheduleInfoList' in payload:
        game_schedules = payload['gameScheduleInfoList']
        
        for game in game_schedules:
            # Validate required fields for game schedules
            required_fields = ['schedule_id', 'week_index', 'home_team_id', 'away_team_id']
            if all(field in game for field in required_fields):
                # Process game schedule record
                process_game_schedule_record(game, league_id)
            else:
                logger.warning(f"Game schedule record missing required fields: {game}")
```

### Fix 2: Team Record Calculation
```python
# Ensure team records are calculated from team stats
def calculate_team_record(team_id, league_id):
    """Calculate team record from team stats"""
    team_stats = get_team_stats(team_id, league_id)
    
    if team_stats:
        wins = team_stats.get('total_wins', 0)
        losses = team_stats.get('total_losses', 0)
        ties = team_stats.get('total_ties', 0)
        
        return f"{wins}-{losses}-{ties}"
    
    return "0-0-0"  # Default if no stats
```

### Fix 3: API Endpoint Data Structure
Ensure the team detail endpoint returns:
```json
{
  "team": {
    "id": 4,
    "name": "Browns",
    "record": "2-1-0",  // Calculated from team stats
    "schedule": [
      {
        "week": 1,
        "opponent": "Commanders",
        "home_score": 24,
        "away_score": 21,
        "result": "W"
      }
    ]
  }
}
```

## Frontend Debugging Steps

### Step 1: Check API Response
Add logging to see what data the frontend is receiving:
```javascript
console.log('Team detail API response:', response.data);
console.log('Schedule data:', response.data.team?.schedule);
console.log('Team record:', response.data.team?.record);
```

### Step 2: Verify Data Structure
Ensure the frontend is looking for the correct data structure:
```javascript
// Check if schedule data exists
if (teamData?.schedule && Array.isArray(teamData.schedule)) {
  console.log('Schedule data found:', teamData.schedule);
} else {
  console.log('No schedule data found in teamData:', teamData);
}
```

## Immediate Actions Required

1. **Check database for game schedule data**
2. **Verify team stats are being updated correctly**
3. **Fix game schedule parsing logic in backend**
4. **Ensure team record calculation uses updated stats**
5. **Test API endpoints return correct data structure**

## Testing Steps

1. **Re-import data from companion app**
2. **Check database for proper data insertion**
3. **Test team detail API endpoint directly**
4. **Verify frontend receives correct data**
5. **Clear frontend cache and refresh**

## Expected Results After Fix

- Team records should show actual win/loss records
- Game scores should be displayed in schedule
- Schedule should show real opponent data
- No more placeholder data (0-20-0)

## Backend Logs to Monitor

Look for these success indicators:
- `✅ Game schedule records inserted/updated`
- `✅ Team stats updated successfully`
- `✅ Team record calculated correctly`
- No more `WARNING: Player stat record missing rosterId/id` for game schedules

## Contact Information

If issues persist after implementing these fixes, provide:
1. Updated backend logs after fixes
2. Database query results
3. API endpoint response samples
4. Frontend console output
