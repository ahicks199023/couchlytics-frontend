'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import TradeSubmissionForm from '@/components/trades/TradeSubmissionForm'

export default function SubmitTradePage() {
  const params = useParams()
  const leagueId = params.leagueId as string

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-4">Submit Trade</h1>
          <p className="text-gray-400">
            Create a new trade proposal for your league
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <TradeSubmissionForm 
            leagueId={leagueId}
            onTradeSubmitted={() => {
              // Optionally redirect to trades history
              window.location.href = `/leagues/${leagueId}/trades`
            }}
          />
        </div>
      </div>
    </div>
  )
} 