// lib/api.ts
import { API_BASE } from './config'

// Generic API fetch function with authentication
export const fetchFromApi = async (endpoint: string, options: RequestInit = {}) => {
  const config = {
    credentials: 'include' as const,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }
  
  return response.json()
}

// League-related API calls
export const getLeagues = async () => {
  return fetchFromApi('/leagues')
}

export const getLeagueDetails = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}`)
}

export const getLeagueTeams = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/teams`)
}

export const getLeagueUsers = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/users`)
}

export const getLeaguePlayers = async (leagueId: string, params?: Record<string, string>) => {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
  return fetchFromApi(`/leagues/${leagueId}/players${queryString}`)
}

export const getPlayerDetails = async (leagueId: string, playerId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
}

export const getPlayerGameLogs = async (leagueId: string, playerId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/players/${playerId}/game-logs`)
}

export const getTeamDetails = async (leagueId: string, teamId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/teams/${teamId}/detail`)
}

// Stats and analytics
export const getStatsLeaders = async (leagueId: string, params: Record<string, string>) => {
  const queryString = new URLSearchParams(params).toString()
  return fetchFromApi(`/leagues/${leagueId}/stats-leaders?${queryString}`)
}

export const getStatsLeadersSummary = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/stats-leaders/summary`)
}

// Commissioner functions - now use session-based auth
export const getCommissionerLeagues = async () => {
  return fetchFromApi('/commissioner/leagues')
}

export const getLeagueSettings = async (leagueId: string) => {
  return fetchFromApi(`/commissioner/league/${leagueId}/settings`)
}

export const updateLeagueSettings = async (leagueId: string, settings: any) => {
  return fetchFromApi(`/commissioner/league/${leagueId}/update`, {
    method: 'PUT',
    body: JSON.stringify(settings)
  })
}

export const generateInviteLink = async (leagueId: string) => {
  return fetchFromApi(`/commissioner/league/${leagueId}/invite`, {
    method: 'POST'
  })
}

export const assignTeamToUser = async (leagueId: string, teamId: number, userEmail: string) => {
  return fetchFromApi(`/commissioner/league/${leagueId}/assign-team`, {
    method: 'POST',
    body: JSON.stringify({ team_id: teamId, user_email: userEmail })
  })
}

export const removeUserFromLeague = async (leagueId: string, userEmail: string) => {
  return fetchFromApi(`/commissioner/league/${leagueId}/remove-user`, {
    method: 'DELETE',
    body: JSON.stringify({ user_email: userEmail })
  })
}

export const getCompanionAppInfo = async (leagueId: string) => {
  return fetchFromApi(`/commissioner/league/${leagueId}/companion-app`)
}

// Trade functions
export const submitTrade = async (leagueId: string, tradeData: any) => {
  return fetchFromApi(`/leagues/${leagueId}/trades`, {
    method: 'POST',
    body: JSON.stringify(tradeData)
  })
}

export const cancelTrade = async (leagueId: string, tradeId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/trades/${tradeId}/cancel`, {
    method: 'POST'
  })
}

export const fetchTradesHistory = async (leagueId: string, params?: Record<string, string>) => {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
  return fetchFromApi(`/leagues/${leagueId}/trades${queryString}`)
}

// Trade tool
export const getTradeToolData = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/trade-tool`)
}

// Ozzie chat
export const sendOzzieQuery = async (queryData: any) => {
  return fetchFromApi('/ozzie/query', {
    method: 'POST',
    body: JSON.stringify(queryData)
  })
}

export const getOzzieTeams = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/teams`)
}
