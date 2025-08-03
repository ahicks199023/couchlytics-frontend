'use client'

import React, { useState, useEffect } from 'react'
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

export default function TradesPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const [userTeam, setUserTeam] = useState<UserTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'history' | 'submit'>('history')

  // Load user's team assignment
  useEffect(() => {
    const loadUserTeam = async () => {
      if (!leagueId || leagueId === 'undefined') {
        setError('Invalid league ID')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE}/api/enhanced-trade/user-team/${leagueId}`, {
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

  const handleTradeSubmitted = () => {
    // Switch to history tab to show the new trade
    setActiveTab('history')
    // You could also trigger a refresh of the trades history here
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
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trade History
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-6 py-3 font-medium transition-colors ${
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
