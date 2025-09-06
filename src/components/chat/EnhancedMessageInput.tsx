'use client'

import React, { useState, useRef, useEffect } from 'react'
import EmojiPicker from './EmojiPicker'
import GifPicker from './GifPicker'

interface EnhancedMessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
  replyTo?: {
    messageId: string
    sender: string
    text: string
  }
  onCancelReply?: () => void
}

export default function EnhancedMessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  replyTo,
  onCancelReply
}: EnhancedMessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const gifPickerRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(40, Math.min(120, textareaRef.current.scrollHeight))}px`
    }
  }, [value])

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        onSend()
      }
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + emoji + value.substring(end)
      onChange(newValue)
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
  }

  const handleGifSelect = (gifUrl: string, gifTitle: string) => {
    const gifText = `[GIF: ${gifTitle}](${gifUrl})`
    onChange(value + (value ? ' ' : '') + gifText)
  }

  const handleSend = () => {
    if (value.trim()) {
      onSend()
    }
  }

  return (
    <div className="relative">
      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-gray-800 border-l-4 border-blue-500 p-3 mb-2 rounded-r-md">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-blue-400 font-medium">
                Replying to {replyTo.sender}
              </div>
              <div className="text-sm text-gray-300 truncate mt-1">
                {replyTo.text}
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="ml-2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className={`flex items-end space-x-2 p-3 bg-gray-800 rounded-lg border transition-colors ${
        isFocused ? 'border-blue-500' : 'border-gray-700'
      }`}>
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Emoji Button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker)
                setShowGifPicker(false)
              }}
              disabled={disabled}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add emoji"
            >
              😀
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>

          {/* GIF Button */}
          <div className="relative" ref={gifPickerRef}>
            <button
              onClick={() => {
                setShowGifPicker(!showGifPicker)
                setShowEmojiPicker(false)
              }}
              disabled={disabled}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add GIF"
            >
              🎬
            </button>
            {showGifPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <GifPicker
                  onGifSelect={handleGifSelect}
                  onClose={() => setShowGifPicker(false)}
                />
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-gray-500 mt-1">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}
