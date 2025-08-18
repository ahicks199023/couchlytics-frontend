'use client'

import React, { useState, useEffect } from 'react'
import { getPlayerCareerStats, CareerStatsResponse, CareerStatsSeason } from '@/lib/api'

interface PlayerCareerStatsProps {
  leagueId: string
  playerId: string
}

export default function PlayerCareerStats({ leagueId, playerId }: PlayerCareerStatsProps) {
  const [careerData, setCareerData] = useState<CareerStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCareerStats()
  }, [leagueId, playerId])

  const fetchCareerStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPlayerCareerStats(leagueId, playerId)
      setCareerData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch career stats')
    } finally {
      setLoading(false)
    }
  }

  const getTableHeaders = (position: string) => {
    const pos = position?.toUpperCase()
    
    switch (pos) {
      case 'QB':
        return [
          'Season', 'CMP/ATT', 'CMP%', 'YDS', 'AVG', 'YDS/G', 'LNG', 'TD', 'INT', 'SACK', 'RTG',
          'ATT', 'YDS', 'AVG'
        ]
      case 'RB':
      case 'HB':
      case 'FB':
        return [
          'Season', 'ATT', 'YDS', 'AVG', 'TD', 'LNG', 'FUM', 'REC', 'YDS', 'AVG', 'TD', 'LNG',
          'TOTAL YDS', 'TOTAL TD'
        ]
      case 'WR':
      case 'TE':
        return [
          'Season', 'REC', 'YDS', 'AVG', 'TD', 'LNG', 'DROPS', 'ATT', 'YDS', 'AVG', 'TD',
          'TOTAL YDS', 'TOTAL TD'
        ]
      case 'K':
        return ['Season', 'FG', 'FG%', 'XP', 'XP%', 'PTS']
      case 'P':
        return ['Season', 'ATT', 'YDS', 'AVG', 'IN20', 'LNG']
      default:
        // Defense
        return [
          'Season', 'TKL', 'SACK', 'INT', 'INT YDS', 'TD', 'FF', 'FR', 'PD', 'SAF', 'PTS'
        ]
    }
  }

  const renderTableRow = (seasonData: CareerStatsSeason, position: string) => {
    const pos = position?.toUpperCase()
    
    const formatStat = (value: number | string | undefined) => {
      if (value === undefined || value === null) return '-'
      if (typeof value === 'string') return value
      return value.toString()
    }

    const formatPercentage = (value: number | undefined) => {
      if (value === undefined || value === null) return '-'
      return `${value.toFixed(1)}%`
    }

    const formatDecimal = (value: number | undefined) => {
      if (value === undefined || value === null) return '-'
      return value.toFixed(1)
    }

    switch (pos) {
      case 'QB':
        return (
          <tr key={seasonData.season} className="hover:bg-gray-700/50 transition-colors">
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{seasonData.season}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.cmp_att)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatPercentage(seasonData.cmp_pct)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.pass_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.pass_avg)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.yds_per_game)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.pass_long)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.pass_tds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.pass_ints)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.pass_sacks)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.passer_rating)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_att)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.rush_avg)}</td>
          </tr>
        )
      case 'RB':
      case 'HB':
      case 'FB':
        return (
          <tr key={seasonData.season} className="hover:bg-gray-700/50 transition-colors">
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{seasonData.season}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_att)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.rush_avg)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_tds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_long)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.fumbles)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rec)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rec_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.rec_avg)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rec_tds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rec_long)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.total_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.total_tds)}</td>
          </tr>
        )
      case 'WR':
      case 'TE':
        return (
          <tr key={seasonData.season} className="hover:bg-gray-700/50 transition-colors">
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{seasonData.season}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rec)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rec_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.rec_avg)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rec_tds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rec_long)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.drops)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_att)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.rush_avg)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.rush_tds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.total_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.total_tds)}</td>
          </tr>
        )
      case 'K':
        const fgMadeAtt = seasonData.fg_made && seasonData.fg_att ? `${seasonData.fg_made}/${seasonData.fg_att}` : '-'
        const xpMadeAtt = seasonData.xp_made && seasonData.xp_att ? `${seasonData.xp_made}/${seasonData.xp_att}` : '-'
        return (
          <tr key={seasonData.season} className="hover:bg-gray-700/50 transition-colors">
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{seasonData.season}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{fgMadeAtt}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatPercentage(seasonData.fg_pct)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{xpMadeAtt}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatPercentage(seasonData.xp_pct)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.kicking_pts)}</td>
          </tr>
        )
      case 'P':
        return (
          <tr key={seasonData.season} className="hover:bg-gray-700/50 transition-colors">
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{seasonData.season}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.punt_att)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.punt_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatDecimal(seasonData.punt_avg)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.punts_in20)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.punt_long)}</td>
          </tr>
        )
      default:
        // Defense
        return (
          <tr key={seasonData.season} className="hover:bg-gray-700/50 transition-colors">
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{seasonData.season}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.tackles)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.sacks)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.interceptions)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.int_yds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.def_tds)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.forced_fumbles)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.fumble_recoveries)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.pass_deflections)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.safeties)}</td>
            <td className="px-3 py-2 text-sm text-white border-b border-gray-700">{formatStat(seasonData.def_pts)}</td>
          </tr>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-400">Loading career stats...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchCareerStats}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!careerData || !careerData.career_stats.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No career stats available for this player</p>
      </div>
    )
  }

  const { player, career_stats, total_seasons } = careerData
  const tableHeaders = getTableHeaders(player.position)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Career Statistics</h3>
        <div className="text-sm text-gray-400">
          {total_seasons} season{total_seasons !== 1 ? 's' : ''} • {career_stats.length} entries
        </div>
      </div>

      {/* Career Stats Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                {tableHeaders.map((header, index) => (
                  <th key={index} className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {/* Sort by season descending (most recent first) */}
              {career_stats
                .sort((a, b) => b.season - a.season)
                .map((seasonData) => renderTableRow(seasonData, player.position))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Stats aggregated by season • Most recent season first
      </div>
    </div>
  )
}
