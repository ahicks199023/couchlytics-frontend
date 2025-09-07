'use client'

import { useState } from 'react'
import { getLeagueMembers } from '@/lib/api'

export default function TestLeagueMembers() {
  const [leagueId, setLeagueId] = useState('12335716')
  const [results, setResults] = useState<{
    getLeagueMembers?: Record<string, unknown>
    commissioner?: { status: number; data: unknown }
    members?: { status: number; data: unknown }
    timestamp: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testEndpoints = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      console.log('🔍 Testing league members for:', leagueId)
      
      // Test our getLeagueMembers function
      const membersData = await getLeagueMembers(leagueId)
      console.log('🔍 getLeagueMembers result:', membersData)
      
      setResults({
        getLeagueMembers: membersData,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('❌ Test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testDirectAPI = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      console.log('🔍 Testing direct API calls for:', leagueId)
      
      // Test commissioner/users endpoint directly
      const commissionerResponse = await fetch(`https://api.couchlytics.com/leagues/${leagueId}/commissioner/users`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const commissionerData = await commissionerResponse.json()
      console.log('🔍 Commissioner/users response:', commissionerData)
      
      // Test members endpoint directly
      const membersResponse = await fetch(`https://api.couchlytics.com/leagues/${leagueId}/members`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const membersData = await membersResponse.json()
      console.log('🔍 Members response:', membersData)
      
      setResults({
        commissioner: {
          status: commissionerResponse.status,
          data: commissionerData
        },
        members: {
          status: membersResponse.status,
          data: membersData
        },
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('❌ Direct API test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">League Members API Test</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            League ID:
          </label>
          <input
            type="text"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={testEndpoints}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test getLeagueMembers()'}
          </button>
          
          <button
            onClick={testDirectAPI}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Direct API Calls'}
          </button>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-bold mb-2">Test Results</h2>
              <p className="text-sm text-gray-400 mb-4">
                Timestamp: {results.timestamp}
              </p>
              
              {results.getLeagueMembers && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">getLeagueMembers() Result:</h3>
                  <div className="bg-gray-700 p-3 rounded text-sm">
                    <pre>{JSON.stringify(results.getLeagueMembers, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              {results.commissioner && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Commissioner/Users Endpoint:</h3>
                  <div className="bg-gray-700 p-3 rounded text-sm">
                    <p><strong>Status:</strong> {results.commissioner.status}</p>
                    <pre>{JSON.stringify(results.commissioner.data, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              {results.members && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Members Endpoint:</h3>
                  <div className="bg-gray-700 p-3 rounded text-sm">
                    <p><strong>Status:</strong> {results.members.status}</p>
                    <pre>{JSON.stringify(results.members.data, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
