import { NextRequest, NextResponse } from 'next/server';

// Force local backend for development
const BACKEND_URL = 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching recent activity from backend...');
    
    const response = await fetch(`${BACKEND_URL}/admin-dev/dashboard/recent-activity`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization headers if needed
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Recent activity fetched successfully:', data);
      return NextResponse.json(data);
    } else {
      console.warn('⚠️ Backend returned error:', response.status, response.statusText);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend error', 
          message: 'Failed to fetch recent activity from backend' 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching recent activity:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Network error', 
        message: 'Failed to connect to backend service' 
      },
      { status: 500 }
    );
  }
} 