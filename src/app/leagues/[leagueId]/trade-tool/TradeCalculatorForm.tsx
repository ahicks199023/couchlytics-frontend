'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Loader2, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { API_BASE } from '@/lib/config'

// Types
interface PlayerStat {
  label: string
  value: number | string
  importance: 'Critical' | 'High' | 'Medium' | 'Low'
}

interface ValueBreakdown {
  baseOVR: number
  ageFactor: number
  ageFactorExplanation: string
  devTraitMultiplier: number
  devTraitExplanation: string
  positionMultiplier: number
  positionExplanation: string
  calculationSteps: string[]
  finalValue: number
}

interface PositionAttributes {
  keyStats: PlayerStat[]
  physicalTraits: PlayerStat[]
  specialties: string[]
}

interface ContractInfo {
  capHit: number
  yearsLeft: number
  contractType: string
}

interface Player {
  id: number
  name?: string | null
  team?: string | null
  position?: string | null
  ovr: number
  teamId?: number
  teamName?: string
  user?: string
  espnId?: string
  devTrait?: string
  age?: number
  yearsPro?: number
  valueBreakdown?: ValueBreakdown
  positionAttributes?: PositionAttributes
  contractInfo?: ContractInfo
}

interface Team {
  id: number
  name: string
  city: string
  user: string
  user_id?: number
  financials?: {
    salaryCap: number
    usedCapSpace: number
    availableCapSpace: number
    deadCapSpace: number
  }
}

interface User {
  id: number
  email?: string
  is_premium?: boolean
  teamId?: number
  name?: string
  city?: string
  user?: string
  user_id?: number
  leagueId?: string
  financials?: {
    salaryCap: number
    usedCapSpace: number
    availableCapSpace: number
    deadCapSpace: number
  }
}

interface PositionalPlayer {
  name: string
  ovr: number
  age: number
  dev_trait: string
}

interface PositionalGradeData {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  avg_ovr: number
  players: PositionalPlayer[]
  total_depth: number
}

interface GradeChange {
  position: string
  from: 'A' | 'B' | 'C' | 'D' | 'F'
  to: 'A' | 'B' | 'C' | 'D' | 'F'
  ovr_change: number
}

interface TradeResult {
  success?: boolean
  tradeAssessment: {
    verdict: string
    teamGives: number
    teamReceives: number
    netGain: number
    confidence: number
  }
  canAutoApprove: boolean
  suggestedTrades?: Player[]
  reasoning?: string
  
  // Enhanced response structure
  tradeContext?: {
    givingTeamId: number
    givingTeamName: string
    receivingTeamId: number
    receivingTeamName: string
    leagueId: string
  }
  
  advancedMetrics?: {
    valueRatio: number
    riskLevel: 'Low' | 'Medium' | 'High'
    tradeBalance: 'Balanced' | 'Slightly Unbalanced' | 'Unbalanced'
    
    salaryImpact?: {
      currentCapHit: number
      tradeImpact: number
      newCapRoom: number
      salaryCap: number
    }
    
    rosterConstruction?: {
      positionalDepth: Record<string, number>
      weakPositions: string[]
      strongPositions: string[]
    }
    
    positionalImpact?: {
      summary: string
      depthChanges: Record<string, {
        current: number
        affected: boolean
      }>
    }

    positionalGrades?: {
      beforeTrade: Record<string, PositionalGradeData>
      afterTrade: Record<string, PositionalGradeData>
      improvements: GradeChange[]
      downgrades: GradeChange[]
      summary: string
    }
  }
  
  aiRecommendations?: {
    primary?: string
    specificSuggestions?: string[]
    secondary?: string[]
    riskFactors?: string[]
    negotiationTips?: string[]
  }
}

interface SuggestedTrade {
  targetTeam: number
  targetTeamName: string
  verdict: string
  tradeValue: number
  playersOffered: Player[]
  confidence: number
  reasoning: string
}

interface TradeData {
  league_id: string
  teamId: number
  trade: {
    give: number[]
    receive: number[]
  }
  includeSuggestions: boolean
}

// Utility functions
const calculatePlayerValue = (player: Player): number => {
  let baseValue = player.ovr || 75
  
  // Position multipliers
  const positionMultipliers: Record<string, number> = {
    'QB': 1.2,
    'WR': 1.1,
    'HB': 1.0,
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
    'MLB': 1.0,
    'ROLB': 0.9,
    'CB': 1.0,
    'FS': 0.9,
    'SS': 0.9,
    'K': 0.5,
    'P': 0.4
  }
  
  const multiplier = positionMultipliers[player.position || ''] || 1.0
  
  // Age factor (younger players worth more)
  if (player.age) {
    const ageFactor = Math.max(0.7, 1.0 - (player.age - 22) * 0.02)
    baseValue *= ageFactor
  }
  
  // Development trait bonus
  if (player.devTrait) {
    const devMultipliers: Record<string, number> = {
      'Superstar': 1.3,
      'Star': 1.2,
      'Normal': 1.0,
      'Hidden': 1.1
    }
    baseValue *= devMultipliers[player.devTrait] || 1.0
  }
  
  return Math.round(baseValue * multiplier)
}

// Helper function to get detailed value breakdown for a player
const getPlayerValueBreakdown = (player: Player) => {
  // Use backend valueBreakdown if available, otherwise calculate frontend fallback
  if (player.valueBreakdown) {
    return {
      baseOVR: player.valueBreakdown.baseOVR,
      positionMultiplier: player.valueBreakdown.positionMultiplier,
      ageFactor: player.valueBreakdown.ageFactor,
      devTraitMultiplier: player.valueBreakdown.devTraitMultiplier,
      afterAge: Math.round(player.valueBreakdown.baseOVR * player.valueBreakdown.ageFactor),
      afterDev: Math.round(player.valueBreakdown.baseOVR * player.valueBreakdown.ageFactor * player.valueBreakdown.devTraitMultiplier),
      finalValue: player.valueBreakdown.finalValue,
      position: player.position || 'Unknown',
      age: player.age || 'Unknown',
      devTrait: player.devTrait || 'Normal',
      calculationSteps: player.valueBreakdown.calculationSteps,
      explanations: {
        age: player.valueBreakdown.ageFactorExplanation,
        devTrait: player.valueBreakdown.devTraitExplanation,
        position: player.valueBreakdown.positionExplanation
      },
      isBackendCalculated: true
    }
  }
  
  // Frontend fallback calculation
  const baseOVR = player.ovr || 75
  
  // Position multipliers
  const positionMultipliers: Record<string, number> = {
    'QB': 1.2, 'WR': 1.1, 'HB': 1.0, 'TE': 0.9,
    'LT': 0.8, 'LG': 0.7, 'C': 0.7, 'RG': 0.7, 'RT': 0.8,
    'LE': 0.9, 'RE': 0.9, 'DT': 0.8,
    'LOLB': 0.9, 'MLB': 1.0, 'ROLB': 0.9,
    'CB': 1.0, 'FS': 0.9, 'SS': 0.9,
    'K': 0.5, 'P': 0.4
  }
  
  const positionMultiplier = positionMultipliers[player.position || ''] || 1.0
  
  // Age factor
  let ageFactor = 1.0
  if (player.age) {
    ageFactor = Math.max(0.7, 1.0 - (player.age - 22) * 0.02)
  }
  
  // Development trait multiplier
  let devTraitMultiplier = 1.0
  if (player.devTrait) {
    const devMultipliers: Record<string, number> = {
      'Superstar': 1.3,
      'Star': 1.2,
      'Normal': 1.0,
      'Hidden': 1.1
    }
    devTraitMultiplier = devMultipliers[player.devTrait] || 1.0
  }
  
  // Step-by-step calculation
  const afterAge = baseOVR * ageFactor
  const afterDev = afterAge * devTraitMultiplier
  const finalValue = Math.round(afterDev * positionMultiplier)
  
  return {
    baseOVR,
    positionMultiplier,
    ageFactor,
    devTraitMultiplier,
    afterAge: Math.round(afterAge),
    afterDev: Math.round(afterDev),
    finalValue,
    position: player.position || 'Unknown',
    age: player.age || 'Unknown',
    devTrait: player.devTrait || 'Normal',
    calculationSteps: [
      `Base Value: ${baseOVR} OVR`,
      `Age Factor: ${baseOVR} × ${ageFactor.toFixed(2)} = ${Math.round(afterAge)}`,
      `Dev Trait: ${Math.round(afterAge)} × ${devTraitMultiplier} = ${Math.round(afterDev)}`,
      `Position: ${Math.round(afterDev)} × ${positionMultiplier} = ${finalValue}`
    ],
    explanations: {
      age: `Age ${player.age || 'Unknown'}: ${ageFactor.toFixed(2)}x multiplier`,
      devTrait: `${player.devTrait || 'Normal'} trait: ${devTraitMultiplier}x multiplier`,
      position: `${player.position} position: ${positionMultiplier}x multiplier`
    },
    isBackendCalculated: false
  }
}

const getVerdictColor = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'you win':
    case 'excellent':
      return 'text-green-400'
    case 'fair':
    case 'balanced':
      return 'text-yellow-400'
    case 'you lose':
    case 'poor':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

const getVerdictIcon = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'you win':
    case 'excellent':
      return <CheckCircle className="w-5 h-5 text-green-400" />
    case 'fair':
    case 'balanced':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />
    case 'you lose':
    case 'poor':
      return <XCircle className="w-5 h-5 text-red-400" />
    default:
      return null
  }
}

// Helper functions for positional grading
const getGradeColorDark = (grade: 'A' | 'B' | 'C' | 'D' | 'F') => {
  const colors = {
    'A': 'text-green-400 bg-green-900/20 border-green-500/30',
    'B': 'text-blue-400 bg-blue-900/20 border-blue-500/30', 
    'C': 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
    'D': 'text-orange-400 bg-orange-900/20 border-orange-500/30',
    'F': 'text-red-400 bg-red-900/20 border-red-500/30'
  };
  return colors[grade] || 'text-gray-400 bg-gray-900/20 border-gray-500/30';
};

// Grade component definitions
const PositionalGradeComparison = ({ 
  improvements, 
  downgrades 
}: {
  improvements: GradeChange[]
  downgrades: GradeChange[]
}) => {
  if (improvements.length === 0 && downgrades.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No positional grade changes from this trade
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Positional Grade Impact</h3>
      
      {/* Improvements */}
      {improvements.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
            <span>📈</span> Improvements
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {improvements.map((imp) => (
              <div key={imp.position} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-500/30">
                <div className="font-semibold text-gray-800 dark:text-gray-200 min-w-[2rem]">{imp.position}</div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm border ${getGradeColorDark(imp.from)}`}>
                    {imp.from}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-2 py-1 rounded text-sm border ${getGradeColorDark(imp.to)}`}>
                    {imp.to}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  +{imp.ovr_change.toFixed(1)} OVR
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downgrades */}
      {downgrades.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <span>📉</span> Downgrades
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {downgrades.map((down) => (
              <div key={down.position} className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-500/30">
                <div className="font-semibold text-gray-800 dark:text-gray-200 min-w-[2rem]">{down.position}</div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm border ${getGradeColorDark(down.from)}`}>
                    {down.from}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-2 py-1 rounded text-sm border ${getGradeColorDark(down.to)}`}>
                    {down.to}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {down.ovr_change.toFixed(1)} OVR
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TeamGradeOverview = ({ 
  grades, 
  title = "Current Team Grades" 
}: {
  grades: Record<string, PositionalGradeData>
  title?: string
}) => {
  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT', 
                       'LE', 'DT', 'RE', 'LOLB', 'MLB', 'ROLB', 'CB', 'FS', 'SS', 'K', 'P'];

  const displayPositions = positionOrder.filter(position => grades[position]);

  if (displayPositions.length === 0) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-3">{title}</h3>
        <div className="text-center py-4 text-gray-400">No positional grades available</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-3">{title}</h3>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {displayPositions.map((position) => {
          const gradeData = grades[position];
          return (
            <div key={position} className="text-center">
              <div className="text-xs font-medium text-gray-400 mb-1">{position}</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${getGradeColorDark(gradeData.grade)}`}>
                {gradeData.grade}
              </div>
              <div className="text-xs text-gray-500 mt-1">{gradeData.avg_ovr.toFixed(1)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function TradeCalculatorForm({ league_id }: { league_id: string }) {
  // Debug: Track render count to detect infinite loops
  const renderCount = useRef(0)
  renderCount.current += 1
  console.log(`🔄 Trade Calculator Render #${renderCount.current} for league:`, league_id)
  
  // State management
  const [user, setUser] = useState<User | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Loading states to prevent infinite loops
  const [isLoadingUserTeam, setIsLoadingUserTeam] = useState(false)
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  
  // Financial data state
  const [giveTeamFinancials, setGiveTeamFinancials] = useState<Team['financials'] | null>(null)
  const [receiveTeamFinancials, setReceiveTeamFinancials] = useState<Team['financials'] | null>(null)
  
  // Helper function to get team financial data with fallback
  const getTeamFinancials = useCallback((teamName: string) => {
    if (teamName === 'All') return null
    const team = teams.find(t => t.name === teamName)
    
    console.log(`🔍 Looking for financial data for team: ${teamName}`)
    console.log(`🔍 Found team:`, team)
    console.log(`🔍 Team has financials:`, !!team?.financials)
    
    // Return real financial data if available, otherwise fallback
    if (team?.financials) {
      console.log(`✅ Using real financial data for ${teamName}:`, team.financials)
      return team.financials
    }
    
    // Fallback financial data if backend doesn't provide it
    console.warn(`No financial data available for team: ${teamName}`)
    return {
      salaryCap: 324.0,        // 2027 salary cap
      usedCapSpace: 0.0,       // Unknown usage
      availableCapSpace: 324.0, // Full cap available
      deadCapSpace: 0.0        // No dead cap data
    }
  }, [teams])
  
  // Memoized API functions to prevent infinite loops
  const fetchUserTeam = useCallback(async () => {
    if (!league_id || isLoadingUserTeam || isRateLimited) return null
    
    console.log('🔍 Fetching user team for league:', league_id)
    setIsLoadingUserTeam(true)
    
    try {
      const response = await fetch(`${API_BASE}/leagues/${league_id}/user-team?include_financials=true`, { 
        credentials: 'include' 
      })
      
      if (response.status === 429) {
        console.error('⚠️ Rate limited - user team endpoint. Waiting 30 seconds...')
        setIsRateLimited(true)
        setError('Rate limit exceeded. Please wait 30 seconds for reset.')
        
        // Auto-reset rate limit after 30 seconds
        setTimeout(() => {
          setIsRateLimited(false)
          setError(null)
          console.log('✅ Rate limit reset - API calls allowed again')
        }, 30000)
        
        return null
      }
      
      if (response.ok) {
        const userTeamData = await response.json()
        if (userTeamData.success && userTeamData.team) {
          console.log('✅ User team data loaded:', userTeamData.team)
          return { ...userTeamData.team, leagueId: league_id }
        }
      }
      
      console.error('❌ User team request failed:', response.status)
      return null
    } catch (error) {
      console.error('❌ User team fetch error:', error)
      return null
    } finally {
      setIsLoadingUserTeam(false)
    }
  }, [league_id, isLoadingUserTeam, isRateLimited])

  const fetchTeams = useCallback(async () => {
    if (!league_id || isLoadingTeams || isRateLimited) return []
    
    console.log('🔍 Fetching teams for league:', league_id)
    setIsLoadingTeams(true)
    
    try {
      const response = await fetch(`${API_BASE}/leagues/${league_id}/teams?include_financials=true`, {
        credentials: 'include'
      })
      
      if (response.status === 429) {
        console.error('⚠️ Rate limited - teams endpoint. Waiting 30 seconds...')
        setIsRateLimited(true)
        setError('Rate limit exceeded. Please wait 30 seconds for reset.')
        
        // Auto-reset rate limit after 30 seconds
        setTimeout(() => {
          setIsRateLimited(false)
          setError(null)
          console.log('✅ Rate limit reset - API calls allowed again')
        }, 30000)
        
        return []
      }
      
      if (response.ok) {
        const teamsData = await response.json()
        console.log('✅ Teams data loaded:', teamsData.teams?.length || 0, 'teams')
        return teamsData.teams || []
      }
      
      console.error('❌ Teams request failed:', response.status)
      return []
    } catch (error) {
      console.error('❌ Teams fetch error:', error)
      return []
    } finally {
      setIsLoadingTeams(false)
    }
  }, [league_id, isLoadingTeams, isRateLimited])

  // Team selection handlers that update financial data
  const handleGiveTeamChange = useCallback((teamName: string) => {
    console.log('🎯 Changing give team to:', teamName)
    setGiveTeam(teamName)
    setGivePage(1)
    
    // Check if this is the user's team and use userTeam financial data if available
    if (user && user.name === teamName && user.financials) {
      console.log('✅ Using user team financial data:', user.financials)
      setGiveTeamFinancials(user.financials)
    } else {
      // Use financial data from teams array
      console.log('🔍 User state check:', { 
        user: user?.name, 
        teamName, 
        hasUserFinancials: !!user?.financials,
        userFinancials: user?.financials 
      })
      const teamFinancials = getTeamFinancials(teamName)
      console.log('🔍 Team financials from teams array:', teamFinancials)
      setGiveTeamFinancials(teamFinancials)
    }
  }, [getTeamFinancials, user])
  
  const handleReceiveTeamChange = useCallback((teamName: string) => {
    console.log('🎯 Changing receive team to:', teamName)
    setReceiveTeam(teamName)
    setReceivePage(1)
    setReceiveTeamFinancials(getTeamFinancials(teamName))
  }, [getTeamFinancials])
  
  // Trade state
  const [givePlayers, setGivePlayers] = useState<Player[]>([])
  const [receivePlayers, setReceivePlayers] = useState<Player[]>([])
  const [result, setResult] = useState<TradeResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Suggestions
  const [includeSuggestions] = useState(false)
  const [suggestedTrades, setSuggestedTrades] = useState<SuggestedTrade[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestionPlayerId, setSuggestionPlayerId] = useState('')
  const [suggestionStrategy, setSuggestionStrategy] = useState('value')

  // Two-panel state
  const [giveTeam, setGiveTeam] = useState('All')
  const [givePosition, setGivePosition] = useState('All')
  const [giveSearch, setGiveSearch] = useState('')
  const [givePage, setGivePage] = useState(1)
  const [givePageSize, setGivePageSize] = useState(50)
  const [givePlayersList, setGivePlayersList] = useState<Player[]>([])
  const [giveTotal, setGiveTotal] = useState(0)
  const [giveTotalPages, setGiveTotalPages] = useState(1)

  const [receiveTeam, setReceiveTeam] = useState('All')
  const [receivePosition, setReceivePosition] = useState('All')
  const [receiveSearch, setReceiveSearch] = useState('')
  const [receivePage, setReceivePage] = useState(1)
  const [receivePageSize, setReceivePageSize] = useState(50)
  const [receivePlayersList, setReceivePlayersList] = useState<Player[]>([])
  const [receiveTotal, setReceiveTotal] = useState(0)
  const [receiveTotalPages, setReceiveTotalPages] = useState(1)

  // 1. Add sort state for each panel
  const [giveSort, setGiveSort] = useState('Name')
  const [receiveSort, setReceiveSort] = useState('Name')

  // 4. Add modal state
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Get user's team ID directly from the user state (set by /user-team endpoint)
  const userTeamId = user?.id
  console.log('Current user state:', user)
  console.log('Computed userTeamId:', userTeamId)

  // Initialize data - runs only once per league_id
  useEffect(() => {
    console.log('🚀 Trade Calculator initializing for league:', league_id)
    
    if (!league_id || league_id === 'undefined') {
      setError('Invalid or missing league ID.')
      setLoading(false)
      return
    }

    if (hasInitialized) {
      console.log('⏭️ Already initialized, skipping')
      return
    }

    const initializeData = async () => {
      console.log('🔄 Starting data initialization...')
      setLoading(true)
      setError(null)
      setHasInitialized(true)
      
      try {
        // Fetch user team and teams in parallel
        const [userTeamData, teamsData] = await Promise.all([
          fetchUserTeam(),
          fetchTeams()
        ])
        
        // Set teams data
        if (teamsData.length > 0) {
          setTeams(teamsData)
          console.log('✅ Teams loaded:', teamsData.length)
          
          // Check if any teams have financial data
          const teamsWithFinancials = teamsData.filter((team: Team) => team.financials)
          console.log('🔍 Teams with financial data:', teamsWithFinancials.length)
          if (teamsWithFinancials.length > 0) {
            console.log('💰 Sample team financials:', teamsWithFinancials[0].financials)
          }
        }
        
        // Set user data and auto-select their team
        if (userTeamData) {
          setUser(userTeamData)
          console.log('✅ User team loaded:', userTeamData.name)
          console.log('🔍 User team data structure:', JSON.stringify(userTeamData, null, 2))
          
          // Auto-select user's team (delayed to ensure teams are loaded)
          setTimeout(() => {
            handleGiveTeamChange(userTeamData.name)
          }, 100)
        }
        
      } catch (err) {
        console.error('❌ Initialization failed:', err)
        setError('Failed to load league data. Please refresh the page.')
      } finally {
        setLoading(false)
        console.log('✅ Trade Calculator initialization complete')
      }
    }
    
    initializeData()
  // NOTE: Intentionally excluding fetchTeams, fetchUserTeam, and handleGiveTeamChange 
  // from dependencies to prevent infinite loop. These functions are stable due to useCallback.
  }, [league_id, hasInitialized])

  const availableTeams = useMemo(() => {
    // For pagination, we'll use a fixed list of teams or get from teams API
    console.log('Computing availableTeams with teams:', teams)
    const teamNames = teams.map(t => t.name).filter(Boolean).sort();
    console.log('Extracted team names:', teamNames)
    if (teamNames.length === 0) {
      console.warn('No team names found in teams data. Team filter will be disabled.');
    }
    const result = ['All', ...teamNames];
    console.log('Final availableTeams:', result)
    return result;
  }, [teams]);

  const availablePositions = useMemo(() => {
    // Only list specific football positions, no broad groups
    return [
      'All',
      'QB', 'HB', 'FB', 'WR', 'TE',
      'LT', 'LG', 'C', 'RG', 'RT',
      'LE', 'RE', 'DT',
      'LOLB', 'MLB', 'ROLB',
      'CB', 'FS', 'SS',
      'K', 'P'
    ];
  }, []);

  const giveValue = useMemo(() => {
    // Use backend values if available, otherwise fall back to frontend calculation
    if (result?.tradeAssessment?.teamGives && givePlayers.length > 0) {
      return result.tradeAssessment.teamGives
    }
    return givePlayers.reduce((sum, p) => sum + calculatePlayerValue(p), 0)
  }, [givePlayers, result?.tradeAssessment?.teamGives])

  const receiveValue = useMemo(() => {
    // Use backend values if available, otherwise fall back to frontend calculation
    if (result?.tradeAssessment?.teamReceives && receivePlayers.length > 0) {
      return result.tradeAssessment.teamReceives
    }
    return receivePlayers.reduce((sum, p) => sum + calculatePlayerValue(p), 0)
  }, [receivePlayers, result?.tradeAssessment?.teamReceives])

  const netValue = receiveValue - giveValue
  const verdict = Math.abs(netValue) <= 15 ? 'Fair' : netValue > 15 ? 'You Win' : 'You Lose'

  // Event handlers
  const addPlayer = useCallback((player: Player, toGive: boolean) => {
    const playerList = toGive ? givePlayers : receivePlayers
    const setPlayerList = toGive ? setGivePlayers : setReceivePlayers
    
    if (!playerList.find(p => p.id === player.id)) {
      setPlayerList([...playerList, player])
    }
  }, [givePlayers, receivePlayers])

  const removePlayer = useCallback((playerId: number, fromGive: boolean) => {
    const setPlayerList = fromGive ? setGivePlayers : setReceivePlayers
    setPlayerList(prev => prev.filter(p => p.id !== playerId))
  }, [])

  const clearTrade = useCallback(() => {
    setGivePlayers([])
    setReceivePlayers([])
    setResult(null)
  }, [])

  // Emergency reset function to break infinite loops
  const resetComponent = useCallback(() => {
    console.log('🔄 Emergency reset triggered')
    setHasInitialized(false)
    setIsLoadingUserTeam(false)
    setIsLoadingTeams(false)
    setLoading(false)
    setError(null)
    setUser(null)
    setTeams([])
    clearTrade()
  }, [clearTrade])

  const fetchTradeSuggestions = async () => {
    if (!league_id || league_id === 'undefined') {
      setError('Invalid or missing league ID.');
      return;
    }
    if (!suggestionPlayerId || !userTeamId) return
    
    setLoadingSuggestions(true)
    setSuggestedTrades([])

    try {
      const res = await fetch(`${API_BASE}/leagues/${league_id}/trade-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          league_id,
          teamId: userTeamId,
          playerId: parseInt(suggestionPlayerId),
          strategy: suggestionStrategy
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Suggestion fetch failed')
      }

      const data = await res.json()
      setSuggestedTrades(data.suggestions || [])
    } catch (err: unknown) {
      console.error('Suggestion Error:', err instanceof Error ? err.message : 'Unknown error')
      setError('Failed to load trade suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const applySuggestedTrade = useCallback((suggestion: SuggestedTrade) => {
    const selected = givePlayers.find(p => p.id === parseInt(suggestionPlayerId))
    if (!selected) return
    setGivePlayers([selected])
    setReceivePlayers(suggestion.playersOffered)
  }, [givePlayers, suggestionPlayerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔍 handleSubmit called with:', { league_id, userTeamId, givePlayers, receivePlayers })
    
    if (!league_id || league_id === 'undefined') {
      console.log('❌ League ID validation failed:', league_id)
      setError('Invalid or missing league ID.');
      return;
    }
    if (!userTeamId) {
      console.log('❌ User team ID validation failed:', { user, userTeamId })
      setError('Unable to determine your team. Please refresh the page.')
      return
    }
    
    console.log('✅ Validation passed, proceeding with trade analysis...')
    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const tradeData: TradeData = {
        league_id,
        teamId: userTeamId,
        trade: {
          give: givePlayers.map(p => p.id),
          receive: receivePlayers.map(p => p.id),
        },
        includeSuggestions
      }
      
      console.log('🚀 Making API call to trade-tool with data:', tradeData)
      console.log('🌐 API URL:', `${API_BASE}/leagues/${league_id}/trade-tool`)

      const res = await fetch(`${API_BASE}/leagues/${league_id}/trade-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      setSubmitting(false)
    }
  }

  // Fetch players for Give panel
  useEffect(() => {
    const fetchGivePlayers = async () => {
      if (!league_id || league_id === 'undefined' || giveTeam === 'All') {
        setGivePlayersList([])
        setGiveTotal(0)
        setGiveTotalPages(1)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          page: String(givePage),
          pageSize: String(givePageSize),
        })
        if (giveTeam !== 'All') params.append('team', giveTeam)
        if (givePosition !== 'All') params.append('position', givePosition)
        if (giveSearch) params.append('search', giveSearch)
        const res = await fetch(`${API_BASE}/leagues/${league_id}/players?${params.toString()}`, {
          credentials: 'include'
        })
        if (!res.ok) throw new Error('Failed to load players')
        const data = await res.json()
        setGivePlayersList(data.players || [])
        setGiveTotal(data.total || 0)
        setGiveTotalPages(Math.max(1, Math.ceil((data.total || 0) / givePageSize)))
      } catch {
        setError('Failed to load players for your team.')
        setGivePlayersList([])
        setGiveTotal(0)
        setGiveTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    fetchGivePlayers()
  }, [league_id, giveTeam, givePosition, giveSearch, givePage, givePageSize])

  // Fetch players for Receive panel
  useEffect(() => {
    const fetchReceivePlayers = async () => {
      if (!league_id || league_id === 'undefined' || receiveTeam === 'All') {
        setReceivePlayersList([])
        setReceiveTotal(0)
        setReceiveTotalPages(1)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          page: String(receivePage),
          pageSize: String(receivePageSize),
        })
        if (receiveTeam !== 'All') params.append('team', receiveTeam)
        if (receivePosition !== 'All') params.append('position', receivePosition)
        if (receiveSearch) params.append('search', receiveSearch)
        const res = await fetch(`${API_BASE}/leagues/${league_id}/players?${params.toString()}`, {
          credentials: 'include'
        })
        if (!res.ok) throw new Error('Failed to load players')
        const data = await res.json()
        setReceivePlayersList(data.players || [])
        setReceiveTotal(data.total || 0)
        setReceiveTotalPages(Math.max(1, Math.ceil((data.total || 0) / receivePageSize)))
      } catch {
        setError('Failed to load players for other team.')
        setReceivePlayersList([])
        setReceiveTotal(0)
        setReceiveTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    fetchReceivePlayers()
  }, [league_id, receiveTeam, receivePosition, receiveSearch, receivePage, receivePageSize])

  // Helper: sort function
  function sortPlayers(players: Player[], sort: string) {
    return [...players].sort((a, b) => {
      if (sort === 'OVR') return (b.ovr || 0) - (a.ovr || 0)
      if (sort === 'Age') return (a.age || 0) - (b.age || 0)
      if (sort === 'Value') return calculatePlayerValue(b) - calculatePlayerValue(a)
      // Default: Name
      return (a.name || '').localeCompare(b.name || '')
    })
  }

  // Helper to open player modal
  function openPlayerModal(player: Player) {
    setModalPlayer(player);
    setModalOpen(true);
  }

  // Top-level check for valid league_id (after hooks)
  if (!league_id || league_id === 'undefined') {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-center text-red-400">
        Invalid or missing league ID. Please return to the dashboard or select a valid league.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neon-green" />
          <p className="text-gray-400">Loading league data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (availableTeams.length <= 1 || teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neon-green" />
          <p className="text-gray-400">Loading teams data...</p>
        </div>
      </div>
    )
  }

  if (!userTeamId) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-center text-red-400">
        Unable to determine your team. Please refresh the page or contact support.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Trade Calculator</h2>
          <p className="text-gray-400">Evaluate trades and get AI-powered suggestions</p>
        </div>
        <button
          onClick={clearTrade}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Clear Trade
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team A Section */}
        <div className="space-y-4">
          {/* Team A Panel */}
          <div className="bg-gray-800/50 rounded-lg p-4 min-h-[420px] flex flex-col">
            {/* Team header - Fixed to user's team */}
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">Your Team</h3>
              <div className="px-2 py-1 rounded bg-gray-600 text-white text-lg font-semibold w-full text-center">
                {user ? (
                  teams.find(t => t.id === user.id)?.name || 'Loading...'
                ) : (
                  'Loading...'
                )}
              </div>
            </div>
            
            {/* Team Financials Section */}
            {giveTeam !== 'All' && giveTeamFinancials && (
              <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  Team Financials
                  {!teams.find(t => t.name === giveTeam)?.financials && (
                    <span className="text-xs text-yellow-400" title="Using fallback data - real financial data unavailable">⚠️</span>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Salary Cap:</span>
                    <span className="text-white ml-2">${giveTeamFinancials.salaryCap.toFixed(0)}M</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Used:</span>
                    <span className="text-white ml-2">${giveTeamFinancials.usedCapSpace.toFixed(1)}M</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Available:</span>
                    <span className={`ml-2 ${giveTeamFinancials.availableCapSpace > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${giveTeamFinancials.availableCapSpace.toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Filters stacked in two rows */}
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex gap-2">
                <select value={givePosition} onChange={e => { setGivePosition(e.target.value); setGivePage(1); }} className="px-2 py-1 rounded bg-gray-700 text-white w-full">
                  <option value="All">All Positions</option>
                  {availablePositions.slice(1).map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
                <input type="text" value={giveSearch} onChange={e => { setGiveSearch(e.target.value); setGivePage(1); }} placeholder="Search..." className="px-2 py-1 rounded bg-gray-700 text-white w-full" />
              </div>
              <div className="flex gap-2">
                <select value={givePageSize} onChange={e => { setGivePageSize(Number(e.target.value)); setGivePage(1); }} className="px-2 py-1 rounded bg-gray-700 text-white w-full">
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <select value={giveSort} onChange={e => setGiveSort(e.target.value)} className="px-2 py-1 rounded bg-gray-700 text-white w-full">
                  <option value="Name">Name</option>
                  <option value="OVR">OVR</option>
                  <option value="Age">Age</option>
                  <option value="Value">Value</option>
                </select>
              </div>
            </div>
            <div className="mb-2 text-gray-400 text-xs">Showing {givePlayersList.length} of {giveTotal} (Page {givePage} of {giveTotalPages})</div>
            {givePlayersList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No players found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                {sortPlayers(givePlayersList.filter(p => !givePlayers.some(sel => sel.id === p.id)), giveSort).map(player => (
                  <div key={player.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 cursor-pointer" onClick={() => addPlayer(player, true)}>
                    <Image src={'/default-avatar.png'} alt={typeof player.name === 'string' ? player.name : 'Player'} width={32} height={32} className="rounded-full bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{player.name || '—'}</p>
                      <p className="text-gray-400 text-xs">{player.position || '—'} • {player.team || '—'} • Age {player.age || '?'}</p>
                    </div>
                    <p className="text-neon-green font-bold">{player.ovr}</p>
                    <button className="ml-2 text-gray-400 hover:text-white" onClick={e => { e.stopPropagation(); openPlayerModal(player); }} title="View Details" type="button">i</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <button onClick={() => setGivePage(givePage - 1)} disabled={givePage === 1} className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50">Prev</button>
              <span className="text-gray-300">Page {givePage} of {giveTotalPages}</span>
              <button onClick={() => setGivePage(givePage + 1)} disabled={givePage === giveTotalPages} className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50">Next</button>
            </div>
          </div>
          
          {/* Team A Sending Panel */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 mb-3">Your Team Sending</h3>
            {givePlayers.length === 0 ? (
              <p className="text-gray-400 text-sm">No players selected</p>
            ) : (
              <div className="space-y-2">
                {givePlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 p-2 bg-red-900/30 rounded">
                    <Image
                      src={'/default-avatar.png'}
                      alt={typeof player.name === 'string' ? player.name : 'Player'}
                      width={40}
                      height={40}
                      className="rounded-full bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{player.name || '—'}</p>
                      <p className="text-gray-400 text-xs">{player.position || '—'} • {player.ovr} OVR • Age {player.age || '?'}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removePlayer(player.id, true) }}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="pt-2 border-t border-red-500/30">
                  <p className="text-red-400 font-bold">Total Value: {giveValue}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Team B Section */}
        <div className="space-y-4">
          {/* Team B Panel */}
          <div className="bg-gray-800/50 rounded-lg p-4 min-h-[420px] flex flex-col">
            {/* Team dropdown as header */}
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">Team B</h3>
              <select value={receiveTeam} onChange={e => handleReceiveTeamChange(e.target.value)} className="px-2 py-1 rounded bg-gray-700 text-white text-lg font-semibold w-full">
                <option value="All">Select Team</option>
                {teams.slice().sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                  <option key={team.id} value={team.name}>{team.name}</option>
                ))}
              </select>
            </div>
            
            {/* Team Financials Section */}
            {receiveTeam !== 'All' && receiveTeamFinancials && (
              <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  Team Financials
                  {!teams.find(t => t.name === receiveTeam)?.financials && (
                    <span className="text-xs text-yellow-400" title="Using fallback data - real financial data unavailable">⚠️</span>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Salary Cap:</span>
                    <span className="text-white ml-2">${receiveTeamFinancials.salaryCap.toFixed(0)}M</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Used:</span>
                    <span className="text-white ml-2">${receiveTeamFinancials.usedCapSpace.toFixed(1)}M</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Available:</span>
                    <span className={`ml-2 ${receiveTeamFinancials.availableCapSpace > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${receiveTeamFinancials.availableCapSpace.toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Filters stacked in two rows */}
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex gap-2">
                <select value={receivePosition} onChange={e => { setReceivePosition(e.target.value); setReceivePage(1); }} className="px-2 py-1 rounded bg-gray-700 text-white w-full">
                  <option value="All">All Positions</option>
                  {availablePositions.slice(1).map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
                <input type="text" value={receiveSearch} onChange={e => { setReceiveSearch(e.target.value); setReceivePage(1); }} placeholder="Search..." className="px-2 py-1 rounded bg-gray-700 text-white w-full" />
              </div>
              <div className="flex gap-2">
                <select value={receivePageSize} onChange={e => { setReceivePageSize(Number(e.target.value)); setReceivePage(1); }} className="px-2 py-1 rounded bg-gray-700 text-white w-full">
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <select value={receiveSort} onChange={e => setReceiveSort(e.target.value)} className="px-2 py-1 rounded bg-gray-700 text-white w-full">
                  <option value="Name">Name</option>
                  <option value="OVR">OVR</option>
                  <option value="Age">Age</option>
                  <option value="Value">Value</option>
                </select>
              </div>
            </div>
            <div className="mb-2 text-gray-400 text-xs">Showing {receivePlayersList.length} of {receiveTotal} (Page {receivePage} of {receiveTotalPages})</div>
            {receivePlayersList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No players found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                {sortPlayers(receivePlayersList.filter(p => !receivePlayers.some(sel => sel.id === p.id)), receiveSort).map(player => (
                  <div key={player.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 cursor-pointer" onClick={() => addPlayer(player, false)}>
                    <Image src={'/default-avatar.png'} alt={typeof player.name === 'string' ? player.name : 'Player'} width={32} height={32} className="rounded-full bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{player.name || '—'}</p>
                      <p className="text-gray-400 text-xs">{player.position || '—'} • {player.team || '—'} • Age {player.age || '?'}</p>
                    </div>
                    <p className="text-neon-green font-bold">{player.ovr}</p>
                    <button className="ml-2 text-gray-400 hover:text-white" onClick={e => { e.stopPropagation(); openPlayerModal(player); }} title="View Details" type="button">i</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <button onClick={() => setReceivePage(receivePage - 1)} disabled={receivePage === 1} className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50">Prev</button>
              <span className="text-gray-300">Page {receivePage} of {receiveTotalPages}</span>
              <button onClick={() => setReceivePage(receivePage + 1)} disabled={receivePage === receiveTotalPages} className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50">Next</button>
            </div>
          </div>
          
          {/* Team B Sending Panel */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Team B Sending</h3>
            {receivePlayers.length === 0 ? (
              <p className="text-gray-400 text-sm">No players selected</p>
            ) : (
              <div className="space-y-2">
                {receivePlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 p-2 bg-green-900/30 rounded">
                    <Image
                      src={'/default-avatar.png'}
                      alt={typeof player.name === 'string' ? player.name : 'Player'}
                      width={40}
                      height={40}
                      className="rounded-full bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{player.name || '—'}</p>
                      <p className="text-gray-400 text-xs">{player.position || '—'} • {player.ovr} OVR • Age {player.age || '?'}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removePlayer(player.id, false) }}
                      className="text-green-400 hover:text-green-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="pt-2 border-t border-green-500/30">
                  <p className="text-green-400 font-bold">Total Value: {receiveValue}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Trade Calculation and Analysis Panel */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Trade Calculation</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Net Value:</span>
            <span className={`font-bold ${netValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {netValue >= 0 ? '+' : ''}{netValue.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Verdict:</span>
            <div className="flex items-center gap-1">
              {getVerdictIcon(verdict)}
              <span className={`font-bold ${getVerdictColor(verdict)}`}>
                {netValue > 15 ? 'You Win' : 
                 netValue < -15 ? 'They Win' : 
                 'Fair Trade'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={givePlayers.length === 0 || receivePlayers.length === 0 || submitting}
          className="w-full py-3 bg-neon-green hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors mt-4"
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Trade...
            </div>
          ) : (
            'Analyze Trade'
          )}
        </button>
      </div>

      {/* Trade Suggestions (Premium Feature) */}
      {user?.is_premium && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-neon-green" />
            <h3 className="text-lg font-semibold text-white">AI Trade Suggestions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select
              value={suggestionPlayerId || ''}
              onChange={(e) => setSuggestionPlayerId(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
            >
              <option value="">Select a player to trade</option>
              {givePlayers.map(p => (
                <option key={p.id} value={p.id}>{p.name || '—'} ({p.position || '—'})</option>
              ))}
            </select>
            
            <select
              value={suggestionStrategy}
              onChange={(e) => setSuggestionStrategy(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
            >
              <option value="value">Best Value</option>
              <option value="fairness">Fair Trade</option>
              <option value="potential">High Potential</option>
              <option value="needs">Fill Team Needs</option>
            </select>
            
            <button
              onClick={fetchTradeSuggestions}
              disabled={!suggestionPlayerId || loadingSuggestions}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              {loadingSuggestions ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                'Get Suggestions'
              )}
            </button>
          </div>

          {suggestedTrades.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Suggested Trade Packages:</h4>
              {suggestedTrades.map((suggestion, index) => (
                <div key={index} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white">{suggestion.targetTeamName}</h5>
                    <div className="flex items-center gap-2">
                      {getVerdictIcon(suggestion.verdict)}
                      <span className={`font-bold ${getVerdictColor(suggestion.verdict)}`}>
                        {suggestion.verdict}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{suggestion.reasoning}</p>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-gray-400 text-xs">Players Offered:</p>
                      <ul className="text-sm text-white">
                        {suggestion.playersOffered.map((player) => (
                          <li key={player.id} className="flex items-center gap-2">
                            <Image
                              src={'/default-avatar.png'}
                              alt={typeof player.name === 'string' ? player.name : 'Player'}
                              width={40}
                              height={40}
                              className="rounded-full bg-white"
                            />
                            {player.name || '—'} ({player.position || '—'})
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Trade Value: {suggestion.tradeValue}</p>
                      <p className="text-gray-400 text-xs">Confidence: {suggestion.confidence}%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => applySuggestedTrade(suggestion)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition-colors"
                  >
                    Use This Trade
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

            {/* Enhanced Trade Analysis Results */}
      {result && result.tradeAssessment ? (
        <div className="enhanced-trade-analysis space-y-8">
          {/* Header */}
          <div className="analysis-header">
            <div className="flex items-center gap-2 mb-2">
              {getVerdictIcon(result.tradeAssessment.verdict)}
              <h2 className="text-2xl font-bold text-white">🎯 Advanced Trade Analysis</h2>
            </div>
            <div className="text-gray-400">
              {result.tradeContext?.givingTeamName || 'Your Team'} ↔️ Trade Analysis
            </div>
          </div>

          {/* Enhanced Trade Assessment */}
          <div className="trade-assessment-enhanced bg-gray-800/50 rounded-lg p-6 border border-gray-600">
            {/* Main Assessment Header */}
            <div className="assessment-header grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="assessment-item text-center p-4 bg-gray-700/50 rounded">
                <label className="text-sm text-gray-400 block mb-2">Verdict</label>
                <div className={`text-lg font-bold ${getVerdictColor(result.tradeAssessment.verdict)}`}>
                  {result.tradeAssessment.verdict}
                </div>
              </div>
              
              <div className="assessment-item text-center p-4 bg-gray-700/50 rounded">
                <label className="text-sm text-gray-400 block mb-2">Confidence</label>
                <div className="text-lg font-bold text-white">{result.tradeAssessment.confidence}%</div>
              </div>
              
              <div className="assessment-item text-center p-4 bg-gray-700/50 rounded">
                <label className="text-sm text-gray-400 block mb-2">Auto-Approve</label>
                <div className={`text-lg font-bold ${result.canAutoApprove ? 'text-green-500' : 'text-red-500'}`}>
                  {result.canAutoApprove ? '✓ Yes' : '✗ No'}
                </div>
              </div>
              
              <div className="assessment-item text-center p-4 bg-gray-700/50 rounded">
                <label className="text-sm text-gray-400 block mb-2">Risk Level</label>
                <div className={`text-lg font-bold ${
                  result.advancedMetrics?.riskLevel === 'Low' ? 'text-green-500' :
                  result.advancedMetrics?.riskLevel === 'Medium' ? 'text-yellow-500' : 
                  result.advancedMetrics?.riskLevel === 'High' ? 'text-red-500' :
                  Math.abs(result.tradeAssessment.netGain) < 10 ? 'text-green-500' : 
                  Math.abs(result.tradeAssessment.netGain) < 25 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {result.advancedMetrics?.riskLevel || 
                   (Math.abs(result.tradeAssessment.netGain) < 10 ? 'Low' : 
                    Math.abs(result.tradeAssessment.netGain) < 25 ? 'Medium' : 'High')}
                </div>
              </div>
            </div>

            {/* Value Exchange */}
            <div className="value-exchange grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="giving-section bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                <h3 className="text-red-400 mb-3 flex items-center gap-2">📤 What You&apos;re Giving</h3>
                <div className="text-2xl font-bold text-red-300 mb-2">{result.tradeAssessment.teamGives}</div>
                <div className="text-sm text-gray-400 space-y-1">
                  <div>Total Value</div>
                  <div>Players: {givePlayers.length}</div>
                  <div>Avg: {Math.round(result.tradeAssessment.teamGives / givePlayers.length)}</div>
                </div>
              </div>
              
              <div className="receiving-section bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                <h3 className="text-green-400 mb-3 flex items-center gap-2">📥 What You&apos;re Receiving</h3>
                <div className="text-2xl font-bold text-green-300 mb-2">{result.tradeAssessment.teamReceives}</div>
                <div className="text-sm text-gray-400 space-y-1">
                  <div>Total Value</div>
                  <div>Players: {receivePlayers.length}</div>
                  <div>Avg: {Math.round(result.tradeAssessment.teamReceives / receivePlayers.length)}</div>
                </div>
              </div>
            </div>

            {/* Net Impact */}
            <div className="net-impact bg-gray-700/50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Net Gain/Loss</label>
                  <div className={`text-xl font-bold ${result.tradeAssessment.netGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.tradeAssessment.netGain >= 0 ? '+' : ''}{result.tradeAssessment.netGain}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Value Ratio</label>
                  <div className="text-xl font-bold text-white">
                    {result.advancedMetrics?.valueRatio || Math.round((result.tradeAssessment.teamReceives / result.tradeAssessment.teamGives) * 100)}%
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Trade Balance</label>
                  <div className={`text-xl font-bold ${
                    result.advancedMetrics?.tradeBalance === 'Balanced' ? 'text-green-400' :
                    result.advancedMetrics?.tradeBalance === 'Slightly Unbalanced' ? 'text-yellow-400' :
                    result.advancedMetrics?.tradeBalance === 'Unbalanced' ? 'text-red-400' :
                    Math.abs(result.tradeAssessment.netGain) < 10 ? 'text-green-400' : 
                    Math.abs(result.tradeAssessment.netGain) < 25 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {result.advancedMetrics?.tradeBalance || 
                     (Math.abs(result.tradeAssessment.netGain) < 10 ? 'Balanced' : 
                      Math.abs(result.tradeAssessment.netGain) < 25 ? 'Slightly Unbalanced' : 'Unbalanced')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Cap Impact */}
          {(result.advancedMetrics?.salaryImpact || (giveTeamFinancials && receiveTeamFinancials)) && (
            <div className="salary-cap-impact bg-gray-800/50 rounded-lg p-6 border border-gray-600">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">💰 Salary Cap Impact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Your Team Salary Cap */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-blue-300">Your Team - {giveTeam}</h4>
                  {giveTeamFinancials && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Used:</span>
                        <span className="font-mono text-white">${giveTeamFinancials.usedCapSpace.toFixed(1)}M</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Available:</span>
                        <span className={`font-mono ${giveTeamFinancials.availableCapSpace > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${giveTeamFinancials.availableCapSpace.toFixed(1)}M
                        </span>
                      </div>
                      
                      <div className="cap-usage-bar">
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(giveTeamFinancials.usedCapSpace / giveTeamFinancials.salaryCap) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>$0M</span>
                          <span>${giveTeamFinancials.salaryCap.toFixed(0)}M</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Team B (Receive Team) Salary Cap */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-purple-300">Team B - {receiveTeam}</h4>
                  {receiveTeamFinancials && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Used:</span>
                        <span className="font-mono text-white">${receiveTeamFinancials.usedCapSpace.toFixed(1)}M</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Available:</span>
                        <span className={`font-mono ${receiveTeamFinancials.availableCapSpace > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${receiveTeamFinancials.availableCapSpace.toFixed(1)}M
                        </span>
                      </div>
                      
                      <div className="cap-usage-bar">
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(receiveTeamFinancials.usedCapSpace / receiveTeamFinancials.salaryCap) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>$0M</span>
                          <span>${receiveTeamFinancials.salaryCap.toFixed(0)}M</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced Trade Impact from Backend (if available) */}
              {result.advancedMetrics?.salaryImpact && (
                <div className="mt-6 pt-4 border-t border-gray-600">
                  <h4 className="text-sm font-semibold text-green-300 mb-3">📊 Projected Trade Impact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">Current Cap Hit</div>
                      <div className="font-mono text-white">${result.advancedMetrics.salaryImpact.currentCapHit.toFixed(1)}M</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">Trade Impact</div>
                      <div className={`font-mono ${result.advancedMetrics.salaryImpact.tradeImpact >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {result.advancedMetrics.salaryImpact.tradeImpact >= 0 ? '+' : ''}${result.advancedMetrics.salaryImpact.tradeImpact.toFixed(1)}M
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">New Cap Room</div>
                      <div className={`font-mono font-bold ${
                        result.advancedMetrics.salaryImpact.newCapRoom < 10 ? 'text-red-400' :
                        result.advancedMetrics.salaryImpact.newCapRoom < 30 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        ${result.advancedMetrics.salaryImpact.newCapRoom.toFixed(1)}M
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Roster Construction Analysis */}
          {result.advancedMetrics?.rosterConstruction && (
            <div className="roster-construction bg-gray-800/50 rounded-lg p-6 border border-gray-600">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🏗️ Roster Construction Impact</h3>
              
              {/* Positional Depth Grid */}
              <div className="depth-grid grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                {Object.entries(result.advancedMetrics.rosterConstruction.positionalDepth).map(([position, count]) => (
                  <div key={position} className="depth-item text-center p-3 bg-gray-700/50 rounded">
                    <div className="text-sm text-gray-400">{position}</div>
                    <div className={`text-xl font-bold ${
                      ['QB', 'WR', 'HB', 'TE'].includes(position) ? 
                        (count <= 2 ? 'text-red-400' : count <= 3 ? 'text-yellow-400' : 'text-green-400') :
                        (count <= 3 ? 'text-yellow-400' : count >= 6 ? 'text-blue-400' : 'text-green-400')
                    }`}>
                      {count}
                    </div>
                    {result.advancedMetrics?.positionalImpact?.depthChanges?.[position]?.affected && (
                      <div className="text-xs text-yellow-400">⚠ Affected</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Needs Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="weak-positions">
                  <h4 className="text-red-400 font-semibold mb-2">⚠️ Needs Attention</h4>
                  {result.advancedMetrics.rosterConstruction.weakPositions?.length > 0 ? (
                    <div className="space-y-1">
                      {result.advancedMetrics.rosterConstruction.weakPositions.map(pos => (
                        <div key={pos} className="text-red-300 text-sm">
                          {pos} (only {result.advancedMetrics?.rosterConstruction?.positionalDepth[pos]} players)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">No critical weaknesses</div>
                  )}
                </div>
                
                <div className="strong-positions">
                  <h4 className="text-blue-400 font-semibold mb-2">💪 Trade Assets</h4>
                  {result.advancedMetrics.rosterConstruction.strongPositions?.length > 0 ? (
                    <div className="space-y-1">
                      {result.advancedMetrics.rosterConstruction.strongPositions.map(pos => (
                        <div key={pos} className="text-blue-300 text-sm">
                          {pos} ({result.advancedMetrics?.rosterConstruction?.positionalDepth[pos]} players)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">No surplus positions</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced AI Analysis with Positional Grading */}
          <div className="ai-analysis bg-gray-800/50 rounded-lg p-6 border border-gray-600 space-y-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🤖 AI Analysis</h3>
            <div className="reasoning bg-gray-700/50 p-4 rounded text-sm leading-relaxed text-white">
              {result.reasoning}
            </div>

            {/* Positional Grade Summary */}
            {result.advancedMetrics?.positionalGrades?.summary && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span>📊</span> Positional Impact Summary
                </h4>
                <div className="text-gray-300 text-sm">
                  {result.advancedMetrics.positionalGrades.summary}
                </div>
              </div>
            )}

            {/* Grade Changes Display */}
            {result.advancedMetrics?.positionalGrades && (
              result.advancedMetrics.positionalGrades.improvements.length > 0 || 
              result.advancedMetrics.positionalGrades.downgrades.length > 0
            ) && (
              <div className="mt-4">
                <PositionalGradeComparison 
                  improvements={result.advancedMetrics.positionalGrades.improvements}
                  downgrades={result.advancedMetrics.positionalGrades.downgrades}
                />
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          {result.aiRecommendations && (
            <div className="ai-recommendations bg-gray-800/50 rounded-lg p-6 border border-gray-600 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">🧠 AI Analysis & Recommendations</h3>
              
              {/* Primary Recommendation */}
              {result.aiRecommendations?.primary && (
                <div className="primary-rec p-4 rounded-lg border-l-4 border-red-500 bg-red-900/20">
                  <div className="text-sm text-gray-400 mb-1">Primary Recommendation</div>
                  <div className="font-semibold text-white">{result.aiRecommendations.primary}</div>
                </div>
              )}

              {/* Specific Suggestions */}
              {result.aiRecommendations && result.aiRecommendations.specificSuggestions && result.aiRecommendations.specificSuggestions.length > 0 && (
                <div className="specific-suggestions">
                  <h4 className="text-md font-semibold text-purple-400 mb-3">🎯 Specific Suggestions</h4>
                  <div className="space-y-2">
                    {result.aiRecommendations.specificSuggestions.map((suggestion, index) => (
                      <div key={index} className="bg-purple-900/20 p-3 rounded border-l-2 border-purple-500">
                        <div className="text-sm text-white">{suggestion}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary Recommendations */}
              {result.aiRecommendations && result.aiRecommendations.secondary && result.aiRecommendations.secondary.length > 0 && (
                <div className="secondary-recommendations">
                  <h4 className="text-md font-semibold text-blue-400 mb-3">💡 Alternative Options</h4>
                  <div className="grid gap-2">
                    {result.aiRecommendations.secondary.map((rec, index) => (
                      <div key={index} className="bg-blue-900/20 p-3 rounded text-sm text-white">
                        • {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {result.aiRecommendations && result.aiRecommendations.riskFactors && result.aiRecommendations.riskFactors.length > 0 && (
                <div className="risk-factors">
                  <h4 className="text-md font-semibold text-red-400 mb-3">⚠️ Risk Factors</h4>
                  <div className="space-y-2">
                    {result.aiRecommendations.riskFactors.map((risk, index) => (
                      <div key={index} className="bg-red-900/20 p-3 rounded border-l-2 border-red-500 text-sm text-white">
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negotiation Tips */}
              {result.aiRecommendations && result.aiRecommendations.negotiationTips && result.aiRecommendations.negotiationTips.length > 0 && (
                <div className="negotiation-tips">
                  <h4 className="text-md font-semibold text-green-400 mb-3">💰 Negotiation Tips</h4>
                  <div className="grid gap-2">
                    {result.aiRecommendations.negotiationTips.map((tip, index) => (
                      <div key={index} className="bg-green-900/20 p-2 rounded text-sm text-white">
                        💡 {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback to basic recommendations if enhanced ones not available */}
              {!result.aiRecommendations?.primary && (
                <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                  <h5 className="font-medium text-white mb-2">🎯 Recommendations:</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {result.tradeAssessment.netGain < -15 && (
                      <li>• Team A should consider asking for additional compensation or a better player</li>
                    )}
                    {result.tradeAssessment.netGain > 15 && (
                      <li>• This trade heavily favors Team B - Team A may want to renegotiate</li>
                    )}
                    {Math.abs(result.tradeAssessment.netGain) < 10 && (
                      <li>• This is a fair trade that benefits both teams</li>
                    )}
                    {result.canAutoApprove && (
                      <li>• This trade meets auto-approval criteria</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
       ) : result ? (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600 text-red-400">
          Could not analyze trade. Please try again or check your selections.
          {result.reasoning && (
            <div className="mt-2 text-white text-sm">{result.reasoning}</div>
          )}
        </div>
      ) : null}

      {/* Team Grade Overview - Before/After Comparison */}
      {result?.advancedMetrics?.positionalGrades && (
        <div className="team-grades-comparison space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TeamGradeOverview 
              grades={result.advancedMetrics.positionalGrades.beforeTrade}
              title="Before Trade - Team Grades"
            />
            <TeamGradeOverview 
              grades={result.advancedMetrics.positionalGrades.afterTrade}
              title="After Trade - Team Grades"
            />
          </div>
        </div>
      )}

      {/* Player Value Breakdown Panel */}
      {(givePlayers.length > 0 || receivePlayers.length > 0) && (
        <div className="player-value-breakdown bg-gray-800/50 rounded-lg p-6 border border-gray-600 mt-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            🧮 Player Value Breakdown
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team A (Giving) Players */}
            {givePlayers.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-red-300 border-b border-red-500/30 pb-2">
                  Your Team Sending ({givePlayers.length} player{givePlayers.length !== 1 ? 's' : ''})
                </h4>
                
                {givePlayers.map((player) => {
                  const breakdown = getPlayerValueBreakdown(player)
                  return (
                    <div key={player.id} className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-red-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-semibold text-white">{player.name}</h5>
                          <p className="text-sm text-gray-400">{breakdown.position} • Age {breakdown.age}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-400">{breakdown.finalValue}</div>
                          <div className="text-xs text-gray-400">Final Value</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center bg-gray-600/50 rounded p-2">
                            <div className="font-mono text-white">{breakdown.baseOVR}</div>
                            <div className="text-xs text-gray-400">Base OVR</div>
                          </div>
                          
                          <div className="text-center bg-gray-600/50 rounded p-2">
                            <div className="font-mono text-white">{breakdown.afterAge}</div>
                            <div className="text-xs text-gray-400">After Age</div>
                            <div className="text-xs text-blue-300">×{breakdown.ageFactor.toFixed(2)}</div>
                          </div>
                          
                          <div className="text-center bg-gray-600/50 rounded p-2">
                            <div className="font-mono text-white">{breakdown.afterDev}</div>
                            <div className="text-xs text-gray-400">After Dev</div>
                            <div className="text-xs text-purple-300">×{breakdown.devTraitMultiplier.toFixed(1)}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center bg-gray-600/30 rounded p-2">
                          <span className="text-gray-300">Position Multiplier ({breakdown.position}):</span>
                          <span className="font-mono text-yellow-300">×{breakdown.positionMultiplier.toFixed(1)}</span>
                        </div>
                        
                        {breakdown.devTrait !== 'Normal' && (
                          <div className="text-xs text-purple-300">
                            🌟 {breakdown.devTrait} Development Trait
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/30">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-red-300">Your Team Total Value:</span>
                    <span className="font-bold text-red-400 text-lg">{giveValue}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Team B (Receiving) Players */}
            {receivePlayers.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-green-300 border-b border-green-500/30 pb-2">
                  Team B Sending ({receivePlayers.length} player{receivePlayers.length !== 1 ? 's' : ''})
                </h4>
                
                {receivePlayers.map((player) => {
                  const breakdown = getPlayerValueBreakdown(player)
                  return (
                    <div key={player.id} className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-semibold text-white">{player.name}</h5>
                          <p className="text-sm text-gray-400">{breakdown.position} • Age {breakdown.age}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{breakdown.finalValue}</div>
                          <div className="text-xs text-gray-400">Final Value</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center bg-gray-600/50 rounded p-2">
                            <div className="font-mono text-white">{breakdown.baseOVR}</div>
                            <div className="text-xs text-gray-400">Base OVR</div>
                          </div>
                          
                          <div className="text-center bg-gray-600/50 rounded p-2">
                            <div className="font-mono text-white">{breakdown.afterAge}</div>
                            <div className="text-xs text-gray-400">After Age</div>
                            <div className="text-xs text-blue-300">×{breakdown.ageFactor.toFixed(2)}</div>
                          </div>
                          
                          <div className="text-center bg-gray-600/50 rounded p-2">
                            <div className="font-mono text-white">{breakdown.afterDev}</div>
                            <div className="text-xs text-gray-400">After Dev</div>
                            <div className="text-xs text-purple-300">×{breakdown.devTraitMultiplier.toFixed(1)}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center bg-gray-600/30 rounded p-2">
                          <span className="text-gray-300">Position Multiplier ({breakdown.position}):</span>
                          <span className="font-mono text-yellow-300">×{breakdown.positionMultiplier.toFixed(1)}</span>
                        </div>
                        
                        {breakdown.devTrait !== 'Normal' && (
                          <div className="text-xs text-purple-300">
                            🌟 {breakdown.devTrait} Development Trait
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-300">Team B Total Value:</span>
                    <span className="font-bold text-green-400 text-lg">{receiveValue}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Value Calculation Formula */}
          <div className="mt-6 bg-gray-700/30 rounded-lg p-4 border border-gray-500/30">
            <h5 className="font-semibold text-gray-300 mb-2">💡 Value Calculation Formula</h5>
            <div className="text-sm text-gray-400 space-y-1">
              <div>1. <span className="text-blue-300">Age Factor</span>: Younger players more valuable (22 = 1.0, decreases by 0.02 per year, min 0.7)</div>
              <div>2. <span className="text-purple-300">Development Trait</span>: Superstar ×1.3, Star ×1.2, Hidden ×1.1, Normal ×1.0</div>
              <div>3. <span className="text-yellow-300">Position Multiplier</span>: QB ×1.2, WR ×1.1, HB/CB/MLB ×1.0, etc.</div>
              <div className="font-mono text-xs bg-gray-800 p-2 rounded mt-2">
                Final Value = ((Base OVR × Age Factor) × Dev Trait) × Position Multiplier
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Clear All button above trade summary */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button onClick={clearTrade} className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold">Clear All</button>
        {(renderCount.current > 10 || error?.includes('Rate limit')) && (
          <button onClick={resetComponent} className="py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white font-bold text-xs">Emergency Reset</button>
        )}
      </div>

      {/* 4. Enhanced Player Detail Modal */}
      {modalOpen && modalPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">×</button>
            
            {/* Player Header */}
            <div className="flex items-center gap-4 mb-6">
              <Image src={'/default-avatar.png'} alt={typeof modalPlayer.name === 'string' ? modalPlayer.name : 'Player'} width={64} height={64} className="rounded-full bg-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">{modalPlayer.name || '—'}</h2>
                <p className="text-gray-400 text-lg">{modalPlayer.position || '—'} • {modalPlayer.team || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Basic Information</h3>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Overall Rating:</span>
                    <span className="font-bold text-neon-green">{modalPlayer.ovr}</span>
                  </div>
                  {modalPlayer.age && (
                    <div className="flex justify-between">
                      <span>Age:</span>
                      <span>{modalPlayer.age}</span>
                    </div>
                  )}
                  {modalPlayer.devTrait && (
                    <div className="flex justify-between">
                      <span>Development Trait:</span>
                      <span className="font-medium">{modalPlayer.devTrait}</span>
                    </div>
                  )}
                  {modalPlayer.yearsPro && (
                    <div className="flex justify-between">
                      <span>Years Pro:</span>
                      <span>{modalPlayer.yearsPro}</span>
                    </div>
                  )}
                </div>

                {/* Contract Information */}
                {modalPlayer.contractInfo && (
                  <div>
                    <h4 className="text-md font-semibold text-white border-b border-gray-600 pb-1 mb-2">Contract Info</h4>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <div className="flex justify-between">
                        <span>Cap Hit:</span>
                        <span>${modalPlayer.contractInfo.capHit.toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Years Left:</span>
                        <span>{modalPlayer.contractInfo.yearsLeft}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contract Type:</span>
                        <span>{modalPlayer.contractInfo.contractType}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Value Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Trade Value Breakdown</h3>
                {modalPlayer.valueBreakdown ? (
                  <div className="space-y-3">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <span className="text-2xl font-bold text-neon-green">{modalPlayer.valueBreakdown.finalValue}</span>
                        <span className="text-gray-400 ml-2">Trade Value</span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {modalPlayer.valueBreakdown.calculationSteps.map((step, index) => (
                          <div key={index} className="text-gray-300 font-mono text-xs">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-400">
                      <div>{modalPlayer.valueBreakdown.ageFactorExplanation}</div>
                      <div>{modalPlayer.valueBreakdown.devTraitExplanation}</div>
                      <div>{modalPlayer.valueBreakdown.positionExplanation}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <span className="text-2xl font-bold text-neon-green">{calculatePlayerValue(modalPlayer)}</span>
                    <span className="text-gray-400 ml-2">Trade Value</span>
                    <div className="text-xs text-gray-500 mt-2">Detailed breakdown not available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Position-Specific Attributes */}
            {modalPlayer.positionAttributes && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
                  {modalPlayer.position} Attributes
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Key Stats */}
                  {modalPlayer.positionAttributes.keyStats.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-blue-300 mb-3">Key Stats</h4>
                      <div className="space-y-2">
                        {modalPlayer.positionAttributes.keyStats.map((stat, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className={`text-sm ${
                              stat.importance === 'Critical' ? 'text-red-300' :
                              stat.importance === 'High' ? 'text-yellow-300' :
                              stat.importance === 'Medium' ? 'text-blue-300' :
                              'text-gray-300'
                            }`}>
                              {stat.label}
                            </span>
                            <span className="font-bold text-white">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Physical Traits */}
                  {modalPlayer.positionAttributes.physicalTraits.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-green-300 mb-3">Physical Traits</h4>
                      <div className="space-y-2">
                        {modalPlayer.positionAttributes.physicalTraits.map((trait, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">{trait.label}</span>
                            <span className="font-bold text-white">{trait.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialties */}
                  {modalPlayer.positionAttributes.specialties.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-purple-300 mb-3">Specialties</h4>
                      <div className="space-y-2">
                        {modalPlayer.positionAttributes.specialties.map((specialty, index) => (
                          <div key={index} className="bg-purple-900/20 border border-purple-500/30 rounded px-3 py-1 text-sm text-purple-200">
                            {specialty}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 
