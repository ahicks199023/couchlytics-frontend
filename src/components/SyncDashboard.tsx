'use client'

import { useEffect, useState } from 'react'
import { API_BASE } from '@/lib/config'

type UploadLog = {
  id: number
  leagueId: number
  leagueName?: string
  fileType: string
  filename: string
  timestamp: string
  email?: string
}

type LeagueFile = {
  name: string
  path: string
  modified: string
}

type SyncStatus = {
  lastImportTime: string
  cooldownSeconds: number
  secondsUntilNextImport: number
  recentUploads: UploadLog[]
  leagueFiles: {
    leagueId: string
    files: LeagueFile[]
  }[]
}

export default function SyncDashboard() {
  const [data, setData] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [forceStatus, setForceStatus] = useState<string | null>(null)

  const fetchStatus = () => {
    setLoading(true)
    fetch(`${API_BASE}/admin/sync-status`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleForceImport = () => {
    setForceStatus("triggering...")
    fetch(`${API_BASE}/admin/force-import`, { method: 'POST' })
      .then(res => res.json())
      .then(res => setForceStatus(res.status || 'done'))
      .catch(() => setForceStatus('error'))
  }

  if (loading) return <div className="p-4">Loading sync status...</div>
  if (!data) return <div className="p-4 text-red-600">Failed to load sync data</div>

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">🛠️ Couchlytics Sync Monitor</h1>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow space-y-2">
        <p>🕒 Last Import: <strong>{data.lastImportTime}</strong></p>
        <p>⏳ Cooldown: <strong>{data.cooldownSeconds}s</strong></p>
        <p>
          {data.secondsUntilNextImport === 0
            ? <span className="text-green-600 font-semibold">✅ Ready to trigger</span>
            : <span className="text-yellow-600">Next import in {data.secondsUntilNextImport}s</span>
          }
        </p>
        <button
          onClick={handleForceImport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🚀 Force Run Import
        </button>
        {forceStatus && <p className="text-sm text-gray-600">Status: {forceStatus}</p>}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">📁 League File Status</h2>
        {data.leagueFiles.map(lf => (
          <div key={lf.leagueId} className="mb-4 p-3 border rounded bg-white dark:bg-gray-900">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300">
              League {lf.leagueId}
            </h3>
            <ul className="ml-4 list-disc">
              {["rosters.json", "league_info.json", "stats.json"].map(name => {
                const match = lf.files.find(f => f.name === name)
                return (
                  <li key={name} className="flex items-center justify-between">
                    <div>
                      {match ? "✅" : "❌"} <strong>{name}</strong>
                      {match && <span className="ml-2 text-sm text-gray-500">({match.modified})</span>}
                    </div>
                    {match && (
                      <a
                        href={`${API_BASE}/${match.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        ⬇ Download
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">📦 Recent Uploads</h2>
        <table className="w-full border text-sm">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="px-2 py-1">Time</th>
              <th className="px-2 py-1">League</th>
              <th className="px-2 py-1">File</th>
              <th className="px-2 py-1">User</th>
            </tr>
          </thead>
          <tbody>
            {data.recentUploads.map(log => (
              <tr key={log.id} className="border-t">
                <td className="px-2 py-1">{log.timestamp}</td>
                <td className="px-2 py-1">{log.leagueName || `#${log.leagueId}`}</td>
                <td className="px-2 py-1">{log.fileType}</td>
                <td className="px-2 py-1">{log.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
