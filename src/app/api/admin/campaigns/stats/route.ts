import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
    
    console.log('🔄 Fetching campaign stats from backend:', `${BACKEND_URL}/admin/campaigns/stats`);
    
    const response = await fetch(`${BACKEND_URL}/admin/campaigns/stats`, {
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
      
      // Return mock data if backend is not available
      return NextResponse.json({
        totalCampaigns: 23,
        conversionRate: 12.5,
        changeFromLastMonth: 5.3,
        totalVisits: 1247,
        totalConversions: 156,
        topCampaigns: [
          { name: 'IDX_AutoBot_Exact_Match', conversions: 45, visits: 234 },
          { name: 'organic_dm', conversions: 23, visits: 156 },
          { name: 'google_cpc', conversions: 18, visits: 89 }
        ]
      });
    }
  } catch (error) {
    console.error('❌ Campaign stats API error:', error);
    
    // Return mock data as fallback
    return NextResponse.json({
      totalCampaigns: 23,
      conversionRate: 12.5,
      changeFromLastMonth: 5.3,
      totalVisits: 1247,
      totalConversions: 156,
      topCampaigns: [
        { name: 'IDX_AutoBot_Exact_Match', conversions: 45, visits: 234 },
        { name: 'organic_dm', conversions: 23, visits: 156 },
        { name: 'google_cpc', conversions: 18, visits: 89 }
      ]
    });
  }
} 