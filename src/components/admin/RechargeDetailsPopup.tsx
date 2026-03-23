'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Battery, CreditCard } from 'lucide-react';
import adminApiService, {
  RechargeRecordItem,
  RechargeRecordsListResponse,
} from '@/utils/adminApiService';

const BOT_TYPE_LABELS: Record<string, string> = {
  volume: 'Volume Bot',
  holder: 'Holder Bot',
  reaction: 'Reaction Bot',
};

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

const formatNumber = (value?: number | null, maximumFractionDigits = 6) => {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits });
};

const toFiniteNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getRecordAmountSolEquivalent = (rec: RechargeRecordItem): number | null => {
  const metadata = rec.metadata as Record<string, unknown> | undefined;
  const fromMetadata = toFiniteNumber(
    metadata?.amountInSol ?? metadata?.tokenAmountInSol
  );
  if (fromMetadata != null) return fromMetadata;

  if (rec.currency === 'TOKEN') {
    const tokenRate = toFiniteNumber(metadata?.tokenToSolRate);
    const tokenAmount = toFiniteNumber(metadata?.tokenAmount ?? rec.amount);
    if (tokenRate != null && tokenAmount != null) return tokenAmount * tokenRate;
  }
  return toFiniteNumber(rec.amount);
};

const getRecordPlatformFeeSolEquivalent = (rec: RechargeRecordItem): number | null => {
  const metadata = rec.metadata as Record<string, unknown> | undefined;
  const fromMetadata = toFiniteNumber(
    metadata?.platformFeeInSol ?? metadata?.totalPlatformFeeInSol
  );
  if (fromMetadata != null) return fromMetadata;

  if (rec.currency === 'TOKEN') {
    const tokenRate = toFiniteNumber(metadata?.tokenToSolRate);
    const feeInToken = toFiniteNumber(rec.platformFee);
    if (tokenRate != null && feeInToken != null) return feeInToken * tokenRate;
  }
  return toFiniteNumber(rec.platformFee);
};

const formatAmountCell = (rec: RechargeRecordItem): string => {
  const amount = formatNumber(rec.amount, 6);
  if (rec.currency !== 'TOKEN') return amount;

  const solEq = getRecordAmountSolEquivalent(rec);
  if (solEq == null) return amount;
  return `${amount} (${formatNumber(solEq, 6)} SOL eq.)`;
};

const formatPlatformFeeCell = (rec: RechargeRecordItem): string => {
  if (rec.platformFee == null) return '—';
  const fee = formatNumber(rec.platformFee, 6);
  if (rec.currency !== 'TOKEN') return fee;

  const solEq = getRecordPlatformFeeSolEquivalent(rec);
  if (solEq == null) return fee;
  return `${fee} (${formatNumber(solEq, 6)} SOL eq.)`;
};

type RechargeDetailsPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  limit?: number;
};

export function RechargeDetailsPopup({
  open,
  onOpenChange,
  userId,
  limit,
}: RechargeDetailsPopupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<RechargeRecordItem[]>([]);
  const [summary, setSummary] = useState<RechargeRecordsListResponse['data']['summary'] | null>(null);

  const fetchRecords = useMemo(() => {
    return async () => {
      if (!open) return;
      setLoading(true);
      setError(null);
      try {
        const response = await adminApiService.getRechargeRecordsByUserId(userId, {
          page: 1,
          ...(limit ? { limit } : {}),
        });
        const payload = response.data?.data;
        if (!payload) throw new Error('Invalid response');
        setRecords(payload.records ?? []);
        setSummary(payload.summary ?? null);
      } catch (err) {
        console.error('Failed to load recharge details', err);
        setError('Unable to load recharge details. Please try again.');
        setRecords([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
  }, [limit, open, userId]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 text-white p-0 gap-0 overflow-hidden sm:rounded-lg">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700">
          <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-400" />
            Recharge details for user #{userId}
          </DialogTitle>
          {summary && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-3">
                <p className="text-gray-400">Total Amount</p>
                <p className="text-white font-semibold">{formatNumber(summary.totalAmount, 6)} SOL eq.</p>
              </div>
              <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-3">
                <p className="text-gray-400 flex items-center gap-2">
                  <Battery className="h-4 w-4 text-yellow-400" />
                  Total Platform Fee
                </p>
                <p className="text-white font-semibold">{formatNumber(summary.totalPlatformFee, 6)} SOL</p>
              </div>
              <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-3">
                <p className="text-gray-400">Records</p>
                <p className="text-white font-semibold">{summary.totalRecords}</p>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/60">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-gray-900/40 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date (IST)</th>
                    <th className="px-4 py-3 text-left font-semibold">Bot Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Currency</th>
                    <th className="px-4 py-3 text-left font-semibold">Recharge Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Platform Fee</th>
                    <th className="px-4 py-3 text-left font-semibold">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                        Loading recharge details...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                        No recharge records found.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-800/40">
                        <td className="px-4 py-4 text-gray-300">{formatDate(rec.createdAt)}</td>
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
                        <td className="px-4 py-4 font-semibold text-white">
                          {formatAmountCell(rec)}
                        </td>
                        <td className="px-4 py-4 text-gray-300">{rec.currency}</td>
                        <td className="px-4 py-4 text-gray-300">{rec.rechargeType ?? '—'}</td>
                        <td className="px-4 py-4 text-gray-300">
                          {formatPlatformFeeCell(rec)}
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-xs">{rec.deviceType ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

