'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { PlayersStatsTab } from '@/components/stats-leaders/PlayersStatsTab'
import { TeamsStatsTab } from '@/components/stats-leaders/TeamsStatsTab'
import { FallbackStatsView } from '@/components/stats-leaders/FallbackStatsView'
import { StatsLeadersAPI } from '@/lib/stats-leaders-api'

export default function StatsLeadersPage() {
  const { leagueId } = useParams()
  const leagueIdString = leagueId as string
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players')
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        console.log('Checking API availability for league:', leagueIdString)
        console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE || 'https://api.couchlytics.com')
        
        // Try to fetch the summary endpoint to check if the new API is available
        const summary = await StatsLeadersAPI.getSummary(leagueIdString)
        console.log('API Summary response:', summary)
        setApiAvailable(true)
      } catch (error) {
        console.error('New stats leaders API not available, using fallback:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        setApiAvailable(false)
      } finally {
        setLoading(false)
      }
    }

    if (leagueIdString) {
      checkApiAvailability()
    }
  }, [leagueIdString])

  if (!leagueIdString) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Invalid League ID</h1>
        <p className="text-gray-600">The league ID provided is not valid.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stats Leaders</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive player and team statistics for {leagueIdString}
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-600">Checking system availability...</span>
        </div>
      </div>
    )
  }

  // If the new API is not available, show the fallback view
  if (apiAvailable === false) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stats Leaders</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive player and team statistics for {leagueIdString}
          </p>
        </div>
        <FallbackStatsView leagueId={leagueIdString} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stats Leaders</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive player and team statistics for {leagueIdString}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('players')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'players'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Players
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'teams'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Teams
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'players' ? (
          <PlayersStatsTab leagueId={leagueIdString} />
        ) : (
          <TeamsStatsTab leagueId={leagueIdString} />
        )}
      </div>
    </div>
  )
} 