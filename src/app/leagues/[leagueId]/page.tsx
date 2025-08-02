'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchFromApi } from '@/lib/api'
import { getTeamByName, getTeamByPartialName } from '@/lib/team-config'
import TeamLogo from '@/components/TeamLogo'

// Helper function to get team configuration
const getTeamConfig = (teamName: string) => {
  return getTeamByName(teamName) || getTeamByPartialName(teamName)
}

// Helper function to organize teams by division
const organizeTeamsByDivision = (teams: LeagueData['teams']) => {
  // Add null check to prevent TypeError
  if (!teams || !Array.isArray(teams)) {
    return {}
  }

  const divisionMap = {
    'AFC North': ['Bengals', 'Browns', 'Ravens', 'Steelers'],
    'AFC South': ['Colts', 'Jaguars', 'Texans', 'Titans'],
    'AFC East': ['Bills', 'Dolphins', 'Jets', 'Patriots'],
    'AFC West': ['Broncos', 'Chargers', 'Chiefs', 'Raiders'],
    'NFC North': ['Bears', 'Lions', 'Packers', 'Vikings'],
    'NFC South': ['Buccaneers', 'Falcons', 'Panthers', 'Saints'],
    'NFC East': ['Commanders', 'Cowboys', 'Eagles', 'Giants'],
    'NFC West': ['Cardinals', '49ers', 'Rams', 'Seahawks']
  }
  
  const divisions: { [key: string]: LeagueData['teams'] } = {}
  
  // Initialize all divisions
  Object.keys(divisionMap).forEach(division => {
    divisions[division] = []
  })
  
  // Assign teams to divisions based on their names
  teams.forEach(team => {
    for (const [division, teamNames] of Object.entries(divisionMap)) {
      if (teamNames.includes(team.name)) {
        divisions[division].push(team)
        break
      }
    }
  })
  
  return divisions
}

type LeagueData = {
  league: {
    leagueId: string
    name: string
    seasonYear: number
  }
  teams: {
    id: number
    name: string
    user: string
    record?: string
    overall?: number
    division?: string
  }[]
  players: {
    name: string
  }[]
  games: {
    game_id: string
    week: number
    game_date: string
    game_time: string
    venue: string
    is_complete: boolean
    is_playoff: boolean
    game_type: string
    game_status: string
    is_game_of_the_week: boolean
    home_team: {
      id: number
      name: string
      abbreviation: string
      user: string
      record: string
      win_pct: number
      pts_for: number
      pts_against: number
    }
    away_team: {
      id: number
      name: string
      abbreviation: string
      user: string
      record: string
      win_pct: number
      pts_for: number
      pts_against: number
    }
    score: {
      home_score: number | null
      away_score: number | null
      winner: string | null
    }
    weather?: {
      condition: string
      temperature: number
      wind_speed: number
      wind_direction: string
      humidity: number
      precipitation_chance: number
    }
  }[]
}

export default function LeagueDetailPage() {
  const { leagueId } = useParams()
  const router = useRouter()
  const [league, setLeague] = useState<LeagueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debug logging
  console.log('LeagueDetailPage - leagueId from params:', leagueId)
  console.log('LeagueDetailPage - leagueId type:', typeof leagueId)

  useEffect(() => {
    console.log('LeagueDetailPage useEffect - leagueId:', leagueId)
    
    if (!leagueId || typeof leagueId !== 'string' || leagueId === 'undefined') {
      console.log('LeagueDetailPage - Invalid leagueId, redirecting to leagues page')
      router.push('/leagues')
      return
    }

    console.log('LeagueDetailPage - Fetching league data for ID:', leagueId)
    fetchFromApi(`/leagues/${leagueId}`)
      .then(data => {
        console.log('LeagueDetailPage - Successfully fetched league data:', data)
        console.log('LeagueDetailPage - Data type:', typeof data)
        console.log('LeagueDetailPage - Is data an object?', typeof data === 'object')
        console.log('LeagueDetailPage - Data keys:', Object.keys(data))
        console.log('LeagueDetailPage - league property:', data.league)
        console.log('LeagueDetailPage - teams property:', data.teams)
        console.log('LeagueDetailPage - games property:', data.games)
        console.log('LeagueDetailPage - players property:', data.players)
        console.log('LeagueDetailPage - teams type:', typeof data.teams)
        console.log('LeagueDetailPage - games type:', typeof data.games)
        console.log('LeagueDetailPage - teams is array?', Array.isArray(data.teams))
        console.log('LeagueDetailPage - games is array?', Array.isArray(data.games))
        console.log('LeagueDetailPage - Sample team data:', data.teams?.[0])
        console.log('LeagueDetailPage - Sample game data:', data.games?.[0])
        console.log('LeagueDetailPage - Sample player data:', data.players?.[0])
        console.log('LeagueDetailPage - Teams array length:', data.teams?.length)
        console.log('LeagueDetailPage - Games array length:', data.games?.length)
        console.log('LeagueDetailPage - Players array length:', data.players?.length)
        setLeague(data as LeagueData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch league data:', err)
        setError('League not found or access denied.')
        setLoading(false)
      })
  }, [leagueId, router])

  if (loading) return <main className="p-6 text-white">Loading league details...</main>
  if (error || !league) return <main className="p-6 text-red-400">{error || 'No data found.'}</main>

  console.log('LeagueDetailPage - Rendering with league data:', league)
  console.log('LeagueDetailPage - league.teams:', league.teams)
  console.log('LeagueDetailPage - league.games:', league.games)
  console.log('LeagueDetailPage - league.league:', league.league)
  console.log('LeagueDetailPage - First team name:', league.teams?.[0]?.name)
  console.log('LeagueDetailPage - First game home team:', league.games?.[0]?.home_team?.name)
  console.log('LeagueDetailPage - First game away team:', league.games?.[0]?.away_team?.name)
  console.log('LeagueDetailPage - League ID from data:', league.league?.leagueId)

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      <h1 className="text-3xl font-bold mb-2">{league.league.name}</h1>
      <p className="text-gray-400 mb-1">Season Year: {league.league.seasonYear}</p>

      <div className="flex gap-4 mt-2">
        <Link
          href={`/leagues/${leagueId}/analytics`}
          className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View Analytics →
        </Link>
      </div>

      <section className="mt-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Teams by Division</h2>
                 {league.teams && league.teams.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
             {Object.entries(organizeTeamsByDivision(league.teams?.filter(team => team.name && team.name !== 'Unknown') || []))
               .map(([division, teams]) => (
                 <div key={division} className="space-y-3">
                   {/* Division Header */}
                   <div className="text-center">
                     <h3 className="text-sm font-bold text-neon-green border-b border-neon-green pb-1">
                       {division}
                     </h3>
                   </div>
                   
                   {/* Teams Stacked Vertically */}
                   <div className="space-y-2">
                     {teams.map((team) => {
                       const teamConfig = getTeamConfig(team.name)
                       const teamColor = teamConfig?.colors?.primary || '#6B7280'
                       
                       return (
                         <div key={team.id} className="relative group">
                           <Link 
                             href={`/leagues/${leagueId}/teams/${team.id}`}
                             className="block"
                           >
                             <div 
                               className="aspect-square rounded-lg p-2 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-105"
                               style={{ backgroundColor: teamColor }}
                             >
                               {/* Team Helmet */}
                               <div className="mb-1">
                                                                 <TeamLogo 
                                  teamName={team.name}
                                  size="3xl"
                                  variant="helmet"
                                  showName={false}
                                />
                               </div>
                               
                               {/* Team Name */}
                                                               <div className="text-white font-bold text-sm mb-0.5">
                                  {team.name}
                                </div>
                               
                               {/* User */}
                               <div className="text-white/90 text-xs mb-0.5">
                                 {team.user || 'No Owner'}
                               </div>
                               
                               {/* Record and Overall */}
                               <div className="text-white/80 text-xs space-y-0">
                                 {team.record && (
                                   <div>Record: {team.record}</div>
                                 )}
                                 {team.overall && (
                                   <div>Overall: {team.overall}</div>
                                 )}
                               </div>
                             </div>
                           </Link>
                         </div>
                       )
                     })}
                   </div>
                 </div>
               ))}
           </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-500 text-sm italic">No teams available.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Week Results</h2>
        {league.games && league.games.length > 0 ? (
          <div className="space-y-6">
            {/* Group games by week */}
            {(() => {
              const gamesByWeek = league.games.reduce((acc, game) => {
                const week = game.week
                if (!acc[week]) acc[week] = []
                acc[week].push(game)
                return acc
              }, {} as Record<number, typeof league.games>)
              
              // Sort weeks in descending order (most recent first)
              const sortedWeeks = Object.keys(gamesByWeek)
                .map(Number)
                .sort((a, b) => b - a)
                .slice(0, 3) // Show only the 3 most recent weeks
              
              return sortedWeeks.map(week => (
                <div key={week} className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-neon-green mb-4 text-center">
                    Week {week}
                  </h3>
                  <div className="grid gap-4">
                    {gamesByWeek[week].map((game, i) => {
                      const homeTeamConfig = getTeamConfig(game.home_team.name)
                      const awayTeamConfig = getTeamConfig(game.away_team.name)
                      const homeTeamColor = homeTeamConfig?.colors?.primary || '#6B7280'
                      const awayTeamColor = awayTeamConfig?.colors?.primary || '#6B7280'
                      
                      return (
                        <div 
                          key={`${game.game_id}-${i}`} 
                          className="bg-gray-800 rounded-lg p-4 relative overflow-hidden"
                        >
                          {/* Background gradient with team colors */}
                          <div className="absolute inset-0 opacity-10">
                            <div className="w-full h-full" style={{
                              background: `linear-gradient(90deg, ${homeTeamColor} 0%, ${awayTeamColor} 100%)`
                            }}></div>
                          </div>
                          
                          <div className="relative z-10">
                            <div className="grid grid-cols-3 gap-4 items-center">
                              {/* Home Team */}
                              <div className="text-center">
                                <div className="flex justify-center mb-2">
                                  <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg">
                                    <TeamLogo 
                                      teamName={game.home_team.name}
                                      size="lg"
                                      variant="helmet"
                                      showName={false}
                                    />
                                  </div>
                                </div>
                                <div className="font-bold text-lg text-white mb-1">
                                  {game.home_team.name}
                                </div>
                                <div className="text-sm text-gray-300 mb-1">
                                  {game.home_team.user}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {game.home_team.record} • {game.home_team.win_pct.toFixed(1)}%
                                </div>
                              </div>
                              
                              {/* Score */}
                              <div className="text-center">
                                <div className="text-3xl font-bold text-white mb-2">
                                  {game.score.home_score !== null && game.score.away_score !== null ? (
                                    <>
                                      {game.score.home_score} - {game.score.away_score}
                                    </>
                                  ) : (
                                    'TBD'
                                  )}
                                </div>
                                <div className="text-sm text-gray-300">
                                  {game.is_complete ? (
                                    <span className="text-green-400 font-semibold">Final</span>
                                  ) : (
                                    <span className="text-yellow-400">Scheduled</span>
                                  )}
                                </div>
                                {game.is_complete && game.score.winner && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Winner: {game.score.winner === 'home' ? game.home_team.name : game.away_team.name}
                                  </div>
                                )}
                                {game.venue && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {game.venue}
                                  </div>
                                )}
                              </div>
                              
                              {/* Away Team */}
                              <div className="text-center">
                                <div className="flex justify-center mb-2">
                                  <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg">
                                    <TeamLogo 
                                      teamName={game.away_team.name}
                                      size="lg"
                                      variant="helmet"
                                      showName={false}
                                    />
                                  </div>
                                </div>
                                <div className="font-bold text-lg text-white mb-1">
                                  {game.away_team.name}
                                </div>
                                <div className="text-sm text-gray-300 mb-1">
                                  {game.away_team.user}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {game.away_team.record} • {game.away_team.win_pct.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-500 text-sm italic">No games recorded yet.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">League Stat Leaders</h2>
        {/* Temporarily disabled to debug TypeError */}
        {/* {league.league?.leagueId && <LeagueStatLeaders leagueId={league.league.leagueId} />} */}
        <p className="text-gray-600 dark:text-gray-500 text-sm italic">Stat leaders temporarily disabled for debugging.</p>
      </section>
    </main>
  )
}
