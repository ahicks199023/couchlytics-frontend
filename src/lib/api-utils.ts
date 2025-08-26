// lib/api-utils.ts
import { API_BASE } from './config'

// Global fetch configuration with credentials
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  // Ensure headers are properly merged
  if (options.headers) {
    finalOptions.headers = { ...defaultOptions.headers, ...options.headers }
  }
  
  console.log(`🌐 API Request: ${url}`, finalOptions)
  
  try {
    const response = await fetch(url, finalOptions)
    console.log(`🌐 API Response: ${url} - Status: ${response.status}`)
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Unauthorized - user not authenticated')
        // Don't redirect here, let the calling component handle it
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    console.error(`❌ API Request failed: ${url}`, error)
    throw error
  }
}

// Check if user has developer access
export const checkDeveloperAccess = async () => {
  try {
    const response = await apiFetch(`${API_BASE}/auth/user`)
    const userData = await response.json()
    const isDeveloper = userData.isDeveloper || userData.email === 'antoinehickssales@gmail.com' || userData.isAdmin
    console.log('🔍 Developer access check:', { isDeveloper, email: userData.email, isAdmin: userData.isAdmin })
    return isDeveloper
  } catch (error) {
    console.error('❌ Error checking developer access:', error)
    return false
  }
}

// Fetch leagues based on user access level
export const fetchUserLeagues = async () => {
  try {
    // Check if user has developer access
    const isDeveloper = await checkDeveloperAccess()
    
    let endpoint = '/leagues?scope=my'
    if (isDeveloper) {
      endpoint = '/leagues' // Fetch all leagues for developers
      console.log('🔓 Developer access detected - fetching all leagues')
    } else {
      console.log('👤 Regular user - fetching user leagues only')
    }
    
    const response = await apiFetch(`${API_BASE}${endpoint}`)
    const leagues = await response.json()
    console.log('✅ Fetched leagues:', { isDeveloper, count: leagues.leagues?.length || 0, leagues })
    return leagues
  } catch (error) {
    console.error('❌ Error fetching leagues:', error)
    throw error
  }
}

export const fetchLeaderboard = async () => {
  try {
    const response = await apiFetch(`${API_BASE}/leaderboard/top-users?limit=100`)
    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.log('ℹ️ Leaderboard endpoint not available')
      return null // Don't show error, just skip leaderboard
    }
    console.error('❌ Leaderboard fetch error:', error)
    throw error
  }
}

export const checkAuthStatus = async () => {
  try {
    const response = await apiFetch(`${API_BASE}/auth/status`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Auth status check failed:', error)
    throw error
  }
}

export const establishBackendSession = async (firebaseUser: { getIdToken: () => Promise<string>; email: string | null }) => {
  try {
    const idToken = await firebaseUser.getIdToken()
    const response = await apiFetch(`${API_BASE}/auth/firebase-login`, {
      method: 'POST',
      body: JSON.stringify({
        idToken: idToken,
        email: firebaseUser.email
      })
    })
    
    if (response.ok) {
      console.log('✅ Backend session established')
      return true
    } else {
      console.error('❌ Failed to establish backend session')
      return false
    }
  } catch (error) {
    console.error('❌ Error establishing backend session:', error)
    return false
  }
}
