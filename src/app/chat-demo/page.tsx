'use client'

import React, { useState } from 'react'
import { FirebaseAuthProvider, useFirebaseAuth } from '@/contexts/FirebaseAuthContext'
import useAuth from '@/Hooks/useAuth'
import { LeagueChat, GlobalChat, DMChat } from '@/components/chat'
import { completeFirestoreSetup } from '@/lib/setupFirestore'

function ChatDemoContent() {
  const { authenticated, user: couchlyticsUser } = useAuth()
  const { isFirebaseAuthenticated, firebaseUser, isLoading: isFirebaseLoading, error: firebaseError } = useFirebaseAuth()
  
  const [selectedChat, setSelectedChat] = useState<'league' | 'global' | 'dm'>('league')
  const [leagueId, setLeagueId] = useState('12335716')
  const [recipientEmail, setRecipientEmail] = useState('test@example.com')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCommissioner, setIsCommissioner] = useState(false)
  const [isSettingUpFirestore, setIsSettingUpFirestore] = useState(false)
  const [firestoreSetupComplete, setFirestoreSetupComplete] = useState(false)

  const handleFirestoreSetup = async () => {
    if (!firebaseUser || !couchlyticsUser) return
    
    setIsSettingUpFirestore(true)
    try {
      const success = await completeFirestoreSetup(
        firebaseUser.uid,
        firebaseUser.email || couchlyticsUser.email,
        leagueId
      )
      if (success) {
        setFirestoreSetupComplete(true)
        console.log('✅ Firestore setup completed successfully')
      }
    } catch (error) {
      console.error('❌ Firestore setup failed:', error)
    } finally {
      setIsSettingUpFirestore(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            You must be logged into Couchlytics to access the chat demo.
          </p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💬 Firebase Chat System Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the three different chat modules with Firebase authentication
          </p>
        </div>

        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🔐 Authentication Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Couchlytics Status */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">✅ Couchlytics Authentication</h3>
              <div className="text-sm text-green-700">
                <p><strong>Status:</strong> Authenticated</p>
                <p><strong>Email:</strong> {couchlyticsUser?.email}</p>
                <p><strong>User ID:</strong> {couchlyticsUser?.id}</p>
              </div>
            </div>

            {/* Firebase Status */}
            <div className={`p-4 border rounded-lg ${isFirebaseAuthenticated ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className={`font-medium mb-2 ${isFirebaseAuthenticated ? 'text-green-800' : 'text-red-800'}`}>
                {isFirebaseAuthenticated ? '✅ Firebase Authentication' : '❌ Firebase Authentication'}
              </h3>
              {isFirebaseLoading ? (
                <div className="text-sm text-gray-600">
                  <p>Loading Firebase authentication...</p>
                </div>
              ) : isFirebaseAuthenticated ? (
                <div className="text-sm text-green-700">
                  <p><strong>Status:</strong> Authenticated</p>
                  <p><strong>Email:</strong> {firebaseUser?.email}</p>
                  <p><strong>UID:</strong> {firebaseUser?.uid}</p>
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <p><strong>Status:</strong> Not Authenticated</p>
                  {firebaseError && (
                    <p><strong>Error:</strong> {firebaseError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            ⚙️ Chat Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chat Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chat Type
              </label>
              <select
                value={selectedChat}
                onChange={(e) => setSelectedChat(e.target.value as 'league' | 'global' | 'dm')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="league">🏈 League Chat</option>
                <option value="global">🌎 Global Chat</option>
                <option value="dm">📬 Direct Message</option>
              </select>
            </div>

            {/* League ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League ID
              </label>
              <input
                type="text"
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter league ID"
              />
            </div>

            {/* Recipient Email (for DM) */}
            {selectedChat === 'dm' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="recipient@example.com"
                />
              </div>
            )}

            {/* Permissions */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isAdmin" className="text-sm text-gray-700">
                  Admin
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isCommissioner"
                  checked={isCommissioner}
                  onChange={(e) => setIsCommissioner(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isCommissioner" className="text-sm text-gray-700">
                  Commissioner
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Component */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {selectedChat === 'league' && '🏈 League Chat'}
            {selectedChat === 'global' && '🌎 Global Chat'}
            {selectedChat === 'dm' && '📬 Direct Message'}
          </h2>
          
          {!isFirebaseAuthenticated ? (
            <div className="text-center py-8">
              <div className="text-red-600 text-lg mb-4">
                ❌ Firebase authentication required for chat functionality
              </div>
              <p className="text-gray-600 mb-4">
                Please authenticate with Firebase first to use the chat features.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <h3 className="font-medium text-yellow-800 mb-2">Next Steps:</h3>
                <ol className="text-sm text-yellow-700 space-y-1 text-left">
                  <li>1. Ensure you&apos;re logged into Couchlytics</li>
                  <li>2. Click &quot;Sign in to Firebase&quot; in the authentication section</li>
                  <li>3. Wait for Firebase authentication to complete</li>
                  <li>4. Return to this page to test chat functionality</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Firestore Setup Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">🔧 Firestore Setup</h3>
                <p className="text-sm text-blue-700 mb-3">
                  {firestoreSetupComplete 
                    ? '✅ Firestore documents are set up and ready for chat'
                    : 'Set up the required Firestore documents for chat functionality'
                  }
                </p>
                {!firestoreSetupComplete && (
                  <button
                    onClick={handleFirestoreSetup}
                    disabled={isSettingUpFirestore}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSettingUpFirestore ? 'Setting up...' : 'Setup Firestore Documents'}
                  </button>
                )}
              </div>
              <div className="h-96">
                {selectedChat === 'league' && (
                  <LeagueChat 
                    leagueId={leagueId}
                    currentUser={firebaseUser?.email || ''}
                    isCommissioner={isCommissioner}
                  />
                )}
                {selectedChat === 'global' && (
                  <GlobalChat 
                    currentUser={firebaseUser?.email || ''}
                    isAdmin={isAdmin}
                  />
                )}
                {selectedChat === 'dm' && (
                  <DMChat 
                    currentUser={firebaseUser?.email || ''}
                    recipient={recipientEmail}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📋 How to Use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">🏈 League Chat</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Only league members can read/send messages</li>
                <li>• Moderated by the league commissioner</li>
                <li>• Messages stored in: <code>leagueChats/{leagueId}/messages</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">🌎 Global Chat</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All logged-in users can access</li>
                <li>• Only system admins can moderate</li>
                <li>• Messages stored in: <code>globalChat/messages</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">📬 Direct Messages</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Private conversations between two users</li>
                <li>• Auto-generated conversation ID</li>
                <li>• Messages stored in: <code>privateMessages/[conversationId]/messages</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">🔐 Authentication</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Requires Firebase authentication</li>
                <li>• Uses custom tokens from Couchlytics backend</li>
                <li>• Real-time updates with Firestore</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatDemo() {
  return (
    <FirebaseAuthProvider>
      <ChatDemoContent />
    </FirebaseAuthProvider>
  )
} 