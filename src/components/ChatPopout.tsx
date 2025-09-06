'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LeagueChat from './chat/LeagueChat'
import GlobalChat from './chat/GlobalChat'
import { getFirebaseUserEmail } from '@/lib/firebase'

interface ChatPopoutProps {
  leagueId?: string
}

type ChatMode = 'league' | 'global'

export default function ChatPopout({ leagueId }: ChatPopoutProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('league')
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const modalRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const { firebaseUser, user: couchlyticsUser } = useAuth()

  const currentUser = getFirebaseUserEmail(firebaseUser) || couchlyticsUser?.email || ''
  const currentUserName = firebaseUser?.displayName || getFirebaseUserEmail(firebaseUser)?.split('@')[0] || couchlyticsUser?.email?.split('@')[0] || 'User'

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen && !isMinimized) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, isMinimized])

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (headerRef.current && headerRef.current.contains(e.target as Node) && !isMinimized) {
      setIsDragging(true)
      const rect = modalRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const toggleChatMode = () => {
    setChatMode(chatMode === 'league' ? 'global' : 'league')
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-40 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Chat"
      >
        <div className="text-white font-bold text-lg">💬</div>
      </button>

      {/* Modal Overlay - Only show when not minimized */}
      {isOpen && !isMinimized && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] transition-all duration-300"
            style={{
              position: 'absolute',
              left: `${position.x}px`,
              top: `${position.y}px`,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Header */}
            <div 
              ref={headerRef}
              className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center space-x-4">
                <h2 className="text-white font-semibold text-lg">
                  {chatMode === 'league' ? '💬 League Chat' : '🌍 Global Chat'}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleChatMode}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      chatMode === 'league'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    League
                  </button>
                  <button
                    onClick={toggleChatMode}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      chatMode === 'global'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    Global
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMinimize}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Minimize"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 h-full overflow-hidden">
              {chatMode === 'league' ? (
                leagueId ? (
                  <LeagueChat
                    currentUser={currentUser}
                    currentUserName={currentUserName}
                    leagueId={leagueId}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🏈</div>
                      <p className="text-lg">No league selected</p>
                      <p className="text-sm">Please navigate to a league page to use league chat</p>
                    </div>
                  </div>
                )
              ) : (
                <GlobalChat
                  currentUser={currentUser}
                  currentUserName={currentUserName}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minimized State */}
      {isOpen && isMinimized && (
        <div 
          className="fixed bottom-6 right-40 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center cursor-pointer"
          onClick={toggleMinimize}
          title={`${chatMode === 'league' ? 'League' : 'Global'} Chat - Click to restore`}
        >
          <div className="text-white font-bold text-lg">💬</div>
        </div>
      )}
    </>
  )
}
