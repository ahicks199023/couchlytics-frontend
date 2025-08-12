// lib/config.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.couchlytics.com';

// Add authentication helper
export const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

// Add authenticated fetch helper
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const config = {
    credentials: 'include' as const,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  console.log(`[Auth] Making request to: ${url}`);
  console.log(`[Auth] Request config:`, config);

  try {
    const response = await fetch(url, config);
    console.log(`[Auth] Response status: ${response.status}`);
    
    if (response.status === 401) {
      console.error('[Auth] Unauthorized - user not authenticated');
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return response;
  } catch (error) {
    console.error('[Auth] Request failed:', error);
    throw error;
  }
};
