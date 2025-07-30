// Team Configuration System
// This file provides universal team logos, colors, and metadata across all leagues

export interface TeamConfig {
  id: number
  name: string
  abbreviation: string
  city: string
  fullName: string
  conference: string
  division: string
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
  }
  logo: {
    url: string
    alt: string
  }
  helmet: {
    url: string
    alt: string
  }
}

// NFL Team Configuration
export const NFL_TEAMS: TeamConfig[] = [
  {
    id: 1,
    name: 'Giants',
    abbreviation: 'NYG',
    city: 'New York',
    fullName: 'New York Giants',
    conference: 'NFC',
    division: 'East',
    colors: {
      primary: '#0B2265',
      secondary: '#A71930',
      accent: '#A71930',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/nyg.png',
      alt: 'New York Giants Logo'
    },
    helmet: {
      url: '/team-helmets/nyg.png',
      alt: 'New York Giants Helmet'
    }
  },
  {
    id: 2,
    name: 'Cowboys',
    abbreviation: 'DAL',
    city: 'Dallas',
    fullName: 'Dallas Cowboys',
    conference: 'NFC',
    division: 'East',
    colors: {
      primary: '#003594',
      secondary: '#869397',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/dal.png',
      alt: 'Dallas Cowboys Logo'
    },
    helmet: {
      url: '/team-helmets/dal.png',
      alt: 'Dallas Cowboys Helmet'
    }
  },
  {
    id: 3,
    name: 'Eagles',
    abbreviation: 'PHI',
    city: 'Philadelphia',
    fullName: 'Philadelphia Eagles',
    conference: 'NFC',
    division: 'East',
    colors: {
      primary: '#004C54',
      secondary: '#A5ACAF',
      accent: '#000000',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/phi.png',
      alt: 'Philadelphia Eagles Logo'
    },
    helmet: {
      url: '/team-helmets/phi.png',
      alt: 'Philadelphia Eagles Helmet'
    }
  },
  {
    id: 4,
    name: 'Commanders',
    abbreviation: 'WAS',
    city: 'Washington',
    fullName: 'Washington Commanders',
    conference: 'NFC',
    division: 'East',
    colors: {
      primary: '#5A1414',
      secondary: '#FFB612',
      accent: '#000000',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/was.png',
      alt: 'Washington Commanders Logo'
    },
    helmet: {
      url: '/team-helmets/was.png',
      alt: 'Washington Commanders Helmet'
    }
  },
  {
    id: 5,
    name: 'Jets',
    abbreviation: 'NYJ',
    city: 'New York',
    fullName: 'New York Jets',
    conference: 'AFC',
    division: 'East',
    colors: {
      primary: '#0C371D',
      secondary: '#FFFFFF',
      accent: '#000000',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/nyj.png',
      alt: 'New York Jets Logo'
    },
    helmet: {
      url: '/team-helmets/nyj.png',
      alt: 'New York Jets Helmet'
    }
  },
  {
    id: 6,
    name: 'Bills',
    abbreviation: 'BUF',
    city: 'Buffalo',
    fullName: 'Buffalo Bills',
    conference: 'AFC',
    division: 'East',
    colors: {
      primary: '#00338D',
      secondary: '#C60C30',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/buf.png',
      alt: 'Buffalo Bills Logo'
    },
    helmet: {
      url: '/team-helmets/buf.png',
      alt: 'Buffalo Bills Helmet'
    }
  },
  {
    id: 7,
    name: 'Patriots',
    abbreviation: 'NE',
    city: 'New England',
    fullName: 'New England Patriots',
    conference: 'AFC',
    division: 'East',
    colors: {
      primary: '#002244',
      secondary: '#C60C30',
      accent: '#B0B7BC',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/ne.png',
      alt: 'New England Patriots Logo'
    },
    helmet: {
      url: '/team-helmets/ne.png',
      alt: 'New England Patriots Helmet'
    }
  },
  {
    id: 8,
    name: 'Dolphins',
    abbreviation: 'MIA',
    city: 'Miami',
    fullName: 'Miami Dolphins',
    conference: 'AFC',
    division: 'East',
    colors: {
      primary: '#008E97',
      secondary: '#FC4C02',
      accent: '#005778',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/mia.png',
      alt: 'Miami Dolphins Logo'
    },
    helmet: {
      url: '/team-helmets/mia.png',
      alt: 'Miami Dolphins Helmet'
    }
  },
  {
    id: 9,
    name: 'Ravens',
    abbreviation: 'BAL',
    city: 'Baltimore',
    fullName: 'Baltimore Ravens',
    conference: 'AFC',
    division: 'North',
    colors: {
      primary: '#241773',
      secondary: '#000000',
      accent: '#9E7C0C',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/bal.png',
      alt: 'Baltimore Ravens Logo'
    },
    helmet: {
      url: '/team-helmets/bal.png',
      alt: 'Baltimore Ravens Helmet'
    }
  },
  {
    id: 10,
    name: 'Bengals',
    abbreviation: 'CIN',
    city: 'Cincinnati',
    fullName: 'Cincinnati Bengals',
    conference: 'AFC',
    division: 'North',
    colors: {
      primary: '#FB4F14',
      secondary: '#000000',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/cin.png',
      alt: 'Cincinnati Bengals Logo'
    },
    helmet: {
      url: '/team-helmets/cin.png',
      alt: 'Cincinnati Bengals Helmet'
    }
  },
  {
    id: 11,
    name: 'Browns',
    abbreviation: 'CLE',
    city: 'Cleveland',
    fullName: 'Cleveland Browns',
    conference: 'AFC',
    division: 'North',
    colors: {
      primary: '#311D00',
      secondary: '#FF3C00',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/cle.png',
      alt: 'Cleveland Browns Logo'
    },
    helmet: {
      url: '/team-helmets/cle.png',
      alt: 'Cleveland Browns Helmet'
    }
  },
  {
    id: 12,
    name: 'Steelers',
    abbreviation: 'PIT',
    city: 'Pittsburgh',
    fullName: 'Pittsburgh Steelers',
    conference: 'AFC',
    division: 'North',
    colors: {
      primary: '#000000',
      secondary: '#FFB612',
      accent: '#C60C30',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/pit.png',
      alt: 'Pittsburgh Steelers Logo'
    },
    helmet: {
      url: '/team-helmets/pit.png',
      alt: 'Pittsburgh Steelers Helmet'
    }
  },
  {
    id: 13,
    name: 'Texans',
    abbreviation: 'HOU',
    city: 'Houston',
    fullName: 'Houston Texans',
    conference: 'AFC',
    division: 'South',
    colors: {
      primary: '#03202F',
      secondary: '#A71930',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/hou.png',
      alt: 'Houston Texans Logo'
    },
    helmet: {
      url: '/team-helmets/hou.png',
      alt: 'Houston Texans Helmet'
    }
  },
  {
    id: 14,
    name: 'Colts',
    abbreviation: 'IND',
    city: 'Indianapolis',
    fullName: 'Indianapolis Colts',
    conference: 'AFC',
    division: 'South',
    colors: {
      primary: '#002C5F',
      secondary: '#A2AAAD',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/ind.png',
      alt: 'Indianapolis Colts Logo'
    },
    helmet: {
      url: '/team-helmets/ind.png',
      alt: 'Indianapolis Colts Helmet'
    }
  },
  {
    id: 15,
    name: 'Jaguars',
    abbreviation: 'JAX',
    city: 'Jacksonville',
    fullName: 'Jacksonville Jaguars',
    conference: 'AFC',
    division: 'South',
    colors: {
      primary: '#006778',
      secondary: '#9F792C',
      accent: '#D7A22A',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/jax.png',
      alt: 'Jacksonville Jaguars Logo'
    },
    helmet: {
      url: '/team-helmets/jax.png',
      alt: 'Jacksonville Jaguars Helmet'
    }
  },
  {
    id: 16,
    name: 'Titans',
    abbreviation: 'TEN',
    city: 'Tennessee',
    fullName: 'Tennessee Titans',
    conference: 'AFC',
    division: 'South',
    colors: {
      primary: '#0C2340',
      secondary: '#4B92DB',
      accent: '#C8102E',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/ten.png',
      alt: 'Tennessee Titans Logo'
    },
    helmet: {
      url: '/team-helmets/ten.png',
      alt: 'Tennessee Titans Helmet'
    }
  },
  {
    id: 17,
    name: 'Broncos',
    abbreviation: 'DEN',
    city: 'Denver',
    fullName: 'Denver Broncos',
    conference: 'AFC',
    division: 'West',
    colors: {
      primary: '#FB4F14',
      secondary: '#002244',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/den.png',
      alt: 'Denver Broncos Logo'
    },
    helmet: {
      url: '/team-helmets/den.png',
      alt: 'Denver Broncos Helmet'
    }
  },
  {
    id: 18,
    name: 'Chiefs',
    abbreviation: 'KC',
    city: 'Kansas City',
    fullName: 'Kansas City Chiefs',
    conference: 'AFC',
    division: 'West',
    colors: {
      primary: '#E31837',
      secondary: '#FFB81C',
      accent: '#000000',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/kc.png',
      alt: 'Kansas City Chiefs Logo'
    },
    helmet: {
      url: '/team-helmets/kc.png',
      alt: 'Kansas City Chiefs Helmet'
    }
  },
  {
    id: 19,
    name: 'Raiders',
    abbreviation: 'LV',
    city: 'Las Vegas',
    fullName: 'Las Vegas Raiders',
    conference: 'AFC',
    division: 'West',
    colors: {
      primary: '#000000',
      secondary: '#A5ACAF',
      accent: '#C4C9CC',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/lv.png',
      alt: 'Las Vegas Raiders Logo'
    },
    helmet: {
      url: '/team-helmets/lv.png',
      alt: 'Las Vegas Raiders Helmet'
    }
  },
  {
    id: 20,
    name: 'Chargers',
    abbreviation: 'LAC',
    city: 'Los Angeles',
    fullName: 'Los Angeles Chargers',
    conference: 'AFC',
    division: 'West',
    colors: {
      primary: '#002A5E',
      secondary: '#FFC20E',
      accent: '#0080C6',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/lac.png',
      alt: 'Los Angeles Chargers Logo'
    },
    helmet: {
      url: '/team-helmets/lac.png',
      alt: 'Los Angeles Chargers Helmet'
    }
  },
  {
    id: 21,
    name: 'Cardinals',
    abbreviation: 'ARI',
    city: 'Arizona',
    fullName: 'Arizona Cardinals',
    conference: 'NFC',
    division: 'West',
    colors: {
      primary: '#97233F',
      secondary: '#000000',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/ari.png',
      alt: 'Arizona Cardinals Logo'
    },
    helmet: {
      url: '/team-helmets/ari.png',
      alt: 'Arizona Cardinals Helmet'
    }
  },
  {
    id: 22,
    name: 'Rams',
    abbreviation: 'LAR',
    city: 'Los Angeles',
    fullName: 'Los Angeles Rams',
    conference: 'NFC',
    division: 'West',
    colors: {
      primary: '#003594',
      secondary: '#FFA300',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/lar.png',
      alt: 'Los Angeles Rams Logo'
    },
    helmet: {
      url: '/team-helmets/lar.png',
      alt: 'Los Angeles Rams Helmet'
    }
  },
  {
    id: 23,
    name: '49ers',
    abbreviation: 'SF',
    city: 'San Francisco',
    fullName: 'San Francisco 49ers',
    conference: 'NFC',
    division: 'West',
    colors: {
      primary: '#AA0000',
      secondary: '#B3995D',
      accent: '#000000',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/sf.png',
      alt: 'San Francisco 49ers Logo'
    },
    helmet: {
      url: '/team-helmets/sf.png',
      alt: 'San Francisco 49ers Helmet'
    }
  },
  {
    id: 24,
    name: 'Seahawks',
    abbreviation: 'SEA',
    city: 'Seattle',
    fullName: 'Seattle Seahawks',
    conference: 'NFC',
    division: 'West',
    colors: {
      primary: '#002244',
      secondary: '#69BE28',
      accent: '#A5ACAF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/sea.png',
      alt: 'Seattle Seahawks Logo'
    },
    helmet: {
      url: '/team-helmets/sea.png',
      alt: 'Seattle Seahawks Helmet'
    }
  },
  {
    id: 25,
    name: 'Falcons',
    abbreviation: 'ATL',
    city: 'Atlanta',
    fullName: 'Atlanta Falcons',
    conference: 'NFC',
    division: 'South',
    colors: {
      primary: '#A71930',
      secondary: '#000000',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/atl.png',
      alt: 'Atlanta Falcons Logo'
    },
    helmet: {
      url: '/team-helmets/atl.png',
      alt: 'Atlanta Falcons Helmet'
    }
  },
  {
    id: 26,
    name: 'Panthers',
    abbreviation: 'CAR',
    city: 'Carolina',
    fullName: 'Carolina Panthers',
    conference: 'NFC',
    division: 'South',
    colors: {
      primary: '#0085CA',
      secondary: '#101820',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/car.png',
      alt: 'Carolina Panthers Logo'
    },
    helmet: {
      url: '/team-helmets/car.png',
      alt: 'Carolina Panthers Helmet'
    }
  },
  {
    id: 27,
    name: 'Saints',
    abbreviation: 'NO',
    city: 'New Orleans',
    fullName: 'New Orleans Saints',
    conference: 'NFC',
    division: 'South',
    colors: {
      primary: '#D3BC8D',
      secondary: '#000000',
      accent: '#FFFFFF',
      text: '#000000'
    },
    logo: {
      url: '/team-logos/no.png',
      alt: 'New Orleans Saints Logo'
    },
    helmet: {
      url: '/team-helmets/no.png',
      alt: 'New Orleans Saints Helmet'
    }
  },
  {
    id: 28,
    name: 'Buccaneers',
    abbreviation: 'TB',
    city: 'Tampa Bay',
    fullName: 'Tampa Bay Buccaneers',
    conference: 'NFC',
    division: 'South',
    colors: {
      primary: '#D50A0A',
      secondary: '#FF7900',
      accent: '#0A0A08',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/tb.png',
      alt: 'Tampa Bay Buccaneers Logo'
    },
    helmet: {
      url: '/team-helmets/tb.png',
      alt: 'Tampa Bay Buccaneers Helmet'
    }
  },
  {
    id: 29,
    name: 'Bears',
    abbreviation: 'CHI',
    city: 'Chicago',
    fullName: 'Chicago Bears',
    conference: 'NFC',
    division: 'North',
    colors: {
      primary: '#0B162A',
      secondary: '#C83803',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/chi.png',
      alt: 'Chicago Bears Logo'
    },
    helmet: {
      url: '/team-helmets/chi.png',
      alt: 'Chicago Bears Helmet'
    }
  },
  {
    id: 30,
    name: 'Lions',
    abbreviation: 'DET',
    city: 'Detroit',
    fullName: 'Detroit Lions',
    conference: 'NFC',
    division: 'North',
    colors: {
      primary: '#0076B6',
      secondary: '#B0B7BC',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/det.png',
      alt: 'Detroit Lions Logo'
    },
    helmet: {
      url: '/team-helmets/det.png',
      alt: 'Detroit Lions Helmet'
    }
  },
  {
    id: 31,
    name: 'Packers',
    abbreviation: 'GB',
    city: 'Green Bay',
    fullName: 'Green Bay Packers',
    conference: 'NFC',
    division: 'North',
    colors: {
      primary: '#203731',
      secondary: '#FFB612',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/gb.png',
      alt: 'Green Bay Packers Logo'
    },
    helmet: {
      url: '/team-helmets/gb.png',
      alt: 'Green Bay Packers Helmet'
    }
  },
  {
    id: 32,
    name: 'Vikings',
    abbreviation: 'MIN',
    city: 'Minnesota',
    fullName: 'Minnesota Vikings',
    conference: 'NFC',
    division: 'North',
    colors: {
      primary: '#4F2683',
      secondary: '#FFC62F',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logo: {
      url: '/team-logos/min.png',
      alt: 'Minnesota Vikings Logo'
    },
    helmet: {
      url: '/team-helmets/min.png',
      alt: 'Minnesota Vikings Helmet'
    }
  }
]

// Utility functions for team lookup
export function getTeamById(id: number): TeamConfig | undefined {
  return NFL_TEAMS.find(team => team.id === id)
}

export function getTeamByName(name: string): TeamConfig | undefined {
  return NFL_TEAMS.find(team => 
    team.name.toLowerCase() === name.toLowerCase() ||
    team.fullName.toLowerCase() === name.toLowerCase() ||
    team.city.toLowerCase() === name.toLowerCase()
  )
}

export function getTeamByAbbreviation(abbr: string): TeamConfig | undefined {
  return NFL_TEAMS.find(team => team.abbreviation.toLowerCase() === abbr.toLowerCase())
}

export function getTeamByPartialName(partialName: string): TeamConfig | undefined {
  const searchTerm = partialName.toLowerCase()
  return NFL_TEAMS.find(team => 
    team.name.toLowerCase().includes(searchTerm) ||
    team.fullName.toLowerCase().includes(searchTerm) ||
    team.city.toLowerCase().includes(searchTerm) ||
    team.abbreviation.toLowerCase().includes(searchTerm)
  )
}

// Get all teams by conference
export function getTeamsByConference(conference: string): TeamConfig[] {
  return NFL_TEAMS.filter(team => team.conference === conference)
}

// Get all teams by division
export function getTeamsByDivision(division: string): TeamConfig[] {
  return NFL_TEAMS.filter(team => team.division === division)
}

// Get team colors as CSS variables
export function getTeamColors(teamId: number): string {
  const team = getTeamById(teamId)
  if (!team) return ''
  
  return `
    --team-primary: ${team.colors.primary};
    --team-secondary: ${team.colors.secondary};
    --team-accent: ${team.colors.accent};
    --team-text: ${team.colors.text};
  `
}

// Get team background gradient
export function getTeamGradient(teamId: number): string {
  const team = getTeamById(teamId)
  if (!team) return 'linear-gradient(135deg, #374151 0%, #1F2937 100%)'
  
  return `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)`
}

// Get team border color
export function getTeamBorderColor(teamId: number): string {
  const team = getTeamById(teamId)
  if (!team) return '#374151'
  
  return team.colors.accent
}

// Get team text color
export function getTeamTextColor(teamId: number): string {
  const team = getTeamById(teamId)
  if (!team) return '#FFFFFF'
  
  return team.colors.text
} 