'use client'

import { useState } from 'react'

export default function CreateLeaguePage() {
  const [name, setName] = useState('')
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear())
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    leagueId: number
    externalId: string
    syncUrl: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, seasonYear }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
    } else {
      setResult({
        leagueId: data.league_id,
        externalId: data.external_id,
        syncUrl: data.sync_url,
      })
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Create New League</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">League Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Season Year</label>
            <input
              type="number"
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded"
            />
          </div>

          <button
            type="submit"
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-300"
          >
            Create League
          </button>
        </form>

        {error && <div className="text-red-500 mt-4">❌ {error}</div>}

        {result && (
          <div className="mt-6 bg-green-800 text-green-100 p-4 rounded">
            <p>✅ League created successfully!</p>
            <p><strong>League ID:</strong> {result.leagueId}</p>
            <p><strong>External ID:</strong> {result.externalId}</p>
            <p><strong>Sync URL:</strong></p>
            <pre className="bg-green-900 p-2 rounded mt-1 text-sm overflow-x-auto">
              {result.syncUrl}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}
