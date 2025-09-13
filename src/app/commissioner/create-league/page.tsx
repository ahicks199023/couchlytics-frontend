'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/Hooks/useAuth'

export default function CreateLeaguePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    seasonYear: new Date().getFullYear(),
    description: '',
    maxTeams: 32,
    isPrivate: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/leagues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/leagues/${data.league_id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create league')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New League</h1>
          <p className="text-gray-400">Set up your Madden league with custom settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              League Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none"
              placeholder="Enter league name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Season Year *
            </label>
            <input
              type="number"
              value={formData.seasonYear}
              onChange={(e) => setFormData(prev => ({ ...prev, seasonYear: parseInt(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none"
              min="2020"
              max="2030"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none h-24 resize-none"
              placeholder="Describe your league..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Teams
            </label>
            <select
              value={formData.maxTeams}
              onChange={(e) => setFormData(prev => ({ ...prev, maxTeams: parseInt(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none"
            >
              <option value={8}>8 Teams</option>
              <option value={12}>12 Teams</option>
              <option value={16}>16 Teams</option>
              <option value={20}>20 Teams</option>
              <option value={24}>24 Teams</option>
              <option value={28}>28 Teams</option>
              <option value={32}>32 Teams</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
              className="w-4 h-4 text-neon-green bg-gray-800 border-gray-700 rounded focus:ring-neon-green"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-300">
              Private League (requires invitation to join)
            </label>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-6 py-3 bg-neon-green hover:bg-green-400 text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create League'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
