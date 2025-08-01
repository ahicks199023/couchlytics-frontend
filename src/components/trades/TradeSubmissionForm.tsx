'use client'

import React, { useState, useEffect } from 'react'
import { submitTrade } from '@/lib/trades'

interface Team {
  id: number
  name: string
  abbreviation: string
}

interface Player {
  id: number
  name: string
  position: string
  team_id: number
}

interface TradeSubmissionFormProps {
  leagueId: string
  onTradeSubmitted?: (result: unknown) => void
}

const TradeSubmissionForm: React.FC<TradeSubmissionFormProps> = ({ 
  leagueId, 
  onTradeSubmitted 
}) => {
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    teamFromId: '',
    teamToId: '',
    notes: ''
  })
  const [selectedItems, setSelectedItems] = useState<Array<{
    type: 'player' | 'draft_pick'
    playerId?: number
    round?: number
    year?: number
    fromTeamId: number
    toTeamId: number
  }>>([])

  // Load teams and players on component mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${leagueId}/teams`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setTeams(data.teams || [])
        }
      } catch (error) {
        console.error('Failed to load teams:', error)
      }
    }

    const loadPlayers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${leagueId}/players`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setPlayers(data.players || [])
        }
      } catch (error) {
        console.error('Failed to load players:', error)
      }
    }

    loadTeams()
    loadPlayers()
  }, [leagueId])

  const addPlayerItem = (player: Player, fromTeamId: number, toTeamId: number) => {
    const newItem = {
      type: 'player' as const,
      playerId: player.id,
      fromTeamId,
      toTeamId
    }
    setSelectedItems([...selectedItems, newItem])
  }

  const addDraftPickItem = (round: number, year: number, fromTeamId: number, toTeamId: number) => {
    const newItem = {
      type: 'draft_pick' as const,
      round,
      year,
      fromTeamId,
      toTeamId
    }
    setSelectedItems([...selectedItems, newItem])
  }

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.teamFromId || !formData.teamToId || selectedItems.length === 0) {
      alert('Please fill in all required fields and add at least one trade item')
      return
    }

    if (formData.teamFromId === formData.teamToId) {
      alert('Cannot trade with the same team')
      return
    }

    setSubmitting(true)
    
    try {
      const tradeData = {
        leagueId,
        teamFromId: parseInt(formData.teamFromId),
        teamToId: parseInt(formData.teamToId),
        notes: formData.notes,
        items: selectedItems
      }

      const result = await submitTrade(tradeData)
      alert('Trade submitted successfully!')
      
      // Reset form
      setFormData({ teamFromId: '', teamToId: '', notes: '' })
      setSelectedItems([])
      
      // Notify parent component
      if (onTradeSubmitted) {
        onTradeSubmitted(result)
      }
    } catch (error) {
      console.error('Trade submission error:', error)
      alert(`Failed to submit trade: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getTeamPlayers = (teamId: number) => {
    return players.filter(player => player.team_id === teamId)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Submit Trade</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team From:
              </label>
              <select 
                value={formData.teamFromId}
                onChange={(e) => setFormData({ ...formData, teamFromId: e.target.value })}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-green"
                required
              >
                <option value="">Select Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team To:
              </label>
              <select 
                value={formData.teamToId}
                onChange={(e) => setFormData({ ...formData, teamToId: e.target.value })}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-green"
                required
              >
                <option value="">Select Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional):
            </label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this trade..."
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
                      {item.type === 'player' ? (
                        <span>
                          Player: {players.find(p => p.id === item.playerId)?.name} 
                          ({players.find(p => p.id === item.playerId)?.position})
                        </span>
                      ) : (
                        <span>
                          Draft Pick: Round {item.round} ({item.year})
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

            {/* Add Players Section */}
            {formData.teamFromId && formData.teamToId && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Add Players</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Team From Players */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        {teams.find(t => t.id === parseInt(formData.teamFromId))?.name} Players:
                      </label>
                      <select 
                        onChange={(e) => {
                          const player = players.find(p => p.id === parseInt(e.target.value))
                          if (player) {
                            addPlayerItem(player, parseInt(formData.teamFromId), parseInt(formData.teamToId))
                          }
                          e.target.value = ''
                        }}
                        className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
                      >
                        <option value="">Select Player</option>
                        {getTeamPlayers(parseInt(formData.teamFromId)).map(player => (
                          <option key={player.id} value={player.id}>
                            {player.name} ({player.position})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Team To Players */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        {teams.find(t => t.id === parseInt(formData.teamToId))?.name} Players:
                      </label>
                      <select 
                        onChange={(e) => {
                          const player = players.find(p => p.id === parseInt(e.target.value))
                          if (player) {
                            addPlayerItem(player, parseInt(formData.teamToId), parseInt(formData.teamFromId))
                          }
                          e.target.value = ''
                        }}
                        className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
                      >
                        <option value="">Select Player</option>
                        {getTeamPlayers(parseInt(formData.teamToId)).map(player => (
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
                    {/* Team From Draft Picks */}
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-400">
                        {teams.find(t => t.id === parseInt(formData.teamFromId))?.name} Draft Picks:
                      </label>
                      <div className="flex gap-2">
                        <select 
                          onChange={(e) => {
                            const round = parseInt(e.target.value)
                            if (round) {
                              addDraftPickItem(round, 2025, parseInt(formData.teamFromId), parseInt(formData.teamToId))
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

                    {/* Team To Draft Picks */}
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-400">
                        {teams.find(t => t.id === parseInt(formData.teamToId))?.name} Draft Picks:
                      </label>
                      <div className="flex gap-2">
                        <select 
                          onChange={(e) => {
                            const round = parseInt(e.target.value)
                            if (round) {
                              addDraftPickItem(round, 2025, parseInt(formData.teamToId), parseInt(formData.teamFromId))
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
              {submitting ? 'Submitting...' : 'Submit Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TradeSubmissionForm 