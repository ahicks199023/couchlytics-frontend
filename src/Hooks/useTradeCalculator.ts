import { useState, useEffect, useCallback } from 'react'
import { Player, Team, User, TradeResult, SuggestedTrade, TradeData } from '@/types/player'
import { API_BASE } from '@/lib/config'

// Utility function for calculating player value
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

export const useTradeCalculator = (leagueId: string) => {
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
  
  // Suggestions
  const [suggestedTrades, setSuggestedTrades] = useState<SuggestedTrade[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Determine user's team by matching team.user_id to user.id
  const userTeam = teams.find(team => String(team.user_id) === String(user?.id))
  const userTeamId = userTeam?.id

  // Load initial data
  useEffect(() => {
    if (!leagueId || leagueId === 'undefined') {
      setError('Invalid or missing league ID.');
      setLoading(false);
      return;
    }
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load user info
        const userRes = await fetch(`${API_BASE}/me`, { credentials: 'include' })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }
        
        // Load league players
        const playersRes = await fetch(`${API_BASE}/leagues/${leagueId}/players?page=1&pageSize=5000`, { credentials: 'include' })
        if (playersRes.ok) {
          const playersData = await playersRes.json()
          setPlayers(playersData.players || [])
        } else {
          throw new Error('Failed to load players')
        }
        
        // Load teams
        const teamsRes = await fetch(`${API_BASE}/leagues/${leagueId}/teams`, { credentials: 'include' })
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
  }, [leagueId])

  // Computed values
  const giveValue = givePlayers.reduce((sum, p) => sum + calculatePlayerValue(p), 0)
  const receiveValue = receivePlayers.reduce((sum, p) => sum + calculatePlayerValue(p), 0)
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
    setSuggestedTrades([])
  }, [])

  const fetchTradeSuggestions = useCallback(async (playerId: string, strategy: string) => {
    if (!playerId || !userTeamId) return
    
    setLoadingSuggestions(true)
    setSuggestedTrades([])

    try {
      const res = await fetch(`${API_BASE}/leagues/${leagueId}/trade-tool`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId,
          teamId: userTeamId,
          playerId: parseInt(playerId),
          strategy
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
  }, [leagueId, userTeamId])

  const applySuggestedTrade = useCallback((suggestion: SuggestedTrade, playerId: string) => {
    const selected = givePlayers.find(p => p.id === parseInt(playerId))
    if (!selected) return
    setGivePlayers([selected])
    setReceivePlayers(suggestion.playersOffered)
  }, [givePlayers])

  const handleSubmit = useCallback(async (includeSuggestions: boolean) => {
    if (!userTeamId) {
      setError('Please select your team first')
      return
    }
    
    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const tradeData: TradeData = {
        leagueId: String(leagueId),
        teamId: userTeamId,
        trade: {
          give: givePlayers.map(p => p.id),
          receive: receivePlayers.map(p => p.id),
        },
        includeSuggestions
      }

      const res = await fetch(`${API_BASE}/leagues/${leagueId}/trade-tool`, {
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
    } finally {
      setSubmitting(false)
    }
  }, [leagueId, userTeamId, givePlayers, receivePlayers])

  return {
    // State
    user,
    players,
    teams,
    loading,
    error,
    givePlayers,
    receivePlayers,
    result,
    submitting,
    suggestedTrades,
    loadingSuggestions,
    userTeamId,
    
    // Computed values
    giveValue,
    receiveValue,
    netValue,
    verdict,
    
    // Actions
    addPlayer,
    removePlayer,
    clearTrade,
    fetchTradeSuggestions,
    applySuggestedTrade,
    handleSubmit,
    setError
  }
} 
