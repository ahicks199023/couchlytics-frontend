'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { API_BASE } from '@/lib/config'
import { useAuth } from '@/contexts/AuthContext'

interface Player {
  id: number
  name: string
  team: string
  position: string
  ovr: number
  teamId?: number
  user?: string
  devTrait?: string
  age?: number
  yearsPro?: number
}

interface Team {
  id: number
  name: string
  city: string
  user: string
  user_id?: number
}



interface TradeResult {
  tradeAssessment: {
    verdict: string
    teamGives: number
    teamReceives: number
    netGain: number
    explanation?: string
  }
  canAutoApprove: boolean
  suggestedTrades?: Player[]
  riskLevel?: 'Low' | 'Medium' | 'High'
}

// Always use default avatar to prevent headshot errors
const getHeadshotUrl = () => '/default-avatar.png'

// Enhanced player value calculation
const calculatePlayerValue = (player: Player): number => {
  const baseValue = player.ovr || 75
  
  // Position multipliers
  const positionMultipliers: Record<string, number> = {
    'QB': 1.2,
    'WR': 1.1,
    'RB': 1.0,
    'TE': 0.9,
    'LT': 0.8,
    'LG': 0.7,
    'C': 0.7,
    'RG': 0.7,
    'RT': 0.8,
    'LE': 0.9,
    'RE': 0.9,
    'DT': 0.8,
    'LOLB': 0.9,
    'MLB': 0.9,
    'ROLB': 0.9,
    'CB': 1.0,
    'FS': 0.9,
    'SS': 0.9,
    'K': 0.5,
    'P': 0.4
  }
  
  const multiplier = positionMultipliers[player.position] || 1.0
  
  // Age factor (younger players worth more)
  let ageFactor = 1.0
  if (player.age) {
    if (player.age <= 23) ageFactor = 1.2
    else if (player.age <= 26) ageFactor = 1.1
    else if (player.age <= 29) ageFactor = 1.0
    else if (player.age <= 32) ageFactor = 0.9
    else ageFactor = 0.7
  }
  
  // Development trait factor
  let devFactor = 1.0
  if (player.devTrait) {
    switch (player.devTrait.toLowerCase()) {
      case 'superstar': devFactor = 1.3
      case 'star': devFactor = 1.2
      case 'normal': devFactor = 1.0
      case 'slow': devFactor = 0.8
      default: devFactor = 1.0
    }
  }
  
  return Math.round(baseValue * multiplier * ageFactor * devFactor)
}

interface TradeCalculatorProps {
  league_id: string
}

export default function TradeCalculator({ league_id }: TradeCalculatorProps) {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Trade state
  const [result, setResult] = useState<TradeResult | null>(null)
  const [givePlayers, setGivePlayers] = useState<Player[]>([])
  const [receivePlayers, setReceivePlayers] = useState<Player[]>([])
  
  // Team selection
  const [selectedTeamB, setSelectedTeamB] = useState<string>('')
  
  // Filters
  const [selectedPosition, setSelectedPosition] = useState('All')
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedReceivePosition, setSelectedReceivePosition] = useState('All')
  const [selectedReceivePlayer, setSelectedReceivePlayer] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [receiveCurrentPage, setReceiveCurrentPage] = useState(1)
  
  // Trade Offer state
  const [sendingOffer, setSendingOffer] = useState(false)
  const [tradeMessage, setTradeMessage] = useState('')
  const [expirationHours, setExpirationHours] = useState(168) // Default 1 week

  // Determine user's team by matching team.user_id to user.id
  const userTeam = useMemo(() => 
    teams.find(team => String(team.user_id) === String(user?.id)), 
    [teams, user?.id]
  )
  const userTeamId = userTeam?.id

  // Debug logging for team detection
  useEffect(() => {
    if (user && teams.length > 0) {
      console.log('🔍 Team Detection Debug:', {
        userId: user.id,
        teamsCount: teams.length,
        teams: teams.map(t => ({ id: t.id, name: t.name, user_id: t.user_id })),
        userTeam: userTeam ? { id: userTeam.id, name: userTeam.name } : null,
        userTeamId
      })
    }
  }, [user, teams, userTeam, userTeamId])

  // Load user and data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load league players
        const playersRes = await fetch(`${API_BASE}/leagues/${league_id}/players?page=1&pageSize=5000`, { credentials: 'include' })
        if (playersRes.ok) {
          const playersData = await playersRes.json()
          setPlayers(playersData.players || [])
        }
        
        // Load teams
        const teamsRes = await fetch(`${API_BASE}/leagues/${league_id}/teams`, { credentials: 'include' })
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json()
          console.log('📊 Teams loaded:', teamsData)
          setTeams(teamsData.teams || [])
        } else {
          console.error('Failed to load teams:', teamsRes.status)
        }
        
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load league data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      loadData()
    }
  }, [league_id, user])

  // Computed values
  const filteredUserPlayers = useMemo(() => {
    return players.filter(p => 
      p.teamId === userTeamId &&
      (selectedPosition === 'All' || p.position === selectedPosition) &&
      (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))
  }, [players, userTeamId, selectedPosition, searchQuery])

  const filteredTeamBPlayers = useMemo(() => {
    if (!selectedTeamB) return []
    const teamB = teams.find(t => t.name === selectedTeamB)
    if (!teamB) return []
    
    return players.filter(p => 
      p.teamId === teamB.id &&
      (selectedReceivePosition === 'All' || p.position === selectedReceivePosition)
    ).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))
  }, [players, teams, selectedTeamB, selectedReceivePosition])

  const positionOptions = useMemo(() => {
    return ['All', ...new Set(players.map(p => p.position))].sort()
  }, [players])

  const teamBOptions = useMemo(() => {
    return teams.filter(t => t.id !== userTeamId).map(t => t.name).sort()
  }, [teams, userTeamId])

  const giveValue = useMemo(() => 
    givePlayers.reduce((sum, p) => sum + calculatePlayerValue(p), 0), 
    [givePlayers]
  )

  const receiveValue = useMemo(() => 
    receivePlayers.reduce((sum, p) => sum + calculatePlayerValue(p), 0), 
    [receivePlayers]
  )

  const netValue = receiveValue - giveValue
  const tradeVerdict = useMemo(() => {
    const absNet = Math.abs(netValue)
    if (absNet <= 15) return 'Fair Trade'
    if (absNet <= 30) return netValue > 0 ? 'You Win' : 'You Lose'
    return netValue > 0 ? 'You Win Big' : 'You Lose Big'
  }, [netValue])

  // Player management functions
  const addGivePlayer = () => {
    const found = players.find(p => p.id === parseInt(selectedPlayer))
    if (found && !givePlayers.find(p => p.id === found.id)) {
      setGivePlayers([...givePlayers, found])
      setSelectedPlayer('')
    }
  }

  const removeGivePlayer = (id: number) => {
    setGivePlayers(givePlayers.filter(p => p.id !== id))
  }

  const addReceivePlayer = () => {
    const found = players.find(p => p.id === parseInt(selectedReceivePlayer))
    if (found && !receivePlayers.find(p => p.id === found.id)) {
      setReceivePlayers([...receivePlayers, found])
      setSelectedReceivePlayer('')
    }
  }

  const removeReceivePlayer = (id: number) => {
    setReceivePlayers(receivePlayers.filter(p => p.id !== id))
  }

  // Submit trade analysis
  const handleAnalyzeTrade = async () => {
    if (!userTeamId) {
      setError('Unable to determine your team. Please refresh the page.')
      return
    }
    
    setError(null)
    setResult(null)

    try {
      const tradeData = {
        teamId: userTeamId,
        trade: {
          give: givePlayers.map(p => p.id),
          receive: receivePlayers.map(p => p.id),
        },
        includeSuggestions: false
      }

      const res = await fetch(`${API_BASE}/leagues/${league_id}/trade-tool`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Trade calculation failed')
      }

      const data = await res.json() as TradeResult
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Check if trade offer can be sent
  const canSendOffer = result && 
    givePlayers.length > 0 && 
    receivePlayers.length > 0 && 
    userTeamId && 
    result.tradeAssessment.verdict !== 'Invalid'

  // Handle sending trade offer
  const handleSendOffer = async () => {
    if (!canSendOffer || !userTeamId) {
      console.error('Cannot send trade offer: missing requirements')
      return
    }

    // Find the target team (team receiving our players)
    const targetTeamIds = [...new Set(receivePlayers.map(p => p.teamId))]
    if (targetTeamIds.length !== 1) {
      console.error('Trade must involve exactly one other team')
      alert('Trade must involve exactly one other team')
      return
    }

    const targetTeamId = targetTeamIds[0]
    if (!targetTeamId) {
      console.error('Could not determine target team')
      alert('Could not determine target team')
      return
    }

    setSendingOffer(true)
    
    try {
      const offerData = {
        league_id: league_id,
        to_team_id: targetTeamId,
        from_players: givePlayers.map(p => ({
          player_id: p.id,
          player_name: p.name,
          position: p.position,
          team: p.team,
          ovr: p.ovr
        })),
        to_players: receivePlayers.map(p => ({
          player_id: p.id,
          player_name: p.name,
          position: p.position,
          team: p.team,
          ovr: p.ovr
        })),
        message: tradeMessage,
        trade_analysis: {
          fairnessScore: Math.round((result.tradeAssessment.teamReceives / Math.max(result.tradeAssessment.teamGives, 1)) * 100),
          recommendation: result.tradeAssessment.verdict,
          netValue: result.tradeAssessment.netGain,
          teamGives: result.tradeAssessment.teamGives,
          teamReceives: result.tradeAssessment.teamReceives,
          canAutoApprove: result.canAutoApprove,
          riskLevel: result.riskLevel || 'Medium'
        },
        expires_in_hours: expirationHours
      }

      console.log('Sending trade offer:', offerData)

      const response = await fetch(`${API_BASE}/leagues/${league_id}/trade-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(offerData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result_data = await response.json()
      console.log('Trade offer sent successfully:', result_data)
      
      // Show success message and redirect
      alert('Trade offer sent successfully!')
      
      // Reset form
      setGivePlayers([])
      setReceivePlayers([])
      setResult(null)
      setTradeMessage('')
      
      // Redirect to trades page
      window.location.href = `/leagues/${league_id}/trades`
      
    } catch (error) {
      console.error('Error sending trade offer:', error)
      alert(`Failed to send trade offer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSendingOffer(false)
    }
  }

  const clearAll = () => {
    setGivePlayers([])
    setReceivePlayers([])
    setResult(null)
    setSelectedTeamB('')
    setTradeMessage('')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p>Loading trade calculator...</p>
        </div>
      </div>
    )
  }

  if (error && !players.length) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
          >
            Retry
          </button>
        </div>
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Trade Calculator</h2>
        
        {/* User Team Display */}
        <div className="bg-neon-green/20 border border-neon-green/30 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-neon-green mb-2">Your Team</h3>
          <p className="text-white text-xl font-bold">
            {userTeam?.name || 'Loading team...'}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              checked={true}
              readOnly
              className="rounded"
            />
            <label className="text-sm text-gray-300">
              Team Need Calculations Active - Player values include team-specific multipliers based on your roster needs
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Team Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-neon-green mb-4">Your Team</h3>
            
            {/* Filters */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <select 
                value={selectedPosition} 
                onChange={e => setSelectedPosition(e.target.value)} 
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
              >
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <input
                type="number"
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                min="1"
                max="100"
              />
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm pr-8"
                />
                <select className="absolute right-0 top-0 h-full bg-gray-900 text-white border border-gray-600 rounded-r px-2 py-2 text-xs">
                  <option>Name</option>
                </select>
              </div>
            </div>

            {/* Player Selection */}
            <div className="mb-4">
              <select 
                value={selectedPlayer} 
                onChange={e => setSelectedPlayer(e.target.value)} 
                className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm mb-2"
              >
                <option value="">Select Player to Add</option>
                {filteredUserPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} – {p.position} - {calculatePlayerValue(p)} pts
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={addGivePlayer} 
                disabled={!selectedPlayer}
                className="w-full bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Player
              </button>
            </div>

            {/* Selected Players */}
            {givePlayers.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-sm text-gray-300">Selected Players:</h4>
                {givePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Image
                        src={getHeadshotUrl()}
                        alt={p.name}
                        width={24}
                        height={24}
                        className="rounded-full bg-white"
                      />
                      <span className="text-sm">{p.name} ({p.position})</span>
                    </div>
                    <button 
                      onClick={() => removeGivePlayer(p.id)} 
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Player List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredUserPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => (
                <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <Image
                      src={getHeadshotUrl()}
                      alt={p.name}
                      width={32}
                      height={32}
                      className="rounded-full bg-white"
                    />
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.position}, {userTeam.name}, Age {p.age || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{p.ovr}</div>
                    <div className="text-xs text-gray-400">Value: {calculatePlayerValue(p)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {Math.ceil(filteredUserPlayers.length / itemsPerPage)}
              </span>
              <button 
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredUserPlayers.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage >= Math.ceil(filteredUserPlayers.length / itemsPerPage)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Team B Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">Team B</h3>
            
            {/* Team Selection */}
            <div className="mb-4">
              <select 
                value={selectedTeamB} 
                onChange={e => setSelectedTeamB(e.target.value)} 
                className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm mb-2"
              >
                <option value="">Select Team</option>
                {teamBOptions.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <select 
                value={selectedReceivePosition} 
                onChange={e => setSelectedReceivePosition(e.target.value)} 
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
              >
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <input
                type="number"
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                min="1"
                max="100"
              />
            </div>

            {/* Player Selection */}
            <div className="mb-4">
              <select 
                value={selectedReceivePlayer} 
                onChange={e => setSelectedReceivePlayer(e.target.value)} 
                className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm mb-2"
                disabled={!selectedTeamB}
              >
                <option value="">Select Player to Add</option>
                {filteredTeamBPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} – {p.position} - {calculatePlayerValue(p)} pts
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={addReceivePlayer} 
                disabled={!selectedReceivePlayer || !selectedTeamB}
                className="w-full bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Player
              </button>
            </div>

            {/* Selected Players */}
            {receivePlayers.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-sm text-gray-300">Selected Players:</h4>
                {receivePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Image
                        src={getHeadshotUrl()}
                        alt={p.name}
                        width={24}
                        height={24}
                        className="rounded-full bg-white"
                      />
                      <span className="text-sm">{p.name} ({p.position})</span>
                    </div>
                    <button 
                      onClick={() => removeReceivePlayer(p.id)} 
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Player List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredTeamBPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {selectedTeamB ? 'No players found.' : 'Select a team to view players.'}
                </div>
              ) : (
                filteredTeamBPlayers.slice((receiveCurrentPage - 1) * itemsPerPage, receiveCurrentPage * itemsPerPage).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Image
                        src={getHeadshotUrl()}
                        alt={p.name}
                        width={32}
                        height={32}
                        className="rounded-full bg-white"
                      />
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.position}, {p.team}, Age {p.age || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{p.ovr}</div>
                      <div className="text-xs text-gray-400">Value: {calculatePlayerValue(p)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <button 
                onClick={() => setReceiveCurrentPage(Math.max(1, receiveCurrentPage - 1))}
                disabled={receiveCurrentPage === 1}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-400">
                Page {receiveCurrentPage} of {Math.ceil(filteredTeamBPlayers.length / itemsPerPage) || 1}
              </span>
              <button 
                onClick={() => setReceiveCurrentPage(Math.min(Math.ceil(filteredTeamBPlayers.length / itemsPerPage) || 1, receiveCurrentPage + 1))}
                disabled={receiveCurrentPage >= (Math.ceil(filteredTeamBPlayers.length / itemsPerPage) || 1)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Trade Offer Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-400 mb-2">Your Team Sending</h4>
            {givePlayers.length === 0 ? (
              <p className="text-gray-400">No players selected</p>
            ) : (
              <div className="space-y-2">
                {givePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <span className="text-sm">{p.name} ({p.position})</span>
                    <span className="text-sm text-gray-400">{calculatePlayerValue(p)} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-400 mb-2">Team B Sending</h4>
            {receivePlayers.length === 0 ? (
              <p className="text-gray-400">No players selected</p>
            ) : (
              <div className="space-y-2">
                {receivePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <span className="text-sm">{p.name} ({p.position})</span>
                    <span className="text-sm text-gray-400">{calculatePlayerValue(p)} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Draft Pick Management */}
        <div className="mt-6 text-center">
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Manage Draft Pick Values in Commissioner Hub
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-400 mb-2">Draft Picks Giving</h4>
            <p className="text-gray-400 mb-2">Add draft picks to trade</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Add Draft Pick
            </button>
            <p className="text-gray-400 mt-2">No draft picks selected</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-purple-400 mb-2">Draft Picks Receiving</h4>
            <p className="text-gray-400 mb-2">Add draft picks to receive</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              + Add Draft Pick
            </button>
            <p className="text-gray-400 mt-2">No draft picks selected</p>
          </div>
        </div>

        {/* Trade Calculation */}
        <div className="mt-6 text-center">
          <div className="bg-gray-700 rounded-lg p-4 inline-block">
            <div className="text-lg font-bold text-white mb-2">
              Net Value: {netValue > 0 ? '+' : ''}{netValue.toFixed(2)}
            </div>
            <div className="text-lg font-bold text-green-400">
              Verdict: {tradeVerdict} ✅
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 text-center">
          <button 
            onClick={handleAnalyzeTrade}
            disabled={givePlayers.length === 0 && receivePlayers.length === 0}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-4"
          >
            Analyze Trade
          </button>
          
          {canSendOffer && (
            <button
              onClick={handleSendOffer}
              disabled={sendingOffer}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingOffer ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                  Sending...
                </>
              ) : (
                'Send Trade Offer'
              )}
            </button>
          )}
        </div>

        {/* Send Trade Offer Section */}
        {canSendOffer && (
          <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <h4 className="text-lg font-semibold text-green-400 mb-4">
              ✅ Trade Analysis Complete - Send Offer
            </h4>
            
            {/* Trade Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 p-3 rounded border border-gray-600">
                <h5 className="font-semibold text-gray-200 mb-2">Your Team Sends</h5>
                <div className="space-y-1">
                  {givePlayers.map(player => (
                    <div key={player.id} className="flex justify-between text-sm">
                      <span>{player.name}</span>
                      <span className="text-gray-400">{player.position}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded border border-gray-600">
                <h5 className="font-semibold text-gray-200 mb-2">You Receive</h5>
                <div className="space-y-1">
                  {receivePlayers.map(player => (
                    <div key={player.id} className="flex justify-between text-sm">
                      <span>{player.name}</span>
                      <span className="text-gray-400">{player.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message to Trading Partner (Optional)
              </label>
              <textarea
                value={tradeMessage}
                onChange={(e) => setTradeMessage(e.target.value)}
                placeholder="Add a message to explain your trade proposal..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-400 mt-1">
                {tradeMessage.length}/500 characters
              </div>
            </div>

            {/* Expiration Settings */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Offer Expires In
              </label>
              <select
                value={expirationHours}
                onChange={(e) => setExpirationHours(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value={24}>24 Hours</option>
                <option value={72}>3 Days</option>
                <option value={168}>1 Week</option>
                <option value={336}>2 Weeks</option>
              </select>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Clear All Button */}
        <div className="mt-6 text-left">
          <button 
            onClick={clearAll}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
