'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTeamById, getTeamByName, getTeamByAbbreviation, getTeamByPartialName, TeamConfig } from '@/lib/team-config'
import TeamLogo from './TeamLogo'

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

export default function TeamCard({
  teamName,
  teamId,
  teamAbbr,
  record,
  overall,
  rank,
  division,
  conference,
  member,
  coach,
  offenseScheme,
  defenseScheme,
  rosterCount,
  injuryCount,
  capRoom,
  spent,
  available,
  className = '',
  variant = 'detailed',
  onClick
}: TeamCardProps) {
  // Find team configuration
  let team: TeamConfig | undefined
  
  if (teamId) {
    team = getTeamById(teamId)
  } else if (teamAbbr) {
    team = getTeamByAbbreviation(teamAbbr)
  } else if (teamName) {
    team = getTeamByName(teamName) || getTeamByPartialName(teamName)
  }

  if (!team) {
    return (
      <Card className={`${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`} onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <TeamLogo teamName={teamName} size="lg" variant="initials" />
            <div>
              <h3 className="font-semibold text-lg">{teamName || 'Unknown Team'}</h3>
              <p className="text-gray-500 text-sm">Team information unavailable</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const teamGradient = `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)`

  if (variant === 'compact') {
    return (
      <Card 
        className={`${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`} 
        onClick={onClick}
        style={{ borderColor: team.colors.accent }}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <TeamLogo teamId={team.id} size="md" variant="logo" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate" style={{ color: team.colors.text }}>
                {team.fullName}
              </h3>
              {record && (
                <p className="text-xs text-gray-500">
                  {record} {overall && `• OVR: ${overall}`} {rank && `• Rank: ${rank}`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'stats') {
    return (
      <Card 
        className={`${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`} 
        onClick={onClick}
        style={{ borderColor: team.colors.accent }}
      >
        <CardHeader 
          className="pb-3"
          style={{ background: teamGradient }}
        >
          <div className="flex items-center gap-3">
            <TeamLogo teamId={team.id} size="lg" variant="helmet" />
            <div>
              <CardTitle className="text-white text-lg">{team.fullName}</CardTitle>
              {record && (
                <p className="text-white/80 text-sm">
                  {record} {overall && `• OVR: ${overall}`} {rank && `• Rank: ${rank}`}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {division && (
              <div>
                <span className="text-gray-500">Division:</span>
                <span className="ml-2 font-medium">{division}</span>
              </div>
            )}
            {conference && (
              <div>
                <span className="text-gray-500">Conference:</span>
                <span className="ml-2 font-medium">{conference}</span>
              </div>
            )}
            {rosterCount !== undefined && (
              <div>
                <span className="text-gray-500">Roster:</span>
                <span className="ml-2 font-medium">{rosterCount}</span>
              </div>
            )}
            {injuryCount !== undefined && (
              <div>
                <span className="text-gray-500">Injuries:</span>
                <span className="ml-2 font-medium">{injuryCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant (default)
  return (
    <Card 
      className={`${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`} 
      onClick={onClick}
      style={{ borderColor: team.colors.accent }}
    >
      <CardHeader 
        className="pb-3"
        style={{ background: teamGradient }}
      >
        <div className="flex items-center gap-4">
          <TeamLogo teamId={team.id} size="xl" variant="helmet" />
          <div className="flex-1">
            <CardTitle className="text-white text-xl">{team.fullName}</CardTitle>
            {record && (
              <p className="text-white/80 text-sm">
                Record: {record} {overall && `• Overall: ${overall}`} {rank && `• Rank: ${rank}`}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {division && (
              <div className="flex justify-between">
                <span className="text-gray-500">Division:</span>
                <span className="font-medium">{division}</span>
              </div>
            )}
            {conference && (
              <div className="flex justify-between">
                <span className="text-gray-500">Conference:</span>
                <span className="font-medium">{conference}</span>
              </div>
            )}
            {member && (
              <div className="flex justify-between">
                <span className="text-gray-500">Member:</span>
                <span className="font-medium">{member}</span>
              </div>
            )}
            {coach && (
              <div className="flex justify-between">
                <span className="text-gray-500">Coach/Owner:</span>
                <span className="font-medium">{coach}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {offenseScheme && (
              <div className="flex justify-between">
                <span className="text-gray-500">Offense:</span>
                <span className="font-medium">{offenseScheme}</span>
              </div>
            )}
            {defenseScheme && (
              <div className="flex justify-between">
                <span className="text-gray-500">Defense:</span>
                <span className="font-medium">{defenseScheme}</span>
              </div>
            )}
            {rosterCount !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">Roster:</span>
                <span className="font-medium">{rosterCount}</span>
              </div>
            )}
            {injuryCount !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">Injuries:</span>
                <span className="font-medium">{injuryCount}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Cap Information */}
        {(capRoom !== undefined || spent !== undefined || available !== undefined) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-2" style={{ color: team.colors.primary }}>Cap Information</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {capRoom !== undefined && (
                <div>
                  <span className="text-gray-500">Cap Room:</span>
                  <div className="font-medium">${(capRoom / 1000000).toFixed(1)}M</div>
                </div>
              )}
              {spent !== undefined && (
                <div>
                  <span className="text-gray-500">Spent:</span>
                  <div className="font-medium">${(spent / 1000000).toFixed(1)}M</div>
                </div>
              )}
              {available !== undefined && (
                <div>
                  <span className="text-gray-500">Available:</span>
                  <div className="font-medium">${(available / 1000000).toFixed(1)}M</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Export utility functions for use in other components
export { getTeamById, getTeamByName, getTeamByAbbreviation, getTeamByPartialName }
export type { TeamConfig } 