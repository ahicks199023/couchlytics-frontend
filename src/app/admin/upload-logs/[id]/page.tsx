'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type UploadLog = {
  id: number
  userId: number
  leagueName: string
  seasonYear: number
  timestamp: string
  isOverwrite: boolean
  fileHash: string
  ipAddress: string
  skipped: {
    teams: string[]
    players: string[]
    games: string[]
  }
}

export default function UploadLogDetailPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [log, setLog] = useState<UploadLog | null>(null)

  useEffect(() => {
    if (id) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/upload-logs?id=${id}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.log) setLog(data.log)
        })
    }
  }, [id])

  if (!log) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <p>Loading log details...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neon-green mb-6">Upload Log #{log.id}</h1>

        <div className="mb-4 space-y-2 text-sm">
          <p><strong>User ID:</strong> {log.userId}</p>
          <p><strong>League:</strong> {log.leagueName}</p>
          <p><strong>Season:</strong> {log.seasonYear}</p>
          <p><strong>Overwrite:</strong> {log.isOverwrite ? 'Yes' : 'No'}</p>
          <p><strong>IP Address:</strong> {log.ipAddress}</p>
          <p><strong>File Hash:</strong> <code className="text-yellow-400">{log.fileHash}</code></p>
          <p><strong>Uploaded At:</strong> {log.timestamp}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Skipped Data</h2>
          <div className="bg-gray-800 rounded p-4 space-y-2 text-sm">
            <div>
              <strong>Teams:</strong><br />
              {log.skipped.teams.length > 0 ? (
                <ul className="list-disc list-inside text-gray-300">
                  {log.skipped.teams.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              ) : '—'}
            </div>
            <div>
              <strong>Players:</strong><br />
              {log.skipped.players.length > 0 ? (
                <ul className="list-disc list-inside text-gray-300">
                  {log.skipped.players.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              ) : '—'}
            </div>
            <div>
              <strong>Games:</strong><br />
              {log.skipped.games.length > 0 ? (
                <ul className="list-disc list-inside text-gray-300">
                  {log.skipped.games.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              ) : '—'}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

