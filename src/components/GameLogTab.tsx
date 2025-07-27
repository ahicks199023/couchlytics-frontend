'use client'

// GameLogTab Component - Fixed TypeScript errors
import React, { useState, useEffect, useCallback } from 'react'
import { fetchFromApi } from '@/lib/api'

interface GameLog {
  week: string
  season: number
  team: string
  opponent: string
  result: string
  pts: number
  
  // QB Stats
  cmp_att?: string
  cmp_pct?: number
  pass_yds?: number
  pass_avg?: number
  pass_tds?: number
  pass_ints?: number
  pass_long?: number
  pass_sacks?: number
  passer_rating?: number
  rush_att?: number
  rush_yds?: number
  rush_avg?: number
  rush_tds?: number
  rush_long?: number
  broken_tackles?: number
  fumbles?: number
  
  // RB/WR/TE Stats
  rec_catches?: number
  rec_yds?: number
  rec_avg?: number
  rec_tds?: number
  rec_long?: number
  drops?: number
  
  // Kicker Stats
  fg_made?: number
  fg_att?: number
  fg_pct?: number
  fg_long?: number
  xp_made?: number
  xp_att?: number
  xp_pct?: number
  
  // Punter Stats
  punt_att?: number
  punt_yds?: number
  punt_avg?: number
  punt_long?: number
  punts_in20?: number
  punt_tbs?: number
  
  // Defense Stats
  tackles?: number
  def_sacks?: number
  def_ints?: number
  int_yds?: number
  def_tds?: number
  forced_fum?: number
  fum_rec?: number
  deflections?: number
  safeties?: number
}

interface Player {
  id: number
  playerId: string
  name: string
  position: string
  team: string
  teamAbbr: string
}

interface GameLogResponse {
  player: Player
  gameLogs: GameLog[]
  totalGames: number
}

interface GameLogTabProps {
  playerId: string
  leagueId: string
}

export default function GameLogTab({ playerId, leagueId }: GameLogTabProps) {
  const [gameLogs, setGameLogs] = useState<GameLog[]>([])
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasonOnly, setSeasonOnly] = useState(false)
  const [limit, setLimit] = useState(20)

  const fetchGameLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        seasonOnly: seasonOnly.toString(),
        limit: limit.toString()
      })
      
      const data = await fetchFromApi(`/leagues/${leagueId}/players/${playerId}/game-log?${params}`) as GameLogResponse
      
      setGameLogs(data.gameLogs)
      setPlayer(data.player)
    } catch (err) {
      console.error('Failed to fetch game logs:', err)
      setError('Failed to load game logs. Please try again.')
         } finally {
       setLoading(false)
     }
   }, [playerId, leagueId, seasonOnly, limit])

   useEffect(() => {
     fetchGameLogs()
   }, [fetchGameLogs])

  const getTableHeaders = () => {
    const position = player?.position?.toUpperCase() || ''
    
    if (position.includes('QB')) {
      return [
        'Week', 'Team', 'Opp', 'Result', 'CMP/ATT', 'CMP%', 'YDS', 'AVG', 
        'TDS', 'INT', 'LNG', 'SACK', 'RTG', 'ATT', 'YDS', 'AVG', 'TDS', 
        'LNG', 'BTK', 'FUM', 'PTS'
      ]
    } else if (position.includes('RB') || position.includes('HB')) {
      return [
        'Week', 'Team', 'Opp', 'Result', 'ATT', 'YDS', 'AVG', 'TDS', 
        'LNG', 'BTK', 'FUM', 'REC', 'YDS', 'AVG', 'TDS', 'LNG', 'PTS'
      ]
    } else if (position.includes('WR') || position.includes('TE')) {
      return [
        'Week', 'Team', 'Opp', 'Result', 'REC', 'YDS', 'AVG', 'TDS', 
        'LNG', 'DROPS', 'ATT', 'YDS', 'AVG', 'TDS', 'LNG', 'FUM', 'PTS'
      ]
    } else if (position.includes('K')) {
      return [
        'Week', 'Team', 'Opp', 'Result', 'FG', 'FGA', 'FG%', 'LNG', 
        'XP', 'XPA', 'XP%', 'PTS'
      ]
    } else if (position.includes('P')) {
      return [
        'Week', 'Team', 'Opp', 'Result', 'PUNTS', 'YDS', 'AVG', 'LNG', 
        'IN20', 'TB', 'PTS'
      ]
    } else {
      // Defensive players
      return [
        'Week', 'Team', 'Opp', 'Result', 'TKL', 'SACK', 'INT', 'INT YDS', 
        'TD', 'FF', 'FR', 'PD', 'SAF', 'PTS'
      ]
    }
  }

  const getTableRow = (game: GameLog) => {
    const position = player?.position?.toUpperCase() || ''
    
    if (position.includes('QB')) {
      return [
        game.week,
        game.team,
        game.opponent,
        game.result,
        game.cmp_att || '-',
        game.cmp_pct ? `${game.cmp_pct}%` : '-',
        game.pass_yds || '-',
        game.pass_avg || '-',
                 game.pass_tds || '-',
         game.pass_ints || '-',
         game.pass_long || '-',
         game.pass_sacks || '-',
        game.passer_rating || '-',
        game.rush_att || '-',
        game.rush_yds || '-',
        game.rush_avg || '-',
        game.rush_tds || '-',
        game.rush_long || '-',
        game.broken_tackles || '-',
        game.fumbles || '-',
        game.pts || '-'
      ]
    } else if (position.includes('RB') || position.includes('HB')) {
      return [
        game.week,
        game.team,
        game.opponent,
        game.result,
        game.rush_att || '-',
        game.rush_yds || '-',
        game.rush_avg || '-',
        game.rush_tds || '-',
        game.rush_long || '-',
        game.broken_tackles || '-',
        game.fumbles || '-',
        game.rec_catches || '-',
        game.rec_yds || '-',
        game.rec_avg || '-',
        game.rec_tds || '-',
        game.rec_long || '-',
        game.pts || '-'
      ]
    } else if (position.includes('WR') || position.includes('TE')) {
      return [
        game.week,
        game.team,
        game.opponent,
        game.result,
        game.rec_catches || '-',
        game.rec_yds || '-',
        game.rec_avg || '-',
        game.rec_tds || '-',
        game.rec_long || '-',
        game.drops || '-',
        game.rush_att || '-',
        game.rush_yds || '-',
        game.rush_avg || '-',
        game.rush_tds || '-',
        game.rush_long || '-',
        game.fumbles || '-',
        game.pts || '-'
      ]
    } else if (position.includes('K')) {
      return [
        game.week,
        game.team,
        game.opponent,
        game.result,
        game.fg_made || '-',
        game.fg_att || '-',
        game.fg_pct ? `${game.fg_pct}%` : '-',
        game.fg_long || '-',
        game.xp_made || '-',
        game.xp_att || '-',
        game.xp_pct ? `${game.xp_pct}%` : '-',
        game.pts || '-'
      ]
    } else if (position.includes('P')) {
      return [
        game.week,
        game.team,
        game.opponent,
        game.result,
        game.punt_att || '-',
        game.punt_yds || '-',
        game.punt_avg || '-',
        game.punt_long || '-',
        game.punts_in20 || '-',
        game.punt_tbs || '-',
        game.pts || '-'
      ]
    } else {
      // Defensive players
      return [
        game.week,
        game.team,
        game.opponent,
        game.result,
                 game.tackles || '-',
         game.def_sacks || '-',
         game.def_ints || '-',
        game.int_yds || '-',
        game.def_tds || '-',
        game.forced_fum || '-',
        game.fum_rec || '-',
        game.deflections || '-',
        game.safeties || '-',
        game.pts || '-'
      ]
    }
  }

  const getResultClass = (result: string) => {
    if (result.includes('W')) return 'text-green-400'
    if (result.includes('L')) return 'text-red-400'
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-400">Loading game logs...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchGameLogs}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!gameLogs.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No games found for this player</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={seasonOnly}
              onChange={(e) => setSeasonOnly(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700"
            />
            <span className="text-sm text-gray-300">Current Season Only</span>
          </label>
          
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
          >
            <option value={10}>10 Games</option>
            <option value={20}>20 Games</option>
            <option value={50}>50 Games</option>
            <option value={100}>100 Games</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-400">
          Showing {gameLogs.length} of {gameLogs.length} games
        </div>
      </div>

      {/* Game Log Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                {getTableHeaders().map((header, index) => (
                  <th key={index} className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {gameLogs.map((game, index) => (
                <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                  {getTableRow(game).map((value, cellIndex) => (
                    <td key={cellIndex} className={`px-3 py-2 text-sm ${cellIndex === 3 ? getResultClass(value as string) : 'text-white'}`}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 