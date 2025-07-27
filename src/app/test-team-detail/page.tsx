'use client'

import { useEffect, useState } from 'react'
import { API_BASE, authenticatedFetch } from '@/lib/config'
import { TeamDetailResponse } from '@/types/analytics'

export default function TestTeamDetailPage() {
  const [teamData, setTeamData] = useState<TeamDetailResponse | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<{ status: number; data: unknown } | null>(null)

  // Test with hardcoded values
  const leagueId = '12335716'
  const teamId = '123' // Test team ID

  useEffect(() => {
    const testTeamApi = async () => {
      try {
        setLoading(true)
        setError(null)

        // Test the new single team detail endpoint
        console.log('[TestTeamDetail] Testing team detail endpoint...')
        const detailResponse = await authenticatedFetch(`${API_BASE}/leagues/${leagueId}/teams/${teamId}/detail`)
        
        setApiStatus({ status: detailResponse.status, data: null })
        
        if (detailResponse.ok) {
          const data = await detailResponse.json()
          setTeamData(data)
          setApiStatus({ status: detailResponse.status, data })
          console.log('[TestTeamDetail] Team detail data:', data)
        } else {
          console.error('[TestTeamDetail] Team detail failed:', detailResponse.status)
          const errorText = await detailResponse.text()
          console.error('[TestTeamDetail] Error response:', errorText)
        }

      } catch (err) {
        console.error('[TestTeamDetail] Test failed:', err)
        setError('Failed to test team API')
      } finally {
        setLoading(false)
      }
    }

    testTeamApi()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
          <span className="ml-2 text-white">Testing team detail API...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Team Detail API Test</h1>
      
      <div className="space-y-6">
        {/* API Status Summary */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">API Status</h2>
          <div className="text-center">
            <div className="text-sm text-gray-400">Team Detail Endpoint</div>
            <div className={`text-lg font-bold ${
              apiStatus?.status === 200 ? 'text-green-400' : 'text-red-400'
            }`}>
              {apiStatus?.status || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Team Detail */}
        {teamData && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Team Detail</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(teamData, null, 2)}</pre>
          </div>
        )}

        {/* Team Summary */}
        {teamData && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Team Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Team Name</div>
                <div className="text-white font-medium">{teamData.team.name}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Record</div>
                <div className="text-white font-medium">{teamData.team.record}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Owner</div>
                <div className="text-white font-medium">{teamData.team.user}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Roster Count</div>
                <div className="text-white font-medium">{teamData.team.rosterCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* Cap Information */}
        {teamData && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Cap Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Cap Room</div>
                <div className="text-green-400 font-medium">${teamData.capInformation.capRoom}M</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Spent</div>
                <div className="text-white font-medium">${teamData.capInformation.spent}M</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Available</div>
                <div className="text-white font-medium">${teamData.capInformation.available}M</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Total Salary</div>
                <div className="text-white font-medium">${teamData.capInformation.totalSalary}M</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Total Bonus</div>
                <div className="text-white font-medium">${teamData.capInformation.totalBonus}M</div>
              </div>
            </div>
          </div>
        )}

        {/* Offensive Stats */}
        {teamData && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Offensive Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Points</div>
                <div className="text-white font-medium">{teamData.offensiveStats.points} (Rank: {teamData.offensiveStats.pointsRank})</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Total Yards</div>
                <div className="text-white font-medium">{teamData.offensiveStats.yards.toLocaleString()} (Rank: {teamData.offensiveStats.yardsRank})</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Passing Yards</div>
                <div className="text-white font-medium">{teamData.offensiveStats.passingYards.toLocaleString()} (Rank: {teamData.offensiveStats.passingYardsRank})</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Rushing Yards</div>
                <div className="text-white font-medium">{teamData.offensiveStats.rushingYards.toLocaleString()} (Rank: {teamData.offensiveStats.rushingYardsRank})</div>
              </div>
            </div>
          </div>
        )}

        {/* Defensive Stats */}
        {teamData && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Defensive Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Points Allowed</div>
                <div className="text-white font-medium">{teamData.defensiveStats.points} (Rank: {teamData.defensiveStats.pointsRank})</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Total Yards</div>
                <div className="text-white font-medium">{teamData.defensiveStats.yards.toLocaleString()} (Rank: {teamData.defensiveStats.yardsRank})</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Passing Yards</div>
                <div className="text-white font-medium">{teamData.defensiveStats.passingYards.toLocaleString()} (Rank: {teamData.defensiveStats.passingYardsRank})</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Rushing Yards</div>
                <div className="text-white font-medium">{teamData.defensiveStats.rushingYards.toLocaleString()} (Rank: {teamData.defensiveStats.rushingYardsRank})</div>
              </div>
            </div>
          </div>
        )}

        {/* Team Leaders */}
        {teamData && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Team Leaders</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Passing Leader</div>
                <div className="text-white font-medium">{teamData.leaders.passing.player} ({teamData.leaders.passing.position})</div>
                <div className="text-neon-green">{teamData.leaders.passing.yards.toLocaleString()} yards</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Rushing Leader</div>
                <div className="text-white font-medium">{teamData.leaders.rushing.player} ({teamData.leaders.rushing.position})</div>
                <div className="text-neon-green">{teamData.leaders.rushing.yards.toLocaleString()} yards</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Receiving Leader</div>
                <div className="text-white font-medium">{teamData.leaders.receiving.player} ({teamData.leaders.receiving.position})</div>
                <div className="text-neon-green">{teamData.leaders.receiving.yards.toLocaleString()} yards</div>
              </div>
            </div>
          </div>
        )}

        {/* Most Expensive Players */}
        {teamData && teamData.mostExpensive.length > 0 && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Most Expensive Players ({teamData.mostExpensive.length} players)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-400">Player</th>
                    <th className="text-left py-2 px-2 text-gray-400">POS</th>
                    <th className="text-center py-2 px-2 text-gray-400">DEV</th>
                    <th className="text-center py-2 px-2 text-gray-400">OVR</th>
                    <th className="text-right py-2 px-2 text-gray-400">Cap Hit</th>
                    <th className="text-right py-2 px-2 text-gray-400">Salary</th>
                    <th className="text-right py-2 px-2 text-gray-400">Bonus</th>
                    <th className="text-center py-2 px-2 text-gray-400">YRS LEFT</th>
                    <th className="text-center py-2 px-2 text-gray-400">LEN</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.mostExpensive.slice(0, 5).map((player, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      <td className="py-2 px-2 text-white">{player.player}</td>
                      <td className="py-2 px-2 text-gray-300">{player.position}</td>
                      <td className="py-2 px-2 text-center text-gray-300">{player.devTrait}</td>
                      <td className="py-2 px-2 text-center text-white">{player.overall}</td>
                      <td className="py-2 px-2 text-right text-white">${player.capHit}M</td>
                      <td className="py-2 px-2 text-right text-white">${player.salary}M</td>
                      <td className="py-2 px-2 text-right text-white">${player.bonus}M</td>
                      <td className="py-2 px-2 text-center text-gray-300">{player.yearsLeft}</td>
                      <td className="py-2 px-2 text-center text-gray-300">{player.contractLength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upcoming Free Agents */}
        {teamData && teamData.upcomingFreeAgents.length > 0 && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Upcoming Free Agents ({teamData.upcomingFreeAgents.length} players)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-400">Player</th>
                    <th className="text-left py-2 px-2 text-gray-400">POS</th>
                    <th className="text-center py-2 px-2 text-gray-400">DEV</th>
                    <th className="text-center py-2 px-2 text-gray-400">OVR</th>
                    <th className="text-right py-2 px-2 text-gray-400">Cap Hit</th>
                    <th className="text-right py-2 px-2 text-gray-400">Salary</th>
                    <th className="text-right py-2 px-2 text-gray-400">Bonus</th>
                    <th className="text-center py-2 px-2 text-gray-400">YRS LEFT</th>
                    <th className="text-center py-2 px-2 text-gray-400">LEN</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.upcomingFreeAgents.slice(0, 5).map((player, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      <td className="py-2 px-2 text-white">{player.player}</td>
                      <td className="py-2 px-2 text-gray-300">{player.position}</td>
                      <td className="py-2 px-2 text-center text-gray-300">{player.devTrait}</td>
                      <td className="py-2 px-2 text-center text-white">{player.overall}</td>
                      <td className="py-2 px-2 text-right text-white">${player.capHit}M</td>
                      <td className="py-2 px-2 text-right text-white">${player.salary}M</td>
                      <td className="py-2 px-2 text-right text-white">${player.bonus}M</td>
                      <td className="py-2 px-2 text-center text-gray-300">{player.yearsLeft}</td>
                      <td className="py-2 px-2 text-center text-gray-300">{player.contractLength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Division Standings */}
        {teamData && teamData.divisionStandings.length > 0 && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Division Standings ({teamData.divisionStandings.length} teams)</h2>
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
          </div>
        )}

        {/* Upcoming Games */}
        {teamData && teamData.upcomingGames.length > 0 && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Upcoming Games ({teamData.upcomingGames.length} games)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-400">Week</th>
                    <th className="text-left py-2 px-2 text-gray-400">Opponent</th>
                    <th className="text-left py-2 px-2 text-gray-400">Result</th>
                    <th className="text-center py-2 px-2 text-gray-400">Home/Away</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.upcomingGames.slice(0, 5).map((game, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      <td className="py-2 px-2 text-white">{game.week}</td>
                      <td className="py-2 px-2 text-white">{game.opponent} ({game.opponentAbbr})</td>
                      <td className="py-2 px-2 text-white">{game.result || 'TBD'}</td>
                      <td className="py-2 px-2 text-center text-gray-300">{game.isHome ? 'Home' : 'Away'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
} 