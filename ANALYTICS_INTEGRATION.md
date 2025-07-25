# Couchlytics Analytics Integration

This document outlines the complete analytics integration for the Couchlytics frontend, including API endpoints, components, and usage instructions.

## Overview

The analytics integration provides four main features:
1. **League Standings** - Conference/division standings with team records
2. **Team Stats** - Team statistics, roster information, and performance metrics
3. **Team Salary Cap** - Salary cap management and player contracts
4. **Player Individual Stats** - Detailed player statistics by position

## API Endpoints

### Base Configuration
- **Base URL**: `https://api.couchlytics.com`
- **Test League ID**: `12335716`
- **Authentication**: Uses cookies (credentials: 'include')

### Available Endpoints

#### 1. League Standings
```
GET /leagues/{leagueId}/standings
```
**Status**: ✅ Working
**Response**: Conference/division structure with team records

#### 2. Team Stats
```
GET /leagues/{leagueId}/teams/{teamId}/stats
```
**Status**: ✅ Working
**Response**: Team statistics, roster size, offense/defense stats

#### 3. Team Salary Cap
```
GET /leagues/{leagueId}/teams/{teamId}/salary-cap
```
**Status**: ✅ Working
**Response**: Cap space, player count, financial data

#### 4. Player Individual Stats
```
GET /leagues/{leagueId}/players/{playerId}/stats
```
**Status**: ❌ 404 (needs real player ID)
**Response**: Individual player statistics

## File Structure

```
src/
├── types/
│   └── analytics.ts          # TypeScript interfaces for API responses
├── lib/
│   └── analytics.ts          # Analytics API service layer
├── components/
│   ├── AnalyticsDashboard.tsx    # Main dashboard component
│   ├── LeagueStandings.tsx       # League standings display
│   ├── TeamStats.tsx             # Team statistics component
│   ├── TeamSalaryCap.tsx         # Salary cap management
│   └── PlayerStats.tsx           # Individual player stats
└── app/
    ├── analytics-engine/
    │   └── page.tsx              # Global analytics page
    └── leagues/[leagueId]/analytics/
        └── page.tsx              # League-specific analytics
```

## Components

### AnalyticsDashboard
The main dashboard component that provides navigation between all analytics features.

**Props:**
- `leagueId`: League ID (required)
- `initialView`: Starting view ('standings', 'team-stats', 'salary-cap', 'player-stats')
- `teamId`: Pre-selected team ID (optional)
- `playerId`: Pre-selected player ID (optional)

**Usage:**
```tsx
<AnalyticsDashboard 
  leagueId="12335716" 
  initialView="standings"
  teamId="123"
  playerId="456"
/>
```

### LeagueStandings
Displays conference/division standings with team records.

**Features:**
- Conference and division breakdown
- Team rankings with color coding
- Win/loss records and statistics
- Point differentials
- League summary

### TeamStats
Shows comprehensive team statistics and performance metrics.

**Features:**
- Offensive and defensive statistics
- Roster information
- Performance metrics
- Player roster table (when available)

### TeamSalaryCap
Manages salary cap information and player contracts.

**Features:**
- Cap usage visualization
- Player count breakdown
- Contract summary
- Player contracts table
- Financial metrics

### PlayerStats
Displays individual player statistics by position.

**Features:**
- Position-specific stat breakdowns
- Passing, rushing, receiving, defense, and kicking stats
- Season summary
- Performance calculations

## Usage Instructions

### 1. Accessing Analytics

**Global Analytics:**
- Navigate to `/analytics-engine`
- Uses default test league ID (12335716)

**League-Specific Analytics:**
- Navigate to `/leagues/{leagueId}/analytics`
- Uses the league ID from the URL

### 2. Navigation

The dashboard provides tab-based navigation:
- 🏆 **League Standings** - View conference/division standings
- 📊 **Team Stats** - Analyze team performance
- 💰 **Salary Cap** - Manage team finances
- 👤 **Player Stats** - View individual player statistics

### 3. Team and Player Selection

For team-based views (Team Stats, Salary Cap):
- Enter a team ID in the input field
- The component will fetch data for that team

For player-based views (Player Stats):
- Enter a player ID in the input field
- The component will fetch data for that player

### 4. Error Handling

All components include comprehensive error handling:
- Loading states with spinners
- Error messages for failed API calls
- Graceful fallbacks for missing data
- Network error recovery

## API Service Layer

### analyticsApi Object

The `analyticsApi` object provides methods for all endpoints:

```typescript
// Get league standings
const standings = await analyticsApi.getLeagueStandings(leagueId)

// Get team stats
const teamStats = await analyticsApi.getTeamStats(leagueId, teamId)

// Get team salary cap
const salaryCap = await analyticsApi.getTeamSalaryCap(leagueId, teamId)

// Get player stats
const playerStats = await analyticsApi.getPlayerStats(leagueId, playerId)
```

### Error Handling

All API calls include proper error handling:
- HTTP status code checking
- JSON error response parsing
- Fallback error messages
- Console logging for debugging

### Utility Functions

The analytics service includes utility functions:
- `formatCurrency()` - Format numbers as currency
- `formatPercentage()` - Format numbers as percentages
- `formatRecord()` - Format win/loss records
- `getTeamRankingColor()` - Get color coding for rankings

## Data Types

### LeagueStandings
```typescript
interface LeagueStandings {
  leagueId: number
  season: number
  conferences: Conference[]
}

interface Conference {
  conferenceId: number
  conferenceName: string
  divisions: Division[]
}

interface Division {
  divisionId: number
  divisionName: string
  teams: Team[]
}

interface Team {
  teamId: number
  teamName: string
  city: string
  wins: number
  losses: number
  ties: number
  winPercentage: number
  pointsScored: number
  pointsAllowed: number
  pointDifferential: number
  conferenceRank: number
  divisionRank: number
  overallRank: number
}
```

### TeamStats
```typescript
interface TeamStats {
  teamId: number
  teamName: string
  city: string
  conference: string
  division: string
  rosterSize: number
  offense: OffenseStats
  defense: DefenseStats
  record: TeamRecord
  players: PlayerStats[]
}
```

### TeamSalaryCap
```typescript
interface TeamSalaryCap {
  teamId: number
  teamName: string
  salaryCap: CapInfo
  playerCount: PlayerCount
  contracts: ContractSummary
  players: PlayerContract[]
}
```

### PlayerStats
```typescript
interface PlayerStats {
  playerId: number
  playerName: string
  teamId: number
  teamName: string
  position: string
  stats: PlayerStatistics
  season: number
  week?: number
}
```

## Styling

All components use Tailwind CSS with a dark theme:
- Background: Black (`bg-black`)
- Text: White (`text-white`)
- Accent: Neon green (`text-neon-green`)
- Cards: Gray with transparency (`bg-gray-900/50`)
- Hover effects and transitions
- Responsive design for mobile/desktop

## Testing

### Test League ID
Use `12335716` for testing all endpoints.

### Working Endpoints
- ✅ League Standings
- ✅ Team Stats (with empty rosters)
- ✅ Team Salary Cap

### Non-Working Endpoints
- ❌ Player Individual Stats (404 - needs real player ID)

## Future Enhancements

1. **Caching**: Implement data caching to reduce API calls
2. **Real-time Updates**: Add WebSocket support for live data
3. **Charts/Graphs**: Integrate charting libraries for visualizations
4. **Export**: Add data export functionality
5. **Filters**: Add filtering and sorting options
6. **Search**: Implement player/team search functionality

## Troubleshooting

### Common Issues

1. **404 Errors**: Ensure league ID, team ID, or player ID exists
2. **Authentication Errors**: Check if user is logged in and has premium access
3. **Network Errors**: Verify API endpoint availability
4. **Empty Data**: Some endpoints may return empty arrays for new leagues

### Debug Information

All components include console logging for debugging:
- API request/response logging
- Error details
- Loading state changes
- Data transformations

## Support

For issues or questions about the analytics integration:
1. Check the browser console for error messages
2. Verify API endpoint availability
3. Ensure proper authentication
4. Test with the provided test league ID 