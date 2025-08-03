'use client'

import React, { useState, useEffect } from 'react'
import { API_BASE } from '@/lib/config'

interface Team {
  id: number
  name: string
  abbreviation: string
}

interface Player {
  id: number
  name?: string | null
  team?: string | null
  position?: string | null
  ovr: number
  teamId?: number
  teamName?: string
  user?: string
  espnId?: string
  devTrait?: string
  age?: number
  yearsPro?: number
}

interface UserTeam {
  id: number
  name: string
  city: string
  abbreviation: string
}

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

interface EnhancedTradeSubmissionFormProps {
  leagueId: string
  onTradeSubmitted?: (result: unknown) => void
}

const EnhancedTradeSubmissionForm: React.FC<EnhancedTradeSubmissionFormProps> = ({ 
  leagueId, 
  onTradeSubmitted 
}) => {
  const [userTeam, setUserTeam] = useState<UserTeam | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamToPlayers, setTeamToPlayers] = useState<Player[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [tradeAnalysis, setTradeAnalysis] = useState<TradeAnalysis | null>(null)
  const [formData, setFormData] = useState({
    teamToId: '',
    notes: ''
  })
  const [selectedItems, setSelectedItems] = useState<Array<{
    playerId?: number
    draftRound?: number
    draftYear?: number
    fromTeamId: number
    toTeamId: number
  }>>([])

  // Load user's team and all teams on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Get user's assigned team
        const userTeamResponse = await fetch(`${API_BASE}/api/enhanced-trade/user-team/${leagueId}`, {
          credentials: 'include'
        })
        
        if (userTeamResponse.ok) {
          const userTeamData = await userTeamResponse.json()
          if (userTeamData.success) {
            setUserTeam(userTeamData.team)
          } else {
            setError("You need to be assigned to a team to make trades")
            return
          }
        } else {
          setError("Failed to get your team assignment")
          return
        }
        
        // Get all teams
        const teamsResponse = await fetch(`${API_BASE}/leagues/${leagueId}/teams`, {
          credentials: 'include'
        })
        
        if (!teamsResponse.ok) {
          throw new Error(`Failed to load teams: ${teamsResponse.status}`)
        }
        
        const teamsData = await teamsResponse.json()
        setTeams(teamsData.teams || [])
        console.log(`Loaded ${teamsData.teams?.length || 0} teams`)
        
      } catch (error) {
        console.error('Failed to load data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    if (leagueId) {
      loadData()
    }
  }, [leagueId])

  // Load players for team to when team is selected
  useEffect(() => {
    const loadTeamToPlayers = async () => {
      if (!formData.teamToId) {
        setTeamToPlayers([])
        return
      }

      const selectedTeam = teams.find(t => t.id === parseInt(formData.teamToId))
      if (!selectedTeam) return

      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: '5000',
          team: selectedTeam.name
        })
        
        const response = await fetch(`${API_BASE}/leagues/${leagueId}/players?${params.toString()}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error(`Failed to load players: ${response.status}`)
        }
        
        const data = await response.json()
        setTeamToPlayers(data.players || [])
        console.log(`Loaded ${data.players?.length || 0} players for ${selectedTeam.name}`)
        
      } catch (error) {
        console.error('Failed to load team to players:', error)
        setTeamToPlayers([])
      }
    }

    loadTeamToPlayers()
  }, [leagueId, formData.teamToId, teams])

  const addPlayerItem = (player: Player, fromTeamId: number, toTeamId: number) => {
    const newItem = {
      playerId: player.id,
      fromTeamId,
      toTeamId
    }
    setSelectedItems([...selectedItems, newItem])
  }

  const addDraftPickItem = (round: number, year: number, fromTeamId: number, toTeamId: number) => {
    const newItem = {
      draftRound: round,
      draftYear: year,
      fromTeamId,
      toTeamId
    }
    setSelectedItems([...selectedItems, newItem])
  }

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const submitTradeProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userTeam || !formData.teamToId || selectedItems.length === 0) {
      alert('Please fill in all required fields and add at least one trade item')
      return
    }

    if (userTeam.id === parseInt(formData.teamToId)) {
      alert('Cannot trade with your own team')
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)
    setTradeAnalysis(null)
    
    try {
      const tradeData = {
        leagueId,
        teamFromId: userTeam.id,
        teamToId: parseInt(formData.teamToId),
        notes: formData.notes,
        items: selectedItems
      }

      const response = await fetch(`${API_BASE}/api/enhanced-trade/propose-trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(tradeData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage(`Trade proposal sent! Status: ${result.status}`)
        setTradeAnalysis(result.trade_analysis)
        
        // Reset form
        setFormData({ teamToId: '', notes: '' })
        setSelectedItems([])
        
        // Notify parent component
        if (onTradeSubmitted) {
          onTradeSubmitted(result)
        }
      } else {
        setError(result.error || 'Failed to submit trade proposal')
      }
    } catch (error) {
      console.error('Failed to submit trade proposal:', error)
      setError('Failed to submit trade proposal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your team assignment...</p>
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

  if (!userTeam) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">You need to be assigned to a team to make trades.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Submit Trade Proposal</h2>
        
        {/* User Team Display */}
        <div className="bg-neon-green/20 border border-neon-green/30 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-neon-green mb-2">Your Team</h3>
          <p className="text-white text-xl font-bold">{userTeam.name} ({userTeam.abbreviation})</p>
        </div>
        
        <form onSubmit={submitTradeProposal} className="space-y-6">
          {/* Team Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trade With Team:
            </label>
            <select 
              value={formData.teamToId}
              onChange={(e) => setFormData({ ...formData, teamToId: e.target.value })}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-green"
              required
            >
              <option value="">Select Team</option>
              {teams.filter(team => team.id !== userTeam.id).map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.abbreviation})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional):
            </label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this trade proposal..."
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-green h-24 resize-none"
            />
          </div>

          {/* Trade Items Section */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Trade Items ({selectedItems.length})
            </h3>
            
            {selectedItems.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No items added yet. Use the sections below to add players or draft picks.
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded">
                    <div className="text-white">
                      {item.playerId ? (
                        <span>
                          Player: {teamToPlayers.find(p => p.id === item.playerId)?.name} 
                          ({teamToPlayers.find(p => p.id === item.playerId)?.position})
                        </span>
                      ) : (
                        <span>
                          Draft Pick: Round {item.draftRound} ({item.draftYear})
                        </span>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Items Section */}
            {formData.teamToId && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Add Players</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Your Team Players */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Your Players ({userTeam.name}):
                      </label>
                      <select 
                        onChange={(e) => {
                          const player = teamToPlayers.find(p => p.id === parseInt(e.target.value))
                          if (player) {
                            addPlayerItem(player, userTeam.id, parseInt(formData.teamToId))
                          }
                          e.target.value = ''
                        }}
                        className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
                      >
                        <option value="">Select Player</option>
                        {teamToPlayers.map(player => (
                          <option key={player.id} value={player.id}>
                            {player.name} ({player.position})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Other Team Players */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        {teams.find(t => t.id === parseInt(formData.teamToId))?.name} Players:
                      </label>
                      <select 
                        onChange={(e) => {
                          const player = teamToPlayers.find(p => p.id === parseInt(e.target.value))
                          if (player) {
                            addPlayerItem(player, parseInt(formData.teamToId), userTeam.id)
                          }
                          e.target.value = ''
                        }}
                        className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
                      >
                        <option value="">Select Player</option>
                        {teamToPlayers.map(player => (
                          <option key={player.id} value={player.id}>
                            {player.name} ({player.position})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Add Draft Picks Section */}
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Add Draft Picks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Your Team Draft Picks */}
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-400">
                        Your Draft Picks ({userTeam.name}):
                      </label>
                      <div className="flex gap-2">
                        <select 
                          onChange={(e) => {
                            const round = parseInt(e.target.value)
                            if (round) {
                              addDraftPickItem(round, 2025, userTeam.id, parseInt(formData.teamToId))
                            }
                            e.target.value = ''
                          }}
                          className="flex-1 bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
                        >
                          <option value="">Round</option>
                          {[1, 2, 3, 4, 5, 6, 7].map(round => (
                            <option key={round} value={round}>Round {round}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Other Team Draft Picks */}
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-400">
                        {teams.find(t => t.id === parseInt(formData.teamToId))?.name} Draft Picks:
                      </label>
                      <div className="flex gap-2">
                        <select 
                          onChange={(e) => {
                            const round = parseInt(e.target.value)
                            if (round) {
                              addDraftPickItem(round, 2025, parseInt(formData.teamToId), userTeam.id)
                            }
                            e.target.value = ''
                          }}
                          className="flex-1 bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
                        >
                          <option value="">Round</option>
                          {[1, 2, 3, 4, 5, 6, 7].map(round => (
                            <option key={round} value={round}>Round {round}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={selectedItems.length === 0 || submitting}
              className="bg-neon-green hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Trade Proposal'}
            </button>
          </div>
        </form>

        {/* Success Message */}
        {message && (
          <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400 font-semibold">{message}</p>
          </div>
        )}

        {/* Trade Analysis Display */}
        {tradeAnalysis && (
          <div className="mt-6 bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Trade Analysis</h3>
            
            {/* Fairness Score */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Fairness Score: {tradeAnalysis.fairness_analysis.fairness_score}/100
              </h4>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                tradeAnalysis.fairness_analysis.verdict.toLowerCase() === 'fair' ? 'bg-green-900 text-green-200' :
                tradeAnalysis.fairness_analysis.verdict.toLowerCase() === 'unfair' ? 'bg-red-900 text-red-200' :
                'bg-yellow-900 text-yellow-200'
              }`}>
                {tradeAnalysis.fairness_analysis.verdict}
              </div>
            </div>
            
            {/* Team Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-600 rounded p-4">
                <h4 className="font-semibold text-white mb-2">Your Team Value: {tradeAnalysis.team_from_analysis.total_value}</h4>
                <div className="space-y-1">
                  {tradeAnalysis.team_from_analysis.item_details.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.name || `Draft Pick ${item.draft_round}`}</span>
                      <span className="text-white">${item.final_value || item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-600 rounded p-4">
                <h4 className="font-semibold text-white mb-2">Other Team Value: {tradeAnalysis.team_to_analysis.total_value}</h4>
                <div className="space-y-1">
                  {tradeAnalysis.team_to_analysis.item_details.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.name || `Draft Pick ${item.draft_round}`}</span>
                      <span className="text-white">${item.final_value || item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            {tradeAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-white mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {tradeAnalysis.recommendations.map((rec, index) => (
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
      </div>
    </div>
  )
}

export default EnhancedTradeSubmissionForm 