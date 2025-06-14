'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Player {
  name: string
  position: string
  teamName?: string
  user?: string
  espnId?: string
  gameLogs?: GameLog[]
}

interface GameLog {
  week: number
  category: string
  value: number
}

interface GameStat {
  label: string
  value: number
}

export default function PlayerDetailPage() {
  const { leagueId, playerId } = useParams()
  const [player, setPlayer] = useState<Player | null>(null)
  const [stats, setStats] = useState<GameStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId || !playerId || playerId === 'undefined') return

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${leagueId}/players/${playerId}`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        setPlayer({
          ...data,
          teamName: data.teamName
        })
        const formattedStats = (data.gameLogs || []).map((log: GameLog) => ({
          label: `Week ${log.week} (${log.category})`,
          value: log.value
        }))
        setStats(formattedStats)
      })
      .catch(() => setError('Failed to load player.'))
      .finally(() => setLoading(false))
  }, [leagueId, playerId])

  if (loading) return <p className="text-white p-6">Loading player...</p>
  if (error) return <p className="text-red-500 p-6">{error}</p>
  if (!player) return null

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href={`/leagues/${leagueId}`} className="text-neon-green underline mb-4 inline-block">
          ← Back to League
        </Link>

        <h1 className="text-3xl font-bold mb-2 text-neon-green">{player.name}</h1>

        {player.espnId && (
          <img
            src={`/headshots/${player.espnId}.png`}
            onError={(e) => (e.currentTarget.src = '/headshots/default.png')}
            alt={player.name}
            className="w-24 h-24 rounded-full object-cover mb-4"
          />
        )}

        <p className="text-gray-300 mb-4">Position: {player.position}</p>
        <p className="text-gray-400 mb-6">
          Team: {player.teamName || '—'} | User: {player.user || '—'}
        </p>

        <h2 className="text-2xl font-semibold mb-4">Weekly Stats</h2>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No stats available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={stats}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" stroke="#ccc" />
              <YAxis type="category" dataKey="label" stroke="#ccc" width={100} />
              <Tooltip
                cursor={{ fill: '#222' }}
                contentStyle={{
                  backgroundColor: '#333',
                  borderColor: '#555',
                  color: '#fff'
                }}
              />
              <Bar dataKey="value" fill="#39FF14">
                {stats.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#facc15' : '#39FF14'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </main>
  )
}


