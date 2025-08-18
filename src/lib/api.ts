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

// Auth/me and My Leagues
export const getMe = async () => {
  return fetchFromApi('/auth/me')
}

export const getMyLeagues = async () => {
  // Prefer the dedicated endpoint; fall back to scope=my if needed
  try {
    return await fetchFromApi('/auth/my-leagues')
  } catch {
    return fetchFromApi('/leagues?scope=my')
  }
}

export const getPlayerDetails = async (leagueId: string, playerId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
}

export const getPlayerGameLogs = async (leagueId: string, playerId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/players/${playerId}/game-logs`)
}

// Player Game Log (season-based)
export type PlayerGameLogRow = {
  week: number
  date?: string
  opponent: string
  homeAway: 'HOME' | 'AWAY'
  result?: 'W' | 'L' | 'T'
  teamScore?: number
  oppScore?: number
  // Passing
  pass_comp?: number; pass_att?: number; pass_cmp_pct?: number
  pass_yds?: number; pass_avg?: number; pass_tds?: number; pass_ints?: number
  pass_long?: number; pass_sacks?: number; passer_rating?: number
  // Rushing
  rush_att?: number; rush_yds?: number; rush_avg?: number; rush_tds?: number; rush_long?: number; rush_fum?: number
  // Receiving
  rec_tgt?: number; rec_rec?: number; rec_yds?: number; rec_avg?: number; rec_tds?: number; rec_long?: number; rec_drops?: number
  // Defense
  def_tackles?: number; def_sacks?: number; def_ints?: number; def_tds?: number; def_forced_fum?: number; def_fum_rec?: number
  // Kicking/Punting
  fg_made?: number; fg_att?: number; fg_pct?: number; xp_made?: number; xp_att?: number; kick_pts?: number
  punt_att?: number; punt_yds?: number; punt_avg?: number; punts_in20?: number; punt_long?: number
}

export async function getPlayerGameLog(leagueId: string, playerId: string | number, season: number) {
  const res = await fetch(`${API_BASE}/leagues/${leagueId}/players/${playerId}/game-log?season=${season}`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) throw new Error(`Game log fetch failed: ${res.status}`)
  return res.json() as Promise<{ league_id: string; season: number; player_id: number; position: string; games: PlayerGameLogRow[]; available_seasons?: number[] }>
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

// Invite handoff URL (server redirects and sets cookies)
export const getInviteHandoffUrl = (inviteCode: string) => `${API_BASE}/invites/${inviteCode}/go`

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

// New flexible assignment API per updated spec
export const assignTeamToUserFlexible = async (
  leagueId: string,
  params: { userId: number; teamIdentifier: string | number }
) => {
  const payload =
    typeof params.teamIdentifier === 'number'
      ? { userId: params.userId, teamId: params.teamIdentifier }
      : { userId: params.userId, teamId: params.teamIdentifier }
  return fetchFromApi(`/commissioner/league/${leagueId}/assign-team`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const unassignTeam = async (leagueId: string, userId: number) => {
  return fetchFromApi(`/commissioner/league/${leagueId}/unassign-team?userId=${userId}`, {
    method: 'DELETE',
  })
}

// Update member role (commissioner | member)
export const updateMemberRole = async (
  leagueId: string,
  userId: number,
  role: 'commissioner' | 'member'
) => {
  return fetchFromApi(`/commissioner/league/${leagueId}/update-role`, {
    method: 'POST',
    body: JSON.stringify({ userId, role })
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

// Career Stats Types
export type CareerStatsSeason = {
  season: number
  // QB Stats
  cmp_att?: string
  cmp_pct?: number
  pass_yds?: number
  pass_avg?: number
  yds_per_game?: number
  pass_long?: number
  pass_tds?: number
  pass_ints?: number
  pass_sacks?: number
  passer_rating?: number
  rush_att?: number
  rush_yds?: number
  rush_avg?: number
  rush_tds?: number
  rush_long?: number
  // RB/WR Stats
  rec?: number
  rec_yds?: number
  rec_avg?: number
  rec_tds?: number
  rec_long?: number
  fumbles?: number
  drops?: number
  total_yds?: number
  total_tds?: number
  // Kicker Stats
  fg_made?: number
  fg_att?: number
  fg_pct?: number
  xp_made?: number
  xp_att?: number
  kicking_pts?: number
  // Punter Stats
  punt_att?: number
  punt_yds?: number
  punt_avg?: number
  punts_in20?: number
  punt_long?: number
  // Defense Stats
  tackles?: number
  sacks?: number
  interceptions?: number
  int_yds?: number
  def_tds?: number
  forced_fumbles?: number
  fumble_recoveries?: number
  pass_deflections?: number
  safeties?: number
  def_pts?: number
  games_played?: number
}

export type CareerStatsResponse = {
  league_id: string
  player: {
    id: number
    maddenId: string
    name: string
    position: string
    teamId: string
    jersey_number: number
  }
  career_stats: CareerStatsSeason[]
  total_seasons: number
}

export const getPlayerCareerStats = async (
  leagueId: string,
  playerId: string
): Promise<CareerStatsResponse> => {
  return fetchFromApi(`/leagues/${leagueId}/players/${playerId}/career-stats`)
}
