// Admin API Service
import { API_BASE } from './config'

// Types for Admin Dashboard
export interface AdminDashboard {
  title: string
  user_info: UserInfo
  metrics: SystemMetrics
  cost_monitoring: CostMonitoring
  user_management: UserManagement
  league_management: LeagueManagement
  content_curation: ContentCuration
  recent_activity: Activity[]
  system_alerts: Alert[]
  quick_actions: QuickAction[]
  system_status: SystemStatus
}

export interface UserInfo {
  user_id: number
  role: string
  permissions: string[]
}

export interface SystemMetrics {
  total_users: number
  active_users: number
  total_leagues: number
  active_leagues: number
  system_health: string
  recent_users: number
  recent_leagues: number
}

export interface CostMonitoring {
  throttle_stats: ThrottleStats
  cache_available: boolean
  estimated_monthly_costs: MonthlyCosts
  optimization_status: OptimizationStatus
}

export interface ThrottleStats {
  calculations_last_minute: number
  active_calculations: number
  max_per_minute: number
  max_concurrent: number
  can_proceed: boolean
}

export interface MonthlyCosts {
  redis_operations: number
  database_queries: number
  compute_time: number
  total_estimated: number
}

export interface OptimizationStatus {
  fast_mode_enabled: boolean
  cache_ttl_optimized: boolean
  rate_limiting_active: boolean
  batch_processing_available: boolean
}

export interface UserManagement {
  users_by_status: {
    active: number
    inactive: number
    total: number
  }
  recent_registrations: number
  management_actions: ManagementAction[]
}

export interface LeagueManagement {
  total_leagues: number
  active_leagues: number
  total_memberships: number
  recent_leagues: number
  management_actions: ManagementAction[]
}

export interface ContentCuration {
  announcements: {
    total: number
    published: number
    draft: number
  }
  management_actions: ManagementAction[]
}

export interface ManagementAction {
  action: string
  description: string
}

export interface Activity {
  type: string
  description: string
  timestamp: string
  user: string
}

export interface Alert {
  type: string
  title: string
  message: string
  priority: string
}

export interface QuickAction {
  action: string
  label: string
  icon: string
  category: string
}

export interface SystemStatus {
  database: string
  redis_cache: string
  rate_limiting: string
  system_load: string
  last_updated: string
}

export interface User {
  id: number
  email: string
  name: string
  is_active: boolean
  created_at: string
  last_login: string
  role: string
}

export interface League {
  id: number
  name: string
  description: string
  is_active: boolean
  created_at: string
  member_count: number
  commissioner_id: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  dashboard_data?: T
}

// API Service Class
export class AdminApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE}/admin`
  }

  // Helper method to check authentication status
  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      return response.ok
    } catch (error) {
      console.error('Auth check failed:', error)
      return false
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      // Handle authentication errors specifically
      if (response.status === 401) {
        console.error('Admin API Authentication Error: Session expired or not authenticated')
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return {
          success: false,
          error: 'Authentication required. Please log in again.',
        }
      }

      if (response.status === 403) {
        console.error('Admin API Authorization Error: Insufficient permissions')
        return {
          success: false,
          error: 'Access denied. Admin privileges required.',
        }
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return data
    } catch (error) {
      console.error(`Admin API Error (${endpoint}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Dashboard endpoints
  async getDashboard(): Promise<AdminDashboard | null> {
    const response = await this.makeRequest<AdminDashboard>('/dashboard')
    return response.success ? response.dashboard_data || null : null
  }

  // User Management endpoints
  async getUsers(params: {
    page?: number
    per_page?: number
    search?: string
    active?: boolean
  } = {}): Promise<{ users: User[]; total: number; page: number; per_page: number } | null> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.set('page', params.page.toString())
    if (params.per_page) queryParams.set('per_page', params.per_page.toString())
    if (params.search) queryParams.set('search', params.search)
    if (params.active !== undefined) queryParams.set('active', params.active.toString())

    const response = await this.makeRequest<{ users: User[]; total: number; page: number; per_page: number }>(
      `/users?${queryParams.toString()}`
    )
    return response.success ? response.data || null : null
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<boolean> {
    const response = await this.makeRequest('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        new_password: newPassword,
      }),
    })
    return response.success
  }

  async suspendUser(userId: number, suspend: boolean): Promise<boolean> {
    const response = await this.makeRequest('/users/suspend', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        suspend: suspend,
      }),
    })
    return response.success
  }

  // League Management endpoints
  async getLeagues(params: {
    page?: number
    per_page?: number
    search?: string
    active?: boolean
  } = {}): Promise<{ leagues: League[]; total: number; page: number; per_page: number } | null> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.set('page', params.page.toString())
    if (params.per_page) queryParams.set('per_page', params.per_page.toString())
    if (params.search) queryParams.set('search', params.search)
    if (params.active !== undefined) queryParams.set('active', params.active.toString())

    const response = await this.makeRequest<{ leagues: League[]; total: number; page: number; per_page: number }>(
      `/leagues?${queryParams.toString()}`
    )
    return response.success ? response.data || null : null
  }

  async assignUserToLeague(
    userId: number,
    leagueId: number,
    teamId?: number,
    role: string = 'member'
  ): Promise<boolean> {
    const response = await this.makeRequest('/leagues/assign-user', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        league_id: leagueId,
        team_id: teamId,
        role: role,
      }),
    })
    return response.success
  }

  async getLeagueMembers(
    leagueId: number,
    params: { page?: number; per_page?: number } = {}
  ): Promise<{ members: Record<string, unknown>[]; total: number; page: number; per_page: number } | null> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.set('page', params.page.toString())
    if (params.per_page) queryParams.set('per_page', params.per_page.toString())

    const response = await this.makeRequest<{ members: Record<string, unknown>[]; total: number; page: number; per_page: number }>(
      `/leagues/${leagueId}/members?${queryParams.toString()}`
    )
    return response.success ? response.data || null : null
  }

  // System Management endpoints
  async createSystemBackup(): Promise<{ backup_id: string } | null> {
    const response = await this.makeRequest<{ backup_id: string }>('/system/backup', {
      method: 'POST',
    })
    return response.success ? response.data || null : null
  }

  async clearSystemCache(): Promise<boolean> {
    const response = await this.makeRequest('/system/clear-cache', {
      method: 'POST',
    })
    return response.success
  }

  async getSystemLogs(params: {
    type?: string
    limit?: number
  } = {}): Promise<{ logs: Record<string, unknown>[] } | null> {
    const queryParams = new URLSearchParams()
    if (params.type) queryParams.set('type', params.type)
    if (params.limit) queryParams.set('limit', params.limit.toString())

    const response = await this.makeRequest<{ logs: Record<string, unknown>[] }>(
      `/system/logs?${queryParams.toString()}`
    )
    return response.success ? response.data || null : null
  }

  // Cost Monitoring endpoints
  async getCostStats(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${API_BASE}/api/cost/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (response.status === 401) {
        console.error('Cost Stats Authentication Error: Session expired or not authenticated')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return {}
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Cost Stats API Error:', error)
      return {}
    }
  }

  async getCostRecommendations(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${API_BASE}/api/cost/recommendations`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (response.status === 401) {
        console.error('Cost Recommendations Authentication Error: Session expired or not authenticated')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return {}
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Cost Recommendations API Error:', error)
      return {}
    }
  }

  async optimizeCosts(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/cost/optimize`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (response.status === 401) {
        console.error('Cost Optimization Authentication Error: Session expired or not authenticated')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return false
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.success || false
    } catch (error) {
      console.error('Cost Optimization API Error:', error)
      return false
    }
  }
}

// Export singleton instance
export const adminApi = new AdminApiService()

// Helper function to handle API responses
export const handleApiResponse = <T>(response: ApiResponse<T>): T => {
  if (response.success) {
    return response.data || response.dashboard_data as T
  } else {
    throw new Error(response.error || 'Unknown error')
  }
}
