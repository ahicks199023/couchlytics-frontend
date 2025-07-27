'use client'

import { useEffect, useState } from 'react'
import { API_BASE, authenticatedFetch } from '@/lib/config'
import { TeamDetailResponse } from '@/types/analytics'

export default function TestTeamDetailPage() {
  const [teamData, setTeamData] = useState<TeamDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<{ status: number; data: unknown } | null>(null)

  // Test with a specific team ID
  const leagueId = '12335716'
  const teamId = '6' // Titans team ID

  useEffect(() => {
    const testTeamApi = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Test the new single team detail endpoint
        console.log('[TestTeamDetail] Testing team detail endpoint...')
        const detailResponse = await authenticatedFetch(`${API_BASE}/leagues/${leagueId}/teams/${teamId}/detail`)
        
        setApiStatus({ status: detailResponse.status, data: null })
        
        if (detailResponse.ok) {
          const data = await detailResponse.json()
          setTeamData(data)
          setApiStatus({ status: detailResponse.status, data })
          console.log('[TestTeamDetail] Team detail data:', data)
          
          // Specifically inspect the roster, depthChart, and onTheBlock fields
          console.log('[TestTeamDetail] === ROSTER DATA INSPECTION ===')
          console.log('roster field exists:', 'roster' in data)
          console.log('roster type:', typeof data.roster)
          console.log('roster value:', data.roster)
          console.log('roster length:', Array.isArray(data.roster) ? data.roster.length : 'N/A')
          if (Array.isArray(data.roster) && data.roster.length > 0) {
            console.log('First roster item:', data.roster[0])
          }
          
          console.log('[TestTeamDetail] === DEPTH CHART DATA INSPECTION ===')
          console.log('depthChart field exists:', 'depthChart' in data)
          console.log('depthChart type:', typeof data.depthChart)
          console.log('depthChart value:', data.depthChart)
          if (data.depthChart && typeof data.depthChart === 'object') {
            console.log('depthChart keys:', Object.keys(data.depthChart))
            console.log('depthChart entries:', Object.entries(data.depthChart))
          }
          
          console.log('[TestTeamDetail] === ON THE BLOCK DATA INSPECTION ===')
          console.log('onTheBlock field exists:', 'onTheBlock' in data)
          console.log('onTheBlock type:', typeof data.onTheBlock)
          console.log('onTheBlock value:', data.onTheBlock)
          console.log('onTheBlock length:', Array.isArray(data.onTheBlock) ? data.onTheBlock.length : 'N/A')
          if (Array.isArray(data.onTheBlock) && data.onTheBlock.length > 0) {
            console.log('First onTheBlock item:', data.onTheBlock[0])
          }
          
          console.log('[TestTeamDetail] === ALL DATA KEYS ===')
          console.log('All response keys:', Object.keys(data))
          
        } else {
          console.error('[TestTeamDetail] Team detail failed:', detailResponse.status)
          const errorText = await detailResponse.text()
          console.error('[TestTeamDetail] Error response:', errorText)
        }

      } catch (err) {
        console.error('[TestTeamDetail] Test failed:', err)
        setError('Failed to test team API')
      } finally {
        setLoading(false)
      }
    }

    testTeamApi()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Testing Team Detail API</h1>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Testing Team Detail API</h1>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Testing Team Detail API</h1>
      
      {/* API Status */}
      <div className="bg-gray-900 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-neon-green mb-2">API Response Status</h2>
        <p>Status: {apiStatus?.status}</p>
        <p>League ID: {leagueId}</p>
        <p>Team ID: {teamId}</p>
      </div>

      {/* Team Data Summary */}
      {teamData && (
        <div className="bg-gray-900 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-neon-green mb-2">Team Data Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Team Name:</strong> {teamData.team.name}</p>
              <p><strong>Record:</strong> {teamData.team.record}</p>
              <p><strong>Owner:</strong> {teamData.team.user}</p>
              <p><strong>Roster Count:</strong> {teamData.team.rosterCount}</p>
            </div>
            <div>
              <p><strong>Division:</strong> {teamData.team.division}</p>
              <p><strong>Conference:</strong> {teamData.team.conference}</p>
              <p><strong>Offense Scheme:</strong> {teamData.team.offenseScheme}</p>
              <p><strong>Defense Scheme:</strong> {teamData.team.defenseScheme}</p>
            </div>
          </div>
        </div>
      )}

      {/* Roster Data Inspection */}
      <div className="bg-gray-900 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-neon-green mb-2">Roster Data Inspection</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Roster field exists:</strong> {teamData && 'roster' in teamData ? 'Yes' : 'No'}</p>
          <p><strong>Roster type:</strong> {teamData ? typeof teamData.roster : 'N/A'}</p>
          <p><strong>Roster length:</strong> {teamData && Array.isArray(teamData.roster) ? teamData.roster.length : 'N/A'}</p>
          <p><strong>Roster value:</strong> {teamData ? JSON.stringify(teamData.roster, null, 2) : 'N/A'}</p>
        </div>
      </div>

      {/* Depth Chart Data Inspection */}
      <div className="bg-gray-900 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-neon-green mb-2">Depth Chart Data Inspection</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Depth Chart field exists:</strong> {teamData && 'depthChart' in teamData ? 'Yes' : 'No'}</p>
          <p><strong>Depth Chart type:</strong> {teamData ? typeof teamData.depthChart : 'N/A'}</p>
          <p><strong>Depth Chart keys:</strong> {teamData && teamData.depthChart ? Object.keys(teamData.depthChart).join(', ') : 'N/A'}</p>
          <p><strong>Depth Chart value:</strong> {teamData ? JSON.stringify(teamData.depthChart, null, 2) : 'N/A'}</p>
        </div>
      </div>

      {/* On The Block Data Inspection */}
      <div className="bg-gray-900 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-neon-green mb-2">On The Block Data Inspection</h2>
        <div className="space-y-2 text-sm">
          <p><strong>On The Block field exists:</strong> {teamData && 'onTheBlock' in teamData ? 'Yes' : 'No'}</p>
          <p><strong>On The Block type:</strong> {teamData ? typeof teamData.onTheBlock : 'N/A'}</p>
          <p><strong>On The Block length:</strong> {teamData && Array.isArray(teamData.onTheBlock) ? teamData.onTheBlock.length : 'N/A'}</p>
          <p><strong>On The Block value:</strong> {teamData ? JSON.stringify(teamData.onTheBlock, null, 2) : 'N/A'}</p>
        </div>
      </div>

      {/* All Response Keys */}
      <div className="bg-gray-900 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-neon-green mb-2">All Response Keys</h2>
        <div className="text-sm">
          <p><strong>Available fields:</strong> {teamData ? Object.keys(teamData).join(', ') : 'N/A'}</p>
        </div>
      </div>

      {/* Full Response Data */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-neon-green mb-2">Full API Response</h2>
        <pre className="text-xs overflow-auto max-h-96 bg-gray-800 p-4 rounded">
          {teamData ? JSON.stringify(teamData, null, 2) : 'No data available'}
        </pre>
      </div>
    </div>
  )
} 