'use client'

import React, { useEffect, useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import Image from 'next/image'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface StatLeader {
  playerId: string
  portraitId?: string
  espnId?: string
  name: string
  teamName: string
  teamId?: number
  statValue: number
  position?: string
}

interface Props {
  leagueId: number
}

const statOptions = [
  'passingYards',
  'rushingYards',
  'receivingYards',
  'tackles',
  'sacks',
  'interceptions',
  'fumbles',
]

const positionOptions = [
  'ALL',
  'QB',
  'HB',
  'WR',
  'TE',
  'OL',
  'DL',
  'LB',
  'CB',
  'S',
  'K',
  'P',
]

export const LeagueStatLeaders: React.FC<Props> = ({ leagueId }) => {
  const [statType, setStatType] = useState('passingYards')
  const [week, setWeek] = useState('')
  const [position, setPosition] = useState('ALL')
  const [leaders, setLeaders] = useState<StatLeader[]>([])
  const [view, setView] = useState<'table' | 'chart'>('table')
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/me')
        const data = await res.json()
        if (data?.teamId) setCurrentTeamId(data.teamId)
      } catch (err) {
        console.error('Failed to fetch current user:', err)
      }
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const query = new URLSearchParams({ statType })
        if (week) query.append('week', week)

        const res = await fetch(`/leagues/${leagueId}/stats/leaders?${query.toString()}`)
        if (!res.ok) {
          throw new Error('Failed to fetch stat leaders')
        }
        const data = await res.json()
        setLeaders(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching leaders:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stat leaders')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaders()
  }, [leagueId, statType, week])

  const filteredLeaders =
    position === 'ALL'
      ? leaders
      : leaders.filter((l) => l.position?.toUpperCase() === position)

  const chartData = {
    labels: filteredLeaders.map((l) => `${l.name} (${l.teamName})`),
    datasets: [
      {
        label: statType,
        data: filteredLeaders.map((l) => l.statValue),
      },
    ],
  }

  if (loading) return <p className="text-gray-400">Loading stats...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <Card className="p-4 w-full">
      <CardContent>
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <Select value={statType} onValueChange={setStatType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stat Type" />
            </SelectTrigger>
            <SelectContent>
              {statOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Week # (optional)"
            value={week}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setWeek(e.target.value)
            }
            className="w-[140px]"
            type="number"
          />

          <button
            className="ml-auto text-sm underline"
            onClick={() => setView(view === 'table' ? 'chart' : 'table')}
          >
            Toggle {view === 'table' ? 'Chart' : 'Table'}
          </button>
        </div>

        {view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Player</th>
                  <th className="text-left p-2">Team</th>
                  <th className="text-left p-2">Pos</th>
                  <th className="text-right p-2">{statType}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaders.map((leader, idx) => {
                  const isUserTeam = leader.teamId === currentTeamId
                  return (
                    <tr
                      key={leader.playerId}
                      className={`border-t ${
                        isUserTeam
                          ? 'bg-yellow-100 dark:bg-yellow-900 font-bold'
                          : ''
                      }`}
                    >
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 flex items-center gap-2">
                        {leader.espnId ? (
                          <Image
                            src={`/headshots/${leader.espnId}.png`}
                            alt={leader.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/headshots/default.png'
                            }}
                          />
                        ) : (
                          <Image
                            src={`https://cdn.madden.tools/player-portraits/${leader.portraitId || '0'}.png`}
                            alt={leader.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/default-avatar.png'
                            }}
                          />
                        )}
                        {leader.name}
                      </td>
                      <td className="p-2">{leader.teamName}</td>
                      <td className="p-2">{leader.position ?? '—'}</td>
                      <td className="p-2 text-right">{leader.statValue}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Bar data={chartData} />
        )}
      </CardContent>
    </Card>
  )
}
