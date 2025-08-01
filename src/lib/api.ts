// lib/api.ts
import { API_BASE } from './config'

// Type for objects that can be converted between snake_case and camelCase
type ConvertibleObject = Record<string, unknown>;

// Convert snake_case to camelCase
const toCamelCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  const camelCaseObj: ConvertibleObject = {};
  for (const key in obj as ConvertibleObject) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelCaseObj[camelKey] = toCamelCase((obj as ConvertibleObject)[key]);
    }
  }
  return camelCaseObj;
};

// Convert camelCase to snake_case
const toSnakeCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  const snakeCaseObj: ConvertibleObject = {};
  for (const key in obj as ConvertibleObject) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeCaseObj[snakeKey] = toSnakeCase((obj as ConvertibleObject)[key]);
    }
  }
  return snakeCaseObj;
};

// All fetch requests to api.couchlytics.com will always send credentials (cookies) for authentication.
// This is enforced in fetchFromApi by setting credentials: 'include' for every request.

export const fetchFromApi = async (path: string, options: RequestInit = {}): Promise<unknown> => {
  // Always include credentials for authentication (cookies)
  const mergedOptions: RequestInit = { ...options, credentials: 'include' as RequestCredentials };
  const res = await fetch(`${API_BASE}${path}`, mergedOptions);
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }
  
  const data = await res.json();
  const camelData = toCamelCase(data);
  // Debug log to check camelCase conversion
  console.log('API response (camelCase):', camelData);
  return camelData; // Convert response to camelCase
};

// Enhanced API functions with automatic case conversion
export const api = {
  get: async (path: string): Promise<unknown> => {
    return fetchFromApi(path);
  },

  post: async (path: string, body: ConvertibleObject): Promise<unknown> => {
    const snakeCaseBody = toSnakeCase(body); // Convert request body to snake_case
    return fetchFromApi(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snakeCaseBody),
    });
  },

  put: async (path: string, body: ConvertibleObject): Promise<unknown> => {
    const snakeCaseBody = toSnakeCase(body);
    return fetchFromApi(path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snakeCaseBody),
    });
  },

  delete: async (path: string): Promise<unknown> => {
    return fetchFromApi(path, {
      method: 'DELETE',
    });
  },

  patch: async (path: string, body: ConvertibleObject): Promise<unknown> => {
    const snakeCaseBody = toSnakeCase(body);
    return fetchFromApi(path, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snakeCaseBody),
    });
  }
};

// Commissioner's Hub API functions
interface CommissionerLeague {
  league_id: string
  name: string
  role: string
}

interface CommissionerLeaguesResponse {
  leagues: CommissionerLeague[]
}

export const checkCommissionerAccess = async (userId: number, leagueId: string) => {
  try {
    const response = await fetch(`${API_BASE}/commissioner/my-leagues?user_id=${userId}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      return false
    }
    
    const data: CommissionerLeaguesResponse = await response.json()
    return data.leagues.some((league: CommissionerLeague) => league.league_id === leagueId)
  } catch (error) {
    console.error('Error checking commissioner access:', error)
    return false
  }
}

export const getCommissionerLeagues = async (userId: number) => {
  try {
    const response = await fetch(`${API_BASE}/commissioner/my-leagues?user_id=${userId}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch commissioner leagues: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching commissioner leagues:', error)
    throw error
  }
}

export const getLeagueSettings = async (userId: number, leagueId: string) => {
  try {
    const response = await fetch(`${API_BASE}/commissioner/league/${leagueId}/settings?user_id=${userId}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch league settings: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching league settings:', error)
    throw error
  }
}

interface LeagueSettings {
  name?: string
  description?: string
  image_url?: string
  invite_code?: string
  setup_completed?: boolean
}

export const updateLeagueSettings = async (userId: number, leagueId: string, settings: LeagueSettings) => {
  try {
    const response = await fetch(`${API_BASE}/commissioner/league/${leagueId}/update?user_id=${userId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update league settings: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating league settings:', error)
    throw error
  }
}

export const generateInviteLink = async (userId: number, leagueId: string) => {
  try {
    const response = await fetch(`${API_BASE}/commissioner/league/${leagueId}/invite?user_id=${userId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to generate invite link: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error generating invite link:', error)
    throw error
  }
}

export const assignTeamToUser = async (userId: number, leagueId: string, teamId: number, userEmail: string) => {
  try {
    const response = await fetch(`${API_BASE}/commissioner/league/${leagueId}/assign-team?user_id=${userId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ team_id: teamId, user_email: userEmail })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to assign team: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error assigning team:', error)
    throw error
  }
}

export const removeUserFromLeague = async (userId: number, leagueId: string, userEmail: string) => {
  try {
    const response = await fetch(`${API_BASE}/commissioner/league/${leagueId}/remove-user?user_id=${userId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_email: userEmail })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to remove user: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error removing user:', error)
    throw error
  }
}

export const getCompanionAppInfo = async (userId: number, leagueId: string) => {
  try {
    const response = await fetch(`${API_BASE}/commissioner/league/${leagueId}/companion-app?user_id=${userId}`, {
      credentials: 'include'
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch companion app info: ${response.status}`)
    }
    const data = await response.json()
    
    // The backend now returns:
    // {
    //   "companion_app_url": "https://api.couchlytics.com/companion/ingest",
    //   "ingestion_endpoint": "/companion/ingest",
    //   "league_id": "12335716",
    //   "league_name": "League Name",
    //   "setup_instructions": { "step1": "...", "step2": "...", "step3": "..." }
    // }
    
    return data
  } catch (error) {
    console.error('Error fetching companion app info:', error)
    throw error
  }
}

export const getLeagueUsers = async (leagueId: string) => {
  try {
    const response = await fetch(`${API_BASE}/leagues/${leagueId}/users`, {
      credentials: 'include'
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch league users: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching league users:', error)
    throw error
  }
}

// Example usage:
// api.get('/leagues/12345').then(data => console.log(data));
// This will send credentials (cookies) for authentication in both development and production.
