# Team Detail Backend API - Missing Data Fix

## Current Issue
The `/leagues/{league_id}/teams/{team_id}/detail` endpoint is returning empty objects for critical data sections:
- `capInformation: ()` - Team salary cap data
- `defensiveStats: ()` - Team defensive statistics  
- `offensiveStats: ()` - Team offensive statistics
- `leaders: (-)` - Team statistical leaders
- `mostExpensive: []` - Most expensive players
- `upcomingFreeAgents: []` - Upcoming free agents

## Required Backend Updates

### 1. Fix Cap Information Data
The `capInformation` object should be populated with actual financial data:

```sql
-- Query to get team cap information
SELECT 
    SUM(p.cap_hit) as total_cap_hit,
    SUM(p.contract_salary) as total_salary,
    SUM(p.contract_bonus) as total_bonus,
    (625000000 - SUM(p.cap_hit)) as cap_room,
    SUM(p.cap_hit) as spent,
    (625000000 - SUM(p.cap_hit)) as available
FROM players p
WHERE p.league_id = ? AND p.team_id = ? AND p.is_active = true
```

**Expected Response:**
```json
{
  "capInformation": {
    "capRoom": 315400000,
    "spent": 309620000,
    "available": 5780000,
    "totalSalary": 436000000,
    "totalBonus": 42800000
  }
}
```

### 2. Fix Offensive/Defensive Statistics
The `offensiveStats` and `defensiveStats` objects need actual game statistics:

```sql
-- Query for offensive stats (points scored, yards gained)
SELECT 
    SUM(CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END) as points,
    -- Add yards calculations from game stats
    COUNT(*) as games_played
FROM games g
WHERE g.league_id = ? AND (g.home_team_id = ? OR g.away_team_id = ?) AND g.is_complete = true

-- Query for defensive stats (points allowed, yards allowed)  
SELECT 
    SUM(CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END) as points_allowed,
    -- Add yards allowed calculations
    COUNT(*) as games_played
FROM games g
WHERE g.league_id = ? AND (g.home_team_id = ? OR g.away_team_id = ?) AND g.is_complete = true
```

**Expected Response:**
```json
{
  "offensiveStats": {
    "points": 425,
    "pointsRank": 7,
    "yards": 6120,
    "yardsRank": 19,
    "passingYards": 4125,
    "passingYardsRank": 14,
    "rushingYards": 1995,
    "rushingYardsRank": 25
  },
  "defensiveStats": {
    "points": 22,
    "pointsRank": 8,
    "yards": 5178,
    "yardsRank": 7,
    "passingYards": 4125,
    "passingYardsRank": 20,
    "rushingYards": 1053,
    "rushingYardsRank": 3
  }
}
```

### 3. Fix Team Leaders Data
The `leaders` object should contain statistical leaders:

```sql
-- Query for passing leader
SELECT 
    p.name as player,
    p.position,
    -- Add passing yards from stats table
    MAX(ps.passing_yards) as yards
FROM players p
LEFT JOIN player_stats ps ON p.id = ps.player_id
WHERE p.league_id = ? AND p.team_id = ? AND p.position IN ('QB')
GROUP BY p.id, p.name, p.position
ORDER BY yards DESC
LIMIT 1

-- Similar queries for rushing, receiving, tackles, sacks, interceptions
```

**Expected Response:**
```json
{
  "leaders": {
    "passing": {
      "player": "Kaidon Salter",
      "position": "QB",
      "yards": 4125
    },
    "rushing": {
      "player": "Tony Pollard",
      "position": "HB",
      "yards": 1247
    },
    "receiving": {
      "player": "DeAndre Hopkins",
      "position": "WR",
      "yards": 1156
    },
    "tackles": {
      "player": "Azeez Al-Shaair",
      "position": "LOLB",
      "tackles": 127
    },
    "sacks": {
      "player": "Harold Landry III",
      "position": "ROLB",
      "sacks": 12.5
    },
    "interceptions": {
      "player": "Roger McCreary",
      "position": "CB",
      "interceptions": 4
    }
  }
}
```

### 4. Fix Most Expensive Players
The `mostExpensive` array should contain players sorted by cap hit:

```sql
-- Query for most expensive players
SELECT 
    p.name as player,
    p.position,
    p.dev_trait as devTrait,
    p.overall,
    p.cap_hit as capHit,
    p.contract_salary as salary,
    p.contract_bonus as bonus,
    p.contract_years_left as yearsLeft,
    p.contract_length as contractLength
FROM players p
WHERE p.league_id = ? AND p.team_id = ? AND p.is_active = true
ORDER BY p.cap_hit DESC
LIMIT 10
```

**Expected Response:**
```json
{
  "mostExpensive": [
    {
      "player": "Kaidon Salter",
      "position": "QB",
      "devTrait": "Superstar",
      "overall": 95,
      "capHit": 26.48,
      "salary": 43.6,
      "bonus": 42.8,
      "yearsLeft": 3,
      "contractLength": 4
    }
  ]
}
```

### 5. Fix Upcoming Free Agents
The `upcomingFreeAgents` array should contain players with expiring contracts:

```sql
-- Query for upcoming free agents (contracts expiring soon)
SELECT 
    p.name as player,
    p.position,
    p.dev_trait as devTrait,
    p.overall,
    p.cap_hit as capHit,
    p.contract_salary as salary,
    p.contract_bonus as bonus,
    p.contract_years_left as yearsLeft,
    p.contract_length as contractLength
FROM players p
WHERE p.league_id = ? AND p.team_id = ? AND p.is_active = true AND p.contract_years_left <= 1
ORDER BY p.contract_years_left ASC, p.cap_hit DESC
LIMIT 10
```

## Implementation Notes

1. **Database Schema**: Ensure the `players` table has these fields:
   - `cap_hit` (BIGINT)
   - `contract_salary` (BIGINT) 
   - `contract_bonus` (BIGINT)
   - `contract_years_left` (INTEGER)
   - `contract_length` (INTEGER)

2. **Game Statistics**: If game stats are stored separately, join with the appropriate tables to get offensive/defensive statistics.

3. **Ranking Logic**: Calculate rankings by comparing team stats against all other teams in the league.

4. **Error Handling**: Return empty arrays/objects if no data is found, but ensure the structure is consistent.

5. **Performance**: Consider caching frequently accessed data like team statistics and rankings.

## Testing

Test with the Titans team (ID: 6) in league 12335716 to verify all sections populate correctly:
- Cap Information should show actual dollar amounts
- Offense/Defense stats should show non-zero values with proper rankings
- Leaders should show actual player names and statistics
- Most Expensive should show players sorted by cap hit
- Upcoming Free Agents should show players with expiring contracts 