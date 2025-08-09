'use client'

import React, { useState } from 'react'
import { ChatMessage as ChatMessageType, MessageReaction } from '@/types/chat'
import { formatTimestamp } from '@/lib/chatUtils'

interface ChatMessageProps {
  message: ChatMessageType
  currentUserEmail: string
  isAdmin?: boolean
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string, newText: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onReply?: (messageId: string) => void
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡']

export default function ChatMessage({
  message,
  currentUserEmail,
  isAdmin = false,
  onDelete,
  onEdit,
  onReact,
  onReply
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [showReactions, setShowReactions] = useState(false)

  const isOwnMessage = message.senderEmail === currentUserEmail
  const canEdit = isOwnMessage && !message.deleted
  const canDelete = isOwnMessage || isAdmin
  const canModerate = isAdmin

  const handleEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit?.(message.id, editText)
    }
    setIsEditing(false)
  }

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji)
    setShowReactions(false)
  }

  const getReactionCount = (emoji: string) => {
    return message.reactions?.find(r => r.emoji === emoji)?.count || 0
  }

  const hasUserReacted = (emoji: string) => {
    return message.reactions?.find(r => r.emoji === emoji)?.users.includes(currentUserEmail) || false
  }

  if (message.deleted) {
    return (
      <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
        <div className="flex-1">
          <div className="text-gray-500 italic text-sm">
            Message deleted by {message.deletedBy || 'user'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-800/30 rounded-lg transition-colors group">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {message.sender.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-white">{message.sender}</span>
          <span className="text-gray-400 text-sm">{formatTimestamp(message.timestamp)}</span>
          {message.edited && (
            <span className="text-gray-500 text-xs">(edited)</span>
          )}
          {message.moderated && (
            <span className="text-red-400 text-xs">(moderated)</span>
          )}
        </div>

        {/* Reply Reference */}
        {message.replyTo && (
          <div className="text-gray-400 text-sm mb-2 italic">
            Replying to a message...
          </div>
        )}

        {/* Message Text */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={Math.max(1, Math.min(4, editText.split('\n').length))}
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
                onClick={() => {
                  setIsEditing(false)
                  setEditText(message.text)
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-white whitespace-pre-wrap break-words">
            {message.text}
          </div>
        )}

        {/* File Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-700 rounded">
                <span className="text-lg">
                  {attachment.type === 'image' && '🖼️'}
                  {attachment.type === 'document' && '📄'}
                  {attachment.type === 'video' && '🎥'}
                  {attachment.type === 'audio' && '🎵'}
                </span>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {attachment.name}
                </a>
                <span className="text-gray-400 text-xs">
                  ({(attachment.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={`px-2 py-1 rounded-full text-sm transition-colors ${
                  hasUserReacted(reaction.emoji)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            😀
          </button>
          <button
            onClick={() => onReply?.(message.id)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Reply
          </button>
          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete?.(message.id)}
              className="text-gray-400 hover:text-red-400 text-sm transition-colors"
            >
              Delete
            </button>
          )}
          {canModerate && !message.moderated && (
            <button
              onClick={() => {/* TODO: Implement moderation */}}
              className="text-gray-400 hover:text-yellow-400 text-sm transition-colors"
            >
              Moderate
            </button>
          )}
        </div>

        {/* Reaction Picker */}
        {showReactions && (
          <div className="absolute mt-2 p-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <div className="flex space-x-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-700 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 