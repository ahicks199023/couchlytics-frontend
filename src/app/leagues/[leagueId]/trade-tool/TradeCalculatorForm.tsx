'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { Loader2, Search, Filter, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

// Types
interface Player {
  id: number
  name: string
  team: string
  position: string
  ovr: number
  teamId?: number
  teamName?: string
  user?: string
  espnId?: string
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

interface User {
  id: number
  email: string
  is_premium?: boolean
  teamId?: number
}

interface TradeResult {
  tradeAssessment: {
    verdict: string
    teamGives: number
    teamReceives: number
    netGain: number
    confidence: number
  }
  canAutoApprove: boolean
  suggestedTrades?: Player[]
  reasoning?: string
}

interface SuggestedTrade {
  targetTeam: number
  targetTeamName: string
  verdict: string
  tradeValue: number
  playersOffered: Player[]
  confidence: number
  reasoning: string
}

interface TradeData {
  league_id: string
  teamId: number
  trade: {
    give: number[]
    receive: number[]
  }
  includeSuggestions: boolean
}

// Utility functions
const calculatePlayerValue = (player: Player): number => {
  let baseValue = player.ovr || 75
  
  // Position multipliers
  const positionMultipliers: Record<string, number> = {
    'QB': 1.2,
    'WR': 1.1,
    'HB': 1.0,
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
    'MLB': 1.0,
    'ROLB': 0.9,
    'CB': 1.0,
    'FS': 0.9,
    'SS': 0.9,
    'K': 0.5,
    'P': 0.4
  }
  
  const multiplier = positionMultipliers[player.position] || 1.0
  
  // Age factor (younger players worth more)
  if (player.age) {
    const ageFactor = Math.max(0.7, 1.0 - (player.age - 22) * 0.02)
    baseValue *= ageFactor
  }
  
  // Development trait bonus
  if (player.devTrait) {
    const devMultipliers: Record<string, number> = {
      'Superstar': 1.3,
      'Star': 1.2,
      'Normal': 1.0,
      'Hidden': 1.1
    }
    baseValue *= devMultipliers[player.devTrait] || 1.0
  }
  
  return Math.round(baseValue * multiplier)
}

const getVerdictColor = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'you win':
    case 'excellent':
      return 'text-green-400'
    case 'fair':
    case 'balanced':
      return 'text-yellow-400'
    case 'you lose':
    case 'poor':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

const getVerdictIcon = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'you win':
    case 'excellent':
      return <CheckCircle className="w-5 h-5 text-green-400" />
    case 'fair':
    case 'balanced':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />
    case 'you lose':
    case 'poor':
      return <XCircle className="w-5 h-5 text-red-400" />
    default:
      return null
  }
}

export default function TradeCalculatorForm({ league_id }: { league_id: string }) {
  // State management
  const [user, setUser] = useState<User | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Trade state
  const [givePlayers, setGivePlayers] = useState<Player[]>([])
  const [receivePlayers, setReceivePlayers] = useState<Player[]>([])
  const [result, setResult] = useState<TradeResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('All')
  const [selectedPosition, setSelectedPosition] = useState('All')
  const [showMyTeamOnly, setShowMyTeamOnly] = useState(false)
  
  // Suggestions
  const [includeSuggestions] = useState(false)
  const [suggestedTrades, setSuggestedTrades] = useState<SuggestedTrade[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestionPlayerId, setSuggestionPlayerId] = useState('')
  const [suggestionStrategy, setSuggestionStrategy] = useState('value')

  // Determine user's team by matching team.user_id to user.id
  const userTeam = teams.find(team => String(team.user_id) === String(user?.id))
  const userTeamId = userTeam?.id

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load user info
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/me`, { 
          credentials: 'include' 
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
          console.log('User object:', userData)
        }
        
        // Load league players
        const playersRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${league_id}/players`, {
          credentials: 'include'
        })
        if (playersRes.ok) {
          const playersData = await playersRes.json()
          setPlayers(playersData.players || [])
          console.log('Players array:', playersData.players)
        } else {
          throw new Error('Failed to load players')
        }
        
        // Load teams
        const teamsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${league_id}/teams`, {
          credentials: 'include'
        })
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json()
          setTeams(teamsData.teams || [])
        } else {
          throw new Error('Failed to load teams')
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
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTeam = selectedTeam === 'All' || p.team === selectedTeam
      const matchesPosition = selectedPosition === 'All' || p.position === selectedPosition
      const matchesMyTeam = !showMyTeamOnly || p.teamId === userTeamId
      
      return matchesSearch && matchesTeam && matchesPosition && matchesMyTeam
    }).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))
  }, [players, searchTerm, selectedTeam, selectedPosition, showMyTeamOnly, userTeamId])

  const availableTeams = useMemo(() => {
    const teamNames = [...new Set(players.map(p => p.team).filter(Boolean))].sort()
    if (teamNames.length === 0) {
      console.warn('No team names found in player data. Team filter will be disabled.')
    }
    return ['All', ...teamNames]
  }, [players])

  const availablePositions = useMemo(() => {
    const positions = [...new Set(players.map(p => p.position))].sort()
    return ['All', ...positions]
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
  const verdict = Math.abs(netValue) <= 15 ? 'Fair' : netValue > 15 ? 'You Lose' : 'You Win'

  // Event handlers
  const addPlayer = useCallback((player: Player, toGive: boolean) => {
    const playerList = toGive ? givePlayers : receivePlayers
    const setPlayerList = toGive ? setGivePlayers : setReceivePlayers
    
    if (!playerList.find(p => p.id === player.id)) {
      setPlayerList([...playerList, player])
    }
  }, [givePlayers, receivePlayers])

  const removePlayer = useCallback((playerId: number, fromGive: boolean) => {
    const setPlayerList = fromGive ? setGivePlayers : setReceivePlayers
    setPlayerList(prev => prev.filter(p => p.id !== playerId))
  }, [])

  const clearTrade = useCallback(() => {
    setGivePlayers([])
    setReceivePlayers([])
    setResult(null)
  }, [])

  const fetchTradeSuggestions = async () => {
    if (!suggestionPlayerId || !userTeamId) return
    
    setLoadingSuggestions(true)
    setSuggestedTrades([])

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${league_id}/trade-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          league_id,
          teamId: userTeamId,
          playerId: parseInt(suggestionPlayerId),
          strategy: suggestionStrategy
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Suggestion fetch failed')
      }

      const data = await res.json()
      setSuggestedTrades(data.suggestions || [])
    } catch (err: unknown) {
      console.error('Suggestion Error:', err instanceof Error ? err.message : 'Unknown error')
      setError('Failed to load trade suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const applySuggestedTrade = useCallback((suggestion: SuggestedTrade) => {
    const selected = givePlayers.find(p => p.id === parseInt(suggestionPlayerId))
    if (!selected) return
    setGivePlayers([selected])
    setReceivePlayers(suggestion.playersOffered)
  }, [givePlayers, suggestionPlayerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userTeamId) {
      console.log('User object when unable to determine team:', user)
      setError('Unable to determine your team. Please refresh the page.')
      return
    }
    
    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const tradeData: TradeData = {
        league_id,
        teamId: userTeamId,
        trade: {
          give: givePlayers.map(p => p.id),
          receive: receivePlayers.map(p => p.id),
        },
        includeSuggestions
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${league_id}/trade-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neon-green" />
          <p className="text-gray-400">Loading league data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (availableTeams.length <= 1) {
    return (
      <div className="text-yellow-400 text-sm mb-2">Team filter is unavailable due to missing team data.</div>
    )
  }

  if (!userTeamId) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-center text-red-400">
        Unable to determine your team. Please refresh the page or contact support.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Trade Calculator</h2>
          <p className="text-gray-400">Evaluate trades and get AI-powered suggestions</p>
        </div>
        <button
          onClick={clearTrade}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Clear Trade
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-green"
            />
          </div>

          {/* Team Filter */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
          >
            {availableTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          {/* Position Filter */}
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
          >
            {availablePositions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          {/* My Team Only Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMyTeamOnly}
              onChange={(e) => setShowMyTeamOnly(e.target.checked)}
              className="w-4 h-4 text-neon-green bg-gray-700 border-gray-600 rounded focus:ring-neon-green"
            />
            <span className="text-gray-300">My Team Only</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Selection */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Available Players</h3>
            
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No players found matching your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => addPlayer(player, true)}
                  >
                    <Image
                      src={'/default-avatar.png'}
                      alt={player.name}
                      width={40}
                      height={40}
                      className="rounded-full bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{player.name}</p>
                      <p className="text-gray-400 text-sm">{player.position} • {player.team}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-neon-green font-bold">{player.ovr}</p>
                      <p className="text-gray-400 text-xs">OVR</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trade Summary */}
        <div className="space-y-4">
          {/* Give Players */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 mb-3">Giving Away</h3>
            {givePlayers.length === 0 ? (
              <p className="text-gray-400 text-sm">No players selected</p>
            ) : (
              <div className="space-y-2">
                {givePlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 p-2 bg-red-900/30 rounded">
                    <Image
                      src={'/default-avatar.png'}
                      alt={player.name}
                      width={40}
                      height={40}
                      className="rounded-full bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{player.name}</p>
                      <p className="text-gray-400 text-xs">{player.position} • {player.ovr} OVR</p>
                    </div>
                    <button
                      onClick={() => removePlayer(player.id, true)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="pt-2 border-t border-red-500/30">
                  <p className="text-red-400 font-bold">Total Value: {giveValue}</p>
                </div>
              </div>
            )}
          </div>

          {/* Receive Players */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Receiving</h3>
            {receivePlayers.length === 0 ? (
              <p className="text-gray-400 text-sm">No players selected</p>
            ) : (
              <div className="space-y-2">
                {receivePlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 p-2 bg-green-900/30 rounded">
                    <Image
                      src={'/default-avatar.png'}
                      alt={player.name}
                      width={40}
                      height={40}
                      className="rounded-full bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{player.name}</p>
                      <p className="text-gray-400 text-xs">{player.position} • {player.ovr} OVR</p>
                    </div>
                    <button
                      onClick={() => removePlayer(player.id, false)}
                      className="text-green-400 hover:text-green-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="pt-2 border-t border-green-500/30">
                  <p className="text-green-400 font-bold">Total Value: {receiveValue}</p>
                </div>
              </div>
            )}
          </div>

          {/* Trade Verdict */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Trade Analysis</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Net Value:</span>
                <span className={`font-bold ${netValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {netValue >= 0 ? '+' : ''}{netValue}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Verdict:</span>
                <div className="flex items-center gap-1">
                  {getVerdictIcon(verdict)}
                  <span className={`font-bold ${getVerdictColor(verdict)}`}>{verdict}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={givePlayers.length === 0 || receivePlayers.length === 0 || submitting}
            className="w-full py-3 bg-neon-green hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Trade...
              </div>
            ) : (
              'Analyze Trade'
            )}
          </button>
        </div>
      </div>

      {/* Trade Suggestions (Premium Feature) */}
      {user?.is_premium && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-neon-green" />
            <h3 className="text-lg font-semibold text-white">AI Trade Suggestions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select
              value={suggestionPlayerId}
              onChange={(e) => setSuggestionPlayerId(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
            >
              <option value="">Select a player to trade</option>
              {givePlayers.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
              ))}
            </select>
            
            <select
              value={suggestionStrategy}
              onChange={(e) => setSuggestionStrategy(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
            >
              <option value="value">Best Value</option>
              <option value="fairness">Fair Trade</option>
              <option value="potential">High Potential</option>
              <option value="needs">Fill Team Needs</option>
            </select>
            
            <button
              onClick={fetchTradeSuggestions}
              disabled={!suggestionPlayerId || loadingSuggestions}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              {loadingSuggestions ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                'Get Suggestions'
              )}
            </button>
          </div>

          {suggestedTrades.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Suggested Trade Packages:</h4>
              {suggestedTrades.map((suggestion, index) => (
                <div key={index} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white">{suggestion.targetTeamName}</h5>
                    <div className="flex items-center gap-2">
                      {getVerdictIcon(suggestion.verdict)}
                      <span className={`font-bold ${getVerdictColor(suggestion.verdict)}`}>
                        {suggestion.verdict}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{suggestion.reasoning}</p>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-gray-400 text-xs">Players Offered:</p>
                      <ul className="text-sm text-white">
                        {suggestion.playersOffered.map((player) => (
                          <li key={player.id} className="flex items-center gap-2">
                            <Image
                              src={'/default-avatar.png'}
                              alt={player.name}
                              width={40}
                              height={40}
                              className="rounded-full bg-white"
                            />
                            {player.name} ({player.position})
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Trade Value: {suggestion.tradeValue}</p>
                      <p className="text-gray-400 text-xs">Confidence: {suggestion.confidence}%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => applySuggestedTrade(suggestion)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition-colors"
                  >
                    Use This Trade
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
          <div className="flex items-center gap-2 mb-4">
            {getVerdictIcon(result.tradeAssessment.verdict)}
            <h3 className="text-xl font-bold text-white">
              Trade Analysis Results
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3">Assessment</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Verdict:</span>
                  <span className={`font-bold ${getVerdictColor(result.tradeAssessment.verdict)}`}>
                    {result.tradeAssessment.verdict}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Gives:</span>
                  <span className="text-white">{result.tradeAssessment.teamGives}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Receives:</span>
                  <span className="text-white">{result.tradeAssessment.teamReceives}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Net Gain:</span>
                  <span className={`font-bold ${result.tradeAssessment.netGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.tradeAssessment.netGain >= 0 ? '+' : ''}{result.tradeAssessment.netGain}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-white">{result.tradeAssessment.confidence}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3">Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Auto-Approve:</span>
                  <span className={result.canAutoApprove ? 'text-green-400' : 'text-red-400'}>
                    {result.canAutoApprove ? 'Yes' : 'No'}
                  </span>
                </div>
                {result.reasoning && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Reasoning:</p>
                    <p className="text-white text-sm">{result.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Notice */}
      {!user?.is_premium && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Premium Feature</span>
          </div>
          <p className="text-gray-300 text-sm">
            Upgrade to Premium to access AI-powered trade suggestions and advanced analytics.
          </p>
        </div>
      )}
    </div>
  )
} 
