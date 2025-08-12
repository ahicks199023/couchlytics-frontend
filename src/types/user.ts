// User roles and permissions for Couchlytics
export enum UserRole {
  USER = 'user',
  COMMISSIONER = 'commissioner', 
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // League permissions
  VIEW_LEAGUE = 'view_league',
  EDIT_LEAGUE = 'edit_league',
  DELETE_LEAGUE = 'delete_league',
  
  // Team permissions
  VIEW_TEAMS = 'view_teams',
  EDIT_TEAMS = 'edit_teams',
  ASSIGN_TEAMS = 'assign_teams',
  
  // Player permissions
  VIEW_PLAYERS = 'view_players',
  EDIT_PLAYERS = 'edit_players',
  IMPORT_PLAYERS = 'import_players',
  
  // Trade permissions
  VIEW_TRADES = 'view_trades',
  CREATE_TRADES = 'create_trades',
  APPROVE_TRADES = 'approve_trades',
  VETO_TRADES = 'veto_trades',
  
  // Analytics permissions
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  VIEW_LOGS = 'view_logs',
  SYSTEM_SETTINGS = 'system_settings'
}

export enum AuthProvider {
  GOOGLE = 'google',
  DISCORD = 'discord',
  EMAIL = 'email' // For legacy support
}

export interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  name?: string // Full name from OAuth providers
  role: UserRole
  permissions: Permission[]
  isPremium: boolean
  isActive: boolean
  teamId?: number
  teamName?: string
  leagueId?: string
  leagueName?: string
  createdAt: string
  lastLoginAt?: string
  avatar?: string
  // OAuth-specific fields
  authProvider?: AuthProvider
  providerId?: string // ID from OAuth provider
  providerData?: {
    picture?: string
    locale?: string
    verified?: boolean
  }
  // Backend extensions
  isAdmin?: boolean
  memberships?: Array<{
    leagueId: string
    name?: string
    teamId?: number
    role?: UserRole
  }>
}

export interface UserProfile extends User {
  phone?: string
  timezone?: string
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    notifications: {
      email: boolean
      push: boolean
      tradeAlerts: boolean
      leagueUpdates: boolean
    }
  }
}

export interface LeagueMember {
  userId: number
  leagueId: string
  role: UserRole
  teamId?: number
  joinedAt: string
  isActive: boolean
} 
