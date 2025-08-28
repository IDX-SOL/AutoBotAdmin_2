import { NextResponse } from 'next/server';
import adminApiService from '@/utils/adminApiService';

export async function GET() {
  try {
    console.log('🔄 Fetching tokens list from backend via admin service...');
    
    const response = await adminApiService.getAxiosInstance().get('/admin-dev/tokens/list');

    if (response.status === 200) {
      const data = response.data;
      console.log('✅ Tokens list received from backend:', data);
      return NextResponse.json(data);
    } else {
      console.warn('⚠️ Backend returned error status:', response.status);
      console.warn('Error details:', response.data);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend error', 
          message: 'Failed to fetch tokens list from backend' 
        },
        { status: response.status }
      );
    }
  } catch (error: unknown) {
    console.error('❌ Tokens list API error:', error);
    
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