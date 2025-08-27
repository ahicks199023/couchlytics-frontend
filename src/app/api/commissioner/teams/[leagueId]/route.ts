import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const { leagueId } = params;
    
    console.log('🔍 API Route: Fetching teams for league:', leagueId);
    
    const response = await fetch(
      `https://couchlytics-backend-1-production.up.railway.app/leagues/${leagueId}/commissioner/teams`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('🔍 Backend responded with status:', response.status);
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 API Route: Successfully fetched teams from backend');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔍 API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams from backend' },
      { status: 500 }
    );
  }
}
