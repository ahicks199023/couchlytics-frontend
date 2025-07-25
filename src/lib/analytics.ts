import { useState } from 'react'
import { 
  PlayerStats, 
  TeamStats, 
  TeamSalaryCap, 
  LeagueStandings, 
  AnalyticsError,
  LoadingState 
} from '@/types/analytics'

const ANALYTICS_BASE = 'https://api.couchlytics.com'

// Helper function to handle API responses with proper error handling
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage
    }
    throw new Error(errorMessage)
  }
  
  return response.json()
}

// Analytics API Service
export const analyticsApi = {
  // Get League Standings
  getLeagueStandings: async (leagueId: string | number): Promise<LeagueStandings> => {
    try {
      const response = await fetch(`${ANALYTICS_BASE}/leagues/${leagueId}/standings`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return handleApiResponse<LeagueStandings>(response)
    } catch (error) {
      console.error('Failed to fetch league standings:', error)
      throw new Error(`Failed to fetch league standings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Get Team Stats
  getTeamStats: async (leagueId: string | number, teamId: string | number): Promise<TeamStats> => {
    try {
      const response = await fetch(`${ANALYTICS_BASE}/leagues/${leagueId}/teams/${teamId}/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return handleApiResponse<TeamStats>(response)
    } catch (error) {
      console.error('Failed to fetch team stats:', error)
      throw new Error(`Failed to fetch team stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Get Team Salary Cap
  getTeamSalaryCap: async (leagueId: string | number, teamId: string | number): Promise<TeamSalaryCap> => {
    try {
      const response = await fetch(`${ANALYTICS_BASE}/leagues/${leagueId}/teams/${teamId}/salary-cap`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return handleApiResponse<TeamSalaryCap>(response)
    } catch (error) {
      console.error('Failed to fetch team salary cap:', error)
      throw new Error(`Failed to fetch team salary cap: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Get Player Individual Stats
  getPlayerStats: async (leagueId: string | number, playerId: string | number): Promise<PlayerStats> => {
    try {
      const response = await fetch(`${ANALYTICS_BASE}/leagues/${leagueId}/players/${playerId}/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return handleApiResponse<PlayerStats>(response)
    } catch (error) {
      console.error('Failed to fetch player stats:', error)
      throw new Error(`Failed to fetch player stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
}

// Custom hooks for analytics data with loading states
export const useAnalyticsData = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({})

  const setLoading = (key: string, isLoading: boolean, error: string | null = null) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { isLoading, error }
    }))
  }

  const fetchWithLoading = async <T>(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(key, true)
    try {
      const result = await fetchFn()
      setLoading(key, false)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLoading(key, false, errorMessage)
      return null
    }
  }

  return {
    loadingStates,
    setLoading,
    fetchWithLoading,
  }
}

// Utility functions for data formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

export const formatRecord = (wins: number, losses: number, ties: number = 0): string => {
  return `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`
}

export const getTeamRankingColor = (rank: number): string => {
  if (rank <= 3) return 'text-green-400'
  if (rank <= 6) return 'text-yellow-400'
  if (rank <= 9) return 'text-orange-400'
  return 'text-red-400'
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

export const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() })
}

export const clearCache = (): void => {
  cache.clear()
} 