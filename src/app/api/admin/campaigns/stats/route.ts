import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use environment variable for backend URL, fallback to localhost for development
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
    
    console.log('🔄 Fetching campaign stats from backend:', `${BACKEND_URL}/admin-dev/campaigns/stats`);
    
    const response = await fetch(`${BACKEND_URL}/admin-dev/campaigns/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers here if needed
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Campaign stats received from backend:', data);
      return NextResponse.json(data);
    } else {
      console.warn('⚠️ Backend returned error status:', response.status);
      const errorData = await response.text();
      console.warn('Error details:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend error', 
          message: 'Failed to fetch campaign stats from backend' 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Campaign stats API error:', error);
    
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