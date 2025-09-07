// lib/api.ts
import { API_BASE } from './config'

// Type definitions
export interface ContractData {
  yearsLeft: number
  length: number
  capHit: number
  salary: number
  bonus: number
  releaseNetSavings?: number
  totalReleasePenalty?: number
  releasePenalty2026?: number
  releasePenalty2027?: number
  penaltyYears?: {
    year1?: {
      year: string
      penalty: number
    }
    year2?: {
      year: string
      penalty: number
    }
  }
}

// API utility function
export const fetchFromApi = async (endpoint: string) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include'
  })
  
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

export const getLeaguePlayers = async (leagueId: string, filters: Record<string, string | number | boolean> = {}) => {
  const queryParams = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''
  
  return fetchFromApi(`/leagues/${leagueId}/players${queryString}`)
}

// Auth/me and My Leagues - Updated to use working endpoint
export const getMe = async () => {
  return fetchFromApi('/auth/me')
}

export const getMyLeagues = async () => {
  // Use the working endpoint that returns user leagues
  try {
    return await fetchFromApi('/leagues?scope=my')
  } catch (error) {
    console.error('Failed to fetch user leagues:', error)
    throw error
  }
}

// New function for developers to get all leagues
export const getAllLeagues = async () => {
  try {
    return await fetchFromApi('/leagues')
  } catch (error) {
    console.error('Failed to fetch all leagues:', error)
    throw error
  }
}

// Smart league fetching based on user role
export const getLeaguesSmart = async () => {
  try {
    // First check if user has developer access
    const userResponse = await fetchFromApi('/auth/user')
    const userData = await userResponse.json()
    const isDeveloper = userData.isDeveloper || userData.email === 'antoinehickssales@gmail.com' || userData.isAdmin
    
    if (isDeveloper) {
      console.log('🔓 Developer access detected - fetching all leagues')
      return await fetchFromApi('/leagues')
    } else {
      console.log('👤 Regular user - fetching user leagues only')
      return await fetchFromApi('/leagues?scope=my')
    }
  } catch (error) {
    console.error('Failed to fetch leagues:', error)
    throw error
  }
}

export const getPlayerDetails = async (leagueId: string, playerId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
}

export const getLeagueTeams = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/teams`)
}

export const getLeagueTrades = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/trades`)
}

export const getLeagueStandings = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/standings`)
}

export const getLeagueSchedule = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/schedule`)
}

export const getLeagueStats = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/stats`)
}

export const getLeagueStatsLeaders = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/stats-leaders`)
}

export const getStatsLeadersSummary = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/stats-leaders/summary`)
}

// Commissioner functions - now use session-based auth
export const getCommissionerLeagues = async () => {
  return fetchFromApi('/commissioner/leagues')
}

export const getLeagueSettings = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/settings`)
}

// Dedicated function to fetch league members
export const getLeagueMembers = async (leagueId: string) => {
  console.log('🔍 getLeagueMembers called for league:', leagueId)
  
  // Try the working commissioner/users endpoint first
  try {
    console.log('🔍 Trying commissioner/users endpoint...')
    const response = await fetch(`${API_BASE}/leagues/${leagueId}/commissioner/users`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('🔍 Commissioner/users response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('🔍 Commissioner/users response data:', data)
      
      // Transform the data to match expected format
      const transformedData = {
        success: true,
        members: data.users || data.members || [],
        total: data.total || (data.users ? data.users.length : 0),
        debugInfo: {
          apiEndpointUsed: `/leagues/${leagueId}/commissioner/users`,
          responseStatus: response.status,
          responseData: data
        }
      }
      
      console.log('🔍 Transformed members data:', transformedData)
      return transformedData
    } else {
      console.log('⚠️ Commissioner/users endpoint failed, trying members endpoint...')
    }
  } catch (error) {
    console.log('⚠️ Commissioner/users endpoint error, trying members endpoint:', error)
  }
  
  // Fallback to the original members endpoint
  try {
    console.log('🔍 Trying members endpoint as fallback...')
    const response = await fetch(`${API_BASE}/leagues/${leagueId}/members`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('🔍 Members response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ getLeagueMembers failed:', response.status, errorText)
      throw new Error(`Failed to fetch league members: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('🔍 Members response data:', data)
    
    return {
      ...data,
      debugInfo: {
        apiEndpointUsed: `/leagues/${leagueId}/members`,
        responseStatus: response.status,
        responseData: data
      }
    }
  } catch (error) {
    console.error('❌ Both endpoints failed:', error)
    throw error
  }
}

export const updateLeagueSettings = async (leagueId: string, settings: Record<string, unknown>) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(settings)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to update league settings: ${response.status}`)
  }
  
  return response.json()
}

// User team functions
export const getUserTeam = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/user-team`)
}

export const getUserTeamWithFinancials = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/user-team?include_financials=true`)
}

// Trade functions
export const submitTrade = async (leagueId: string, tradeData: Record<string, unknown>) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/trades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(tradeData)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to submit trade: ${response.status}`)
  }
  
  return response.json()
}

export const getTradeHistory = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/trades/history`)
}

// Draft pick functions
export const getDraftPickValues = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/draft-picks/values`)
}

export const getDraftPickSettings = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/draft-picks/settings`)
}

export const calculateDraftPickValue = async (leagueId: string, draftPickData: Record<string, unknown>) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/draft-picks/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(draftPickData)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to calculate draft pick value: ${response.status}`)
  }
  
  return response.json()
}

// Missing functions that were causing deployment crashes
export const getCompanionAppInfo = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/companion-app-info`)
}

export const generateInviteLink = async (leagueId: string) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/invite-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to generate invite link: ${response.status}`)
  }
  
  return response.json()
}

export const assignTeamToUser = async (leagueId: string, userId: string, teamId: string) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/assign-team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ userId, teamId })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to assign team: ${response.status}`)
  }
  
  return response.json()
}

export const updateMemberRole = async (leagueId: string, userId: string, role: string) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/member-role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ userId, role })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to update member role: ${response.status}`)
  }
  
  return response.json()
}

export const assignTeamToUserFlexible = async (leagueId: string, userId: string, teamId: string) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/assign-team-flexible`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ userId, teamId })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to assign team flexibly: ${response.status}`)
  }
  
  return response.json()
}

export const unassignTeam = async (leagueId: string, userId: string) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/unassign-team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ userId })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to unassign team: ${response.status}`)
  }
  
  return response.json()
}

export const getInvite = async (inviteCode: string) => {
  return fetchFromApi(`/invites/${inviteCode}`)
}

export const getVacantTeamsForInvite = async (inviteCode: string) => {
  return fetchFromApi(`/invites/${inviteCode}/vacant-teams`)
}

export const acceptInvite = async (inviteCode: string, teamId: string) => {
  const response = await fetch(`${API_BASE}/invites/${inviteCode}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ teamId })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to accept invite: ${response.status}`)
  }
  
  return response.json()
}

export const getPlayerContract = async (leagueId: string, playerId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/players/${playerId}/contract`)
}

export const getLeagueReport = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/report`)
}

export const getRuleSuggestions = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/rule-suggestions`)
}

export const getAICommissionerHealth = async (leagueId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/ai-commissioner/health`)
}

export const evaluateTrade = async (leagueId: string, tradeData: Record<string, unknown>) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/ai-commissioner/evaluate-trade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(tradeData)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to evaluate trade: ${response.status}`)
  }
  
  return response.json()
}

export const resolveDispute = async (leagueId: string, disputeData: Record<string, unknown>) => {
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/ai-commissioner/resolve-dispute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(disputeData)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to resolve dispute: ${response.status}`)
  }
  
  return response.json()
}

export const getPlayerCareerStats = async (leagueId: string, playerId: string) => {
  return fetchFromApi(`/leagues/${leagueId}/players/${playerId}/career-stats`)
}
