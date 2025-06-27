import { Player } from '../types/player'

// Utility function for calculating player value
export const calculatePlayerValue = (player: Player): number => {
  let baseValue = player.ovr || 75
  
  // Position multipliers
  const positionMultipliers: Record<string, number> = {
    'QB': 1.2,
    'WR': 1.1,
    'HB': 1.0,
    'TE': 0.9,
    'LT': 0.8,
    'LG': 0.7,
    'C': 0.7,
    'RG': 0.7,
    'RT': 0.8,
    'LE': 0.9,
    'RE': 0.9,
    'DT': 0.8,
    'LOLB': 0.9,
    'MLB': 1.0,
    'ROLB': 0.9,
    'CB': 1.0,
    'FS': 0.9,
    'SS': 0.9,
    'K': 0.5,
    'P': 0.4
  }
  
  const multiplier = positionMultipliers[player.position] || 1.0
  
  // Age factor (younger players worth more)
  if (player.age) {
    const ageFactor = Math.max(0.7, 1.0 - (player.age - 22) * 0.02)
    baseValue *= ageFactor
  }
  
  // Development trait bonus
  if (player.devTrait) {
    const devMultipliers: Record<string, number> = {
      'Superstar': 1.3,
      'Star': 1.2,
      'Normal': 1.0,
      'Hidden': 1.1
    }
    baseValue *= devMultipliers[player.devTrait] || 1.0
  }
  
  return Math.round(baseValue * multiplier)
}

// Get headshot URL for player
export const getHeadshotUrl = (playerName: string, espnId?: string) => {
  if (espnId) {
    return `/headshots/${espnId}.png`
  }
  const sanitized = playerName.toLowerCase().replace(/[^a-z]/g, '')
  return `/headshots/${sanitized}.png`
}

// Get verdict color based on trade result
export const getVerdictColor = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'you win':
    case 'excellent':
      return 'text-green-400'
    case 'fair':
    case 'balanced':
      return 'text-yellow-400'
    case 'you lose':
    case 'poor':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

// Get development trait color
export const getDevTraitColor = (devTrait?: string) => {
  switch (devTrait) {
    case 'Superstar':
      return 'text-yellow-400'
    case 'Star':
      return 'text-blue-400'
    case 'Hidden':
      return 'text-purple-400'
    default:
      return 'text-gray-400'
  }
}

// Calculate trade verdict based on net value
export const calculateTradeVerdict = (netValue: number): string => {
  if (Math.abs(netValue) <= 15) return 'Fair'
  return netValue > 15 ? 'You Lose' : 'You Win'
}

// Filter players based on criteria
export const filterPlayers = (
  players: Player[],
  searchTerm: string,
  selectedTeam: string,
  selectedPosition: string,
  showMyTeamOnly: boolean,
  userTeamId?: number
): Player[] => {
  return players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTeam = selectedTeam === 'All' || p.team === selectedTeam
    const matchesPosition = selectedPosition === 'All' || p.position === selectedPosition
    const matchesMyTeam = !showMyTeamOnly || p.teamId === userTeamId
    
    return matchesSearch && matchesTeam && matchesPosition && matchesMyTeam
  }).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))
}

// Get available teams from players
export const getAvailableTeams = (players: Player[]): string[] => {
  const teamNames = [...new Set(players.map(p => p.team))].sort()
  return ['All', ...teamNames]
}

// Get available positions from players
export const getAvailablePositions = (players: Player[]): string[] => {
  const positions = [...new Set(players.map(p => p.position))].sort()
  return ['All', ...positions]
}

// Calculate total value of player list
export const calculateTotalValue = (players: Player[]): number => {
  return players.reduce((sum, p) => sum + calculatePlayerValue(p), 0)
}

// Format player name with position and team
export const formatPlayerName = (player: Player): string => {
  return `${player.name} (${player.position} • ${player.team})`
}

// Get position group for filtering
export const getPositionGroup = (position: string): string => {
  const groups: Record<string, string> = {
    'QB': 'Offense',
    'HB': 'Offense',
    'FB': 'Offense',
    'WR': 'Offense',
    'TE': 'Offense',
    'LT': 'Offense',
    'LG': 'Offense',
    'C': 'Offense',
    'RG': 'Offense',
    'RT': 'Offense',
    'LE': 'Defense',
    'RE': 'Defense',
    'DT': 'Defense',
    'LOLB': 'Defense',
    'MLB': 'Defense',
    'ROLB': 'Defense',
    'CB': 'Defense',
    'FS': 'Defense',
    'SS': 'Defense',
    'K': 'Special Teams',
    'P': 'Special Teams'
  }
  return groups[position] || 'Other'
} 
