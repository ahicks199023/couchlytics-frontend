'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'

type Player = {
  id: number
  name: string
  team: string
  position: string
  ovr: number
  espnId?: string
  teamId?: number
  user?: string
  devTrait?: string
  age?: number
  yearsPro?: number
}

type TradeResult = {
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

type SuggestedTrade = {
  targetTeam: number
  targetTeamName: string
  verdict: string
  tradeValue: number
  playersOffered: Player[]
  confidence: number
  reasoning: string
}

type User = {
  is_premium?: boolean
  teamId?: number
}

type TradeData = {
  teamId: number
  trade: {
    give: number[]
    receive: number[]
  }
  includeSuggestions: boolean
}

type TradeSuggestion = {
  suggestions: SuggestedTrade[]
}

const getHeadshotUrl = (player: Player) => {
  if (player.espnId) {
    return `/headshots/${player.espnId}.png`
  }
  const sanitized = player.name.toLowerCase().replace(/[^a-z]/g, '')
  return `/headshots/${sanitized}.png`
}

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

export default function TradeCalculatorForm({ league_id }: { league_id: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Trade state
  const [includeSuggestions, setIncludeSuggestions] = useState(false)
  const [result, setResult] = useState<TradeResult | null>(null)
  const [givePlayers, setGivePlayers] = useState<Player[]>([])
  const [receivePlayers, setReceivePlayers] = useState<Player[]>([])
  
  // Filters
  const [selectedTeam, setSelectedTeam] = useState('All')
  const [selectedPosition, setSelectedPosition] = useState('All')
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedReceiveTeam, setSelectedReceiveTeam] = useState('All')
  const [selectedReceivePosition, setSelectedReceivePosition] = useState('All')
  const [selectedReceivePlayer, setSelectedReceivePlayer] = useState('')
  
  // Suggestions
  const [suggestionPlayerId, setSuggestionPlayerId] = useState('')
  const [suggestionStrategy, setSuggestionStrategy] = useState('value')
  const [suggestedTrades, setSuggestedTrades] = useState<SuggestedTrade[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Load user and data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load user info
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${league_id}/trade-tool`, { credentials: 'include' })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }
        
        // Load league players
        const playersRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${league_id}/players`, { credentials: 'include' })
        if (playersRes.ok) {
          const playersData = await playersRes.json()
          setPlayers(playersData.players || [])
        }
        
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load league data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [league_id])

  // Computed values
  const filteredPlayers = useMemo(() => {
    return players.filter(p => 
      (selectedTeam === 'All' || p.team === selectedTeam) &&
      (selectedPosition === 'All' || p.position === selectedPosition)
    ).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))
  }, [players, selectedTeam, selectedPosition])

  const filteredReceivePlayers = useMemo(() => {
    return players.filter(p => 
      (selectedReceiveTeam === 'All' || p.team === selectedReceiveTeam) &&
      (selectedReceivePosition === 'All' || p.position === selectedReceivePosition)
    ).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))
  }, [players, selectedReceiveTeam, selectedReceivePosition])

  const teamOptions = useMemo(() => {
    return ['All', ...new Set(players.map(p => p.team))].sort()
  }, [players])

  const positionOptions = useMemo(() => {
    return ['All', ...new Set(players.map(p => p.position))].sort()
  }, [players])

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
    if (absNet <= 15) return 'Fair'
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

  // Trade suggestions
  const fetchTradeSuggestions = async () => {
    if (!suggestionPlayerId || !user?.teamId) return
    
    setLoadingSuggestions(true)
    setSuggestedTrades([])

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${league_id}/trade-tool`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league_id,
          teamId: user.teamId,
          playerId: parseInt(suggestionPlayerId),
          strategy: suggestionStrategy
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Suggestion fetch failed')
      }

      const data = await res.json() as TradeSuggestion
      setSuggestedTrades(data.suggestions || [])
    } catch (err: unknown) {
      console.error('Suggestion Error:', err instanceof Error ? err.message : 'Unknown error')
      setError('Failed to fetch trade suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const applySuggestedTrade = (suggestion: SuggestedTrade) => {
    const selected = givePlayers.find(p => p.id === parseInt(suggestionPlayerId))
    if (!selected) return
    setGivePlayers([selected])
    setReceivePlayers(suggestion.playersOffered)
  }

  // Submit trade
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.teamId) {
      setError('Unable to determine your team. Please refresh the page.')
      return
    }
    
    setError(null)
    setResult(null)

    try {
      const tradeData: TradeData = {
        teamId: user.teamId,
        trade: {
          give: givePlayers.map(p => p.id),
          receive: receivePlayers.map(p => p.id),
        },
        includeSuggestions
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${league_id}/trade-tool`, {
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

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="p-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Trade Calculator</h2>
          <p className="text-gray-400">Analyze and evaluate potential trades in your league</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trade Summary */}
          {(givePlayers.length > 0 || receivePlayers.length > 0) && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Trade Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-red-400 mb-2">You Give ({giveValue} pts)</h4>
                  <div className="space-y-2">
                    {givePlayers.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <Image
                            src={getHeadshotUrl(p)}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="rounded-full bg-white"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/default-avatar.png'
                            }}
                          />
                          <span>{p.name} ({p.position})</span>
                        </div>
                        <span className="text-sm text-gray-300">{calculatePlayerValue(p)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-green-400 mb-2">You Receive ({receiveValue} pts)</h4>
                  <div className="space-y-2">
                    {receivePlayers.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <Image
                            src={getHeadshotUrl(p)}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="rounded-full bg-white"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/default-avatar.png'
                            }}
                          />
                          <span>{p.name} ({p.position})</span>
                        </div>
                        <span className="text-sm text-gray-300">{calculatePlayerValue(p)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-700 rounded text-center">
                <p className="text-lg">
                  <span className="font-medium">Net Value:</span> 
                  <span className={`ml-2 font-bold ${netValue > 0 ? 'text-green-400' : netValue < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {netValue > 0 ? '+' : ''}{netValue}
                  </span>
                  <span className="ml-4 font-medium">Verdict:</span>
                  <span className={`ml-2 font-bold ${
                    tradeVerdict.includes('Win') ? 'text-green-400' : 
                    tradeVerdict.includes('Lose') ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {tradeVerdict}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Give Players Section */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="font-bold mb-4 text-red-400">Players You Give</h3>
              
              {/* Filters */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <select 
                  value={selectedTeam} 
                  onChange={e => setSelectedTeam(e.target.value)} 
                  className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  {teamOptions.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
                <select 
                  value={selectedPosition} 
                  onChange={e => setSelectedPosition(e.target.value)} 
                  className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  {positionOptions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* Player Selection */}
              <div className="mb-4">
                <select 
                  value={selectedPlayer} 
                  onChange={e => setSelectedPlayer(e.target.value)} 
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Player to Add</option>
                  {filteredPlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} – {p.position} ({p.team}) - {calculatePlayerValue(p)} pts
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={addGivePlayer} 
                  disabled={!selectedPlayer}
                  className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Player
                </button>
              </div>

              {/* Selected Players */}
              {givePlayers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-300">Selected Players:</h4>
                  {givePlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Image
                          src={getHeadshotUrl(p)}
                          alt={p.name}
                          width={24}
                          height={24}
                          className="rounded-full bg-white"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/default-avatar.png'
                          }}
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
            </div>

            {/* Receive Players Section */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="font-bold mb-4 text-green-400">Players You Receive</h3>
              
              {/* Filters */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <select 
                  value={selectedReceiveTeam} 
                  onChange={e => setSelectedReceiveTeam(e.target.value)} 
                  className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  {teamOptions.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
                <select 
                  value={selectedReceivePosition} 
                  onChange={e => setSelectedReceivePosition(e.target.value)} 
                  className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  {positionOptions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* Player Selection */}
              <div className="mb-4">
                <select 
                  value={selectedReceivePlayer} 
                  onChange={e => setSelectedReceivePlayer(e.target.value)} 
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Player to Add</option>
                  {filteredReceivePlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} – {p.position} ({p.team}) - {calculatePlayerValue(p)} pts
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={addReceivePlayer} 
                  disabled={!selectedReceivePlayer}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Player
                </button>
              </div>

              {/* Selected Players */}
              {receivePlayers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-300">Selected Players:</h4>
                  {receivePlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Image
                          src={getHeadshotUrl(p)}
                          alt={p.name}
                          width={24}
                          height={24}
                          className="rounded-full bg-white"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/default-avatar.png'
                          }}
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
            </div>
          </div>

          {/* Trade Suggestions (Premium Feature) */}
          {user?.is_premium && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={includeSuggestions}
                  onChange={e => setIncludeSuggestions(e.target.checked)}
                  className="rounded"
                />
                <label className="font-medium">💡 Enable AI Trade Suggestions</label>
              </div>
              
              {includeSuggestions && givePlayers.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={suggestionPlayerId}
                      onChange={e => setSuggestionPlayerId(e.target.value)}
                      className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="">Select a player from your team</option>
                      {givePlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} – {p.position}
                        </option>
                      ))}
                    </select>
                    <select
                      value={suggestionStrategy}
                      onChange={e => setSuggestionStrategy(e.target.value)}
                      className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="value">Best Value</option>
                      <option value="fairness">Fairness</option>
                      <option value="potential">High Potential</option>
                      <option value="win-now">Win Now</option>
                    </select>
                    <button
                      type="button"
                      onClick={fetchTradeSuggestions}
                      disabled={!suggestionPlayerId || loadingSuggestions}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loadingSuggestions ? 'Loading...' : 'Get Suggestions'}
                    </button>
                  </div>

                  {suggestedTrades.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-3">AI Trade Suggestions:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestedTrades.map((sug, i) => (
                          <div key={i} className="p-4 bg-gray-700 rounded border border-gray-600">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium">{sug.targetTeamName}</h5>
                              <span className={`text-sm px-2 py-1 rounded ${
                                sug.verdict.includes('Win') ? 'bg-green-600' : 
                                sug.verdict.includes('Lose') ? 'bg-red-600' : 'bg-yellow-600'
                              }`}>
                                {sug.verdict}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">
                              Value: {sug.tradeValue} pts | Confidence: {sug.confidence}%
                            </p>
                            <p className="text-xs text-gray-400 mb-3">{sug.reasoning}</p>
                            <div className="space-y-1 mb-3">
                              {sug.playersOffered.map((p: Player) => (
                                <div key={p.id} className="flex items-center gap-2 text-sm">
                                  <Image
                                    src={getHeadshotUrl(p)}
                                    alt={p.name}
                                    width={20}
                                    height={20}
                                    className="rounded-full bg-white"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = '/default-avatar.png'
                                    }}
                                  />
                                  {p.name} ({p.position}) - {calculatePlayerValue(p)} pts
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              onClick={() => applySuggestedTrade(sug)}
                            >
                              Use This Trade
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <button 
              type="submit" 
              disabled={givePlayers.length === 0 && receivePlayers.length === 0}
              className="bg-neon-green text-black px-8 py-3 rounded-lg font-semibold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Trade
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="mt-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Trade Analysis Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="space-y-2">
                <p><span className="font-medium">Team Gives Value:</span> {result.tradeAssessment.teamGives}</p>
                <p><span className="font-medium">Team Receives Value:</span> {result.tradeAssessment.teamReceives}</p>
                <p><span className="font-medium">Net Gain:</span> {result.tradeAssessment.netGain}</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-medium">Verdict:</span> {result.tradeAssessment.verdict}</p>
                <p><span className="font-medium">Auto-Approve:</span> {result.canAutoApprove ? 'Yes' : 'No'}</p>
                {result.riskLevel && (
                  <p><span className="font-medium">Risk Level:</span> {result.riskLevel}</p>
                )}
              </div>
            </div>
            
            {result.tradeAssessment.explanation && (
              <div className="mt-4 p-3 bg-gray-700 rounded">
                <h4 className="font-medium mb-2">Analysis:</h4>
                <p className="text-sm text-gray-300">{result.tradeAssessment.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
