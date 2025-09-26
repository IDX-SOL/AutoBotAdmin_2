"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import adminApiService, { Bot } from "../../../utils/adminApiService";
import {
  Bot as BotIcon,
  Activity,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Wallet,
  Trash2,
  Smartphone,
  Monitor,
  X,
  CheckCircle2,
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
  const { showSuccess, showError } = useToast();

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

      const response = await adminApiService.getBots(params);

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

    if (!bot) return null;

    // console.log("Rendering bot card:", bot);

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
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
          <span className="text-xs">{config.icon}</span>
          <span className="capitalize text-xs">{status || "stopped"}</span>
        </span>
      );
    };

    return (
      <div className="bg-gray-800/80 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/60 transition-all duration-200 hover:shadow-md">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <BotIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-white truncate max-w-32">
                  {bot.botName || "Unnamed Bot"}
                </h3>
                {getStatusBadge(bot.status)}
              </div>
              <Link href={`/admin/users/${bot.user?.id}`} className="text-xs text-blue-400 truncate max-w-40">
                {bot.user?.email || 'No description'}
              </Link>
              {(bot.user?.platform || bot.user?.device) && (
                <div className="flex items-center gap-2 mt-1">
                  {bot.user?.platform && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {bot.user.platform === 'mobile' ? (
                        <Smartphone className="h-3 w-3" />
                      ) : (
                        <Monitor className="h-3 w-3" />
                      )}
                      {bot.user.platform}
                    </span>
                  )}
                  {bot.user?.device && (
                    <span className="text-xs text-gray-500">
                      {bot.user.device}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-md">
               {/* Fund Add Status */}
               <div className="flex items-center gap-1.5">
                 <div className={`w-2 h-2 rounded-full ${bot?.firstFundAdd ? 'bg-green-400' : 'bg-red-400'}`}></div>
                 <span className="text-xs font-medium text-gray-300">FundAdd</span>
                 {bot?.firstFundAdd ? (
                   <CheckCircle2 className="h-3 w-3 text-green-400" />
                 ) : (
                   <X className="h-3 w-3 text-red-400" />
                 )}
               </div>
               
               {/* Separator */}
               <div className="w-px h-4 bg-gray-600"></div>
               
               {/* Recharge Status */}
               <div className="flex items-center gap-1.5">
                 <div className={`w-2 h-2 rounded-full ${bot?.firstRechageDate ? 'bg-green-400' : 'bg-red-400'}`}></div>
                 <span className="text-xs font-medium text-gray-300">Recharge</span>
                 {bot?.firstRechageDate ? (
                   <CheckCircle2 className="h-3 w-3 text-green-400" />
                 ) : (
                   <X className="h-3 w-3 text-red-400" />
                 )}
               </div>
             </div>
          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-center">
              <p className="text-gray-400">Engine</p>
              <p className="text-white font-semibold">{bot.engine || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Token</p>
              <p className="text-white font-semibold truncate max-w-16">
                {bot?.tokenSymbol || "N/A"}
              </p>
            </div>


          </div>
        </div>

        {/* Compact Wallet Info */}
        <div className="grid xl:grid-cols-4 grid-cols-2 gap-2 mb-3">

          <div className="text-center p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">User Wallet</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-gray-300 font-mono">
                {bot.userWallet ? `${bot.userWallet.slice(0, 4)}...${bot.userWallet.slice(-4)}` : 'N/A'}
              </span>
              <button
                onClick={() => bot.userWallet && handleCopy(bot.userWallet, 'userWallet')}
                className={`p-1 rounded transition-colors ${copiedField === 'userWallet' ? 'text-green-400' : 'text-gray-400 hover:text-white'
                  }`}
                title="Copy user wallet"
                disabled={!bot.userWallet}
              >
                {copiedField === 'userWallet' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
              <Link
                href={`https://solscan.io/address/${bot.userWallet}`}
                target="_blank"
                className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600/50 rounded transition-colors"
                title="View on Solscan"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="text-center p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Bot Wallet</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-gray-300 font-mono">
                {bot.ownerWalletAddress ? `${bot.ownerWalletAddress.slice(0, 4)}...${bot.ownerWalletAddress.slice(-4)}` : 'N/A'}
              </span>
              <button
                onClick={() => bot.ownerWalletAddress && handleCopy(bot.ownerWalletAddress, 'botWallet')}
                className={`p-1 rounded transition-colors ${copiedField === 'botWallet' ? 'text-green-400' : 'text-gray-400 hover:text-white'
                  }`}
                title="Copy bot wallet"
                disabled={!bot.ownerWalletAddress}
              >
                {copiedField === 'botWallet' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
              <Link
                href={`https://solscan.io/address/${bot.ownerWalletAddress}`}
                target="_blank"
                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-600/50 rounded transition-colors"
                title="View on Solscan"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="text-center p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Bot Middle Wallet</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-gray-300 font-mono">
                {bot.middleWalletAddress ? `${bot.middleWalletAddress.slice(0, 4)}...${bot.middleWalletAddress.slice(-4)}` : 'N/A'}
              </span>
              <button
                onClick={() => bot.middleWalletAddress && handleCopy(bot.middleWalletAddress, 'botWallet')}
                className={`p-1 rounded transition-colors ${copiedField === 'botWallet' ? 'text-green-400' : 'text-gray-400 hover:text-white'
                  }`}
                title="Copy bot wallet"
                disabled={!bot.middleWalletAddress}
              >
                {copiedField === 'botWallet' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
              <Link
                href={`https://solscan.io/address/${bot.middleWalletAddress}`}
                target="_blank"
                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-600/50 rounded transition-colors"
                title="View on Solscan"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="text-center p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Token</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-gray-300 font-mono">
                {bot.tokenAddress ? `${bot.tokenAddress.slice(0, 4)}...${bot.tokenAddress.slice(-4)}` : 'N/A'}
              </span>
              <button
                onClick={() => bot.tokenAddress && handleCopy(bot.tokenAddress, 'tokenAddress')}
                className={`p-1 rounded transition-colors ${copiedField === 'tokenAddress' ? 'text-green-400' : 'text-gray-400 hover:text-white'
                  }`}
                title="Copy token address"
                disabled={!bot.tokenAddress}
              >
                {copiedField === 'tokenAddress' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
              <Link
                href={`https://dexscreener.com/solana/${bot.tokenAddress}`}
                target="_blank"
                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-600/50 rounded transition-colors"
                title="View on DexScreener"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* <div className="text-center p-2 bg-gray-700/30 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Bot Logs</p>
            <div className="flex items-center justify-center gap-1">
              <Link
                href={`/admin/bots/${bot.id}/logs`}
                className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-600/50 rounded transition-colors"
                title="View Bot Logs"
              >
                <Activity className="h-3 w-3" />
              </Link>
              <Link
                href={`/admin/bots/${bot.id}/logs?type=error`}
                className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600/50 rounded transition-colors"
                title="View Error Logs"
              >
                <AlertCircle className="h-3 w-3" />
              </Link>
              <Link
                href={`/admin/bots/${bot.id}/logs?type=trade`}
                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-600/50 rounded transition-colors"
                title="View Trade Logs"
              >
                <CheckCircle className="h-3 w-3" />
              </Link>
            </div>
          </div> */}
        </div>

        {/* Bottom Row - User Info & Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">

            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {bot.createdAt
                ? new Date(bot.createdAt).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })
                : "Unknown"}
            </span>
            {bot.lastTradeAt && (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Last: {new Date(bot.lastTradeAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
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
          {/* <div className="text-center">
              <p className="text-gray-400">First Rechage</p>
              <p className="text-white font-semibold truncate max-w-16">
                {bot?.firstRechageDate?"Yes":"No"}
              </p>
            </div> */}
           <div className="flex items-center gap-2">
             
            
            <Link
              href={`/admin/bots/${bot.id}/trade-wallets`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
          
            {/* <Link
              href={`/admin/bots/${bot.id}/trade-wallets`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
            </Link> */}

            <Link
              href={`/admin/bots/${bot.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors"
            >
              <BotIcon className="h-3 w-3" />
              <span>View Details</span>
            </Link>
            <Link
              href={`/admin/bots/${bot.id}/logs`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
            >
              <Activity className="h-3 w-3" />
              <span>View Logs</span>
            </Link>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Bots Management</h1>
            <p className="text-gray-400 mt-2">
              Monitor and manage trading bots
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              Total: {pagination.total || 0} bots
            </span>
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
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1">

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <Pagination />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

