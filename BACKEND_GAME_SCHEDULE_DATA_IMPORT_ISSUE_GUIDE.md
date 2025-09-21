# Backend Game Schedule Data Import Issue - Investigation Guide

## 🚨 **Critical Issue Identified**

The frontend is correctly displaying data from the backend, but the backend is **not processing game schedule data** from the companion app import. This is why game results and scores are showing as `null` despite successful data import.

## 📊 **Evidence from Backend Logs**

### ✅ **What's Working**
- Companion app data import is successful
- Player stats are being processed and updated
- Team stats are being processed and updated
- League data is being processed

### ❌ **What's Broken**
```
INFO:companion_routes:No game schedule data found in payload.
INFO:companion_routes:No gameScheduleInfoList data found in payload.
INFO:parsers.parse_stats:No game schedule records found
```

## 🔍 **Investigation Steps**

### 1. **Check Companion App Payload Structure**

**Location**: `companion_routes.py` - Look for the payload processing logic

**Issue**: The parser is not finding `gameScheduleInfoList` in the payload, but the logs show it should be there.

**Debug Steps**:
```python
# Add detailed logging to see what's actually in the payload
print(f"Full payload keys: {list(payload.keys())}")
print(f"Payload structure: {json.dumps(payload, indent=2)}")
```

### 2. **Verify Game Schedule Data Format**

**Expected Structure**:
```json
{
  "gameScheduleInfoList": [
    {
      "week_index": 1,
      "home_team_id": 4,
      "away_team_id": 2,
      "home_score": 24,
      "away_score": 21,
      "status": "completed",
      "schedule_id": "543031001"
    }
  ]
}
```

**Check**: Is the companion app sending data in this exact format?

### 3. **Fix Parser Logic**

**Location**: `parsers/parse_stats.py` - Look for game schedule processing

**Current Issue**: The parser is looking for `gameScheduleInfoList` but not finding it.

**Potential Fixes**:
```python
# Check if the key exists with different casing
if 'gameScheduleInfoList' in payload:
    # Process game schedule data
elif 'game_schedule_info_list' in payload:
    # Process with snake_case
elif 'gameSchedule' in payload:
    # Process with different key name
```

### 4. **Database Schema Verification**

**Check**: Does the `games` table exist and have the correct columns?

**Required Columns**:
- `week_index` (INTEGER)
- `home_team_id` (INTEGER)
- `away_team_id` (INTEGER)
- `home_score` (INTEGER)
- `away_score` (INTEGER)
- `status` (VARCHAR)
- `schedule_id` (VARCHAR)

### 5. **Test Game Schedule Processing**

**Add Test Endpoint**:
```python
@app.route('/debug/game-schedule', methods=['POST'])
def debug_game_schedule():
    payload = request.get_json()
    
    # Log the full payload
    print(f"DEBUG: Full payload: {json.dumps(payload, indent=2)}")
    
    # Check for game schedule data
    if 'gameScheduleInfoList' in payload:
        print(f"DEBUG: Found gameScheduleInfoList with {len(payload['gameScheduleInfoList'])} games")
        for game in payload['gameScheduleInfoList']:
            print(f"DEBUG: Game: {game}")
    else:
        print("DEBUG: No gameScheduleInfoList found in payload")
        print(f"DEBUG: Available keys: {list(payload.keys())}")
    
    return jsonify({"status": "debug_complete"})
```

## 🛠️ **Immediate Fixes Needed**

### 1. **Fix Parser Key Detection**
```python
# In parse_stats.py
def process_game_schedule(payload):
    # Check multiple possible key names
    game_data = None
    for key in ['gameScheduleInfoList', 'game_schedule_info_list', 'gameSchedule', 'games']:
        if key in payload:
            game_data = payload[key]
            break
    
    if not game_data:
        print(f"WARNING: No game schedule data found. Available keys: {list(payload.keys())}")
        return
    
    # Process game data
    for game in game_data:
        # Insert/update game in database
        pass
```

### 2. **Add Database Insertion Logic**
```python
def insert_game_schedule(game_data, league_id):
    for game in game_data:
        # Insert into games table
        query = """
        INSERT INTO games (league_id, week_index, home_team_id, away_team_id, 
                          home_score, away_score, status, schedule_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (league_id, schedule_id) 
        DO UPDATE SET
            home_score = excluded.home_score,
            away_score = excluded.away_score,
            status = excluded.status
        """
        # Execute query
```

### 3. **Update Team Records Calculation**
```python
def calculate_team_records(league_id):
    # Query games table to calculate wins/losses/ties
    # Update teams table with correct records
    pass
```

## 🧪 **Testing Steps**

### 1. **Test Companion App Payload**
- Send a test payload with game schedule data
- Verify the parser can find and process it

### 2. **Test Database Insertion**
- Manually insert a test game record
- Verify it appears in the frontend

### 3. **Test Full Flow**
- Import data from companion app
- Verify games are stored in database
- Verify frontend displays correct data

## 📝 **Expected Outcome**

After fixing these issues:
- Game results and scores should be stored in the database
- Team records should be calculated correctly
- Frontend should display actual game data instead of placeholders

## 🔗 **Related Files to Check**

1. `companion_routes.py` - Payload processing
2. `parsers/parse_stats.py` - Game schedule parsing
3. `database/schema.sql` - Games table structure
4. `routes/leagues.py` - Team detail endpoint

## ⚠️ **Critical Notes**

- The frontend cache busting is working perfectly
- The issue is 100% on the backend data processing side
- Game schedule data is being sent but not processed
- This is preventing game results from being stored in the database

## 🎯 **Priority**

**HIGH** - This is blocking the core functionality of displaying game results and team records.

