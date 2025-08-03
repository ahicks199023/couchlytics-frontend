'use client'

import React, { useState } from 'react'
import { API_BASE } from '@/lib/config'

interface TradeAnalysis {
  team_from_analysis: {
    total_value: number
    item_count: number
    item_details: Array<{
      name?: string
      draft_round?: number
      draft_year?: number
      value: number
      final_value?: number
    }>
    team_needs_impact: number
    market_impact: number
  }
  team_to_analysis: {
    total_value: number
    item_count: number
    item_details: Array<{
      name?: string
      draft_round?: number
      draft_year?: number
      value: number
      final_value?: number
    }>
    team_needs_impact: number
    market_impact: number
  }
  fairness_analysis: {
    fairness_score: number
    verdict: string
    difference: number
    difference_percentage: number
  }
  recommendations: Array<{
    type: string
    priority: 'low' | 'medium' | 'high'
    message: string
    suggestion: string
  }>
}

interface TradeItem {
  id: string
  type: 'player' | 'draft_pick'
  player?: {
    id: number
    name: string
    position: string
  }
  draft_pick?: {
    round: number
    year: number
  }
}

interface Trade {
  id: string
  status: 'proposed' | 'accepted' | 'declined' | 'committee_review' | 'approved'
  created_at: string
  team_from: {
    id: number
    name: string
  }
  team_to: {
    id: number
    name: string
  }
  team_from_items: TradeItem[]
  team_to_items: TradeItem[]
  notes?: string
  trade_analysis?: TradeAnalysis
}

interface TradeResponseComponentProps {
  trade: Trade
  onTradeResponded: (tradeId: string, action: 'accept' | 'decline') => void
  userTeamId: number
}

const TradeResponseComponent: React.FC<TradeResponseComponentProps> = ({ 
  trade, 
  onTradeResponded, 
  userTeamId 
}) => {
  const [responding, setResponding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const isRecipient = trade.team_to.id === userTeamId
  const isProposer = trade.team_from.id === userTeamId

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!isRecipient) {
      setError('Only the recipient can respond to this trade')
      return
    }

    setResponding(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/enhanced-trade/respond-trade/${trade.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })
      
      const result = await response.json()
      
      if (result.success) {
        onTradeResponded(trade.id, action)
      } else {
        setError(result.error || 'Failed to respond to trade')
      }
    } catch (error) {
      console.error('Failed to respond to trade:', error)
      setError('Failed to respond to trade. Please try again.')
    } finally {
      setResponding(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'proposed': 'orange',
      'accepted': 'blue',
      'declined': 'red',
      'committee_review': 'purple',
      'approved': 'green'
    }
    return colors[status] || 'gray'
  }

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      'proposed': 'Proposed',
      'accepted': 'Accepted',
      'declined': 'Declined', 
      'committee_review': 'Under Committee Review',
      'approved': 'Approved'
    }
    return statuses[status] || status
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-4">
      {/* Trade Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase bg-${getStatusColor(trade.status)}-900 text-${getStatusColor(trade.status)}-200`}>
            {getStatusText(trade.status)}
          </span>
          <span className="text-gray-400 text-sm">
            {new Date(trade.created_at).toLocaleDateString()} at{' '}
            {new Date(trade.created_at).toLocaleTimeString()}
          </span>
        </div>
        
        {isRecipient && trade.status === 'proposed' && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleRespond('accept')}
              disabled={responding}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {responding ? 'Accepting...' : 'Accept Trade'}
            </button>
            <button 
              onClick={() => handleRespond('decline')}
              disabled={responding}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {responding ? 'Declining...' : 'Decline Trade'}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Trade Flow */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{trade.team_from.name}</div>
          <div className="text-sm text-gray-400">Proposes</div>
        </div>
        
        <div className="text-2xl text-gray-400">→</div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{trade.team_to.name}</div>
          <div className="text-sm text-gray-400">Receives</div>
        </div>
      </div>
      
      {/* Trade Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-700 rounded p-4">
          <h4 className="font-semibold text-white mb-3">{trade.team_from.name} gives:</h4>
          {trade.team_from_items.length === 0 ? (
            <div className="text-gray-400 italic">Nothing</div>
          ) : (
            <div className="space-y-2">
              {trade.team_from_items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                  {item.type === 'player' ? (
                    <span className="text-white">
                      {item.player?.name} ({item.player?.position})
                    </span>
                  ) : (
                    <span className="text-white">
                      Round {item.draft_pick?.round} Pick ({item.draft_pick?.year})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-gray-700 rounded p-4">
          <h4 className="font-semibold text-white mb-3">{trade.team_to.name} gives:</h4>
          {trade.team_to_items.length === 0 ? (
            <div className="text-gray-400 italic">Nothing</div>
          ) : (
            <div className="space-y-2">
              {trade.team_to_items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                  {item.type === 'player' ? (
                    <span className="text-white">
                      {item.player?.name} ({item.player?.position})
                    </span>
                  ) : (
                    <span className="text-white">
                      Round {item.draft_pick?.round} Pick ({item.draft_pick?.year})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Notes */}
      {trade.notes && (
        <div className="mb-6 p-3 bg-gray-700 rounded">
          <div className="text-sm text-gray-400 mb-1">Notes:</div>
          <div className="text-white">{trade.notes}</div>
        </div>
      )}

      {/* Trade Analysis Toggle */}
      {trade.trade_analysis && (
        <div className="mb-4">
          <button 
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="bg-neon-green/20 border border-neon-green/30 text-neon-green px-4 py-2 rounded hover:bg-neon-green/30 transition-colors"
          >
            {showAnalysis ? 'Hide' : 'Show'} Trade Analysis
          </button>
        </div>
      )}

      {/* Trade Analysis Display */}
      {showAnalysis && trade.trade_analysis && (
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Trade Analysis</h3>
          
          {/* Fairness Score */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">
              Fairness Score: {trade.trade_analysis.fairness_analysis.fairness_score}/100
            </h4>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              trade.trade_analysis.fairness_analysis.verdict.toLowerCase() === 'fair' ? 'bg-green-900 text-green-200' :
              trade.trade_analysis.fairness_analysis.verdict.toLowerCase() === 'unfair' ? 'bg-red-900 text-red-200' :
              'bg-yellow-900 text-yellow-200'
            }`}>
              {trade.trade_analysis.fairness_analysis.verdict}
            </div>
          </div>
          
          {/* Team Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-600 rounded p-4">
              <h4 className="font-semibold text-white mb-2">{trade.team_from.name} Value: {trade.trade_analysis.team_from_analysis.total_value}</h4>
              <div className="space-y-1">
                {trade.trade_analysis.team_from_analysis.item_details.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name || `Draft Pick ${item.draft_round}`}</span>
                    <span className="text-white">${item.final_value || item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-600 rounded p-4">
              <h4 className="font-semibold text-white mb-2">{trade.team_to.name} Value: {trade.trade_analysis.team_to_analysis.total_value}</h4>
              <div className="space-y-1">
                {trade.trade_analysis.team_to_analysis.item_details.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name || `Draft Pick ${item.draft_round}`}</span>
                    <span className="text-white">${item.final_value || item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          {trade.trade_analysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-3">Recommendations</h4>
              <div className="space-y-2">
                {trade.trade_analysis.recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded border ${
                    rec.priority === 'high' ? 'bg-red-900/20 border-red-500/30' :
                    rec.priority === 'medium' ? 'bg-yellow-900/20 border-yellow-500/30' :
                    'bg-blue-900/20 border-blue-500/30'
                  }`}>
                    <div className="text-white font-medium">{rec.message}</div>
                    <div className="text-gray-300 text-sm mt-1">{rec.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Committee Review Notice */}
      {trade.status === 'committee_review' && (
        <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <div className="text-purple-400 font-semibold mb-2">Trade Under Committee Review</div>
          <div className="text-purple-300 text-sm">
            This trade has been accepted and is now being reviewed by the league committee for final approval.
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeResponseComponent 