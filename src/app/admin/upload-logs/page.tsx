'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import RecalculateButton from '@/components/RecalculateButton'

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

export default function UploadLogsPage() {
  const [logs, setLogs] = useState<UploadLog[]>([])
  const [total, setTotal] = useState<number>(0)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [page, setPage] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)

  const limit = 25

  useEffect(() => {
    fetch('http://localhost:5000/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data?.isAdmin) {
          setIsAdmin(true)
        } else {
          alert('Access denied: Admins only')
        }
      })
      .finally(() => setCheckedAuth(true))
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    const params = new URLSearchParams()
    if (userFilter) params.append('user', userFilter)
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    fetch(`http://localhost:5000/upload-logs?${params.toString()}`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || [])
        setTotal(data.total || 0)
      })
  }, [isAdmin, userFilter, page])

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase()
    const leagueName = (log.leagueName ?? '').toLowerCase()
    const matchesLeague = leagueName.includes(q)
    const inDateRange =
      (!startDate || new Date(log.timestamp) >= startDate) &&
      (!endDate || new Date(log.timestamp) <= endDate)
    return matchesLeague && inDateRange
  })

  const totalPages = Math.ceil(total / limit)

  function exportCSV() {
    const header = ['League', 'Season', 'Overwrite', 'Teams Skipped', 'Players Skipped', 'Games Skipped', 'Timestamp', 'IP']
    const rows = filteredLogs.map(log => [
      log.leagueName,
      log.seasonYear,
      log.isOverwrite ? 'Yes' : 'No',
      log.skipped.teams.join(';'),
      log.skipped.players.join(';'),
      log.skipped.games.join(';'),
      log.timestamp,
      log.ipAddress
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'upload_logs.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!checkedAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">Checking access...</p>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg text-red-500">Access denied.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-neon-green">Upload Logs</h1>
          <div className="flex gap-2">
            <Link href="/upload">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Upload League Data
              </button>
            </Link>
            <RecalculateButton />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center mb-4">
          <input
            type="text"
            placeholder="Search league name..."
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by user ID or email"
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600"
            value={userFilter}
            onChange={(e) => {
              setPage(1)
              setUserFilter(e.target.value)
            }}
          />
          <div className="text-white text-sm">From:</div>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-600"
          />
          <div className="text-white text-sm">To:</div>
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            placeholderText="End Date"
            className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-600"
          />
          <button
            onClick={exportCSV}
            className="bg-neon-green text-black font-semibold px-4 py-2 rounded hover:bg-lime-400"
          >
            Export CSV
          </button>
        </div>

        <table className="w-full text-sm text-left border-collapse mb-6">
          <thead>
            <tr className="border-b border-gray-700 text-neon-green">
              <th className="p-2">League</th>
              <th className="p-2">Season</th>
              <th className="p-2">Overwrite</th>
              <th className="p-2">Skipped</th>
              <th className="p-2">Timestamp</th>
              <th className="p-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                <td className="p-2">
                  <a
                    href={`/admin/upload-logs/${log.id}`}
                    className="text-neon-green underline hover:text-lime-400"
                  >
                    {log.leagueName}
                  </a>
                </td>
                <td className="p-2">{log.seasonYear}</td>
                <td className="p-2">{log.isOverwrite ? '✅' : '—'}</td>
                <td className="p-2">
                  {log.skipped.teams.length + log.skipped.players.length + log.skipped.games.length > 0 ? (
                    <details className="cursor-pointer">
                      <summary className="text-yellow-400 underline">View</summary>
                      <div className="mt-1 text-xs">
                        <div><strong>Teams:</strong> {log.skipped.teams.join(', ') || '—'}</div>
                        <div><strong>Players:</strong> {log.skipped.players.join(', ') || '—'}</div>
                        <div><strong>Games:</strong> {log.skipped.games.join(', ') || '—'}</div>
                      </div>
                    </details>
                  ) : '—'}
                </td>
                <td className="p-2">{log.timestamp}</td>
                <td className="p-2">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            className="bg-gray-700 px-3 py-1 rounded disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-300">Page {page} of {Math.max(totalPages, 1)}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(prev => prev + 1)}
            className="bg-gray-700 px-3 py-1 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  )
}

