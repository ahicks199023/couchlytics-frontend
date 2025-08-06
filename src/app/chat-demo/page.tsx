'use client'

import React, { useState } from 'react'
import { LeagueChat, GlobalChat, DMChat } from '@/components/chat'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'

export default function ChatDemoPage() {
  const [activeChat, setActiveChat] = useState<'league' | 'global' | 'dm'>('league')
  const [recipient, setRecipient] = useState('recipient@example.com')
  const [recipientName, setRecipientName] = useState('Demo Recipient')
  const [leagueId, setLeagueId] = useState('12335716')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCommissioner, setIsCommissioner] = useState(false)

  const { 
    firebaseUser, 
    isFirebaseAuthenticated, 
    isFirebaseLoading, 
    firebaseError,
    initializeFirebaseAuth,
    refreshFirebaseAuth 
  } = useFirebaseAuth()

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Couchlytics Chat System Demo</h1>
        
        {/* Firebase Authentication Status */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Firebase Authentication Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-300 mb-2">Status:</p>
              <div className="flex items-center space-x-2">
                {isFirebaseLoading ? (
                  <div className="text-yellow-400">🔄 Loading...</div>
                ) : isFirebaseAuthenticated ? (
                  <div className="text-green-400">✅ Connected</div>
                ) : (
                  <div className="text-red-400">❌ Disconnected</div>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-300 mb-2">User:</p>
              <div className="text-white">
                {firebaseUser ? (
                  <div>
                    <p className="font-medium">{firebaseUser.email}</p>
                    <p className="text-sm text-gray-400">UID: {firebaseUser.uid}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">Not authenticated</p>
                )}
              </div>
            </div>
          </div>

          {firebaseError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">Error: {firebaseError}</p>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={initializeFirebaseAuth}
              disabled={isFirebaseLoading || isFirebaseAuthenticated}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isFirebaseLoading ? 'Connecting...' : 'Connect to Firebase'}
            </button>
            
            {isFirebaseAuthenticated && (
              <button
                onClick={refreshFirebaseAuth}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Refresh Token
              </button>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Demo Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Chat Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Chat Type</label>
              <select
                value={activeChat}
                onChange={(e) => setActiveChat(e.target.value as 'league' | 'global' | 'dm')}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
              >
                <option value="league">🔥 League Chat</option>
                <option value="global">🌎 Global Chat</option>
                <option value="dm">📬 Direct Message</option>
              </select>
            </div>

            {/* League ID (for League Chat) */}
            {activeChat === 'league' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">League ID</label>
                <input
                  type="text"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                />
              </div>
            )}

            {/* Recipient (for DM) */}
            {activeChat === 'dm' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Email</label>
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>
              </>
            )}

            {/* Permissions */}
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Admin</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isCommissioner}
                  onChange={(e) => setIsCommissioner(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Commissioner</span>
              </label>
            </div>
          </div>
        </div>

        {/* Chat Component */}
        <div className="h-96">
          {activeChat === 'league' && (
            <LeagueChat
              leagueId={leagueId}
              isCommissioner={isCommissioner}
            />
          )}
          
          {activeChat === 'global' && (
            <GlobalChat
              isAdmin={isAdmin}
            />
          )}
          
          {activeChat === 'dm' && (
            <DMChat
              recipient={recipient}
              recipientName={recipientName}
            />
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">How to Use</h3>
          <ul className="text-gray-300 space-y-1 text-sm">
            <li>• <strong>Firebase Authentication:</strong> Click "Connect to Firebase" to authenticate with your Couchlytics account</li>
            <li>• <strong>League Chat:</strong> Messages are stored in <code>leagueChats/{leagueId}/messages</code></li>
            <li>• <strong>Global Chat:</strong> Messages are stored in <code>globalChat/messages</code></li>
            <li>• <strong>Direct Messages:</strong> Messages are stored in <code>privateMessages/{conversationId}/messages</code></li>
            <li>• <strong>Features:</strong> Real-time updates, message editing, deletion, auto-scroll, and pagination</li>
            <li>• <strong>Permissions:</strong> Admins can delete any message, users can edit/delete their own messages</li>
            <li>• <strong>Keyboard:</strong> Press Enter to send, Shift+Enter for new line, Escape to cancel editing</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 