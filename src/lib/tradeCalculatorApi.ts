/**
 * Unified Trade Calculator API Service
 * Provides consistent trade analysis for both full page and popup interfaces
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'

export interface TradeAnalysis {
  verdict: string
  verdict_color: 'green' | 'lightgreen' | 'yellow' | 'orange' | 'red'
  net_value: number
  total_value_out: number
  total_value_in: number
  confidence: number
  user_team_id: number
  user_team_name: string
  league_id: string
}

export interface Player {
  id: number
  name: string
  position: string
  team_id: number
  team_name: string
  ovr: number
  age: number
  value: number
  enhanced_data: {
    valueBreakdown: {
      finalValue: number
      baseValue: number
      teamNeedMultiplier: number
    }
  }
  team_need_multiplier: number
}

export interface Team {
  id: number
  name: string
  is_user_team: boolean
}

export interface TradeAnalysisRequest {
  user_team_id: number
  players_out: number[]
  players_in: number[]
  draft_picks_out: number[]
  draft_picks_in: number[]
  include_team_analysis: boolean
  fast_mode: boolean
}

export interface TradeAnalysisResponse {
  success: boolean
  trade_analysis: TradeAnalysis
  players_out: Player[]
  players_in: Player[]
  draft_picks_out: Record<string, unknown>[]
  draft_picks_in: Record<string, unknown>[]
  analysis_mode: 'fast' | 'comprehensive'
  team_analysis_included: boolean
  detailed_analysis?: {
    positional_impact: Record<string, { out: number; in: number }>
    team_needs_analysis: {
      weak_positions: string[]
      strong_positions: string[]
      recommendations: string[]
    }
    trade_recommendation: string
  }
  timestamp: string
}

export interface PlayersResponse {
  success: boolean
  players: Player[]
  teams: Team[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
  user_team_id: number
  analysis_mode: 'fast' | 'comprehensive'
}

export interface TeamsResponse {
  success: boolean
  teams: Team[]
  user_team_id: number
}

class TradeCalculatorApi {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Analyze a trade with comprehensive player values and team impact analysis
   */
  async analyzeTrade(
    leagueId: string,
    request: TradeAnalysisRequest
  ): Promise<TradeAnalysisResponse> {
    return this.makeRequest<TradeAnalysisResponse>(
      `/leagues/${leagueId}/trade-calculator/analyze`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  /**
   * Get players available for trade calculator with enhanced values
   */
  async getPlayers(
    leagueId: string,
    options: {
      team_id?: number
      position?: string
      sort_by?: 'value' | 'ovr' | 'name' | 'age'
      page?: number
      per_page?: number
      fast_mode?: boolean
    } = {}
  ): Promise<PlayersResponse> {
    const params = new URLSearchParams()
    
    if (options.team_id) params.append('team_id', options.team_id.toString())
    if (options.position) params.append('position', options.position)
    if (options.sort_by) params.append('sort_by', options.sort_by)
    if (options.page) params.append('page', options.page.toString())
    if (options.per_page) params.append('per_page', options.per_page.toString())
    if (options.fast_mode !== undefined) params.append('fast_mode', options.fast_mode.toString())

    const queryString = params.toString()
    const endpoint = `/leagues/${leagueId}/trade-calculator/players${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<PlayersResponse>(endpoint)
  }

  /**
   * Get teams available for trade calculator
   */
  async getTeams(leagueId: string): Promise<TeamsResponse> {
    return this.makeRequest<TeamsResponse>(`/leagues/${leagueId}/trade-calculator/teams`)
  }

  /**
   * Analyze trade in fast mode (for popup)
   */
  async analyzeTradeFast(
    leagueId: string,
    userTeamId: number,
    playersOut: number[],
    playersIn: number[]
  ): Promise<TradeAnalysisResponse> {
    return this.analyzeTrade(leagueId, {
      user_team_id: userTeamId,
      players_out: playersOut,
      players_in: playersIn,
      draft_picks_out: [],
      draft_picks_in: [],
      include_team_analysis: false,
      fast_mode: true,
    })
  }

  /**
   * Analyze trade in comprehensive mode (for full page)
   */
  async analyzeTradeComprehensive(
    leagueId: string,
    userTeamId: number,
    playersOut: number[],
    playersIn: number[],
    draftPicksOut: number[] = [],
    draftPicksIn: number[] = []
  ): Promise<TradeAnalysisResponse> {
    return this.analyzeTrade(leagueId, {
      user_team_id: userTeamId,
      players_out: playersOut,
      players_in: playersIn,
      draft_picks_out: draftPicksOut,
      draft_picks_in: draftPicksIn,
      include_team_analysis: true,
      fast_mode: false,
    })
  }
}

// Export singleton instance
export const tradeCalculatorApi = new TradeCalculatorApi()

// Types are already exported as interfaces above
