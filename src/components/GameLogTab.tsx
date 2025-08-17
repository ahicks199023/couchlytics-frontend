'use client'

// GameLogTab Component - Fixed TypeScript errors
import React, { useState, useEffect } from 'react'
import { PlayerGameLogRow, fetchFromApi } from '@/lib/api'

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

  // Fetch game log from existing player data (same as standalone page)
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    
    // Use the same API call as the player detail page
    fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
      .then((data) => {
        if (!cancelled) {
          console.log('Game log tab - Full player data:', data)
          
          const responseData = data as Record<string, unknown>
          const playerData = responseData.player as Record<string, unknown>
          const gameLogData = responseData.gameLog as unknown[]
          
          // Extract position and game log from response
          const position = (playerData.position as string) || ''
          const games = Array.isArray(gameLogData) ? gameLogData : []
          
          console.log('Game log tab - GameLog array:', gameLogData)
          if (games.length > 0) {
            console.log('Game log tab - First game structure:', games[0])
            console.log('Game log tab - Available properties:', Object.keys(games[0] as Record<string, unknown>))
            
            // Debug: Check for specific rushing stat properties
            const firstGame = games[0] as Record<string, unknown>
            console.log('Game log tab - Rushing properties check:')
            console.log('  rush_yds:', firstGame['rush_yds'])
            console.log('  rushing_yards:', firstGame['rushing_yards'])
            console.log('  rushYds:', firstGame['rushYds'])
            console.log('  rush_tds:', firstGame['rush_tds'])
            console.log('  rushing_touchdowns:', firstGame['rushing_touchdowns'])
            console.log('  fumbles:', firstGame['fumbles'])
            console.log('  pts:', firstGame['pts'])
            console.log('  points:', firstGame['points'])
          }
          
          setRows(games as PlayerGameLogRow[])
          setPlayerPosition(position)
        }
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [leagueId, playerId])

  const getTableHeaders = () => {
    const position = playerPosition?.toUpperCase() || ''
    
    if (position.includes('QB')) {
      return [
        'Week', 'Team', 'Opp', 'Result', 'CMP/ATT', 'CMP%', 'Pass YDS', 'Pass AVG', 
        'Pass TDS', 'INT', 'LNG', 'SACK', 'QBR', 'Rush YDS', 'Rush TDS', 
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
    
    // Flexible getValue that tries multiple property names (same as standalone page)
    const getValue = (...keys: string[]): string | number => {
      for (const key of keys) {
        const value = (game as Record<string, unknown>)[key]
        if (value !== undefined && value !== null) {
          // Convert to string or number, avoid objects
          if (typeof value === 'string' || typeof value === 'number') {
            return value
          }
        }
      }
      return 0  // Return 0 instead of '-' for missing stats
    }
    
    // Special getValue for non-stat fields that can return '-'
    const getValueOrDash = (...keys: string[]): string | number => {
      for (const key of keys) {
        const value = (game as Record<string, unknown>)[key]
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' || typeof value === 'number') {
            return value
          }
        }
      }
      return '-'
    }
    
    const baseData = [
      getValue('week'),
      getValueOrDash('team', 'teamName'), // Team name from either structure
      getValueOrDash('opponent', 'opp'),
      getValueOrDash('result') || `${getValue('teamScore', 'pts')}-${getValue('oppScore')}`
    ]
    
    if (position.includes('QB')) {
      const compAtt = getValue('cmp_att')
      const completions = getValue('cmp', 'completions', 'pass_comp')
      const attempts = getValue('att', 'attempts', 'pass_att')
      const compPct = getValue('cmp_pct', 'completion_percentage', 'pass_cmp_pct')
      
      return [
        ...baseData,
        compAtt || (completions !== 0 && attempts !== 0 ? `${completions}/${attempts}` : '0/0'),
        compPct ? `${Number(compPct).toFixed(1)}%` : '0.0%',
        getValue('pass_yds', 'passing_yards', 'passYds', 'passYards'),
        getValue('pass_avg', 'passing_average', 'passAvg', 'pass_average'),
        getValue('pass_tds', 'passing_touchdowns', 'passTds', 'passTD', 'pass_td'),
        getValue('pass_ints', 'interceptions', 'passInts', 'passINT', 'pass_int'),
        getValue('pass_long', 'longest_pass', 'passLong', 'pass_lng', 'passLng'),
        getValue('pass_sacks', 'sacks_taken', 'sacksTaken', 'sacks', 'pass_sack'),
        getValue('passer_rating', 'qbr', 'quarterback_rating', 'qb_rating', 'rating'), // QBR
        getValue('rush_yds', 'rushing_yards', 'rushYds', 'rushYards', 'rushingYards'), // Rushing stats
        getValue('rush_tds', 'rushing_touchdowns', 'rushTds', 'rushTD', 'rushingTD', 'rushing_td'),
        getValue('rush_long', 'longest_rush', 'rushLong', 'rush_lng', 'rushLng', 'rushing_long'),
        getValue('broken_tackles', 'broken_tackle', 'brokenTackles', 'btk', 'bt'),
        getValue('fumbles', 'rush_fum', 'fumble', 'fum', 'rushing_fumbles'),
        getValue('pts', 'points', 'fantasyPoints', 'fantasy_points')
      ]
    } else if (position.includes('RB') || position.includes('HB')) {
      return [
        ...baseData,
        getValue('rush_att'),
        getValue('rush_yds'),
        getValue('rush_avg'),
        getValue('rush_tds'),
        getValue('rush_long'),
        getValue('broken_tackles'),
        getValue('fumbles'),
        getValue('rec_catches', 'receptions'),
        getValue('rec_yds'),
        getValue('rec_avg'),
        getValue('rec_tds'),
        getValue('rec_long'),
        getValue('pts', 'points')
      ]
    } else if (position.includes('WR') || position.includes('TE')) {
      return [
        ...baseData,
        getValue('rec_catches', 'receptions'),
        getValue('rec_yds'),
        getValue('rec_avg'),
        getValue('rec_tds'),
        getValue('rec_long'),
        getValue('drops'),
        getValue('rush_att'),
        getValue('rush_yds'),
        getValue('rush_avg'),
        getValue('rush_tds'),
        getValue('rush_long'),
        getValue('fumbles'),
        getValue('pts', 'points')
      ]
    } else if (position.includes('K')) {
      const fgPct = getValue('fg_pct')
      const xpPct = getValue('xp_pct')
      return [
        ...baseData,
        getValue('fg_made'),
        getValue('fg_att'),
        fgPct !== '-' ? `${Number(fgPct).toFixed(1)}%` : '-',
        getValue('fg_long'),
        getValue('xp_made'),
        getValue('xp_att'),
        xpPct !== '-' ? `${Number(xpPct).toFixed(1)}%` : '-',
        getValue('pts', 'points')
      ]
    } else if (position.includes('P')) {
      return [
        ...baseData,
        getValue('punt_att'),
        getValue('punt_yds'),
        getValue('punt_avg'),
        getValue('punt_long'),
        getValue('punts_in20'),
        getValue('punt_tbs'),
        getValue('pts', 'points')
      ]
    } else {
      // Defensive players
      return [
        ...baseData,
        getValue('tackles'),
        getValue('def_sacks'),
        getValue('def_ints'),
        getValue('int_yds'),
        getValue('def_tds'),
        getValue('forced_fum'),
        getValue('fum_rec'),
        getValue('deflections'),
        getValue('safeties'),
        getValue('pts', 'points')
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
                      <td key={cellIndex} className={`px-3 py-2 text-sm ${cellIndex === 3 ? getResultClass(String(value)) : 'text-white'}`}>
                        {String(value)}
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