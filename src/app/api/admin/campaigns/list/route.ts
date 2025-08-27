import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Force local backend for development
    const BACKEND_URL = 'http://localhost:3000';
    
    console.log('🔄 Fetching campaigns list from backend:', `${BACKEND_URL}/admin-dev/campaigns/list`);
    
    const response = await fetch(`${BACKEND_URL}/admin-dev/campaigns/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Campaigns list received from backend:', data);
      return NextResponse.json(data);
    } else {
      console.warn('⚠️ Backend returned error status:', response.status);
      const errorData = await response.text();
      console.warn('Error details:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend error', 
          message: 'Failed to fetch campaigns list from backend' 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Campaigns list API error:', error);
    
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