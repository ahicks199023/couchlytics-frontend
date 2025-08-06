'use client'

import React, { useState } from 'react'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { formatTimestamp, canEditMessage, canDeleteAnyMessage } from '@/lib/chatUtils'

interface ChatMessageProps {
  message: ChatMessageType
  currentUserEmail: string
  isAdmin?: boolean
  isCommissioner?: boolean
  onDelete: (messageId: string) => void
  onEdit: (messageId: string, newText: string) => void
}

export default function ChatMessage({ 
  message, 
  currentUserEmail, 
  isAdmin = false, 
  isCommissioner = false,
  onDelete, 
  onEdit 
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [showActions, setShowActions] = useState(false)

  const canEdit = canEditMessage(message, currentUserEmail)
  const canDelete = canDeleteAnyMessage(currentUserEmail, isAdmin, isCommissioner) || canEdit

  const handleEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(message.id, editText)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(message.text)
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  if (message.deleted) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm italic">
        <span>🗑️ Message deleted</span>
        {message.deletedBy && message.deletedBy !== message.senderEmail && (
          <span>by {message.deletedBy}</span>
        )}
      </div>
    )
  }

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start space-x-3 p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {message.sender.charAt(0).toUpperCase()}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-white font-medium text-sm">{message.sender}</span>
            <span className="text-gray-400 text-xs">{formatTimestamp(message.timestamp)}</span>
            {message.edited && (
              <span className="text-gray-500 text-xs">(edited)</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={Math.max(1, editText.split('\n').length)}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-300 text-sm whitespace-pre-wrap break-words">
              {message.text}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (canEdit || canDelete) && (
          <div className="flex-shrink-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Edit message"
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete message"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 