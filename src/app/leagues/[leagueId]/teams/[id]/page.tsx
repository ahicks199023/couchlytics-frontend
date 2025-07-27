'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE, authenticatedFetch } from '@/lib/config'
import { TeamDetailResponse } from '@/types/analytics'

export default function TeamDetailPage() {
  const { leagueId, id: teamId } = useParams()
  const leagueIdString = leagueId as string
  const teamIdString = teamId as string
  
  // State for team data
  const [teamData, setTeamData] = useState<TeamDetailResponse | null>(null)
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'statistics' | 'roster' | 'depth-chart' | 'transactions' | 'contracts' | 'customization'>('home')
  const [activeStatTab, setActiveStatTab] = useState<'offense' | 'defense'>('offense')

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch team detail information from the new single endpoint
        const detailResponse = await authenticatedFetch(`${API_BASE}/leagues/${leagueIdString}/teams/${teamIdString}/detail`)
        
        if (detailResponse.ok) {
          const data = await detailResponse.json()
          setTeamData(data)
          console.log('[TeamDetail] Team data loaded:', data)
        } else {
          console.error('[TeamDetail] Failed to fetch team data:', detailResponse.status)
          setError('Failed to load team data')
        }

      } catch (err) {
        console.error('[TeamDetail] Error fetching team data:', err)
        setError('Failed to load team data')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [leagueIdString, teamIdString])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
          <span className="ml-2 text-white">Loading team data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Team Data</h3>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="text-center p-8">
          <p className="text-gray-400">Team not found</p>
        </div>
      </div>
    )
  }

  const formatCurrencyValue = (value: number) => {
    return `$${value.toFixed(2)}M`
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/leagues/${leagueIdString}/teams`} className="text-neon-green hover:underline">
                ← Back to Teams
              </Link>
              <h1 className="text-2xl font-bold">{teamData.team.name}</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Record</div>
              <div className="text-lg font-semibold">{teamData.team.record}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Overview */}
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold">{teamData.team.name.split(' ').map(word => word[0]).join('')}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{teamData.team.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Record: {teamData.team.record}</span>
                    <span>Owner: {teamData.team.user}</span>
                    <span>Roster: {teamData.team.rosterCount}</span>
                  </div>
                </div>
              </div>

              {/* Team Notes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Team Notes</h3>
                <p className="text-gray-400">None</p>
              </div>

              {/* Offense/Defense Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Offense</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">PTS:</span>
                      <span className="text-white">{teamData.offensiveStats.points} (Rank: {teamData.offensiveStats.pointsRank})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">YDS:</span>
                      <span className="text-white">{teamData.offensiveStats.yards.toLocaleString()} (Rank: {teamData.offensiveStats.yardsRank})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">P.YDS:</span>
                      <span className="text-white">{teamData.offensiveStats.passingYards.toLocaleString()} (Rank: {teamData.offensiveStats.passingYardsRank})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">R.YDS:</span>
                      <span className="text-white">{teamData.offensiveStats.rushingYards.toLocaleString()} (Rank: {teamData.offensiveStats.rushingYardsRank})</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Defense</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">PTS:</span>
                      <span className="text-white">{teamData.defensiveStats.points} (Rank: {teamData.defensiveStats.pointsRank})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">YDS:</span>
                      <span className="text-white">{teamData.defensiveStats.yards.toLocaleString()} (Rank: {teamData.defensiveStats.yardsRank})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">P.YDS:</span>
                      <span className="text-white">{teamData.defensiveStats.passingYards.toLocaleString()} (Rank: {teamData.defensiveStats.passingYardsRank})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">R.YDS:</span>
                      <span className="text-white">{teamData.defensiveStats.rushingYards.toLocaleString()} (Rank: {teamData.defensiveStats.rushingYardsRank})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Block Comments */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Trade Block Comments</h3>
                <p className="text-gray-400">None</p>
              </div>
            </div>

            {/* Details and Cap Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Division:</span>
                    <span className="text-white">{teamData.team.division}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member:</span>
                    <span className="text-white">@{teamData.team.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coach/Owner:</span>
                    <span className="text-white">{teamData.team.user.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Offense Scheme:</span>
                    <span className="text-white">{teamData.team.offenseScheme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defense Scheme:</span>
                    <span className="text-white">{teamData.team.defenseScheme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Roster Count:</span>
                    <span className="text-white">{teamData.team.rosterCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Injury Count:</span>
                    <span className="text-white">{teamData.team.injuryCount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Cap Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cap Room:</span>
                    <span className="text-green-400">{formatCurrencyValue(teamData.capInformation.capRoom)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Spent:</span>
                    <span className="text-white">{formatCurrencyValue(teamData.capInformation.spent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available:</span>
                    <span className="text-white">{formatCurrencyValue(teamData.capInformation.available)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Salary:</span>
                    <span className="text-white">{formatCurrencyValue(teamData.capInformation.totalSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Bonus:</span>
                    <span className="text-white">{formatCurrencyValue(teamData.capInformation.totalBonus)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-gray-900 rounded-lg">
              <div className="border-b border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'home', label: 'HOME' },
                    { id: 'schedule', label: 'SCHEDULE' },
                    { id: 'statistics', label: 'STATISTICS' },
                    { id: 'roster', label: 'ROSTER' },
                    { id: 'depth-chart', label: 'DEPTH CHART' },
                    { id: 'transactions', label: 'TRANSACTIONS' },
                    { id: 'contracts', label: 'CONTRACTS' },
                    { id: 'customization', label: 'CUSTOMIZATION' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'home' | 'schedule' | 'statistics' | 'roster' | 'depth-chart' | 'transactions' | 'contracts' | 'customization')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-neon-green text-neon-green'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'home' && (
                  <div className="space-y-6">
                    {/* Upcoming Games */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Upcoming Games</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 px-2 text-gray-400">WEEK</th>
                              <th className="text-left py-2 px-2 text-gray-400">OPP</th>
                              <th className="text-left py-2 px-2 text-gray-400">RESULT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamData.upcomingGames.length > 0 ? (
                              teamData.upcomingGames.map((game, index) => (
                                <tr key={index} className="border-b border-gray-700/50">
                                  <td className="py-2 px-2 text-white">{game.week}</td>
                                  <td className="py-2 px-2 text-white">{game.opponent}</td>
                                  <td className="py-2 px-2 text-white">{game.result || 'TBD'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="py-4 text-center text-gray-500">
                                  No matching records found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Division Standings */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{teamData.team.division} Standings</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 px-2 text-gray-400">Team</th>
                              <th className="text-center py-2 px-2 text-gray-400">W</th>
                              <th className="text-center py-2 px-2 text-gray-400">L</th>
                              <th className="text-center py-2 px-2 text-gray-400">T</th>
                              <th className="text-center py-2 px-2 text-gray-400">%</th>
                              <th className="text-center py-2 px-2 text-gray-400">PF</th>
                              <th className="text-center py-2 px-2 text-gray-400">PA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamData.divisionStandings.map((standing, index) => (
                              <tr key={index} className="border-b border-gray-700/50">
                                <td className="py-2 px-2 text-white">{standing.abbreviation} ({standing.team})</td>
                                <td className="py-2 px-2 text-center text-white">{standing.wins}</td>
                                <td className="py-2 px-2 text-center text-white">{standing.losses}</td>
                                <td className="py-2 px-2 text-center text-white">{standing.ties}</td>
                                <td className="py-2 px-2 text-center text-white">{standing.winPercentage.toFixed(2)}</td>
                                <td className="py-2 px-2 text-center text-white">{standing.pointsFor}</td>
                                <td className="py-2 px-2 text-center text-white">{standing.pointsAgainst}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2">
                        <Link href={`/leagues/${leagueIdString}/standings`} className="text-neon-green hover:underline text-sm">
                          All Standings
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'statistics' && (
                  <div>
                    <div className="flex space-x-4 mb-4">
                      <button
                        onClick={() => setActiveStatTab('offense')}
                        className={`px-4 py-2 rounded ${
                          activeStatTab === 'offense'
                            ? 'bg-neon-green text-black'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        OFFENSE
                      </button>
                      <button
                        onClick={() => setActiveStatTab('defense')}
                        className={`px-4 py-2 rounded ${
                          activeStatTab === 'defense'
                            ? 'bg-neon-green text-black'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        DEFENSE
                      </button>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Stat Leaders ({activeStatTab})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeStatTab === 'offense' ? (
                          <>
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs">QB</span>
                                </div>
                                <div>
                                  <div className="font-medium text-white">{teamData.leaders.passing.player}</div>
                                  <div className="text-sm text-gray-400">QB • {teamData.team.name.split(' ').map(word => word[0]).join('')}</div>
                                  <div className="text-neon-green font-semibold">{teamData.leaders.passing.yards.toLocaleString()} yds</div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs">HB</span>
                                </div>
                                <div>
                                  <div className="font-medium text-white">{teamData.leaders.rushing.player}</div>
                                  <div className="text-sm text-gray-400">HB • {teamData.team.name.split(' ').map(word => word[0]).join('')}</div>
                                  <div className="text-neon-green font-semibold">{teamData.leaders.rushing.yards.toLocaleString()} yds</div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs">WR</span>
                                </div>
                                <div>
                                  <div className="font-medium text-white">{teamData.leaders.receiving.player}</div>
                                  <div className="text-sm text-gray-400">WR • {teamData.team.name.split(' ').map(word => word[0]).join('')}</div>
                                  <div className="text-neon-green font-semibold">{teamData.leaders.receiving.yards.toLocaleString()} yds</div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs">{teamData.leaders.tackles.position}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-white">{teamData.leaders.tackles.player}</div>
                                  <div className="text-sm text-gray-400">{teamData.leaders.tackles.position} • {teamData.team.name.split(' ').map(word => word[0]).join('')}</div>
                                  <div className="text-neon-green font-semibold">{teamData.leaders.tackles.tackles} tkl</div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs">{teamData.leaders.sacks.position}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-white">{teamData.leaders.sacks.player}</div>
                                  <div className="text-sm text-gray-400">{teamData.leaders.sacks.position} • {teamData.team.name.split(' ').map(word => word[0]).join('')}</div>
                                  <div className="text-neon-green font-semibold">{teamData.leaders.sacks.sacks} sack</div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs">{teamData.leaders.interceptions.position}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-white">{teamData.leaders.interceptions.player}</div>
                                  <div className="text-sm text-gray-400">{teamData.leaders.interceptions.position} • {teamData.team.name.split(' ').map(word => word[0]).join('')}</div>
                                  <div className="text-neon-green font-semibold">{teamData.leaders.interceptions.interceptions} int</div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="mt-4">
                        <button className="text-neon-green hover:underline text-sm">View All</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add other tab content as needed */}
                {activeTab !== 'home' && activeTab !== 'statistics' && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Content for {activeTab} tab coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* On The Block */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">On The Block</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-400">Player</th>
                      <th className="text-left py-2 px-2 text-gray-400">POS</th>
                      <th className="text-center py-2 px-2 text-gray-400">DEV</th>
                      <th className="text-center py-2 px-2 text-gray-400">OVR</th>
                      <th className="text-center py-2 px-2 text-gray-400">AGE</th>
                      <th className="text-center py-2 px-2 text-gray-400">HGT</th>
                      <th className="text-center py-2 px-2 text-gray-400">SPD</th>
                      <th className="text-right py-2 px-2 text-gray-400">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-gray-500">
                        No matching records found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Expensive */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Most Expensive</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-400">Player</th>
                      <th className="text-left py-2 px-2 text-gray-400">POS</th>
                      <th className="text-center py-2 px-2 text-gray-400">DEV</th>
                      <th className="text-center py-2 px-2 text-gray-400">OVR</th>
                      <th className="text-right py-2 px-2 text-gray-400">CAP HIT</th>
                      <th className="text-right py-2 px-2 text-gray-400">SALARY</th>
                      <th className="text-right py-2 px-2 text-gray-400">BONUS</th>
                      <th className="text-center py-2 px-2 text-gray-400">YRS LEFT</th>
                      <th className="text-center py-2 px-2 text-gray-400">LEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamData.mostExpensive.map((player, index) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-2 px-2 text-white font-medium">{player.player}</td>
                        <td className="py-2 px-2 text-gray-300">{player.position}</td>
                        <td className="py-2 px-2 text-center text-gray-300">{player.devTrait}</td>
                        <td className="py-2 px-2 text-center text-white">{player.overall}</td>
                        <td className="py-2 px-2 text-right text-white">{formatCurrencyValue(player.capHit)}</td>
                        <td className="py-2 px-2 text-right text-white">{formatCurrencyValue(player.salary)}</td>
                        <td className="py-2 px-2 text-right text-white">{formatCurrencyValue(player.bonus)}</td>
                        <td className="py-2 px-2 text-center text-gray-300">{player.yearsLeft}</td>
                        <td className="py-2 px-2 text-center text-gray-300">{player.contractLength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming FA */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Upcoming FA</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-400">Player</th>
                      <th className="text-left py-2 px-2 text-gray-400">POS</th>
                      <th className="text-center py-2 px-2 text-gray-400">DEV</th>
                      <th className="text-center py-2 px-2 text-gray-400">OVR</th>
                      <th className="text-right py-2 px-2 text-gray-400">CAP HIT</th>
                      <th className="text-right py-2 px-2 text-gray-400">SALARY</th>
                      <th className="text-right py-2 px-2 text-gray-400">BONUS</th>
                      <th className="text-center py-2 px-2 text-gray-400">YRS LEFT</th>
                      <th className="text-center py-2 px-2 text-gray-400">LEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamData.upcomingFreeAgents.map((player, index) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-2 px-2 text-white font-medium">{player.player}</td>
                        <td className="py-2 px-2 text-gray-300">{player.position}</td>
                        <td className="py-2 px-2 text-center text-gray-300">{player.devTrait}</td>
                        <td className="py-2 px-2 text-center text-white">{player.overall}</td>
                        <td className="py-2 px-2 text-right text-white">{formatCurrencyValue(player.capHit)}</td>
                        <td className="py-2 px-2 text-right text-white">{formatCurrencyValue(player.salary)}</td>
                        <td className="py-2 px-2 text-right text-white">{formatCurrencyValue(player.bonus)}</td>
                        <td className="py-2 px-2 text-center text-gray-300">{player.yearsLeft}</td>
                        <td className="py-2 px-2 text-center text-gray-300">{player.contractLength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
