'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LeagueChat from '@/components/chat/LeagueChat'
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

  // Show loading state while authentication is being determined
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              💬 League Chat
            </h1>
            <p className="text-gray-400">
              Real-time messaging for league members • League: {leagueId}
            </p>
          </div>
          
          <div className="flex items-center justify-center h-[600px] bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading chat...</p>
              <p className="text-gray-500 text-sm mt-2">Please wait while we verify your access</p>
            </div>
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

        {/* Chat Container */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg h-[600px]">
          <LeagueChat
            currentUser={currentUser}
            currentUserName={currentUserName}
            leagueId={leagueId}
          />
        </div>
      </div>
    </div>
  )
} 