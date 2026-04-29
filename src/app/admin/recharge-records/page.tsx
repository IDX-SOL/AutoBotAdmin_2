'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, RefreshCw, Search } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, {
  RechargeRecordItem,
  RechargeRecordsStats,
} from '@/utils/adminApiService';

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

const BOT_TYPE_LABELS: Record<string, string> = {
  volume: 'Volume Bot',
  holder: 'Holder Bot',
  reaction: 'Reaction Bot',
};

const parseMetadataNumber = (metadata: unknown, key: string) => {
  if (!metadata || typeof metadata !== 'object') return 0;
  const raw = (metadata as Record<string, unknown>)[key];
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
};

const getRechargeAmounts = (rec: RechargeRecordItem) => {
  const amount = Number(rec.amount || 0);
  const currency = (rec.currency || '').toUpperCase();
  const metadataTokenAmount = parseMetadataNumber(rec.metadata, 'tokenAmount');
  const metadataTokenToSolRate = parseMetadataNumber(rec.metadata, 'tokenToSolRate');
  const metadataTokenAmountInSol = parseMetadataNumber(rec.metadata, 'tokenAmountInSol');

  const calculateTokenAmountInSol = (tokenAmountValue: number) => {
    if (metadataTokenAmountInSol > 0) return metadataTokenAmountInSol;
    if (tokenAmountValue > 0 && metadataTokenToSolRate > 0) {
      return tokenAmountValue * metadataTokenToSolRate;
    }
    return 0;
  };

  if (currency === 'SOL') {
    return {
      solAmount: amount,
      tokenAmount: 0,
      tokenAmountInSol: 0,
      totalSolEquivalent: amount,
    };
  }

  if (currency === 'TOKEN') {
    const tokenAmount = metadataTokenAmount > 0 ? metadataTokenAmount : amount;
    const tokenAmountInSol = calculateTokenAmountInSol(tokenAmount);
    return {
      solAmount: 0,
      tokenAmount,
      tokenAmountInSol,
      totalSolEquivalent: tokenAmountInSol,
    };
  }

  const solAmount = parseMetadataNumber(rec.metadata, 'solAmount');
  const tokenAmount = metadataTokenAmount;
  const tokenAmountInSol =
    calculateTokenAmountInSol(tokenAmount) ||
    Math.max(0, amount - solAmount);

  return {
    solAmount,
    tokenAmount,
    tokenAmountInSol,
    totalSolEquivalent: solAmount + tokenAmountInSol,
  };
};

export default function RechargeRecordsPage() {
  const [records, setRecords] = useState<RechargeRecordItem[]>([]);
  const [stats, setStats] = useState<RechargeRecordsStats | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    botType: '',
    startDate: '',
    endDate: '',
  });

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.search || filters.botType || filters.startDate || filters.endDate
      ),
    [filters]
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminApiService.getRechargeRecordsStats();
      if (response.data?.data) setStats(response.data.data);
    } catch (err) {
      console.error('Failed to load recharge stats', err);
    }
  }, []);

  const fetchRecords = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          page: pageToLoad,
          limit,
        };
        if (filters.search) params.search = filters.search;
        if (filters.botType) params.botType = filters.botType;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const response = await adminApiService.getRechargeRecords(params);
        const payload = response.data?.data;
        if (!payload) throw new Error('Invalid response');

        setRecords(payload.records);
        setTotal(payload.pagination.total);
        setTotalPages(payload.pagination.totalPages);
        setPage(payload.pagination.page);
      } catch (err) {
        console.error('Failed to load recharge records', err);
        setError('Unable to load recharge records. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [filters, limit]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchRecords(page);
  }, [fetchRecords, page]);

  const handleSubmitFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    fetchRecords(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      botType: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
    fetchRecords(1);
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && page > 1) setPage(page - 1);
    if (direction === 'next' && page < totalPages) setPage(page + 1);
  };

  const summaryCards = [
    {
      label: 'Total Records',
      value: (stats?.totalRecords ?? total).toLocaleString('en-IN'),
      subtext: 'All bot types',
    },
    {
      label: 'Total Amount',
      value: `${formatNumber(stats?.totalSolEquivalent ?? stats?.totalAmount ?? 0, 4)} SOL eq.`,
      subtext: 'SOL + token SOL equivalent',
    },
    {
      label: 'Total Platform Fee',
      value: `${formatNumber(stats?.totalPlatformFee ?? 0, 4)} SOL`,
      subtext: 'Platform fees collected',
    },
    {
      label: 'Last Record',
      value: formatDate(stats?.lastRecordAt),
      subtext: 'Times in IST',
    },
  ];

  const rechargeTypeRows = useMemo(
    () =>
      Object.entries(stats?.byRechargeType ?? {}).sort(
        (a, b) => (b[1]?.count ?? 0) - (a[1]?.count ?? 0)
      ),
    [stats]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
              <CreditCard className="h-7 w-7 text-emerald-400" />
              <span>Recharge Records</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Volume, holder, and reaction bot recharges after successful top-ups.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchRecords(page);
            }}
            className="inline-flex items-center space-x-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-700 bg-gray-800/70 p-4"
            >
              <p className="text-sm text-gray-400">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-gray-500">{card.subtext}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-700 bg-gray-800/70 p-4">
            <p className="text-sm text-gray-400">Total SOL Recharge</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatNumber(stats?.totalSolAmount ?? 0, 6)} SOL
            </p>
          </div>
          <div className="rounded-2xl border border-gray-700 bg-gray-800/70 p-4">
            <p className="text-sm text-gray-400">Total TOKEN Recharge</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatNumber(stats?.totalTokenAmount ?? 0, 6)} TOKEN
            </p>
          </div>
          <div className="rounded-2xl border border-gray-700 bg-gray-800/70 p-4">
            <p className="text-sm text-gray-400">TOKEN in SOL Equivalent</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatNumber(stats?.totalTokenAmountInSol ?? 0, 6)} SOL
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmitFilters}
          className="rounded-2xl border border-gray-700 bg-gray-800/70 p-4 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Search (user email / username)
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="User email or username..."
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/60 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Bot Type
              </label>
              <select
                value={filters.botType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, botType: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="">All</option>
                <option value="volume">Volume Bot</option>
                <option value="holder">Holder Bot</option>
                <option value="reaction">Reaction Bot</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="rounded-lg border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-600 hover:to-blue-700"
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
                  <th className="px-4 py-3 text-left font-semibold">Date (IST)</th>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Bot Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Bot ID</th>
                  <th className="px-4 py-3 text-left font-semibold">SOL Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">TOKEN Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">SOL Eq.</th>
                  <th className="px-4 py-3 text-left font-semibold">Recharge Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Platform Fee</th>
                  <th className="px-4 py-3 text-left font-semibold">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                      Loading recharge records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No recharge records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => {
                    const amounts = getRechargeAmounts(rec);
                    return (
                    <tr key={rec.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-4 text-gray-300">
                        {formatDate(rec.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">
                          {rec.user?.email ?? rec.user?.username ?? `User #${rec.userId}`}
                        </p>
                        {rec.user?.username && rec.user?.email && (
                          <p className="text-xs text-gray-500">
                            {rec.user.username}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            rec.botType === 'volume'
                              ? 'bg-blue-500/20 text-blue-400'
                              : rec.botType === 'holder'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {BOT_TYPE_LABELS[rec.botType] ?? rec.botType}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-white">
                        {rec.botId}
                      </td>
                      <td className="px-4 py-4 font-semibold text-white">
                        {formatNumber(amounts.solAmount, 6)}
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {formatNumber(amounts.tokenAmount, 6)}
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {formatNumber(amounts.totalSolEquivalent, 6)}
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {rec.rechargeType ?? '—'}
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {rec.platformFee != null
                          ? formatNumber(rec.platformFee, 6)
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-xs">
                        {rec.deviceType ?? '—'}
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/60">
          <div className="border-b border-gray-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-200">
              Recharge Type Summary
            </h2>
            <p className="text-xs text-gray-500">
              Separate totals by recharge type (SOL/TOKEN/BOTH/FIRST, etc.)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-gray-800/60 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Recharge Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Count</th>
                  <th className="px-4 py-3 text-left font-semibold">SOL Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">TOKEN Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">TOKEN (SOL Eq.)</th>
                  <th className="px-4 py-3 text-left font-semibold">Total SOL Eq.</th>
                  <th className="px-4 py-3 text-left font-semibold">Platform Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {rechargeTypeRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No recharge type summary available.
                    </td>
                  </tr>
                ) : (
                  rechargeTypeRows.map(([type, data]) => (
                    <tr key={type} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-medium text-white">{type}</td>
                      <td className="px-4 py-3">{(data?.count ?? 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">{formatNumber(data?.solAmount ?? 0, 6)}</td>
                      <td className="px-4 py-3">{formatNumber(data?.tokenAmount ?? 0, 6)}</td>
                      <td className="px-4 py-3">{formatNumber(data?.tokenAmountInSol ?? 0, 6)}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {formatNumber(data?.totalSolEquivalent ?? 0, 6)}
                      </td>
                      <td className="px-4 py-3">{formatNumber(data?.totalPlatformFee ?? 0, 6)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
          <p>
            Page {page} of {totalPages} · {total.toLocaleString('en-IN')} records
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
