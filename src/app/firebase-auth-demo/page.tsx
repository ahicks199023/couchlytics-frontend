'use client'

import React from 'react'
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext'
import FirebaseAuth from '@/components/FirebaseAuth'
import { useAuth } from '@/Hooks/useAuth'

function FirebaseAuthDemoContent() {
  const { authenticated, user: couchlyticsUser } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔥 Firebase Authentication Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test Firebase custom token authentication with Couchlytics
          </p>
        </div>

        {/* Couchlytics Authentication Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📋 Couchlytics Authentication Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${authenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="font-medium">Status:</span>
                <span className={authenticated ? 'text-green-600' : 'text-red-600'}>
                  {authenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              {couchlyticsUser && (
                <div className="text-sm text-gray-600">
                  <p><strong>Email:</strong> {couchlyticsUser.email}</p>
                  <p><strong>User ID:</strong> {couchlyticsUser.id}</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">ℹ️ Requirements</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Must be logged into Couchlytics first</li>
                <li>• Backend Firebase service must be running</li>
                <li>• Firebase project must be configured</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Firebase Authentication Component */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🔐 Firebase Authentication
          </h2>
          <FirebaseAuth 
            showUserInfo={true}
            onAuthStateChange={(user) => {
              console.log('Firebase auth state changed:', user?.email)
            }}
          />
        </div>

        {/* API Endpoints Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🔌 Available API Endpoints
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-green-800">GET /api/firebase-token</h3>
              <p className="text-sm text-gray-600">Generate Firebase custom token (requires Couchlytics authentication)</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-blue-800">GET /api/firebase-token/health</h3>
              <p className="text-sm text-gray-600">Check Firebase service health status</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-medium text-purple-800">POST /api/firebase-token/verify</h3>
              <p className="text-sm text-gray-600">Verify Firebase ID token and get user claims</p>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🧪 Testing Instructions
          </h2>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Step 1: Check Prerequisites</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Ensure you're logged into Couchlytics (see status above)</li>
                <li>• Verify backend is running and accessible</li>
                <li>• Check Firebase project configuration</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Step 2: Test Health</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Click "Test Health" button to verify backend connectivity</li>
                <li>• Should return "✅ Healthy" if everything is working</li>
                <li>• If unhealthy, check backend logs and configuration</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">Step 3: Authenticate with Firebase</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Click "Sign in to Firebase" button</li>
                <li>• Should automatically get token from Couchlytics backend</li>
                <li>• Firebase user should appear with email and UID</li>
                <li>• Custom claims should show Couchlytics user ID</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-800 mb-2">Step 4: Test Features</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Try "Refresh Token" to test token refresh</li>
                <li>• Test "Sign Out from Firebase" to verify logout</li>
                <li>• Check browser console for detailed logs</li>
                <li>• Verify user claims contain Couchlytics user ID</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🚨 Troubleshooting
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-medium text-red-800">Common Issues</h3>
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <div>
                  <strong>❌ "User not authenticated with Couchlytics"</strong>
                  <p>Solution: Log into Couchlytics first, then try Firebase authentication</p>
                </div>
                <div>
                  <strong>❌ "Failed to get Firebase token"</strong>
                  <p>Solution: Check backend is running and Firebase service account is configured</p>
                </div>
                <div>
                  <strong>❌ "signInWithCustomToken failed"</strong>
                  <p>Solution: Verify Firebase project configuration and API keys</p>
                </div>
                <div>
                  <strong>❌ "Health check failed"</strong>
                  <p>Solution: Check backend logs and ensure Firebase service is initialized</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">🔍 Debug Commands</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• Open browser console to see detailed logs</p>
                <p>• Check Network tab for API request/response details</p>
                <p>• Verify environment variables are set correctly</p>
                <p>• Test backend endpoints directly with curl or Postman</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FirebaseAuthDemo() {
  return (
    <FirebaseAuthProvider>
      <FirebaseAuthDemoContent />
    </FirebaseAuthProvider>
  )
} 