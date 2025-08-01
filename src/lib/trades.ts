// src/lib/trades.ts - Trade API Service

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.couchlytics.com'

// Helper function to get auth token (you may need to adjust this based on your auth system)
const getAuthToken = (): string => {
  // This should return your actual auth token
  // For now, we'll use cookie-based auth which is already set up
  return ''
}

// Trade submission
export const submitTrade = async (tradeData: {
  leagueId: string
  teamFromId: number
  teamToId: number
  notes?: string
  items: Array<{
    type: 'player' | 'draft_pick'
    playerId?: number
    round?: number
    year?: number
    fromTeamId: number
    toTeamId: number
  }>
}) => {
  const response = await fetch(`${API_BASE}/submit-trade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include',
    body: JSON.stringify(tradeData)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to submit trade')
  }
  
  return response.json()
}

// Trade cancellation
export const cancelTrade = async (tradeId: string) => {
  const response = await fetch(`${API_BASE}/trades/${tradeId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to cancel trade')
  }
  
  return response.json()
}

// Trades history
export const fetchTradesHistory = async (
  leagueId: string, 
  options: { status?: string; page?: number; limit?: number } = {}
) => {
  const { status = 'all', page = 1, limit = 50 } = options
  
  const params = new URLSearchParams({
    status,
    page: page.toString(),
    limit: limit.toString()
  })
  
  const response = await fetch(`${API_BASE}/leagues/${leagueId}/trades?${params}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch trades')
  }
  
  return response.json()
}

// Types for trade data
export interface Trade {
  id: string
  status: 'pending' | 'approved' | 'denied' | 'cancelled'
  created_at: string
  team_from: {
    id: number
    name: string
  }
  team_to: {
    id: number
    name: string
  }
  team_from_items: Array<{
    id: string
    type: 'player' | 'draft_pick'
    player?: {
      id: number
      name: string
      position: string
    }
    draft_pick?: {
      round: number
      year: number
    }
  }>
  team_to_items: Array<{
    id: string
    type: 'player' | 'draft_pick'
    player?: {
      id: number
      name: string
      position: string
    }
    draft_pick?: {
      round: number
      year: number
    }
  }>
  notes?: string
}

export interface Pagination {
  page: number
  total_pages: number
  total_items: number
  has_prev: boolean
  has_next: boolean
}

export interface TradesResponse {
  trades: Trade[]
  pagination: Pagination
} 