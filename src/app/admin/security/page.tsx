'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService from '@/utils/adminApiService';
import {
  ShieldAlert,
  Power,
  UserX,
  KeyRound,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export default function AdminSecurityPage() {
  const [killSwitchEnabled, setKillSwitchEnabled] = useState<boolean | null>(null);
  const [killSwitchLoading, setKillSwitchLoading] = useState(true);
  const [killSwitchToggling, setKillSwitchToggling] = useState(false);
  const [revokeUserId, setRevokeUserId] = useState('');
  const [revokeUserLoading, setRevokeUserLoading] = useState(false);
  const [revokeTokenValue, setRevokeTokenValue] = useState('');
  const [revokeTokenLoading, setRevokeTokenLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  useEffect(() => {
    const admin = adminApiService.getAdminData();
    setIsSuperAdmin(admin?.role === 'super_admin');
  }, []);

  const fetchKillSwitchStatus = useCallback(async () => {
    setKillSwitchLoading(true);
    try {
      const res = await adminApiService.getKillSwitchStatus();
      setKillSwitchEnabled(res.data?.enabled ?? false);
    } catch (err) {
      console.error('Failed to fetch kill switch status', err);
      setMessage({ type: 'error', text: 'Failed to load kill switch status' });
    } finally {
      setKillSwitchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKillSwitchStatus();
  }, [fetchKillSwitchStatus]);

  const handleToggleKillSwitch = async () => {
    if (!isSuperAdmin || killSwitchEnabled === null) return;
    setKillSwitchToggling(true);
    setMessage(null);
    try {
      const newState = !killSwitchEnabled;
      await adminApiService.setKillSwitch(newState);
      setKillSwitchEnabled(newState);
      setMessage({
        type: 'success',
        text: newState
          ? 'Global kill switch is ON — all user tokens are now rejected.'
          : 'Global kill switch is OFF — user access restored.',
      });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to update kill switch';
      setMessage({ type: 'error', text: String(msg) });
    } finally {
      setKillSwitchToggling(false);
    }
  };

  const handleRevokeUserTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = revokeUserId.trim();
    const id = parseInt(userId, 10);
    if (!userId || !Number.isInteger(id) || id < 1) {
      setMessage({ type: 'error', text: 'Please enter a valid user ID (positive integer).' });
      return;
    }
    setRevokeUserLoading(true);
    setMessage(null);
    try {
      const res = await adminApiService.revokeUserTokens(id);
      setMessage({ type: 'success', text: res.data?.message ?? `All sessions revoked for user ${id}.` });
      setRevokeUserId('');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to revoke user tokens';
      setMessage({ type: 'error', text: String(msg) });
    } finally {
      setRevokeUserLoading(false);
    }
  };

  const handleRevokeToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = revokeTokenValue.replace(/^\s*Bearer\s+/i, '').trim();
    if (!token) {
      setMessage({ type: 'error', text: 'Please paste the JWT token to revoke.' });
      return;
    }
    setRevokeTokenLoading(true);
    setMessage(null);
    try {
      await adminApiService.revokeToken(token);
      setMessage({ type: 'success', text: 'Token revoked. It can no longer be used.' });
      setRevokeTokenValue('');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to revoke token';
      setMessage({ type: 'error', text: String(msg) });
    } finally {
      setRevokeTokenLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-7 w-7" />
            Security & Token Revocation
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Kill switch and token revocation for user JWTs. Admin sessions are not affected.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <span className="flex-1">{message.text}</span>
            <button
              type="button"
              onClick={clearMessage}
              className="text-gray-400 hover:text-white"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Kill switch */}
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Power className="h-5 w-5" />
            Global kill switch
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            When ON, all user access tokens are rejected (API and sockets). Admin login is unaffected.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {killSwitchLoading ? (
              <span className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </span>
            ) : (
              <>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    killSwitchEnabled === true
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-600/50 text-gray-300'
                  }`}
                >
                  {killSwitchEnabled === true ? 'ON — Access disabled' : 'OFF — Access allowed'}
                </span>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={handleToggleKillSwitch}
                    disabled={killSwitchToggling}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      killSwitchEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    } disabled:opacity-50`}
                  >
                    {killSwitchToggling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {killSwitchEnabled ? 'Turn OFF' : 'Turn ON'}
                  </button>
                )}
                {!isSuperAdmin && (
                  <span className="text-xs text-gray-500">
                    Only super_admin can change the kill switch.
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Revoke all tokens for a user */}
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Revoke all sessions for a user
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Invalidates every token issued for this user. They must log in again.
          </p>
          <form onSubmit={handleRevokeUserTokens} className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="revoke-user-id" className="block text-xs font-medium text-gray-400 mb-1">
                User ID
              </label>
              <input
                id="revoke-user-id"
                type="number"
                min={1}
                value={revokeUserId}
                onChange={(e) => setRevokeUserId(e.target.value)}
                placeholder="e.g. 42"
                className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500 w-40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={revokeUserLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {revokeUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Revoke all sessions
            </button>
          </form>
        </div>

        {/* Revoke single token */}
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Revoke a single token
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Paste a leaked or compromised access JWT to revoke it immediately.
          </p>
          <form onSubmit={handleRevokeToken} className="mt-4">
            <label htmlFor="revoke-token" className="block text-xs font-medium text-gray-400 mb-1">
              Access token (JWT)
            </label>
            <textarea
              id="revoke-token"
              rows={3}
              value={revokeTokenValue}
              onChange={(e) => setRevokeTokenValue(e.target.value)}
              placeholder="Paste Bearer token or raw JWT…"
              className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={revokeTokenLoading}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500 disabled:opacity-50"
            >
              {revokeTokenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Revoke this token
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
