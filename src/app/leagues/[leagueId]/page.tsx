'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LeagueStatLeaders } from '@/components/LeagueStatLeaders'
import { fetchFromApi } from '@/lib/api'
import { getTeamByName, getTeamByPartialName } from '@/lib/team-config'
import TeamLogo from '@/components/TeamLogo'

// Helper function to get team configuration
const getTeamConfig = (teamName: string) => {
  return getTeamByName(teamName) || getTeamByPartialName(teamName)
}

// Helper function to organize teams by division
const organizeTeamsByDivision = (teams: LeagueData['teams']) => {
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
    homeTeam: string
    awayTeam: string
  }[]
}

export default function LeagueDetailPage() {
  const { leagueId } = useParams()
  const [league, setLeague] = useState<LeagueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId) return

    fetchFromApi(`/leagues/${leagueId}`)
      .then(data => {
        setLeague(data as LeagueData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch league data:', err)
        setError('League not found or access denied.')
        setLoading(false)
      })
  }, [leagueId])

  if (loading) return <main className="p-6 text-white">Loading league details...</main>
  if (error || !league) return <main className="p-6 text-red-400">{error || 'No data found.'}</main>

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
        <Link
          href={`/leagues/${leagueId}/schedule`}
          className="inline-block text-sm text-green-600 dark:text-neon-green hover:underline"
        >
          View Schedule →
        </Link>
      </div>

      <section className="mt-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Teams by Division</h2>
                 {league.teams?.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
             {Object.entries(organizeTeamsByDivision(league.teams.filter(team => team.name && team.name !== 'Unknown')))
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
        <h2 className="text-2xl font-semibold mb-2">Recent Games</h2>
        {league.games?.length > 0 ? (
          <ul className="space-y-2">
            {league.games.map((game, i) => (
              <li key={`${game.homeTeam}-${game.awayTeam}-${i}`} className="bg-gray-800 p-3 rounded">
                {game.homeTeam} vs {game.awayTeam}
              </li>
            ))}
          </ul>
                 ) : (
           <p className="text-gray-600 dark:text-gray-500 text-sm italic">No games recorded yet.</p>
         )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">League Stat Leaders</h2>
        <LeagueStatLeaders leagueId={league.league.leagueId} />
      </section>
    </main>
  )
}
