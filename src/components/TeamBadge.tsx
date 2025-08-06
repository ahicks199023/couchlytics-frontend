'use client'

import Link from 'next/link'
import { getTeamById, getTeamByName, getTeamByAbbreviation, getTeamByPartialName, TeamConfig } from '@/lib/team-config'
import TeamLogo from './TeamLogo'

// Enhanced team name mapping function
function mapTeamName(teamName: string): string {
  if (!teamName) return teamName
  
  // Common patterns from API responses
  const teamNameMappings: Record<string, string> = {
    // Handle "Team X" patterns
    'team 1': 'Giants',
    'team 2': 'Cowboys', 
    'team 3': 'Eagles',
    'team 4': 'Commanders',
    'team 5': 'Bears',
    'team 6': 'Lions',
    'team 7': 'Packers',
    'team 8': 'Vikings',
    'team 9': 'Buccaneers',
    'team 10': 'Falcons',
    'team 11': 'Panthers',
    'team 12': 'Saints',
    'team 13': 'Cardinals',
    'team 14': 'Rams',
    'team 15': '49ers',
    'team 16': 'Seahawks',
    'team 17': 'Bills',
    'team 18': 'Dolphins',
    'team 19': 'Patriots',
    'team 20': 'Jets',
    'team 21': 'Bengals',
    'team 22': 'Browns',
    'team 23': 'Ravens',
    'team 24': 'Steelers',
    'team 25': 'Colts',
    'team 26': 'Jaguars',
    'team 27': 'Texans',
    'team 28': 'Titans',
    'team 29': 'Broncos',
    'team 30': 'Chiefs',
    'team 31': 'Raiders',
    'team 32': 'Chargers',
    
    // Handle common abbreviations
    'nyg': 'Giants',
    'dal': 'Cowboys',
    'phi': 'Eagles',
    'was': 'Commanders',
    'chi': 'Bears',
    'det': 'Lions',
    'gb': 'Packers',
    'min': 'Vikings',
    'tb': 'Buccaneers',
    'atl': 'Falcons',
    'car': 'Panthers',
    'no': 'Saints',
    'ari': 'Cardinals',
    'lar': 'Rams',
    'sf': '49ers',
    'sea': 'Seahawks',
    'buf': 'Bills',
    'mia': 'Dolphins',
    'ne': 'Patriots',
    'nyj': 'Jets',
    'cin': 'Bengals',
    'cle': 'Browns',
    'bal': 'Ravens',
    'pit': 'Steelers',
    'ind': 'Colts',
    'jax': 'Jaguars',
    'hou': 'Texans',
    'ten': 'Titans',
    'den': 'Broncos',
    'kc': 'Chiefs',
    'lv': 'Raiders',
    'lac': 'Chargers',
  }
  
  const normalizedName = teamName.toLowerCase().trim()
  return teamNameMappings[normalizedName] || teamName
}

interface TeamBadgeProps {
  teamName?: string
  teamId?: number
  teamAbbr?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  variant?: 'logo' | 'helmet' | 'initials' | 'text'
  showAbbr?: boolean
  showName?: boolean
  className?: string
  onClick?: () => void
  // Link to team detail page
  leagueId?: string
  linkToTeam?: boolean
}

export default function TeamBadge({
  teamName,
  teamId,
  teamAbbr,
  size = 'md',
  variant = 'initials',
  showAbbr = false,
  showName = false,
  className = '',
  onClick,
  leagueId,
  linkToTeam = false
}: TeamBadgeProps) {
  // Find team configuration
  let team: TeamConfig | undefined
  
  if (teamId) {
    team = getTeamById(teamId)
  } else if (teamAbbr) {
    team = getTeamByAbbreviation(teamAbbr)
  } else if (teamName) {
    console.log('TeamBadge lookup - teamName:', teamName)
    const mappedTeamName = mapTeamName(teamName)
    console.log('TeamBadge lookup - mapped teamName:', mappedTeamName)
    team = getTeamByName(mappedTeamName) || getTeamByPartialName(mappedTeamName)
    console.log('TeamBadge lookup - found team:', team)
  }

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
    '3xl': 'text-2xl',
    '4xl': 'text-3xl',
    '5xl': 'text-4xl'
  }

  const textSizeClass = sizeClasses[size]

  // Determine if we should link and the team ID to use
  const shouldLink = linkToTeam && leagueId && (team?.id || teamId)
  const teamIdForLink = team?.id || teamId

  const renderContent = () => {
    if (variant === 'text') {
      return (
        <span 
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${textSizeClass} ${className} ${onClick || shouldLink ? 'cursor-pointer hover:opacity-80' : ''}`}
          style={team ? { 
            backgroundColor: team.colors.primary,
            color: team.colors.text
          } : { backgroundColor: '#6B7280', color: '#FFFFFF' }}
          onClick={!shouldLink ? onClick : undefined}
        >
          {showAbbr && team && team.abbreviation}
          {showName && (team ? team.fullName : teamName || 'Unknown')}
          {!showAbbr && !showName && (team ? team.abbreviation : 'TM')}
        </span>
      )
    }

    return (
      <div 
        className={`inline-flex items-center gap-2 ${className} ${onClick || shouldLink ? 'cursor-pointer hover:opacity-80' : ''}`}
        onClick={!shouldLink ? onClick : undefined}
      >
        <TeamLogo 
          teamId={team?.id}
          teamName={teamName}
          teamAbbr={teamAbbr}
          size={size}
          variant={variant}
        />
        {showName && (
          <span className={`font-medium ${textSizeClass}`}>
            {team ? team.fullName : teamName || 'Unknown Team'}
          </span>
        )}
        {showAbbr && !showName && (
          <span className={`font-medium ${textSizeClass}`}>
            {team ? team.abbreviation : 'TM'}
          </span>
        )}
      </div>
    )
  }

  if (shouldLink) {
    return (
      <Link 
        href={`/leagues/${leagueId}/teams/${teamIdForLink}`}
        className="hover:text-neon-green transition-colors"
      >
        {renderContent()}
      </Link>
    )
  }

  return renderContent()
}

// Export utility functions for use in other components
export { getTeamById, getTeamByName, getTeamByAbbreviation, getTeamByPartialName }
export type { TeamConfig } 