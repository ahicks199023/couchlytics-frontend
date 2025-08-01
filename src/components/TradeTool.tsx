'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import TradeSubmissionForm from './trades/TradeSubmissionForm'
import TradeCalculatorForm from '@/app/leagues/[leagueId]/trade-tool/TradeCalculatorForm'

interface TradeToolProps {
  leagueId?: string
}

type ToolMode = 'submission' | 'analyzer'

export default function TradeTool({ leagueId: propLeagueId }: TradeToolProps) {
  const params = useParams()
  const leagueId = propLeagueId || params.leagueId as string || '12335716'

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [mode, setMode] = useState<ToolMode>('submission')
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const modalRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

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
      if (isDragging && !isMinimized) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging && !isMinimized) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, isMinimized])

  const handleTradeSubmitted = () => {
    // Close the modal after successful trade submission
    setIsOpen(false)
  }

  const toggleMode = () => {
    setMode(mode === 'submission' ? 'analyzer' : 'submission')
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <>
      {/* Floating Trade Tool Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Trade Tool"
      >
        <div className="text-white font-bold text-lg">T</div>
      </button>

      {/* Modal Overlay - Only show when not minimized */}
      {isOpen && !isMinimized && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] transition-all duration-300"
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
              className="flex items-center justify-between p-4 border-b border-gray-700 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold text-white">
                  Trade Tool - {mode === 'submission' ? 'Submit Trade' : 'Trade Analyzer'}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={toggleMode}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      mode === 'submission'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Submit
                  </button>
                  <button
                    onClick={toggleMode}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      mode === 'analyzer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Analyze
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMinimize}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Minimize to bottom tab"
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

            {/* Content */}
            <div className="p-6 overflow-y-auto h-full">
              {mode === 'submission' ? (
                <TradeSubmissionForm 
                  leagueId={leagueId}
                  onTradeSubmitted={handleTradeSubmitted}
                />
              ) : (
                <div className="h-full">
                  <TradeCalculatorForm league_id={leagueId} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab - When minimized */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-[60]">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-4">
              <h3 className="text-white font-medium">
                Trade Tool - {mode === 'submission' ? 'Submit Trade' : 'Trade Analyzer'}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={toggleMode}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    mode === 'submission'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Submit
                </button>
                <button
                  onClick={toggleMode}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    mode === 'analyzer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Analyze
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMinimize}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Maximize"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 