'use client'

import { API_BASE } from '@/lib/config'
import { API_BASE_URL } from '@/lib/http'

export default function ApiDebug() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 API Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Configuration Values</h2>
            <div className="space-y-3">
              <div>
                <strong>API_BASE:</strong>
                <div className="text-green-400 font-mono text-sm mt-1">
                  {API_BASE}
                </div>
              </div>
              <div>
                <strong>API_BASE_URL:</strong>
                <div className="text-green-400 font-mono text-sm mt-1">
                  {API_BASE_URL}
                </div>
              </div>
              <div>
                <strong>Environment:</strong>
                <div className="text-gray-400 text-sm mt-1">
                  <div>NODE_ENV: {process.env.NODE_ENV}</div>
                  <div>NEXT_PUBLIC_API_BASE: {process.env.NEXT_PUBLIC_API_BASE || 'Not set'}</div>
                  <div>NEXT_PUBLIC_API_BASE_URL: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Test API Calls</h2>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    console.log('🔍 Testing /auth/status with API_BASE:', API_BASE)
                    const response = await fetch(`${API_BASE}/auth/status`, {
                      credentials: 'include'
                    })
                    console.log('✅ Response status:', response.status)
                    console.log('✅ Response URL:', response.url)
                    alert(`Status: ${response.status}\nURL: ${response.url}`)
                  } catch (error) {
                    console.error('❌ Error:', error)
                    alert(`Error: ${error}`)
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Test /auth/status
              </button>
              
              <button
                onClick={async () => {
                  try {
                    console.log('🔍 Testing /leagues/12335716/members/me with API_BASE:', API_BASE)
                    const response = await fetch(`${API_BASE}/leagues/12335716/members/me`, {
                      credentials: 'include'
                    })
                    console.log('✅ Response status:', response.status)
                    console.log('✅ Response URL:', response.url)
                    alert(`Status: ${response.status}\nURL: ${response.url}`)
                  } catch (error) {
                    console.error('❌ Error:', error)
                    alert(`Error: ${error}`)
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Test /leagues/12335716/members/me
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Expected vs Actual</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅ Expected:</span>
              <code className="bg-gray-700 px-2 py-1 rounded">https://api.couchlytics.com</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🔍 Actual API_BASE:</span>
              <code className="bg-gray-700 px-2 py-1 rounded">{API_BASE}</code>
              <span className={API_BASE === 'https://api.couchlytics.com' ? 'text-green-400' : 'text-red-400'}>
                {API_BASE === 'https://api.couchlytics.com' ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🔍 Actual API_BASE_URL:</span>
              <code className="bg-gray-700 px-2 py-1 rounded">{API_BASE_URL}</code>
              <span className={API_BASE_URL === 'https://api.couchlytics.com' ? 'text-green-400' : 'text-red-400'}>
                {API_BASE_URL === 'https://api.couchlytics.com' ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-sm">
            <p>1. Check the configuration values above</p>
            <p>2. Click the test buttons to see what URLs are being used</p>
            <p>3. Open browser dev tools (F12) and check the Network tab</p>
            <p>4. Look for any requests going to <code className="bg-gray-700 px-1 rounded">www.couchlytics.com</code> instead of <code className="bg-gray-700 px-1 rounded">api.couchlytics.com</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
