// Player Stats Types
export interface PlayerPassingLeader {
  name: string
  teamName: string
  position: string
  yards: number
  touchdowns: number
  interceptions: number
  completions: number
  attempts: number
  rating: number
  gamesPlayed: number
}

export interface PlayerRushingLeader {
  name: string
  teamName: string
  position: string
  yards: number
  touchdowns: number
  attempts: number
  averagePerAttempt: number
  gamesPlayed: number
}

export interface PlayerReceivingLeader {
  name: string
  teamName: string
  position: string
  yards: number
  touchdowns: number
  catches: number
  averagePerCatch: number
  gamesPlayed: number
}

export interface PlayerTacklesLeader {
  name: string
  teamName: string
  position: string
  tackles: number
  sacks: number
  interceptions: number
  fumbleRecoveries: number
  gamesPlayed: number
}

export interface PlayerSacksLeader {
  name: string
  teamName: string
  position: string
  sacks: number
  tackles: number
  interceptions: number
  forcedFumbles: number
  gamesPlayed: number
}

export interface PlayerInterceptionsLeader {
  name: string
  teamName: string
  position: string
  interceptions: number
  returnYards: number
  touchdowns: number
  tackles: number
  gamesPlayed: number
}

// Team Stats Types
export interface TeamTotalYardsLeader {
  teamName: string
  totalYards: number
  passingYards: number
  rushingYards: number
  yardsPerGame: number
  gamesPlayed: number
}

export interface TeamPassingLeader {
  teamName: string
  passingYards: number
  passingTouchdowns: number
  interceptionsLost: number
  sacksAllowed: number
  yardsPerGame: number
  gamesPlayed: number
}

export interface TeamRushingLeader {
  teamName: string
  rushingYards: number
  rushingTouchdowns: number
  fumblesLost: number
  yardsPerGame: number
  gamesPlayed: number
}

export interface TeamYardsAllowedLeader {
  teamName: string
  totalYardsAllowed: number
  passYardsAllowed: number
  rushYardsAllowed: number
  yardsPerGame: number
  gamesPlayed: number
}

export interface TeamSacksLeader {
  teamName: string
  totalSacks: number
  interceptions: number
  forcedFumbles: number
  fumbleRecoveries: number
  sacksPerGame: number
  gamesPlayed: number
}

export interface TeamTurnoversLeader {
  teamName: string
  turnoverDifferential: number
  takeaways: number
  giveaways: number
  interceptions: number
  fumbleRecoveries: number
  gamesPlayed: number
}

// API Response Types
export interface StatsLeadersResponse {
  type: 'players' | 'teams'
  category: 'offensive' | 'defensive'
  stat: string
  leagueId: string
  leaders: Array<
    | PlayerPassingLeader
    | PlayerRushingLeader
    | PlayerReceivingLeader
    | PlayerTacklesLeader
    | PlayerSacksLeader
    | PlayerInterceptionsLeader
    | TeamTotalYardsLeader
    | TeamPassingLeader
    | TeamRushingLeader
    | TeamYardsAllowedLeader
    | TeamSacksLeader
    | TeamTurnoversLeader
  >
  count: number
}

export interface StatsLeadersSummaryResponse {
  categories: {
    players: {
      offensive: string[]
      defensive: string[]
    }
    teams: {
      offensive: string[]
      defensive: string[]
    }
  }
} 