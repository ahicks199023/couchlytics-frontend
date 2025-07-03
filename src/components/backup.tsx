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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${leagueId}/trade-tool`, {
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
