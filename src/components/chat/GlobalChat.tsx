'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useGlobalMessages from '@/Hooks/useGlobalMessages'
import { groupMessagesBySender } from '@/lib/chatUtils'
import ChatMessage from './ChatMessage'
import EnhancedMessageInput from './EnhancedMessageInput'
import { getFirebaseUserEmail } from '@/lib/firebase'

interface GlobalChatProps {
  currentUser?: string
  currentUserName?: string
}

export default function GlobalChat({ 
  currentUser: propCurrentUser,
  currentUserName: propCurrentUserName
}: GlobalChatProps) {
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [replyTo, setReplyTo] = useState<{messageId: string, sender: string, text: string} | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { firebaseUser, isFirebaseAuthenticated, user: couchlyticsUser } = useAuth()

  // Use Firebase user if available, otherwise fall back to props
  const currentUser = getFirebaseUserEmail(firebaseUser) || couchlyticsUser?.email || propCurrentUser || ''
  const currentUserName = firebaseUser?.displayName || getFirebaseUserEmail(firebaseUser)?.split('@')[0] || couchlyticsUser?.email?.split('@')[0] || propCurrentUserName || 'User'

  // Check if user is authenticated (either Firebase or backend)
  const isAuthenticated = isFirebaseAuthenticated || !!couchlyticsUser

  console.log('🔍 GlobalChat rendered:', {
    currentUser,
    currentUserName,
    isFirebaseAuthenticated,
    couchlyticsUser: !!couchlyticsUser, 
    isAuthenticated
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
  } = useGlobalMessages(isAuthenticated)

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
    console.log('🔄 Authentication state changed, re-evaluating global chat access:', {
      isAuthenticated,
      currentUser 
    })
  }, [isAuthenticated, currentUser])

  // Show loading state while authentication is being determined
  if (!isAuthenticated && !currentUser) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading global chat...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your access</p>
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
      console.error('Error deleting message:', err)
    }
  }

  const handleEdit = async (messageId: string, newText: string) => {
    try {
      await editMessage(messageId, newText)
    } catch (err) {
      console.error('Error editing message:', err)
    }
  }

  // Group messages by sender for better display
  const messageGroups = groupMessagesBySender(messages)

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h3 className="text-lg font-semibold text-white">Global Chat</h3>
        <p className="text-sm text-gray-400">Chat with all Couchlytics users</p>
        {currentUser && (
          <p className="text-xs text-green-400 mt-1">
            ✅ Connected as: {currentUserName}
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-400">
              <p className="text-lg font-semibold">Error loading messages</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4">🌍</div>
              <p className="text-lg">No messages yet</p>
              <p className="text-sm mt-2">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadMoreMessages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Load More Messages
                </button>
              </div>
            )}
            
            {messageGroups.map((group, groupIndex) => (
              <div key={`${group.senderEmail}-${groupIndex}`} className="space-y-1">
                {group.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    currentUserEmail={currentUser || ''}
                    isCommissioner={false} // Global chat doesn't have commissioners
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