'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, AdminDashboard, QuickAction } from '@/lib/adminApi'
import useAuth from '@/Hooks/useAuth'

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !user.isAdmin) {
      router.push('/unauthorized')
      return
    }

    if (user?.isAdmin) {
      fetchDashboard()
    }
  }, [user, authLoading, router])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check authentication first
      const isAuthenticated = await adminApi.checkAuthStatus()
      if (!isAuthenticated) {
        setError('Authentication required. Please log in again.')
        router.push('/login')
        return
      }
      
      const data = await adminApi.getDashboard()
      if (data) {
        setDashboard(data)
      } else {
        setError('Failed to load dashboard data. Please check your authentication.')
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      if (err instanceof Error && err.message.includes('Authentication')) {
        setError('Authentication required. Please log in again.')
        router.push('/login')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (action: QuickAction) => {
    try {
      switch (action.action) {
        case 'reset_user_password':
          // This would open a modal or navigate to user management
          router.push('/admin/users')
          break
        case 'create_announcement':
          router.push('/admin/announcements')
          break
        case 'assign_user_to_league':
          router.push('/admin/leagues')
          break
        case 'view_cost_stats':
          router.push('/admin/system/costs')
          break
        case 'system_backup':
          await adminApi.createSystemBackup()
          alert('System backup initiated')
          break
        case 'clear_cache':
          await adminApi.clearSystemCache()
          alert('System cache cleared')
          break
        default:
          console.log('Unknown action:', action.action)
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">No dashboard data available</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <h1 className="text-3xl font-bold text-neon-green">{dashboard.title}</h1>
        <p className="text-gray-400 mt-2">
          Welcome back, {user?.name || 'Admin'} • Role: {dashboard.user_info.role}
        </p>
      </div>

      <div className="p-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white">{dashboard.metrics.total_users}</p>
                <p className="text-green-400 text-sm">+{dashboard.metrics.recent_users} this week</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-3xl font-bold text-white">{dashboard.metrics.active_users}</p>
                <p className="text-green-400 text-sm">
                  {Math.round((dashboard.metrics.active_users / dashboard.metrics.total_users) * 100)}% active
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Leagues</p>
                <p className="text-3xl font-bold text-white">{dashboard.metrics.total_leagues}</p>
                <p className="text-green-400 text-sm">+{dashboard.metrics.recent_leagues} this week</p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Health</p>
                <p className="text-3xl font-bold text-green-400 capitalize">{dashboard.metrics.system_health}</p>
                <p className="text-gray-400 text-sm">All systems operational</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💚</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Monitoring Panel */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">💰 Cost Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Estimated Monthly Cost</p>
              <p className="text-2xl font-bold text-white">${dashboard.cost_monitoring.estimated_monthly_costs.total_estimated}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Calculations Last Minute</p>
              <p className="text-2xl font-bold text-white">{dashboard.cost_monitoring.throttle_stats.calculations_last_minute}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Cache Status</p>
              <p className={`text-2xl font-bold ${dashboard.cost_monitoring.cache_available ? 'text-green-400' : 'text-red-400'}`}>
                {dashboard.cost_monitoring.cache_available ? 'Available' : 'Unavailable'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dashboard.quick_actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getActionIcon(action.icon)}</span>
                    <div>
                      <p className="text-white font-medium">{action.label}</p>
                      <p className="text-gray-400 text-sm capitalize">{action.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">📈 Recent Activity</h2>
            <div className="space-y-3">
              {dashboard.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Alerts */}
        {dashboard.system_alerts.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">⚠️ System Alerts</h2>
            <div className="space-y-3">
              {dashboard.system_alerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  alert.priority === 'high' ? 'bg-red-900/20 border-red-500' :
                  alert.priority === 'medium' ? 'bg-yellow-900/20 border-yellow-500' :
                  'bg-blue-900/20 border-blue-500'
                }`}>
                  <h3 className="text-white font-medium">{alert.title}</h3>
                  <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">🔧 System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Database</p>
              <p className={`text-lg font-bold ${
                dashboard.system_status.database === 'connected' ? 'text-green-400' : 'text-red-400'
              }`}>
                {dashboard.system_status.database}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Redis Cache</p>
              <p className={`text-lg font-bold ${
                dashboard.system_status.redis_cache === 'connected' ? 'text-green-400' : 'text-red-400'
              }`}>
                {dashboard.system_status.redis_cache}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Rate Limiting</p>
              <p className={`text-lg font-bold ${
                dashboard.system_status.rate_limiting === 'active' ? 'text-green-400' : 'text-red-400'
              }`}>
                {dashboard.system_status.rate_limiting}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">System Load</p>
              <p className={`text-lg font-bold ${
                dashboard.system_status.system_load === 'normal' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {dashboard.system_status.system_load}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get action icons
function getActionIcon(iconName: string): string {
  const icons: { [key: string]: string } = {
    key: '🔑',
    bullhorn: '📢',
    users: '👥',
    'chart-line': '📈',
    save: '💾',
    trash: '🗑️',
  }
  return icons[iconName] || '⚡'
}
