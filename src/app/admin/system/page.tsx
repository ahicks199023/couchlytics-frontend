'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/adminApi'
import useAuth from '@/Hooks/useAuth'

export default function SystemMonitoringPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [costStats, setCostStats] = useState<Record<string, unknown> | null>(null)
  const [recommendations, setRecommendations] = useState<Record<string, unknown> | null>(null)
  const [systemLogs, setSystemLogs] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

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
      fetchSystemData()
    }
  }, [user, authLoading, router])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [costStatsData, recommendationsData, logsData] = await Promise.all([
        adminApi.getCostStats(),
        adminApi.getCostRecommendations(),
        adminApi.getSystemLogs({ limit: 50 })
      ])

      setCostStats(costStatsData)
      setRecommendations(recommendationsData)
      setSystemLogs(logsData?.logs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    try {
      setActionLoading(true)
      const result = await adminApi.createSystemBackup()
      if (result) {
        alert(`System backup initiated. Backup ID: ${result.backup_id}`)
      } else {
        alert('Failed to initiate backup')
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearCache = async () => {
    try {
      setActionLoading(true)
      const success = await adminApi.clearSystemCache()
      if (success) {
        alert('System cache cleared successfully')
        fetchSystemData() // Refresh data
      } else {
        alert('Failed to clear cache')
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOptimizeCosts = async () => {
    try {
      setActionLoading(true)
      const success = await adminApi.optimizeCosts()
      if (success) {
        alert('Cost optimization applied successfully')
        fetchSystemData() // Refresh data
      } else {
        alert('Failed to apply cost optimization')
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading System Data...</div>
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neon-green">System Monitoring</h1>
            <p className="text-gray-400 mt-2">Monitor system health, costs, and performance</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleBackup}
              disabled={actionLoading}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Create Backup'}
            </button>
            <button
              onClick={handleClearCache}
              disabled={actionLoading}
              className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Clear Cache'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Cost Monitoring */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">💰 Cost Analytics</h2>
          {costStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Monthly Estimate</p>
                <p className="text-3xl font-bold text-white">
                  ${(costStats as { monthly_estimate?: number }).monthly_estimate || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Redis Operations</p>
                <p className="text-2xl font-bold text-white">
                  {(costStats as { redis_operations?: number }).redis_operations || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Database Queries</p>
                <p className="text-2xl font-bold text-white">
                  {(costStats as { database_queries?: number }).database_queries || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Compute Time</p>
                <p className="text-2xl font-bold text-white">
                  {(costStats as { compute_time?: number }).compute_time || 'N/A'}h
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">No cost data available</div>
          )}
        </div>

        {/* Cost Optimization Recommendations */}
        {recommendations && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">🎯 Optimization Recommendations</h2>
              <button
                onClick={handleOptimizeCosts}
                disabled={actionLoading}
                className="bg-neon-green text-black font-semibold px-4 py-2 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Applying...' : 'Apply Optimizations'}
              </button>
            </div>
            <div className="space-y-3">
              {Array.isArray(recommendations.recommendations) && recommendations.recommendations.map((rec: Record<string, unknown>, index: number) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">{(rec as { title?: string }).title}</h3>
                  <p className="text-gray-300 text-sm mb-2">{(rec as { description?: string }).description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 text-sm">
                      Potential Savings: {(rec as { savings?: string }).savings}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      (rec as { priority?: string }).priority === 'high' ? 'bg-red-900 text-red-200' :
                      (rec as { priority?: string }).priority === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-blue-900 text-blue-200'
                    }`}>
                      {(rec as { priority?: string }).priority} priority
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-400">No recommendations available</div>
              )}
            </div>
          </div>
        )}

        {/* System Logs */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">📋 System Logs</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {systemLogs.length > 0 ? (
              systemLogs.map((log, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">
                      {(log as { type?: string }).type || 'System'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {(log as { timestamp?: string }).timestamp ? new Date((log as { timestamp?: string }).timestamp!).toLocaleString() : 'Unknown time'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{(log as { message?: string; description?: string }).message || (log as { message?: string; description?: string }).description}</p>
                  {(log as { level?: string }).level && (
                    <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
                      (log as { level?: string }).level === 'error' ? 'bg-red-900 text-red-200' :
                      (log as { level?: string }).level === 'warning' ? 'bg-yellow-900 text-yellow-200' :
                      (log as { level?: string }).level === 'info' ? 'bg-blue-900 text-blue-200' :
                      'bg-gray-600 text-gray-200'
                    }`}>
                      {(log as { level?: string }).level}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400">No logs available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}