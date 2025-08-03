// src/lib/trades.ts - Enhanced Trade API Service

import { API_BASE } from '@/lib/config'

// Helper function to get auth token (you may need to adjust this based on your auth system)
const getAuthToken = (): string => {
  // This should return your actual auth token
  // For now, we'll use cookie-based auth which is already set up
  return ''
}

// Get user's assigned team for a league
export const getUserTeam = async (leagueId: string) => {
  const response = await fetch(`${API_BASE}/api/enhanced-trade/user-team/${leagueId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get user team')
  }
  
  return response.json()
}

// Enhanced trade proposal submission
export const submitTradeProposal = async (tradeData: {
  leagueId: string
  teamFromId: number
  teamToId: number
  items: Array<{
    playerId?: number
    draftRound?: number
    draftYear?: number
    fromTeamId: number
    toTeamId: number
  }>
  notes?: string
}) => {
  const response = await fetch(`${API_BASE}/api/enhanced-trade/propose-trade`, {
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
    throw new Error(error.error || 'Failed to submit trade proposal')
  }
  
  return response.json()
}

// Respond to trade proposal (accept/decline)
export const respondToTrade = async (tradeId: string, action: 'accept' | 'decline') => {
  const response = await fetch(`${API_BASE}/api/enhanced-trade/respond-trade/${tradeId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include',
    body: JSON.stringify({ action })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to respond to trade')
  }
  
  return response.json()
}

// Get detailed trade calculations
export const getTradeCalculations = async (tradeId: string) => {
  const response = await fetch(`${API_BASE}/api/enhanced-trade/trade-calculations/${tradeId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get trade calculations')
  }
  
  return response.json()
}

// Legacy trade submission (keeping for backward compatibility)
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

// Enhanced trades history with new statuses
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

// Get user notifications
export const getUserNotifications = async (type?: string) => {
  const params = new URLSearchParams()
  if (type) {
    params.append('type', type)
  }
  
  const response = await fetch(`${API_BASE}/api/notifications?${params}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch notifications')
  }
  
  return response.json()
}

// Enhanced Types for trade data
export interface UserTeam {
  id: number
  name: string
  city: string
  abbreviation: string
}

export interface TradeAnalysis {
  team_from_analysis: {
    total_value: number
    item_count: number
    item_details: Array<{
      name?: string
      draft_round?: number
      draft_year?: number
      value: number
      final_value?: number
    }>
    team_needs_impact: number
    market_impact: number
  }
  team_to_analysis: {
    total_value: number
    item_count: number
    item_details: Array<{
      name?: string
      draft_round?: number
      draft_year?: number
      value: number
      final_value?: number
    }>
    team_needs_impact: number
    market_impact: number
  }
  fairness_analysis: {
    fairness_score: number
    verdict: string
    difference: number
    difference_percentage: number
  }
  recommendations: Array<{
    type: string
    priority: 'low' | 'medium' | 'high'
    message: string
    suggestion: string
  }>
}

export interface TradeProposalResponse {
  success: boolean
  trade_id: number
  status: string
  message: string
  trade_analysis: TradeAnalysis
}

export interface Trade {
  id: string
  status: 'proposed' | 'accepted' | 'declined' | 'committee_review' | 'approved' | 'pending' | 'denied' | 'cancelled'
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
  isRecipient?: boolean
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

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: string
  created_at: string
  read: boolean
}

// Trade status utilities
export const TRADE_STATUSES = {
  'proposed': 'Proposed',
  'accepted': 'Accepted',
  'declined': 'Declined', 
  'committee_review': 'Under Committee Review',
  'approved': 'Approved',
  'pending': 'Pending',
  'denied': 'Denied',
  'cancelled': 'Cancelled'
}

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'proposed': 'orange',
    'accepted': 'blue',
    'declined': 'red',
    'committee_review': 'purple',
    'approved': 'green',
    'pending': 'yellow',
    'denied': 'red',
    'cancelled': 'gray'
  }
  return colors[status] || 'gray'
} 