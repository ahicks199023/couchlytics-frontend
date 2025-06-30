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
import { API_BASE } from '@/lib/config'

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
  { value: 'pass_yds', label: 'Passing Yards' },
  { value: 'pass_tds', label: 'Passing TDs' },
  { value: 'pass_ints', label: 'Interceptions Thrown' },
  { value: 'pass_comp', label: 'Completions' },
  { value: 'pass_att', label: 'Attempts' },
  { value: 'passer_rating', label: 'Passer Rating' },
  { value: 'pass_yds_per_game', label: 'Pass Yards/Game' },
  { value: 'pass_comp_pct', label: 'Completion %' },
  { value: 'pass_yds_per_att', label: 'Yards/Attempt' },
  { value: 'pass_longest', label: 'Longest Pass' },
  { value: 'pass_sacks', label: 'Sacks Taken' },
  { value: 'pass_pts', label: 'Passing Points' },
  { value: 'rush_yds', label: 'Rushing Yards' },
  { value: 'rush_tds', label: 'Rushing TDs' },
  { value: 'rush_att', label: 'Rushing Attempts' },
  { value: 'rush_yds_per_game', label: 'Rush Yards/Game' },
  { value: 'rush_yds_per_att', label: 'Yards/Carry' },
  { value: 'rush_longest', label: 'Longest Rush' },
  { value: 'rush_fum', label: 'Fumbles (Rushing)' },
  { value: 'rush_pts', label: 'Rushing Points' },
  { value: 'rush_20_plus_yds', label: '20+ Yard Runs' },
  { value: 'rush_broken_tackles', label: 'Broken Tackles' },
  { value: 'rush_yds_after_contact', label: 'Yards After Contact' },
  { value: 'rush_to_pct', label: 'Rushing TO%' },
  { value: 'rec_yds', label: 'Receiving Yards' },
  { value: 'rec_tds', label: 'Receiving TDs' },
  { value: 'rec_catches', label: 'Receptions' },
  { value: 'rec_drops', label: 'Drops' },
  { value: 'rec_yds_per_game', label: 'Rec Yards/Game' },
  { value: 'rec_yds_per_catch', label: 'Yards/Catch' },
  { value: 'rec_longest', label: 'Longest Reception' },
  { value: 'rec_pts', label: 'Receiving Points' },
  { value: 'rec_catch_pct', label: 'Catch %' },
  { value: 'rec_to_pct', label: 'Receiving TO%' },
  { value: 'rec_yac_per_catch', label: 'YAC/Catch' },
  { value: 'rec_yds_after_catch', label: 'Yards After Catch' },
  { value: 'def_total_tackles', label: 'Total Tackles' },
  { value: 'def_sacks', label: 'Sacks' },
  { value: 'def_ints', label: 'Interceptions' },
  { value: 'def_int_return_yds', label: 'INT Return Yards' },
  { value: 'def_tds', label: 'Defensive TDs' },
  { value: 'def_pts', label: 'Defensive Points' },
  { value: 'def_fum_rec', label: 'Fumble Recoveries' },
  { value: 'def_forced_fum', label: 'Forced Fumbles' },
  { value: 'def_deflections', label: 'Deflections' },
  { value: 'def_safeties', label: 'Safeties' },
  { value: 'def_catch_allowed', label: 'Catches Allowed' },
  { value: 'fg_made', label: 'FG Made' },
  { value: 'fg_att', label: 'FG Attempts' },
  { value: 'fg_comp_pct', label: 'FG %' },
  { value: 'fg_longest', label: 'Longest FG' },
  { value: 'fg_50_plus_att', label: '50+ FG Attempts' },
  { value: 'fg_50_plus_made', label: '50+ FG Made' },
  { value: 'xp_made', label: 'XP Made' },
  { value: 'xp_att', label: 'XP Attempts' },
  { value: 'xp_comp_pct', label: 'XP %' },
  { value: 'kick_pts', label: 'Kicking Points' },
  { value: 'kickoff_att', label: 'Kickoff Attempts' },
  { value: 'kickoff_tbs', label: 'Touchbacks (Kickoff)' },
  { value: 'punt_att', label: 'Punt Attempts' },
  { value: 'punt_yds', label: 'Punt Yards' },
  { value: 'punt_yds_per_att', label: 'Yards/Punt' },
  { value: 'punt_longest', label: 'Longest Punt' },
  { value: 'punt_net_yds', label: 'Net Punt Yards' },
  { value: 'punt_net_yds_per_att', label: 'Net Yards/Punt' },
  { value: 'punts_in20', label: 'Punts Inside 20' },
  { value: 'punt_tbs', label: 'Touchbacks (Punt)' },
  { value: 'punts_blocked', label: 'Punts Blocked' },
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
  const [statType, setStatType] = useState(statOptions[0].value)
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
        const res = await fetch(`${API_BASE}/me`)
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

        const res = await fetch(`${API_BASE}/leagues/${leagueId}/stats/leaders?${query.toString()}`)
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
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
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
