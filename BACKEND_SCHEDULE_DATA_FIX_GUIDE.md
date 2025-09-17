# Backend Schedule Data Fix Guide

## Problem Description
The backend is returning incorrect schedule data with several critical issues:

1. **Week 0 exists** - Should be shifted to Week 1
2. **Wrong Week 1 opponent** - Shows "Steelers" instead of "Commanders" 
3. **Unsorted schedule** - Games are not in chronological order
4. **Data integrity issues** - Need to verify all opponents are correct

## Debug Information from Frontend
```
Week 1 game details: {
  away: 'Steelers',
  gameId: '543031341', 
  home: 'Browns',
  isHome: true,
  opponent: 'Steelers',
  result: 'W',
  score: '51-12',
  week: 1
}
```

**Issues Found:**
- `Has Week 0 (should be false): true`
- `Schedule is sorted: false`
- `Weeks in order: [19, 9, 20, 5, 15, 16, 12, 1, 13, 2, 0, 14, 3, 18, 7, 11, 17, 10, 8, 4]`

## Backend Fix Implementation

### 1. Database Query Fix

**File**: `backend/routes/teams.py` or similar team detail endpoint

```python
# Current problematic query (example)
def get_team_schedule(team_id, league_id):
    schedule_query = """
    SELECT 
        week,
        home_team,
        away_team,
        game_id,
        result,
        score
    FROM games 
    WHERE league_id = %s 
    AND (home_team_id = %s OR away_team_id = %s)
    ORDER BY week
    """
    
    # FIX: Add week adjustment and proper sorting
    schedule_query = """
    SELECT 
        CASE 
            WHEN week = 0 THEN 1  -- Shift Week 0 to Week 1
            ELSE week 
        END as week,
        home_team,
        away_team,
        game_id,
        result,
        score,
        CASE 
            WHEN home_team_id = %s THEN true 
            ELSE false 
        END as is_home
    FROM games 
    WHERE league_id = %s 
    AND (home_team_id = %s OR away_team_id = %s)
    ORDER BY week ASC  -- Ensure chronological order
    """
```

### 2. Data Processing Fix

**File**: `backend/routes/teams.py` - Team detail endpoint

```python
def get_team_detail(league_id, team_id):
    # ... existing code ...
    
    # FIX: Process schedule data with week adjustment
    schedule_data = []
    for game in raw_schedule:
        # Shift Week 0 to Week 1
        adjusted_week = 1 if game['week'] == 0 else game['week']
        
        # Determine opponent
        if game['home_team_id'] == team_id:
            opponent = game['away_team']
            is_home = True
        else:
            opponent = game['home_team']
            is_home = False
        
        schedule_item = {
            'week': adjusted_week,
            'home': game['home_team'],
            'away': game['away_team'],
            'opponent': opponent,
            'isHome': is_home,
            'gameId': game['game_id'],
            'result': game['result'],
            'score': game['score']
        }
        schedule_data.append(schedule_item)
    
    # FIX: Sort schedule by week to ensure chronological order
    schedule_data.sort(key=lambda x: x['week'])
    
    # ... rest of response ...
    return {
        'team': team_data,
        'schedule': schedule_data,  # Now properly sorted and adjusted
        # ... other data ...
    }
```

### 3. Database Update Script

**File**: `backend/scripts/fix_schedule_data.sql`

```sql
-- Fix Week 0 games by shifting them to Week 1
UPDATE games 
SET week = 1 
WHERE week = 0;

-- Verify the fix
SELECT 
    league_id,
    home_team,
    away_team,
    week,
    game_id
FROM games 
WHERE league_id = 12335716 
AND (home_team_id = 4 OR away_team_id = 4)
ORDER BY week;

-- Check for any remaining Week 0 games
SELECT COUNT(*) as week_0_games
FROM games 
WHERE week = 0;
```

### 4. Team Name Verification

**File**: `backend/scripts/verify_team_names.sql`

```sql
-- Check all team names in the database
SELECT DISTINCT home_team, away_team 
FROM games 
WHERE league_id = 12335716
ORDER BY home_team, away_team;

-- Look for potential name mismatches
SELECT 
    home_team,
    COUNT(*) as home_games
FROM games 
WHERE league_id = 12335716
GROUP BY home_team
ORDER BY home_team;

SELECT 
    away_team,
    COUNT(*) as away_games
FROM games 
WHERE league_id = 12335716
GROUP BY away_team
ORDER BY away_team;
```

### 5. API Endpoint Fix

**File**: `backend/routes/teams.py` - Complete fix

```python
@teams_bp.route('/leagues/<int:league_id>/teams/<int:team_id>/detail', methods=['GET'])
def get_team_detail(league_id, team_id):
    try:
        # Get team basic info
        team_query = """
        SELECT t.*, u.email as user_email
        FROM teams t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s AND t.league_id = %s
        """
        team_result = db.execute_query(team_query, (team_id, league_id))
        
        if not team_result:
            return jsonify({'error': 'Team not found'}), 404
        
        team_data = team_result[0]
        
        # FIX: Get schedule with proper week handling and sorting
        schedule_query = """
        SELECT 
            CASE 
                WHEN week = 0 THEN 1  -- Shift Week 0 to Week 1
                ELSE week 
            END as week,
            ht.name as home_team,
            at.name as away_team,
            g.game_id,
            g.result,
            g.score,
            CASE 
                WHEN g.home_team_id = %s THEN true 
                ELSE false 
            END as is_home
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        WHERE g.league_id = %s 
        AND (g.home_team_id = %s OR g.away_team_id = %s)
        ORDER BY week ASC
        """
        
        schedule_result = db.execute_query(schedule_query, (team_id, league_id, team_id, team_id))
        
        # Process schedule data
        schedule_data = []
        for game in schedule_result:
            # Determine opponent
            if game['is_home']:
                opponent = game['away_team']
            else:
                opponent = game['home_team']
            
            schedule_item = {
                'week': game['week'],
                'home': game['home_team'],
                'away': game['away_team'],
                'opponent': opponent,
                'isHome': game['is_home'],
                'gameId': game['game_id'],
                'result': game['result'],
                'score': game['score']
            }
            schedule_data.append(schedule_item)
        
        # FIX: Ensure schedule is sorted (double-check)
        schedule_data.sort(key=lambda x: x['week'])
        
        # ... rest of team detail logic ...
        
        return jsonify({
            'team': team_data,
            'schedule': schedule_data,  # Now properly sorted and adjusted
            # ... other data ...
        })
        
    except Exception as e:
        logger.error(f"Error fetching team detail: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
```

### 6. Data Validation Script

**File**: `backend/scripts/validate_schedule_data.py`

```python
#!/usr/bin/env python3
"""
Script to validate schedule data integrity
"""

import psycopg2
import json
from typing import List, Dict

def validate_schedule_data(league_id: int, team_id: int):
    """Validate schedule data for a specific team"""
    
    conn = psycopg2.connect(
        host="your_host",
        database="your_db",
        user="your_user",
        password="your_password"
    )
    
    cursor = conn.cursor()
    
    # Check for Week 0 games
    cursor.execute("""
        SELECT COUNT(*) FROM games 
        WHERE league_id = %s AND week = 0
    """, (league_id,))
    week_0_count = cursor.fetchone()[0]
    
    # Get schedule data
    cursor.execute("""
        SELECT 
            week,
            ht.name as home_team,
            at.name as away_team,
            game_id
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        WHERE g.league_id = %s 
        AND (g.home_team_id = %s OR g.away_team_id = %s)
        ORDER BY week
    """, (league_id, team_id, team_id))
    
    schedule = cursor.fetchall()
    
    # Validation results
    results = {
        'league_id': league_id,
        'team_id': team_id,
        'week_0_games': week_0_count,
        'total_games': len(schedule),
        'weeks': [game[0] for game in schedule],
        'is_sorted': schedule == sorted(schedule, key=lambda x: x[0]),
        'week_1_opponent': None
    }
    
    # Find Week 1 opponent
    week_1_games = [game for game in schedule if game[0] == 1]
    if week_1_games:
        week_1_game = week_1_games[0]
        if week_1_game[1] == 'Browns':  # If Browns are home
            results['week_1_opponent'] = week_1_game[2]  # Away team
        else:
            results['week_1_opponent'] = week_1_game[1]  # Home team
    
    cursor.close()
    conn.close()
    
    return results

if __name__ == "__main__":
    # Validate Cleveland Browns schedule
    results = validate_schedule_data(12335716, 4)
    print(json.dumps(results, indent=2))
```

### 7. Testing Endpoints

**File**: `backend/tests/test_schedule_fix.py`

```python
import pytest
import json
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    with app.test_client() as client:
        yield client

def test_team_schedule_no_week_0(client):
    """Test that no Week 0 games are returned"""
    response = client.get('/leagues/12335716/teams/4/detail')
    data = json.loads(response.data)
    
    schedule = data['schedule']
    week_0_games = [game for game in schedule if game['week'] == 0]
    
    assert len(week_0_games) == 0, "No Week 0 games should be returned"

def test_team_schedule_sorted(client):
    """Test that schedule is returned in chronological order"""
    response = client.get('/leagues/12335716/teams/4/detail')
    data = json.loads(response.data)
    
    schedule = data['schedule']
    weeks = [game['week'] for game in schedule]
    
    assert weeks == sorted(weeks), "Schedule should be sorted by week"

def test_week_1_opponent(client):
    """Test that Week 1 opponent is correct"""
    response = client.get('/leagues/12335716/teams/4/detail')
    data = json.loads(response.data)
    
    schedule = data['schedule']
    week_1_game = next((game for game in schedule if game['week'] == 1), None)
    
    assert week_1_game is not None, "Week 1 game should exist"
    assert week_1_game['opponent'] == 'Commanders', f"Week 1 opponent should be Commanders, got {week_1_game['opponent']}"
```

## Implementation Steps

### Step 1: Database Fix
1. Run the SQL script to shift Week 0 games to Week 1
2. Verify no Week 0 games remain
3. Check team name consistency

### Step 2: Code Update
1. Update the team detail endpoint with proper week handling
2. Add sorting to ensure chronological order
3. Fix opponent determination logic

### Step 3: Testing
1. Run the validation script
2. Test the API endpoint
3. Verify frontend receives correct data

### Step 4: Deployment
1. Deploy backend changes
2. Test with frontend
3. Verify schedule displays correctly

## Expected Results

After implementing these fixes:

1. **No Week 0 games** - All games start from Week 1
2. **Correct Week 1 opponent** - Shows "Commanders" instead of "Steelers"
3. **Sorted schedule** - Games in chronological order (1, 2, 3, 4...)
4. **Proper opponent names** - All team names are correct and consistent

## Debug Verification

The frontend debug logs should show:
```
Has Week 0 (should be false): false
Schedule is sorted: true
Week 1 game details: {opponent: 'Commanders', ...}
Weeks in order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
```

## Files to Modify

1. `backend/routes/teams.py` - Main team detail endpoint
2. `backend/scripts/fix_schedule_data.sql` - Database fix script
3. `backend/scripts/verify_team_names.sql` - Team name verification
4. `backend/scripts/validate_schedule_data.py` - Validation script
5. `backend/tests/test_schedule_fix.py` - Test cases

## Priority

**HIGH PRIORITY** - This affects the core schedule functionality and user experience. The frontend is working correctly but displaying incorrect backend data.



