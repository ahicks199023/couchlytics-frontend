'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { API_BASE } from '@/lib/config'

type Player = {
  id: number
  name: string
  position: string
  user: string
  teamId?: number
  teamName?: string
  [key: string]: string | number | undefined
}

const CATEGORY_OPTIONS = [
  { label: 'Passing Yards', key: 'passingYards' },
  { label: 'Rushing Yards', key: 'rushingYards' },
  { label: 'Receiving TDs', key: 'receivingTDs' },
  { label: 'Team Wins', key: 'teamWins' }
]

export default function LeagueStatsPage() {
  const { leagueId } = useParams()
  const [stats, setStats] = useState<Record<string, Player[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('passingYards')
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')

  useEffect(() => {
    if (!leagueId) return

    const url =
      selectedWeek === 'all'
        ? `${API_BASE}/leagues/${leagueId}/stats`
        : `${API_BASE}/leagues/${leagueId}/stats?week=${selectedWeek}`

    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const mapped = Object.fromEntries(
          Object.entries(data).map(([key, value]) => {
            switch (key) {
              case 'passing_yards': return ['passingYards', value as Player[]]
              case 'rushing_yards': return ['rushingYards', value as Player[]]
              case 'receiving_tds': return ['receivingTDs', value as Player[]]
              case 'team_wins': return ['teamWins', value as Player[]]
              default: return [key, value as Player[]]
            }
          })
        ) as Record<string, Player[]>
        setStats(mapped)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load stats')
      })
      .finally(() => setLoading(false))
  }, [leagueId, selectedWeek])

  if (loading) return <p className="text-gray-400">Loading stats...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!stats) return null

  const isPlayerStat = selectedCategory !== 'teamWins'
  const allData: Player[] = stats[selectedCategory] || []
  const statKey = selectedCategory === 'teamWins' ? 'wins' : 'value'
  const categoryLabel = CATEGORY_OPTIONS.find(opt => opt.key === selectedCategory)?.label || 'Stats'

  const positions = Array.from(new Set(allData.map(d => d.position).filter(Boolean))).sort()
  const users = Array.from(new Set(allData.map(d => d.user).filter(Boolean))).sort()

  let filteredData = allData
  if (isPlayerStat && selectedPosition !== 'all') {
    filteredData = filteredData.filter(d => d.position === selectedPosition)
  }
  if (selectedUser !== 'all') {
    filteredData = filteredData.filter(d => d.user === selectedUser)
  }

  return (
    <div className="mt-8 bg-gray-800 p-4 rounded">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-white">Stat Leaders</h2>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-gray-900 border border-gray-600 text-white text-sm rounded px-2 py-1"
          >
            <option value="all">All Weeks</option>
            {[...Array(18)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Week {i + 1}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setSelectedPosition('all')
              setSelectedUser('all')
            }}
            className="bg-gray-900 border border-gray-600 text-white text-sm rounded px-2 py-1"
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>

          {isPlayerStat && positions.length > 0 && (
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="bg-gray-900 border border-gray-600 text-white text-sm rounded px-2 py-1"
            >
              <option value="all">All Positions</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          )}

          {users.length > 0 && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-gray-900 border border-gray-600 text-white text-sm rounded px-2 py-1"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <StatBlock title={categoryLabel} data={filteredData} statKey={statKey} leagueId={leagueId as string} />
      <StatBarChart data={filteredData} statKey={statKey} />
    </div>
  )
}

function StatBlock({ title, data, statKey, leagueId }: { title: string, data: Player[], statKey: string, leagueId: string }) {
  return (
    <div className="bg-gray-900 p-4 rounded mb-6">
      <h3 className="text-lg font-bold mb-2 text-neon-green">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No data available</p>
      ) : (
        <ul className="text-sm space-y-1">
          {data.map((entry, i) => (
            <li key={i}>
              <Link href={`/leagues/${leagueId}/players/${entry.id}`} className="hover:underline">
                <span className={`mr-2 font-bold ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>#{i + 1}</span>
                {entry.name}
              </Link>
              {' '}— {entry[statKey]}
              {entry.teamId && (
                <Link href={`/leagues/${leagueId}/teams/${entry.teamId}`} className="text-blue-400 hover:underline ml-2">
                  ({entry.teamName})
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatBarChart({ data, statKey }: { data: Player[], statKey: string }) {
  if (data.length === 0) return null

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" stroke="#ccc" />
          <YAxis type="category" dataKey="name" stroke="#ccc" width={100} />
          <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }} />
          <Bar dataKey={statKey} fill="#39FF14">
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#facc15' : '#39FF14'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
