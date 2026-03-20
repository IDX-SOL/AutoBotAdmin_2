'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, { TokenCreationRecord, TokenCreationsListResponse } from '@/utils/adminApiService';
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

const formatBigIntString = (value?: string | null) => {
  if (!value) return '—';
  try {
    return BigInt(value).toLocaleString('en-IN');
  } catch {
    return value;
  }
};

const shortenAddress = (value?: string | null, head = 10, tail = 6) => {
  if (!value) return '—';
  if (value.length <= head + tail) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

export default function CreateTokenPage() {
  const [creations, setCreations] = useState<TokenCreationRecord[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreations = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminApiService.getTokenCreations({
          page: pageToLoad,
          limit,
        });

        const payload = response.data as TokenCreationsListResponse;
        setCreations(payload?.data ?? []);
        setTotal(payload?.pagination?.total ?? 0);
        setTotalPages(payload?.pagination?.totalPages ?? 1);
        setPage(payload?.pagination?.page ?? pageToLoad);
      } catch (err) {
        console.error('Failed to load token creations', err);
        setError('Unable to load token creations. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchCreations(page);
  }, [fetchCreations, page]);

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && page > 1) setPage(page - 1);
    if (direction === 'next' && page < totalPages) setPage(page + 1);
  };

  const headerBadges = useMemo(
    () => [
      { label: `Page size: ${limit}`, variant: 'outline' as const },
      { label: 'Solana token creation records', variant: 'outline' as const },
    ],
    [limit]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Token Creations</h1>
            <p className="text-gray-400 mt-2">All tokens created via the token creation flow.</p>
          </div>

          <div className="flex items-center gap-3">
            {headerBadges.map((b) => (
              <Badge key={b.label} variant={b.variant} className="border-gray-700 text-gray-300 bg-gray-900/20">
                {b.label}
              </Badge>
            ))}

            <button
              type="button"
              onClick={() => fetchCreations(page)}
              className="inline-flex items-center space-x-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
              aria-label="Refresh token creations"
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
                  <th className="px-4 py-3 text-left font-semibold">Token</th>
                  <th className="px-4 py-3 text-left font-semibold">Mint</th>
                  <th className="px-4 py-3 text-left font-semibold">Creator</th>
                  <th className="px-4 py-3 text-left font-semibold">Decimals / Supply</th>
                  <th className="px-4 py-3 text-left font-semibold">Metadata</th>
                  <th className="px-4 py-3 text-left font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                      Fetching token creation records...
                    </td>
                  </tr>
                ) : creations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No token creation records found.
                    </td>
                  </tr>
                ) : (
                  creations.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                            {c.tokenSymbol?.slice(0, 2) || 'TK'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {c.tokenSymbol} <span className="text-gray-500">·</span> {c.tokenName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Payer: <span className="font-mono">{shortenAddress(c.payerPublicKey, 8, 6)}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <a
                          href={`https://solscan.io/address/${c.mintAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-cyan-400 hover:text-cyan-200"
                        >
                          {shortenAddress(c.mintAddress, 10, 6)}
                        </a>
                      </td>

                      <td className="px-4 py-4">
                        <a
                          href={`https://solscan.io/address/${c.creatorAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-cyan-400 hover:text-cyan-200"
                        >
                          {shortenAddress(c.creatorAddress, 10, 6)}
                        </a>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">
                          {c.decimals} decimals
                        </p>
                        <p className="text-xs text-gray-500">
                          Supply: {formatBigIntString(c.initialSupply)}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          {c.imageUri ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.imageUri}
                              alt={`${c.tokenSymbol} token image`}
                              className="h-12 w-12 rounded-lg object-cover bg-gray-800"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                              —
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className={`border-gray-700 text-gray-300 ${
                                  c.metadataIncluded ? 'bg-gray-900/20' : 'opacity-60'
                                }`}
                              >
                                {c.metadataIncluded ? 'Metadata included' : 'No metadata'}
                              </Badge>
                              {c.immutableMetadata && (
                                <Badge variant="outline" className="border-gray-700 text-gray-300 bg-gray-900/20">
                                  Immutable
                                </Badge>
                              )}
                            </div>

                            {c.metadataUri ? (
                              <a
                                href={c.metadataUri}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-mono text-cyan-400 hover:text-cyan-200 block max-w-[220px] truncate"
                                title={c.metadataUri}
                              >
                                {shortenAddress(c.metadataUri, 24, 18)}
                              </a>
                            ) : (
                              <p className="text-xs text-gray-500">metadataUri: —</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-300">
                        {formatDate(c.createdAt)}
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

