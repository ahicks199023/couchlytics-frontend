'use client'

import { getTeamById, getTeamByName, getTeamByAbbreviation, getTeamByPartialName, TeamConfig } from '@/lib/team-config'
import TeamLogo from './TeamLogo'

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
  onClick
}: TeamBadgeProps) {
  // Find team configuration
  let team: TeamConfig | undefined
  
  if (teamId) {
    team = getTeamById(teamId)
  } else if (teamAbbr) {
    team = getTeamByAbbreviation(teamAbbr)
  } else if (teamName) {
    console.log('TeamBadge lookup - teamName:', teamName)
    team = getTeamByName(teamName) || getTeamByPartialName(teamName)
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

  if (variant === 'text') {
    return (
      <span 
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${textSizeClass} ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        style={team ? { 
          backgroundColor: team.colors.primary,
          color: team.colors.text
        } : { backgroundColor: '#6B7280', color: '#FFFFFF' }}
        onClick={onClick}
      >
        {showAbbr && team && team.abbreviation}
        {showName && (team ? team.fullName : teamName || 'Unknown')}
        {!showAbbr && !showName && (team ? team.abbreviation : 'TM')}
      </span>
    )
  }

  return (
    <div 
      className={`inline-flex items-center gap-2 ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
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

// Export utility functions for use in other components
export { getTeamById, getTeamByName, getTeamByAbbreviation, getTeamByPartialName }
export type { TeamConfig } 