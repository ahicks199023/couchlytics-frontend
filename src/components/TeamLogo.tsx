'use client'

import Image from 'next/image'
import { getTeamById, getTeamByName, getTeamByAbbreviation, getTeamByPartialName, TeamConfig } from '@/lib/team-config'

interface TeamLogoProps {
  teamName?: string
  teamId?: number
  teamAbbr?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  variant?: 'logo' | 'helmet' | 'initials'
  className?: string
  showName?: boolean
}

const sizeClasses = {
  xs: 'w-4 h-4 text-xs',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-xl',
  '3xl': 'w-32 h-32 text-2xl',
}

const nameSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
  '3xl': 'text-2xl',
}

export default function TeamLogo({ 
  teamName, 
  teamId, 
  teamAbbr,
  size = 'md', 
  variant = 'logo',
  className = '',
  showName = false
}: TeamLogoProps) {
  // Find team configuration
  let team: TeamConfig | undefined
  
  if (teamId) {
    team = getTeamById(teamId)
  } else if (teamAbbr) {
    team = getTeamByAbbreviation(teamAbbr)
  } else if (teamName) {
    team = getTeamByName(teamName) || getTeamByPartialName(teamName)
  }

  const sizeClass = sizeClasses[size]
  const nameSizeClass = nameSizeClasses[size]

  // Fallback to initials if no team found
  if (!team) {
    const initials = teamName ? 
      teamName.split(' ').map(word => word[0]).join('').substring(0, 2) : 
      'TM'
    
    const fallbackColor = '#6B7280'
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div 
          className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white`}
          style={{ backgroundColor: fallbackColor }}
        >
          {initials}
        </div>
        {showName && teamName && (
          <span className={`font-medium ${nameSizeClass}`}>
            {teamName}
          </span>
        )}
      </div>
    )
  }

  // Render logo or helmet
  if (variant === 'logo' || variant === 'helmet') {
    const imageUrl = variant === 'logo' ? team.logo.url : team.helmet.url
    const imageAlt = variant === 'logo' ? team.logo.alt : team.helmet.alt
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizeClass} relative flex items-center justify-center`}>
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={parseInt(sizeClass.split(' ')[0].replace('w-', '')) * 4}
            height={parseInt(sizeClass.split(' ')[1].replace('h-', '')) * 4}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to initials on image error
              const target = e.target as HTMLImageElement
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full rounded-full flex items-center justify-center font-bold text-white" 
                       style="background-color: ${team.colors.primary}">
                    ${team.abbreviation}
                  </div>
                `
              }
            }}
          />
        </div>
        {showName && (
          <span className={`font-medium ${nameSizeClass}`}>
            {team.fullName}
          </span>
        )}
      </div>
    )
  }

  // Render initials with team colors
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white`}
        style={{ backgroundColor: team.colors.primary }}
      >
        {team.abbreviation}
      </div>
      {showName && (
        <span className={`font-medium ${nameSizeClass}`}>
          {team.fullName}
        </span>
      )}
    </div>
  )
}

// Export utility functions for use in other components
export { getTeamById, getTeamByName, getTeamByAbbreviation, getTeamByPartialName }
export type { TeamConfig } 