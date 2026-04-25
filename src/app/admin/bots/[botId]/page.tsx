'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, { Bot } from '@/utils/adminApiService';
import {
  Bot as BotIcon,
  Activity,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  User,
  Smartphone,
  Monitor,
  MapPin,
  ArrowLeft,
  Zap,
  Shield,
  AlertTriangle,
  Info,
  BarChart3,
  FileText,
  Coins,
  Hash,
  Bell
} from 'lucide-react';
import { useToast } from '@/components/Toast/ToastContext';
import Link from 'next/link';

interface LogEntry {
  timestamp: string;
  message: string;
  type?: string;
  [key: string]: unknown;
}

interface TradeEntry {
  id: string;
  timestamp: string;
  tradeType: 'buy' | 'sell';
  amount: number;
  token: string;
  price?: number;
  transactionSignature?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface WarningEntry {
  timestamp: string;
  message: string;
  details?: unknown;
  [key: string]: unknown;
}

interface ErrorEntry {
  timestamp: string;
  message: string;
  [key: string]: unknown;
}

interface GasFees {
  [key: string]: number | string;
}

interface BotDetailData extends Omit<Bot, 'gasFees'> {
  lastLogs?: LogEntry[];
  lastTrades?: TradeEntry[];
  warnings?: WarningEntry[];
  errors?: ErrorEntry[];
  balanceInfo?: {
    sol: number;
    token: number;
    lastUpdated: string | null;
    critical: boolean;
  };
  gasFees?: GasFees;
  notificationStates?: {
    lowBalance0_3?: boolean;
    lowBalance1_5: boolean;
    lowBalance2_25: boolean;
    lowBalance2_5: boolean;
  };
  firstRechageDate?: boolean;
  middleWalletAddress?: string;
  middleWalletPrivateKey?: string;
  ownerWalletPrivateKey?: string;
}

export default function BotDetailPage() {
  const params = useParams();
  const { showSuccess, showError } = useToast();
  const botId = params.botId as string;
  
  const [bot, setBot] = useState<BotDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [backfillingWallet, setBackfillingWallet] = useState(false);

  const fetchBotDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getBot(botId);
      setBot(response.data as BotDetailData);
    } catch (error) {
      console.error('Error fetching bot details:', error);
      showError('Failed to fetch bot details');
    } finally {
      setLoading(false);
    }
  }, [botId, showError]);

  useEffect(() => {
    if (botId) {
      fetchBotDetails();
    }
  }, [botId, fetchBotDetails]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBotDetails();
    setRefreshing(false);
    showSuccess('Bot data refreshed');
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const canBackfillUserWallet =
    !!bot &&
    !bot.userWallet &&
    !!bot.middleWalletAddress &&
    bot.firstFundAdd === true;

  const handleBackfillUserWallet = async () => {
    if (!bot || !canBackfillUserWallet || backfillingWallet) return;

    try {
      setBackfillingWallet(true);
      const response = await adminApiService.backfillBotUserWallet(bot.id);
      const derivedWallet = response.data?.derivedUserWallet;

      showSuccess(
        derivedWallet
          ? `User wallet updated: ${derivedWallet}`
          : 'User wallet backfill completed successfully'
      );
      await fetchBotDetails();
    } catch (error: unknown) {
      const maybeError = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      const apiMessage =
        maybeError?.response?.data?.error || maybeError?.response?.data?.message;
      showError(apiMessage || 'Failed to backfill user wallet');
    } finally {
      setBackfillingWallet(false);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusConfig: Record<string, { color: string; icon: string; bgColor: string }> = {
      running: { color: 'text-green-400', icon: '▶', bgColor: 'bg-green-500/20 border-green-500/30' },
      stopped: { color: 'text-blue-400', icon: '⏹', bgColor: 'bg-blue-500/20 border-blue-500/30' },
      paused: { color: 'text-yellow-400', icon: '⏸', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
      error: { color: 'text-red-400', icon: '⚠', bgColor: 'bg-red-500/20 border-red-500/30' },
      warning: { color: 'text-orange-400', icon: '⚠', bgColor: 'bg-orange-500/20 border-orange-500/30' },
      refunded: { color: 'text-gray-400', icon: '✓', bgColor: 'bg-gray-500/20 border-gray-500/30' },
      refunding: { color: 'text-purple-400', icon: '↻', bgColor: 'bg-purple-500/20 border-purple-500/30' }
    };

    const config = statusConfig[status || 'stopped'] || statusConfig.stopped;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.color}`}>
        <span className="text-sm">{config.icon}</span>
        <span className="capitalize">{status || "stopped"}</span>
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };


  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'wallets', name: 'Wallets', icon: Wallet },
    // { id: 'trading', name: 'Trading', icon: TrendingUp },
    { id: 'logs', name: 'Logs', icon: FileText },
    // { id: 'warnings', name: 'Warnings & Errors', icon: AlertTriangle },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'warning': return 'text-orange-400 bg-orange-500/20';
      case 'info': return 'text-blue-400 bg-blue-500/20';
      case 'trade': return 'text-green-400 bg-green-500/20';
      case 'debug': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getFilteredLogs = () => {
    if (!bot?.lastLogs) return [];
    
    let filtered = bot.lastLogs;
    
    // Filter by type
    if (logFilter !== 'all') {
      filtered = filtered.filter(log => log.type === logFilter);
    }
    
    // Search in message
    if (logSearch.trim()) {
      const searchTerm = logSearch.toLowerCase();
      filtered = filtered.filter(log => 
        log.message?.toLowerCase().includes(searchTerm) ||
        log.type?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by timestamp in descending order (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getLogStats = () => {
    if (!bot?.lastLogs) return { total: 0, info: 0, error: 0, warning: 0, trade: 0 };
    
    const stats = { total: bot.lastLogs.length, info: 0, error: 0, warning: 0, trade: 0 };
    bot.lastLogs.forEach(log => {
      if (log.type === 'info') stats.info++;
      else if (log.type === 'error') stats.error++;
      else if (log.type === 'warning') stats.warning++;
      else if (log.type === 'trade') stats.trade++;
    });
    return stats;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!bot) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <BotIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Bot not found</h3>
          <p className="text-gray-400 mb-4">The bot you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link
            href="/admin/bots"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bots
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Link
                href="/admin/bots"
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
              </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BotIcon className="h-8 w-8 text-blue-400" />
                {bot.botName || 'Unnamed Bot'}
              </h1>
              <p className="text-gray-400 mt-1">Bot ID: {bot.id}</p>
            </div>
            {getStatusBadge(bot.status)}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackfillUserWallet}
              disabled={!canBackfillUserWallet || backfillingWallet}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                canBackfillUserWallet
                  ? 'Derive user wallet from first middle-wallet funding transaction'
                  : 'Available only when user wallet is empty, middle wallet exists, and first fund is added'
              }
            >
              <Wallet className={`h-4 w-4 ${backfillingWallet ? 'animate-pulse' : ''}`} />
              {backfillingWallet ? 'Backfilling...' : 'Backfill User Wallet'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
            <div>
                <p className="text-sm font-medium text-gray-400">Status</p>
                <p className="text-xl font-bold text-white capitalize">{bot.status}</p>
              </div>
            </div>
            </div>
            
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <Coins className="h-6 w-6 text-white" />
              </div>
            <div>
                <p className="text-sm font-medium text-gray-400">Token</p>
                <p className="text-xl font-bold text-white">{bot.tokenSymbol || 'N/A'}</p>
              </div>
            </div>
            </div>
            
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
            <div>
                <p className="text-sm font-medium text-gray-400">Engine</p>
                <p className="text-xl font-bold text-white">{bot.engine || 'N/A'}</p>
              </div>
            </div>
            </div>
            
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-600 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            <div>
                <p className="text-sm font-medium text-gray-400">Created</p>
                <p className="text-xl font-bold text-white">
                  {bot.createdAt ? new Date(bot.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Bot Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Bot Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bot Name:</span>
                        <span className="text-white">{bot.botName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Token Name:</span>
                        <span className="text-white">{bot.tokenName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Token Symbol:</span>
                        <span className="text-white">{bot.tokenSymbol || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Engine:</span>
                        <span className="text-white">{bot.engine || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">First Recharge:</span>
                        <span className={`flex items-center gap-1 ${bot.firstRechageDate ? 'text-green-400' : 'text-red-400'}`}>
                          {bot.firstRechageDate ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          {bot.firstRechageDate ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      User Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Username:</span>
                        <span className="text-white">{bot.user?.username || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{bot.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform:</span>
                        <span className="text-white flex items-center gap-1">
                          {bot.user?.platform === 'mobile' ? (
                            <Smartphone className="h-4 w-4" />
                          ) : (
                            <Monitor className="h-4 w-4" />
                          )}
                          {bot.user?.platform || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Device:</span>
                        <span className="text-white">{bot.user?.device || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                          {bot.user?.country || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wallets Tab */}
            {activeTab === 'wallets' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* User Wallet */}
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      User Wallet
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Address</p>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm break-all">
                            {bot.userWallet ? `${bot.userWallet.slice(0, 8)}...${bot.userWallet.slice(-8)}` : 'N/A'}
                          </span>
                          {bot.userWallet && (
                            <>
                              <button
                                onClick={() => handleCopy(bot.userWallet!, 'userWallet')}
                                className="p-1 hover:bg-gray-600 rounded transition-colors"
                                title="Copy address"
                              >
                                {copiedField === 'userWallet' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                              </button>
                              <Link
                                href={`https://solscan.io/address/${bot.userWallet}`}
                                target="_blank"
                                className="p-1 hover:bg-gray-600 rounded transition-colors"
                                title="View on Solscan"
                              >
                                <ExternalLink className="h-4 w-4 text-blue-400" />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bot Wallet */}
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BotIcon className="h-5 w-5" />
                      Bot Wallet
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Address</p>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm break-all">
                            {bot.ownerWalletAddress ? `${bot.ownerWalletAddress.slice(0, 8)}...${bot.ownerWalletAddress.slice(-8)}` : 'N/A'}
                          </span>
                          {bot.ownerWalletAddress && (
                            <>
                              <button
                                onClick={() => handleCopy(bot.ownerWalletAddress!, 'botWallet')}
                                className="p-1 hover:bg-gray-600 rounded transition-colors"
                                title="Copy address"
                              >
                                {copiedField === 'botWallet' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                              </button>
                              <Link
                                href={`https://solscan.io/address/${bot.ownerWalletAddress}`}
                                target="_blank"
                                className="p-1 hover:bg-gray-600 rounded transition-colors"
                                title="View on Solscan"
                              >
                                <ExternalLink className="h-4 w-4 text-blue-400" />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Wallet */}
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Middle Wallet
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Address</p>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm break-all">
                            {bot.middleWalletAddress ? `${bot.middleWalletAddress.slice(0, 8)}...${bot.middleWalletAddress.slice(-8)}` : 'N/A'}
                          </span>
                          {bot.middleWalletAddress && (
                            <>
                              <button
                                onClick={() => handleCopy(bot.middleWalletAddress!, 'middleWallet')}
                                className="p-1 hover:bg-gray-600 rounded transition-colors"
                                title="Copy address"
                              >
                                {copiedField === 'middleWallet' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                              </button>
            <Link
                                href={`https://solscan.io/address/${bot.middleWalletAddress}`}
                                target="_blank"
                                className="p-1 hover:bg-gray-600 rounded transition-colors"
                                title="View on Solscan"
                              >
                                <ExternalLink className="h-4 w-4 text-blue-400" />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Information */}
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Token Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Token Address</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm break-all">
                          {bot.tokenAddress ? `${bot.tokenAddress.slice(0, 8)}...${bot.tokenAddress.slice(-8)}` : 'N/A'}
                        </span>
                        {bot.tokenAddress && (
                          <>
                            <button
                              onClick={() => handleCopy(bot.tokenAddress!, 'tokenAddress')}
                              className="p-1 hover:bg-gray-600 rounded transition-colors"
                              title="Copy address"
                            >
                              {copiedField === 'tokenAddress' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                            </button>
                            <Link
                              href={`https://dexscreener.com/solana/${bot.tokenAddress}`}
                              target="_blank"
                              className="p-1 hover:bg-gray-600 rounded transition-colors"
                              title="View on DexScreener"
                            >
                              <ExternalLink className="h-4 w-4 text-blue-400" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trading Tab */}
            {/* {activeTab === 'trading' && (
              <div className="space-y-6">
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trading Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-600/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Total Trades</p>
                      <p className="text-2xl font-bold text-white">{bot.lastTrades?.length || 0}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-600/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Engine</p>
                      <p className="text-lg font-semibold text-white">{bot.engine || 'N/A'}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-600/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Token Symbol</p>
                      <p className="text-lg font-semibold text-white">{bot.tokenSymbol || 'N/A'}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-600/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <div className="flex justify-center">
                        {getStatusBadge(bot.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Trades ({bot.lastTrades?.length || 0})
                  </h3>
                  {bot.lastTrades && bot.lastTrades.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {bot.lastTrades.map((trade, index) => (
                        <div key={index} className="p-4 bg-gray-600/30 rounded-lg border border-gray-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${trade.tradeType === 'BUY' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                <TrendingUp className={`h-4 w-4 ${trade.tradeType === 'BUY' ? 'text-green-400' : 'text-red-400'}`} />
                              </div>
                              <span className="text-white font-medium">{trade.tradeType} #{index + 1}</span>
                            </div>
                            {trade.timestamp && (
                              <span className="text-xs text-gray-400">{formatTimestamp(trade.timestamp)}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>
                              <span className="text-white font-mono">{trade.amount?.toFixed(6)} {trade.token}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Token Address:</span>
                              <span className="text-white font-mono text-xs">{trade.tokenAddress?.slice(0, 8)}...{trade.tokenAddress?.slice(-8)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Transaction:</span>
                              <span className="text-white font-mono text-xs">{trade.transactionSignature?.slice(0, 8)}...{trade.transactionSignature?.slice(-8)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Bot ID:</span>
                              <span className="text-white">{trade.botId}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No trades recorded yet</p>
                      <p className="text-sm text-gray-500 mt-2">Trading data will appear here once the bot starts trading</p>
                    </div>
                  )}
                </div>
              </div>
            )} */}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Bot Logs ({bot.lastLogs?.length || 0})
                    <span className="text-xs text-gray-400 font-normal">(newest first)</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Showing {getFilteredLogs().length} of {bot.lastLogs?.length || 0} logs</span>
                  </div>
                </div>

                {/* Log Statistics */}
                {bot.lastLogs && bot.lastLogs.length > 0 && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-3">Log Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Total</p>
                        <p className="text-lg font-bold text-white">{getLogStats().total}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-400 mb-1">Info</p>
                        <p className="text-lg font-bold text-blue-400">{getLogStats().info}</p>
                      </div>
                      <div className="text-center p-3 bg-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400 mb-1">Error</p>
                        <p className="text-lg font-bold text-red-400">{getLogStats().error}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-500/20 rounded-lg">
                        <p className="text-xs text-orange-400 mb-1">Warning</p>
                        <p className="text-lg font-bold text-orange-400">{getLogStats().warning}</p>
                      </div>
                      <div className="text-center p-3 bg-green-500/20 rounded-lg">
                        <p className="text-xs text-green-400 mb-1">Trade</p>
                        <p className="text-lg font-bold text-green-400">{getLogStats().trade}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search and Filter Controls */}
                {bot.lastLogs && bot.lastLogs.length > 0 && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Search Input */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Search Logs</label>
                        <input
                          type="text"
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          placeholder="Search in log messages..."
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Filter Dropdown */}
                      <div className="md:w-48">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Filter by Type</label>
                        <select
                          value={logFilter}
                          onChange={(e) => setLogFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Types</option>
                          <option value="info">Info</option>
                          <option value="error">Error</option>
                          <option value="warning">Warning</option>
                          <option value="trade">Trade</option>
                          <option value="debug">Debug</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {bot.lastLogs && bot.lastLogs.length > 0 ? (
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    {/* Show All Toggle */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showAllLogs"
                          checked={showAllLogs}
                          onChange={(e) => setShowAllLogs(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="showAllLogs" className="text-sm text-gray-300 cursor-pointer">
                          Show all logs ({getFilteredLogs().length})
                        </label>
                      </div>
                      <div className="text-xs text-gray-400">
                        {showAllLogs ? (
                          <span className="text-green-400">✓ Displaying all {getFilteredLogs().length} logs</span>
                        ) : (
                          <span>Displaying first 100 of {getFilteredLogs().length} logs</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Performance Warning for Large Log Sets */}
                    {showAllLogs && getFilteredLogs().length > 200 && (
                      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Performance Notice</span>
                        </div>
                        <p className="text-xs text-yellow-300 mt-1">
                          Displaying {getFilteredLogs().length} logs may impact performance. Consider using filters to narrow down results.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {getFilteredLogs().slice(0, showAllLogs ? getFilteredLogs().length : 100).map((log, displayIndex) => {
                        // Since logs are now sorted in descending order, the display index is correct
                        // The first log shown is the most recent one
                        
                        return (
                        <div key={displayIndex} className="p-3 bg-gray-600/20 rounded-lg border border-gray-600/30 hover:bg-gray-600/30 transition-colors">
                          {/* Compact Log Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.type || 'info')}`}>
                                {(log.type || 'info').toUpperCase()}
                              </div>
                              <span className="text-xs text-gray-500">#{getFilteredLogs().length - displayIndex}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(log.timestamp)}</span>
                            </div>
                          </div>

                          {/* Log Message - Truncated for better readability */}
                          <div className="mb-2">
                            <p className={`text-sm text-white leading-relaxed ${!expandedMessages.has(displayIndex) ? 'overflow-hidden' : ''}`} style={!expandedMessages.has(displayIndex) ? {
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              maxHeight: '2.5rem'
                            } : {}}>
                              {log.message}
                            </p>
                            {log.message && log.message.length > 100 && (
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedMessages);
                                  if (expandedMessages.has(displayIndex)) {
                                    newExpanded.delete(displayIndex);
                                  } else {
                                    newExpanded.add(displayIndex);
                                  }
                                  setExpandedMessages(newExpanded);
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                              >
                                {expandedMessages.has(displayIndex) ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>

                          {/* Compact Footer with Essential Info */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-3">
                              <span className="font-mono">{log.type || 'info'}</span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleDateString('en-IN', { 
                                timeZone: 'Asia/Kolkata',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                            
                            {/* Expandable Details */}
                            {Object.keys(log).length > 2 && (
                              <details className="group">
                                <summary className="cursor-pointer hover:text-gray-300 flex items-center gap-1">
                                  <span>Details</span>
                                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-600/30">
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Full Timestamp:</span>
                                      <span className="text-white font-mono">{formatTimestamp(log.timestamp)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Log Index:</span>
                                      <span className="text-white">#{getFilteredLogs().length - displayIndex}</span>
                                    </div>
                                    {Object.keys(log).length > 2 && (
                                      <details className="mt-2">
                                        <summary className="cursor-pointer hover:text-gray-300 text-gray-400">
                                          Raw Data ({Object.keys(log).length} properties)
                                        </summary>
                                        <pre className="mt-1 text-xs text-gray-300 overflow-x-auto bg-gray-900 p-2 rounded">
                                          {JSON.stringify(log, null, 2)}
                                        </pre>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No logs available</p>
                  </div>
                )}
              </div>
            )}

            {/* Warnings & Errors Tab */}
            {activeTab === 'warnings' && (
              <div className="space-y-6">
                {/* Warnings Section */}
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                    Warnings ({bot.warnings?.length || 0})
                  </h3>
                  {bot.warnings && bot.warnings.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {bot.warnings.map((warning, index) => (
                        <div key={index} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-white text-sm">{warning.message}</p>
                              <p className="text-orange-300 text-xs mt-1">{formatTimestamp(warning.timestamp)}</p>
                              {!!warning.details && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                                    View Details
                                  </summary>
                                  <pre className="mt-1 text-xs text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(warning.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-400">No warnings</p>
                    </div>
                  )}
                </div>

                {/* Errors Section */}
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    Errors ({bot.errors?.length || 0})
                  </h3>
                  {bot.errors && bot.errors.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {bot.errors.map((error, index) => (
                        <div key={index} className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-white text-sm">{error.message}</p>
                              <p className="text-red-300 text-xs mt-1">{formatTimestamp(error.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-400">No errors</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification States
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-600/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Low Balance 0.3 SOL</span>
                          <div className={`p-1 rounded ${bot.notificationStates?.lowBalance0_3 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {bot.notificationStates?.lowBalance0_3 ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Triggered when balance drops below 0.3 SOL</p>
                      </div>

                      <div className="p-4 bg-gray-600/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Low Balance 1.5 SOL</span>
                          <div className={`p-1 rounded ${bot.notificationStates?.lowBalance1_5 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {bot.notificationStates?.lowBalance1_5 ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Triggered when balance drops below 1.5 SOL</p>
                      </div>

                      <div className="p-4 bg-gray-600/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Low Balance 2.25 SOL</span>
                          <div className={`p-1 rounded ${bot.notificationStates?.lowBalance2_25 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {bot.notificationStates?.lowBalance2_25 ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Triggered when balance drops below 2.25 SOL</p>
                      </div>

                      <div className="p-4 bg-gray-600/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Low Balance 2.5 SOL</span>
                          <div className={`p-1 rounded ${bot.notificationStates?.lowBalance2_5 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {bot.notificationStates?.lowBalance2_5 ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Triggered when balance drops below 2.5 SOL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

