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

// System Announcements Types
export interface SystemAnnouncement {
  id: number
  title: string
  content: string
  author: string
  author_role: string
  created_at: string
  updated_at: string
  priority: 'low' | 'medium' | 'high'
  category: 'announcement' | 'update' | 'maintenance' | 'feature'
  is_published: boolean
  cover_photo?: string
}

export interface CreateAnnouncementData {
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  category: 'announcement' | 'update' | 'maintenance' | 'feature'
  is_published: boolean
  cover_photo?: string
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
      const url = `${this.baseUrl}/dashboard`
      console.log(`🔐 Checking auth status: GET ${url}`)
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      
      console.log(`🔐 Auth status response: ${response.status} ${response.statusText}`)
      return response.ok
    } catch (error) {
      console.error('Auth check failed:', error)
      return false
    }
  }

  // CORS preflight check function
  private async checkCORS(url: string, method: string = 'PATCH'): Promise<boolean> {
    try {
      console.log(`🔍 Checking CORS preflight for ${method} ${url}`)
      
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': method,
          'Access-Control-Request-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Origin': typeof window !== 'undefined' ? window.location.origin : '',
        },
      })
      
      console.log(`🔍 CORS Preflight Response: ${response.status}`)
      console.log(`🔍 CORS Headers:`, {
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin')
      })
      
      return response.ok
    } catch (error) {
      console.error('❌ CORS Preflight failed:', error)
      return false
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T & { success: boolean } | ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      console.log(`🔍 Admin API Request: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // Add this for CORS
          ...options.headers,
        },
        ...options,
      })

      console.log(`📡 Admin API Response: ${response.status} ${response.statusText} for ${endpoint}`)

      // Handle CORS errors specifically
      if (response.status === 0 || (response.status >= 400 && response.status < 500)) {
        const corsError = response.status === 0 || 
          (response.statusText.includes('CORS') || 
           response.statusText.includes('blocked') ||
           response.statusText.includes('preflight'))
        
        if (corsError) {
          console.error('❌ CORS Error detected:', {
            status: response.status,
            statusText: response.statusText,
            endpoint: endpoint,
            method: options.method || 'GET'
          })
          return {
            success: false,
            error: `CORS Error: ${response.statusText}. Please refresh the page and try again.`,
          }
        }
      }

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

      if (response.status === 404) {
        console.error(`Admin API Not Found Error: ${endpoint} - Endpoint may not be implemented`)
        return {
          success: false,
          error: `Endpoint not found: ${endpoint}. Please check if the backend endpoint is implemented.`,
        }
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle case where backend returns null instead of expected data structure
      if (data === null || data === undefined) {
        console.warn(`⚠️ Backend returned null for ${endpoint} - endpoint may not be fully implemented`)
        return {
          success: false,
          error: `Backend endpoint ${endpoint} returned null data. The endpoint may not be fully implemented.`,
        }
      }

      // The backend returns data directly, so we return it as-is
      return data as T & { success: true }
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
    const response = await this.makeRequest<{ dashboard_data: AdminDashboard }>('/dashboard')
    console.log('🔍 getDashboard response:', response)
    
    if (response.success && 'dashboard_data' in response && response.dashboard_data) {
      console.log('✅ Dashboard data found')
      return response.dashboard_data as AdminDashboard
    }
    
    console.warn('⚠️ No dashboard data in response or success=false')
    return null
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
    
    // The backend returns data directly in the response, not nested under 'data'
    console.log('🔍 getUsers response:', response)
    
    if (response.success && 'users' in response) {
      console.log('✅ Users data found:', response.users.length, 'users')
      return {
        users: response.users,
        total: response.total,
        page: response.page,
        per_page: response.per_page
      }
    }
    
    console.warn('⚠️ No users data in response or success=false')
    return null
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
    
    // The backend returns data directly in the response, not nested under 'data'
    console.log('🔍 getLeagues response:', response)
    
    if (response.success && 'leagues' in response) {
      console.log('✅ Leagues data found:', response.leagues.length, 'leagues')
      return {
        leagues: response.leagues,
        total: response.total,
        page: response.page,
        per_page: response.per_page
      }
    }
    
    console.warn('⚠️ No leagues data in response or success=false')
    return null
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
    
    if (response.success && 'members' in response) {
      return {
        members: response.members,
        total: response.total,
        page: response.page,
        per_page: response.per_page
      }
    }
    
    return null
  }

  // System Management endpoints
  async createSystemBackup(): Promise<{ backup_id: string } | null> {
    const response = await this.makeRequest<{ backup_id: string }>('/system/backup', {
      method: 'POST',
    })
    return response.success && 'backup_id' in response ? response : null
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
    return response.success && 'logs' in response ? response : null
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

  // System Announcements Methods
  async getSystemAnnouncements(): Promise<SystemAnnouncement[]> {
    try {
      const response = await this.makeRequest<{ announcements: SystemAnnouncement[] }>('/announcements')
      console.log('🔍 getSystemAnnouncements response:', response)
      
      if (response.success && 'announcements' in response && Array.isArray(response.announcements)) {
        console.log('✅ System announcements data found:', response.announcements.length, 'announcements')
        return response.announcements
      }
      
      console.warn('⚠️ No system announcements data in response or success=false')
      return []
    } catch (error) {
      console.error('Error fetching system announcements:', error)
      return []
    }
  }

  async createSystemAnnouncement(data: CreateAnnouncementData): Promise<SystemAnnouncement> {
    try {
      const response = await this.makeRequest<SystemAnnouncement>('/announcements', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      console.log('🔍 createSystemAnnouncement response:', response)
      
      if (response.success && 'id' in response) {
        console.log('✅ System announcement created successfully')
        return response as SystemAnnouncement
      }
      
      throw new Error('Failed to create system announcement')
    } catch (error) {
      console.error('Error creating system announcement:', error)
      throw error
    }
  }

  async updateSystemAnnouncement(id: number, data: CreateAnnouncementData): Promise<SystemAnnouncement> {
    try {
      const response = await this.makeRequest<SystemAnnouncement>(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      console.log('🔍 updateSystemAnnouncement response:', response)
      
      if (response.success && 'id' in response) {
        console.log('✅ System announcement updated successfully')
        return response as SystemAnnouncement
      }
      
      throw new Error('Failed to update system announcement')
    } catch (error) {
      console.error('Error updating system announcement:', error)
      throw error
    }
  }

  async updateSystemAnnouncementStatus(id: number, isPublished: boolean): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/announcements/${id}/status`
      console.log(`🔍 Attempting to update announcement status: ${id} to ${isPublished}`)
      
      // Check CORS preflight first
      const corsOk = await this.checkCORS(url, 'PATCH')
      
      if (!corsOk) {
        console.warn('⚠️ CORS preflight failed - trying alternative approach')
        // Try with PUT method as fallback
        return await this.updateSystemAnnouncementStatusPUT(id, isPublished)
      }
      
      const response = await this.makeRequest<{ success: boolean }>(`/announcements/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ is_published: isPublished })
      })
      console.log('🔍 updateSystemAnnouncementStatus response:', response)
      
      if (response.success) {
        console.log('✅ System announcement status updated successfully')
        return true
      }
      
      throw new Error('Failed to update system announcement status')
    } catch (error) {
      console.error('❌ Error updating system announcement status:', error)
      
      // If PATCH fails with CORS error, try PUT method
      if (error instanceof Error && error.message.includes('CORS')) {
        console.log('🔄 CORS error detected, trying PUT method as fallback')
        return await this.updateSystemAnnouncementStatusPUT(id, isPublished)
      }
      
      throw error
    }
  }

  // Fallback method using PUT instead of PATCH
  private async updateSystemAnnouncementStatusPUT(id: number, isPublished: boolean): Promise<boolean> {
    try {
      console.log(`🔄 Trying PUT method for announcement status update: ${id}`)
      
      const response = await this.makeRequest<{ success: boolean }>(`/announcements/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ is_published: isPublished })
      })
      
      if (response.success) {
        console.log('✅ System announcement status updated successfully via PUT')
        return true
      }
      
      throw new Error('Failed to update system announcement status via PUT')
    } catch (error) {
      console.error('❌ Error updating system announcement status via PUT:', error)
      throw error
    }
  }

  async deleteSystemAnnouncement(id: number): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(`/announcements/${id}`, {
        method: 'DELETE'
      })
      console.log('🔍 deleteSystemAnnouncement response:', response)

      if (response.success) {
        console.log('✅ System announcement deleted successfully')
        return true
      }

      throw new Error('Failed to delete system announcement')
    } catch (error) {
      console.error('Error deleting system announcement:', error)
      throw error
    }
  }

  // Debug and utility methods
  async debugCORS(announcementId: number): Promise<void> {
    const url = `${this.baseUrl}/announcements/${announcementId}/status`
    console.log('🔍 CORS Debug Information:')
    console.log('URL:', url)
    console.log('Origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A')
    
    // Test OPTIONS request
    try {
      const optionsResponse = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'PATCH',
          'Access-Control-Request-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Origin': typeof window !== 'undefined' ? window.location.origin : '',
        },
      })
      
      console.log('OPTIONS Response Status:', optionsResponse.status)
      console.log('CORS Headers:', {
        'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': optionsResponse.headers.get('Access-Control-Allow-Credentials')
      })
    } catch (error) {
      console.error('OPTIONS request failed:', error)
    }
    
    // Test PATCH request
    try {
      const patchResponse = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ is_published: true })
      })
      
      console.log('PATCH Response Status:', patchResponse.status)
      console.log('PATCH Response Status Text:', patchResponse.statusText)
    } catch (error) {
      console.error('PATCH request failed:', error)
    }
  }

  // Image Upload Methods
  async uploadAnnouncementImage(file: File): Promise<string> {
    try {
      // Validate file
      if (!this.validateImageFile(file)) {
        throw new Error('Invalid file type or size')
      }

      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${this.baseUrl}/announcements/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Image upload failed')
      }

      const result = await response.json()
      console.log('🔍 uploadAnnouncementImage response:', result)

      if (result.success && result.image_url) {
        console.log('✅ Image uploaded successfully:', result.image_url)
        return result.image_url
      }

      throw new Error('Failed to upload image')
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  private validateImageFile(file: File): boolean {
    const maxFileSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a valid image file (PNG, JPG, JPEG, GIF, or WebP)')
    }

    // Check file size
    if (file.size > maxFileSize) {
      throw new Error('File size must be less than 5MB')
    }

    return true
  }
}

// Export singleton instance
export const adminApi = new AdminApiService()

// Helper function to handle API responses
export const handleApiResponse = <T>(response: ApiResponse<T>): T => {
  if (response.success) {
    return response as T
  } else {
    throw new Error(response.error || 'Unknown error')
  }
}
