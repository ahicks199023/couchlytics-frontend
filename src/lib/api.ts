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

export const updateLeagueSettings = async (leagueId: string, settings: { name?: string; description?: string; image_url?: string; invite_code?: string; setup_completed?: boolean }) => {
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

// Invites API (public)
export const getInvite = async (inviteCode: string) => {
  return fetchFromApi(`/invites/${inviteCode}`)
}

export const getVacantTeamsForInvite = async (inviteCode: string) => {
  return fetchFromApi(`/invites/${inviteCode}/vacant-teams`)
}

export const acceptInvite = async (inviteCode: string, payload: { user_id?: number; team_id?: number }) => {
  return fetchFromApi(`/invites/${inviteCode}/accept`, {
    method: 'POST',
    body: JSON.stringify(payload)
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
export const submitTrade = async (leagueId: string, tradeData: Record<string, unknown>) => {
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
export const sendOzzieQuery = async (queryData: Record<string, unknown>) => {
  return fetchFromApi('/ozzie/query', {
    method: 'POST',
    body: JSON.stringify(queryData)
  })
}

// Enhanced Ozzie features
export const sendEnhancedOzzieQuery = async (queryData: Record<string, unknown>) => {
  return fetchFromApi('/ozzie-enhanced/query', {
    method: 'POST',
    body: JSON.stringify(queryData)
  })
}

export const getOzzieConversations = async (folderId?: number) => {
  const params = new URLSearchParams()
  if (folderId) params.append('folderId', folderId.toString())
  return fetchFromApi(`/ozzie-enhanced/conversations?${params}`)
}

export const getOzzieConversation = async (conversationId: number) => {
  return fetchFromApi(`/ozzie-enhanced/conversations/${conversationId}`)
}

export const updateOzzieConversation = async (conversationId: number, updateData: Record<string, unknown>) => {
  return fetchFromApi(`/ozzie-enhanced/conversations/${conversationId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  })
}

export const deleteOzzieConversation = async (conversationId: number) => {
  return fetchFromApi(`/ozzie-enhanced/conversations/${conversationId}`, {
    method: 'DELETE'
  })
}

export const getOzzieFolders = async () => {
  return fetchFromApi('/ozzie-enhanced/folders')
}

export const createOzzieFolder = async (folderData: { name: string; color: string }) => {
  return fetchFromApi('/ozzie-enhanced/folders', {
    method: 'POST',
    body: JSON.stringify(folderData)
  })
}

export const updateOzzieFolder = async (folderId: number, folderData: Record<string, unknown>) => {
  return fetchFromApi(`/ozzie-enhanced/folders/${folderId}`, {
    method: 'PUT',
    body: JSON.stringify(folderData)
  })
}

export const deleteOzzieFolder = async (folderId: number) => {
  return fetchFromApi(`/ozzie-enhanced/folders/${folderId}`, {
    method: 'DELETE'
  })
}

export const searchOzzieConversations = async (query: string) => {
  return fetchFromApi(`/ozzie-enhanced/search?q=${encodeURIComponent(query)}`)
}

export const getOzzieStats = async () => {
  return fetchFromApi('/ozzie-enhanced/stats')
}

export const getOzzieTeams = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/teams`)
}

// AI Commissioner API Functions
export const evaluateTrade = async (leagueId: string, tradeData: {
  team1_id: number
  team2_id: number
  team1_players: Array<{player_id: number, name: string, position: string, value: number}>
  team2_players: Array<{player_id: number, name: string, position: string, value: number}>
}) => {
  return fetchFromApi(`/ai-commissioner/league/${leagueId}/evaluate-trade`, {
    method: 'POST',
    body: JSON.stringify(tradeData)
  })
}

export const getRuleSuggestions = async (leagueId: string) => {
  return fetchFromApi(`/ai-commissioner/league/${leagueId}/rule-suggestions`)
}

export const resolveDispute = async (leagueId: string, disputeData: {
  dispute_type: string
  teams_involved: number[]
  description: string
  evidence?: string
}) => {
  return fetchFromApi(`/ai-commissioner/league/${leagueId}/resolve-dispute`, {
    method: 'POST',
    body: JSON.stringify(disputeData)
  })
}

export const getLeagueReport = async (leagueId: string) => {
  return fetchFromApi(`/ai-commissioner/league/${leagueId}/report`)
}

export const getAICommissionerHealth = async (leagueId: string) => {
  return fetchFromApi(`/ai-commissioner/league/${leagueId}/health`)
}
