"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import adminApiService, { HolderBot } from "../../../utils/adminApiService";
import {
  Bot as BotIcon,
  Activity,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  CheckCircle2,
  X
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast/ToastContext";

export default function AdminHolderBots() {
  const [bots, setBots] = useState<HolderBot[]>([]);
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
  const { showError } = useToast();

  const fetchBots = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: 20,
        status: statusFilter,
        deleted: deletedFilter
      };
      const response = await adminApiService.getHolderBots(params);
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
      console.error("Error fetching holder bots:", error);
      setBots([]);
      setPagination({
        page: currentPage,
        limit: 20,
        total: 0,
        totalPages: 1
      });
      setTotalPages(1);
      showError("Failed to fetch holder bots");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, deletedFilter, showError]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusConfig: Record<string, { color: string }> = {
      running: { color: "bg-green-500/20 text-green-400 border-green-500/30" },
      stopped: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
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
        Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, pagination.total)} of {pagination.total} holder bots
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
            <h1 className="text-4xl font-bold text-white mb-2">Holder Bots</h1>
            <p className="text-gray-400 text-lg">Monitor and manage holder distribution bots</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Total: {pagination.total || 0} holder bots</span>
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
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-gray-800/80 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/60 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20 hover:scale-[1.01] group"
            >
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                {/* Bot Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ring-emerald-500/20">
                    <BotIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white truncate">{bot.botName || "Holder Bot"}</h3>
                    </div>
                    {bot.user?.email && (
                      <Link
                        href={`/admin/users/${bot.user?.id}`}
                        className="text-sm text-blue-400 truncate block hover:text-blue-300 transition-colors mb-3 group"
                      >
                        <span className="group-hover:underline">{bot.user?.email}</span>
                      </Link>
                    )}
                  </div>
                </div>
                {/* Status & Fund Status */}
                <div className="flex flex-col gap-2 lg:items-end">
                  {getStatusBadge(bot.status)}
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 border border-gray-700/50 rounded">
                      <div className={`w-2 h-2 rounded-full ${bot?.fundAdded ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-xs text-gray-300">Fund</span>
                      {bot?.fundAdded ? (
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                      ) : (
                        <X className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-gray-400">
                    <div>Created: {new Date(bot.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
                    <div>Updated: {new Date(bot.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
                  </div>
                </div>
              </div>

              {/* Wallets */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/40 transition-colors">
                  <p className="text-gray-400 mb-2 text-xs font-medium">Processed</p>
                  <p className="text-white font-bold text-lg">{bot.holdersProcessed ?? 0}</p>
                </div>
                <div className="text-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/40 transition-colors">
                  <p className="text-gray-400 mb-2 text-xs font-medium">Token</p>
                  <p className="text-white font-bold text-sm">
                    {bot.tokenName || "Unknown Token"} ({bot.tokenSymbol || "UNKNOWN"})
                  </p>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/40 transition-colors">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Owner Wallet</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-300 font-mono truncate flex-1">
                      {bot.ownerWalletAddress ? `${bot.ownerWalletAddress.slice(0, 6)}...${bot.ownerWalletAddress.slice(-6)}` : "N/A"}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => bot.ownerWalletAddress && handleCopy(bot.ownerWalletAddress, "ownerWallet")}
                        className={`p-1 rounded transition-colors ${copiedField === "ownerWallet" ? "text-green-400" : "text-gray-400 hover:text-white"}`}
                        title="Copy owner wallet"
                        disabled={!bot.ownerWalletAddress}
                      >
                        {copiedField === "ownerWallet" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
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
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/40 transition-colors">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Mint Address</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-300 font-mono truncate flex-1">
                      {bot.mintAddress ? `${bot.mintAddress.slice(0, 6)}...${bot.mintAddress.slice(-6)}` : "N/A"}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => bot.mintAddress && handleCopy(bot.mintAddress, "mintAddress")}
                        className={`p-1 rounded transition-colors ${copiedField === "mintAddress" ? "text-green-400" : "text-gray-400 hover:text-white"}`}
                        title="Copy mint address"
                        disabled={!bot.mintAddress}
                      >
                        {copiedField === "mintAddress" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <Link
                        href={`https://solscan.io/address/${bot.mintAddress}`}
                        target="_blank"
                        className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-600/50 rounded transition-colors"
                        title="View on Solscan"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700/30">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Activity className="h-3 w-3" />
                  <span>Index: {bot.lastHolderWalletIndex ?? 0}</span>
                </div>
                {bot.deletedAt && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <Trash2 className="h-3 w-3" />
                    {new Date(bot.deletedAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "short",
                      timeStyle: "short"
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {bots.length === 0 && !loading && (
          <div className="text-center py-12">
            <BotIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No holder bots found</h3>
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

