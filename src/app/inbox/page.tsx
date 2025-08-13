'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useDirectMessages from '@/Hooks/useDirectMessages'
import { useInbox } from '@/Hooks/useInbox'
import { getFirebaseUserEmail } from '@/lib/firebase'
import ChatMessage from '@/components/chat/ChatMessage'
import { groupMessagesBySender } from '@/lib/chatUtils'

export default function InboxPage() {
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { firebaseUser, isFirebaseAuthenticated, user: couchlyticsUser } = useAuth()

  const currentUser = getFirebaseUserEmail(firebaseUser) || couchlyticsUser?.email || ''
  
  const { conversations, loading, error, totalUnreadCount, markAsRead } = useInbox(currentUser)

  // Get messages for selected conversation
  const {
    messages,
    sendMessage,
    deleteMessage,
    editMessage,
    loading: messagesLoading
  } = useDirectMessages(currentUser || '', selectedRecipient || '', isFirebaseAuthenticated)

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedRecipient && conversations.length > 0) {
      const conversation = conversations.find(c => c.recipient === selectedRecipient)
      if (conversation) {
        markAsRead(conversation.conversationId)
      }
    }
  }, [selectedRecipient, conversations, markAsRead])

  const filteredConversations = conversations.filter(conv =>
    conv.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.recipient.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending || !currentUser || !selectedRecipient) return

    setIsSending(true)
    try {
      await sendMessage({
        text: messageText,
        sender: currentUser.split('@')[0],
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

  if (!isFirebaseAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Direct Messages</h1>
          <p className="text-gray-400">Please log in to view your messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">💬 Direct Messages</h1>
          <p className="text-gray-400 mt-2">
            {totalUnreadCount > 0 ? `${totalUnreadCount} unread message${totalUnreadCount === 1 ? '' : 's'}` : 'All caught up!'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-green"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading conversations...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                <p>Error loading conversations</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.recipient}
                    onClick={() => setSelectedRecipient(conversation.recipient)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedRecipient === conversation.recipient
                        ? 'bg-neon-green text-black'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conversation.recipientName}</p>
                        <p className="text-sm truncate text-gray-400">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.lastMessageTime.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredConversations.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-400">
                <p>No conversations found</p>
                <p className="text-sm mt-2">Start a new conversation to get started!</p>
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
            {selectedRecipient ? (
              <div className="h-96 flex flex-col">
                {/* Chat Header */}
                <div className="border-b border-gray-700 pb-3 mb-4">
                  <h3 className="text-lg font-semibold">
                    {conversations.find(c => c.recipient === selectedRecipient)?.recipientName}
                  </h3>
                  <p className="text-sm text-gray-400">{selectedRecipient}</p>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-700 rounded-md">
                  {messagesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-green mx-auto"></div>
                      <p className="text-gray-400 mt-2">Loading messages...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {groupMessagesBySender(messages).map((group, index) => (
                        <div key={index} className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">
                            {group.sender} • {group.messages[0].timestamp.toLocaleTimeString()}
                          </div>
                          {group.messages.map((message) => (
                            <ChatMessage
                              key={message.id}
                              message={message}
                              currentUserEmail={currentUser}
                              onDelete={handleDelete}
                              onEdit={handleEdit}
                              isCommissioner={false}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <p>💬 Start a conversation!</p>
                      <p className="text-sm mt-2">No messages yet. Send the first message!</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-green resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageText.trim()}
                    className="px-4 py-2 bg-neon-green text-black font-medium rounded-md hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-xl mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 