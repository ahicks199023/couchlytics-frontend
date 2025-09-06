'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useLeagueMessages from '@/Hooks/useLeagueMessages'
import { groupMessagesBySender } from '@/lib/chatUtils'
import ChatMessage from './ChatMessage'
import EnhancedMessageInput from './EnhancedMessageInput'
import { getFirebaseUserEmail } from '@/lib/firebase'

interface LeagueChatProps {
  leagueId: string
  currentUser?: string // Now optional, will use Firebase user if not provided
  currentUserName?: string // Now optional, will use Firebase user if not provided
  isCommissioner?: boolean
}

export default function LeagueChat({ 
  leagueId, 
  currentUser: propCurrentUser,
  currentUserName: propCurrentUserName,
  isCommissioner = false 
}: LeagueChatProps) {
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [replyTo, setReplyTo] = useState<{messageId: string, sender: string, text: string} | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { firebaseUser, isFirebaseAuthenticated, user: couchlyticsUser } = useAuth()

  // Use Firebase user if available, otherwise fall back to props
  const currentUser = getFirebaseUserEmail(firebaseUser) || couchlyticsUser?.email || propCurrentUser || ''
  const currentUserName = firebaseUser?.displayName || getFirebaseUserEmail(firebaseUser)?.split('@')[0] || couchlyticsUser?.email?.split('@')[0] || propCurrentUserName || 'User'

  // Enable chat if user is authenticated with either Firebase OR backend
  const isAuthenticated = isFirebaseAuthenticated || !!couchlyticsUser
  console.log('🔍 Chat authentication status:', { 
    isFirebaseAuthenticated, 
    couchlyticsUser: !!couchlyticsUser, 
    isAuthenticated,
    currentUser 
  })

  const {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    deleteMessage,
    editMessage,
    reactToMessage,
    loadMoreMessages
  } = useLeagueMessages(leagueId, isAuthenticated)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    // Focus will be handled by the EnhancedMessageInput component
  }, [])

  // Re-trigger chat when authentication state changes
  useEffect(() => {
    console.log('🔄 Authentication state changed, re-evaluating chat access:', {
      isAuthenticated,
      currentUser,
      couchlyticsUser: !!couchlyticsUser,
      firebaseUser: !!firebaseUser
    })
  }, [isAuthenticated, currentUser, couchlyticsUser, firebaseUser])

  // Show loading state while authentication is being determined
  if (!isAuthenticated && !currentUser) {
    console.log('⏳ Waiting for authentication to complete...')
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to chat...</p>
        </div>
      </div>
    )
  }

  const handleSendMessage = async () => {
    console.log('🔍 handleSendMessage called:', { 
      messageText: messageText.trim(), 
      isSending, 
      currentUser,
      currentUserName,
      replyTo
    })
    
    if (!messageText.trim() || isSending || !currentUser) {
      console.log('❌ Send message blocked:', { 
        hasText: !!messageText.trim(), 
        isSending, 
        hasUser: !!currentUser 
      })
      return
    }

    console.log('🔍 Attempting to send message...')
    setIsSending(true)
    try {
      await sendMessage({
        text: messageText,
        sender: currentUserName,
        senderEmail: currentUser,
        replyTo: replyTo?.messageId
      })
      console.log('✅ Message sent successfully')
      setMessageText('')
      setReplyTo(null)
    } catch (err) {
      console.error('❌ Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setReplyTo({
        messageId: message.id,
        sender: message.sender,
        text: message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text
      })
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    if (currentUser) {
      await reactToMessage(messageId, emoji, currentUser)
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  const handleEdit = async (messageId: string, newText: string) => {
    try {
      await editMessage(messageId, newText)
    } catch (err) {
      console.error('Failed to edit message:', err)
    }
  }

  const messageGroups = groupMessagesBySender(messages)

  // Show Firebase authentication error
  if (error) {
    return (
      <div className="flex flex-col h-full bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">🔥 League Chat</h3>
            <p className="text-sm text-gray-400">League members only</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-red-400 text-center">
            <p className="mb-2">❌ Firebase Authentication Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while Firebase is initializing
  if (!isFirebaseAuthenticated && !propCurrentUser) {
    return (
      <div className="flex flex-col h-full bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">🔥 League Chat</h3>
            <p className="text-sm text-gray-400">League members only</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-gray-400">Initializing Firebase authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-white">🔥 League Chat</h3>
          <p className="text-sm text-gray-400">League members only</p>
          {firebaseUser && (
            <p className="text-xs text-green-400">✅ Firebase Connected</p>
          )}
        </div>
        {isCommissioner && (
          <div className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
            👑 Commissioner
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400">Loading messages...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-red-400">Error: {error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400">No messages yet. Start the conversation!</div>
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={loadMoreMessages}
                className="w-full py-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Load more messages...
              </button>
            )}
            
            {messageGroups.map((group, groupIndex) => (
              <div key={`${group.senderEmail}-${groupIndex}`} className="space-y-1">
                {group.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    currentUserEmail={currentUser || ''}
                    isCommissioner={isCommissioner}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onReply={handleReply}
                    onReact={handleReact}
                  />
                ))}
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
        <EnhancedMessageInput
          value={messageText}
          onChange={setMessageText}
          onSend={handleSendMessage}
          disabled={isSending || !currentUser}
          placeholder={currentUser ? "Type your message..." : "Connecting to Firebase..."}
          replyTo={replyTo || undefined}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  )
} 