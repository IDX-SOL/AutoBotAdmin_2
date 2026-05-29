"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import adminApiService, {
  ReactionBot,
  ReactionBotActionType,
  ReactionBotAdminStatus,
} from "../../../utils/adminApiService";
import {
  Activity,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Target,
  Zap,
  Globe,
  CheckCircle2,
  X,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast/ToastContext";

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

const REACTION_BOT_ADMIN_STATUSES: ReactionBotAdminStatus[] = ['stopped', 'running', 'started'];

const isReactionBotAdminStatus = (value: string): value is ReactionBotAdminStatus =>
  REACTION_BOT_ADMIN_STATUSES.includes(value as ReactionBotAdminStatus);

const isReactionBotActionType = (value: string): value is ReactionBotActionType =>
  value === 'rocket' || value === 'fire';

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export default function AdminReactionBots() {
  const [bots, setBots] = useState<ReactionBot[]>([]);
  const [expandedBots, setExpandedBots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [deletedFilter, setDeletedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [startingBotId, setStartingBotId] = useState<string | null>(null);
  const [updatingStatusBotId, setUpdatingStatusBotId] = useState<string | null>(null);
  const [startDrafts, setStartDrafts] = useState<Record<string, string>>({});
  const { showError, showSuccess } = useToast();

  const fetchBots = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: 20,
        status: statusFilter,
        deleted: deletedFilter
      };
      const response = await adminApiService.getReactionBots(params);
      if (response && response.data) {
        const botsData = response.data.bots || [];
        const paginationData = response.data.pagination || {
          page: currentPage,
          limit: 20,
          total: 0,
          totalPages: 1
        };
        setBots(botsData);
        setPagination(paginationData);
        setTotalPages(paginationData.totalPages || 1);
      } else {
        setBots([]);
        setPagination({
          page: currentPage,
          limit: 20,
          total: 0,
          totalPages: 1
        });
        setTotalPages(1);
      }
    } catch (error: unknown) {
      console.error("Error fetching reaction bots:", error);
      setBots([]);
      setPagination({
        page: currentPage,
        limit: 20,
        total: 0,
        totalPages: 1
      });
      setTotalPages(1);
      showError("Failed to fetch reaction bots");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, deletedFilter, showError]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const toggleBotExpansion = (botId: string) => {
    setExpandedBots((prev) => {
      const next = new Set(prev);
      if (next.has(botId)) {
        next.delete(botId);
      } else {
        next.add(botId);
      }
      return next;
    });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getReactionCountDraft = (bot: ReactionBot): string => {
    if (startDrafts[bot.id] !== undefined) return startDrafts[bot.id];
    const planned = bot.reactionsPlanned ?? 0;
    const defaultCount = planned >= 1 && planned <= 10000 ? planned : 1;
    return String(defaultCount);
  };

  const getStartBlockedReason = (bot: ReactionBot): string | null => {
    if (bot.deletedAt) return 'This bot is deleted and cannot be started.';
    if (bot.status !== 'stopped') {
      return `Start is only available when status is stopped (current: ${bot.status ?? 'unknown'}).`;
    }
    return null;
  };

  const getStatusChangeBlockedReason = (bot: ReactionBot): string | null => {
    if (bot.deletedAt) return 'Status cannot be changed for deleted bots.';
    return null;
  };

  const handleSweepFundedToCompany = async () => {
    const confirmed = window.confirm(
      'Sweep all funded reaction bot balances to the company wallet? This cannot be undone from here.'
    );
    if (!confirmed) return;

    setSweepLoading(true);
    try {
      const response = await adminApiService.sweepFundedReactionBotsToCompany();
      const message = response.data?.message ?? 'Sweep completed successfully';
      showSuccess(message);
      await fetchBots();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error, 'Failed to sweep funded balances to company'));
    } finally {
      setSweepLoading(false);
    }
  };

  const handleStartBot = async (bot: ReactionBot, defaultActionType: ReactionBotActionType) => {
    if (bot.status !== 'stopped') {
      showError('Bot can only be started when status is stopped');
      return;
    }

    const reactionCount = parseInt(getReactionCountDraft(bot), 10);
    if (!Number.isInteger(reactionCount) || reactionCount < 1 || reactionCount > 10000) {
      showError('Reaction count must be an integer between 1 and 10,000');
      return;
    }
    if (!isReactionBotActionType(defaultActionType)) {
      showError('Action type must be rocket or fire (from latest recharge)');
      return;
    }

    setStartingBotId(bot.id);
    try {
      const response = await adminApiService.startReactionBot(bot.id, {
        reactionCount,
        actionType: defaultActionType,
      });
      showSuccess(response.data?.message ?? 'Reaction bot started');
      await fetchBots();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 409) {
        showError(getApiErrorMessage(error, 'Bot must be stopped before starting'));
      } else {
        showError(getApiErrorMessage(error, 'Failed to start reaction bot'));
      }
    } finally {
      setStartingBotId(null);
    }
  };

  const handleStatusChange = async (botId: string, nextStatus: string) => {
    if (!isReactionBotAdminStatus(nextStatus)) {
      showError('Invalid status. Allowed: stopped, running, started');
      return;
    }

    setUpdatingStatusBotId(botId);
    try {
      const response = await adminApiService.patchReactionBotStatus(botId, { status: nextStatus });
      showSuccess(response.data?.message ?? `Status updated to ${nextStatus}`);
      await fetchBots();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error, 'Failed to update bot status'));
    } finally {
      setUpdatingStatusBotId(null);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusConfig: Record<string, { color: string }> = {
      running: { color: "bg-green-500/20 text-green-400 border-green-500/30" },
      stopped: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      started: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      paused: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      error: { color: "bg-red-500/20 text-red-400 border-red-500/30" },
      refunded: { color: "bg-red-500/20 text-red-400 border-red-500/30" },
      refunding: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30" }
    };

    const config = statusConfig[status || "stopped"] || statusConfig.stopped;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color} shadow-sm`}>
        <span className="capitalize text-xs">{status || "stopped"}</span>
      </span>
    );
  };

  const Pagination = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-400">
        Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, pagination.total)} of {pagination.total} reaction bots
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Reaction Bots</h1>
            <p className="text-gray-400 text-lg">Monitor and manage reaction automation bots</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Total: {pagination.total || 0} reaction bots</span>
          </div>
        </div>

        {/* Sweep funded balances */}
        <div className="bg-gray-800/80 rounded-xl p-4 sm:p-5 border border-amber-500/20 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-400" />
                Sweep funded to company
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Transfer funded reaction bot balances to the company wallet
              </p>
            </div>
            <button
              type="button"
              onClick={handleSweepFundedToCompany}
              disabled={sweepLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shrink-0"
            >
              {sweepLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sweeping…
                </>
              ) : (
                'Run sweep'
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="running">Running</option>
                <option value="started">Started</option>
                <option value="stopped">Stopped</option>
                <option value="refunding">Refunding</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Deleted</label>
              <select
                value={deletedFilter}
                onChange={(e) => setDeletedFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All</option>
                <option value="false">Active only</option>
                <option value="true">Deleted only</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("");
                  setDeletedFilter("");
                  setCurrentPage(1);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-md"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {bots.map((bot) => {
            const rechargeRecords = bot.recharge?.records ?? [];
            const latestRecord = rechargeRecords.length > 0 ? rechargeRecords[0] : null;
            const latestAction = latestRecord?.metadata?.actionType;
            const currentActionType: ReactionBotActionType =
              latestAction === 'fire' || latestAction === 'rocket' ? latestAction : 'rocket';
            const reactionCountDraft = getReactionCountDraft(bot);
            const startBlockedReason = getStartBlockedReason(bot);
            const statusBlockedReason = getStatusChangeBlockedReason(bot);
            const canStart = !startBlockedReason;
            const isStarting = startingBotId === bot.id;
            const isUpdatingStatus = updatingStatusBotId === bot.id;
            const adminStatusValue = isReactionBotAdminStatus(bot.status ?? '')
              ? bot.status
              : 'stopped';

            return (
              <div
              key={bot.id}
              className="bg-gray-800/80 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/60 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20 hover:scale-[1.01] group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                {/* Bot Identity */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow flex-shrink-0 ring-1 ring-purple-500/20">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white truncate mb-1">{bot.botName || "Reaction Bot"}</h3>
                    {bot.user?.email && (
                      <Link
                        href={`/admin/users/${bot.user?.id}`}
                        className="text-sm text-blue-400 truncate block hover:text-blue-300 transition-colors mb-1 hover:underline"
                      >
                        {bot.user?.email}
                      </Link>
                    )}
                    {bot.targetUrl && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{bot.targetUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
            
                {/* Header Right Controls */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {/* Badge row */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {getStatusBadge(bot.status)}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-800/60 border border-gray-700/50 rounded text-[10px]">
                      <div className={`w-1.5 h-1.5 rounded-full ${bot?.fundAdded ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-gray-300">Fund</span>
                      {bot?.fundAdded
                        ? <CheckCircle2 className="h-2.5 w-2.5 text-green-400" />
                        : <X className="h-2.5 w-2.5 text-red-400" />}
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-800/60 border border-gray-700/50 rounded text-[10px]">
                      <div className={`w-1.5 h-1.5 rounded-full ${bot?.hasRecharge ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-gray-300">Recharge</span>
                      {bot?.hasRecharge
                        ? <CheckCircle2 className="h-2.5 w-2.5 text-green-400" />
                        : <X className="h-2.5 w-2.5 text-red-400" />}
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-500 text-right leading-tight">
                    <div>Created: {formatDate(bot.createdAt)}</div>
                    <div>Updated: {formatDate(bot.updatedAt)}</div>
                  </div>
                </div>
              </div>

              {/* Status & start — outside header, full width */}
              <div className="w-full mb-4">
                <div className="w-full flex items-stretch gap-4 p-3 bg-gray-800/40 border border-gray-700/40 rounded-lg">
                  <div
                    className="flex-1 flex flex-col gap-1.5 min-w-0 justify-center"
                    title={statusBlockedReason ?? undefined}
                  >
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Status</span>
                    <div className="flex items-center gap-1.5 w-full max-w-[200px]">
                      <select
                        id={`status-${bot.id}`}
                        value={adminStatusValue}
                        onChange={(e) => handleStatusChange(bot.id, e.target.value)}
                        disabled={!!statusBlockedReason || isUpdatingStatus}
                        className={`flex-1 min-w-0 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${
                          statusBlockedReason ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title={statusBlockedReason ?? 'Change bot status'}
                      >
                        {REACTION_BOT_ADMIN_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                      {isUpdatingStatus && <Loader2 className="h-3 w-3 animate-spin text-gray-400 shrink-0" />}
                    </div>
                    {statusBlockedReason && (
                      <p className="text-[10px] text-amber-400/90 leading-tight">
                        {statusBlockedReason}
                      </p>
                    )}
                  </div>

                  <div className="w-px bg-gray-600/60 shrink-0" aria-hidden />

                  <div
                    className={`flex-1 flex flex-col gap-1.5 min-w-0 items-end justify-center ${
                      startBlockedReason ? 'cursor-not-allowed' : ''
                    }`}
                    title={startBlockedReason ?? `Start with ${currentActionType} action`}
                  >
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Start</span>
                    <div className="flex items-center gap-1.5 justify-end w-full max-w-[200px]">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={reactionCountDraft}
                        onChange={(e) =>
                          setStartDrafts((prev) => ({ ...prev, [bot.id]: e.target.value }))
                        }
                        disabled={!canStart || isStarting}
                        aria-label="Reaction count"
                        className="w-16 flex-1 min-w-0 px-1.5 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={startBlockedReason ?? 'Reactions to run (1–10,000)'}
                      />
                      <button
                        type="button"
                        role="switch"
                        aria-checked={false}
                        aria-label="Start reaction bot"
                        disabled={!canStart || isStarting}
                        onClick={() => handleStartBot(bot, currentActionType)}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 ${
                          canStart && !isStarting
                            ? 'cursor-pointer bg-gray-600 hover:bg-purple-600'
                            : 'cursor-not-allowed bg-gray-700'
                        }`}
                      >
                        <span className="sr-only">Start bot</span>
                        <span className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow translate-x-0.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-500 text-right">
                      {isStarting ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Starting…
                        </span>
                      ) : (
                        <>Uses {currentActionType}</>
                      )}
                    </span>
                    {startBlockedReason && (
                      <p className="text-[10px] text-amber-400/90 leading-tight text-right">
                        {startBlockedReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <p className="text-gray-400 mb-1.5 text-xs font-medium">Planned</p>
                  <p className="text-white font-bold text-lg">{bot.reactionsPlanned ?? 0}</p>
                </div>
                <div className="text-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <p className="text-gray-400 mb-1.5 text-xs font-medium">Processed</p>
                  <p className="text-white font-bold text-lg">{bot.reactionsProcessed ?? 0}</p>
                </div>
                <div className="text-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <p className="text-gray-400 mb-1.5 text-xs font-medium">Total Actions</p>
                  <p className="text-white font-bold text-lg">{bot.totalActions ?? 0}</p>
                </div>
              </div>
            
              {/* Token & Chain Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Token</p>
                  <p className="text-white font-bold text-sm">{bot.tokenName || "Unknown"} ({bot.tokenSymbol || "—"})</p>
                  {bot.chain && <p className="text-xs text-gray-400 mt-1">Chain: {bot.chain}</p>}
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Action Type</p>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-white font-medium text-sm capitalize">{currentActionType}</span>
                    {rechargeRecords.length > 0 && <span className="text-[10px] text-gray-500">(latest)</span>}
                  </div>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Owner Wallet</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-300 font-mono truncate flex-1">
                      {bot.ownerWalletAddress ? `${bot.ownerWalletAddress.slice(0, 6)}...${bot.ownerWalletAddress.slice(-6)}` : "N/A"}
                    </span>
                    <button
                      onClick={() => bot.ownerWalletAddress && handleCopy(bot.ownerWalletAddress, "ownerWallet")}
                      className={`p-1 rounded transition-colors flex-shrink-0 ${copiedField === "ownerWallet" ? "text-green-400" : "text-gray-400 hover:text-white"}`}
                      title="Copy owner wallet"
                      disabled={!bot.ownerWalletAddress}
                    >
                      {copiedField === "ownerWallet" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <Link
                      href={`https://solscan.io/address/${bot.ownerWalletAddress}`}
                      target="_blank"
                      className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors flex-shrink-0"
                      title="View on Solscan"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Pair Address</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-300 font-mono truncate flex-1">
                      {bot.pairAddress ? `${bot.pairAddress.slice(0, 6)}...${bot.pairAddress.slice(-6)}` : "N/A"}
                    </span>
                    <button
                      onClick={() => bot.pairAddress && handleCopy(bot.pairAddress, "pairAddress")}
                      className={`p-1 rounded transition-colors flex-shrink-0 ${copiedField === "pairAddress" ? "text-green-400" : "text-gray-400 hover:text-white"}`}
                      title="Copy pair address"
                      disabled={!bot.pairAddress}
                    >
                      {copiedField === "pairAddress" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <Link
                      href={`https://dexscreener.com/solana/${bot.pairAddress}`}
                      target="_blank"
                      className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors flex-shrink-0"
                      title="View on DexScreener"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            
              {/* Transaction History */}
              <div className="border-t border-gray-700/30 pt-4 mb-4">
                <button
                  onClick={() => toggleBotExpansion(bot.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/40 transition-colors mb-3"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">
                      Transaction History ({rechargeRecords.length} {rechargeRecords.length === 1 ? 'record' : 'records'})
                    </span>
                  </div>
                  {expandedBots.has(bot.id)
                    ? <ChevronUp className="h-4 w-4 text-gray-400" />
                    : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
            
                {expandedBots.has(bot.id) && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {rechargeRecords.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">No transaction history found</div>
                    ) : (
                      rechargeRecords.map((record) => (
                        <div key={record.id} className="p-3 bg-gray-700/20 rounded-lg border border-gray-600/20 hover:bg-gray-700/30 transition-colors">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-medium text-white">
                              {formatNumber(Number(record.amount), 6)} {record.currency}
                            </span>
                            <span className="text-xs text-gray-500">·</span>
                            <span className="text-xs text-gray-400">Planned: {formatNumber(record.metadata?.reactionsPlanned)}</span>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-300 capitalize">
                              {record.metadata?.actionType || 'rocket'}
                            </span>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-300">
                              {record.rechargeType}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(record.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            
              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Activity className="h-3 w-3" />
                  <span>{bot.recharge?.rechargeCount ?? bot.recharge?.records?.length ?? 0} records</span>
                </div>
                {bot.deletedAt && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <Trash2 className="h-3 w-3" />
                    {new Date(bot.deletedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Empty State */}
        {bots.length === 0 && !loading && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No reaction bots found</h3>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {bots.length > 0 && (
          <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <Pagination />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}