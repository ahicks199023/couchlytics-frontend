'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import TradesHistory from '@/components/trades/TradesHistory'
import TradeSubmissionForm from '@/components/trades/TradeSubmissionForm'

type TabType = 'history' | 'submit'

export default function TradesPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const [activeTab, setActiveTab] = useState<TabType>('history')
  const [refreshHistory, setRefreshHistory] = useState(0)

  const handleTradeSubmitted = () => {
    // Switch to history tab and refresh the list
    setActiveTab('history')
    setRefreshHistory(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-4">Trades</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-neon-green text-black shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Trade History
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'submit'
                  ? 'bg-neon-green text-black shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Submit Trade
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'history' ? (
            <TradesHistory 
              key={refreshHistory} // Force re-render when trade is submitted
              leagueId={leagueId} 
            />
          ) : (
            <TradeSubmissionForm 
              leagueId={leagueId}
              onTradeSubmitted={handleTradeSubmitted}
            />
          )}
        </div>
      </div>
    </div>
  )
}
