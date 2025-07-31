import { API_BASE } from './config'
import { StatsLeadersResponse, StatsLeadersSummaryResponse } from '@/types/stats-leaders'

export interface StatsLeadersParams {
  type: 'players' | 'teams'
  category: 'offensive' | 'defensive'
  stat: string
  limit?: number
}

export class StatsLeadersAPI {
  private static async fetchWithAuth(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }

  static async getStatsLeaders(
    leagueId: string,
    params: StatsLeadersParams
  ): Promise<StatsLeadersResponse> {
    const queryParams = new URLSearchParams({
      type: params.type,
      category: params.category,
      stat: params.stat,
      limit: (params.limit || 10).toString(),
    })

    const endpoint = `/leagues/${leagueId}/stats-leaders?${queryParams.toString()}`
    console.log('Making stats leaders API call to:', `${API_BASE}${endpoint}`)
    console.log('Parameters:', params)

    const response = await this.fetchWithAuth(endpoint)
    
    console.log('Stats leaders response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Stats leaders API Error response:', errorText)
      throw new Error(`Failed to fetch stats leaders: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Stats leaders API Success response:', data)
    return data
  }

  static async getSummary(leagueId: string): Promise<StatsLeadersSummaryResponse> {
    const endpoint = `/leagues/${leagueId}/stats-leaders/summary`
    console.log('Making API call to:', `${API_BASE}${endpoint}`)
    
    const response = await this.fetchWithAuth(endpoint)
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error response:', errorText)
      throw new Error(`Failed to fetch stats leaders summary: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('API Success response:', data)
    return data
  }

  // Convenience methods for specific stat types
  static async getPlayerPassingLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'players',
      category: 'offensive',
      stat: 'passing',
      limit,
    })
  }

  static async getPlayerRushingLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'players',
      category: 'offensive',
      stat: 'rushing',
      limit,
    })
  }

  static async getPlayerReceivingLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'players',
      category: 'offensive',
      stat: 'receiving',
      limit,
    })
  }

  static async getPlayerTacklesLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'players',
      category: 'defensive',
      stat: 'tackles',
      limit,
    })
  }

  static async getPlayerSacksLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'players',
      category: 'defensive',
      stat: 'sacks',
      limit,
    })
  }

  static async getPlayerInterceptionsLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'players',
      category: 'defensive',
      stat: 'interceptions',
      limit,
    })
  }

  static async getTeamTotalYardsLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'teams',
      category: 'offensive',
      stat: 'total_yards',
      limit,
    })
  }

  static async getTeamPassingLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'teams',
      category: 'offensive',
      stat: 'passing',
      limit,
    })
  }

  static async getTeamRushingLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'teams',
      category: 'offensive',
      stat: 'rushing',
      limit,
    })
  }

  static async getTeamYardsAllowedLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'teams',
      category: 'defensive',
      stat: 'yards_allowed',
      limit,
    })
  }

  static async getTeamSacksLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'teams',
      category: 'defensive',
      stat: 'sacks',
      limit,
    })
  }

  static async getTeamTurnoversLeaders(leagueId: string, limit = 10) {
    return this.getStatsLeaders(leagueId, {
      type: 'teams',
      category: 'defensive',
      stat: 'turnovers',
      limit,
    })
  }
} 