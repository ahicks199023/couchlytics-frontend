'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'
import { OffensiveTeamsSection } from './OffensiveTeamsSection'
import { DefensiveTeamsSection } from './DefensiveTeamsSection'

interface TeamsStatsTabProps {
  leagueId: string
}

export function TeamsStatsTab({ leagueId }: TeamsStatsTabProps) {
  const [activeCategory, setActiveCategory] = useState<'offensive' | 'defensive'>('offensive')

  return (
    <div className="space-y-6">
      {/* Category Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveCategory('offensive')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeCategory === 'offensive'
              ? 'bg-neon-green text-black shadow-sm font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Offensive Leaders
        </button>
        <button
          onClick={() => setActiveCategory('defensive')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeCategory === 'defensive'
              ? 'bg-neon-green text-black shadow-sm font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Defensive Leaders
        </button>
      </div>

      {/* Category Content */}
      {activeCategory === 'offensive' ? (
        <OffensiveTeamsSection leagueId={leagueId} />
      ) : (
        <DefensiveTeamsSection leagueId={leagueId} />
      )}
    </div>
  )
} 