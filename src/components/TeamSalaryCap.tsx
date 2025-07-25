'use client'

import { useEffect, useState } from 'react'
import { analyticsApi, formatCurrency, formatPercentage } from '@/lib/analytics'
import { TeamSalaryCap as TeamSalaryCapType } from '@/types/analytics'

interface TeamSalaryCapProps {
  leagueId: string | number
  teamId: string | number
}

export default function TeamSalaryCap({ leagueId, teamId }: TeamSalaryCapProps) {
  const [salaryCap, setSalaryCap] = useState<TeamSalaryCapType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalaryCap = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await analyticsApi.getTeamSalaryCap(leagueId, teamId)
        setSalaryCap(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch salary cap data')
        console.error('Error fetching salary cap:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSalaryCap()
  }, [leagueId, teamId])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
        <span className="ml-2 text-white">Loading salary cap data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Salary Cap</h3>
        <p className="text-red-300">{error}</p>
      </div>
    )
  }

  if (!salaryCap) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">No salary cap data available</p>
      </div>
    )
  }

  const getCapUsageColor = (percentage: number) => {
    if (percentage < 0.8) return 'text-green-400'
    if (percentage < 0.9) return 'text-yellow-400'
    if (percentage < 0.95) return 'text-orange-400'
    return 'text-red-400'
  }

  const getCapUsageBarColor = (percentage: number) => {
    if (percentage < 0.8) return 'bg-green-500'
    if (percentage < 0.9) return 'bg-yellow-500'
    if (percentage < 0.95) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-neon-green mb-4">
          {salaryCap.teamName} - Salary Cap
        </h2>

        {/* Salary Cap Overview */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cap Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">Total Cap</div>
              <div className="text-white text-2xl font-bold">{formatCurrency(salaryCap.salaryCap.total)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">Used</div>
              <div className="text-white text-2xl font-bold">{formatCurrency(salaryCap.salaryCap.used)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">Available</div>
              <div className="text-white text-2xl font-bold">{formatCurrency(salaryCap.salaryCap.available)}</div>
            </div>
          </div>

          {/* Cap Usage Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Cap Usage</span>
              <span className={`font-medium ${getCapUsageColor(salaryCap.salaryCap.percentageUsed)}`}>
                {formatPercentage(salaryCap.salaryCap.percentageUsed)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getCapUsageBarColor(salaryCap.salaryCap.percentageUsed)}`}
                style={{ width: `${Math.min(salaryCap.salaryCap.percentageUsed * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Player Count */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Roster Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Total Players</div>
              <div className="text-white font-medium text-lg">{salaryCap.playerCount.total}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Active Roster</div>
              <div className="text-green-400 font-medium text-lg">{salaryCap.playerCount.active}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Practice Squad</div>
              <div className="text-yellow-400 font-medium text-lg">{salaryCap.playerCount.practice}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Injured</div>
              <div className="text-red-400 font-medium text-lg">{salaryCap.playerCount.injured}</div>
            </div>
          </div>
        </div>

        {/* Contract Summary */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Contract Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Total Value</div>
              <div className="text-white font-medium">{formatCurrency(salaryCap.contracts.totalValue)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Average Value</div>
              <div className="text-white font-medium">{formatCurrency(salaryCap.contracts.averageValue)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Highest Value</div>
              <div className="text-green-400 font-medium">{formatCurrency(salaryCap.contracts.highestValue)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Lowest Value</div>
              <div className="text-red-400 font-medium">{formatCurrency(salaryCap.contracts.lowestValue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Contracts Table */}
      {salaryCap.players && salaryCap.players.length > 0 && (
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-neon-green mb-4">Player Contracts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-400">Player</th>
                  <th className="text-left py-2 px-2 text-gray-400">Position</th>
                  <th className="text-right py-2 px-2 text-gray-400">Salary</th>
                  <th className="text-center py-2 px-2 text-gray-400">Years</th>
                  <th className="text-right py-2 px-2 text-gray-400">Dead Cap</th>
                </tr>
              </thead>
              <tbody>
                {salaryCap.players
                  .sort((a, b) => b.salary - a.salary) // Sort by salary descending
                  .map((player) => (
                    <tr key={player.playerId} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-2 px-2 text-white font-medium">{player.playerName}</td>
                      <td className="py-2 px-2 text-gray-300">{player.position}</td>
                      <td className="py-2 px-2 text-right text-white">{formatCurrency(player.salary)}</td>
                      <td className="py-2 px-2 text-center text-gray-300">{player.contractLength}</td>
                      <td className="py-2 px-2 text-right text-gray-300">{formatCurrency(player.deadCap)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Contract Summary Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
            <div className="text-center">
              <div>Total Players</div>
              <div className="text-white font-medium">{salaryCap.players.length}</div>
            </div>
            <div className="text-center">
              <div>Avg Salary</div>
              <div className="text-white font-medium">
                {formatCurrency(salaryCap.players.reduce((sum, p) => sum + p.salary, 0) / salaryCap.players.length)}
              </div>
            </div>
            <div className="text-center">
              <div>Total Dead Cap</div>
              <div className="text-white font-medium">
                {formatCurrency(salaryCap.players.reduce((sum, p) => sum + p.deadCap, 0))}
              </div>
            </div>
            <div className="text-center">
              <div>Avg Contract Length</div>
              <div className="text-white font-medium">
                {(salaryCap.players.reduce((sum, p) => sum + p.contractLength, 0) / salaryCap.players.length).toFixed(1)} years
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 