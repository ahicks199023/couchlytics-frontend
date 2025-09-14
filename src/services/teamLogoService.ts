/**
 * Team Logo Service
 * Centralized service for managing team logo URLs
 */

// Team name to abbreviation mapping for local assets
const TEAM_NAME_TO_ABBREVIATION: Record<string, string> = {
  'Arizona Cardinals': 'ari',
  'Atlanta Falcons': 'atl',
  'Baltimore Ravens': 'bal',
  'Buffalo Bills': 'buf',
  'Carolina Panthers': 'car',
  'Chicago Bears': 'chi',
  'Cincinnati Bengals': 'cin',
  'Cleveland Browns': 'cle',
  'Dallas Cowboys': 'dal',
  'Denver Broncos': 'den',
  'Detroit Lions': 'det',
  'Green Bay Packers': 'gb',
  'Houston Texans': 'hou',
  'Indianapolis Colts': 'ind',
  'Jacksonville Jaguars': 'jax',
  'Kansas City Chiefs': 'kc',
  'Los Angeles Chargers': 'lac',
  'Los Angeles Rams': 'lar',
  'Las Vegas Raiders': 'lv',
  'Miami Dolphins': 'mia',
  'Minnesota Vikings': 'min',
  'New England Patriots': 'ne',
  'New Orleans Saints': 'no',
  'New York Giants': 'nyg',
  'New York Jets': 'nyj',
  'Philadelphia Eagles': 'phi',
  'Pittsburgh Steelers': 'pit',
  'Seattle Seahawks': 'sea',
  'San Francisco 49ers': 'sf',
  'Tampa Bay Buccaneers': 'tb',
  'Tennessee Titans': 'ten',
  'Washington Commanders': 'was',
  // Handle individual team names as well
  'Cardinals': 'ari',
  'Falcons': 'atl',
  'Ravens': 'bal',
  'Bills': 'buf',
  'Panthers': 'car',
  'Bears': 'chi',
  'Bengals': 'cin',
  'Browns': 'cle',
  'Cowboys': 'dal',
  'Broncos': 'den',
  'Lions': 'det',
  'Packers': 'gb',
  'Texans': 'hou',
  'Colts': 'ind',
  'Jaguars': 'jax',
  'Chiefs': 'kc',
  'Chargers': 'lac',
  'Rams': 'lar',
  'Raiders': 'lv',
  'Dolphins': 'mia',
  'Vikings': 'min',
  'Patriots': 'ne',
  'Saints': 'no',
  'Giants': 'nyg',
  'Jets': 'nyj',
  'Eagles': 'phi',
  'Steelers': 'pit',
  'Seahawks': 'sea',
  '49ers': 'sf',
  'Buccaneers': 'tb',
  'Titans': 'ten',
  'Commanders': 'was'
}

/**
 * Get the correct team logo URL from local public assets
 * @param teamName - The team name (e.g., "Colts", "Browns")
 * @returns The full URL to the team logo
 */
export const getTeamLogoUrl = (teamName: string): string => {
  if (!teamName) {
    return getFallbackLogoUrl()
  }
  
  // Get abbreviation for the team name
  const abbreviation = TEAM_NAME_TO_ABBREVIATION[teamName] || TEAM_NAME_TO_ABBREVIATION[teamName.toLowerCase()]
  
  if (!abbreviation) {
    console.warn(`No abbreviation found for team: ${teamName}`)
    return getFallbackLogoUrl()
  }
  
  // Use local public assets
  return `/team-logos/${abbreviation}.png`
}

/**
 * Get the correct team helmet URL from local public assets
 * @param teamName - The team name (e.g., "Colts", "Browns")
 * @returns The full URL to the team helmet
 */
export const getTeamHelmetUrl = (teamName: string): string => {
  if (!teamName) {
    return getFallbackHelmetUrl()
  }
  
  // Get abbreviation for the team name
  const abbreviation = TEAM_NAME_TO_ABBREVIATION[teamName] || TEAM_NAME_TO_ABBREVIATION[teamName.toLowerCase()]
  
  if (!abbreviation) {
    console.warn(`No abbreviation found for team: ${teamName}`)
    return getFallbackHelmetUrl()
  }
  
  // Use local public assets
  return `/team-helmets/${abbreviation}.png`
}

/**
 * Get fallback logo URL for missing or invalid team names
 * @returns A fallback logo URL
 */
export const getFallbackLogoUrl = (): string => {
  return '/team-logos/ari.png' // Use Cardinals as default fallback
}

/**
 * Get fallback helmet URL for missing or invalid team names
 * @returns A fallback helmet URL
 */
export const getFallbackHelmetUrl = (): string => {
  return '/team-helmets/ari.png' // Use Cardinals as default fallback
}

/**
 * Get team logo URL with error handling
 * @param teamName - The team name
 * @param onError - Optional callback for error handling
 * @returns The team logo URL
 */
export const getTeamLogoUrlWithFallback = (
  teamName: string, 
  onError?: (error: string) => void
): string => {
  try {
    return getTeamLogoUrl(teamName)
  } catch {
    if (onError) {
      onError(`Failed to get logo URL for team: ${teamName}`)
    }
    return getFallbackLogoUrl()
  }
}

/**
 * Available team logos (for reference)
 */
export const AVAILABLE_TEAM_LOGOS = [
  '49ers', 'bears', 'bengals', 'bills', 'broncos', 'browns', 
  'buccaneers', 'cardinals', 'chargers', 'chiefs', 'colts', 
  'commanders', 'cowboys', 'dolphins', 'eagles', 'falcons', 
  'giants', 'jaguars', 'jets', 'lions', 'packers', 'panthers', 
  'patriots', 'raiders', 'rams', 'ravens', 'saints', 'seahawks', 
  'steelers', 'texans', 'titans', 'vikings'
] as const

/**
 * Check if a team logo is available
 * @param teamName - The team name to check
 * @returns True if the logo is available
 */
export const isTeamLogoAvailable = (teamName: string): boolean => {
  const normalizedName = teamName.toLowerCase().replace(/\s+/g, '-')
  return AVAILABLE_TEAM_LOGOS.includes(normalizedName as typeof AVAILABLE_TEAM_LOGOS[number])
}

