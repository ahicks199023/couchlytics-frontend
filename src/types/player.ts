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
  speedRating?: number
  strengthRating?: number
  awareRating?: number
  throwPowerRating?: number
  throwAccRating?: number
  throwOnRunRating?: number
  catchRating?: number
  routeRunShortRating?: number
  specCatchRating?: number
  carryRating?: number
  jukeMoveRating?: number
  breakTackleRating?: number
  passBlockRating?: number
  runBlockRating?: number
  leadBlockRating?: number
  tackleRating?: number
  hitPowerRating?: number
  blockShedRating?: number
  manCoverRating?: number
  zoneCoverRating?: number
  pressRating?: number
  college?: string
  height?: number
  weight?: number
  birthDay?: number
  birthMonth?: number
  birthYear?: number
  clutchTrait?: boolean
  highMotorTrait?: boolean
  bigHitTrait?: boolean
  stripBallTrait?: boolean
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
