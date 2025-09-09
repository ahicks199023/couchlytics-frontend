'use client'

import { useState } from 'react'
import { API_BASE } from '@/lib/config'
import { API_BASE_URL } from '@/lib/http'

export default function ApiDebugPanel() {
  const [testResults, setTestResults] = useState<Array<{
    endpoint: string
    status: number
    url: string
    success: boolean
  }>>([])

  const testEndpoint = async (endpoint: string) => {
    try {
      console.log(`🔍 Testing ${endpoint} with API_BASE:`, API_BASE)
      const response = await fetch(`${API_BASE}${endpoint}`, {
        credentials: 'include'
      })
      
      const result = {
        endpoint,
        status: response.status,
        url: response.url,
        success: response.ok
      }
      
      console.log('✅ Test result:', result)
      setTestResults(prev => [...prev, result])
      
      return result
    } catch (error) {
      console.error('❌ Test error:', error)
      const result = {
        endpoint,
        status: 0,
        url: `${API_BASE}${endpoint}`,
        success: false
      }
      setTestResults(prev => [...prev, result])
      return result
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">🔧 API Debug Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Configuration</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>API_BASE:</strong>
              <div className="text-green-400 font-mono">{API_BASE}</div>
              <span className={API_BASE === 'https://api.couchlytics.com' ? 'text-green-400' : 'text-red-400'}>
                {API_BASE === 'https://api.couchlytics.com' ? '✅' : '❌'}
              </span>
            </div>
            <div>
              <strong>API_BASE_URL:</strong>
              <div className="text-green-400 font-mono">{API_BASE_URL}</div>
              <span className={API_BASE_URL === 'https://api.couchlytics.com' ? 'text-green-400' : 'text-red-400'}>
                {API_BASE_URL === 'https://api.couchlytics.com' ? '✅' : '❌'}
              </span>
            </div>
            <div>
              <strong>Environment:</strong>
              <div className="text-gray-400">
                NODE_ENV: {process.env.NODE_ENV}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Test Endpoints</h3>
          <div className="space-y-2">
            <button
              onClick={() => testEndpoint('/auth/status')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
            >
              Test /auth/status
            </button>
            <button
              onClick={() => testEndpoint('/leagues/12335716/members/me')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
            >
              Test /leagues/12335716/members/me
            </button>
            <button
              onClick={() => testEndpoint('/leagues/12335716/members')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
            >
              Test /leagues/12335716/members
            </button>
            <button
              onClick={clearResults}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>
      </div>

      {testResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Test Results</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  result.success
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-red-900/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm">{result.endpoint}</div>
                    <div className="text-xs text-gray-400">{result.url}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                      {result.status}
                    </div>
                    <div className="text-xs text-gray-400">
                      {result.success ? 'Success' : 'Failed'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-700 rounded text-sm">
        <strong>Instructions:</strong>
        <ul className="mt-1 space-y-1 text-gray-300">
          <li>• Check that both API_BASE and API_BASE_URL show ✅</li>
          <li>• Click test buttons to verify API calls go to correct URLs</li>
          <li>• Open browser dev tools (F12) and check Network tab</li>
          <li>• Look for requests going to <code className="bg-gray-600 px-1 rounded">www.couchlytics.com</code> instead of <code className="bg-gray-600 px-1 rounded">api.couchlytics.com</code></li>
        </ul>
      </div>
    </div>
  )
}
