'use client'

import React, { useState } from 'react'
import { ChatMessage } from '@/types/chat'

interface ModerationPanelProps {
  messages: ChatMessage[]
  onModerate: (messageId: string, action: 'warn' | 'hide' | 'delete', reason: string) => void
  onBulkAction: (action: 'hide' | 'delete', messageIds: string[]) => void
  isAdmin: boolean
}

export default function ModerationPanel({
  messages,
  onModerate,
  onBulkAction,
  isAdmin
}: ModerationPanelProps) {
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [moderationReason, setModerationReason] = useState('')
  const [showReasonInput, setShowReasonInput] = useState<string | null>(null)

  if (!isAdmin) return null

  const flaggedMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes('spam') || 
    msg.text.toLowerCase().includes('inappropriate') ||
    msg.reactions?.some(r => r.emoji === '😡' && r.count > 3)
  )

  const handleSelectMessage = (messageId: string) => {
    const newSelected = new Set(selectedMessages)
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId)
    } else {
      newSelected.add(messageId)
    }
    setSelectedMessages(newSelected)
  }

  const handleBulkAction = (action: 'hide' | 'delete') => {
    if (selectedMessages.size === 0) return
    onBulkAction(action, Array.from(selectedMessages))
    setSelectedMessages(new Set())
  }

  const handleModerate = (messageId: string, action: 'warn' | 'hide' | 'delete') => {
    if (action === 'warn') {
      setShowReasonInput(messageId)
    } else {
      onModerate(messageId, action, moderationReason || 'No reason provided')
      setModerationReason('')
    }
  }

  const handleReasonSubmit = (messageId: string) => {
    onModerate(messageId, 'warn', moderationReason)
    setModerationReason('')
    setShowReasonInput(null)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">🛡️ Moderation Panel</h3>
      
      {/* Bulk Actions */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <h4 className="text-white font-medium mb-2">Bulk Actions</h4>
        <div className="flex space-x-2">
          <button
            onClick={() => handleBulkAction('hide')}
            disabled={selectedMessages.size === 0}
            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hide Selected ({selectedMessages.size})
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={selectedMessages.size === 0}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Selected ({selectedMessages.size})
          </button>
        </div>
      </div>

      {/* Flagged Messages */}
      <div>
        <h4 className="text-white font-medium mb-2">Flagged Messages ({flaggedMessages.length})</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {flaggedMessages.map((message) => (
            <div key={message.id} className="p-3 bg-gray-700 rounded border-l-4 border-red-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <input
                      type="checkbox"
                      checked={selectedMessages.has(message.id)}
                      onChange={() => handleSelectMessage(message.id)}
                      className="rounded"
                    />
                    <span className="text-white font-medium text-sm">{message.sender}</span>
                    <span className="text-gray-400 text-xs">{message.timestamp.toLocaleString()}</span>
                  </div>
                  <div className="text-gray-300 text-sm">{message.text}</div>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleModerate(message.id, 'warn')}
                    className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                  >
                    Warn
                  </button>
                  <button
                    onClick={() => handleModerate(message.id, 'hide')}
                    className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => handleModerate(message.id, 'delete')}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Reason Input */}
              {showReasonInput === message.id && (
                <div className="mt-2 p-2 bg-gray-600 rounded">
                  <textarea
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="Enter moderation reason..."
                    className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleReasonSubmit(message.id)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Send Warning
                    </button>
                    <button
                      onClick={() => setShowReasonInput(null)}
                      className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {flaggedMessages.length === 0 && (
            <div className="text-gray-400 text-sm italic">No flagged messages</div>
          )}
        </div>
      </div>
    </div>
  )
} 