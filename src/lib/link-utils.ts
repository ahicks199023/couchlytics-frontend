/**
 * Utility functions for creating consistent navigation links across the app
 */

/**
 * Generate a URL for a team detail page
 */
export function getTeamDetailUrl(leagueId: string, teamId: string | number): string {
  return `/leagues/${leagueId}/teams/${teamId}`
}

/**
 * Generate a URL for a player detail page
 */
export function getPlayerDetailUrl(leagueId: string, playerId: string | number): string {
  return `/leagues/${leagueId}/players/${playerId}`
}

/**
 * Generate a URL for a box score page
 */
export function getBoxScoreUrl(leagueId: string, gameId: string | number): string {
  return `/leagues/${leagueId}/schedule/box-score/${gameId}`
}

/**
 * Generate a fallback player URL using name if no ID available
 */
export function getPlayerDetailUrlWithFallback(
  leagueId: string, 
  playerId?: string | number, 
  playerName?: string
): string {
  if (playerId) {
    return getPlayerDetailUrl(leagueId, playerId)
  }
  if (playerName) {
    // Use encoded name as fallback
    return getPlayerDetailUrl(leagueId, encodeURIComponent(playerName))
  }
  throw new Error('Either playerId or playerName must be provided')
}

/**
 * Standard CSS classes for clickable team links
 */
export const TEAM_LINK_CLASSES = "hover:text-neon-green transition-colors cursor-pointer"

/**
 * Standard CSS classes for clickable player links
 */
export const PLAYER_LINK_CLASSES = "text-blue-600 dark:text-blue-400 hover:text-neon-green transition-colors cursor-pointer"

/**
 * Standard CSS classes for clickable game result links
 */
export const GAME_LINK_CLASSES = "hover:underline cursor-pointer transition-colors"
