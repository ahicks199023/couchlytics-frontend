// src/app/leagues/[leagueId]/players/[playerId]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchFromApi } from '@/lib/api'

interface Player {
  id: number
  name: string
  position: string
  teamName?: string
  overall?: number
  speed?: number
  devTrait?: string
  value?: number
  [key: string]: string | number | undefined
}

export default function PlayerDetailPage() {
  const { leagueId, id: playerId } = useParams()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId || !playerId) return
    setLoading(true)
    fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
      .then((data) => setPlayer(data as Player))
      .catch(() => setError('Failed to load player.'))
      .finally(() => setLoading(false))
  }, [leagueId, playerId])

  if (loading) return <main className="p-6 text-white">Loading player...</main>
  if (error || !player) return <main className="p-6 text-red-400">{error || 'No data found.'}</main>

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">{player.name}</h1>
      <div className="mb-2">Position: {player.position}</div>
      <div className="mb-2">Team: {player.teamName}</div>
      <div className="mb-2">Overall: {player.overall ?? '-'}</div>
      <div className="mb-2">Speed: {player.speed ?? '-'}</div>
      <div className="mb-2">Dev Trait: {player.devTrait ?? '-'}</div>
      <div className="mb-2">Value: {player.value ?? '-'}</div>
      {/* Add more player details as needed */}
    </main>
  )
}
