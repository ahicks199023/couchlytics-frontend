export const handleApiResponse = async (response: Response) => {
  if (response.status === 429) {
    // Rate limit exceeded - show user-friendly message
    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
  }
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};

export const fetchTeamsWithRetry = async (leagueId: string, maxRetries: number = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/teams`);
      return await handleApiResponse(response);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
