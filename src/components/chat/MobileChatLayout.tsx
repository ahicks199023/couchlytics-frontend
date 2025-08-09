'use client'

import React, { useState } from 'react'
import { ChatMessage } from '@/types/chat'
import ChatMessageComponent from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import ModerationPanel from './ModerationPanel'
import NotificationSystem from './NotificationSystem'
import ChatAnalytics from './ChatAnalytics'
import FileUpload from './FileUpload'

interface MobileChatLayoutProps {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  hasMore: boolean
  typingUsers: Array<{ userEmail: string; userName: string; timestamp: Date }>
  currentUser: string
  currentUserName: string
  isAdmin?: boolean
  chatType: 'league' | 'global' | 'direct'
  onSendMessage: (text: string) => void
  onDeleteMessage: (messageId: string) => void
  onEditMessage: (messageId: string, newText: string) => void
  onReactToMessage: (messageId: string, emoji: string) => void
  onReplyToMessage: (messageId: string) => void
  onLoadMore: () => void
  onModerate: (messageId: string, action: 'warn' | 'hide' | 'delete', reason: string) => void
  onBulkAction: (action: 'hide' | 'delete', messageIds: string[]) => void
}

export default function MobileChatLayout({
  messages,
  loading,
  error,
  hasMore,
  typingUsers,
  currentUser,
  currentUserName,
  isAdmin = false,
  chatType,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onReactToMessage,
  onReplyToMessage,
  onLoadMore,
  onModerate,
  onBulkAction
}: MobileChatLayoutProps) {
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'moderation' | 'analytics' | 'settings'>('chat')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(messageText)
      setMessageText('')
      setSelectedFiles([])
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

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files)
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden text-white p-2 hover:bg-gray-700 rounded"
              >
                ☰
              </button>
              <div>
                <h1 className="text-white font-semibold">
                  {chatType === 'league' && '🏆 League Chat'}
                  {chatType === 'global' && '🌎 Global Chat'}
                  {chatType === 'direct' && '📬 Direct Message'}
                </h1>
                <p className="text-gray-400 text-sm">
                  {messages.length} messages • {typingUsers.length > 0 && `${typingUsers.length} typing`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                  🔧 Admin
                </div>
              )}
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
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
                  onClick={onLoadMore}
                  className="w-full py-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Load more messages...
                </button>
              )}
              
              {messages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  currentUserEmail={currentUser}
                  isAdmin={isAdmin}
                  onDelete={onDeleteMessage}
                  onEdit={onEditMessage}
                  onReact={onReactToMessage}
                  onReply={onReplyToMessage}
                />
              ))}
            </>
          )}

          {/* Typing Indicator */}
          <TypingIndicator typingUsers={typingUsers} />
        </div>

        {/* File Upload Preview */}
        {selectedFiles.length > 0 && (
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">Attachments:</span>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-700 px-2 py-1 rounded text-sm">
                  <span>📎</span>
                  <span className="text-white">{file.name}</span>
                  <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSidebar(true)}
              className="text-gray-400 hover:text-white p-2 transition-colors"
            >
              📎
            </button>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={Math.max(1, Math.min(4, messageText.split('\n').length))}
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isSending}
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

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-gray-800 border-l border-gray-700 transform transition-transform duration-300 ease-in-out ${
        showSidebar ? 'translate-x-0' : 'translate-x-full'
      } md:relative md:translate-x-0 md:w-80`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Chat Tools</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              💬 Chat
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('moderation')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'moderation' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🛡️ Mod
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'analytics' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📊 Stats
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'chat' && (
              <div className="space-y-4">
                <FileUpload onFileSelect={handleFileSelect} />
              </div>
            )}

            {activeTab === 'moderation' && isAdmin && (
              <ModerationPanel
                messages={messages}
                onModerate={onModerate}
                onBulkAction={onBulkAction}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'analytics' && isAdmin && (
              <ChatAnalytics
                messages={messages}
                chatType={chatType}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <NotificationSystem
                  enabled={notificationsEnabled}
                  onToggle={setNotificationsEnabled}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
} 