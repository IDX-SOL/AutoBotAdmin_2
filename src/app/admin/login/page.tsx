'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, KeyRound, Loader2 } from 'lucide-react';
import adminApiService from '@/utils/adminApiService';

export default function AdminLogin() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOtpSentMessage('');
    try {
      const response = await adminApiService.sendOtp(email.trim().toLowerCase());
      setOtpSentMessage(response.data?.message ?? 'OTP sent. Check your email.');
      setStep('otp');
      setOtp('');
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string }; status?: number } }).response
        : null;
      const msg = res?.data?.error ?? (err instanceof Error ? err.message : 'Failed to send OTP');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await adminApiService.verifyOtp(email.trim().toLowerCase(), otp.trim());
      const data = response.data;
      localStorage.setItem('adminToken', data.token);
      if (data.refreshToken) {
        localStorage.setItem('adminRefreshToken', data.refreshToken);
      }
      localStorage.setItem('adminData', JSON.stringify(data.admin));
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response
        : null;
      const msg = res?.data?.error ?? (err instanceof Error ? err.message : 'Invalid OTP');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
    setOtpSentMessage('');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-400/15">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Admin Login</h2>
          <p className="text-zinc-400">
            {step === 'email' ? 'Enter your admin email to receive a one-time code' : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--panel)]/90 p-8 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-lg">
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-cyan-400/35 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-400/15 px-4 py-3 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {otpSentMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-emerald-400 text-sm">{otpSentMessage}</p>
                </div>
              )}
              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-medium text-zinc-300">
                  Verification code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-center font-mono text-lg tracking-widest text-white placeholder-zinc-500 focus:border-cyan-400/35 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                    placeholder="000000"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-400/15 px-4 py-3 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {loading ? 'Signing in…' : 'Verify & Sign in'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-zinc-500">
          Secure access to AutoBot administration
        </p>
      </div>
    </div>
  );
}
