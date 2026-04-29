"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import adminApiService, { Bot } from "../../../utils/adminApiService";
import {
  Bot as BotIcon,
  Activity,
  Copy,
  Check,
  ExternalLink,
  Wallet,
  Trash2,
  Smartphone,
  Monitor,
  MapPin,
  X,
  CheckCircle2,
  Play,
  Square,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from '@/components/Toast/ToastContext';

export default function AdminBots() {
  const [bots, setBots] = useState<Bot[]>([]);
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
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [isBulkBackfillingWallets, setIsBulkBackfillingWallets] = useState(false);
  const [responseDetails, setResponseDetails] = useState<Array<{
    message: string;
    botId: string;
    botName?: string;
    tokenAddress: string;
    engine: string;
    ownerWalletAddress: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    lastLogs?: Array<{ timestamp: string; message: string }>;
    lastTrades?: Array<{
      id: string;
      timestamp: string;
      tradeType: string;
      amount: number;
      token: string;
      transactionSignature?: string;
    }>;
    tokenName?: string;
    tokenSymbol?: string;
    user?: {
      id: string;
      username: string;
      email: string;
    };
  }>>([]);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseTitle, setResponseTitle] = useState('');
  const { showSuccess, showError } = useToast();

  const updateBotUserWalletInState = useCallback((botId: string, userWallet: string) => {
    setBots((prevBots) =>
      prevBots.map((existingBot) =>
        existingBot.id === botId ? { ...existingBot, userWallet } : existingBot
      )
    );
  }, []);

  const fetchBots = useCallback(async () => {
    try {
      console.log("Fetching bots with params:", { currentPage, statusFilter, deletedFilter });

      // Pass parameters as an object instead of a string
      const params = {
        page: currentPage,
        limit: 20,
        status: statusFilter,
        deleted: deletedFilter
      };

      const response = await adminApiService.getBotsWithLastData(params);

      console.log("Raw response:", response);
      console.log("Response type:", typeof response);
      console.log("Response.data:", response?.data);
      console.log("Response.data type:", typeof response?.data);

      // Check if response and response.data exist
      if (response && response.data) {
        console.log("Bots data:", response.data);

        // Safely extract data with fallbacks
        const botsData = response.data.bots || [];
        const paginationData = response.data.pagination || {
          page: currentPage,
          limit: 20,
          total: 0,
          totalPages: 1
        };

        console.log("Extracted bots data:", botsData);
        console.log("Extracted pagination data:", paginationData);

        setBots(botsData);
        setPagination(paginationData);
        setTotalPages(paginationData.totalPages || 1);
      } else {
        console.warn("Invalid response structure:", response);
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
      console.error("Error fetching bots:", error);
      console.error("Error type:", typeof error);
      console.error("Error stringified:", JSON.stringify(error, null, 2));

      // Set default values on error
      setBots([]);
      setPagination({
        page: currentPage,
        limit: 20,
        total: 0,
        totalPages: 1
      });
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, deletedFilter]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);
  const handleDelete = async (id: string, botName?: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the bot "${botName || 'this bot'}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("Deleting bot:", id);
      const res = await adminApiService.deleteBot(id);
      console.log("Bot deleted:", res);

      // Show success notification
      showSuccess("Bot deleted successfully!");

      // Refresh the bots list
      await fetchBots();
    } catch (err) {
      console.error("Error deleting bot:", err);

      // Show error notification
      const errorMessage = err instanceof Error ? err.message : "Failed to delete bot";
      showError(`Error: ${errorMessage}`);
    }
  };

  const handleStopAllBots = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to stop all running bots? This action will stop all currently running bots.'
    );

    if (!confirmed) return;

    setIsBulkOperating(true);
    try {
      const response = await adminApiService.stopRunningBot();
      const { message, botstoppedData } = response.data;

      showSuccess(message);
      setResponseDetails((botstoppedData || []) as typeof responseDetails);
      setResponseTitle('Bot Stop Results');
      setShowResponseModal(true);
      fetchBots(); // Refresh the list
    } catch (error) {
      console.error('Error stopping bots:', error);
      showError('Failed to stop bots');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleStartAllBots = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to start all stopped bots? This action will start all bots that were stopped by admin.'
    );

    if (!confirmed) return;

    setIsBulkOperating(true);
    try {
      const response = await adminApiService.startRunningBot();
      const { message, botstartedData } = response.data;

      showSuccess(message);
      setResponseDetails((botstartedData || []) as typeof responseDetails);
      setResponseTitle('Bot Start Results');
      setShowResponseModal(true);
      fetchBots(); // Refresh the list
    } catch (error) {
      console.error('Error starting bots:', error);
      showError('Failed to start bots');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBackfillAllEligibleBots = async () => {
    const confirmed = window.confirm(
      'Run global wallet backfill for all bots where userWallet is empty and firstFundAdd=true?'
    );
    if (!confirmed) return;

    setIsBulkBackfillingWallets(true);
    try {
      const response = await adminApiService.backfillAllBotUserWallets(false, true);
      const totals = response.data?.totals;
      const results = response.data?.results || [];

      results.forEach((result) => {
        if (result?.derivedUserWallet && result?.botId) {
          updateBotUserWalletInState(String(result.botId), result.derivedUserWallet);
        }
      });

      if (totals) {
        const { success, failed, skipped, candidates } = totals;
        if (failed === 0) {
          showSuccess(
            `Global backfill done: ${success}/${candidates} success` +
              (skipped > 0 ? `, ${skipped} skipped` : '')
          );
        } else {
          showError(
            `Global backfill done: ${success} success, ${failed} failed` +
              (skipped > 0 ? `, ${skipped} skipped` : '')
          );
        }
      } else {
        showSuccess('Global wallet backfill completed');
      }

      await fetchBots();
    } catch (error: unknown) {
      const maybeError = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      const apiMessage =
        maybeError?.response?.data?.error || maybeError?.response?.data?.message;
      showError(apiMessage || 'Global wallet backfill failed');
    } finally {
      setIsBulkBackfillingWallets(false);
    }
  };


  // const getStatusColor = (status: string | undefined) => {
  //   if (!status) return "bg-gray-500/20 text-gray-400";

  //   switch (status) {
  //     case "running":
  //       return "bg-green-500/20 text-green-400";
  //     case "warning":
  //       return "bg-yellow-500/20 text-yellow-400";
  //     case "stopped":
  //       return "bg-red-500/20 text-red-400";
  //     case "error":
  //       return "bg-red-500/20 text-red-400";
  //     case "refunding":
  //       return "bg-orange-500/20 text-orange-400";
  //     case "refunded":
  //       return "bg-blue-500/20 text-blue-400";
  //     default:
  //       return "bg-gray-500/20 text-gray-400";
  //   }
  // };

  // const getStatusIcon = (status: string | undefined) => {
  //   if (!status) return <BotIcon className="h-4 w-4" />;

  //   switch (status) {
  //       case "running":
  //         return <Play className="h-4 w-4" />;
  //       case "warning":
  //         return <AlertCircle className="h-4 w-4" />;
  //       case "stopped":
  //         return <StopCircle className="h-4 w-4" />;
  //       case "error":
  //         return <AlertCircle className="h-4 w-4" />;
  //       case "refunding":
  //         return <Activity className="h-4 w-4" />;
  //       case "refunded":
  //         return <CheckCircle className="h-4 w-4" />;
  //       default:
  //         return <BotIcon className="h-4 w-4" />;
  //     }
  // };

  const BotCardAdmin = ({ bot }: { bot: Bot }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBackfillingWallet, setIsBackfillingWallet] = useState(false);

    if (!bot) return null;

    const handleCopy = (text: string, field: string) => {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    };

    const getStatusBadge = (status: string | undefined) => {
      const statusConfig: Record<string, { color: string; icon: string }> = {
        running: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '▶' },
        stopped: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '⏹' },
        paused: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⏸' },
        error: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '' },
        refunded: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '' },
        refunding: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '' }
      };

      const config = statusConfig[status || 'stopped'] || statusConfig.stopped;

      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color} shadow-sm`}>
          <span className="text-xs">{config.icon}</span>
          <span className="capitalize text-xs">{status || "stopped"}</span>
        </span>
      );
    };

    const canBackfillUserWallet =
      !bot.userWallet &&
      !!bot.middleWalletAddress &&
      bot.firstFundAdd === true;

    const handleBackfillUserWallet = async () => {
      if (!canBackfillUserWallet || isBackfillingWallet) return;

      try {
        setIsBackfillingWallet(true);
        const response = await adminApiService.backfillBotUserWallet(bot.id);
        const derivedWallet = response.data?.derivedUserWallet;
        if (derivedWallet) {
          updateBotUserWalletInState(bot.id, derivedWallet);
        }
        showSuccess(
          derivedWallet
            ? `Bot ${bot.id}: user wallet updated (${derivedWallet})`
            : `Bot ${bot.id}: user wallet updated`
        );
      } catch (error: unknown) {
        const maybeError = error as {
          response?: { data?: { error?: string; message?: string } };
        };
        const apiMessage =
          maybeError?.response?.data?.error || maybeError?.response?.data?.message;
        showError(apiMessage || `Bot ${bot.id}: failed to backfill user wallet`);
      } finally {
        setIsBackfillingWallet(false);
      }
    };

    return (
      <div className="bg-gray-800/80 rounded-lg p-3 border border-gray-700/50 hover:border-gray-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20 group">
        {/* Header Section - Optimized Layout */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Bot Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 ring-1 ring-green-500/20">
              <BotIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-white truncate">
                {bot.botName || "Unnamed Bot"}
              </h3>
              <Link href={`/admin/users/${bot.user?.id}`} className="text-xs text-blue-400 truncate block hover:text-blue-300 transition-colors">
                <span className="hover:underline">{bot.user?.email || 'No description'}</span>
              </Link>
              {(bot.user?.platform || bot.user?.device || bot.user?.country) && (
                <div className="flex items-center gap-1 flex-wrap mt-1">
                  {bot.user?.platform && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 px-1.5 py-0.5 bg-gray-700/40 rounded border border-gray-600/30">
                      {bot.user.platform === 'mobile' ? (
                        <Smartphone className="h-3 w-3 text-blue-400" />
                      ) : (
                        <Monitor className="h-3 w-3 text-purple-400" />
                      )}
                      <span className="font-medium">{bot.user.platform}</span>
                    </span>
                  )}
                  {bot.user?.device && (
                    <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-700/40 rounded border border-gray-600/30 font-medium">
                      {bot.user.device}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-1 px-1.5 py-0.5 bg-gray-700/40 rounded border border-gray-600/30">
                    <MapPin className="h-3 w-3 text-amber-400" />
                    <span className="font-medium">{bot.user?.country || 'N/A'}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status & Fund/Recharge Status */}
          <div className="flex flex-col gap-2 items-end">
            {getStatusBadge(bot.status)}
            <div className="flex gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 border border-gray-700/50 rounded">
                <div className={`w-2 h-2 rounded-full ${bot?.firstFundAdd ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-300">Fund</span>
                {bot?.firstFundAdd ? (
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                ) : (
                  <X className="h-3 w-3 text-red-400" />
                )}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 border border-gray-700/50 rounded">
                <div className={`w-2 h-2 rounded-full ${bot?.firstRechageDate ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-300">Recharge</span>
                {bot?.firstRechageDate ? (
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                ) : (
                  <X className="h-3 w-3 text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Wallet Information - Optimized Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {/* Engine & Token */}
          <div className="text-center p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-gray-400 text-xs mb-1">Engine</p>
            <p className="text-white font-bold text-sm">{bot.engine || 0}</p>
          </div>
          <div className="text-center p-2 bg-gray-700/30 rounded border border-gray-600/30">
            {/* <p className="text-gray-400 text-xs mb-1">Token</p> */}
            {/* <p className="text-white font-bold text-xs truncate">
              {bot?.tokenSymbol || "N/A"}
            </p> */}
            <p className="text-gray-400 text-xs mb-1">Created</p>
          <p className="text-white font-bold text-xs">
            {bot.createdAt
              ? new Date(bot.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : "Unknown"}
          </p>
          </div>
          
          {/* User Wallet */}
          <div className="p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">User Wallet</p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-gray-300 font-mono truncate flex-1">
                {bot.userWallet ? `${bot.userWallet.slice(0, 6)}...${bot.userWallet.slice(-6)}` : 'N/A'}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => bot.userWallet && handleCopy(bot.userWallet, 'userWallet')}
                  className={`p-0.5 rounded transition-colors ${copiedField === 'userWallet' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                  title="Copy user wallet"
                  disabled={!bot.userWallet}
                >
                  {copiedField === 'userWallet' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
                <Link
                  href={`https://solscan.io/address/${bot.userWallet}`}
                  target="_blank"
                  className="p-0.5 text-gray-400 hover:text-blue-400 rounded transition-colors"
                  title="View on Solscan"
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bot Wallet */}
          <div className="p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Bot Wallet</p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-gray-300 font-mono truncate flex-1">
                {bot.ownerWalletAddress ? `${bot.ownerWalletAddress.slice(0, 6)}...${bot.ownerWalletAddress.slice(-6)}` : 'N/A'}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => bot.ownerWalletAddress && handleCopy(bot.ownerWalletAddress, 'botWallet')}
                  className={`p-0.5 rounded transition-colors ${copiedField === 'botWallet' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                  title="Copy bot wallet"
                  disabled={!bot.ownerWalletAddress}
                >
                  {copiedField === 'botWallet' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
                <Link
                  href={`https://solscan.io/address/${bot.ownerWalletAddress}`}
                  target="_blank"
                  className="p-0.5 text-gray-400 hover:text-blue-400 rounded transition-colors"
                  title="View on Solscan"
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Wallet Information - Horizontal Layout */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Middle Wallet */}
          <div className="p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Middle Wallet</p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-gray-300 font-mono truncate flex-1">
                {bot.middleWalletAddress ? `${bot.middleWalletAddress.slice(0, 6)}...${bot.middleWalletAddress.slice(-6)}` : 'N/A'}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => bot.middleWalletAddress && handleCopy(bot.middleWalletAddress, 'middleWallet')}
                  className={`p-0.5 rounded transition-colors ${copiedField === 'middleWallet' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                  title="Copy middle wallet"
                  disabled={!bot.middleWalletAddress}
                >
                  {copiedField === 'middleWallet' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
                <Link
                  href={`https://solscan.io/address/${bot.middleWalletAddress}`}
                  target="_blank"
                  className="p-0.5 text-gray-400 hover:text-blue-400 rounded transition-colors"
                  title="View on Solscan"
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Token Address */}
          <div className="p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Token <span className="text-white font-bold text-xs truncate">
              {bot?.tokenSymbol || "N/A"}
            </span></p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-gray-300 font-mono truncate flex-1">
                {bot.tokenAddress ? `${bot.tokenAddress.slice(0, 6)}...${bot.tokenAddress.slice(-6)}` : 'N/A'}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => bot.tokenAddress && handleCopy(bot.tokenAddress, 'tokenAddress')}
                  className={`p-0.5 rounded transition-colors ${copiedField === 'tokenAddress' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                  title="Copy token address"
                  disabled={!bot.tokenAddress}
                >
                  {copiedField === 'tokenAddress' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
                <Link
                  href={`https://dexscreener.com/solana/${bot.tokenAddress}`}
                  target="_blank"
                  className="p-0.5 text-gray-400 hover:text-blue-400 rounded transition-colors"
                  title="View on DexScreener"
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
          {/* Last Log */}
          {bot?.lastLogs && bot.lastLogs.length > 0 ? (
            <div className="p-2 bg-gray-700/30 rounded border border-gray-600/30">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-500/20 rounded">
                  <Activity className="h-3 w-3 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate" title={bot.lastLogs[bot.lastLogs.length - 1].message}>
                    {bot.lastLogs[bot.lastLogs.length - 1].message}
                  </p>
                </div>
                {bot.lastLogs[bot.lastLogs.length - 1].level && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${bot.lastLogs[bot.lastLogs.length - 1].level === 'error' ? 'bg-red-500/20 text-red-400' :
                      bot.lastLogs[bot.lastLogs.length - 1].level === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        bot.lastLogs[bot.lastLogs.length - 1].level === 'info' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                    }`}>
                    {bot.lastLogs[bot.lastLogs.length - 1].level}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(bot.lastLogs[bot.lastLogs.length - 1].timestamp).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-gray-700/20 rounded border border-gray-600/20">
              <div className="p-1 bg-gray-500/20 rounded">
                <Activity className="h-3 w-3 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">No recent logs</span>
            </div>
          )}

          {/* Last Trade */}
          {bot?.lastTrades && bot.lastTrades.length > 0 ? (
            <div className="p-2 bg-gray-700/30 rounded border border-gray-600/30">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-500/20 rounded">
                  <Wallet className="h-3 w-3 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${bot.lastTrades[bot.lastTrades.length - 1].tradeType === 'buy' ? 'bg-green-500/20 text-green-400' :
                        bot.lastTrades[bot.lastTrades.length - 1].tradeType === 'sell' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                      }`}>
                      {bot.lastTrades[bot.lastTrades.length - 1].tradeType?.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-300">
                      {bot.lastTrades[bot.lastTrades.length - 1].amount} {bot.lastTrades[bot.lastTrades.length - 1].token}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(bot.lastTrades[bot.lastTrades.length - 1].timestamp).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-gray-700/20 rounded border border-gray-600/20">
              <div className="p-1 bg-gray-500/20 rounded">
                <Wallet className="h-3 w-3 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">No recent trades</span>
            </div>
          )}
        </div>

        {/* Created Date */}
        

        {/* Action Buttons - Optimized Layout */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-700/30">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackfillUserWallet}
              disabled={!canBackfillUserWallet || isBackfillingWallet}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                canBackfillUserWallet
                  ? 'Set user wallet from first inbound fund on middle wallet'
                  : 'Available when user wallet is empty, middle wallet exists, and fund is added'
              }
            >
              {isBackfillingWallet ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Backfilling</span>
                </>
              ) : (
                <>
                  <Wallet className="h-3 w-3" />
                  <span>Backfill Wallet</span>
                </>
              )}
            </button>
            <Link
              href={`/admin/bots/${bot.id}/trade-wallets`}
              className={`inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setIsLoading(true)}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  <span>Loading</span>
                </>
              ) : (
                <>
                  <Wallet className="h-3 w-3" />
                  <span>Trade Wallets</span>
                </>
              )}
            </Link>
            
            <Link
              href={`/admin/bots/${bot.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-all duration-200"
            >
              <BotIcon className="h-3 w-3" />
              <span>Details</span>
            </Link>
            
            <Link
              href={`/admin/bots/${bot.id}/logs`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-all duration-200"
            >
              <Activity className="h-3 w-3" />
              <span>Logs</span>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {bot.lastTradeAt && (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span className="hidden sm:inline">Last: </span>
                {new Date(bot.lastTradeAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
            )}

            {bot.userWallet && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Wallet Found
              </span>
            )}

            {bot.deletedAt && (
              <span className="flex items-center gap-1 text-red-400">
                <Trash2 className="h-3 w-3 cursor-pointer" onClick={() => handleDelete(bot.id, bot.botName)} />
                {new Date(bot.deletedAt).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Pagination = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-400">
        Showing {(currentPage - 1) * 20 + 1} to{" "}
        {Math.min(currentPage * 20, pagination.total)} of {pagination.total}{" "}
        bots
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
              className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === page
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
            <h1 className="text-4xl font-bold text-white mb-2">Bots Management</h1>
            <p className="text-gray-400 text-lg">
              Monitor and manage trading bots
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              Total: {pagination.total || 0} bots
            </span>

            {/* Bulk Control Buttons */}
            <button
              onClick={handleStopAllBots}
              disabled={isBulkOperating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              {isBulkOperating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>Stop All Running</span>
            </button>

            <button
              onClick={handleStartAllBots}
              disabled={isBulkOperating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              {isBulkOperating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Start All Stopped</span>
            </button>

            <button
              onClick={handleBackfillAllEligibleBots}
              disabled={isBulkBackfillingWallets}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              {isBulkBackfillingWallets ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              <span>Fetch User Wallet (Global)</span>
            </button>

            <Link
              href="/admin/bots/logs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Activity className="h-4 w-4" />
              <span>View All Logs</span>
            </Link>
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
                <option value="stopped">Stopped</option>
                <option value="refunding">Refunding</option>
                <option value="refunded">Refunded</option>
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
          {bots.map((bot) => (
            <BotCardAdmin key={bot.id} bot={bot} />
          ))}
        </div>

        {/* Empty State */}
        {bots.length === 0 && !loading && (
          <div className="text-center py-12">
            <BotIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No bots found
            </h3>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {bots.length > 0 && (
          <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <Pagination />
          </div>
        )}

        {/* Response Details Modal */}
        {showResponseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">{responseTitle}</h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {responseDetails.length > 0 ? (
                  responseDetails.map((bot, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-white">
                          {bot.botName || `Bot ${bot.botId}`}
                        </h4>
                        <span className={`px-2 py-1 rounded text-sm ${bot.message.includes('successfully')
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300'
                          }`}>
                          {bot.message.includes('successfully') ? 'Success' : 'Failed'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Bot ID:</p>
                          <p className="text-white font-mono">{bot.botId}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Token Address:</p>
                          <p className="text-white font-mono text-xs break-all">{bot.tokenAddress}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Engine:</p>
                          <p className="text-white">{bot.engine}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Status:</p>
                          <p className="text-white">{bot.status}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Token Name:</p>
                          <p className="text-white">{bot.tokenName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Token Symbol:</p>
                          <p className="text-white">{bot.tokenSymbol || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-gray-400">Owner Wallet:</p>
                          <p className="text-white font-mono text-xs break-all">{bot.ownerWalletAddress}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Created:</p>
                          <p className="text-white">
                            {bot.createdAt ? new Date(bot.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Updated:</p>
                          <p className="text-white">
                            {bot.updatedAt ? new Date(bot.updatedAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {bot.lastLogs && bot.lastLogs.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-400 mb-2">Recent Logs:</p>
                          <div className="bg-gray-600 rounded p-2 max-h-32 overflow-y-auto">
                            {bot.lastLogs.slice(-3).map((log: { timestamp: string; message: string }, logIndex: number) => (
                              <div key={logIndex} className="text-xs text-gray-300 mb-1">
                                <span className="text-gray-500">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}:
                                </span>
                                <span className="ml-2">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {bot.lastTrades && bot.lastTrades.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-400 mb-2">Recent Trades:</p>
                          <div className="bg-gray-600 rounded p-2 max-h-32 overflow-y-auto">
                            {bot.lastTrades.slice(-3).map((trade: { id: string; timestamp: string; tradeType: string; amount: number; token: string; transactionSignature?: string }, tradeIndex: number) => (
                              <div key={tradeIndex} className="text-xs text-gray-300 mb-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1 py-0.5 rounded text-xs ${trade.tradeType === 'buy' ? 'bg-green-500/20 text-green-400' :
                                      trade.tradeType === 'sell' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {trade.tradeType?.toUpperCase()}
                                  </span>
                                  <span>{trade.amount} {trade.token}</span>
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No bot data available</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
