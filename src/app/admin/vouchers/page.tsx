'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, {
  GrantUserVoucherResponse,
  UserVoucherStatusResponse,
  VoucherCampaignConfig,
} from '@/utils/adminApiService';
import {
  Ticket,
  Search,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Gift,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AdminVouchersPage() {
  const [config, setConfig] = useState<VoucherCampaignConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [lookupUserId, setLookupUserId] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);
  const [rolloverLoading, setRolloverLoading] = useState(false);

  const [status, setStatus] = useState<UserVoucherStatusResponse | null>(null);
  const [customCampaignId, setCustomCampaignId] = useState('');
  const [resetConsumption, setResetConsumption] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await adminApiService.getVoucherCampaignConfig();
      setConfig(res.data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load voucher configuration.' });
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    const admin = adminApiService.getAdminData();
    setIsSuperAdmin(admin?.role === 'super_admin');
  }, [loadConfig]);

  const resolveLookupPayload = () => {
    const email = lookupEmail.trim();
    const idRaw = lookupUserId.trim();
    if (email) return { email };
    if (idRaw) {
      const id = parseInt(idRaw, 10);
      if (!Number.isInteger(id) || id < 1) {
        return null;
      }
      return { userId: id };
    }
    return null;
  };

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);

    const payload = resolveLookupPayload();
    if (!payload) {
      setMessage({ type: 'error', text: 'Enter a valid user ID or email.' });
      return;
    }

    setLookupLoading(true);
    try {
      let userId: string | number | undefined =
        'userId' in payload ? payload.userId : undefined;

      if (!userId && payload.email) {
        const usersRes = await adminApiService.getUsers({
          search: payload.email,
          page: 1,
          limit: 10,
        });
        const normalized = payload.email.toLowerCase();
        const match =
          usersRes.data.users?.find(
            (u) => u.email?.toLowerCase() === normalized,
          ) ?? usersRes.data.users?.[0];
        if (!match?.id) {
          setMessage({ type: 'error', text: 'User not found for that email.' });
          setStatus(null);
          return;
        }
        userId = match.id;
        setLookupUserId(String(userId));
        setLookupEmail(match.email || payload.email);
      }

      if (!userId) {
        setMessage({ type: 'error', text: 'User not found.' });
        return;
      }

      const res = await adminApiService.getUserVoucherStatus(userId);
      setStatus(res.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Lookup failed';
      setMessage({ type: 'error', text: String(msg || 'Lookup failed') });
      setStatus(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleGrant = async () => {
    setMessage(null);
    const payload = resolveLookupPayload();
    const targetUserId = status?.user?.id ?? ('userId' in (payload || {}) ? payload?.userId : undefined);

    if (!payload && !targetUserId) {
      setMessage({ type: 'error', text: 'Look up a user first, or enter user ID / email.' });
      return;
    }

    setGrantLoading(true);
    try {
      const body: {
        userId?: number | string;
        email?: string;
        resetConsumption: boolean;
        campaignId?: string;
      } = {
        resetConsumption,
      };

      const campaignTrim = customCampaignId.trim();
      if (campaignTrim) body.campaignId = campaignTrim;

      if (targetUserId != null && String(targetUserId) !== '') {
        body.userId = targetUserId;
      } else if (payload?.email) {
        body.email = payload.email;
      } else if (payload && 'userId' in payload) {
        body.userId = payload.userId;
      }

      const res: { data: GrantUserVoucherResponse } = await adminApiService.grantUserVoucher(body);
      setMessage({ type: 'success', text: res.data.message || 'Voucher granted.' });
      setLookupUserId(String(res.data.user.id));
      if (res.data.user.email) setLookupEmail(res.data.user.email);

      const refreshed = await adminApiService.getUserVoucherStatus(res.data.user.id);
      setStatus(refreshed.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Failed to grant voucher';
      setMessage({ type: 'error', text: String(msg || 'Failed to grant voucher') });
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRolloverAll = async () => {
    if (!isSuperAdmin) return;
    if (
      !window.confirm(
        'Reset first-recharge voucher for ALL users? This clears consumption for everyone on the current campaign.',
      )
    ) {
      return;
    }
    setRolloverLoading(true);
    setMessage(null);
    try {
      const res = await adminApiService.rolloverFirstRechargeVoucher();
      setMessage({
        type: 'success',
        text: res.data.message || `Rollover complete (${res.data.updatedRows ?? 0} users).`,
      });
      await loadConfig();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Rollover failed';
      setMessage({ type: 'error', text: String(msg || 'Rollover failed') });
    } finally {
      setRolloverLoading(false);
    }
  };

  const promo = status?.firstRechargePromo;
  const voucherActive =
    promo?.offerActive && promo?.claimed && !promo?.consumed;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Ticket className="h-7 w-7 text-cyan-400" />
            User vouchers
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Grant the first-recharge discount voucher to any user (1 use per grant when consumption
            is reset).
          </p>
        </div>

        {message ? (
          <div
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        ) : null}

        {/* Campaign config */}
        <section className="rounded-xl border border-white/10 bg-[var(--panel)] p-6">
          <h2 className="text-lg font-semibold text-white">Active campaign</h2>
          {configLoading ? (
            <div className="mt-4 flex items-center gap-2 text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : config ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-zinc-500">Offer enabled</dt>
                <dd className="font-medium text-white">{config.enabled ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Discount</dt>
                <dd className="font-medium text-white">{config.discountPercent}% off min first recharge</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Campaign ID</dt>
                <dd className="font-mono text-xs text-cyan-200 break-all">{config.campaignId}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Voucher code</dt>
                <dd className="font-mono text-white">{config.code}</dd>
              </div>
            </dl>
          ) : null}
        </section>

        {/* Lookup */}
        <section className="rounded-xl border border-white/10 bg-[var(--panel)] p-6">
          <h2 className="text-lg font-semibold text-white">Find user</h2>
          <form onSubmit={handleLookup} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">User ID</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={lookupUserId}
                  onChange={(e) => setLookupUserId(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Email</label>
                <input
                  type="email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={lookupLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 ring-1 ring-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {lookupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Look up voucher status
            </button>
          </form>
        </section>

        {/* Status + grant */}
        {status ? (
          <section className="rounded-xl border border-white/10 bg-[var(--panel)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">User voucher status</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                  <UserIcon className="h-4 w-4" />
                  {status.user.email || status.user.username || `User #${status.user.id}`}
                  <Link
                    href={`/admin/users/${status.user.id}`}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    View profile
                  </Link>
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  voucherActive
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                    : promo?.consumed
                      ? 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30'
                      : 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30'
                }`}
              >
                {voucherActive ? 'Active — unused' : promo?.consumed ? 'Used' : 'Not active'}
              </span>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-zinc-500">Assigned campaign</dt>
                <dd className="font-mono text-xs text-white break-all">
                  {status.campaignId || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Server active campaign</dt>
                <dd className="font-mono text-xs text-white break-all">{status.activeCampaignId}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Consumed at</dt>
                <dd className="text-white">{formatDate(status.consumedAt)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Has recharged before</dt>
                <dd className="text-white">{status.hasRechargeFirstTime ? 'Yes' : 'No'}</dd>
              </div>
            </dl>

            <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
              <h3 className="font-medium text-white">Grant voucher</h3>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={resetConsumption}
                  onChange={(e) => setResetConsumption(e.target.checked)}
                  className="rounded border-white/20 bg-black/30 text-cyan-500 focus:ring-cyan-400/30"
                />
                Reset consumption (give 1 fresh use)
              </label>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Custom campaign ID (optional — defaults to server campaign)
                </label>
                <input
                  type="text"
                  value={customCampaignId}
                  onChange={(e) => setCustomCampaignId(e.target.value)}
                  placeholder={config?.campaignId || 'idx-first-recharge-default'}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleGrant}
                disabled={grantLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {grantLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
                Grant voucher to this user
              </button>
            </div>
          </section>
        ) : null}

        {/* Super admin rollover */}
        {isSuperAdmin ? (
          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h2 className="text-lg font-semibold text-amber-100">Bulk rollover (all users)</h2>
            <p className="mt-2 text-sm text-amber-200/80">
              Clears voucher consumption for every user and pins them to the current server campaign.
              Use sparingly for promotional waves.
            </p>
            <button
              type="button"
              onClick={handleRolloverAll}
              disabled={rolloverLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 ring-1 ring-amber-400/40 hover:bg-amber-500/30 disabled:opacity-50"
            >
              {rolloverLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Rollover all users
            </button>
          </section>
        ) : null}
      </div>
    </AdminLayout>
  );
}
