'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, {
  LiquidityActionRecord,
  LiquidityActionType,
} from '@/utils/adminApiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabKey =
  | 'ADD_LIQUIDITY'
  | 'REMOVE_LIQUIDITY'
  | 'REVOKE_MINT_AUTHORITY'
  | 'REVOKE_FREEZE_AUTHORITY';

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

const shorten = (value?: string | null, head = 10, tail = 6) => {
  if (!value) return '—';
  if (value.length <= head + tail) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

const parseNumber = (value?: string | number | null) => {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 0;
  return n;
};

const formatNumber = (value?: number | null, maximumFractionDigits = 4) => {
  if (value === null || value === undefined) return '—';
  if (Number.isNaN(value)) return '—';
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits });
};

export default function LiquidityActionRecordsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('ADD_LIQUIDITY');
  const [records, setRecords] = useState<LiquidityActionRecord[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalSol = useMemo(
    () => records.reduce((acc, r) => acc + parseNumber(r.solAmount), 0),
    [records]
  );

  const totalRecharge = totalSol * 0.1;

  const fetchRecords = useCallback(
    async (tab: TabKey, pageToLoad: number) => {
      setLoading(true);
      setError(null);

      try {
        const params = { page: pageToLoad, limit };

        let response;
        switch (tab) {
          case 'ADD_LIQUIDITY':
            response = await adminApiService.getAddLiquidityActionRecords(params);
            break;
          case 'REMOVE_LIQUIDITY':
            response = await adminApiService.getRemoveLiquidityActionRecords(params);
            break;
          case 'REVOKE_MINT_AUTHORITY':
            response = await adminApiService.getRevokeMintAuthorityActionRecords(params);
            break;
          case 'REVOKE_FREEZE_AUTHORITY':
            response = await adminApiService.getRevokeFreezeAuthorityActionRecords(params);
            break;
          default:
            // Should never happen because tab is TabKey
            throw new Error(`Unknown tab: ${tab}`);
        }

        const payload = response.data;
        setRecords(payload?.data ?? []);
        setTotal(payload?.pagination?.total ?? 0);
        setTotalPages(payload?.pagination?.totalPages ?? 1);
        setPage(payload?.pagination?.page ?? pageToLoad);
      } catch (err) {
        console.error('Failed to load liquidity action records', err);
        setError('Unable to load liquidity action records. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchRecords(activeTab, page);
  }, [activeTab, page, fetchRecords]);

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && page > 1) setPage(page - 1);
    if (direction === 'next' && page < totalPages) setPage(page + 1);
  };

  const tabMeta: Array<{
    key: TabKey;
    label: string;
    badge: LiquidityActionType;
  }> = useMemo(
    () => [
      { key: 'ADD_LIQUIDITY', label: 'Add Liquidity', badge: 'ADD_LIQUIDITY' },
      { key: 'REMOVE_LIQUIDITY', label: 'Remove Liquidity', badge: 'REMOVE_LIQUIDITY' },
      {
        key: 'REVOKE_MINT_AUTHORITY',
        label: 'Revoke Mint Authority',
        badge: 'REVOKE_MINT_AUTHORITY',
      },
      {
        key: 'REVOKE_FREEZE_AUTHORITY',
        label: 'Revoke Freeze Authority',
        badge: 'REVOKE_FREEZE_AUTHORITY',
      },
    ],
    []
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Liquidity Action Records</h1>
            <p className="text-gray-400 mt-2">
              Add/remove liquidity and revoke authority actions from the liquidity flow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-gray-700 text-gray-300 bg-gray-900/20"
              title="Computed as 0.1 * total SOL (requires solAmount from API)"
            >
              Total Recharge: {formatNumber(totalRecharge, 4)} SOL eq.
            </Badge>

            <button
              type="button"
              onClick={() => fetchRecords(activeTab, page)}
              className="inline-flex items-center space-x-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
              aria-label="Refresh liquidity action records"
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            const next = v as TabKey;
            setActiveTab(next);
            setPage(1);
          }}
          className="space-y-6"
        >
          <TabsList className="bg-gray-800/50 border-gray-700">
            {tabMeta.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabMeta.map((t) => (
            <TabsContent key={t.key} value={t.key} className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/60">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-gray-800/60 text-gray-400">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">ID</th>
                        <th className="px-4 py-3 text-left font-semibold">User</th>
                        <th className="px-4 py-3 text-left font-semibold">Action</th>
                        <th className="px-4 py-3 text-left font-semibold">Pair</th>
                        <th className="px-4 py-3 text-left font-semibold">Token Mint</th>
                        <th className="px-4 py-3 text-left font-semibold">Signature</th>
                        <th className="px-4 py-3 text-left font-semibold">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                            Fetching records...
                          </td>
                        </tr>
                      ) : records.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                            No records found for this action.
                          </td>
                        </tr>
                      ) : (
                        records.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-800/40">
                            <td className="px-4 py-4 font-mono text-gray-200">{r.id}</td>
                            <td className="px-4 py-4">
                              {r.userId == null ? (
                                <span className="text-xs text-gray-500">—</span>
                              ) : (
                                <span className="text-xs text-gray-300">{r.userId}</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <Badge
                                variant="outline"
                                className="border-gray-700 text-gray-300 bg-gray-900/20"
                              >
                                {r.actionType}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <a
                                href={`https://solscan.io/address/${r.pairAddress}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-xs text-cyan-400 hover:text-cyan-200"
                                title={r.pairAddress}
                              >
                                {shorten(r.pairAddress, 16, 8)}
                              </a>
                            </td>
                            <td className="px-4 py-4">
                              {r.tokenMintAddress ? (
                                <a
                                  href={`https://solscan.io/address/${r.tokenMintAddress}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-xs text-cyan-400 hover:text-cyan-200"
                                  title={r.tokenMintAddress}
                                >
                                  {shorten(r.tokenMintAddress, 16, 8)}
                                </a>
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {r.signature ? (
                                <a
                                  href={`https://solscan.io/tx/${r.signature}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-xs text-cyan-400 hover:text-cyan-200 block truncate max-w-[220px]"
                                  title={r.signature}
                                >
                                  {shorten(r.signature, 14, 6)}
                                </a>
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-300">
                              {formatDate(r.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
                <p>
                  Showing page {page} of {totalPages} · {total.toLocaleString('en-IN')} records
                </p>
                <div className="space-x-2">
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
                    className="border-gray-700 text-gray-200 hover:bg-gray-800 ml-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}

