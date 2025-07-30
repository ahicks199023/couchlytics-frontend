'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE } from '@/lib/config'
import { getTeamConfig } from '@/lib/team-config'

type PlayerStats = {
  name: string
  position: string
  pass_yds?: number
  pass_tds?: number
  pass_ints?: number
  rush_yds?: number
  rush_tds?: number
  rec_yds?: number
  rec_tds?: number
  tackles?: number
  sacks?: number
  interceptions?: number
}

type TeamStats = {
  offensive: {
    total_yards: number
    passing_yards: number
    rushing_yards: number
    points: number
    passing_tds: number
    rushing_tds: number
  }
  defensive: {
    total_yards_allowed: number
    passing_yards_allowed: number
    rushing_yards_allowed: number
    points_allowed: number
    sacks: number
    interceptions: number
  }
  players?: PlayerStats[]
}

type ProjectedTeamStats = {
  offensive: {
    total_yards: number
    passing_yards: number
    rushing_yards: number
    points_per_game: number
    passing_tds: number
    rushing_tds: number
  }
  defensive: {
    total_yards_allowed: number
    passing_yards_allowed: number
    rushing_yards_allowed: number
    points_allowed_per_game: number
    sacks: number
    interceptions: number
  }
}

type BoxScoreData = {
  league_id: string
  game_id: string
  game_info: {
    week: number
    home_team: string
    away_team: string
    home_score: number | null
    away_score: number | null
    is_complete: boolean
    game_date: string
    game_time: string
    venue: string
  }
  box_score: {
    type: 'actual' | 'projected'
    home_team_stats: TeamStats | ProjectedTeamStats
    away_team_stats: TeamStats | ProjectedTeamStats
    note?: string
  }
}

export default function BoxScorePage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const gameId = params.gameId as string
  
  const [boxScoreData, setBoxScoreData] = useState<BoxScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBoxScore()
  }, [leagueId, gameId])

  const fetchBoxScore = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/season-schedule/box-score/${gameId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch box score: ${response.status}`)
      }

      const data = await response.json()
      setBoxScoreData(data)
    } catch (err) {
      console.error('Error fetching box score:', err)
      setError(err instanceof Error ? err.message : 'Failed to load box score')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getTeamColors = (teamName: string) => {
    // Extract abbreviation from team name (e.g., "Kansas City Chiefs" -> "KC")
    const words = teamName.split(' ')
    const lastWord = words[words.length - 1]
    let abbreviation = ''
    
    if (lastWord === 'Chiefs') abbreviation = 'KC'
    else if (lastWord === 'Ravens') abbreviation = 'BAL'
    else if (lastWord === 'Bills') abbreviation = 'BUF'
    else if (lastWord === 'Dolphins') abbreviation = 'MIA'
    else if (lastWord === 'Jets') abbreviation = 'NYJ'
    else if (lastWord === 'Patriots') abbreviation = 'NE'
    else if (lastWord === 'Bengals') abbreviation = 'CIN'
    else if (lastWord === 'Browns') abbreviation = 'CLE'
    else if (lastWord === 'Steelers') abbreviation = 'PIT'
    else if (lastWord === 'Texans') abbreviation = 'HOU'
    else if (lastWord === 'Colts') abbreviation = 'IND'
    else if (lastWord === 'Jaguars') abbreviation = 'JAX'
    else if (lastWord === 'Titans') abbreviation = 'TEN'
    else if (lastWord === 'Broncos') abbreviation = 'DEN'
    else if (lastWord === 'Chargers') abbreviation = 'LAC'
    else if (lastWord === 'Raiders') abbreviation = 'LV'
    else if (lastWord === 'Cowboys') abbreviation = 'DAL'
    else if (lastWord === 'Eagles') abbreviation = 'PHI'
    else if (lastWord === 'Giants') abbreviation = 'NYG'
    else if (lastWord === 'Commanders') abbreviation = 'WAS'
    else if (lastWord === 'Bears') abbreviation = 'CHI'
    else if (lastWord === 'Lions') abbreviation = 'DET'
    else if (lastWord === 'Packers') abbreviation = 'GB'
    else if (lastWord === 'Vikings') abbreviation = 'MIN'
    else if (lastWord === 'Falcons') abbreviation = 'ATL'
    else if (lastWord === 'Panthers') abbreviation = 'CAR'
    else if (lastWord === 'Saints') abbreviation = 'NO'
    else if (lastWord === 'Buccaneers') abbreviation = 'TB'
    else if (lastWord === 'Cardinals') abbreviation = 'ARI'
    else if (lastWord === 'Rams') abbreviation = 'LAR'
    else if (lastWord === '49ers') abbreviation = 'SF'
    else if (lastWord === 'Seahawks') abbreviation = 'SEA'
    
    const teamConfig = getTeamConfig(abbreviation)
    return teamConfig?.primaryColor || '#666666'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-neon-green"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Box Score</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button 
              onClick={fetchBoxScore}
              className="px-4 py-2 bg-green-600 dark:bg-neon-green text-white rounded hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!boxScoreData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-600 dark:text-gray-400">No Box Score Data Available</h1>
          </div>
        </div>
      </div>
    )
  }

  const isProjected = boxScoreData.box_score.type === 'projected'
  const homeTeamColor = getTeamColors(boxScoreData.game_info.home_team)
  const awayTeamColor = getTeamColors(boxScoreData.game_info.away_team)

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Box Score</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Week {boxScoreData.game_info.week} • {formatDate(boxScoreData.game_info.game_date)}
              </p>
            </div>
            <Link 
              href={`/leagues/${leagueId}/schedule`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back to Schedule
            </Link>
          </div>

          {/* Game Info */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Away Team */}
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2"
                  style={{ backgroundColor: awayTeamColor }}
                >
                  {boxScoreData.game_info.away_team.split(' ').map(word => word[0]).join('')}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {boxScoreData.game_info.away_team}
                </h2>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {boxScoreData.game_info.away_score !== null ? boxScoreData.game_info.away_score : 'TBD'}
                </div>
              </div>

              {/* VS */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-2">VS</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(boxScoreData.game_info.game_time)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {boxScoreData.game_info.venue}
                </div>
                <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isProjected 
                    ? 'bg-yellow-600 dark:bg-yellow-500 text-white' 
                    : 'bg-green-600 dark:bg-green-500 text-white'
                }`}>
                  {isProjected ? '📊 Projected Stats' : '✅ Final Score'}
                </div>
              </div>

              {/* Home Team */}
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2"
                  style={{ backgroundColor: homeTeamColor }}
                >
                  {boxScoreData.game_info.home_team.split(' ').map(word => word[0]).join('')}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {boxScoreData.game_info.home_team}
                </h2>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {boxScoreData.game_info.home_score !== null ? boxScoreData.game_info.home_score : 'TBD'}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Away Team Stats */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {boxScoreData.game_info.away_team} Stats
              </h3>
              
              {/* Offensive Stats */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Offensive</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Yards</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.away_team_stats as ProjectedTeamStats).offensive.total_yards
                        : (boxScoreData.box_score.away_team_stats as TeamStats).offensive.total_yards
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Passing Yards</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.away_team_stats as ProjectedTeamStats).offensive.passing_yards
                        : (boxScoreData.box_score.away_team_stats as TeamStats).offensive.passing_yards
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rushing Yards</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.away_team_stats as ProjectedTeamStats).offensive.rushing_yards
                        : (boxScoreData.box_score.away_team_stats as TeamStats).offensive.rushing_yards
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {isProjected ? 'Points/Game' : 'Points'}
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.away_team_stats as ProjectedTeamStats).offensive.points_per_game.toFixed(1)
                        : (boxScoreData.box_score.away_team_stats as TeamStats).offensive.points
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Defensive Stats */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Defensive</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Yards Allowed</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.away_team_stats as ProjectedTeamStats).defensive.total_yards_allowed
                        : (boxScoreData.box_score.away_team_stats as TeamStats).defensive.total_yards_allowed
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {isProjected ? 'Points/Game Allowed' : 'Points Allowed'}
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.away_team_stats as ProjectedTeamStats).defensive.points_allowed_per_game.toFixed(1)
                        : (boxScoreData.box_score.away_team_stats as TeamStats).defensive.points_allowed
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sacks</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.away_team_stats as ProjectedTeamStats).defensive.sacks
                        : (boxScoreData.box_score.away_team_stats as TeamStats).defensive.sacks
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Interceptions</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.away_team_stats as ProjectedTeamStats).defensive.interceptions
                        : (boxScoreData.box_score.away_team_stats as TeamStats).defensive.interceptions
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Stats (if available) */}
              {!isProjected && (boxScoreData.box_score.away_team_stats as TeamStats).players && (
                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Key Players</h4>
                  <div className="space-y-2">
                    {(boxScoreData.box_score.away_team_stats as TeamStats).players?.slice(0, 3).map((player, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded">
                        <div className="font-medium text-gray-900 dark:text-white">{player.name} ({player.position})</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {player.pass_yds && `Pass: ${player.pass_yds} yds, ${player.pass_tds} TD, ${player.pass_ints} INT`}
                          {player.rush_yds && `Rush: ${player.rush_yds} yds, ${player.rush_tds} TD`}
                          {player.rec_yds && `Rec: ${player.rec_yds} yds, ${player.rec_tds} TD`}
                          {player.tackles && `Tackles: ${player.tackles}, Sacks: ${player.sacks}, INT: ${player.interceptions}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Home Team Stats */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {boxScoreData.game_info.home_team} Stats
              </h3>
              
              {/* Offensive Stats */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Offensive</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Yards</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.home_team_stats as ProjectedTeamStats).offensive.total_yards
                        : (boxScoreData.box_score.home_team_stats as TeamStats).offensive.total_yards
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Passing Yards</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.home_team_stats as ProjectedTeamStats).offensive.passing_yards
                        : (boxScoreData.box_score.home_team_stats as TeamStats).offensive.passing_yards
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rushing Yards</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.home_team_stats as ProjectedTeamStats).offensive.rushing_yards
                        : (boxScoreData.box_score.home_team_stats as TeamStats).offensive.rushing_yards
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {isProjected ? 'Points/Game' : 'Points'}
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.home_team_stats as ProjectedTeamStats).offensive.points_per_game.toFixed(1)
                        : (boxScoreData.box_score.home_team_stats as TeamStats).offensive.points
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Defensive Stats */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Defensive</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Yards Allowed</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.home_team_stats as ProjectedTeamStats).defensive.total_yards_allowed
                        : (boxScoreData.box_score.home_team_stats as TeamStats).defensive.total_yards_allowed
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {isProjected ? 'Points/Game Allowed' : 'Points Allowed'}
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.home_team_stats as ProjectedTeamStats).defensive.points_allowed_per_game.toFixed(1)
                        : (boxScoreData.box_score.home_team_stats as TeamStats).defensive.points_allowed
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sacks</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.home_team_stats as ProjectedTeamStats).defensive.sacks
                        : (boxScoreData.box_score.home_team_stats as TeamStats).defensive.sacks
                      }
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Interceptions</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {isProjected 
                        ? (boxScoreData.box_score.home_team_stats as ProjectedTeamStats).defensive.interceptions
                        : (boxScoreData.box_score.home_team_stats as TeamStats).defensive.interceptions
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Stats (if available) */}
              {!isProjected && (boxScoreData.box_score.home_team_stats as TeamStats).players && (
                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Key Players</h4>
                  <div className="space-y-2">
                    {(boxScoreData.box_score.home_team_stats as TeamStats).players?.slice(0, 3).map((player, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded">
                        <div className="font-medium text-gray-900 dark:text-white">{player.name} ({player.position})</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {player.pass_yds && `Pass: ${player.pass_yds} yds, ${player.pass_tds} TD, ${player.pass_ints} INT`}
                          {player.rush_yds && `Rush: ${player.rush_yds} yds, ${player.rush_tds} TD`}
                          {player.rec_yds && `Rec: ${player.rec_yds} yds, ${player.rec_tds} TD`}
                          {player.tackles && `Tackles: ${player.tackles}, Sacks: ${player.sacks}, INT: ${player.interceptions}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Projected Stats Note */}
          {isProjected && boxScoreData.box_score.note && (
            <div className="mt-6 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-600 dark:text-yellow-400 mr-2">📊</div>
                <p className="text-yellow-800 dark:text-yellow-200">{boxScoreData.box_score.note}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 