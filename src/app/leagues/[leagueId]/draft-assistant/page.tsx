'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DraftAssistantPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/me`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((user) => {
        if (user?.isPremium) {
          setAuthorized(true)
        } else {
          router.push('/upgrade')
        }
      })
      .catch(() => router.push('/upgrade'))
  }, [router])

  if (!authorized) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white p-8">
      <h1 className="text-4xl font-bold mb-4 text-center">Draft Assistant</h1>
      <p className="text-center text-gray-300 max-w-2xl mx-auto mb-10">
        Draft smarter with real-time suggestions, sleeper detection, and team-building tools.
      </p>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Top Available by Value</h2>
          <p className="text-sm text-gray-300">Sort players by positional scarcity and long-term upside.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Scheme Fit Recommender</h2>
          <p className="text-sm text-gray-300">Get AI-based matches for your team identity and coaching style.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Draft Board Builder</h2>
          <p className="text-sm text-gray-300">Create and manage a prioritized board across multiple rounds.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Sleeper Alerts</h2>
          <p className="text-sm text-gray-300">Identify hidden gems based on raw attributes and development traits.</p>
        </div>
      </section>
    </main>
  )
}

    </main>
  )
}
