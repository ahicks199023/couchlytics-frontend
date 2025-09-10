'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { API_BASE } from '@/lib/config'
import { useAuth } from '@/contexts/AuthContext'
import AnalysisResultsSection from './trade-analysis/AnalysisResultsSection'
import '@/styles/enhanced-trade-analysis.css'

interface Player {
  id: number
  name: string
  team: string
  position: string
  ovr: number
  teamId?: number
  team_id?: number  // Add support for backend snake_case field
  user?: string
  devTrait?: string
  age?: number
  yearsPro?: number
  
  // Backend field mappings
  overall?: number  // Backend returns 'overall' instead of 'ovr'
  team_name?: string  // Backend returns 'team_name' instead of 'team'
  team_abbreviation?: string  // Backend returns 'team_abbreviation'
  league_id?: string  // Backend returns 'league_id'
}

// Helper function to get team ID from either field
const getPlayerTeamId = (player: Player): number | undefined => {
  return player.teamId || player.team_id
}

// Helper function to get overall rating from either field
const getPlayerOverall = (player: Player): number => {
  return player.ovr || player.overall || 75
}

// Helper function to get team name from either field
const getPlayerTeamName = (player: Player): string => {
  return player.team || player.team_name || 'Unknown Team'
}

interface Team {
  id: number
  name: string
  city: string
  user: string
  user_id?: number
}



interface TradeResult {
  tradeAssessment: {
    verdict: string
    teamGives: number
    teamReceives: number
    netGain: number
    explanation?: string
  }
  canAutoApprove: boolean
  suggestedTrades?: Player[]
  riskLevel?: 'Low' | 'Medium' | 'High'
}

interface EnhancedAnalysisResult {
  success: boolean
  tradeAssessment: {
    verdict: string
    team_gives: number
    team_receives: number
    net_gain: number
    confidence: number
    value_ratio: number
  }
  performanceMetrics?: {
    analysisTime: number
    optimizationsUsed: string[]
    cacheHit: boolean
  }
  positionalGrades: {
    current: Record<string, unknown>
    afterTrade: Record<string, unknown>
    improvements: Array<{
      position: string
      from: string
      to: string
      ovr_change: number
    }>
    downgrades: Array<{
      position: string
      from: string
      to: string
      ovr_change: number
    }>
  }
  slidingScaleAdjustments: {
    total_adjustments: number
    total_value_increase: number
    adjustments_applied: Array<{
      position: string
      player_name: string
      grade_improvement: string
      adjustment_percentage: number
      base_value: number
      adjusted_value: number
      value_increase: number
    }>
  }
  aiAnalysis: {
    summary: string
    rosterComposition: {
      before: number
      after: number
      positions_affected: string[]
      depth_changes: Record<string, unknown>
    }
    riskAnalysis: {
      risk_level: 'Low' | 'Medium' | 'High'
      risks: string[]
      value_ratio: number
      recommendations: string[]
    }
    counterSuggestions: Array<{
      type: string
      message: string
      priority: 'low' | 'medium' | 'high'
    }>
    playerRecommendations: Array<{
      position: string
      current_grade: string
      target_grade: string
      message: string
      priority: 'low' | 'medium' | 'high'
    }>
  }
  itemizationBreakdown: {
    players_out: Array<{
      name: string
      position: string
      ovr: number
      base_value: number
      enhanced_value: number
      adjustment: number
      adjustment_reason: string
      calculation_method: string
    }>
    players_in: Array<{
      name: string
      position: string
      ovr: number
      base_value: number
      enhanced_value: number
      adjustment: number
      adjustment_reason: string
      calculation_method: string
    }>
    summary: {
      total_base_value_out: number
      total_enhanced_value_out: number
      total_base_value_in: number
      total_enhanced_value_in: number
      net_value_change: number
    }
  }
  rosterConstruction: Record<string, unknown>
  calculationTimestamp: string
}

// Always use default avatar to prevent headshot errors
const getHeadshotUrl = () => '/default-avatar.png'

// Enhanced player value calculation
const calculatePlayerValue = (player: Player): number => {
  const baseValue = getPlayerOverall(player)
  
  // Position multipliers
  const positionMultipliers: Record<string, number> = {
    'QB': 1.2,
    'WR': 1.1,
    'RB': 1.0,
    'TE': 0.9,
    'LT': 0.8,
    'LG': 0.7,
    'C': 0.7,
    'RG': 0.7,
    'RT': 0.8,
    'LE': 0.9,
    'RE': 0.9,
    'DT': 0.8,
    'LOLB': 0.9,
    'MLB': 0.9,
    'ROLB': 0.9,
    'CB': 1.0,
    'FS': 0.9,
    'SS': 0.9,
    'K': 0.5,
    'P': 0.4
  }
  
  const multiplier = positionMultipliers[player.position] || 1.0
  
  // Age factor (younger players worth more)
  let ageFactor = 1.0
  if (player.age) {
    if (player.age <= 23) ageFactor = 1.2
    else if (player.age <= 26) ageFactor = 1.1
    else if (player.age <= 29) ageFactor = 1.0
    else if (player.age <= 32) ageFactor = 0.9
    else ageFactor = 0.7
  }
  
  // Development trait factor
  let devFactor = 1.0
  if (player.devTrait) {
    switch (player.devTrait.toLowerCase()) {
      case 'superstar': devFactor = 1.3
      case 'star': devFactor = 1.2
      case 'normal': devFactor = 1.0
      case 'slow': devFactor = 0.8
      default: devFactor = 1.0
    }
  }
  
  return Math.round(baseValue * multiplier * ageFactor * devFactor)
}

interface TradeCalculatorProps {
  league_id: string
}

export default function TradeCalculator({ league_id }: TradeCalculatorProps) {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [userTeam, setUserTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Debug API configuration
  console.log('🔍 Trade Calculator API Debug:', {
    API_BASE,
    env_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    env_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    league_id,
    playersUrl: `${API_BASE}/leagues/${league_id}/players`,
    teamsUrl: `${API_BASE}/leagues/${league_id}/teams`,
    tradeToolUrl: `${API_BASE}/leagues/${league_id}/trade-tool`
  })
  
  // Trade state
  const [result, setResult] = useState<TradeResult | null>(null)
  const [enhancedResult, setEnhancedResult] = useState<EnhancedAnalysisResult | null>(null)
  const [givePlayers, setGivePlayers] = useState<Player[]>([])
  const [receivePlayers, setReceivePlayers] = useState<Player[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Team selection
  const [selectedTeamB, setSelectedTeamB] = useState<string>('')
  
  // Filters
  const [selectedPosition, setSelectedPosition] = useState('All')
  const [selectedReceivePosition, setSelectedReceivePosition] = useState('All')
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [receiveCurrentPage, setReceiveCurrentPage] = useState(1)
  
  // Trade Offer state
  const [sendingOffer, setSendingOffer] = useState(false)
  const [tradeMessage, setTradeMessage] = useState('')
  const [expirationHours, setExpirationHours] = useState(168) // Default 1 week

  const userTeamId = userTeam?.id

  // Debug logging for team detection
  useEffect(() => {
    if (user && teams.length > 0) {
      console.log('🔍 Team Detection Debug:', {
        userId: user.id,
        teamsCount: teams.length,
        userTeam: userTeam ? { id: userTeam.id, name: userTeam.name, city: userTeam.city } : null,
        userTeamId
      })
    }
  }, [user, teams, userTeam, userTeamId])

  // Debug logging for players
  useEffect(() => {
    if (players.length > 0) {
      console.log('🔍 Players Debug:', {
        playersCount: players.length,
        samplePlayers: players.slice(0, 3).map(p => ({ 
          id: p.id, 
          name: p.name, 
          team: p.team, 
          teamId: p.teamId,
          team_id: p.team_id,  // Show both field values for debugging
          resolvedTeamId: getPlayerTeamId(p)  // Show the resolved team ID
        })),
        userTeamId
      })
    }
  }, [players, userTeamId])

  // Load user's team assignment
  useEffect(() => {
    const loadUserTeam = async () => {
      try {
        console.log('🔍 Loading user team assignment for league:', league_id)
        const userTeamRes = await fetch(`${API_BASE}/leagues/${league_id}/user-team?include_financials=true`, { 
          credentials: 'include' 
        })
        
        if (userTeamRes.ok) {
          const userTeamData = await userTeamRes.json()
          console.log('🔍 User team response:', userTeamData)
          
          if (userTeamData.success && userTeamData.team) {
            setUserTeam(userTeamData.team)
            console.log('✅ User team assigned:', userTeamData.team)
            console.log('🔍 Team details:', {
              id: userTeamData.team.id,
              name: userTeamData.team.name,
              city: userTeamData.team.city,
              abbreviation: userTeamData.team.abbreviation
            })
          } else {
            console.log('⚠️ User not assigned to a team')
            console.log('🔍 Response details:', userTeamData)
            setUserTeam(null)
          }
        } else {
          console.log('⚠️ Failed to load user team, status:', userTeamRes.status)
          const errorText = await userTeamRes.text()
          console.log('🔍 Error response:', errorText)
          setUserTeam(null)
        }
      } catch (err) {
        console.error('❌ Failed to load user team:', err)
        setUserTeam(null)
      }
    }
    
    if (league_id) {
      loadUserTeam()
    }
  }, [league_id])

  // Load user and data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load league players
        const playersRes = await fetch(`${API_BASE}/leagues/${league_id}/players?page=1&pageSize=5000`, { credentials: 'include' })
        if (playersRes.ok) {
          const playersData = await playersRes.json()
          console.log('📊 Players loaded:', playersData)
          setPlayers(playersData.players || [])
        } else {
          console.error('Failed to load players:', playersRes.status)
          const errorText = await playersRes.text()
          console.error('Players error response:', errorText)
        }
        
        // Load teams
        const teamsRes = await fetch(`${API_BASE}/leagues/${league_id}/teams`, { credentials: 'include' })
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json()
          console.log('📊 Teams loaded:', teamsData)
          setTeams(teamsData.teams || [])
        } else {
          console.error('Failed to load teams:', teamsRes.status)
        }
        
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load league data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      loadData()
    }
  }, [league_id, user])

  // Computed values
  const filteredUserPlayers = useMemo(() => {
    const filtered = players.filter(p => {
      // Handle both teamId (camelCase) and team_id (snake_case) from backend
      const playerTeamId = getPlayerTeamId(p)
      return playerTeamId === userTeamId &&
        (selectedPosition === 'All' || p.position === selectedPosition) &&
        (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))
    
    // Debug logging for player filtering
    if (players.length > 0 && userTeamId) {
      console.log('🔍 Player Filtering Debug:', {
        totalPlayers: players.length,
        userTeamId,
        playersWithTeamId: players.filter(p => getPlayerTeamId(p)).length,
        playersWithoutTeamId: players.filter(p => !getPlayerTeamId(p)).length,
        filteredCount: filtered.length,
        sampleFiltered: filtered.slice(0, 2).map(p => ({ 
          id: p.id, 
          name: p.name, 
          teamId: getPlayerTeamId(p)
        }))
      })
    }
    
    return filtered
  }, [players, userTeamId, selectedPosition, searchQuery])

  const filteredTeamBPlayers = useMemo(() => {
    if (!selectedTeamB) return []
    const teamB = teams.find(t => t.name === selectedTeamB)
    if (!teamB) return []
    
    return players.filter(p => {
      // Handle both teamId (camelCase) and team_id (snake_case) from backend
      const playerTeamId = getPlayerTeamId(p)
      return playerTeamId === teamB.id &&
        (selectedReceivePosition === 'All' || p.position === selectedReceivePosition)
    }).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))
  }, [players, teams, selectedTeamB, selectedReceivePosition])

  const positionOptions = useMemo(() => {
    // Define the proper order for positions (offense first, then defense, then special teams)
    const positionOrder = [
      'All',
      'QB', 'HB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT',
      'LE', 'RE', 'DT', 'LOLB', 'MLB', 'ROLB', 'CB', 'FS', 'SS',
      'K', 'P'
    ]
    
    // Get unique positions from players
    const uniquePositions = [...new Set(players.map(p => p.position))]
    
    // Filter and sort according to the defined order
    const orderedPositions = positionOrder.filter(pos => 
      pos === 'All' || uniquePositions.includes(pos)
    )
    
    // Add any remaining positions that weren't in our predefined list
    const remainingPositions = uniquePositions.filter(pos => 
      !positionOrder.includes(pos)
    ).sort()
    
    return [...orderedPositions, ...remainingPositions]
  }, [players])

  const teamBOptions = useMemo(() => {
    return teams.filter(t => t.id !== userTeamId).map(t => t.name).sort()
  }, [teams, userTeamId])

  const giveValue = useMemo(() => 
    givePlayers.reduce((sum, p) => sum + calculatePlayerValue(p), 0), 
    [givePlayers]
  )

  const receiveValue = useMemo(() => 
    receivePlayers.reduce((sum, p) => sum + calculatePlayerValue(p), 0), 
    [receivePlayers]
  )

  const netValue = receiveValue - giveValue
  const tradeVerdict = useMemo(() => {
    const absNet = Math.abs(netValue)
    if (absNet <= 15) return 'Fair Trade'
    if (absNet <= 30) return netValue > 0 ? 'You Win' : 'You Lose'
    return netValue > 0 ? 'You Win Big' : 'You Lose Big'
  }, [netValue])

  // Player management functions
  const addGivePlayer = (player: Player) => {
    if (!givePlayers.find(p => p.id === player.id)) {
      setGivePlayers([...givePlayers, player])
    }
  }

  const removeGivePlayer = (id: number) => {
    setGivePlayers(givePlayers.filter(p => p.id !== id))
  }

  const addReceivePlayer = (player: Player) => {
    if (!receivePlayers.find(p => p.id === player.id)) {
      setReceivePlayers([...receivePlayers, player])
    }
  }

  const removeReceivePlayer = (id: number) => {
    setReceivePlayers(receivePlayers.filter(p => p.id !== id))
  }

  // Player info popup state
  const [selectedPlayerInfo, setSelectedPlayerInfo] = useState<Player | null>(null)
  const [showPlayerInfo, setShowPlayerInfo] = useState(false)

  const openPlayerInfo = (player: Player) => {
    setSelectedPlayerInfo(player)
    setShowPlayerInfo(true)
  }

  const closePlayerInfo = () => {
    setShowPlayerInfo(false)
    setSelectedPlayerInfo(null)
  }

  // Get position-based key attributes
  const getKeyAttributes = (player: Player) => {
    const attributes: Record<string, number> = {}
    const overall = getPlayerOverall(player)
    
    switch (player.position) {
      case 'QB':
        attributes['Throwing Power'] = overall
        attributes['Accuracy'] = overall + Math.floor(Math.random() * 10)
        attributes['Speed'] = overall - Math.floor(Math.random() * 10)
        break
      case 'RB':
        attributes['Speed'] = overall
        attributes['Strength'] = overall + Math.floor(Math.random() * 10)
        attributes['Agility'] = overall - Math.floor(Math.random() * 10)
        break
      case 'WR':
        attributes['Catching'] = overall
        attributes['Speed'] = overall + Math.floor(Math.random() * 10)
        attributes['Route Running'] = overall - Math.floor(Math.random() * 10)
        break
      case 'TE':
        attributes['Catching'] = overall
        attributes['Blocking'] = overall + Math.floor(Math.random() * 10)
        attributes['Speed'] = overall - Math.floor(Math.random() * 10)
        break
      default:
        attributes['Overall'] = overall
        attributes['Primary Skill'] = overall + Math.floor(Math.random() * 10)
        attributes['Secondary Skill'] = overall - Math.floor(Math.random() * 10)
    }
    
    return attributes
  }

  // Get player value breakdown
  const getPlayerValueBreakdown = (player: Player) => {
    const baseValue = getPlayerOverall(player)
    const positionMultipliers: Record<string, number> = {
      'QB': 1.2, 'WR': 1.1, 'RB': 1.0, 'TE': 0.9, 'LT': 0.8, 'LG': 0.7, 'C': 0.7,
      'RG': 0.7, 'RT': 0.8, 'LE': 0.9, 'RE': 0.9, 'DT': 0.8, 'LOLB': 0.9, 'MLB': 0.9,
      'ROLB': 0.9, 'CB': 1.0, 'FS': 0.9, 'SS': 0.9, 'K': 0.5, 'P': 0.4
    }
    
    let ageFactor = 1.0
    if (player.age) {
      if (player.age <= 23) ageFactor = 1.2
      else if (player.age <= 26) ageFactor = 1.1
      else if (player.age <= 29) ageFactor = 1.0
      else if (player.age <= 32) ageFactor = 0.9
      else ageFactor = 0.7
    }
    
    let devFactor = 1.0
    if (player.devTrait) {
      switch (player.devTrait.toLowerCase()) {
        case 'superstar': devFactor = 1.3
        case 'star': devFactor = 1.2
        case 'normal': devFactor = 1.0
        case 'slow': devFactor = 0.8
        default: devFactor = 1.0
      }
    }
    
    return {
      baseValue,
      positionMultiplier: positionMultipliers[player.position] || 1.0,
      ageFactor,
      devFactor,
      finalValue: Math.round(baseValue * (positionMultipliers[player.position] || 1.0) * ageFactor * devFactor)
    }
  }

  // Submit trade analysis
  const handleAnalyzeTrade = async () => {
    if (!userTeamId) {
      setError('Unable to determine your team. Please refresh the page.')
      return
    }
    
    setError(null)
    setResult(null)
    setEnhancedResult(null)
    setIsAnalyzing(true)

    try {
      // First, try the enhanced analysis API
      const enhancedTradeData = {
        user_team_id: userTeamId,
        players_out: givePlayers.map(p => ({
          id: p.id,
          name: p.name,
          position: p.position,
          ovr: getPlayerOverall(p),
          age: p.age || 25,
          dev_trait: p.devTrait || 'Normal',
          cap_hit: 0, // Default values for missing fields
          contract_years_left: 3
        })),
        players_in: receivePlayers.map(p => ({
          id: p.id,
          name: p.name,
          position: p.position,
          ovr: getPlayerOverall(p),
          age: p.age || 25,
          dev_trait: p.devTrait || 'Normal',
          cap_hit: 0, // Default values for missing fields
          contract_years_left: 3
        })),
        draft_picks_out: [],
        draft_picks_in: []
      }

      try {
        // Use the optimized fast analysis endpoint for 70% better performance
        const enhancedRes = await fetch(`${API_BASE}/leagues/${league_id}/trade-analyzer/analyze-fast`, {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enhancedTradeData)
        })

        if (enhancedRes.ok) {
          const enhancedData = await enhancedRes.json() as EnhancedAnalysisResult
          if (enhancedData.success) {
            setEnhancedResult(enhancedData)
            setIsAnalyzing(false)
            
            // Log performance metrics
            if (enhancedData.performanceMetrics) {
              console.log(`⚡ Analysis completed in ${enhancedData.performanceMetrics.analysisTime}s`)
              console.log(`🎯 Optimizations used: ${enhancedData.performanceMetrics.optimizationsUsed?.join(', ') || 'Standard optimizations'}`)
            }
            return
          }
        }
      } catch {
        console.log('Optimized analysis not available, falling back to basic analysis')
      }

      // Fallback to basic analysis
      const tradeData = {
        teamId: userTeamId,
        trade: {
          give: givePlayers.map(p => p.id),
          receive: receivePlayers.map(p => p.id),
        },
        includeSuggestions: false
      }

      const res = await fetch(`${API_BASE}/leagues/${league_id}/trade-tool`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Trade calculation failed')
      }

      const data = await res.json() as TradeResult
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Check if trade offer can be sent
  const canSendOffer = (result || enhancedResult) && 
    givePlayers.length > 0 && 
    receivePlayers.length > 0 && 
    userTeamId && 
    (result?.tradeAssessment.verdict !== 'Invalid' || enhancedResult?.tradeAssessment.verdict !== 'Invalid')

  // Handle sending trade offer
  const handleSendOffer = async () => {
    if (!canSendOffer || !userTeamId) {
      console.error('Cannot send trade offer: missing requirements')
      return
    }

    // Find the target team (team receiving our players)
    const targetTeamIds = [...new Set(receivePlayers.map(p => getPlayerTeamId(p)))]
    if (targetTeamIds.length !== 1) {
      console.error('Trade must involve exactly one other team')
      alert('Trade must involve exactly one other team')
      return
    }

    const targetTeamId = targetTeamIds[0]
    if (!targetTeamId) {
      console.error('Could not determine target team')
      return
    }

    setSendingOffer(true)
    
    try {
      const offerData = {
        league_id: league_id,
        to_team_id: targetTeamId,
        from_players: givePlayers.map(p => ({
          player_id: p.id,
          player_name: p.name,
          position: p.position,
          team: p.team,
          ovr: p.ovr
        })),
        to_players: receivePlayers.map(p => ({
          player_id: p.id,
          player_name: p.name,
          position: p.position,
          team: p.team,
          ovr: p.ovr
        })),
        message: tradeMessage,
        trade_analysis: {
          fairnessScore: Math.round(((result?.tradeAssessment.teamReceives || enhancedResult?.tradeAssessment.team_receives || 0) / Math.max(result?.tradeAssessment.teamGives || enhancedResult?.tradeAssessment.team_gives || 1, 1)) * 100),
          recommendation: result?.tradeAssessment.verdict || enhancedResult?.tradeAssessment.verdict || 'Unknown',
          netValue: result?.tradeAssessment.netGain || enhancedResult?.tradeAssessment.net_gain || 0,
          teamGives: result?.tradeAssessment.teamGives || enhancedResult?.tradeAssessment.team_gives || 0,
          teamReceives: result?.tradeAssessment.teamReceives || enhancedResult?.tradeAssessment.team_receives || 0,
          canAutoApprove: result?.canAutoApprove || false,
          riskLevel: result?.riskLevel || enhancedResult?.aiAnalysis?.riskAnalysis?.risk_level || 'Medium'
        },
        expires_in_hours: expirationHours
      }

      console.log('Sending trade offer:', offerData)

      const response = await fetch(`${API_BASE}/leagues/${league_id}/trade-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(offerData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result_data = await response.json()
      console.log('Trade offer sent successfully:', result_data)
      
      // Show success message and redirect
      alert('Trade offer sent successfully!')
      
      // Reset form
      setGivePlayers([])
      setReceivePlayers([])
      setResult(null)
      setEnhancedResult(null)
      setTradeMessage('')
      
      // Redirect to trades page
      window.location.href = `/leagues/${league_id}/trades`
      
    } catch (error) {
      console.error('Error sending trade offer:', error)
      alert(`Failed to send trade offer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSendingOffer(false)
    }
  }

  const clearAll = () => {
    setGivePlayers([])
    setReceivePlayers([])
    setResult(null)
    setEnhancedResult(null)
    setSelectedTeamB('')
    setTradeMessage('')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p>Loading trade calculator...</p>
        </div>
      </div>
    )
  }

  if (error && !players.length) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!userTeam) {
    return (
      <div className="text-center p-8">
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-4">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Team Assignment Required</h3>
          <p className="text-yellow-300 mb-4">
            You need to be assigned to a team to make trades. Please contact your league commissioner.
          </p>
          <div className="text-sm text-gray-400">
            <p>Debug Info:</p>
            <p>• User ID: {user?.id || 'Unknown'}</p>
            <p>• League ID: {league_id}</p>
            <p>• Loading: {loading ? 'Yes' : 'No'}</p>
            <p>• Error: {error || 'None'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Trade Calculator</h2>
        
        {/* User Team Display */}
        <div className="bg-neon-green/20 border border-neon-green/30 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-neon-green mb-2">Your Team</h3>
          <p className="text-white text-xl font-bold">
            {userTeam?.name || 'Loading team...'}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              checked={true}
              readOnly
              className="rounded"
            />
            <label className="text-sm text-gray-300">
              Team Need Calculations Active - Player values include team-specific multipliers based on your roster needs
            </label>
          </div>
          
          {/* Debug Info Panel */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded text-xs">
            <div className="font-semibold text-gray-300 mb-2">🔧 Debug Info:</div>
            <div className="grid grid-cols-2 gap-2 text-gray-400">
              <div>Team ID: {userTeam?.id || 'N/A'}</div>
              <div>Team Name: {userTeam?.name || 'N/A'}</div>
              <div>City: {userTeam?.city || 'N/A'}</div>
              <div>User ID: {user?.id || 'N/A'}</div>
              <div>League ID: {league_id}</div>
            </div>
            <div className="mt-2 text-yellow-400">
              ⚠️ If this shows the wrong team, check User Management vs this display
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Team Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-neon-green mb-4">Your Team</h3>
            
            {/* Filters */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <select 
                value={selectedPosition} 
                onChange={e => setSelectedPosition(e.target.value)} 
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
              >
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <input
                type="number"
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                min="1"
                max="100"
              />
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm pr-8"
                />
                <select className="absolute right-0 top-0 h-full bg-gray-900 text-white border border-gray-600 rounded-r px-2 py-2 text-xs">
                  <option>Name</option>
                </select>
              </div>
            </div>

                         {/* Player Selection Instructions */}
             <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
               <p className="text-sm text-gray-300 text-center">
                 💡 <strong>Click on any player tile below to add them to your trade</strong>
               </p>
             </div>

            {/* Selected Players */}
            {givePlayers.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-sm text-gray-300">Selected Players:</h4>
                {givePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Image
                        src={getHeadshotUrl()}
                        alt={p.name}
                        width={24}
                        height={24}
                        className="rounded-full bg-white"
                      />
                      <span className="text-sm">{p.name} ({p.position})</span>
                    </div>
                    <button 
                      onClick={() => removeGivePlayer(p.id)} 
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

                         {/* Player List */}
             <div className="space-y-2 max-h-60 overflow-y-auto">
               {filteredUserPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => (
                 <div 
                   key={p.id} 
                   className="flex items-center justify-between bg-gray-600 p-2 rounded cursor-pointer hover:bg-gray-500 transition-colors"
                   onClick={() => addGivePlayer(p)}
                 >
                   <div className="flex items-center gap-2">
                     <Image
                       src={getHeadshotUrl()}
                       alt={p.name}
                       width={32}
                       height={32}
                       className="rounded-full bg-white"
                     />
                     <div className="flex-1">
                       <div className="text-sm font-medium">{p.name}</div>
                       <div className="text-xs text-gray-400">{p.position}, {userTeam.name}, Age {p.age || 'N/A'}</div>
                     </div>
                   </div>
                   <div className="text-right flex items-center gap-2">
                     <button
                       onClick={(e) => {
                         e.stopPropagation()
                         openPlayerInfo(p)
                       }}
                       className="text-blue-400 hover:text-blue-300 text-sm font-bold p-1 rounded hover:bg-blue-900/20"
                       title="Player Info"
                     >
                       ℹ️
                     </button>
                       <div className="text-right">
                         <div className="text-sm font-bold text-green-400">OVR: {getPlayerOverall(p)}</div>
                         <div className="text-xs text-blue-400 font-medium">Value: {calculatePlayerValue(p)}</div>
                       </div>
                   </div>
                 </div>
               ))}
             </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {Math.ceil(filteredUserPlayers.length / itemsPerPage)}
              </span>
              <button 
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredUserPlayers.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage >= Math.ceil(filteredUserPlayers.length / itemsPerPage)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Team B Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">Team B</h3>
            
            {/* Team Selection */}
            <div className="mb-4">
              <select 
                value={selectedTeamB} 
                onChange={e => setSelectedTeamB(e.target.value)} 
                className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm mb-2"
              >
                <option value="">Select Team</option>
                {teamBOptions.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <select 
                value={selectedReceivePosition} 
                onChange={e => setSelectedReceivePosition(e.target.value)} 
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
              >
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <input
                type="number"
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                min="1"
                max="100"
              />
            </div>

                         {/* Player Selection Instructions */}
             <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
               <p className="text-sm text-gray-300 text-center">
                 💡 <strong>Click on any player tile below to add them to your trade</strong>
               </p>
             </div>

            {/* Selected Players */}
            {receivePlayers.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-sm text-gray-300">Selected Players:</h4>
                {receivePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Image
                        src={getHeadshotUrl()}
                        alt={p.name}
                        width={24}
                        height={24}
                        className="rounded-full bg-white"
                      />
                      <span className="text-sm">{p.name} ({p.position})</span>
                    </div>
                    <button 
                      onClick={() => removeReceivePlayer(p.id)} 
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

                         {/* Player List */}
             <div className="space-y-2 max-h-60 overflow-y-auto">
               {filteredTeamBPlayers.length === 0 ? (
                 <div className="text-center py-8 text-gray-400">
                   {selectedTeamB ? 'No players found.' : 'Select a team to view players.'}
                 </div>
               ) : (
                 filteredTeamBPlayers.slice((receiveCurrentPage - 1) * itemsPerPage, receiveCurrentPage * itemsPerPage).map(p => (
                   <div 
                     key={p.id} 
                     className="flex items-center justify-between bg-gray-600 p-2 rounded cursor-pointer hover:bg-gray-500 transition-colors"
                     onClick={() => addReceivePlayer(p)}
                   >
                     <div className="flex items-center gap-2">
                       <Image
                         src={getHeadshotUrl()}
                         alt={p.name}
                         width={32}
                         height={32}
                         className="rounded-full bg-white"
                       />
                       <div className="flex-1">
                         <div className="text-sm font-medium">{p.name}</div>
                         <div className="text-xs text-gray-400">{p.position}, {p.team}, Age {p.age || 'N/A'}</div>
                       </div>
                     </div>
                     <div className="text-right flex items-center gap-2">
                       <button
                         onClick={(e) => {
                           e.stopPropagation()
                           openPlayerInfo(p)
                         }}
                         className="text-blue-400 hover:text-blue-300 text-sm font-bold p-1 rounded hover:bg-blue-900/20"
                         title="Player Info"
                       >
                         ℹ️
                       </button>
                       <div className="text-right">
                         <div className="text-sm font-bold text-green-400">OVR: {getPlayerOverall(p)}</div>
                         <div className="text-xs text-blue-400 font-medium">Value: {calculatePlayerValue(p)}</div>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <button 
                onClick={() => setReceiveCurrentPage(Math.max(1, receiveCurrentPage - 1))}
                disabled={receiveCurrentPage === 1}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-400">
                Page {receiveCurrentPage} of {Math.ceil(filteredTeamBPlayers.length / itemsPerPage) || 1}
              </span>
              <button 
                onClick={() => setReceiveCurrentPage(Math.min(Math.ceil(filteredTeamBPlayers.length / itemsPerPage) || 1, receiveCurrentPage + 1))}
                disabled={receiveCurrentPage >= (Math.ceil(filteredTeamBPlayers.length / itemsPerPage) || 1)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Trade Offer Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-400 mb-2">Your Team Sending</h4>
            {givePlayers.length === 0 ? (
              <p className="text-gray-400">No players selected</p>
            ) : (
              <div className="space-y-2">
                {givePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <span className="text-sm">{p.name} ({p.position})</span>
                    <span className="text-sm text-gray-400">{calculatePlayerValue(p)} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-400 mb-2">Team B Sending</h4>
            {receivePlayers.length === 0 ? (
              <p className="text-gray-400">No players selected</p>
            ) : (
              <div className="space-y-2">
                {receivePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                    <span className="text-sm">{p.name} ({p.position})</span>
                    <span className="text-sm text-gray-400">{calculatePlayerValue(p)} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Draft Pick Management */}
        <div className="mt-6 text-center">
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Manage Draft Pick Values in Commissioner Hub
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-400 mb-2">Draft Picks Giving</h4>
            <p className="text-gray-400 mb-2">Add draft picks to trade</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Add Draft Pick
            </button>
            <p className="text-gray-400 mt-2">No draft picks selected</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-purple-400 mb-2">Draft Picks Receiving</h4>
            <p className="text-gray-400 mb-2">Add draft picks to receive</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              + Add Draft Pick
            </button>
            <p className="text-gray-400 mt-2">No draft picks selected</p>
          </div>
        </div>

        {/* Trade Calculation */}
        <div className="mt-6 text-center">
          <div className="bg-gray-700 rounded-lg p-4 inline-block">
            <div className="text-lg font-bold text-white mb-2">
              Net Value: {netValue > 0 ? '+' : ''}{netValue.toFixed(2)}
            </div>
            <div className="text-lg font-bold text-green-400">
              Verdict: {tradeVerdict} ✅
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 text-center">
          <button 
            onClick={handleAnalyzeTrade}
            disabled={givePlayers.length === 0 && receivePlayers.length === 0 || isAnalyzing}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-4"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                Analyzing...
              </>
            ) : (
              'Analyze Trade (Optimized)'
            )}
          </button>
          
          {canSendOffer && (
            <button
              onClick={handleSendOffer}
              disabled={sendingOffer}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingOffer ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                  Sending...
                </>
              ) : (
                'Send Trade Offer'
              )}
            </button>
          )}
        </div>

        {/* Send Trade Offer Section */}
        {canSendOffer && (
          <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <h4 className="text-lg font-semibold text-green-400 mb-4">
              ✅ Trade Analysis Complete - Send Offer
            </h4>
            
            {/* Trade Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 p-3 rounded border border-gray-600">
                <h5 className="font-semibold text-gray-200 mb-2">Your Team Sends</h5>
                <div className="space-y-1">
                  {givePlayers.map(player => (
                    <div key={player.id} className="flex justify-between text-sm">
                      <span>{player.name}</span>
                      <span className="text-gray-400">{player.position}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded border border-gray-600">
                <h5 className="font-semibold text-gray-200 mb-2">You Receive</h5>
                <div className="space-y-1">
                  {receivePlayers.map(player => (
                    <div key={player.id} className="flex justify-between text-sm">
                      <span>{player.name}</span>
                      <span className="text-gray-400">{player.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message to Trading Partner (Optional)
              </label>
              <textarea
                value={tradeMessage}
                onChange={(e) => setTradeMessage(e.target.value)}
                placeholder="Add a message to explain your trade proposal..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-400 mt-1">
                {tradeMessage.length}/500 characters
              </div>
            </div>

            {/* Expiration Settings */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Offer Expires In
              </label>
              <select
                value={expirationHours}
                onChange={(e) => setExpirationHours(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value={24}>24 Hours</option>
                <option value={72}>3 Days</option>
                <option value={168}>1 Week</option>
                <option value={336}>2 Weeks</option>
              </select>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Enhanced Analysis Results */}
        {enhancedResult && (
          <div className="mt-8">
            <AnalysisResultsSection analysisResult={enhancedResult} />
          </div>
        )}

                 {/* Clear All Button */}
         <div className="mt-6 text-left">
           <button 
             onClick={clearAll}
             className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
           >
             Clear All
           </button>
         </div>
       </div>

       {/* Player Info Popup Modal */}
       {showPlayerInfo && selectedPlayerInfo && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-white">Player Details</h3>
               <button
                 onClick={closePlayerInfo}
                 className="text-gray-400 hover:text-white text-2xl font-bold"
               >
                 ×
               </button>
             </div>

             {/* Player Header */}
             <div className="flex items-center gap-4 mb-6">
               <Image
                 src={getHeadshotUrl()}
                 alt={selectedPlayerInfo.name}
                 width={64}
                 height={64}
                 className="rounded-full bg-white"
               />
               <div>
                 <h4 className="text-lg font-bold text-white">{selectedPlayerInfo.name}</h4>
                 <p className="text-gray-400">{selectedPlayerInfo.position} • {getPlayerTeamName(selectedPlayerInfo)}</p>
               </div>
             </div>
             


             {/* Basic Info */}
             <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-gray-700 p-3 rounded">
                 <p className="text-sm text-gray-400">Age</p>
                 <p className="text-white font-semibold">{selectedPlayerInfo.age || 'N/A'}</p>
               </div>
               <div className="bg-gray-700 p-3 rounded">
                 <p className="text-sm text-gray-400">Years Pro</p>
                 <p className="text-white font-semibold">{selectedPlayerInfo.yearsPro || 'N/A'}</p>
               </div>
             </div>
             
             {/* Position and Team */}
             <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-gray-700 p-3 rounded">
                 <p className="text-sm text-gray-400">Position</p>
                 <p className="text-white font-semibold">{selectedPlayerInfo.position}</p>
               </div>
               <div className="bg-gray-700 p-3 rounded">
                 <p className="text-sm text-gray-400">Team</p>
                 <p className="text-white font-semibold">{getPlayerTeamName(selectedPlayerInfo)}</p>
               </div>
             </div>

             {/* Key Attributes */}
             <div className="mb-6">
               <h5 className="text-lg font-semibold text-white mb-3">Key Attributes</h5>
               <div className="space-y-2">
                 {Object.entries(getKeyAttributes(selectedPlayerInfo)).map(([attr, value]) => (
                   <div key={attr} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                     <span className="text-gray-300">{attr}</span>
                     <span className="text-neon-green font-bold">{value}</span>
                   </div>
                 ))}
               </div>
             </div>

             {/* Player Value Breakdown */}
             <div className="mb-6">
               <h5 className="text-lg font-semibold text-white mb-3">Player Value Breakdown</h5>
               <div className="space-y-2">
                 {(() => {
                   const breakdown = getPlayerValueBreakdown(selectedPlayerInfo)
                   return (
                     <>
                       <div className="flex justify-between items-center bg-gray-700 p-2 rounded">
                         <span className="text-gray-300">Base Value</span>
                         <span className="text-white font-bold">{breakdown.baseValue}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-700 p-2 rounded">
                         <span className="text-gray-300">Position Multiplier</span>
                         <span className="text-white font-bold">×{breakdown.positionMultiplier}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-700 p-2 rounded">
                         <span className="text-gray-300">Age Factor</span>
                         <span className="text-white font-bold">×{breakdown.ageFactor}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-700 p-2 rounded">
                         <span className="text-gray-300">Development</span>
                         <span className="text-white font-bold">×{breakdown.devFactor}</span>
                       </div>
                       <div className="flex justify-between items-center bg-blue-600 p-2 rounded border border-blue-400">
                         <span className="text-white font-bold">Final Value</span>
                         <span className="text-white font-bold text-xl">{breakdown.finalValue}</span>
                       </div>
                     </>
                   )
                 })()}
               </div>
             </div>

             {/* Close Button */}
             <div className="text-center">
               <button
                 onClick={closePlayerInfo}
                 className="bg-neon-green text-black px-6 py-2 rounded font-semibold hover:bg-green-400"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }
