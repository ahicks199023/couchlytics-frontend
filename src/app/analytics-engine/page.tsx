'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsEnginePage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/me', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((user) => {
        if (user?.is_premium) {
          setAuthorized(true)
        } else {
          router.push('/upgrade')
        }
      })
      .catch(() => router.push('/upgrade'))
  }, [])

  if (!authorized) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white p-8">
      <h1 className="text-4xl font-bold mb-4 text-center">Analytics Engine</h1>
      <p className="text-center text-gray-300 max-w-2xl mx-auto mb-10">
        Dive deep into advanced metrics, league trends, and predictive models to stay ahead of your opponents.
      </p>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Player Efficiency Index</h2>
          <p className="text-sm text-gray-300">Evaluate players by advanced performance algorithms powered by gameplay data.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Matchup Predictors</h2>
          <p className="text-sm text-gray-300">Simulate upcoming matchups with real-time performance scoring engines.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">League Heatmaps</h2>
          <p className="text-sm text-gray-300">Spot trends in scoring, turnover rates, and player usage by team.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Playcall Tendencies</h2>
          <p className="text-sm text-gray-300">Break down formation usage and play frequency by opponent.</p>
        </div>
      </section>
    </main>
  )
}
