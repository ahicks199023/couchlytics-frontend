'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LeagueChat from '@/components/chat/LeagueChat'
import FirebaseTest from '@/components/chat/FirebaseTest'
import { getFirebaseUserEmail } from '@/lib/firebase'

export default function LeagueChatPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  
  const { firebaseUser, user: couchlyticsUser } = useAuth()

  const currentUser = getFirebaseUserEmail(firebaseUser) || couchlyticsUser?.email || ''
  const currentUserName = firebaseUser?.displayName || getFirebaseUserEmail(firebaseUser)?.split('@')[0] || couchlyticsUser?.email?.split('@')[0] || 'User'

  // Debug logging
  console.log('🔍 LeagueChatPage rendered:', {
    leagueId,
    currentUser,
    currentUserName,
    firebaseUser: !!firebaseUser,
    couchlyticsUser: !!couchlyticsUser
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            💬 League Chat
          </h1>
          <p className="text-gray-400">
            Real-time messaging for league members • League: {leagueId}
          </p>
          {currentUser && (
            <p className="text-sm text-green-400 mt-1">
              ✅ Connected as: {currentUserName}
            </p>
          )}
        </div>

        {/* Firebase Debug Tools */}
        <FirebaseTest leagueId={leagueId} />

        {/* Chat Container */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg h-[600px]">
          <LeagueChat
            currentUser={currentUser}
            currentUserName={currentUserName}
            leagueId={leagueId}
          />
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">📖 How League Chat Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <h3 className="font-medium text-blue-400 mb-2">🔐 Privacy</h3>
              <ul className="space-y-1">
                <li>• Only league members can read and send messages</li>
                <li>• Messages are stored securely in Firestore</li>
                <li>• Real-time updates for all members</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-400 mb-2">🎯 Features</h3>
              <ul className="space-y-1">
                <li>• Emoji reactions on messages</li>
                <li>• Edit and delete your own messages</li>
                <li>• Commissioner moderation tools</li>
                <li>• Message history and search</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 