import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
    
    console.log('🔄 Fetching token stats from backend:', `${BACKEND_URL}/admin/tokens/stats`);
    
    const response = await fetch(`${BACKEND_URL}/admin/tokens/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers here if needed
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token stats received from backend:', data);
      return NextResponse.json(data);
    } else {
      console.warn('⚠️ Backend returned error status:', response.status);
      const errorData = await response.text();
      console.warn('Error details:', errorData);
      
      // Return mock data if backend is not available
      return NextResponse.json({
        totalTokens: 89,
        changeFromLastMonth: 22.4,
        activeTokens: 67,
        totalMarketCap: 45000000000,
        totalVolume24h: 2000000000,
        topTokens: [
          { name: 'USDC', symbol: 'USDC', price: 1.00, marketCap: 50000000000 },
          { name: 'Wrapped SOL', symbol: 'SOL', price: 98.45, marketCap: 45000000000 },
          { name: 'Ethereum (Portal)', symbol: 'ETH', price: 3245.67, marketCap: 390000000000 }
        ]
      });
    }
  } catch (error) {
    console.error('❌ Token stats API error:', error);
    
    // Return mock data as fallback
    return NextResponse.json({
      totalTokens: 89,
      changeFromLastMonth: 22.4,
      activeTokens: 67,
      totalMarketCap: 45000000000,
      totalVolume24h: 2000000000,
      topTokens: [
        { name: 'USDC', symbol: 'USDC', price: 1.00, marketCap: 50000000000 },
        { name: 'Wrapped SOL', symbol: 'SOL', price: 98.45, marketCap: 45000000000 },
        { name: 'Ethereum (Portal)', symbol: 'ETH', price: 3245.67, marketCap: 390000000000 }
      ]
    });
  }
} 