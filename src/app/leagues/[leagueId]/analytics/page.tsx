'use client'

import { useParams } from 'next/navigation'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export default function LeagueAnalyticsPage() {
  const { leagueId } = useParams()
  const league_id = typeof leagueId === 'string' ? leagueId : ''

  return (
    <div className="min-h-screen bg-black">
      <AnalyticsDashboard leagueId={league_id} />
    </div>
  )
} 
