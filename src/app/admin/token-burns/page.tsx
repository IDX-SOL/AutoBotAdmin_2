'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, RefreshCw, Search } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, { TokenBurnRecord, TokenBurnSummary } from '@/utils/adminApiService';
import Image from 'next/image';

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

const formatNumber = (value?: number | null, maximumFractionDigits = 4) => {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en-IN', {
    maximumFractionDigits,
  });
};

export default function TokenBurnsPage() {
  const [records, setRecords] = useState<TokenBurnRecord[]>([]);
  const [summary, setSummary] = useState<TokenBurnSummary>({
    totalBurned: 0,
    totalServiceFees: 0,
    totalNetworkFees: 0,
    uniqueWallets: 0,
    uniqueTokens: 0,
    lastBurnAt: null,
    totalBurns: 0,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    walletAddress: '',
    tokenMint: '',
    startDate: '',
    endDate: '',
  });

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          filters.walletAddress ||
          filters.tokenMint ||
          filters.startDate ||
          filters.endDate
      ),
    [filters]
  );

  const fetchBurns = useCallback(async (pageToLoad: number) => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: pageToLoad,
        limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.walletAddress) params.walletAddress = filters.walletAddress;
      if (filters.tokenMint) params.tokenMint = filters.tokenMint;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await adminApiService.getTokenBurns(params);
      const payload = response.data.data;

      setRecords(payload.burns);
      setSummary(payload.summary);
      setTotal(payload.pagination.total);
      setTotalPages(payload.pagination.totalPages);
      setPage(payload.pagination.page);
    } catch (err) {
      console.error('Failed to load token burns', err);
      setError('Unable to load token burn activity. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, limit]);

  useEffect(() => {
    fetchBurns(page);
  }, [fetchBurns, page]);

  const handleSubmitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    fetchBurns(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      walletAddress: '',
      tokenMint: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
    fetchBurns(1);
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && page > 1) {
      setPage(page - 1);
    }
    if (direction === 'next' && page < totalPages) {
      setPage(page + 1);
    }
  };

  const summaryCards = [
    {
      label: 'Total Burned',
      value: `${formatNumber(summary.totalBurned, 6)} Tokens`,
      subtext: `${summary.uniqueTokens} unique tokens`,
    },
    {
      label: 'Service Fees Collected',
      value: `${formatNumber(summary.totalServiceFees, 4)} SOL`,
      subtext: `${formatNumber(summary.totalNetworkFees, 4)} SOL network fees`,
    },
    {
      label: 'Wallets Participated',
      value: summary.uniqueWallets.toLocaleString('en-IN'),
      subtext: `${summary.totalBurns || total} burns recorded`,
    },
    {
      label: 'Last Burn',
      value: formatDate(summary.lastBurnAt),
      subtext: 'Times in IST',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
              <Flame className="h-7 w-7 text-orange-400" />
              <span>Token Burn Activity</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Track every burn request executed through the public token burn tool.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchBurns(page)}
            className="inline-flex items-center space-x-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-700 bg-gray-800/70 p-4">
              <p className="text-sm text-gray-400">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
              <p className="mt-1 text-xs text-gray-500">{card.subtext}</p>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmitFilters}
          className="rounded-2xl border border-gray-700 bg-gray-800/70 p-4 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="Signature, token, wallet..."
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/60 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Wallet Address</label>
              <input
                type="text"
                value={filters.walletAddress}
                onChange={(e) => setFilters((prev) => ({ ...prev, walletAddress: e.target.value }))}
                placeholder="Owner wallet address"
                className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Token Mint</label>
              <input
                type="text"
                value={filters.tokenMint}
                onChange={(e) => setFilters((prev) => ({ ...prev, tokenMint: e.target.value }))}
                placeholder="Mint address"
                className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Records per page</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {[10, 25, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option} records
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex items-end space-x-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-600 hover:to-blue-700"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasFilters}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
        </form>

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
                  <th className="px-4 py-3 text-left font-semibold">Amount Burned</th>
                  <th className="px-4 py-3 text-left font-semibold">Wallet</th>
                  <th className="px-4 py-3 text-left font-semibold">Fees (SOL)</th>
                  <th className="px-4 py-3 text-left font-semibold">Transaction</th>
                  <th className="px-4 py-3 text-left font-semibold">Burned At (IST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                      Fetching token burn records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No token burn events found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  records.map((burn) => (
                    <tr key={burn.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          {burn.metadata?.tokenLogo ? (
                            <Image
                              width={36}
                              height={36}
                              src={burn.metadata?.tokenLogo as string}
                              alt={burn.tokenSymbol || 'token logo'}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                              {burn.tokenSymbol?.slice(0, 2) || 'TK'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white">
                              {burn.tokenSymbol || 'Unknown'} <span className="text-gray-500">·</span>{' '}
                              {burn.tokenName || 'Untitled Token'}
                            </p>
                            <p className="text-xs text-gray-500 font-mono truncate max-w-[220px]">
                              {burn.tokenMint}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">
                          {formatNumber(burn.amount, 6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Decimals: {burn.decimals ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-sm text-white truncate max-w-[180px]">
                          {burn.walletAddress}
                        </p>
                        <p className="text-xs text-gray-500">
                          {burn.user?.email || burn.connectedWallet || 'Wallet'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-white">
                          Service: {formatNumber(burn.serviceFeeSol, 4)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Network: {formatNumber(burn.networkFeeSol, 4)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <a
                          href={`https://solscan.io/tx/${burn.txSignature}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-cyan-400 hover:text-cyan-200"
                        >
                          {burn.txSignature.slice(0, 10)}...
                        </a>
                        <p className="text-xs text-gray-500 capitalize">{burn.status}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300">
                        {formatDate(burn.burnedAt)}
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
            <button
              type="button"
              onClick={() => handlePageChange('prev')}
              disabled={page === 1}
              className="rounded-lg border border-gray-600 px-3 py-1 text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handlePageChange('next')}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-600 px-3 py-1 text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

