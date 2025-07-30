'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE } from '@/lib/config'
import { getTeamByAbbreviation } from '@/lib/team-config'

type Game = {
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
}

type SeasonSummary = {
  total_games: number
  completed_games: number
  scheduled_games: number
  completion_percentage: number
  week_range: {
    start: number
    end: number
  }
}

type Pagination = {
  page: number
  limit: number
  total_games: number
  total_pages: number
}

type ScheduleData = {
  league_id: string
  season_summary: SeasonSummary
  games: Game[]
  pagination: Pagination
  filters: {
    week: number | null
    status: string
  }
}

export default function SeasonSchedulePage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    week: '',
    page: 1,
    limit: 20
  })

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        status: filters.status,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })
      
      if (filters.week) {
        params.append('week', filters.week)
      }

      const response = await fetch(`${API_BASE}/leagues/${leagueId}/season-schedule?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule: ${response.status}`)
      }

      const data = await response.json()
      setScheduleData(data)
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [leagueId, filters.status, filters.week, filters.page, filters.limit])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD'
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getTeamColors = (abbreviation: string) => {
    const teamConfig = getTeamByAbbreviation(abbreviation)
    return teamConfig?.colors?.primary || '#666666'
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
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Schedule</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button 
              onClick={fetchSchedule}
              className="px-4 py-2 bg-green-600 dark:bg-neon-green text-white rounded hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!scheduleData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-600 dark:text-gray-400">No Schedule Data Available</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Season Schedule</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                League ID: {scheduleData.league_id}
              </p>
            </div>
            <Link 
              href={`/leagues/${leagueId}`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back to League
            </Link>
          </div>

          {/* Season Summary */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Season Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-neon-green">
                  {scheduleData.season_summary.total_games}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {scheduleData.season_summary.completed_games}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {scheduleData.season_summary.scheduled_games}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {scheduleData.season_summary.completion_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 dark:bg-neon-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scheduleData.season_summary.completion_percentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Weeks {scheduleData.season_summary.week_range.start} - {scheduleData.season_summary.week_range.end}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-neon-green focus:border-transparent"
                >
                  <option value="all">All Games</option>
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Week
                </label>
                <select
                  value={filters.week}
                  onChange={(e) => setFilters(prev => ({ ...prev, week: e.target.value, page: 1 }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-neon-green focus:border-transparent"
                >
                  <option value="">All Weeks</option>
                  {Array.from({ length: scheduleData.season_summary.week_range.end }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Games per page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-neon-green focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {scheduleData.games.map((game) => (
            <GameCard 
              key={game.game_id} 
              game={game} 
              leagueId={leagueId}
              getTeamColors={getTeamColors}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          ))}
        </div>

        {/* Pagination */}
        {scheduleData.pagination.total_pages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={scheduleData.pagination.page === 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-gray-700 dark:text-gray-300">
                Page {scheduleData.pagination.page} of {scheduleData.pagination.total_pages}
              </span>
              
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(scheduleData.pagination.total_pages, prev.page + 1) }))}
                disabled={scheduleData.pagination.page === scheduleData.pagination.total_pages}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {scheduleData.games.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No games found with the current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function GameCard({ 
  game, 
  leagueId, 
  getTeamColors, 
  formatDate, 
  formatTime 
}: {
  game: Game
  leagueId: string
  getTeamColors: (abbr: string) => string
  formatDate: (date: string) => string
  formatTime: (time: string) => string
}) {
  const homeTeamColor = getTeamColors(game.home_team.abbreviation)
  const awayTeamColor = getTeamColors(game.away_team.abbreviation)

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-full">
            Week {game.week}
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            game.is_complete 
              ? 'bg-green-600 dark:bg-green-500 text-white' 
              : 'bg-yellow-600 dark:bg-yellow-500 text-white'
          }`}>
            {game.is_complete ? '✅ Complete' : '⏳ Scheduled'}
          </span>
          {game.is_game_of_the_week && (
            <span className="px-3 py-1 bg-purple-600 dark:bg-purple-500 text-white text-sm font-medium rounded-full">
              🏆 Game of the Week
            </span>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(game.game_date)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatTime(game.game_time)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {game.venue}
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Away Team */}
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: awayTeamColor }}
          >
            {game.away_team.abbreviation}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">
              {game.away_team.name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {game.away_team.user} • ({game.away_team.record})
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {game.away_team.win_pct.toFixed(1)}% • {game.away_team.pts_for.toFixed(1)} PF
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {game.score.away_score !== null ? game.score.away_score : 'TBD'}
            </div>
            {game.is_complete && game.score.winner === 'away' && (
              <div className="text-xs text-green-600 dark:text-neon-green font-medium">WIN</div>
            )}
          </div>
        </div>

        {/* VS */}
        <div className="text-center">
          <div className="text-lg font-bold text-gray-400 dark:text-gray-500">VS</div>
          {game.is_complete && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Final
            </div>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center space-x-3">
          <div className="text-left">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {game.score.home_score !== null ? game.score.home_score : 'TBD'}
            </div>
            {game.is_complete && game.score.winner === 'home' && (
              <div className="text-xs text-green-600 dark:text-neon-green font-medium">WIN</div>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white text-right">
              {game.home_team.name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
              {game.home_team.user} • ({game.home_team.record})
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
              {game.home_team.win_pct.toFixed(1)}% • {game.home_team.pts_for.toFixed(1)} PF
            </div>
          </div>
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: homeTeamColor }}
          >
            {game.home_team.abbreviation}
          </div>
        </div>
      </div>

      {/* Weather Info */}
      {game.weather && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>🌤️ {game.weather.condition}</span>
            <span>🌡️ {game.weather.temperature}°F</span>
            <span>💨 {game.weather.wind_speed} mph {game.weather.wind_direction}</span>
            <span>💧 {game.weather.humidity}% humidity</span>
            <span>☔ {game.weather.precipitation_chance}% rain</span>
          </div>
        </div>
      )}

      {/* Box Score Link */}
      {game.is_complete && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href={`/leagues/${leagueId}/schedule/box-score/${game.game_id}`}
            className="inline-flex items-center px-4 py-2 bg-green-600 dark:bg-neon-green text-white rounded-md hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
          >
            📊 View Box Score
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
} 