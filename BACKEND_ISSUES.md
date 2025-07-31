# Backend Issues

## Current Issues

### 1. Team Detail API Inconsistency
- **Issue**: The team detail API returns different field names than expected
- **Impact**: Frontend cannot properly display team information
- **Status**: Frontend has workarounds in place

### 2. Stats Leaders Defensive Data Issue
- **Issue**: The defensive stats API (`/stats-leaders?type=teams&category=defensive&stat=yards_allowed`) is returning incorrect data
- **Symptoms**: 
  - `total_yards_allowed`, `passing_yards_allowed`, and `rushing_yards_allowed` all return the same value (e.g., 360)
  - `yards_allowed_per_game` returns very low values (e.g., 1.87) that don't make sense for NFL statistics
  - `points_allowed_per_game` returns `'0E-20'` string instead of numeric values
- **Impact**: The "Yards Allowed Leaders" table displays incorrect or misleading statistics
- **Evidence**: Console logs show API returning `{total_yards_allowed: 360, passing_yards_allowed: 360, rushing_yards_allowed: 360, yards_allowed_per_game: 1.8652849740932642}`
- **Status**: Frontend is correctly processing the data, but the backend is providing incorrect values

### 3. Player Team Name Missing
- **Issue**: Player statistics API does not include team names for players
- **Impact**: Team logos cannot be displayed in player statistics tables
- **Status**: Frontend has workarounds in place

## Frontend Workarounds

The frontend has been updated with workarounds for both issues, but these are temporary solutions. The proper fix requires backend changes to ensure API consistency and correct database queries.

## Recommended Backend Fixes

1. **Fix Defensive Stats Calculation**: Ensure the defensive stats API properly calculates and returns:
   - Correct `total_yards_allowed` (sum of passing + rushing yards allowed)
   - Correct `passing_yards_allowed` (only passing yards)
   - Correct `rushing_yards_allowed` (only rushing yards)
   - Correct `yards_allowed_per_game` (total yards allowed / games played)
   - Numeric `points_allowed_per_game` values

2. **Include Player Team Names**: Ensure player statistics include the player's team name in the response

3. **Standardize Field Names**: Ensure all APIs use consistent field naming conventions 