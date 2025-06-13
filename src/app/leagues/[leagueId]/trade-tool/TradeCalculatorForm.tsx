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

const getHeadshotUrl = (playerName: string) => {
  const sanitized = playerName.toLowerCase().replace(/[^a-z]/g, '')
  return `/headshots/${sanitized}.png`
}


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
  
  type SuggestedTrade = {
    targetTeam: number
    verdict: string
    tradeValue: number
    playersOffered: Player[]
  }
  
  const [suggestedTrades, setSuggestedTrades] = useState<SuggestedTrade[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    fetch('${process.env.NEXT_PUBLIC_API_BASE}/me', { credentials: 'include' })
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/trade-calculate`, {
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
         throw new Error(errorText || 'Trade calculation failed')
      }
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Suggestion fetch failed')
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSuggestedTrades(data.suggestions || [])
    } catch (err: any) {
      console.error('Suggestion Error:', err.message)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/trade-calculate`, {
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

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Trade Calculator</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Selection & Inputs */}
          <div>
            <label className="block text-sm font-medium">Your Team ID</label>
            <input
              type="text"
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Give */}
            <div className="bg-gray-800 p-4 rounded shadow text-white">
              <h3 className="font-bold mb-2">Give Players</h3>
              <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1 w-full mb-2">
                {teams.map(team => <option key={team} value={team}>{team}</option>)}
              </select>
              <select value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)} className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1 w-full mb-2">
                {positions(selectedTeam).map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
              <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1 w-full mb-2">
                <option value="">Select Player</option>
                {players(selectedTeam, selectedPosition).map(p => (
                  <option key={p.id} value={p.id}>{p.name} – {p.position} (OVR {p.ovr})</option>
                ))}
              </select>
              <button type="button" onClick={addGivePlayer} className="bg-blue-600 text-white px-4 py-1 rounded">+ Add</button>
              <ul className="mt-3 space-y-1">
                {givePlayers.map(p => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img src={getHeadshotUrl(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-white" onError={(e) => (e.currentTarget.src = '/headshots/fallback.png')} />
                      <span>{p.name} – {p.position} (OVR {p.ovr})</span>
                    </div>
                    <button onClick={() => removeGivePlayer(p.id)} className="text-red-600 hover:underline">✕</button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-medium">Total: {getTotalValue(givePlayers)}</p>
            </div>

            {/* Receive */}
            <div className="bg-gray-800 p-4 rounded shadow text-white">
              <h3 className="font-bold mb-2">Receive Players</h3>
              <select value={selectedReceiveTeam} onChange={e => setSelectedReceiveTeam(e.target.value)} className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1 w-full mb-2">
                {teams.map(team => <option key={team} value={team}>{team}</option>)}
              </select>
              <select value={selectedReceivePosition} onChange={e => setSelectedReceivePosition(e.target.value)} className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1 w-full mb-2">
                {positions(selectedReceiveTeam).map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
              <select value={selectedReceivePlayer} onChange={e => setSelectedReceivePlayer(e.target.value)} className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1 w-full mb-2">
                <option value="">Select Player</option>
                {players(selectedReceiveTeam, selectedReceivePosition).map(p => (
                  <option key={p.id} value={p.id}>{p.name} – {p.position} (OVR {p.ovr})</option>
                ))}
              </select>
              <button type="button" onClick={addReceivePlayer} className="bg-green-600 text-white px-4 py-1 rounded">+ Add</button>
              <ul className="mt-3 space-y-1">
                {receivePlayers.map(p => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img src={getHeadshotUrl(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-white" onError={(e) => (e.currentTarget.src = '/headshots/fallback.png')} />
                      <span>{p.name} – {p.position} (OVR {p.ovr})</span>
                    </div>
                    <button onClick={() => removeReceivePlayer(p.id)} className="text-red-600 hover:underline">✕</button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-medium">Total: {getTotalValue(receivePlayers)}</p>
            </div>
          </div>

          {/* Verdict */}
          <div className="mt-4 text-center">
            <p className="text-lg">
              <strong>Net Value:</strong> {net} — <strong>Verdict:</strong> {verdict}
            </p>
          </div>

          {/* Suggestions */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeSuggestions}
              onChange={e => setIncludeSuggestions(e.target.checked)}
              disabled={!user?.is_premium}
            />
            <label>
              Include Suggestions (Premium)
              {!user?.is_premium && <span className="text-sm text-yellow-600 ml-2">(Upgrade to enable)</span>}
            </label>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>

          {includeSuggestions && user?.is_premium && (
            <div className="mt-6 bg-white text-black p-4 rounded">
              <h3 className="font-bold mb-2">💡 Trade Suggestion Engine</h3>
              <div className="grid grid-cols-3 gap-4">
                <select
                  value={suggestionPlayerId}
                  onChange={e => setSuggestionPlayerId(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="">Select a player from your team</option>
                  {givePlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} – {p.position} (OVR {p.ovr})</option>
                  ))}
                </select>
                <select
                  value={suggestionStrategy}
                  onChange={e => setSuggestionStrategy(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="value">Best Value</option>
                  <option value="fairness">Fairness</option>
                  <option value="potential">High Potential</option>
                </select>
                <button
                  type="button"
                  onClick={fetchTradeSuggestions}
                  className="bg-purple-600 text-white px-4 py-2 rounded"
                  disabled={!suggestionPlayerId}
                >
                  {loadingSuggestions ? 'Loading...' : 'Get Suggestions'}
                </button>
              </div>

              {suggestedTrades.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Suggested Trade Packages:</h4>
                  <ul className="space-y-2">
                    {suggestedTrades.map((sug, i) => (
                      <li key={i} className="p-3 bg-gray-100 rounded text-black">
                        <p className="font-bold">Opponent Team ID: {sug.targetTeam}</p>
                        <p>Verdict: <strong>{sug.verdict}</strong> — Total Value: {sug.tradeValue}</p>
                        <ul className="list-disc list-inside">
                          {sug.playersOffered.map((p: Player) => (
                            <li key={p.id}>{p.name} – {p.position} (OVR {p.ovr})</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="bg-blue-600 text-white px-3 py-1 mt-2 rounded"
                          onClick={() => applySuggestedTrade(sug)}
                        >
                          Use This Trade
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
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
