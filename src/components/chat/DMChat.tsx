'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext'
import { db } from '@/lib/firebase'
import useDirectMessages from '@/Hooks/useDirectMessages'
import { groupMessagesBySender } from '@/lib/chatUtils'
import ChatMessage from './ChatMessage'

interface DMChatProps {
  currentUser?: string // Now optional, will use Firebase user if not provided
  recipient: string
  currentUserName?: string // Now optional, will use Firebase user if not provided
  recipientName?: string
}

export default function DMChat({ 
  currentUser: propCurrentUser,
  recipient, 
  currentUserName: propCurrentUserName,
  recipientName = 'Recipient'
}: DMChatProps) {
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { firebaseUser, isFirebaseAuthenticated, firebaseError } = useFirebaseAuth()

  // Use Firebase user if available, otherwise fall back to props
  const currentUser = firebaseUser?.email || propCurrentUser
  const currentUserName = firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || propCurrentUserName || 'User'

  const {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    deleteMessage,
    editMessage,
    loadMoreMessages
  } = useDirectMessages(currentUser || '', recipient)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending || !currentUser) return

    setIsSending(true)
    try {
      await sendMessage({
        text: messageText,
        sender: currentUserName,
        senderEmail: currentUser
      })
      setMessageText('')
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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
  if (firebaseError) {
    return (
      <div className="flex flex-col h-full bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">📬 Direct Message</h3>
            <p className="text-sm text-gray-400">Chat with {recipientName}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-red-400 text-center">
            <p className="mb-2">❌ Firebase Authentication Error</p>
            <p className="text-sm">{firebaseError}</p>
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
            <h3 className="text-lg font-semibold text-white">📬 Direct Message</h3>
            <p className="text-sm text-gray-400">Chat with {recipientName}</p>
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
          <h3 className="text-lg font-semibold text-white">📬 Direct Message</h3>
          <p className="text-sm text-gray-400">Chat with {recipientName}</p>
          {firebaseUser && (
            <p className="text-xs text-green-400">✅ Firebase Connected</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-xs text-green-400">Online</span>
        </div>
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
                    onDelete={handleDelete}
                    onEdit={handleEdit}
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
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={currentUser ? `Message ${recipientName}...` : "Connecting to Firebase..."}
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={Math.max(1, Math.min(4, messageText.split('\n').length))}
            disabled={isSending || !currentUser}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending || !currentUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
} 