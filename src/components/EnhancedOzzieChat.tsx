'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

// Types for enhanced features
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

interface Conversation {
  id: number
  title: string
  question: string
  response: string
  team_name: string
  folder_id?: number
  folder_name?: string
  is_archived: boolean
  is_favorite: boolean
  created_at: string
}

interface Folder {
  id: number
  name: string
  description: string
  color: string
  conversation_count: number
  is_default: boolean
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

export default function EnhancedOzzieChat({ leagueId: propLeagueId, teamId: propTeamId }: OzzieChatProps) {
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

  // Core chat state
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPrompts, setShowPrompts] = useState(true)
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teamId || null)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [teamModalData, setTeamModalData] = useState<{teams: string[], suggestion: string} | null>(null)
  
  // Enhanced features state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [showConversations, setShowConversations] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load available teams when component mounts
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch(`https://api.couchlytics.com/leagues/${leagueId}/teams`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          console.log('Teams response for Ozzie:', data)
          
          const transformedTeams = (data.teams || []).map((team: Record<string, unknown>) => ({
            id: (team.id || team.team_id) as string,
            name: (team.name || team.team_name || (team.city as string) + ' ' + (team.name as string)) as string,
            abbreviation: (team.abbreviation || team.abbr || (team.name as string)?.substring(0, 3).toUpperCase()) as string
          }))
          
          setAvailableTeams(transformedTeams)
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

  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedFolder) params.append('folderId', selectedFolder.toString())
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/ozzie-enhanced/conversations?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }, [selectedFolder])

  const loadFolders = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/ozzie-enhanced/folders`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }, [])

  // Load conversations and folders
  useEffect(() => {
    if (isOpen) {
      loadConversations()
      loadFolders()
    }
  }, [isOpen, loadConversations, loadFolders])

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

  // Enhanced Ozzie message function
  const sendOzzieMessage = async (question: string, leagueId: string, teamId: string | null = null, options: { saveConversation?: boolean, folderId?: number } = {}) => {
    try {
      const requestData: Record<string, unknown> = {
        question: question,
        leagueId: leagueId,
        pageContext: window.location.pathname,
        saveConversation: options.saveConversation !== false, // Default to true
        ...(options.folderId && { folderId: options.folderId })
      }
      
      if (teamId) {
        requestData.teamId = teamId
      }
      
      console.log('Sending enhanced Ozzie request:', requestData)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/ozzie-enhanced/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Enhanced Ozzie response:', data)
        
        if (data.conversation_id) {
          setCurrentConversationId(data.conversation_id)
          // Reload conversations to show the new one
          loadConversations()
        }
        
        if (data.warning) {
          console.warn('Ozzie Warning:', data.warning)
          return { ...data, warning: data.warning }
        }
        
        return data
      } else {
        const error = await response.json()
        
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
      if (!leagueId) {
        throw new Error('League ID is required')
      }

      const response = await sendOzzieMessage(messageText, leagueId, selectedTeamId, {
        saveConversation: true,
        folderId: selectedFolder || undefined
      })

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

  // Enhanced features handlers
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const toggleConversations = () => {
    setShowConversations(!showConversations)
  }

  const loadConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/ozzie-enhanced/conversations/${conversationId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const conversation = await response.json()
        
        // Convert conversation to messages format
        const conversationMessages: Message[] = [
          {
            id: '1',
            text: conversation.question,
            sender: 'user',
            timestamp: new Date(conversation.created_at)
          },
          {
            id: '2',
            text: conversation.response,
            sender: 'ozzie',
            timestamp: new Date(conversation.created_at)
          }
        ]
        
        setMessages(conversationMessages)
        setCurrentConversationId(conversationId)
        setShowConversations(false)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/ozzie-enhanced/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.conversations || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/ozzie-enhanced/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newFolderName,
          color: newFolderColor
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setFolders(prev => [...prev, data.folder])
        setNewFolderName('')
        setShowCreateFolder(false)
        loadFolders()
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const deleteConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/ozzie-enhanced/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
        if (currentConversationId === conversationId) {
          setMessages([])
          setCurrentConversationId(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const toggleFavorite = async (conversationId: number, isFavorite: boolean) => {
    try {
      const response = await fetch(`https://api.couchlytics.com/ozzie-enhanced/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_favorite: !isFavorite })
      })
      
      if (response.ok) {
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId ? { ...conv, is_favorite: !isFavorite } : conv
        ))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setShowPrompts(true)
  }

  // Format Ozzie's messages with proper spacing, bullet points, and emojis
  const formatOzzieMessage = (text: string) => {
    if (!text) return text

    // Split into paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim())
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim()
      
      // Check for bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <div key={index} className="ozzie-bullet-point">
            <span className="ozzie-bullet-marker">•</span>
            <span className="flex-1">{trimmed.replace(/^[•\-*]\s*/, '')}</span>
          </div>
        )
      }
      
      // Check for numbered lists
      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={index} className="ozzie-numbered-item">
            <span className="ozzie-number-marker">{trimmed.match(/^\d+\./)?.[0]}</span>
            <span className="flex-1">{trimmed.replace(/^\d+\.\s*/, '')}</span>
          </div>
        )
      }
      
      // Check for headers (lines that end with :)
      if (trimmed.endsWith(':') && trimmed.length < 50) {
        return (
          <div key={index} className="ozzie-header">
            {trimmed}
          </div>
        )
      }
      
      // Regular paragraph
      return (
        <div key={index}>
          <p>{trimmed}</p>
        </div>
      )
    })
  }

  // Add emojis based on content context
  const getContextEmoji = (text: string) => {
    const lowerText = text.toLowerCase()
    
    // Team analysis
    if (lowerText.includes('team') || lowerText.includes('roster') || lowerText.includes('players')) {
      return '🏈'
    }
    
    // Statistics
    if (lowerText.includes('stats') || lowerText.includes('statistics') || lowerText.includes('numbers')) {
      return '📊'
    }
    
    // Trade advice
    if (lowerText.includes('trade') || lowerText.includes('deal') || lowerText.includes('exchange')) {
      return '🤝'
    }
    
    // Draft advice
    if (lowerText.includes('draft') || lowerText.includes('pick') || lowerText.includes('selection')) {
      return '🎯'
    }
    
    // Weaknesses/problems
    if (lowerText.includes('weakness') || lowerText.includes('problem') || lowerText.includes('issue')) {
      return '⚠️'
    }
    
    // Strengths/positives
    if (lowerText.includes('strength') || lowerText.includes('strong') || lowerText.includes('excellent')) {
      return '💪'
    }
    
    // Recommendations
    if (lowerText.includes('recommend') || lowerText.includes('suggest') || lowerText.includes('advice')) {
      return '💡'
    }
    
    // Financial/cap related
    if (lowerText.includes('cap') || lowerText.includes('salary') || lowerText.includes('money')) {
      return '💰'
    }
    
    // Schedule/games
    if (lowerText.includes('schedule') || lowerText.includes('game') || lowerText.includes('matchup')) {
      return '📅'
    }
    
    // Default
    return '🤖'
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape' && isFullScreen) {
          setIsFullScreen(false)
        }
        if (e.key === 'Escape' && showConversations) {
          setShowConversations(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isFullScreen, showConversations])

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
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4 ${isFullScreen ? 'p-0' : ''}`}>
          <div className={`bg-gray-900 rounded-t-lg shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 ${
            isFullScreen 
              ? 'w-full h-full rounded-none' 
              : 'w-full max-w-md h-[600px]'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-white font-semibold text-lg">Ask Ozzie – Your Assistant GM</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleConversations}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Conversations"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={toggleFullScreen}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isFullScreen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Conversations Sidebar */}
              {showConversations && (
                <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
                  {/* Search */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && performSearch(searchQuery)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
                      />
                      <button
                        onClick={() => performSearch(searchQuery)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Folders */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium text-sm">Folders</h3>
                        <button
                          onClick={() => setShowCreateFolder(true)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          + New
                        </button>
                      </div>
                      
                      {folders.map(folder => (
                        <div
                          key={folder.id}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer mb-1 ${
                            selectedFolder === folder.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                          }`}
                          onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span className="text-white text-sm flex-1">{folder.name}</span>
                          <span className="text-gray-400 text-xs">({folder.conversation_count})</span>
                        </div>
                      ))}
                    </div>

                    {/* Conversations */}
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium text-sm">Conversations</h3>
                        <button
                          onClick={startNewConversation}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          + New
                        </button>
                      </div>
                      
                      {(searchQuery ? searchResults : conversations).map(conv => (
                        <div
                          key={conv.id}
                          className={`p-3 rounded-md cursor-pointer mb-2 border-l-2 ${
                            currentConversationId === conv.id 
                              ? 'bg-blue-600 border-blue-400' 
                              : 'bg-gray-700 border-transparent hover:bg-gray-600'
                          }`}
                          onClick={() => loadConversation(conv.id)}
                        >
                          <div className="flex items-start justify-between">
                                                         <div className="flex-1 min-w-0">
                               <h4 className="text-white font-medium text-sm truncate">{conv.title}</h4>
                               <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                                 {conv.question.length > 60 ? `${conv.question.substring(0, 60)}...` : conv.question}
                               </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-gray-400 text-xs">{conv.team_name}</span>
                                <span className="text-gray-500 text-xs">•</span>
                                <span className="text-gray-400 text-xs">
                                  {new Date(conv.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {conv.is_favorite && (
                                <span className="text-yellow-400 text-xs">★</span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(conv.id, conv.is_favorite)
                                }}
                                className="text-gray-400 hover:text-yellow-400 text-xs"
                              >
                                {conv.is_favorite ? '★' : '☆'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteConversation(conv.id)
                                }}
                                className="text-gray-400 hover:text-red-400 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Interface */}
              <div className="flex-1 flex flex-col">
                {/* Team Selector */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Team:</span>
                    <select
                      value={selectedTeamId || ''}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
                    >
                      {availableTeams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 ${isFullScreen ? 'h-[calc(100vh-200px)]' : ''}`}>
                  {showPrompts && messages.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-gray-400 text-sm">Try asking Ozzie:</p>
                      {examplePrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handlePromptClick(prompt)}
                          className="block w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                                     {messages.map((message) => (
                     <div
                       key={message.id}
                       className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                     >
                       <div
                         className={`max-w-[80%] p-3 rounded-lg ${
                           message.sender === 'user'
                             ? 'bg-blue-600 text-white'
                             : 'bg-gray-700 text-white'
                         }`}
                       >
                         {message.sender === 'user' ? (
                           <p className="text-sm">{message.text}</p>
                         ) : (
                           <div className="text-sm ozzie-message">
                             <div className="flex items-center gap-2 mb-2">
                               <span className="ozzie-context-emoji">{getContextEmoji(message.text)}</span>
                               <span className="text-blue-300 text-xs font-medium">Ozzie</span>
                             </div>
                             <div className="space-y-1">
                               {formatOzzieMessage(message.text)}
                             </div>
                           </div>
                         )}
                         {message.warning && (
                           <p className="text-yellow-300 text-xs mt-2">⚠️ {message.warning}</p>
                         )}
                         {message.teamInfo && (
                           <p className="text-blue-300 text-xs mt-2">
                             🏈 Analyzing: {message.teamInfo.name}
                           </p>
                         )}
                       </div>
                     </div>
                   ))}

                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-gray-700 text-white p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span className="text-sm">Ozzie is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask Ozzie anything..."
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendClick}
                      disabled={isLoading || !inputValue.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-white font-semibold text-lg mb-4">Create New Folder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
                  placeholder="Enter folder name..."
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Color</label>
                <input
                  type="color"
                  value={newFolderColor}
                  onChange={(e) => setNewFolderColor(e.target.value)}
                  className="w-full h-10 rounded-md"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={createFolder}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Selection Modal */}
      {showTeamModal && teamModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-white font-semibold text-lg mb-4">Select Team</h3>
            <p className="text-gray-300 text-sm mb-4">{teamModalData.suggestion}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamModalData.teams.map((team, index) => (
                <button
                  key={index}
                  onClick={() => handleTeamSelection(team)}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                >
                  {team}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTeamModal(false)}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
} 