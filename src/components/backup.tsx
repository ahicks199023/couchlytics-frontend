'use client'

import { useState } from 'react'

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

export default function TradeCalculatorForm({ leagueId }: { leagueId: number }) {
  const [result, setResult] = useState<TradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const givePlayers: Player[] = []

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
          teamId: leagueId,
          trade: {
            give: givePlayers.map(p => p.id),
          },
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText)
      }

      const data = await res.json()
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
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
