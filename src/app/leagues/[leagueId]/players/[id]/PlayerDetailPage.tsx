'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { API_BASE } from '@/lib/config'
import { statOptions, getStatLabel } from '@/constants/statTypes'

interface Player {
  id: number
  name: string
  team: string
  position: string
  ovr: number
  teamId?: number
  teamName?: string
  user?: string
  espnId?: string
  devTrait?: string
  age?: number
  yearsPro?: number
  speedRating?: number
  strengthRating?: number
  awareRating?: number
  throwPowerRating?: number
  throwAccRating?: number
  throwOnRunRating?: number
  catchRating?: number
  routeRunShortRating?: number
  specCatchRating?: number
  carryRating?: number
  jukeMoveRating?: number
  breakTackleRating?: number
  passBlockRating?: number
  runBlockRating?: number
  leadBlockRating?: number
  tackleRating?: number
  hitPowerRating?: number
  blockShedRating?: number
  manCoverRating?: number
  zoneCoverRating?: number
  pressRating?: number
  college?: string
  height?: number
  weight?: number
  birthDay?: number
  birthMonth?: number
  birthYear?: number
  clutchTrait?: boolean
  highMotorTrait?: boolean
  bigHitTrait?: boolean
  stripBallTrait?: boolean
  value?: number
  wins?: number
  [key: string]: string | number | boolean | undefined
}

export default function PlayerDetailPage() {
  const { leagueId } = useParams()
  const [stats, setStats] = useState<Record<string, Player[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>(statOptions[0].value)
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')

  useEffect(() => {
    const url =
      selectedWeek === 'all'
        ? `${API_BASE}/leagues/${leagueId}/stats`
        : `${API_BASE}/leagues/${leagueId}/stats?week=${selectedWeek}`

    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setStats(data)
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

  const isPlayerStat = selectedCategory !== 'team_wins'
  const allData: Player[] = stats[selectedCategory] || []
  const statKey = selectedCategory === 'team_wins' ? 'wins' : 'value'
  const categoryLabel = getStatLabel(selectedCategory)

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
        <h2 className="text-2xl font-semibold text-white">Player Stat Leaders</h2>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWeek}
            onChange={(e) =>
              setSelectedWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="bg-gray-900 border border-gray-600 text-white text-sm rounded px-2 py-1"
          >
            <option value="all">All Weeks</option>
            {[...Array(18)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Week {i + 1}
              </option>
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
            {statOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {isPlayerStat && (
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="bg-gray-900 border border-gray-600 text-white text-sm rounded px-2 py-1"
            >
              <option value="all">All Positions</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
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
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-gray-400 italic">
          🚫 No stats available for this selection.
        </div>
      ) : (
        <>
          <StatBlock title={categoryLabel} data={filteredData} statKey={statKey} leagueId={Number(leagueId)} />
          <StatBarChart data={filteredData} statKey={statKey} />
        </>
      )}
    </div>
  )
}

function StatBlock({
  title,
  data,
  statKey,
  leagueId
}: {
  title: string
  data: Player[]
  statKey: string
  leagueId: number
}) {
  return (
    <div className="bg-gray-900 p-4 rounded mb-6">
      <h3 className="text-lg font-bold mb-2 text-neon-green">{title}</h3>
      <ul className="text-sm space-y-1">
        {data.map((entry, i) => {
          const profileUrl = entry.id
            ? `/leagues/${leagueId}/players/${entry.id}`
            : '#'

          return (
            <li key={i}>
              <Link href={profileUrl} className="hover:underline">
                <span
                  className={`mr-2 font-bold ${i === 0 ? 'text-yellow-400' : 'text-white'}`}
                >
                  #{i + 1}
                </span>
                {entry.name || 'Unnamed Player'}
              </Link>{' '}
              — {entry[statKey]}
              <Link href={`/leagues/${leagueId}/teams/${entry.teamId}`} className="text-blue-400 hover:underline ml-2">
                (Team #{entry.teamId})
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function StatBarChart({
  data,
  statKey
}: {
  data: Player[]
  statKey: string
}) {
  const chartData = data.slice(0, 10).map((entry, i) => ({
    name: entry.name || 'Unnamed Player',
    value: entry[statKey] as number,
    color: i === 0 ? '#facc15' : '#39FF14'
  }))

  return (
    <div className="bg-gray-900 p-4 rounded">
      <h3 className="text-lg font-bold mb-4 text-neon-green">Top 10 Chart</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" stroke="#ccc" />
          <YAxis type="category" dataKey="name" stroke="#ccc" width={120} />
          <Tooltip
            cursor={{ fill: '#222' }}
            contentStyle={{
              backgroundColor: '#333',
              borderColor: '#555',
              color: '#fff'
            }}
          />
          <Bar dataKey="value" fill="#39FF14">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
