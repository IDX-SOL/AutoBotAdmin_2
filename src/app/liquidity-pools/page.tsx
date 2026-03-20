'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiquidityPoolsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/liquidity-pools');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Redirecting to liquidity pools...</p>
      </div>
    </div>
  );
}

