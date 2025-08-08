'use client'

import React, { useState, useEffect } from 'react'
import { getFirebaseToken, signInWithCouchlytics, getCurrentFirebaseUser } from '@/lib/firebase'

export default function FirebaseTestPage() {
  const [status, setStatus] = useState<string>('Initializing...')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkFirebaseStatus()
  }, [])

  const checkFirebaseStatus = async () => {
    try {
      setStatus('Checking Firebase configuration...')
      
      // Check if environment variables are loaded
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      }

      console.log('Firebase Config:', config)

      if (!config.apiKey || config.apiKey === 'AIzaSyC...') {
        setError('Firebase API Key not configured properly')
        setStatus('Configuration Error')
        return
      }

      setStatus('Firebase configuration looks good!')
      
      // Check current user
      const currentUser = getCurrentFirebaseUser()
      if (currentUser) {
        setUser(currentUser)
        setStatus('Already authenticated with Firebase')
      } else {
        setStatus('Not authenticated with Firebase')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('Error occurred')
    }
  }

  const handleSignIn = async () => {
    try {
      setStatus('Signing in to Firebase...')
      setError(null)
      
      const firebaseUser = await signInWithCouchlytics()
      setUser(firebaseUser)
      setStatus('Successfully signed in to Firebase!')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('Sign-in failed')
    }
  }

  const handleGetToken = async () => {
    try {
      setStatus('Getting Firebase token...')
      setError(null)
      
      const token = await getFirebaseToken()
      setStatus(`Token received: ${token.substring(0, 20)}...`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('Failed to get token')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Firebase Authentication Test</h1>
        
        <div className="space-y-4">
          {/* Status */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900">Status</h2>
            <p className="text-blue-700">{status}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h2 className="font-semibold text-red-900">Error</h2>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* User Info */}
          {user && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h2 className="font-semibold text-green-900">Current User</h2>
              <p className="text-green-700">Email: {user.email}</p>
              <p className="text-green-700">UID: {user.uid}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSignIn}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Sign In to Firebase
            </button>
            
            <button
              onClick={handleGetToken}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Get Firebase Token
            </button>
            
            <button
              onClick={checkFirebaseStatus}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>

          {/* Environment Variables Check */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h2 className="font-semibold text-yellow-900">Environment Variables</h2>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing'}</p>
              <p>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</p>
              <p>Storage Bucket: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing'}</p>
              <p>Messaging Sender ID: {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing'}</p>
              <p>App ID: {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 