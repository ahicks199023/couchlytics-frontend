'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LeagueOnboardingForm() {
  const [leagueName, setLeagueName] = useState('')
  const [externalId, setExternalId] = useState('')
  const [commissionerEmail, setCommissionerEmail] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setWebhookUrl('')
    setMessage('')

    const res = await fetch('/api/register-league', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueName, externalId, commissionerEmail }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      const fullUrl = `${window.location.origin}${data.webhookUrl}`
      setWebhookUrl(fullUrl)
      setMessage(data.message)

      setTimeout(() => {
        router.push(`/leagues/${externalId}`)
      }, 3000)
    } else {
      setMessage(data.error || 'Something went wrong.')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4">Register Your League</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">League Name</label>
          <input
            type="text"
            value={leagueName}
            onChange={e => setLeagueName(e.target.value)}
            required
            className="w-full p-2 rounded border dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Companion App League ID</label>
          <input
            type="text"
            value={externalId}
            onChange={e => setExternalId(e.target.value)}
            required
            className="w-full p-2 rounded border dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Commissioner Email</label>
          <input
            type="email"
            value={commissionerEmail}
            onChange={e => setCommissionerEmail(e.target.value)}
            required
            className="w-full p-2 rounded border dark:bg-gray-800"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Registering...' : 'Register League'}
        </button>
      </form>

      {message && <p className="mt-4 text-green-500 font-semibold">{message}</p>}

      {webhookUrl && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-md font-bold">Your Webhook URL:</h3>
          <code className="block mt-1 text-blue-600 break-all">{webhookUrl}</code>
          <p className="mt-2 text-sm text-gray-600">
            Paste this into the export destination setting inside the Madden Companion App to start syncing.
          </p>
        </div>
      )}
    </div>
  )
}

