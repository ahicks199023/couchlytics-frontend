// lib/api.ts
import { API_BASE } from './config'

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
