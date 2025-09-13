/**
 * Team Logo Service
 * Centralized service for managing team logo URLs
 */

// API Base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'

/**
 * Get the correct team logo URL from the backend API
 * @param teamName - The team name (e.g., "Colts", "Browns")
 * @returns The full URL to the team logo
 */
export const getTeamLogoUrl = (teamName: string): string => {
  if (!teamName) {
    return getFallbackLogoUrl()
  }
  
  // Normalize team name: lowercase, replace spaces with hyphens
  const normalizedName = teamName.toLowerCase().replace(/\s+/g, '-')
  
  // Use the backend API domain for team logos
  return `${API_BASE_URL}/assets/team-logos/${normalizedName}.png`
}

/**
 * Get fallback logo URL for missing or invalid team names
 * @returns A fallback logo URL
 */
export const getFallbackLogoUrl = (): string => {
  return `${API_BASE_URL}/assets/team-logos/default.png`
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

