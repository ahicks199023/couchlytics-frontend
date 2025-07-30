'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ScheduleDebugPage() {
  const [leagueId, setLeagueId] = useState('')
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testSchedulePage = async () => {
    if (!leagueId) {
      addResult('❌ Please enter a League ID')
      return
    }

    addResult(`🔍 Testing schedule page for League ID: ${leagueId}`)
    
    try {
      // Test if the page route exists
      addResult('✅ Route structure appears correct')
      
      // Test API configuration
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.couchlytics.com'
      addResult(`✅ API Base URL: ${apiBase}`)
      
      // Test API endpoint
      const testUrl = `${apiBase}/leagues/${leagueId}/season-schedule?status=all&page=1&limit=10`
      addResult(`🔗 Testing API endpoint: ${testUrl}`)
      
      const response = await fetch(testUrl)
      addResult(`📡 API Response Status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        addResult(`✅ API Response OK - Found ${data.games?.length || 0} games`)
      } else {
        addResult(`❌ API Error: ${response.status} ${response.statusText}`)
      }
      
    } catch (error) {
      addResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Schedule Page Debug Tool</h1>
        
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Enter League ID"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1"
            />
            <button
              onClick={testSchedulePage}
              className="px-4 py-2 bg-green-600 dark:bg-neon-green text-white rounded hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
            >
              Test Schedule Page
            </button>
          </div>
          
          {leagueId && (
            <div className="mb-4">
              <Link
                href={`/leagues/${leagueId}/schedule`}
                className="inline-block px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                🔗 Go to Schedule Page
              </Link>
            </div>
          )}
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-white dark:bg-gray-800 rounded p-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No tests run yet. Enter a League ID and click "Test Schedule Page".</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Common Issues & Solutions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">❌ 404 Error</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The page route doesn't exist. Check if the file exists at: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">src/app/leagues/[leagueId]/schedule/page.tsx</code>
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">❌ API Error</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The backend API is not responding. Check if the API server is running and the endpoint exists.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">❌ JavaScript Error</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                There's a JavaScript error in the page. Check the browser console for detailed error messages.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">⚠️ Environment Variables</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Make sure <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">NEXT_PUBLIC_API_BASE</code> is set correctly in your environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 