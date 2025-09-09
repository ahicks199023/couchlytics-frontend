'use client'

import { API_BASE } from '@/lib/config'
import { API_BASE_URL } from '@/lib/http'

export default function TestApiBase() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 API Base URL Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Configuration Values</h2>
            <div className="space-y-3">
              <div>
                <strong>API_BASE (from config):</strong>
                <div className="text-green-400 font-mono text-sm mt-1">
                  {API_BASE}
                </div>
              </div>
              <div>
                <strong>API_BASE_URL (from http):</strong>
                <div className="text-green-400 font-mono text-sm mt-1">
                  {API_BASE_URL}
                </div>
              </div>
              <div>
                <strong>Environment Variables:</strong>
                <div className="text-gray-400 text-sm mt-1">
                  <div>NEXT_PUBLIC_API_BASE: {process.env.NEXT_PUBLIC_API_BASE || 'Not set'}</div>
                  <div>NEXT_PUBLIC_API_BASE_URL: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Test API Call</h2>
            <button
              onClick={async () => {
                try {
                  console.log('🔍 Testing API call with API_BASE:', API_BASE)
                  const response = await fetch(`${API_BASE}/auth/status`, {
                    credentials: 'include'
                  })
                  console.log('✅ Response status:', response.status)
                  console.log('✅ Response URL:', response.url)
                  
                  if (response.ok) {
                    const data = await response.json()
                    console.log('✅ Response data:', data)
                    alert(`✅ Success! Status: ${response.status}\nURL: ${response.url}`)
                  } else {
                    console.error('❌ API call failed:', response.status, response.statusText)
                    alert(`❌ Failed! Status: ${response.status}\nURL: ${response.url}`)
                  }
                } catch (error) {
                  console.error('❌ Error:', error)
                  alert(`❌ Error: ${error}`)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Test /auth/status
            </button>
            
            <div className="mt-4">
              <button
                onClick={async () => {
                  try {
                    console.log('🔍 Testing API call with API_BASE_URL:', API_BASE_URL)
                    const response = await fetch(`${API_BASE_URL}/auth/status`, {
                      credentials: 'include'
                    })
                    console.log('✅ Response status:', response.status)
                    console.log('✅ Response URL:', response.url)
                    
                    if (response.ok) {
                      const data = await response.json()
                      console.log('✅ Response data:', data)
                      alert(`✅ Success! Status: ${response.status}\nURL: ${response.url}`)
                    } else {
                      console.error('❌ API call failed:', response.status, response.statusText)
                      alert(`❌ Failed! Status: ${response.status}\nURL: ${response.url}`)
                    }
                  } catch (error) {
                    console.error('❌ Error:', error)
                    alert(`❌ Error: ${error}`)
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Test with API_BASE_URL
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
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🔍 Actual API_BASE_URL:</span>
              <code className="bg-gray-700 px-2 py-1 rounded">{API_BASE_URL}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
