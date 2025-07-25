// Analytics API Types
export interface PlayerStats {
  playerId: number
  playerName: string
  teamId: number
  teamName: string
  position: string
  stats: {
    passing?: {
      attempts: number
      completions: number
      yards: number
      touchdowns: number
      interceptions: number
      rating: number
    }
    rushing?: {
      attempts: number
      yards: number
      touchdowns: number
      fumbles: number
    }
    receiving?: {
      receptions: number
      yards: number
      touchdowns: number
      drops: number
    }
    defense?: {
      tackles: number
      sacks: number
      interceptions: number
      passesDefended: number
      forcedFumbles: number
      fumbleRecoveries: number
      touchdowns: number
    }
    kicking?: {
      fieldGoals: number
      fieldGoalAttempts: number
      extraPoints: number
      extraPointAttempts: number
    }
  }
  season: number
  week?: number
}

export interface TeamStats {
  teamId: number
  teamName: string
  city: string
  conference: string
  division: string
  rosterSize: number
  offense: {
    totalYards: number
    passingYards: number
    rushingYards: number
    pointsScored: number
    turnovers: number
  }
  defense: {
    totalYardsAllowed: number
    passingYardsAllowed: number
    rushingYardsAllowed: number
    pointsAllowed: number
    turnoversForced: number
  }
  record: {
    wins: number
    losses: number
    ties: number
    winPercentage: number
  }
  players: PlayerStats[]
}

export interface TeamSalaryCap {
  teamId: number
  teamName: string
  salaryCap: {
    total: number
    used: number
    available: number
    percentageUsed: number
  }
  playerCount: {
    total: number
    active: number
    practice: number
    injured: number
  }
  contracts: {
    totalValue: number
    averageValue: number
    highestValue: number
    lowestValue: number
  }
  players: {
    playerId: number
    playerName: string
    position: string
    salary: number
    contractLength: number
    deadCap: number
  }[]
}

export interface LeagueStandings {
  leagueId: number
  season: number
  conferences: {
    conferenceId: number
    conferenceName: string
    divisions: {
      divisionId: number
      divisionName: string
      teams: {
        teamId: number
        teamName: string
        city: string
        wins: number
        losses: number
        ties: number
        winPercentage: number
        pointsScored: number
        pointsAllowed: number
        pointDifferential: number
        conferenceRank: number
        divisionRank: number
        overallRank: number
      }[]
    }[]
  }[]
}

export interface AnalyticsError {
  error: string
  message: string
  status: number
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
} 