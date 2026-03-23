'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, {
  LiquidityPoolRecord,
  LiquidityPoolsListResponse,
} from '@/utils/adminApiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
};

const shortenAddress = (value?: string | null, head = 10, tail = 6) => {
  if (!value) return '—';
  if (value.length <= head + tail) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

const formatIntegerString = (value?: string | null) => {
  if (!value) return '—';
  try {
    return BigInt(value).toLocaleString('en-IN');
  } catch {
    return value;
  }
};

export default function LiquidityPoolsPage() {
  const [pools, setPools] = useState<LiquidityPoolRecord[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminApiService.getLiquidityPools({
          page: pageToLoad,
          limit,
        });

        const payload = response.data as LiquidityPoolsListResponse;
        setPools(payload?.data ?? []);
        setTotal(payload?.pagination?.total ?? 0);
        setTotalPages(payload?.pagination?.totalPages ?? 1);
        setPage(payload?.pagination?.page ?? pageToLoad);
      } catch (err) {
        console.error('Failed to load liquidity pools', err);
        setError('Unable to load liquidity pools. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchPools(page);
  }, [fetchPools, page]);

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && page > 1) setPage(page - 1);
    if (direction === 'next' && page < totalPages) setPage(page + 1);
  };

  const headerBadges = useMemo(
    () => [
      { label: `Page size: ${limit}`, variant: 'outline' as const },
      { label: 'Liquidity pool records', variant: 'outline' as const },
    ],
    [limit]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Liquidity Pools</h1>
            <p className="text-gray-400 mt-2">
              View pool preparation / initialization and initial liquidity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {headerBadges.map((b) => (
              <Badge
                key={b.label}
                variant={b.variant}
                className="border-gray-700 text-gray-300 bg-gray-900/20"
              >
                {b.label}
              </Badge>
            ))}

            <button
              type="button"
              onClick={() => fetchPools(page)}
              className="inline-flex items-center space-x-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
              aria-label="Refresh liquidity pools"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/60">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-gray-800/60 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Pool</th>
                  <th className="px-4 py-3 text-left font-semibold">Base</th>
                  <th className="px-4 py-3 text-left font-semibold">Quote</th>
                  <th className="px-4 py-3 text-left font-semibold">Creator</th>
                  <th className="px-4 py-3 text-left font-semibold">Init / Fees</th>
                  <th className="px-4 py-3 text-left font-semibold">State</th>
                  <th className="px-4 py-3 text-left font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                      Fetching liquidity pools...
                    </td>
                  </tr>
                ) : pools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      No liquidity pools found.
                    </td>
                  </tr>
                ) : (
                  pools.map((p) => {
                    const quoteLogo = p.metadata?.quoteTokenLogo ?? null;
                    const baseLogo = p.metadata?.baseTokenLogo ?? null;

                    return (
                      <tr key={p.id} className="hover:bg-gray-800/40">
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            {p.poolAddress ? (
                              <a
                                href={`https://solscan.io/address/${p.poolAddress}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-xs text-cyan-400 hover:text-cyan-200 block max-w-[210px] truncate"
                                title={p.poolAddress}
                              >
                                {shortenAddress(p.poolAddress, 12, 8)}
                              </a>
                            ) : (
                              <p className="text-xs text-gray-500">poolAddress: —</p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="border-gray-700 text-gray-300 bg-gray-900/20"
                              >
                                {p.poolType}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-gray-700 text-gray-300 bg-gray-900/20"
                              >
                                SL {p.slippage} bps
                              </Badge>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden">
                              {baseLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={baseLogo} alt="base token logo" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {p.baseTokenSymbol}{' '}
                                <span className="text-gray-500">·</span>{' '}
                                {p.baseTokenName ?? 'Untitled'}
                              </p>
                              <p className="text-xs text-gray-500">{p.baseTokenDecimals} decimals</p>
                              <p className="text-xs text-gray-400 font-mono">Init: {p.initialBaseAmount}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden">
                              {quoteLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={quoteLogo} alt="quote token logo" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {p.quoteTokenSymbol}{' '}
                                <span className="text-gray-500">·</span>{' '}
                                {p.quoteTokenName ?? 'Untitled'}
                              </p>
                              <p className="text-xs text-gray-500">{p.quoteTokenDecimals} decimals</p>
                              <p className="text-xs text-gray-400 font-mono">Init: {p.initialQuoteAmount}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <a
                            href={`https://solscan.io/address/${p.creatorWallet}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs text-cyan-400 hover:text-cyan-200 block max-w-[180px] truncate"
                            title={p.creatorWallet}
                          >
                            {shortenAddress(p.creatorWallet, 10, 6)}
                          </a>

                          {p.userId == null ? (
                            <p className="text-xs text-gray-500 mt-1">userId: —</p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">userId: {p.userId}</p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="border-gray-700 text-gray-300 bg-gray-900/20"
                              >
                                Fee: {p.feeTier}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-gray-700 text-gray-300 bg-gray-900/20"
                              >
                                CreFee: {formatIntegerString(p.creationFee)}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              PriorityFee: {formatIntegerString(p.priorityFee)}
                            </div>
                            {p.initializeTxSignature && (
                              <a
                                href={`https://solscan.io/tx/${p.initializeTxSignature}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-mono text-cyan-400 hover:text-cyan-200 block truncate max-w-[220px]"
                                title={p.initializeTxSignature}
                              >
                                Init Tx: {shortenAddress(p.initializeTxSignature, 14, 6)}
                              </a>
                            )}
                            {p.addLiquidityTxSignature && (
                              <a
                                href={`https://solscan.io/tx/${p.addLiquidityTxSignature}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-mono text-cyan-400 hover:text-cyan-200 block truncate max-w-[220px]"
                                title={p.addLiquidityTxSignature}
                              >
                                Add Tx: {shortenAddress(p.addLiquidityTxSignature, 14, 6)}
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <Badge
                              variant="outline"
                              className="border-gray-700 text-gray-300 bg-gray-900/20"
                            >
                              {p.poolState}
                            </Badge>

                            {p.errorMessage ? (
                              <p className="text-xs text-red-300 max-w-[240px] truncate" title={p.errorMessage}>
                                {p.errorMessage}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">No errors</p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-300">
                          {formatDate(p.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
          <p>
            Showing page {page} of {totalPages} · {total.toLocaleString('en-IN')} records
          </p>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('prev')}
              disabled={page === 1}
              className="border-gray-700 text-gray-200 hover:bg-gray-800"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('next')}
              disabled={page === totalPages}
              className="border-gray-700 text-gray-200 hover:bg-gray-800"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

