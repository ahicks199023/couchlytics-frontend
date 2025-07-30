# Team Configuration System

## Overview

The Team Configuration System provides universal team logos, colors, and metadata across the entire application. This system ensures consistent team branding and visual identity throughout all leagues and pages.

## 🏗️ Architecture

### Core Files

- **`src/lib/team-config.ts`** - Central team configuration data and utility functions
- **`src/components/TeamLogo.tsx`** - Enhanced team logo component with multiple variants
- **`src/components/TeamCard.tsx`** - Team information cards with branding
- **`src/components/TeamBadge.tsx`** - Compact team badges for tables and lists

## 🎨 Team Configuration Data

### TeamConfig Interface

```typescript
interface TeamConfig {
  id: number
  name: string
  abbreviation: string
  city: string
  fullName: string
  conference: string
  division: string
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
  }
  logo: {
    url: string
    alt: string
  }
  helmet: {
    url: string
    alt: string
  }
}
```

### NFL Teams Coverage

The system includes all 32 NFL teams with:
- ✅ Official team colors (primary, secondary, accent, text)
- ✅ Team logos and helmet images
- ✅ Conference and division information
- ✅ Multiple lookup methods

## 🔧 Utility Functions

### Team Lookup Functions

```typescript
// Find team by ID
getTeamById(id: number): TeamConfig | undefined

// Find team by name (exact match)
getTeamByName(name: string): TeamConfig | undefined

// Find team by abbreviation
getTeamByAbbreviation(abbr: string): TeamConfig | undefined

// Find team by partial name (fuzzy search)
getTeamByPartialName(partialName: string): TeamConfig | undefined
```

### Team Filtering Functions

```typescript
// Get all teams by conference
getTeamsByConference(conference: string): TeamConfig[]

// Get all teams by division
getTeamsByDivision(division: string): TeamConfig[]
```

### Styling Functions

```typescript
// Get team colors as CSS variables
getTeamColors(teamId: number): string

// Get team background gradient
getTeamGradient(teamId: number): string

// Get team border color
getTeamBorderColor(teamId: number): string

// Get team text color
getTeamTextColor(teamId: number): string
```

## 🎯 Components

### TeamLogo Component

A versatile team logo component with multiple display options.

```typescript
interface TeamLogoProps {
  teamName?: string
  teamId?: number
  teamAbbr?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'logo' | 'helmet' | 'initials'
  className?: string
  showName?: boolean
  fallbackToInitials?: boolean
}
```

#### Usage Examples

```tsx
// Basic usage with team name
<TeamLogo teamName="Cleveland Browns" size="md" />

// With team ID
<TeamLogo teamId={11} size="lg" variant="helmet" />

// With abbreviation
<TeamLogo teamAbbr="CLE" size="sm" variant="logo" />

// Show team name
<TeamLogo teamName="Browns" size="lg" showName={true} />

// Fallback to initials
<TeamLogo teamName="Unknown Team" size="md" variant="initials" />
```

### TeamCard Component

Team information cards with team branding and multiple layout variants.

```typescript
interface TeamCardProps {
  teamName?: string
  teamId?: number
  teamAbbr?: string
  record?: string
  overall?: number
  rank?: number
  division?: string
  conference?: string
  member?: string
  coach?: string
  offenseScheme?: string
  defenseScheme?: string
  rosterCount?: number
  injuryCount?: number
  capRoom?: number
  spent?: number
  available?: number
  className?: string
  variant?: 'compact' | 'detailed' | 'stats'
  onClick?: () => void
}
```

#### Usage Examples

```tsx
// Compact variant
<TeamCard 
  teamName="Cleveland Browns"
  record="11-6-0"
  overall={97}
  rank={14}
  variant="compact"
/>

// Detailed variant with all information
<TeamCard 
  teamId={11}
  record="11-6-0"
  overall={97}
  rank={14}
  division="AFC North"
  conference="AFC"
  member="@cpgtwon"
  coach="CPG TWON"
  offenseScheme="Multiple Zone Run"
  defenseScheme="Base 4-3"
  rosterCount={53}
  injuryCount={0}
  capRoom={315400000}
  spent={309620000}
  available={5780000}
  variant="detailed"
/>

// Stats variant
<TeamCard 
  teamAbbr="CLE"
  record="11-6-0"
  overall={97}
  rank={14}
  division="AFC North"
  conference="AFC"
  rosterCount={53}
  injuryCount={0}
  variant="stats"
/>
```

### TeamBadge Component

Compact team badges for use in tables, lists, and other UI elements.

```typescript
interface TeamBadgeProps {
  teamName?: string
  teamId?: number
  teamAbbr?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'logo' | 'helmet' | 'initials' | 'text'
  showAbbr?: boolean
  showName?: boolean
  className?: string
  onClick?: () => void
}
```

#### Usage Examples

```tsx
// Text badge
<TeamBadge teamName="Browns" variant="text" showAbbr={true} />

// Logo with abbreviation
<TeamBadge teamId={11} size="sm" variant="logo" showAbbr={true} />

// Helmet with full name
<TeamBadge teamAbbr="CLE" size="md" variant="helmet" showName={true} />

// Initials only
<TeamBadge teamName="Cleveland Browns" size="xs" variant="initials" />
```

## 🚀 Implementation Guide

### 1. Basic Team Display

```tsx
import TeamLogo from '@/components/TeamLogo'
import { getTeamById } from '@/lib/team-config'

function MyComponent() {
  const team = getTeamById(11) // Cleveland Browns
  
  return (
    <div>
      <TeamLogo teamId={11} size="lg" variant="helmet" />
      <h2>{team?.fullName}</h2>
    </div>
  )
}
```

### 2. Team Cards in Lists

```tsx
import TeamCard from '@/components/TeamCard'

function TeamList({ teams }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map(team => (
        <TeamCard
          key={team.id}
          teamId={team.id}
          teamName={team.name}
          record={team.record}
          overall={team.overall}
          rank={team.rank}
          variant="compact"
          onClick={() => navigateToTeam(team.id)}
        />
      ))}
    </div>
  )
}
```

### 3. Team Badges in Tables

```tsx
import TeamBadge from '@/components/TeamBadge'

function StatsTable({ data }) {
  return (
    <table>
      <tbody>
        {data.map(row => (
          <tr key={row.id}>
            <td>{row.playerName}</td>
            <td>
              <TeamBadge 
                teamName={row.teamName}
                size="sm"
                variant="initials"
                showAbbr={true}
              />
            </td>
            <td>{row.stats}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### 4. Custom Styling with Team Colors

```tsx
import { getTeamGradient, getTeamColors } from '@/lib/team-config'

function TeamHeader({ teamId }) {
  const gradient = getTeamGradient(teamId)
  const colors = getTeamColors(teamId)
  
  return (
    <div 
      className="p-6 rounded-lg"
      style={{ 
        background: gradient,
        ...colors
      }}
    >
      <h1 className="text-white">Team Information</h1>
    </div>
  )
}
```

## 🎨 Styling Integration

### CSS Variables

The system provides CSS variables for team colors:

```css
:root {
  --team-primary: #311D00;
  --team-secondary: #FF3C00;
  --team-accent: #FFFFFF;
  --team-text: #FFFFFF;
}
```

### Tailwind Integration

Team colors can be used with Tailwind's arbitrary value syntax:

```tsx
<div 
  className="bg-[var(--team-primary)] text-[var(--team-text)]"
  style={getTeamColors(teamId)}
>
  Team Content
</div>
```

## 🔄 Fallback System

### Image Fallbacks

- **Logo/Helmet images** fallback to team-colored initials if images fail to load
- **Unknown teams** display generic initials with gray background
- **Partial matches** use fuzzy search to find the best team match

### Error Handling

```tsx
// Graceful handling of unknown teams
const team = getTeamById(999) || getTeamByName("Unknown Team")
if (!team) {
  // Use fallback styling
  return <TeamLogo teamName="Unknown" variant="initials" />
}
```

## 📁 File Structure

```
src/
├── lib/
│   └── team-config.ts          # Core configuration and utilities
├── components/
│   ├── TeamLogo.tsx           # Team logo component
│   ├── TeamCard.tsx           # Team information cards
│   └── TeamBadge.tsx          # Compact team badges
└── public/
    ├── team-logos/            # Team logo images
    └── team-helmets/          # Team helmet images
```

## 🔧 Adding New Teams

### 1. Update Team Configuration

Add new team to `NFL_TEAMS` array in `src/lib/team-config.ts`:

```typescript
{
  id: 33,
  name: 'NewTeam',
  abbreviation: 'NT',
  city: 'New City',
  fullName: 'New City NewTeam',
  conference: 'AFC',
  division: 'North',
  colors: {
    primary: '#FF0000',
    secondary: '#0000FF',
    accent: '#FFFFFF',
    text: '#FFFFFF'
  },
  logo: {
    url: '/team-logos/nt.png',
    alt: 'New City NewTeam Logo'
  },
  helmet: {
    url: '/team-helmets/nt.png',
    alt: 'New City NewTeam Helmet'
  }
}
```

### 2. Add Team Images

Place team logo and helmet images in:
- `/public/team-logos/nt.png`
- `/public/team-helmets/nt.png`

### 3. Test Integration

```tsx
// Test the new team
<TeamLogo teamName="NewTeam" size="lg" variant="logo" />
<TeamCard teamName="NewTeam" variant="detailed" />
<TeamBadge teamAbbr="NT" variant="text" showAbbr={true} />
```

## 🎯 Best Practices

### 1. Consistent Usage

- Use `teamId` when available for most accurate matching
- Use `teamName` for user-friendly display
- Use `teamAbbr` for compact displays

### 2. Performance

- Import only needed utility functions
- Use memoization for repeated team lookups
- Cache team configurations when possible

### 3. Accessibility

- Always provide alt text for images
- Use semantic HTML elements
- Ensure sufficient color contrast

### 4. Responsive Design

- Use appropriate sizes for different screen sizes
- Test team badges in mobile layouts
- Ensure team cards work on all devices

## 🚀 Future Enhancements

### Planned Features

1. **College Teams** - Support for college football teams
2. **Custom Leagues** - Dynamic team configuration for custom leagues
3. **Team History** - Historical team configurations and rebrands
4. **Dark/Light Themes** - Theme-specific team color variations
5. **Animation** - Smooth transitions between team states
6. **Caching** - Client-side caching for better performance

### API Integration

```typescript
// Future: Dynamic team loading from API
async function loadTeamConfig(leagueId: string) {
  const response = await fetch(`/api/leagues/${leagueId}/teams`)
  const teams = await response.json()
  return teams.map(team => ({
    ...team,
    colors: parseTeamColors(team.colorScheme),
    logo: { url: team.logoUrl, alt: team.logoAlt },
    helmet: { url: team.helmetUrl, alt: team.helmetAlt }
  }))
}
```

## 📞 Support

For questions or issues with the Team Configuration System:

1. Check the component documentation
2. Review the utility function examples
3. Test with known team IDs (1-32 for NFL teams)
4. Verify image paths in `/public/team-logos/` and `/public/team-helmets/`

The system is designed to be robust and provide consistent team branding across your entire application! 