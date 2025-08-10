'use client'

import React, { useState } from 'react'
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext'
import useAuth from '@/Hooks/useAuth'
import LeagueChat from '@/components/chat/LeagueChat'
import GlobalChat from '@/components/chat/GlobalChat'
import DMChat from '@/components/chat/DMChat'
import MobileChatLayout from '@/components/chat/MobileChatLayout'
import { completeFirestoreSetup } from '@/lib/setupFirestore'
import { ChatMessage } from '@/types/chat'
import { getFirebaseUserEmail } from '@/lib/firebase'

type ChatType = 'league' | 'global' | 'direct' | 'mobile'

export default function ChatDemoComponent() {
  const [chatType, setChatType] = useState<ChatType>('league')
  const [leagueId, setLeagueId] = useState('12335716')
  const [recipientEmail, setRecipientEmail] = useState('test@example.com')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCommissioner, setIsCommissioner] = useState(false)
  const [isSettingUpFirestore, setIsSettingUpFirestore] = useState(false)
  const [firestoreSetupComplete, setFirestoreSetupComplete] = useState(false)

  const { firebaseUser } = useFirebaseAuth()
  const { user: couchlyticsUser } = useAuth()

  const currentUser = getFirebaseUserEmail(firebaseUser) || couchlyticsUser?.email || ''
  const currentUserName = firebaseUser?.displayName || getFirebaseUserEmail(firebaseUser)?.split('@')[0] || couchlyticsUser?.email?.split('@')[0] || 'User'

  const handleFirestoreSetup = async () => {
    if (!currentUser) {
      alert('Please sign in first')
      return
    }

    setIsSettingUpFirestore(true)
    try {
      const success = await completeFirestoreSetup(currentUser, currentUser, leagueId)
      if (success) {
        setFirestoreSetupComplete(true)
        alert('✅ Firestore setup completed successfully!')
      } else {
        alert('❌ Firestore setup failed. Please try again.')
      }
    } catch (error) {
      console.error('Firestore setup error:', error)
      alert('❌ Firestore setup failed. Please try again.')
    } finally {
      setIsSettingUpFirestore(false)
    }
  }

  // Mock data for mobile layout demo
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      text: 'Hey everyone! Welcome to our enhanced chat system! 🎉',
      sender: 'Alice',
      senderEmail: 'alice@example.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      reactions: [
        { emoji: '👍', users: ['bob@example.com', 'charlie@example.com'], count: 2 },
        { emoji: '❤️', users: ['alice@example.com'], count: 1 }
      ]
    },
    {
      id: '2',
      text: 'This is amazing! I love the new features!',
      sender: 'Bob',
      senderEmail: 'bob@example.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
      replyTo: '1'
    },
    {
      id: '3',
      text: 'Check out this cool image I found!',
      sender: 'Charlie',
      senderEmail: 'charlie@example.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 1),
      attachments: [
        {
          id: 'att1',
          name: 'cool-image.jpg',
          url: 'https://via.placeholder.com/300x200',
          type: 'image',
          size: 1024 * 50,
          uploadedAt: new Date()
        }
      ]
    }
  ]

  const mockTypingUsers = [
    { userEmail: 'dave@example.com', userName: 'Dave', timestamp: new Date() }
  ]

  const handleMockSendMessage = async (text: string) => {
    console.log('Sending message:', text)
    // In a real implementation, this would send to Firestore
  }

  const handleMockDeleteMessage = async (messageId: string) => {
    console.log('Deleting message:', messageId)
  }

  const handleMockEditMessage = async (messageId: string, newText: string) => {
    console.log('Editing message:', messageId, 'to:', newText)
  }

  const handleMockReactToMessage = async (messageId: string, emoji: string) => {
    console.log('Reacting to message:', messageId, 'with:', emoji)
  }

  const handleMockReplyToMessage = async (messageId: string) => {
    console.log('Replying to message:', messageId)
  }

  const handleMockLoadMore = async () => {
    console.log('Loading more messages...')
  }

  const handleMockModerate = async (messageId: string, action: 'warn' | 'hide' | 'delete', reason: string) => {
    console.log('Moderating message:', messageId, 'action:', action, 'reason:', reason)
  }

  const handleMockBulkAction = async (action: 'hide' | 'delete', messageIds: string[]) => {
    console.log('Bulk action:', action, 'on messages:', messageIds)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🚀 Enhanced Chat Demo</h1>
        
        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Chat Configuration */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">⚙️ Chat Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Chat Type</label>
                <select
                  value={chatType}
                  onChange={(e) => setChatType(e.target.value as ChatType)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="league">🏆 League Chat</option>
                  <option value="global">🌎 Global Chat</option>
                  <option value="direct">📬 Direct Message</option>
                  <option value="mobile">📱 Mobile Layout</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">League ID</label>
                <input
                  type="text"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter league ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Recipient Email (for DM)</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter recipient email"
                />
              </div>
              
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Admin</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isCommissioner}
                    onChange={(e) => setIsCommissioner(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Commissioner</span>
                </label>
              </div>
            </div>
          </div>

          {/* Firestore Setup */}
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
        </div>

        {/* Enhanced Features Showcase */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">✨ New Enhanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">😀</div>
              <h3 className="font-medium mb-1">Message Reactions</h3>
              <p className="text-sm text-gray-400">React to messages with emojis</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">📎</div>
              <h3 className="font-medium mb-1">File Sharing</h3>
              <p className="text-sm text-gray-400">Upload and share files</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="font-medium mb-1">Moderation Tools</h3>
              <p className="text-sm text-gray-400">Admin controls for message moderation</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium mb-1">Analytics</h3>
              <p className="text-sm text-gray-400">Chat usage insights and statistics</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">🔔</div>
              <h3 className="font-medium mb-1">Push Notifications</h3>
              <p className="text-sm text-gray-400">Real-time notifications for new messages</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-medium mb-1">Mobile Optimized</h3>
              <p className="text-sm text-gray-400">Responsive design for all devices</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-medium mb-1">Reply Threads</h3>
              <p className="text-sm text-gray-400">Reply to specific messages</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-medium mb-1">Typing Indicators</h3>
              <p className="text-sm text-gray-400">See when others are typing</p>
            </div>
          </div>
        </div>

        {/* Chat Display */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          {chatType === 'mobile' ? (
            <MobileChatLayout
              messages={mockMessages}
              loading={false}
              error={null}
              hasMore={false}
              typingUsers={mockTypingUsers}
              currentUser={currentUser}
              currentUserName={currentUserName}
              isAdmin={isAdmin}
              chatType="league"
              onSendMessage={handleMockSendMessage}
              onDeleteMessage={handleMockDeleteMessage}
              onEditMessage={handleMockEditMessage}
              onReactToMessage={handleMockReactToMessage}
              onReplyToMessage={handleMockReplyToMessage}
              onLoadMore={handleMockLoadMore}
              onModerate={handleMockModerate}
              onBulkAction={handleMockBulkAction}
            />
          ) : (
            <div className="h-96">
              {chatType === 'league' && (
                <LeagueChat
                  currentUser={currentUser}
                  currentUserName={currentUserName}
                  leagueId={leagueId}
                />
              )}
              {chatType === 'global' && (
                <GlobalChat
                  currentUser={currentUser}
                  currentUserName={currentUserName}
                  isAdmin={isAdmin}
                />
              )}
              {chatType === 'direct' && (
                <DMChat
                  currentUser={currentUser}
                  currentUserName={currentUserName}
                  recipient={recipientEmail}
                  recipientName={recipientEmail.split('@')[0]}
                />
              )}
            </div>
          )}
        </div>

        {/* How to Use Section */}
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">📖 How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="font-medium text-blue-400 mb-2">🏆 League Chat</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Only league members can read/send messages</li>
                <li>• Moderated by the league commissioner</li>
                <li>• Messages stored in: leagueChats/{leagueId}/messages</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-400 mb-2">📬 Direct Messages</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Private conversations between two users</li>
                <li>• Auto-generated conversation ID</li>
                <li>• Messages stored in: privateMessages/[conversationId]/messages</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-purple-400 mb-2">🌎 Global Chat</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• All logged-in users can access</li>
                <li>• Only system admins can moderate</li>
                <li>• Messages stored in: globalChatMessages</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-yellow-400 mb-2">🔐 Authentication</h3>
              <ul className="text-sm text-gray-400 space-y-1">
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