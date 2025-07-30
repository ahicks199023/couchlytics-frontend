# Stats Leaders Feature

## Overview

The Stats Leaders feature provides a comprehensive view of player and team statistics in a tabbed interface. It displays offensive and defensive leaders across multiple categories with sortable tables and responsive design.

## Features

### Main Components

1. **Stats Leaders Page** (`/leagues/[leagueId]/stats-leaders`)
   - Tabbed interface with "Players" and "Teams" tabs
   - Automatic API availability detection
   - Fallback to legacy stats system when new API is unavailable

2. **Players Tab**
   - **Offensive Leaders**: Passing, Rushing, Receiving statistics
   - **Defensive Leaders**: Tackles, Sacks, Interceptions statistics
   - Player headshots and clickable names for navigation
   - User team highlighting

3. **Teams Tab**
   - **Offensive Leaders**: Total Yards, Passing, Rushing team statistics
   - **Defensive Leaders**: Yards Allowed, Sacks, Turnovers team statistics
   - User team highlighting

### Technical Implementation

#### API Integration

The feature uses a new dedicated API service (`StatsLeadersAPI`) that provides:

- **Base Endpoint**: `GET /leagues/{league_id}/stats-leaders`
- **Summary Endpoint**: `GET /leagues/{league_id}/stats-leaders/summary`
- **Query Parameters**: `type`, `category`, `stat`, `limit`

#### Fallback System

When the new API endpoints are not available, the system automatically falls back to the existing `LeagueStatLeaders` component, providing a seamless user experience.

#### Component Structure

```
src/components/stats-leaders/
├── StatsTable.tsx              # Reusable table component
├── PlayersStatsTab.tsx         # Players tab container
├── TeamsStatsTab.tsx           # Teams tab container
├── OffensivePlayersSection.tsx # Offensive player stats
├── DefensivePlayersSection.tsx # Defensive player stats
├── OffensiveTeamsSection.tsx   # Offensive team stats
├── DefensiveTeamsSection.tsx   # Defensive team stats
└── FallbackStatsView.tsx       # Legacy system fallback
```

#### TypeScript Types

All data structures are properly typed in `src/types/stats-leaders.ts`:

- Player stat interfaces (Passing, Rushing, Receiving, etc.)
- Team stat interfaces (Total Yards, Passing, Rushing, etc.)
- API response interfaces
- Parameter interfaces

## API Endpoints

### Required Backend Endpoints

The frontend expects the following API endpoints to be implemented:

#### Main Stats Leaders Endpoint
```
GET /leagues/{league_id}/stats-leaders
```

**Query Parameters:**
- `type`: `players` or `teams`
- `category`: `offensive` or `defensive`
- `stat`: specific stat type (e.g., `passing`, `rushing`, `sacks`)
- `limit`: number of results (default: 10, max: 50)

#### Summary Endpoint
```
GET /leagues/{league_id}/stats-leaders/summary
```

**Response:** Available categories and stat types

### Specific Stat Types

#### Players - Offensive
- `passing`: Passing yards, TDs, INTs, rating, games
- `rushing`: Rushing yards, TDs, attempts, average, games
- `receiving`: Receiving yards, TDs, catches, average, games

#### Players - Defensive
- `tackles`: Tackles, sacks, INTs, fumble recoveries, games
- `sacks`: Sacks, tackles, INTs, forced fumbles, games
- `interceptions`: INTs, return yards, TDs, tackles, games

#### Teams - Offensive
- `total_yards`: Total yards, passing yards, rushing yards, yards/game, games
- `passing`: Passing yards, TDs, INTs lost, sacks allowed, yards/game, games
- `rushing`: Rushing yards, TDs, fumbles lost, yards/game, games

#### Teams - Defensive
- `yards_allowed`: Total yards allowed, pass yards allowed, rush yards allowed, yards/game, games
- `sacks`: Total sacks, INTs, forced fumbles, fumble recoveries, sacks/game, games
- `turnovers`: Turnover differential, takeaways, giveaways, INTs, fumble recoveries, games

## Usage

### Navigation

The Stats Leaders page is accessible via:
- League sidebar navigation: "Stats Leaders"
- Direct URL: `/leagues/{leagueId}/stats-leaders`

### User Experience

1. **Loading States**: Spinners and progress indicators during data fetching
2. **Error Handling**: Graceful error messages with retry options
3. **Responsive Design**: Mobile-friendly tables with horizontal scrolling
4. **Sorting**: Click column headers to sort data
5. **Team Highlighting**: User's team is highlighted in yellow
6. **Player Navigation**: Click player names to view detailed player pages

### Performance Considerations

- Parallel API calls for multiple stat categories
- Lazy loading of non-critical data
- Efficient re-rendering with React patterns
- Caching of API responses where appropriate

## Development

### Adding New Stat Categories

1. Add new interfaces to `src/types/stats-leaders.ts`
2. Add convenience methods to `StatsLeadersAPI`
3. Create new section components following existing patterns
4. Update the main tab components to include new sections

### Styling

The feature uses:
- Tailwind CSS for styling
- Existing UI components from `src/components/ui/`
- Consistent color scheme and typography
- Dark mode support

### Testing

The implementation includes:
- Error boundary handling
- Loading state management
- API availability detection
- Fallback system testing

## Future Enhancements

Potential improvements:
- Export functionality (CSV, PDF)
- Custom date range filtering
- Advanced filtering options
- Historical trend analysis
- Player comparison tools
- Team comparison tools
- Real-time updates
- Mobile-optimized views 