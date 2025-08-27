import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  try {
    console.log('🔍 API Route: Fetching settings for league:', leagueId);
    
    const response = await fetch(
      `https://couchlytics-backend-1-production.up.railway.app/leagues/${leagueId}/commissioner/settings`,
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
    console.log('🔍 API Route: Successfully fetched settings from backend');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔍 API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings from backend' },
      { status: 500 }
    );
  }
}
