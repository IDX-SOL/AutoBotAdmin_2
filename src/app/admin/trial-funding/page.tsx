'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Wallet, AlertCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService from '@/utils/adminApiService';

type TrialWalletStatus = {
  ownerWallet: {
    address: string | null;
    configured: boolean;
    solBalance: number;
    lowBalance: boolean;
  };
  tradeWallets: Array<{ address: string; solBalance: number }>;
  totalSol: number;
  thresholds: { ownerLowSol: number; systemMinSol: number };
  needsFunding: boolean;
  fundingInstructions: string;
};

export default function TrialFundingPage() {
  const [status, setStatus] = useState<TrialWalletStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApiService.getTrialWalletStatus();
      setStatus(res.data?.data ?? null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load trial wallet status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const copyAddress = async () => {
    const addr = status?.ownerWallet?.address;
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      toast.success('Owner wallet address copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-7 h-7 text-amber-400" />
              Trial Funding
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Monitor shared trial wallets. Send SOL to the owner wallet when balance is low.
            </p>
          </div>
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {status?.needsFunding && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Low balance — fund required</p>
              <p className="text-sm mt-1 opacity-90">
                Owner or total system SOL is below threshold. Users may see &quot;Free trial
                temporarily unavailable&quot; until you add SOL.
              </p>
            </div>
          </div>
        )}

        {loading && !status ? (
          <p className="text-gray-400">Loading…</p>
        ) : status ? (
          <>
            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 space-y-4">
              <h2 className="text-lg font-semibold text-white">Owner wallet</h2>
              {!status.ownerWallet.configured ? (
                <p className="text-amber-300 text-sm">
                  Set TRIAL_SHARED_OWNER_WALLET_PRIVATE_KEY on the backend.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs text-cyan-300 break-all">
                      {status.ownerWallet.address}
                    </code>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="p-1.5 rounded bg-gray-700 hover:bg-gray-600"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-300" />
                      )}
                    </button>
                    {status.ownerWallet.address && (
                      <a
                        href={`https://solscan.io/account/${status.ownerWallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        View on Solscan
                      </a>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {status.ownerWallet.solBalance.toFixed(4)} SOL
                  </p>
                  <p className="text-xs text-gray-400">
                    Low alert below {status.thresholds.ownerLowSol} SOL
                  </p>
                </>
              )}
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 space-y-3">
              <h2 className="text-lg font-semibold text-white">Trade wallets</h2>
              {status.tradeWallets.length === 0 ? (
                <p className="text-gray-400 text-sm">No reserved trial trade wallets yet.</p>
              ) : (
                <ul className="space-y-2">
                  {status.tradeWallets.map((w) => (
                    <li
                      key={w.address}
                      className="flex justify-between items-center text-sm border-b border-gray-700/50 pb-2"
                    >
                      <code className="text-cyan-300/80 text-xs truncate max-w-[70%]">
                        {w.address}
                      </code>
                      <span className="text-white font-medium">
                        {w.solBalance.toFixed(4)} SOL
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <p className="text-sm text-amber-100">
                <span className="font-semibold">Total system SOL:</span>{' '}
                {status.totalSol.toFixed(4)} (min {status.thresholds.systemMinSol} to run trials)
              </p>
              <p className="text-sm text-gray-300 mt-3">{status.fundingInstructions}</p>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
