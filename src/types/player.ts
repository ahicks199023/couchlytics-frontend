export interface Player {
  id: number
  name: string
  team: string
  position: string
  ovr: number
  teamId?: number
  teamName?: string
  user?: string
  espnId?: string
  devTrait?: string
  age?: number
  yearsPro?: number
  jerseyNumber?: string
  scheme?: string
  rookieYear?: number
  draftRound?: number
  draftPick?: number
  college?: string
  height?: number
  weight?: number
  birthDay?: number
  birthMonth?: number
  birthYear?: number
  lastUpdated?: string
  
  // Trade & Contract Information
  tradeBlocked?: boolean
  tradeValue?: number
  recommendedTrade?: string
  
  // Contract Details
  capHit?: number
  salary?: number
  bonus?: number
  yearsLeft?: number
  contractLength?: number
  releaseNetSavings?: number
  totalReleasePenalty?: number
  releasePenalty2026?: number
  releasePenalty2027?: number
  
  // Core Attributes
  speedRating?: number
  accelerationRating?: number
  agilityRating?: number
  strengthRating?: number
  awareRating?: number
  jumpRating?: number
  staminaRating?: number
  toughnessRating?: number
  injuryRating?: number
  
  // Passing Attributes
  throwPowerRating?: number
  throwAccRating?: number
  shortAccuracyRating?: number
  midAccuracyRating?: number
  deepAccuracyRating?: number
  throwOnRunRating?: number
  playActionRating?: number
  breakSackRating?: number
  underPressureRating?: number
  
  // Rushing Attributes
  carryRating?: number
  changeOfDirectionRating?: number
  spinMoveRating?: number
  jukeMoveRating?: number
  breakTackleRating?: number
  ballCarryVisionRating?: number
  truckingRating?: number
  stiffArmRating?: number
  
  // Receiving Attributes
  catchRating?: number
  specCatchRating?: number
  releaseRating?: number
  catchInTrafficRating?: number
  routeRunShortRating?: number
  medRouteRunRating?: number
  deepRouteRunRating?: number
  kickReturnRating?: number
  
  // Blocking Attributes
  passBlockRating?: number
  passBlockPowerRating?: number
  passBlockFinesseRating?: number
  runBlockRating?: number
  runBlockPowerRating?: number
  runBlockFinesseRating?: number
  leadBlockRating?: number
  impactBlockRating?: number
  
  // Defense Attributes
  tackleRating?: number
  hitPowerRating?: number
  pursuitRating?: number
  playRecognitionRating?: number
  blockShedRating?: number
  finesseMovesRating?: number
  powerMovesRating?: number
  manCoverRating?: number
  zoneCoverRating?: number
  pressRating?: number
  
  // Kicking Attributes
  kickPowerRating?: number
  kickAccuracyRating?: number
  
  // Traits
  clutchTrait?: boolean
  highMotorTrait?: boolean
  bigHitTrait?: boolean
  stripBallTrait?: boolean
  
  // Additional fields for compatibility
  maddenId?: string
  [key: string]: string | number | boolean | undefined
}

export interface Team {
  id: number
  name: string
  city: string
  user: string
  user_id?: number
}

export interface User {
  id: number
  email: string
  is_premium?: boolean
  teamId?: number
}

export interface TradeResult {
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
}

export interface SuggestedTrade {
  targetTeam: number
  targetTeamName: string
  verdict: string
  tradeValue: number
  playersOffered: Player[]
  confidence: number
  reasoning: string
}

export interface TradeData {
  leagueId: string
  teamId: number
  trade: {
    give: number[]
    receive: number[]
  }
  includeSuggestions: boolean
} 
