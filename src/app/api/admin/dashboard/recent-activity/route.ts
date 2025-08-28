import { NextRequest, NextResponse } from 'next/server';
import adminApiService from '@/utils/adminApiService';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching recent activity from backend via admin service...');
    
    const response = await adminApiService.getAxiosInstance().get('/admin-dev/dashboard/recent-activity', {
      headers: {
        // Forward any authorization headers if needed
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
    });

    if (response.status === 200) {
      const data = response.data;
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
  } catch (error: unknown) {
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