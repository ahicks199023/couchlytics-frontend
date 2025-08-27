import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  console.log('🚨 API ROUTE CALLED! This should appear in console!');
  
  const { leagueId } = await params;
  try {
    console.log('🔍 API Route: Fetching users for league:', leagueId);
    
    const backendUrl = `https://couchlytics-backend-1-production.up.railway.app/leagues/${leagueId}/commissioner/users`;
    console.log('🔍 API Route: Calling backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 API Route: Backend response status:', response.status);
    console.log('🔍 API Route: Backend response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('🔍 Backend responded with status:', response.status);
      
      // Try to get error details from response
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('🔍 Backend error response:', errorText);
      } catch (e) {
        console.error('🔍 Could not read error response:', e);
      }
      
      throw new Error(`Backend responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 API Route: Successfully fetched data from backend');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔍 API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from backend' },
      { status: 500 }
    );
  }
}
