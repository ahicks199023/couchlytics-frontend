'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import TradeSubmissionForm from './trades/TradeSubmissionForm'

interface TradeToolProps {
  leagueId?: string
}

export default function TradeTool({ leagueId: propLeagueId }: TradeToolProps) {
  const params = useParams()
  const leagueId = propLeagueId || params.leagueId as string || '12335716'

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleTradeSubmitted = () => {
    // Close the modal after successful trade submission
    setIsOpen(false)
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

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Trade Tool</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <TradeSubmissionForm 
                leagueId={leagueId}
                onTradeSubmitted={handleTradeSubmitted}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
} 