'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import TradesHistory from '@/components/trades/TradesHistory'
import EnhancedTradeSubmissionForm from '@/components/trades/EnhancedTradeSubmissionForm'
import { API_BASE } from '@/lib/config'

interface UserTeam {
  id: number
  name: string
  city: string
  abbreviation: string
}

interface TradeOffer {
  id: number
  status: string
  from_team?: { id: number; name: string; abbreviation?: string; city?: string }
  to_team?: { id: number; name: string; abbreviation?: string; city?: string }
  // Legacy support for old API format
  fromTeam?: { id: number; name: string }
  toTeam?: { id: number; name: string }
  fromPlayers: Array<{ id: number; playerName: string; position: string }>
  toPlayers: Array<{ id: number; playerName: string; position: string }>
  createdAt: string
  expiresAt: string
  message?: string
  tradeAnalysis?: {
    fairnessScore: number
    recommendation: string
    netValue: number
    riskLevel?: string
  }
}

interface TradeOfferCardProps {
  trade: TradeOffer
  type: 'received' | 'sent'
  onAccept?: () => void
  onReject?: () => void
  onCounter?: () => void
}

// Helper functions for safe team access
const getTeamName = (team: { id: number; name: string; abbreviation?: string; city?: string } | undefined) => {
  if (!team) return 'Unknown Team'
  return team.name || team.abbreviation || 'Unknown Team'
}

function TradeOfferCard({ trade, type, onAccept, onReject, onCounter }: TradeOfferCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Debug logging for trade offer data
  useEffect(() => {
    console.log('🔍 Trade offer data:', trade)
    console.log('🔍 From team:', trade.from_team || trade.fromTeam)
    console.log('🔍 To team:', trade.to_team || trade.toTeam)
  }, [trade])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20'
      case 'accepted': return 'text-green-400 bg-green-400/20'
      case 'rejected': return 'text-red-400 bg-red-400/20'
      case 'countered': return 'text-blue-400 bg-blue-400/20'
      case 'expired': return 'text-gray-400 bg-gray-400/20'
      case 'committee_review': return 'text-purple-400 bg-purple-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white">
                {type === 'received' 
                  ? `From: ${getTeamName(trade.from_team || trade.fromTeam)}` 
                  : `To: ${getTeamName(trade.to_team || trade.toTeam)}`
                }
              </h3>
              <p className="text-sm text-gray-400">
                {new Date(trade.createdAt).toLocaleDateString()} • {formatTimeRemaining(trade.expiresAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
              {trade.status.replace('_', ' ').toUpperCase()}
            </span>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 hover:text-white"
            >
              <svg className={`w-5 h-5 transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Trade Details */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-200 mb-2">
              {type === 'received' ? 'You Receive' : 'You Send'}
            </h4>
            <div className="space-y-1">
              {(type === 'received' ? trade.fromPlayers : trade.toPlayers).map(player => (
                <div key={player.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{player.playerName}</span>
                  <span className="text-gray-500">{player.position}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-200 mb-2">
              {type === 'received' ? 'You Send' : 'You Receive'}
            </h4>
            <div className="space-y-1">
              {(type === 'received' ? trade.toPlayers : trade.fromPlayers).map(player => (
                <div key={player.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{player.playerName}</span>
                  <span className="text-gray-500">{player.position}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Analysis */}
        {trade.tradeAnalysis && (
          <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
            <h5 className="font-medium text-gray-200 mb-2">Trade Analysis</h5>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Fairness Score</span>
                <p className="font-semibold text-white">{trade.tradeAnalysis.fairnessScore}%</p>
              </div>
              <div>
                <span className="text-gray-400">Recommendation</span>
                <p className="font-semibold text-white">{trade.tradeAnalysis.recommendation}</p>
              </div>
              <div>
                <span className="text-gray-400">Net Value</span>
                <p className="font-semibold text-white">
                  {trade.tradeAnalysis.netValue > 0 ? '+' : ''}{trade.tradeAnalysis.netValue}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {trade.message && (
          <div className="bg-blue-600/20 rounded-lg p-3 mb-4">
            <h5 className="font-medium text-blue-400 mb-1">Message</h5>
            <p className="text-sm text-blue-200">{trade.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        {type === 'received' && trade.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept
            </button>
            
            <button
              onClick={onCounter}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Counter
            </button>
            
            <button
              onClick={onReject}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TradesPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const [userTeam, setUserTeam] = useState<UserTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'history' | 'submit'>('received')
  const [trades, setTrades] = useState({
    sent: [],
    received: [],
    committee: []
  })

  // Load user's team assignment
  useEffect(() => {
    const loadUserTeam = async () => {
      if (!leagueId || leagueId === 'undefined') {
        setError('Invalid league ID')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE}/leagues/${leagueId}/user-team`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUserTeam(data.team)
          } else {
            // User doesn't have a team assigned, but that's okay for viewing history
            console.log('User not assigned to a team')
          }
        } else {
          console.log('Failed to get user team, but continuing...')
        }
      } catch (error) {
        console.error('Error loading user team:', error)
        // Don't set error here as user can still view trade history
      } finally {
        setLoading(false)
      }
    }

    loadUserTeam()
  }, [leagueId])

  // Fetch trade offers
  const fetchTrades = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/trade-offers`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTrades(data)
      } else {
        console.error('Failed to fetch trades:', response.status)
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    }
  }, [leagueId])

  // Load trade offers when component mounts or leagueId changes
  useEffect(() => {
    if (leagueId && leagueId !== 'undefined') {
      fetchTrades()
    }
  }, [leagueId, fetchTrades])

  const handleTradeSubmitted = () => {
    // Switch to history tab to show the new trade
    setActiveTab('history')
    // Refresh trade offers
    fetchTrades()
  }

  // Handle trade actions (accept, reject, counter)
  const handleTradeAction = async (tradeId: number, action: string, message = '') => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/trade-offers/${tradeId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      })

      if (response.ok) {
        alert(`Trade ${action}ed successfully`)
        fetchTrades() // Refresh the trades list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to ${action} trade`)
      }
    } catch (error) {
      console.error(`Error ${action}ing trade:`, error)
      alert(`Failed to ${action} trade: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-gray-400">Loading trade system...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Trade Center</h1>
        
        {/* User Team Display */}
        {userTeam && (
          <div className="bg-neon-green/20 border border-neon-green/30 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-neon-green mb-2">Your Team</h2>
            <p className="text-white text-xl font-bold">{userTeam.name} ({userTeam.abbreviation})</p>
            <p className="text-gray-300 text-sm mt-1">You can propose trades with other teams in this league</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'received'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Received ({trades.received.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'sent'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sent ({trades.sent.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trade History
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'submit'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Submit Trade
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Received Trade Offers</h2>
          {trades.received.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p>No pending trade offers</p>
            </div>
          ) : (
            trades.received.map((trade: TradeOffer) => (
              <TradeOfferCard
                key={trade.id}
                trade={trade}
                type="received"
                onAccept={() => handleTradeAction(trade.id, 'accept')}
                onReject={() => handleTradeAction(trade.id, 'reject')}
                onCounter={() => handleTradeAction(trade.id, 'counter')}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Sent Trade Offers</h2>
          {trades.sent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <p>No sent trade offers</p>
            </div>
          ) : (
            trades.sent.map((trade: TradeOffer) => (
              <TradeOfferCard
                key={trade.id}
                trade={trade}
                type="sent"
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <TradesHistory leagueId={leagueId} />
      )}

      {activeTab === 'submit' && (
        <div>
          {userTeam ? (
            <EnhancedTradeSubmissionForm 
              leagueId={leagueId} 
              onTradeSubmitted={handleTradeSubmitted}
            />
          ) : (
            <div className="text-center p-8">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Team Assignment Required</h3>
                <p className="text-yellow-300 mb-4">
                  You need to be assigned to a team to submit trades. Please contact your league commissioner.
                </p>
                <p className="text-gray-400 text-sm">
                  You can still view trade history and respond to trade proposals if you receive any.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
