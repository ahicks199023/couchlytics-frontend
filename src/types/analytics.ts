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

// Updated Team Detail interfaces to match new backend API
export interface TeamDetailResponse {
  team: {
    id: number
    name: string
    user: string
    record: string
    wins: number
    losses: number
    ties: number
    winPercentage: number
    pointsFor: number
    pointsAgainst: number
    conference: string
    division: string
    rosterCount: number
    injuryCount: number
    offenseScheme: string
    defenseScheme: string
  }
  capInformation: {
    capRoom: number
    spent: number
    available: number
    totalSalary: number
    totalBonus: number
  }
  offensiveStats: {
    points: number
    pointsRank: number
    yards: number
    yardsRank: number
    passingYards: number
    passingYardsRank: number
    rushingYards: number
    rushingYardsRank: number
  }
  defensiveStats: {
    points: number
    pointsRank: number
    yards: number
    yardsRank: number
    passingYards: number
    passingYardsRank: number
    rushingYards: number
    rushingYardsRank: number
  }
  leaders: {
    passing: {
      player: string
      position: string
      yards: number
    }
    rushing: {
      player: string
      position: string
      yards: number
    }
    receiving: {
      player: string
      position: string
      yards: number
    }
    tackles: {
      player: string
      position: string
      tackles: number
    }
    sacks: {
      player: string
      position: string
      sacks: number
    }
    interceptions: {
      player: string
      position: string
      interceptions: number
    }
  }
  mostExpensive: Array<{
    player: string
    position: string
    devTrait: string
    overall: number
    capHit: number
    salary: number
    bonus: number
    yearsLeft: number
    contractLength: number
  }>
  upcomingFreeAgents: Array<{
    player: string
    position: string
    devTrait: string
    overall: number
    capHit: number
    salary: number
    bonus: number
    yearsLeft: number
    contractLength: number
  }>
  upcomingGames: Array<{
    week: number
    opponent: string
    opponentAbbr: string
    result?: string
    homeScore?: number
    awayScore?: number
    isHome: boolean
    date?: string
    time?: string
  }>
  divisionStandings: Array<{
    team: string
    abbreviation: string
    wins: number
    losses: number
    ties: number
    winPercentage: number
    pointsFor: number
    pointsAgainst: number
  }>
  // New fields for roster and depth chart
  roster: Array<{
    id: number
    madden_id: string
    name: string
    position: string
    overall: number
    dev_trait: string
    age: number
    height: string
    weight: number
    speed: number
    cap_hit: number
    salary: number
    bonus: number
    years_left: number
    contract_length: number
    is_on_ir: boolean
    is_on_trade_block: boolean
  }>
  depthChart: {
    [position: string]: Array<{
      id: number
      madden_id: string
      name: string
      position: string
      overall: number
      dev_trait: string
      age: number
      height: string
      weight: number
      speed: number
      cap_hit: number
      salary: number
      bonus: number
      years_left: number
      contract_length: number
      is_on_ir: boolean
      is_on_trade_block: boolean
    }>
  }
  onTheBlock: Array<{
    player: string
    position: string
    devTrait: string
    overall: number
    age: number
    height: string
    speed: number
    capHit: number
    salary: number
    bonus: number
    yearsLeft: number
  }>
}

// Legacy interfaces for backward compatibility
export interface TeamDetail {
  teamId: number
  teamName: string
  city: string
  abbreviation: string
  conference: string
  division: string
  overall: number
  leagueRank: number
  record: {
    wins: number
    losses: number
    ties: number
    winPercentage: number
  }
  owner: {
    name: string
    username: string
  }
  schemes: {
    offense: string
    defense: string
  }
  roster: {
    total: number
    active: number
    injured: number
  }
  cap: {
    room: number
    spent: number
    available: number
    total: number
  }
  teamNotes?: string
  tradeBlockComments?: string
}

export interface TeamPlayer {
  playerId: number
  playerName: string
  position: string
  jerseyNumber?: number
  devTrait: string
  overall: number
  age: number
  height: number
  speed: number
  capHit: number
  salary: number
  bonus: number
  yearsLeft: number
  contractLength: number
  value?: number
  headshotUrl?: string
}

export interface TeamGame {
  week: number
  opponent: string
  opponentAbbr: string
  result?: string
  homeScore?: number
  awayScore?: number
  isHome: boolean
  date?: string
  time?: string
}

export interface DivisionStanding {
  teamAbbr: string
  teamName: string
  wins: number
  losses: number
  ties: number
  winPercentage: number
  pointsFor: number
  pointsAgainst: number
}

export interface StatLeader {
  playerName: string
  position: string
  value: number
  teamAbbr: string
  headshotUrl?: string
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