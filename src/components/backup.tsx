'use client'

import { useState, useEffect } from 'react'

type Player = {
  id: number
  name: string
  team: string
  position: string
  ovr: number
}

type TradeResult = {
  tradeAssessment: {
    verdict: string
    teamGives: number
    teamReceives: number
    netGain: number
  }
  canAutoApprove: boolean
  suggestedTrades?: Player[]
}

const mockPlayers: Player[] = [
  { id: 1, name: 'Tyreek Hill', team: 'MIA', position: 'WR', ovr: 97 },
  { id: 2, name: 'Jaylen Waddle', team: 'MIA', position: 'WR', ovr: 93 },
  { id: 3, name: 'Raheem Mostert', team: 'MIA', position: 'RB', ovr: 88 },
  { id: 4, name: 'Josh Allen', team: 'BUF', position: 'QB', ovr: 96 },
  { id: 5, name: 'Stefon Diggs', team: 'BUF', position: 'WR', ovr: 95 },
  { id: 6, name: 'Dalvin Cook', team: 'BUF', position: 'RB', ovr: 89 },
  { id: 7, name: 'CeeDee Lamb', team: 'DAL', position: 'WR', ovr: 94 },
  { id: 8, name: 'Tony Pollard', team: 'DAL', position: 'RB', ovr: 90 },
]

export default function TradeCalculatorForm({ leagueId }: { leagueId: number }) {
  const [teamId, setTeamId] = useState(String(leagueId))
  const [user, setUser] = useState<{ is_premium?: boolean } | null>(null)
  const [includeSuggestions, setIncludeSuggestions] = useState(false)
  const [result, setResult] = useState<TradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [givePlayers, setGivePlayers] = useState<Player[]>([])

  const [selectedReceiveTeam, setSelectedReceiveTeam] = useState('')
  const [selectedReceivePosition, setSelectedReceivePosition] = useState('')
  const [selectedReceivePlayer, setSelectedReceivePlayer] = useState('')
  const [receivePlayers, setReceivePlayers] = useState<Player[]>([])

  const [suggestionPlayerId, setSuggestionPlayerId] = useState('')
  const [suggestionStrategy, setSuggestionStrategy] = useState('value')
  const [suggestedTrades, setSuggestedTrades] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/me', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  const getPlayerValue = (p: Player) => p.ovr || 75
  const getTotalValue = (list: Player[]) => list.reduce((sum, p) => sum + getPlayerValue(p), 0)

  const teams = ['All', ...new Set(mockPlayers.map(p => p.team))]
  const positions = (team: string) => ['All', ...new Set(mockPlayers.filter(p => team === 'All' || p.team === team).map(p => p.position))]
  const players = (team: string, position: string) =>
    mockPlayers
      .filter(p => (team === 'All' || p.team === team) && (position === 'All' || p.position === position))
      .sort((a, b) => getPlayerValue(b) - getPlayerValue(a))

  const addGivePlayer = () => {
    const found = mockPlayers.find(p => p.id === parseInt(selectedPlayer))
    if (found && !givePlayers.find(p => p.id === found.id)) {
      setGivePlayers([...givePlayers, found])
    }
  }

  const removeGivePlayer = (id: number) => {
    setGivePlayers(givePlayers.filter(p => p.id !== id))
  }

  const addReceivePlayer = () => {
    const found = mockPlayers.find(p => p.id === parseInt(selectedReceivePlayer))
    if (found && !receivePlayers.find(p => p.id === found.id)) {
      setReceivePlayers([...receivePlayers, found])
    }
  }

  const removeReceivePlayer = (id: number) => {
    setReceivePlayers(receivePlayers.filter(p => p.id !== id))
  }

  const net = getTotalValue(receivePlayers) - getTotalValue(givePlayers)
  const verdict = Math.abs(net) <= 10 ? 'Fair' : net > 10 ? 'You Lose' : 'You Win'
  const fetchTradeSuggestions = async () => {
    setLoadingSuggestions(true)
    setSuggestedTrades([])

    try {
      const res = await fetch('http://localhost:5000/trade-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leagueId,
          teamId: parseInt(teamId),
          playerId: parseInt(suggestionPlayerId),
          strategy: suggestionStrategy
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText)
      }

      const data = await res.json()
      setSuggestedTrades(data.suggestions || [])
    } catch (err: any) {
      console.error('Suggestion Error:', err.message)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const useSuggestedTrade = (suggestion: any) => {
    const selected = givePlayers.find(p => p.id === parseInt(suggestionPlayerId))
    if (!selected) return

    setGivePlayers([selected])
    setReceivePlayers(suggestion.playersOffered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    try {
      const res = await fetch('http://localhost:5000/trade-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teamId: parseInt(teamId),
          trade: {
            give: givePlayers.map(p => p.id),
            receive: receivePlayers.map(p => p.id),
          },
          includeSuggestions
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText)
      }

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Unexpected error')
    }
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Trade Calculator</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* The rest of your form remains unchanged */}
        </form>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        {result && (
          <div className="mt-6 bg-gray-100 p-4 rounded text-black">
            <h3 className="text-lg font-semibold mb-2">Trade Verdict: {result.tradeAssessment.verdict}</h3>
            <p>Team Gives Value: {result.tradeAssessment.teamGives}</p>
            <p>Team Receives Value: {result.tradeAssessment.teamReceives}</p>
            <p>Net Gain: {result.tradeAssessment.netGain}</p>
            <p className="mt-2 font-medium">Auto-Approve: {result.canAutoApprove ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
