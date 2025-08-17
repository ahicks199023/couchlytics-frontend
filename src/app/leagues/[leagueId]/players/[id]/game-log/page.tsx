'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PlayerGameLogRow } from '@/lib/api'
import { Player } from '@/types/player'
import { fetchFromApi } from '@/lib/api'
import TeamLogo from '@/components/TeamLogo'

export default function PlayerGameLogPage() {
  const { leagueId, id: playerId } = useParams()
  const [player, setPlayer] = useState<Player | null>(null)
  const [rows, setRows] = useState<PlayerGameLogRow[]>([])
  const [playerPosition, setPlayerPosition] = useState<string>('')
  // Remove season filtering since API returns all games
  // const [season, setSeason] = useState<number>(4) // Default to current season
  // const [seasons] = useState<number[]>([1, 2, 3, 4])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch player details and game log
  useEffect(() => {
    if (!leagueId || !playerId) {
      setError('Invalid league ID or player ID')
      setLoading(false)
      return
    }

    // Fetch player details first
    fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
      .then((data) => {
        const responseData = data as Record<string, unknown>
        const playerData = responseData.player as Record<string, unknown>
        
        const mappedPlayer = {
          id: playerData.id,
          name: playerData.name,
          team: playerData.teamName,
          position: playerData.position,
          teamName: playerData.teamName,
          ovr: playerData.overall,
          jerseyNumber: playerData.jersey_number || playerData.jerseyNumber || playerData.jersey || playerData.number,
        } as Player
        
        setPlayer(mappedPlayer)
      })
      .catch((err) => {
        console.error('Failed to load player:', err)
        setError('Failed to load player details')
      })
  }, [leagueId, playerId])

  // Fetch game log when season changes
  useEffect(() => {
    if (!leagueId || !playerId) return

    setLoading(true)
    // Use the same API call as the player detail page
    fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
      .then((data) => {
        console.log('Game log page - Full player data:', data)
        
        const responseData = data as Record<string, unknown>
        const playerData = responseData.player as Record<string, unknown>
        const gameLogData = responseData.gameLog as unknown[]
        
        console.log('Game log page - GameLog array:', gameLogData)
        
        // Extract position and game log from response
        const position = (playerData.position as string) || ''
        const games = Array.isArray(gameLogData) ? gameLogData : []
        
        // Debug: log first game to see actual structure
        if (games.length > 0) {
          console.log('Game log page - First game structure:', games[0])
          console.log('Game log page - Available properties:', Object.keys(games[0] as Record<string, unknown>))
          
          console.log('Game log page - Week numbering and game ID debug:')
          games.forEach((game, index) => {
            const gameObj = game as Record<string, unknown>
            console.log(`  Game ${index + 1}: week=${gameObj.week}, opponent=${gameObj.opponent}, game_id=${gameObj.game_id}, date=${gameObj.date}`)
          })
        }
        
        // Process games to fix week numbering and remove duplicates
        const processedGames = games.map((game, index) => {
          const gameObj = game as Record<string, unknown>
          
          // If week is 0 or duplicate, assign proper week number
          let correctedWeek = gameObj.week as number
          
          // For games with week 0 or undefined, assign week based on index + 1
          if (!correctedWeek || correctedWeek === 0) {
            correctedWeek = index + 1
          }
          
          return {
            ...game,
            week: correctedWeek
          }
        })
        
        // Remove duplicate weeks - keep only the first occurrence of each week
        const uniqueWeeks = new Set<number>()
        const uniqueGames = processedGames.filter(game => {
          const gameObj = game as Record<string, unknown>
          const week = gameObj.week as number
          
          if (uniqueWeeks.has(week)) {
            console.log(`Game log page - Removing duplicate week ${week} game`)
            return false
          }
          
          uniqueWeeks.add(week)
          return true
        })
        
        console.log('Game log page - Processed games:', uniqueGames.length)
        console.log('Game log page - Week numbers:', uniqueGames.map(g => (g as Record<string, unknown>).week))
        
        setRows(uniqueGames as PlayerGameLogRow[])
        setPlayerPosition(position)
      })
      .catch((err) => {
        console.error('Game log page - Failed to load game log:', err)
        setError('Failed to load game log data')
      })
      .finally(() => setLoading(false))
  }, [leagueId, playerId])

  const getTableHeaders = (position: string) => {
    const pos = position?.toUpperCase() || ''
    
    const baseHeaders = ['Week', 'Opponent', 'Result']
    
    if (pos === 'QB') {
      return [...baseHeaders, 'QBR', 'Comp', 'Att', 'Comp%', 'Pass Yds', 'Pass TD', 'INT', 'Sacks', 'Rush Yds', 'Rush TD']
    } else if (['RB', 'HB'].includes(pos)) {
      return [...baseHeaders, 'Rush Att', 'Rush Yds', 'Rush TD', 'Rec', 'Rec Yds', 'Rec TD', 'Fumbles']
    } else if (['WR', 'TE'].includes(pos)) {
      return [...baseHeaders, 'Rec', 'Rec Yds', 'Rec TD', 'Rush Att', 'Rush Yds', 'Rush TD']
    } else if (['CB', 'S', 'FS', 'SS'].includes(pos)) {
      return [...baseHeaders, 'Tackles', 'Assists', 'Sacks', 'INT', 'PD', 'FF', 'FR']
    } else if (['LB', 'MLB', 'OLB', 'LOLB', 'ROLB'].includes(pos)) {
      return [...baseHeaders, 'Tackles', 'Assists', 'Sacks', 'INT', 'PD', 'FF', 'FR']
    } else if (['DE', 'DT', 'NT'].includes(pos)) {
      return [...baseHeaders, 'Tackles', 'Assists', 'Sacks', 'FF', 'FR', 'PD']
    } else if (['K', 'P'].includes(pos)) {
      return [...baseHeaders, 'FG Made', 'FG Att', 'FG%', 'Long', 'XP Made', 'XP Att']
    } else {
      // Generic/unknown position
      return [...baseHeaders, 'Stats']
    }
  }

  const getTableRow = (game: PlayerGameLogRow, position: string) => {
    const pos = position?.toUpperCase() || ''
    // Flexible getValue that tries multiple property names
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
      return '-'
    }
    
    const baseData = [
      getValue('week'),
      getValue('opponent', 'opp'),
      getValue('result') || `${getValue('teamScore', 'pts')}-${getValue('oppScore')}`
    ]
    
    if (pos === 'QB') {
      const compAtt = getValue('cmp_att')
      const completions = getValue('cmp', 'completions')
      const attempts = getValue('att', 'attempts')
      const compPct = getValue('cmp_pct', 'completion_percentage')
      
      return [
        ...baseData,
        getValue('passer_rating', 'qbr', 'quarterback_rating'), // QBR moved after Result
        compAtt || (completions !== '-' && attempts !== '-' ? `${completions}/${attempts}` : '-'),
        attempts,
        compPct ? `${Number(compPct).toFixed(1)}%` : '-',
        getValue('pass_yds', 'passing_yards'),
        getValue('pass_tds', 'passing_touchdowns'),
        getValue('pass_ints', 'interceptions'),
        getValue('pass_sacks', 'sacks_taken'),
        getValue('rush_yds', 'rushing_yards'),
        getValue('rush_tds', 'rushing_touchdowns')
      ]
    } else if (['RB', 'HB'].includes(pos)) {
      return [
        ...baseData,
        getValue('rush_att'),
        getValue('rush_yds'),
        getValue('rush_tds'),
        getValue('rec_catches', 'receptions'),
        getValue('rec_yds'),
        getValue('rec_tds'),
        getValue('fumbles')
      ]
    } else if (['WR', 'TE'].includes(pos)) {
      return [
        ...baseData,
        getValue('rec_catches', 'receptions'),
        getValue('rec_yds'),
        getValue('rec_tds'),
        getValue('rush_att'),
        getValue('rush_yds'),
        getValue('rush_tds')
      ]
    } else if (['CB', 'S', 'FS', 'SS', 'LB', 'MLB', 'OLB', 'LOLB', 'ROLB', 'DE', 'DT', 'NT'].includes(pos)) {
      return [
        ...baseData,
        getValue('tackles'),
        '-', // assists not available
        getValue('def_sacks'),
        getValue('def_ints'),
        getValue('deflections'),
        getValue('forced_fum'),
        getValue('fum_rec')
      ]
    } else if (['K', 'P'].includes(pos)) {
      const fgPct = getValue('fg_pct')
      return [
        ...baseData,
        getValue('fg_made'),
        getValue('fg_att'),
        fgPct ? `${Number(fgPct).toFixed(1)}%` : '-',
        getValue('fg_long'),
        getValue('xp_made'),
        getValue('xp_att')
      ]
    } else {
      return [...baseData, 'No stats available']
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="mb-6">
          <Link href={`/leagues/${leagueId}/players`} className="text-blue-400 hover:underline">
            ← Back to Players
          </Link>
        </div>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <h2 className="text-red-400 font-semibold mb-2">Error</h2>
          <p className="text-red-300">{error}</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading game log...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      {/* Navigation */}
      <div className="mb-6">
        <Link href={`/leagues/${leagueId}/players`} className="text-blue-400 hover:underline">
          ← Back to Players
        </Link>
        {player && (
          <>
            <span className="text-gray-400 mx-2">/</span>
            <Link href={`/leagues/${leagueId}/players/${playerId}`} className="text-blue-400 hover:underline">
              {player.name}
            </Link>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-white">Game Log</span>
          </>
        )}
      </div>

      {/* Player Header */}
      {player && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="flex items-center space-x-4">
            <TeamLogo teamName={player.teamName} size="md" />
            <div>
              <h1 className="text-2xl font-bold">{player.name}</h1>
              <div className="text-gray-400">
                {player.position} #{player.jerseyNumber || '--'} | {player.teamName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed season selector - showing all games */}

      {/* Game Log Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Game Log - All Games</h2>
          
          {rows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No game log data available</p>
              <button
                onClick={() => window.location.reload()} // Trigger re-fetch
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    {getTableHeaders(playerPosition).map((header, index) => (
                      <th key={index} className="text-left py-3 px-4 font-medium text-gray-300">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((game, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                      {getTableRow(game, playerPosition).map((cell, cellIndex) => {
                        // Make Result column (cellIndex === 2) clickable and link to box score
                        if (cellIndex === 2) {
                          const gameObj = game as Record<string, unknown>
                          const gameId = gameObj.game_id || gameObj.gameId
                          const result = String(cell)
                          
                          // Color code the result
                          const resultClass = result.includes('W') ? 'text-green-400' : 
                                            result.includes('L') ? 'text-red-400' : 'text-gray-400'
                          
                          if (gameId) {
                            return (
                              <td key={cellIndex} className={`py-3 px-4 ${resultClass}`}>
                                <Link 
                                  href={`/leagues/${leagueId}/schedule/box-score/${gameId}`}
                                  className="hover:underline cursor-pointer"
                                >
                                  {result}
                                </Link>
                              </td>
                            )
                          }
                          
                          return (
                            <td key={cellIndex} className={`py-3 px-4 ${resultClass}`}>
                              {result}
                            </td>
                          )
                        }
                        
                        return (
                          <td key={cellIndex} className="py-3 px-4 text-white">
                            {String(cell)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
