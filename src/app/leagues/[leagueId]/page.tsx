'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchFromApi } from '@/lib/api'
import { getTeamByName, getTeamByPartialName } from '@/lib/team-config'
import TeamLogo from '@/components/TeamLogo'
import { API_BASE } from '@/lib/config'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/user'
import { CommentsList } from '@/components/comments'

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
    // Updated to match actual backend structure
    homeTeam: string
    awayTeam: string
    homeScore: number | null
    awayScore: number | null
    winner: string | null
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

  type Announcement = {
    id: number
    title: string
    content: string
    created_by?: string
    createdBy?: string
    created_at?: string
    createdAt?: string
    is_pinned: boolean
    cover_photo?: string
    coverPhoto?: string
  }

export default function LeagueDetailPage() {
  const { leagueId } = useParams()
  const router = useRouter()
  const { user, hasRole } = useAuth()
  const [league, setLeague] = useState<LeagueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)

  // Helper function to render content with images
  const renderContentWithImages = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Check if line contains an image markdown
      const imageMatch = line.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch) {
        return (
          <div key={index} className="my-4">
            <img 
              src={imageMatch[1]} 
              alt="Content image" 
              className="max-w-full h-auto rounded-lg border border-gray-600"
            />
          </div>
        );
      }
      return <div key={index}>{line}</div>;
    });
  };

  // Check if user has permission to create announcements
  const canCreateAnnouncements = user && (
    hasRole(UserRole.ADMIN) || 
    hasRole(UserRole.COMMISSIONER) || 
    hasRole(UserRole.SUPER_ADMIN)
  )

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
    
    // Fetch league data and announcements in parallel
    Promise.all([
      fetchFromApi(`/leagues/${leagueId}`),
      fetch(`${API_BASE}/leagues/${leagueId}/announcements`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.ok ? res.json() : { announcements: [] }).catch(() => ({ announcements: [] }))
    ])
      .then(([leagueData, announcementsData]) => {
        console.log('LeagueDetailPage - Successfully fetched league data:', leagueData)
        console.log('LeagueDetailPage - Successfully fetched announcements:', announcementsData)
        console.log('LeagueDetailPage - Data type:', typeof leagueData)
        console.log('LeagueDetailPage - Is data an object?', typeof leagueData === 'object')
        console.log('LeagueDetailPage - Data keys:', Object.keys(leagueData))
        console.log('LeagueDetailPage - league property:', leagueData.league)
        console.log('LeagueDetailPage - teams property:', leagueData.teams)
        console.log('LeagueDetailPage - games property:', leagueData.games)
        console.log('LeagueDetailPage - players property:', leagueData.players)
        console.log('LeagueDetailPage - teams type:', typeof leagueData.teams)
        console.log('LeagueDetailPage - games type:', typeof leagueData.games)
        console.log('LeagueDetailPage - teams is array?', Array.isArray(leagueData.teams))
        console.log('LeagueDetailPage - games is array?', Array.isArray(leagueData.games))
        console.log('LeagueDetailPage - Sample team data:', leagueData.teams?.[0])
        console.log('LeagueDetailPage - Sample game data:', leagueData.games?.[0])
        console.log('LeagueDetailPage - Sample player data:', leagueData.players?.[0])
        console.log('LeagueDetailPage - Teams array length:', leagueData.teams?.length)
        console.log('LeagueDetailPage - Games array length:', leagueData.games?.length)
        console.log('LeagueDetailPage - Players array length:', leagueData.players?.length)
        setLeague(leagueData as LeagueData)
        setAnnouncements(announcementsData.announcements || [])
        setLoading(false)
        setLoadingAnnouncements(false)
      })
      .catch(err => {
        console.error('Failed to fetch league data:', err)
        setError('League not found or access denied.')
        setLoading(false)
        setLoadingAnnouncements(false)
      })
  }, [leagueId, router])

  if (loading) return <main className="p-6 text-white">Loading league details...</main>
  if (error || !league) return <main className="p-6 text-red-400">{error || 'No data found.'}</main>

  console.log('LeagueDetailPage - Rendering with league data:', league)
  console.log('LeagueDetailPage - league.teams:', league.teams)
  console.log('LeagueDetailPage - league.games:', league.games)
  console.log('LeagueDetailPage - league.league:', league.league)
  console.log('LeagueDetailPage - First team name:', league.teams?.[0]?.name)
  console.log('LeagueDetailPage - First game home team:', league.games?.[0]?.homeTeam)
  console.log('LeagueDetailPage - First game away team:', league.games?.[0]?.awayTeam)
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
        {canCreateAnnouncements && (
          <Link
            href={`/leagues/${leagueId}/commissioner/announcements/create`}
            className="inline-block text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Create Announcement →
          </Link>
        )}
      </div>

      {/* League Announcements Section */}
      <section className="mt-8 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">League Announcements</h2>
          {canCreateAnnouncements && (
            <Link
              href={`/leagues/${leagueId}/commissioner/announcements/create`}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + New Announcement
            </Link>
          )}
        </div>
        
        {loadingAnnouncements ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading announcements...</p>
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-4">
            {/* Pinned announcements first */}
            {announcements
              .filter(announcement => announcement.is_pinned)
              .map(announcement => (
                <div key={announcement.id} className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                  {/* Cover Photo */}
                  {(announcement.coverPhoto || announcement.cover_photo) && (
                    <div className="mb-4">
                      <img 
                        src={announcement.coverPhoto || announcement.cover_photo} 
                        alt="Cover" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm font-medium">📌 PINNED</span>
                      <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(announcement.createdAt || announcement.created_at || new Date()).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                  <div className="text-gray-300 mb-2 whitespace-pre-wrap">
                    {renderContentWithImages(announcement.content)}
                  </div>
                  <div className="text-xs text-gray-400 mb-4">
                    Posted by {announcement.createdBy || announcement.created_by}
                  </div>
                  
                  {/* Comments Section for Pinned Announcements */}
                  <CommentsList
                    announcementId={announcement.id}
                    leagueId={leagueId as string}
                    className="mt-4"
                  />
                </div>
              ))}
            
            {/* Regular announcements */}
            {announcements
              .filter(announcement => !announcement.is_pinned)
              .map(announcement => (
                <div key={announcement.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  {/* Cover Photo */}
                  {(announcement.coverPhoto || announcement.cover_photo) && (
                    <div className="mb-4">
                      <img 
                        src={announcement.coverPhoto || announcement.cover_photo} 
                        alt="Cover" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(announcement.createdAt || announcement.created_at || new Date()).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                  <div className="text-gray-300 mb-2 whitespace-pre-wrap">
                    {renderContentWithImages(announcement.content)}
                  </div>
                  <div className="text-xs text-gray-400 mb-4">
                    Posted by {announcement.createdBy || announcement.created_by}
                  </div>
                  
                  {/* Comments Section for Regular Announcements */}
                  <CommentsList
                    announcementId={announcement.id}
                    leagueId={leagueId as string}
                    className="mt-4"
                  />
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-gray-400 mb-2">📢</div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Announcements Yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              League commissioners can post announcements to keep members updated
            </p>
            {canCreateAnnouncements && (
              <Link
                href={`/leagues/${leagueId}/commissioner/announcements/create`}
                className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create First Announcement
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="mt-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Teams by Division</h2>
                 {league.teams && league.teams.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
             {(() => {
               const organizedTeams = organizeTeamsByDivision(league.teams?.filter(team => team.name && team.name !== 'Unknown') || [])
               console.log('LeagueDetailPage - organizedTeams:', organizedTeams)
               console.log('LeagueDetailPage - organizedTeams type:', typeof organizedTeams)
               console.log('LeagueDetailPage - organizedTeams keys:', Object.keys(organizedTeams))
               
               const entries = Object.entries(organizedTeams)
               console.log('LeagueDetailPage - Object.entries result:', entries)
               console.log('LeagueDetailPage - entries type:', typeof entries)
               console.log('LeagueDetailPage - entries is array?', Array.isArray(entries))
               
               return entries.map(([division, teams]) => (
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
               ))
             })()}
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
              console.log('LeagueDetailPage - Starting games processing')
              console.log('LeagueDetailPage - league.games:', league.games)
              console.log('LeagueDetailPage - league.games length:', league.games.length)
              
              // Filter out games with undefined week and add debugging
              const validGames = league.games.filter(game => {
                console.log('LeagueDetailPage - Game week:', game.week, 'Type:', typeof game.week)
                return game.week !== undefined && game.week !== null && !isNaN(game.week)
              })
              
              console.log('LeagueDetailPage - Valid games count:', validGames.length)
              console.log('LeagueDetailPage - Invalid games count:', league.games.length - validGames.length)
              
              if (validGames.length === 0) {
                return <p className="text-gray-600 dark:text-gray-500 text-sm italic">No games with valid week data available.</p>
              }
              
              const gamesByWeek = validGames.reduce((acc, game) => {
                const week = game.week
                if (!acc[week]) acc[week] = []
                acc[week].push(game)
                return acc
              }, {} as Record<number, typeof league.games>)
              
              console.log('LeagueDetailPage - gamesByWeek:', gamesByWeek)
              console.log('LeagueDetailPage - gamesByWeek keys:', Object.keys(gamesByWeek))
              
              // Sort weeks in descending order (most recent first)
              const sortedWeeks = Object.keys(gamesByWeek)
                .map(Number)
                .sort((a, b) => b - a)
                .slice(0, 3) // Show only the 3 most recent weeks
              
              console.log('LeagueDetailPage - sortedWeeks:', sortedWeeks)
              console.log('LeagueDetailPage - sortedWeeks type:', typeof sortedWeeks)
              console.log('LeagueDetailPage - sortedWeeks is array?', Array.isArray(sortedWeeks))
              
              return sortedWeeks.map(week => {
                console.log('LeagueDetailPage - Processing week:', week)
                console.log('LeagueDetailPage - games for week:', gamesByWeek[week])
                console.log('LeagueDetailPage - games for week type:', typeof gamesByWeek[week])
                console.log('LeagueDetailPage - games for week is array?', Array.isArray(gamesByWeek[week]))
                
                return (
                  <div key={week} className="bg-gray-900 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-neon-green mb-4 text-center">
                      Week {week}
                    </h3>
                    <div className="grid gap-4">
                      {gamesByWeek[week].map((game, i) => {
                        console.log('LeagueDetailPage - Processing game:', game)
                        console.log('LeagueDetailPage - game.homeTeam:', game.homeTeam)
                        console.log('LeagueDetailPage - game.awayTeam:', game.awayTeam)
                        
                        const homeTeamConfig = getTeamConfig(game.homeTeam)
                        const awayTeamConfig = getTeamConfig(game.awayTeam)
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
                                        teamName={game.homeTeam}
                                        size="lg"
                                        variant="helmet"
                                        showName={false}
                                      />
                                    </div>
                                  </div>
                                  <div className="font-bold text-lg text-white mb-1">
                                    {game.homeTeam}
                                  </div>
                                  <div className="text-sm text-gray-300 mb-1">
                                    {/* User info not available in current structure */}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {/* Record info not available in current structure */}
                                  </div>
                                </div>
                                
                                {/* Score */}
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-white mb-2">
                                    {game.homeScore !== null && game.awayScore !== null ? (
                                      <>
                                        {game.homeScore} - {game.awayScore}
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
                                  {game.is_complete && game.winner && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Winner: {game.winner === 'home' ? game.homeTeam : game.awayTeam}
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
                                        teamName={game.awayTeam}
                                        size="lg"
                                        variant="helmet"
                                        showName={false}
                                      />
                                    </div>
                                  </div>
                                  <div className="font-bold text-lg text-white mb-1">
                                    {game.awayTeam}
                                  </div>
                                  <div className="text-sm text-gray-300 mb-1">
                                    {/* User info not available in current structure */}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {/* Record info not available in current structure */}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
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
