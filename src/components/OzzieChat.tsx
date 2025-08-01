'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ozzie'
  timestamp: Date
  warning?: string
  teamInfo?: {
    name: string
    id: string
    rosterSize?: number
  }
}

interface Team {
  id: string
  name: string
  abbreviation: string
}

interface OzzieChatProps {
  leagueId?: string
  teamId?: string
}

const examplePrompts = [
  "How are the Browns doing this season?",
  "What are my team's weaknesses?",
  "Tell me about the Patriots roster",
  "What about the Bills defense?",
  "Should I re-sign my QB?",
  "Who should I target in the draft?"
]

export default function OzzieChat({ leagueId: propLeagueId, teamId: propTeamId }: OzzieChatProps) {
  const params = useParams()
  
  // Only use searchParams in client-side rendering to avoid build errors
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  
  useEffect(() => {
    // Only access searchParams on the client side
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search))
    }
  }, [])
  
  // Get leagueId and teamId from props, URL params, or search params
  const leagueId = propLeagueId || params.leagueId as string || '12335716'
  const teamId = propTeamId || searchParams?.get('teamId') || params.teamId as string

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPrompts, setShowPrompts] = useState(true)
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teamId || null)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [teamModalData, setTeamModalData] = useState<{teams: string[], suggestion: string} | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load available teams when component mounts
  useEffect(() => {
    const loadTeams = async () => {
      try {
        // Use the existing teams endpoint instead of ozzie/teams
        const response = await fetch(`https://api.couchlytics.com/leagues/${leagueId}/teams`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          console.log('Teams response for Ozzie:', data)
          
          // Transform the teams data to match our interface
          const transformedTeams = (data.teams || []).map((team: Record<string, unknown>) => ({
            id: (team.id || team.team_id) as string,
            name: (team.name || team.team_name || (team.city as string) + ' ' + (team.name as string)) as string,
            abbreviation: (team.abbreviation || team.abbr || (team.name as string)?.substring(0, 3).toUpperCase()) as string
          }))
          
          setAvailableTeams(transformedTeams)
          // Set default team if none selected
          if (!selectedTeamId && transformedTeams.length > 0) {
            setSelectedTeamId(transformedTeams[0].id)
          }
        } else {
          console.error('Failed to load teams for Ozzie:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to load teams for Ozzie:', error)
      }
    }

    if (leagueId) {
      loadTeams()
    }
  }, [leagueId, selectedTeamId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Improved Ozzie message function with better error handling
  const sendOzzieMessage = async (question: string, leagueId: string, teamId: string | null = null) => {
    try {
      const requestData: Record<string, unknown> = {
        question: question,
        leagueId: leagueId
      }
      
      // Only include teamId if explicitly provided
      if (teamId) {
        requestData.teamId = teamId
      }
      
      console.log('Sending Ozzie request:', requestData)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/ozzie/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Ozzie response:', data)
        
        // Handle warnings about default team usage
        if (data.warning) {
          console.warn('Ozzie Warning:', data.warning)
          return { ...data, warning: data.warning }
        }
        
        return data
      } else {
        const error = await response.json()
        
        // Handle team resolution errors with helpful suggestions
        if (error.available_teams) {
          console.error('Team not found. Available teams:', error.available_teams)
          setTeamModalData({
            teams: error.available_teams,
            suggestion: error.suggestion || 'Please select a team from the list below:'
          })
          setShowTeamModal(true)
          return null
        }
        
        throw new Error(error.error || 'Failed to get Ozzie response')
      }
    } catch (error) {
      console.error('Ozzie error:', error)
      throw error
    }
  }

  const handleSubmit = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setShowPrompts(false)

    try {
      // Check if we have the required fields
      if (!leagueId) {
        throw new Error('League ID is required')
      }

      const response = await sendOzzieMessage(messageText, leagueId, selectedTeamId)

      if (response) {
        const ozzieMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.response || "I'm sorry, I couldn't process your request right now.",
          sender: 'ozzie',
          timestamp: new Date(),
          warning: response.warning,
          teamInfo: response.team_name ? {
            name: response.team_name,
            id: response.team_id || '',
            rosterSize: response.roster_size
          } : undefined
        }

        setMessages(prev => [...prev, ozzieMessage])
      }
    } catch (error) {
      console.error('Error sending message to Ozzie:', error)
      
      // Provide more specific error messages
      let errorText = "I'm having trouble connecting right now. Please try again later."
      
      if (error instanceof Error) {
        if (error.message.includes('teamId')) {
          errorText = "Please select a team first to ask Ozzie questions."
        } else if (error.message.includes('leagueId')) {
          errorText = "League information is missing. Please refresh the page."
        } else if (error.message.includes('400')) {
          errorText = "Invalid request. Please check your question and try again."
        } else if (error.message.includes('500')) {
          errorText = "Server error. Please try again in a moment."
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'ozzie',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendClick = () => {
    handleSubmit(inputValue)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(inputValue)
    }
  }

  const handlePromptClick = (prompt: string) => {
    handleSubmit(prompt)
  }

  const handleTeamSelection = (teamId: string) => {
    setSelectedTeamId(teamId)
    setShowTeamModal(false)
    setTeamModalData(null)
  }

  return (
    <>
      {/* Floating Ozzie Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Chat with Ozzie"
      >
        <div className="text-white font-bold text-lg">O</div>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4">
          <div className="bg-gray-900 rounded-t-lg shadow-2xl w-full max-w-md h-[600px] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-white font-semibold text-lg">Ask Ozzie – Your Assistant GM</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Team Selector */}
            <div className="p-4 border-b border-gray-700">
              <label htmlFor="team-select" className="block text-sm font-medium text-gray-300 mb-2">
                Select Team (Optional):
              </label>
              <select
                id="team-select"
                value={selectedTeamId || ''}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-green"
              >
                <option value="">Let Ozzie choose automatically</option>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.abbreviation})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to let Ozzie detect the team from your question
              </p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && showPrompts && (
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm text-center mb-4">Try asking Ozzie about any team:</p>
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Warning Message */}
                  {message.warning && (
                    <div className="mt-2 ml-4">
                      <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-2 rounded text-xs flex justify-between items-center">
                        <span>⚠️ {message.warning}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Team Info */}
                  {message.teamInfo && (
                    <div className="mt-2 ml-4">
                      <div className="bg-blue-900 text-white p-2 rounded text-xs inline-block">
                        <span className="font-semibold mr-2">{message.teamInfo.name}</span>
                        {message.teamInfo.rosterSize && (
                          <span className="opacity-80">{message.teamInfo.rosterSize} players</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about any team: 'How are the Browns doing?' or 'What about my team?'"
                  className="flex-1 bg-gray-800 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-green disabled:opacity-50"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendClick}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-neon-green hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Selection Modal */}
      {showTeamModal && teamModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Team Not Found</h3>
              <p className="text-gray-300 mb-4">{teamModalData.suggestion}</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {teamModalData.teams.map((team, index) => (
                  <button
                    key={index}
                    onClick={() => handleTeamSelection(team.split(' ')[0])}
                    className="p-3 border border-gray-600 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
                  >
                    {team}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowTeamModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 