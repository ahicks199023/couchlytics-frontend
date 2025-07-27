# Team Detail Backend API Implementation Prompt

## Overview
I need to implement comprehensive backend API endpoints to support a detailed team page similar to the screenshots provided. The frontend expects multiple endpoints to fetch different aspects of team data.

## Required API Endpoints

### 1. Team Detail Information
```
GET /leagues/{leagueId}/teams/{teamId}
```

**Response Structure:**
```json
{
  "teamId": 123,
  "teamName": "Browns",
  "city": "Cleveland",
  "abbreviation": "CLE",
  "conference": "AFC",
  "division": "AFC North",
  "overall": 97,
  "leagueRank": 14,
  "record": {
    "wins": 11,
    "losses": 6,
    "ties": 0,
    "winPercentage": 0.647
  },
  "owner": {
    "name": "CPG TWON",
    "username": "cpgtwon"
  },
  "schemes": {
    "offense": "Multiple Zone Run",
    "defense": "Base 4-3"
  },
  "roster": {
    "total": 53,
    "active": 53,
    "injured": 0
  },
  "cap": {
    "room": 315400000,
    "spent": 309620000,
    "available": 5780000,
    "total": 625000000
  },
  "teamNotes": "None",
  "tradeBlockComments": "None"
}
```

### 2. Team Roster
```
GET /leagues/{leagueId}/teams/{teamId}/roster
```

**Response Structure:**
```json
[
  {
    "playerId": 123456,
    "playerName": "Mike Hall Jr",
    "position": "DT",
    "jerseyNumber": 51,
    "devTrait": "Superstar",
    "overall": 99,
    "age": 23,
    "height": 75,
    "speed": 78,
    "capHit": 26480000,
    "salary": 43600000,
    "bonus": 42800000,
    "yearsLeft": 3,
    "contractLength": 4,
    "value": 26480000,
    "headshotUrl": "https://example.com/headshot.jpg"
  }
]
```

### 3. Team Schedule/Games
```
GET /leagues/{leagueId}/teams/{teamId}/schedule
```

**Response Structure:**
```json
[
  {
    "week": 1,
    "opponent": "Cincinnati Bengals",
    "opponentAbbr": "CIN",
    "result": "W 28-24",
    "homeScore": 28,
    "awayScore": 24,
    "isHome": true,
    "date": "2024-09-08",
    "time": "1:00 PM"
  }
]
```

### 4. Team Stat Leaders
```
GET /leagues/{leagueId}/teams/{teamId}/stat-leaders
```

**Response Structure:**
```json
[
  {
    "playerName": "Kaidon Salter",
    "position": "QB",
    "value": 5111,
    "teamAbbr": "CLE",
    "headshotUrl": "https://example.com/headshot.jpg"
  }
]
```

### 5. Team Trade Block
```
GET /leagues/{leagueId}/teams/{teamId}/trade-block
```

**Response Structure:**
```json
[
  {
    "playerId": 123456,
    "playerName": "Player Name",
    "position": "WR",
    "devTrait": "Star",
    "overall": 85,
    "age": 25,
    "height": 72,
    "speed": 88,
    "value": 15000000
  }
]
```

## Database Queries Needed

### 1. Team Detail Query
```sql
SELECT 
  t.team_id,
  t.name as team_name,
  t.city,
  t.abbrev as abbreviation,
  t.conference,
  t.division,
  t.overall_rating as overall,
  t.league_rank,
  t.wins,
  t.losses,
  t.ties,
  t.win_percentage,
  u.first_name || ' ' || u.last_name as owner_name,
  u.email as owner_username,
  t.offense_scheme,
  t.defense_scheme,
  COUNT(p.id) as roster_total,
  COUNT(CASE WHEN p.is_active = true THEN 1 END) as roster_active,
  COUNT(CASE WHEN p.is_on_ir = true THEN 1 END) as roster_injured,
  t.cap_room,
  t.cap_spent,
  t.cap_available,
  t.salary_cap as cap_total,
  t.team_notes,
  t.trade_block_comments
FROM teams t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN players p ON t.team_id = p.team_id AND p.league_id = t.league_id
WHERE t.league_id = :league_id AND t.team_id = :team_id
GROUP BY t.team_id, t.name, t.city, t.abbrev, t.conference, t.division, 
         t.overall_rating, t.league_rank, t.wins, t.losses, t.ties, t.win_percentage,
         u.first_name, u.last_name, u.email, t.offense_scheme, t.defense_scheme,
         t.cap_room, t.cap_spent, t.cap_available, t.salary_cap, t.team_notes, t.trade_block_comments
```

### 2. Team Roster Query
```sql
SELECT 
  p.id as player_id,
  p.name as player_name,
  p.position,
  p.jersey_number,
  p.dev_trait,
  p.overall,
  p.age,
  p.height,
  p.rating_speed as speed,
  p.cap_hit,
  p.contract_salary as salary,
  p.contract_bonus as bonus,
  p.contract_years_left as years_left,
  p.contract_length,
  p.value,
  p.headshot_url
FROM players p
WHERE p.league_id = :league_id AND p.team_id = :team_id
ORDER BY p.overall DESC, p.name ASC
```

### 3. Team Schedule Query
```sql
SELECT 
  g.week,
  CASE 
    WHEN g.home_team_id = :team_id THEN g.away_team_name
    ELSE g.home_team_name
  END as opponent,
  CASE 
    WHEN g.home_team_id = :team_id THEN g.away_team_abbr
    ELSE g.home_team_abbr
  END as opponent_abbr,
  CASE 
    WHEN g.is_complete = true THEN
      CASE 
        WHEN (g.home_team_id = :team_id AND g.home_score > g.away_score) OR
             (g.away_team_id = :team_id AND g.away_score > g.home_score) THEN 'W'
        ELSE 'L'
      END || ' ' || GREATEST(g.home_score, g.away_score) || '-' || LEAST(g.home_score, g.away_score)
    ELSE NULL
  END as result,
  g.home_score,
  g.away_score,
  g.home_team_id = :team_id as is_home,
  g.game_date,
  g.game_time
FROM games g
WHERE g.league_id = :league_id 
  AND (g.home_team_id = :team_id OR g.away_team_id = :team_id)
ORDER BY g.week ASC
```

### 4. Team Stat Leaders Query
```sql
-- For passing yards
SELECT 
  p.name as player_name,
  p.position,
  ps.total_value as value,
  t.abbrev as team_abbr,
  p.headshot_url
FROM player_stat_totals ps
JOIN players p ON ps.player_id = p.id
JOIN teams t ON p.team_id = t.team_id
WHERE ps.league_id = :league_id 
  AND p.team_id = :team_id
  AND ps.stat_category = 'passing'
  AND ps.stat_type = 'yards'
ORDER BY ps.total_value DESC
LIMIT 3

-- For rushing yards
SELECT 
  p.name as player_name,
  p.position,
  ps.total_value as value,
  t.abbrev as team_abbr,
  p.headshot_url
FROM player_stat_totals ps
JOIN players p ON ps.player_id = p.id
JOIN teams t ON p.team_id = t.team_id
WHERE ps.league_id = :league_id 
  AND p.team_id = :team_id
  AND ps.stat_category = 'rushing'
  AND ps.stat_type = 'yards'
ORDER BY ps.total_value DESC
LIMIT 3

-- For receiving yards
SELECT 
  p.name as player_name,
  p.position,
  ps.total_value as value,
  t.abbrev as team_abbr,
  p.headshot_url
FROM player_stat_totals ps
JOIN players p ON ps.player_id = p.id
JOIN teams t ON p.team_id = t.team_id
WHERE ps.league_id = :league_id 
  AND p.team_id = :team_id
  AND ps.stat_category = 'receiving'
  AND ps.stat_type = 'yards'
ORDER BY ps.total_value DESC
LIMIT 3
```

### 5. Team Trade Block Query
```sql
SELECT 
  p.id as player_id,
  p.name as player_name,
  p.position,
  p.dev_trait,
  p.overall,
  p.age,
  p.height,
  p.rating_speed as speed,
  p.value
FROM players p
WHERE p.league_id = :league_id 
  AND p.team_id = :team_id
  AND p.is_on_trade_block = true
ORDER BY p.overall DESC
```

## Implementation Notes

### 1. Database Schema Updates
You may need to add these columns to your existing tables:

**teams table:**
- `overall_rating` (INTEGER)
- `league_rank` (INTEGER)
- `offense_scheme` (VARCHAR)
- `defense_scheme` (VARCHAR)
- `cap_room` (BIGINT)
- `cap_spent` (BIGINT)
- `cap_available` (BIGINT)
- `salary_cap` (BIGINT)
- `team_notes` (TEXT)
- `trade_block_comments` (TEXT)

**players table:**
- `jersey_number` (INTEGER)
- `is_on_trade_block` (BOOLEAN)
- `value` (BIGINT)

### 2. API Response Formatting
- Convert snake_case database fields to camelCase in API responses
- Format currency values as integers (cents) or use proper formatting
- Handle null/empty values gracefully
- Include proper error handling for missing teams/players

### 3. Authentication & Authorization
- Ensure all endpoints require authentication
- Verify user has access to the specified league
- Check if user is a member of the league

### 4. Performance Considerations
- Add database indexes on frequently queried fields
- Consider caching for static data like team details
- Use pagination for large rosters if needed
- Optimize queries to minimize database calls

## Testing
Test with the following team ID: `123` in league `12335716`

The frontend will make multiple API calls to populate the team detail page, so ensure all endpoints return the expected data structure. 