'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LeagueChat from '@/components/chat/LeagueChat'
import GlobalChat from '@/components/chat/GlobalChat'
import DMChat from '@/components/chat/DMChat'
import { completeFirestoreSetup } from '@/lib/setupFirestore'
import { getFirebaseUserEmail } from '@/lib/firebase'

type ChatType = 'league' | 'global' | 'direct'

export default function ChatPage() {
  const [chatType, setChatType] = useState<ChatType>('global')
  const [leagueId, setLeagueId] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [isSettingUpFirestore, setIsSettingUpFirestore] = useState(false)

  const { firebaseUser, user: couchlyticsUser } = useAuth()

  const currentUser = getFirebaseUserEmail(firebaseUser) || couchlyticsUser?.email || ''
  const currentUserName = firebaseUser?.displayName || getFirebaseUserEmail(firebaseUser)?.split('@')[0] || couchlyticsUser?.email?.split('@')[0] || 'User'

  const handleFirestoreSetup = async () => {
    if (!currentUser) {
      alert('Please sign in first')
      return
    }

    setIsSettingUpFirestore(true)
    try {
      const success = await completeFirestoreSetup(currentUser, currentUser, leagueId || 'default')
      if (success) {
        alert('✅ Chat system initialized successfully!')
      } else {
        alert('❌ Chat initialization failed. Please try again.')
      }
    } catch (error) {
      console.error('Chat initialization error:', error)
      alert('❌ Chat initialization failed. Please try again.')
    } finally {
      setIsSettingUpFirestore(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h1 className="text-2xl font-bold mb-4">Couchlytics Chat</h1>
          <p className="text-gray-400 mb-6">Please sign in to access the chat system</p>
          <div className="bg-gray-800 p-4 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-gray-300">
              Chat features include:
            </p>
            <ul className="text-sm text-gray-400 mt-2 space-y-1">
              <li>• Real-time messaging across all leagues</li>
              <li>• Global chat for all users</li>
              <li>• Private direct messages</li>
              <li>• Emoji reactions and message editing</li>
              <li>• Mobile-responsive design</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            💬 Couchlytics Chat
          </h1>
          <p className="text-gray-400">
            Real-time messaging for the Couchlytics community
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-green-400">
              ✅ Connected as: {currentUserName}
            </span>
            <button
              onClick={handleFirestoreSetup}
              disabled={isSettingUpFirestore}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded disabled:opacity-50"
            >
              {isSettingUpFirestore ? 'Initializing...' : 'Initialize Chat'}
            </button>
          </div>
        </div>

        {/* Chat Type Selector */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Chat Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setChatType('global')}
              className={`p-4 rounded-lg border transition-colors ${
                chatType === 'global'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">🌎</div>
              <h3 className="font-semibold">Global Chat</h3>
              <p className="text-sm text-gray-400">Chat with all Couchlytics users</p>
            </button>
            
            <button
              onClick={() => setChatType('league')}
              className={`p-4 rounded-lg border transition-colors ${
                chatType === 'league'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">🏆</div>
              <h3 className="font-semibold">League Chat</h3>
              <p className="text-sm text-gray-400">Chat with league members</p>
            </button>
            
            <button
              onClick={() => setChatType('direct')}
              className={`p-4 rounded-lg border transition-colors ${
                chatType === 'direct'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">📬</div>
              <h3 className="font-semibold">Direct Message</h3>
              <p className="text-sm text-gray-400">Private conversation</p>
            </button>
          </div>
        </div>

        {/* Chat Configuration */}
        {chatType === 'league' && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">League Chat Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">League ID</label>
                <input
                  type="text"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your league ID"
                />
              </div>
            </div>
          </div>
        )}

        {chatType === 'direct' && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Direct Message Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recipient Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter recipient's email"
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Display */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg h-[600px]">
          {chatType === 'league' && leagueId ? (
            <LeagueChat
              currentUser={currentUser}
              currentUserName={currentUserName}
              leagueId={leagueId}
            />
          ) : chatType === 'league' && !leagueId ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-2">League Chat</h3>
                <p className="text-gray-400">Please enter a League ID above to start chatting</p>
              </div>
            </div>
          ) : chatType === 'direct' && recipientEmail ? (
            <DMChat
              currentUser={currentUser}
              currentUserName={currentUserName}
              recipient={recipientEmail}
              recipientName={recipientEmail.split('@')[0]}
            />
          ) : chatType === 'direct' && !recipientEmail ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">📬</div>
                <h3 className="text-xl font-semibold mb-2">Direct Message</h3>
                <p className="text-gray-400">Please enter a recipient email above to start chatting</p>
              </div>
            </div>
          ) : (
            <GlobalChat
              currentUser={currentUser}
              currentUserName={currentUserName}
            />
          )}
        </div>

        {/* Features Info */}
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">🎯 Chat Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-medium mb-1">Real-time</h3>
              <p className="text-gray-400">Instant message delivery</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">😊</div>
              <h3 className="font-medium mb-1">Reactions</h3>
              <p className="text-gray-400">Emoji reactions on messages</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">✏️</div>
              <h3 className="font-medium mb-1">Edit & Delete</h3>
              <p className="text-gray-400">Modify your messages</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-medium mb-1">Mobile Ready</h3>
              <p className="text-gray-400">Responsive design</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 