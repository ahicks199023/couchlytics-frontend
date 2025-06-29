'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { API_BASE } from '@/lib/config'

type League = {
  leagueId: number
  name: string
  seasonYear: number
}

export default function DashboardPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(`${API_BASE}/leagues`, {
          credentials: 'include'
        })
        
        if (!res.ok) {
          if (res.status === 401) {
            setError('Please log in to view your dashboard.')
          } else {
            setError('Failed to load leagues.')
          }
          setLoading(false)
          return
        }

        const data = await res.json()
        setLeagues(data)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch leagues:', err)
        setError('Failed to load leagues.')
        setLoading(false)
      }
    }

    fetchLeagues()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-gray-400">Loading your leagues...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
          {error.includes('log in') && (
            <Link href="/login" className="text-blue-400 hover:underline mt-2 inline-block">
              Go to Login
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {leagues.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Couchlytics!</h2>
          <p className="text-gray-400 mb-4">
            You don&apos;t have any leagues yet. Get started by creating or joining a league.
          </p>
          <div className="space-x-4">
            <Link 
              href="/leagues/create" 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg inline-block"
            >
              Create League
            </Link>
            <Link 
              href="/leagues" 
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg inline-block"
            >
              Browse Leagues
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Leagues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map((league) => (
              <Link
                key={league.leagueId}
                href={`/leagues/${league.leagueId}`}
                className="bg-gray-900 hover:bg-gray-800 rounded-lg p-4 transition-colors"
              >
                <h3 className="text-lg font-semibold mb-2">{league.name}</h3>
                <p className="text-gray-400">Season {league.seasonYear}</p>
                <div className="mt-3 text-sm text-blue-400">
                  View League →
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 
