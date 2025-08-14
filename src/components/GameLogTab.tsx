'use client'

// GameLogTab Component - Fixed TypeScript errors
import React, { useState, useEffect } from 'react'
import { getPlayerGameLog, PlayerGameLogRow } from '@/lib/api'

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

// Remove unused Player interface - position now comes from API response
// interface Player {
//   id: number
//   playerId: string
//   name: string
//   position: string
//   team: string
//   teamAbbr: string
// }

// Remove unused interface - keeping for reference if needed later
// interface GameLogResponse {
//   player: Player
//   gameLogs: GameLog[]
//   totalGames: number
// }

interface GameLogTabProps {
  playerId: string
  leagueId: string
}

export default function GameLogTab({ playerId, leagueId }: GameLogTabProps) {
  // Remove unused old state variables
  // const [gameLogs, setGameLogs] = useState<GameLog[]>([])
  // const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Remove unused old filters
  // const [seasonOnly, setSeasonOnly] = useState(false)
  // const [limit, setLimit] = useState(20)
  const [season, setSeason] = useState<number>(new Date().getFullYear())
  const [seasons, setSeasons] = useState<number[]>([])
  const [rows, setRows] = useState<PlayerGameLogRow[] | null>(null)
  const [playerPosition, setPlayerPosition] = useState<string>('')

  // New: season list bootstrap (static for now; backend may return available_seasons)
  useEffect(() => {
    setSeasons([new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1])
  }, [])

  // Season-based game log fetch
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    getPlayerGameLog(leagueId, playerId, season)
      .then(d => { 
        if (!cancelled) { 
          setRows(d.games || [])
          setPlayerPosition(d.position || '')
          // Update seasons list if backend provides it
          if (d.available_seasons && d.available_seasons.length > 0) {
            setSeasons(d.available_seasons)
          }
        }
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [leagueId, playerId, season])

  const getTableHeaders = () => {
    const position = playerPosition?.toUpperCase() || ''
    
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

  const getTableRow = (game: GameLog | PlayerGameLogRow) => {
    const position = playerPosition?.toUpperCase() || ''
    
    // Helper to get value from either old or new structure
    const getValue = (oldKey: keyof GameLog, newKey: keyof PlayerGameLogRow) => {
      const gameOld = game as GameLog
      const gameNew = game as PlayerGameLogRow
      return gameNew[newKey] ?? gameOld[oldKey] ?? '-'
    }
    
    // Format completion percentage
    const getCompPct = () => {
      const gameNew = game as PlayerGameLogRow
      const gameOld = game as GameLog
      if (gameNew.pass_cmp_pct !== undefined) return `${gameNew.pass_cmp_pct.toFixed(1)}%`
      if (gameOld.cmp_pct !== undefined) return `${gameOld.cmp_pct}%`
      return '-'
    }
    
    // Format comp/att
    const getCompAtt = () => {
      const gameNew = game as PlayerGameLogRow
      const gameOld = game as GameLog
      if (gameNew.pass_comp !== undefined && gameNew.pass_att !== undefined) {
        return `${gameNew.pass_comp}/${gameNew.pass_att}`
      }
      if (gameOld.cmp_att) return gameOld.cmp_att
      return '-'
    }
    
    if (position.includes('QB')) {
      return [
        getValue('week' as keyof GameLog, 'week'),
        (game as GameLog).team || (game as PlayerGameLogRow).opponent || '-', // Team not in new structure
        getValue('opponent', 'opponent'),
        getValue('result', 'result'),
        getCompAtt(),
        getCompPct(),
        getValue('pass_yds', 'pass_yds'),
        getValue('pass_avg', 'pass_avg'),
        getValue('pass_tds', 'pass_tds'),
        getValue('pass_ints', 'pass_ints'),
        getValue('pass_long', 'pass_long'),
        getValue('pass_sacks', 'pass_sacks'),
        getValue('passer_rating', 'passer_rating'),
        getValue('rush_att', 'rush_att'),
        getValue('rush_yds', 'rush_yds'),
        getValue('rush_avg', 'rush_avg'),
        getValue('rush_tds', 'rush_tds'),
        getValue('rush_long', 'rush_long'),
        (game as GameLog).broken_tackles || '-', // Not in new structure
        getValue('fumbles' as keyof GameLog, 'rush_fum'),
        (game as GameLog).pts || '-' // Not in new structure yet
      ]
    } else if (position.includes('RB') || position.includes('HB')) {
      return [
        getValue('week' as keyof GameLog, 'week'),
        (game as GameLog).team || '-',
        getValue('opponent', 'opponent'),
        getValue('result', 'result'),
        getValue('rush_att', 'rush_att'),
        getValue('rush_yds', 'rush_yds'),
        getValue('rush_avg', 'rush_avg'),
        getValue('rush_tds', 'rush_tds'),
        getValue('rush_long', 'rush_long'),
        (game as GameLog).broken_tackles || '-',
        getValue('fumbles' as keyof GameLog, 'rush_fum'),
        getValue('rec_catches' as keyof GameLog, 'rec_rec'),
        getValue('rec_yds', 'rec_yds'),
        getValue('rec_avg', 'rec_avg'),
        getValue('rec_tds', 'rec_tds'),
        getValue('rec_long', 'rec_long'),
        (game as GameLog).pts || '-'
      ]
    } else if (position.includes('WR') || position.includes('TE')) {
      return [
        getValue('week' as keyof GameLog, 'week'),
        (game as GameLog).team || '-',
        getValue('opponent', 'opponent'),
        getValue('result', 'result'),
        getValue('rec_catches' as keyof GameLog, 'rec_rec'),
        getValue('rec_yds', 'rec_yds'),
        getValue('rec_avg', 'rec_avg'),
        getValue('rec_tds', 'rec_tds'),
        getValue('rec_long', 'rec_long'),
        getValue('drops' as keyof GameLog, 'rec_drops'),
        getValue('rush_att', 'rush_att'),
        getValue('rush_yds', 'rush_yds'),
        getValue('rush_avg', 'rush_avg'),
        getValue('rush_tds', 'rush_tds'),
        getValue('rush_long', 'rush_long'),
        getValue('fumbles' as keyof GameLog, 'rush_fum'),
        (game as GameLog).pts || '-'
      ]
    } else if (position.includes('K')) {
      return [
        getValue('week' as keyof GameLog, 'week'),
        (game as GameLog).team || '-',
        getValue('opponent', 'opponent'),
        getValue('result', 'result'),
        getValue('fg_made', 'fg_made'),
        getValue('fg_att', 'fg_att'),
        getValue('fg_pct', 'fg_pct') !== '-' ? `${getValue('fg_pct', 'fg_pct')}%` : '-',
        getValue('fg_long' as keyof GameLog, 'punt_long'), // Map to available field temporarily
        getValue('xp_made', 'xp_made'),
        getValue('xp_att', 'xp_att'),
        (game as GameLog).xp_pct ? `${(game as GameLog).xp_pct}%` : '-',
        getValue('pts' as keyof GameLog, 'kick_pts')
      ]
    } else if (position.includes('P')) {
      return [
        getValue('week' as keyof GameLog, 'week'),
        (game as GameLog).team || '-',
        getValue('opponent', 'opponent'),
        getValue('result', 'result'),
        getValue('punt_att', 'punt_att'),
        getValue('punt_yds', 'punt_yds'),
        getValue('punt_avg', 'punt_avg'),
        getValue('punt_long', 'punt_long'),
        getValue('punts_in20', 'punts_in20'),
        (game as GameLog).punt_tbs || '-', // Not in new structure
        (game as GameLog).pts || '-'
      ]
    } else {
      // Defensive players
      return [
        getValue('week' as keyof GameLog, 'week'),
        (game as GameLog).team || '-',
        getValue('opponent', 'opponent'),
        getValue('result', 'result'),
        getValue('tackles' as keyof GameLog, 'def_tackles'),
        getValue('def_sacks', 'def_sacks'),
        getValue('def_ints', 'def_ints'),
        (game as GameLog).int_yds || '-', // Not in new structure
        getValue('def_tds', 'def_tds'),
        getValue('forced_fum' as keyof GameLog, 'def_forced_fum'),
        getValue('fum_rec' as keyof GameLog, 'def_fum_rec'),
        (game as GameLog).deflections || '-', // Not in new structure
        (game as GameLog).safeties || '-', // Not in new structure
        (game as GameLog).pts || '-'
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
            onClick={() => setSeason(s => s)} // Trigger re-fetch by updating season state
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Check if we have any game data
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No games found for this player</p>
      </div>
    )
  }

  // Defensive check: Ensure getTableHeaders returns an array
  const tableHeaders = getTableHeaders()
  if (!Array.isArray(tableHeaders)) {
    console.error('getTableHeaders did not return an array:', tableHeaders)
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Error: Invalid table headers</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-300">Season:</label>
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
          >
            {seasons.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-400">
          Showing {rows.length} of {rows.length} games
        </div>
      </div>

      {/* Game Log Table */}
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
              {rows.map((game, index) => {
                // Defensive check: Ensure getTableRow returns an array
                const tableRow = getTableRow(game)
                if (!Array.isArray(tableRow)) {
                  console.error('getTableRow did not return an array for game:', game, 'row:', tableRow)
                  return null
                }
                
                return (
                  <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                    {tableRow.map((value, cellIndex) => (
                      <td key={cellIndex} className={`px-3 py-2 text-sm ${cellIndex === 3 ? getResultClass(value as string) : 'text-white'}`}>
                        {value}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 