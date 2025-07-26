'use client'

interface TeamLogoProps {
  teamName?: string
  teamId?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const teamColors: { [key: string]: string } = {
  'NY Giants': 'bg-blue-600',
  'Dallas Cowboys': 'bg-blue-500',
  'Philadelphia Eagles': 'bg-green-600',
  'Washington Commanders': 'bg-red-600',
  'New York Jets': 'bg-green-500',
  'Buffalo Bills': 'bg-blue-700',
  'New England Patriots': 'bg-blue-800',
  'Miami Dolphins': 'bg-teal-500',
  'Baltimore Ravens': 'bg-purple-600',
  'Cincinnati Bengals': 'bg-orange-500',
  'Cleveland Browns': 'bg-orange-600',
  'Pittsburgh Steelers': 'bg-yellow-500',
  'Houston Texans': 'bg-blue-600',
  'Indianapolis Colts': 'bg-blue-500',
  'Jacksonville Jaguars': 'bg-teal-600',
  'Tennessee Titans': 'bg-blue-600',
  'Denver Broncos': 'bg-orange-500',
  'Kansas City Chiefs': 'bg-red-600',
  'Las Vegas Raiders': 'bg-gray-600',
  'Los Angeles Chargers': 'bg-blue-500',
  'Arizona Cardinals': 'bg-red-600',
  'Los Angeles Rams': 'bg-blue-600',
  'San Francisco 49ers': 'bg-red-600',
  'Seattle Seahawks': 'bg-green-600',
  'Atlanta Falcons': 'bg-red-600',
  'Carolina Panthers': 'bg-blue-600',
  'New Orleans Saints': 'bg-yellow-500',
  'Tampa Bay Buccaneers': 'bg-red-600',
  'Chicago Bears': 'bg-blue-600',
  'Detroit Lions': 'bg-blue-500',
  'Green Bay Packers': 'bg-green-600',
  'Minnesota Vikings': 'bg-purple-600',
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
}

export default function TeamLogo({ teamName, size = 'md', className = '' }: TeamLogoProps) {
  const sizeClass = sizeClasses[size]
  const teamColor = teamName ? teamColors[teamName] || 'bg-gray-600' : 'bg-gray-600'
  const initials = teamName ? teamName.split(' ').map(word => word[0]).join('').substring(0, 2) : 'TM'

  return (
    <div className={`${sizeClass} ${teamColor} rounded-full flex items-center justify-center font-bold text-white ${className}`}>
      {initials}
    </div>
  )
} 