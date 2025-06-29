'use client'

import { useParams } from 'next/navigation'
import LeagueStats from './LeagueStats'

export default function StatsPage() {
  const { leagueId } = useParams()
  const parsedLeagueId = parseInt(leagueId as string, 10)

  if (isNaN(parsedLeagueId)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Invalid League ID</h1>
        <p className="text-gray-600">The league ID provided is not valid.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">League Statistics</h1>
      <LeagueStats leagueId={parsedLeagueId} />
    </div>
  )
} 
