'use client'

import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export default function TestAnalyticsPage() {
  return (
    <div className="min-h-screen bg-black">
      <AnalyticsDashboard 
        leagueId="12335716" 
        initialView="standings"
      />
    </div>
  )
} 