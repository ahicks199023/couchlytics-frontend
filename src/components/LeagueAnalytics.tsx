import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { API_BASE } from '@/lib/config'

type Player = {
  name: string
  teamId: number
  position: string
  valueScore: number
  devTrait?: string
}

type TeamStat = {
  teamId: number
  teamName: string
  statType: string
  total: number
}

type TeamOvr = {
  teamName: string
  avgOvr: number
}

type AnalyticsData = {
  topPlayers: Player[]
  avgScoreByPosition: { position: string; avgScore: number }[]
  devTraitDistribution: { devTrait: string; count: number }[]
  topTeamsByOvr: TeamOvr[]
  statTotalsByTeam: TeamStat[]
}

const LeagueAnalytics: React.FC = () => {
  const { leagueId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedPosition, setSelectedPosition] = useState(searchParams.get('position') || 'All')
  const [selectedDevTrait, setSelectedDevTrait] = useState(searchParams.get('devTrait') || 'All')
  const [selectedWeek, setSelectedWeek] = useState(searchParams.get('week') || 'All')

  // Build URL params and fetch data
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedPosition !== 'All') params.set('position', selectedPosition)
    if (selectedDevTrait !== 'All') params.set('devTrait', selectedDevTrait)
    if (selectedWeek !== 'All') params.set('week', selectedWeek)

    setSearchParams(params)

    const weekQuery = selectedWeek !== 'All' ? `?week=${selectedWeek}` : ''
    fetch(`${API_BASE}/leagues/${leagueId}/analytics${weekQuery}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
  }, [leagueId, search, selectedPosition, selectedDevTrait, selectedWeek, setSearchParams])

  if (!data) return <p className="p-4">Loading analytics...</p>

  const devColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#8dd1e1']

  const filteredPlayers = data.topPlayers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesPosition = selectedPosition === 'All' || p.position === selectedPosition
    const matchesDev = selectedDevTrait === 'All' || p.devTrait === selectedDevTrait
    return matchesSearch && matchesPosition && matchesDev
  })

  const uniquePositions = [...new Set(data.topPlayers.map((p) => p.position))].sort()
  const uniqueDevTraits = [...new Set(data.devTraitDistribution.map((d) => d.devTrait))].sort()

  const groupedStats: Record<string, TeamStat[]> = data.statTotalsByTeam.reduce(
    (acc: Record<string, TeamStat[]>, stat) => {
      if (!acc[stat.teamName]) acc[stat.teamName] = []
      acc[stat.teamName].push(stat)
      return acc
    },
    {}
  )

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">League Analytics</h1>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Top 10 Players by Value Score</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name..."
              className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="All">All Positions</option>
              {uniquePositions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <select
              className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600"
              value={selectedDevTrait}
              onChange={(e) => setSelectedDevTrait(e.target.value)}
            >
              <option value="All">All Dev Traits</option>
              {uniqueDevTraits.map((dev) => (
                <option key={dev} value={dev}>{dev}</option>
              ))}
            </select>
            <select
              className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              <option value="All">All Weeks</option>
              {[...Array(18)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
              ))}
            </select>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Team</th>
                <th>Position</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.teamId}</td>
                  <td>{p.position}</td>
                  <td>{p.valueScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">Average Value Score by Position</h2>
          <BarChart width={500} height={300} data={data.avgScoreByPosition}>
            <XAxis dataKey="position" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgScore" fill="#8884d8" />
          </BarChart>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">Dev Trait Distribution</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={data.devTraitDistribution}
              dataKey="count"
              nameKey="devTrait"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.devTraitDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={devColors[index % devColors.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">Top 5 Teams by Avg OVR</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Team</th>
                <th>Avg OVR</th>
              </tr>
            </thead>
            <tbody>
              {data.topTeamsByOvr.map((t, i) => (
                <tr key={i}>
                  <td>{t.teamName}</td>
                  <td>{t.avgOvr.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">Team Stat Totals {selectedWeek !== 'All' ? `(Week ${selectedWeek})` : ''}</h2>
          {Object.entries(groupedStats).map(([teamName, stats]) => (
            <div key={teamName} className="mb-4">
              <h3 className="font-semibold">{teamName}</h3>
              <table className="w-full text-xs border mb-2">
                <thead>
                  <tr>
                    <th>Stat</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={i}>
                      <td>{s.statType}</td>
                      <td>{s.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default LeagueAnalytics
