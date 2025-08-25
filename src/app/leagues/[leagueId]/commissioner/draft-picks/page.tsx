'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DraftPickValueManager from '@/components/draft-picks/DraftPickValueManager'
import { API_BASE } from '@/lib/config'

export default function DraftPickValuesPage() {
  const { leagueId } = useParams()
  const [hasCommissionerAccess, setHasCommissionerAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true)
        const userRes = await fetch(`${API_BASE}/auth/user`, {
          credentials: 'include'
        })
        
        if (userRes.ok) {
          const userData = await userRes.json()
          
          // Check if user is a developer (universal access)
          const isDev = userData.isDeveloper || userData.email === 'antoinehickssales@gmail.com'
          
          // Check if user is a league commissioner
          const isLeagueComm = userData.isCommissioner || false
          
          setHasCommissionerAccess(isDev || isLeagueComm)
        }
      } catch (error) {
        console.error('Error checking commissioner access:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto"></div>
            <p className="mt-4 text-gray-400">Checking access...</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has commissioner access
  if (!hasCommissionerAccess) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
            <p className="text-red-300">
              You do not have permission to access Draft Pick Values. Only league commissioners can view this page.
            </p>
            <div className="mt-4">
              <Link
                href={`/leagues/${leagueId}`}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                ← Back to League Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/leagues/${leagueId}/commissioner`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Commissioner Hub
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">🏈 Draft Pick Values</h1>
          <p className="text-gray-400 text-lg">
            Customize draft pick values for your league. Set individual values for each round and pick combination.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Picks</h3>
            <p className="text-3xl font-bold text-neon-green">224</p>
            <p className="text-sm text-gray-500">7 rounds × 32 picks</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Customization</h3>
            <p className="text-3xl font-bold text-blue-400">Full Control</p>
            <p className="text-sm text-gray-500">Set any value you want</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Year Multipliers</h3>
            <p className="text-3xl font-bold text-purple-400">Flexible</p>
            <p className="text-sm text-gray-500">Adjust for future years</p>
          </div>
        </div>

        {/* Draft Pick Value Manager */}
        <DraftPickValueManager 
          leagueId={leagueId as string}
          onValuesUpdated={() => {
            console.log('Draft pick values updated successfully!')
          }}
        />

        {/* Help Section */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">💡 How Draft Pick Values Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Base Values</h3>
              <p className="text-gray-400 mb-3">
                Each draft pick has a base value that represents its worth in your league. 
                Higher picks (R1P1, R1P2) typically have higher values than lower picks.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• R1P1: Usually the highest value (e.g., 1000)</li>
                <li>• R1P2: Slightly lower (e.g., 980)</li>
                <li>• R2P1: Next tier down (e.g., 800)</li>
                <li>• And so on...</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Year Multipliers</h3>
              <p className="text-gray-400 mb-3">
                Future draft picks are worth less than current year picks. 
                You can customize these multipliers in the League Settings.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Current Year: 1.0x (full value)</li>
                <li>• Next Year: 1.0x (full value)</li>
                <li>• Future Years: 0.25x (25% of value)</li>
                <li>• Beyond Future: 0.25x (25% of value)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                // This will be handled by the DraftPickValueManager component
                const resetButton = document.querySelector('[onclick*="resetToDefaults"]') as HTMLButtonElement
                if (resetButton) resetButton.click()
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Reset to Default Values
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              📊 Export Values
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              📥 Import Values
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
