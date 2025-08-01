'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import TradesHistory from '@/components/trades/TradesHistory'

export default function TradesPage() {
  const params = useParams()
  const leagueId = params.leagueId as string

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-4">Trade History</h1>
          <p className="text-gray-400">
            View and manage all trades in your league
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <TradesHistory leagueId={leagueId} />
        </div>
      </div>
    </div>
  )
}
