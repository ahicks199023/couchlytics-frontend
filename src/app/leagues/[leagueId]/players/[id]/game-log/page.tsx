'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getPlayerGameLog, PlayerGameLogRow } from '@/lib/api'
import { Player } from '@/types/player'
import { fetchFromApi } from '@/lib/api'
import TeamLogo from '@/components/TeamLogo'

export default function PlayerGameLogPage() {
  const { leagueId, id: playerId } = useParams()
  const [player, setPlayer] = useState<Player | null>(null)
  const [rows, setRows] = useState<PlayerGameLogRow[]>([])
  const [playerPosition, setPlayerPosition] = useState<string>('')
  const [season, setSeason] = useState<number>(4) // Default to current season
  const [seasons] = useState<number[]>([1, 2, 3, 4])
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
          jerseyNumber: playerData.jerseyNumber,
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
    if (!leagueId || !playerId || !season) return

    setLoading(true)
    getPlayerGameLog(leagueId as string, playerId as string, season)
      .then((data) => {
        console.log('Game log data:', data)
        
        // Extract games and position from response
        const games = Array.isArray(data.games) ? data.games : []
        const position = data.position || ''
        
        setRows(games)
        setPlayerPosition(position)
      })
      .catch((err) => {
        console.error('Failed to load game log:', err)
        setError('Failed to load game log data')
      })
      .finally(() => setLoading(false))
  }, [leagueId, playerId, season])

  const getTableHeaders = (position: string) => {
    const pos = position?.toUpperCase() || ''
    
    const baseHeaders = ['Week', 'Opponent', 'Result']
    
    if (pos === 'QB') {
      return [...baseHeaders, 'Comp', 'Att', 'Comp%', 'Pass Yds', 'Pass TD', 'INT', 'Sacks', 'Rush Yds', 'Rush TD']
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
    const getValue = (key: keyof PlayerGameLogRow) => game[key] ?? '-'
    
    const baseData = [
      getValue('week'),
      getValue('opponent'),
      getValue('result') || `${getValue('teamScore')}-${getValue('oppScore')}`
    ]
    
    if (pos === 'QB') {
      return [
        ...baseData,
        getValue('pass_comp'),
        getValue('pass_att'),
        getValue('pass_cmp_pct') ? `${Number(getValue('pass_cmp_pct')).toFixed(1)}%` : '-',
        getValue('pass_yds'),
        getValue('pass_tds'),
        getValue('pass_ints'),
        getValue('pass_sacks'),
        getValue('rush_yds'),
        getValue('rush_tds')
      ]
    } else if (['RB', 'HB'].includes(pos)) {
      return [
        ...baseData,
        getValue('rush_att'),
        getValue('rush_yds'),
        getValue('rush_tds'),
        getValue('rec_rec'),
        getValue('rec_yds'),
        getValue('rec_tds'),
        getValue('rush_fum')
      ]
    } else if (['WR', 'TE'].includes(pos)) {
      return [
        ...baseData,
        getValue('rec_rec'),
        getValue('rec_yds'),
        getValue('rec_tds'),
        getValue('rush_att'),
        getValue('rush_yds'),
        getValue('rush_tds')
      ]
    } else if (['CB', 'S', 'FS', 'SS', 'LB', 'MLB', 'OLB', 'LOLB', 'ROLB', 'DE', 'DT', 'NT'].includes(pos)) {
      return [
        ...baseData,
        getValue('def_tackles'),
        '-', // assists not in type
        getValue('def_sacks'),
        getValue('def_ints'),
        '-', // pass_deflections not in type
        getValue('def_forced_fum'),
        getValue('def_fum_rec')
      ]
    } else if (['K', 'P'].includes(pos)) {
      return [
        ...baseData,
        getValue('fg_made'),
        getValue('fg_att'),
        getValue('fg_pct') ? `${Number(getValue('fg_pct')).toFixed(1)}%` : '-',
        getValue('punt_long'), // using punt_long as longest kick
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

      {/* Season Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Season:
        </label>
        <select
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              Season {s}
            </option>
          ))}
        </select>
      </div>

      {/* Game Log Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Game Log - Season {season}</h2>
          
          {rows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No game log data available for this season</p>
              <button
                onClick={() => setSeason(season)} // Trigger re-fetch
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
                      {getTableRow(game, playerPosition).map((cell, cellIndex) => (
                        <td key={cellIndex} className="py-3 px-4 text-white">
                          {cell}
                        </td>
                      ))}
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
