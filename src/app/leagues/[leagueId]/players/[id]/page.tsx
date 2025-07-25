// src/app/leagues/[leagueId]/players/[playerId]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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
    if (!leagueId || leagueId === 'undefined') {
      setError('Invalid or missing league ID.')
      return
    }
    setLoading(true)
    console.log('Fetching player details for:', { leagueId, playerId })
    
    fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
      .then((data) => {
        console.log('Player data received:', data)
        setPlayer(data as Player)
      })
      .catch((err) => {
        console.error('Failed to load player:', err)
        setError(`Failed to load player (ID: ${playerId}). Player may not exist in this league.`)
      })
      .finally(() => setLoading(false))
  }, [leagueId, playerId])

  if (error) return (
    <main className="min-h-screen bg-black text-white p-6">
      <Link href={`/leagues/${leagueId}/players`} className="text-blue-400 hover:underline mb-4 block">
        Back to Players
      </Link>
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h2 className="text-red-400 font-semibold mb-2">Player Not Found</h2>
        <p className="text-red-300">{error}</p>
        <p className="text-gray-400 mt-2">The player ID &quot;{playerId}&quot; may not exist in this league.</p>
      </div>
    </main>
  )
  if (loading) return <main className="p-6 text-white">Loading player...</main>
  if (!player) return <main className="p-6 text-red-400">{error || 'No data found.'}</main>

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <Link href={`/leagues/${leagueId}/players`} className="text-blue-400 hover:underline mb-4 block">
        Back to Players
      </Link>
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
