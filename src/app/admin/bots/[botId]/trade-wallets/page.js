'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Wallet, Calendar, Clock, CheckCircle, XCircle, RefreshCw, Play, Copy, ExternalLink, Bookmark, History } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import adminApiService from '../../../../../utils/adminApiService';
import AdminLayout from '@/components/admin/AdminLayout';

const KOLKATA = { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' };

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-IN', KOLKATA);
}

/** Scalar or JSON preview for V8 pool rows (privateKey never sent from API). */
function PoolField({ label, value }) {
  if (value === undefined) return null;
  const isObj = value !== null && typeof value === 'object';
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      {isObj ? (
        <pre className="text-[11px] text-gray-200 font-mono whitespace-pre-wrap break-all mt-1 p-2 bg-gray-900/60 rounded border border-gray-600/40 max-h-40 overflow-y-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-white font-mono break-all">{value === null ? '—' : String(value)}</p>
      )}
    </div>
  );
}

export default function BotTradeWalletsPage() {
  const params = useParams();
  const botId = params.botId;
  
  const [bot, setBot] = useState(null);
  const [botRecordMissing, setBotRecordMissing] = useState(false);
  const [tradeWallets, setTradeWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingWallets, setCheckingWallets] = useState(false);
  const [includeTradeWallets, setIncludeTradeWallets] = useState(true);
  const [timeWindowHours, setTimeWindowHours] = useState(24);
  const [checkAllTradeWallets, setCheckAllTradeWallets] = useState(false);
  const [checkResults, setCheckResults] = useState(null);
  const [copiedAddresses, setCopiedAddresses] = useState(new Set());
  const [walletSource, setWalletSource] = useState(null);
  const [filterTokenMint, setFilterTokenMint] = useState(null);
  const [filterBotId, setFilterBotId] = useState(null);

  const isWorkerGridWalletSource =
    walletSource === 'mini-workers-pool' || walletSource === 'v12-turbo-workers';

  const isV4EcoDbPoolSource =
    walletSource === 'v4-eco-wallet-pool-db' || walletSource === 'v4-eco-trade-pool';

  const isPoolGridWalletSource =
    walletSource === 'trade-wallets-pool' || isV4EcoDbPoolSource;

  /** Re-fetch worker rows so reserved / retired match the pool after a balance check. */
  const refreshTradeWalletsFromApi = async () => {
    if (!botId) return;
    try {
      const walletsResponse = await adminApiService.getBotTradeWallets(botId);
      const payload = walletsResponse.data;
      setTradeWallets(payload.botTeradeWalletsData || []);
      setWalletSource(payload.walletSource || null);
      setFilterTokenMint(payload.filterTokenMint || null);
      setFilterBotId(payload.filterBotId || botId || null);
      setBotRecordMissing(Boolean(payload.botRecordMissing));
    } catch (e) {
      console.error('Failed to refresh trade wallets list:', e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setBotRecordMissing(false);

        let botData = null;
        try {
          const botResponse = await adminApiService.getBot(botId);
          botData = botResponse.data;
        } catch (err) {
          if (err.response?.status !== 404) throw err;
        }

        const walletsResponse = await adminApiService.getBotTradeWallets(botId);
        const payload = walletsResponse.data;
        setBot(botData);
        setBotRecordMissing(Boolean(payload.botRecordMissing));
        setTradeWallets(payload.botTeradeWalletsData || []);
        setWalletSource(payload.walletSource || null);
        setFilterTokenMint(payload.filterTokenMint || null);
      setFilterBotId(payload.filterBotId || botId || null);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 404) {
          const detail = err.response?.data?.details || '';
          setError(
            detail.includes('trade-wallets-pool')
              ? err.response?.data?.error || 'Trade wallets pool file not found on the server.'
              : 'Trade wallets file not found. Please generate wallets first.'
          );
        } else {
          setError(err.response?.data?.error || 'Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (botId) {
      fetchData();
    }
  }, [botId]);

  // Check bot wallets function
  const checkBotWallets = async () => {
    if (!botId) {
      toast.error('Bot ID not found');
      return;
    }
    if (!bot && !botRecordMissing) {
      toast.error('No bot record and no orphan worker list on this page. Restore the bot or open a URL that still loads workers from the pool.');
      return;
    }

    setCheckingWallets(true);
    try {
      let response;
      
      if (checkAllTradeWallets) {
        // Check all trade wallets for this bot (no time filtering)
        response = await adminApiService.checkBotWallets(
          parseInt(botId), 
          new Date().toISOString(), 
          true, // include trade wallets
          999999 // very large time window to include all
        );
        toast.success(`All trade wallets check completed for bot ${botId}`);
      } else {
        // Check bot-specific wallets with time filtering
        response = await adminApiService.checkBotWallets(
          parseInt(botId), 
          new Date().toISOString(), 
          includeTradeWallets, 
          timeWindowHours
        );
        toast.success(`Bot wallet check completed for bot ${botId}`);
      }
      
      // Show success message with details
      const data = response.data.data; // Fix: data is nested under response.data.data
      
      if (data) {
        // Store results for display
        setCheckResults(data);
        
        const walletTypes = [];
        if (data.botWallets > 0) walletTypes.push(`${data.botWallets} bot wallets`);
        if (data.tradeWallets > 0) walletTypes.push(`${data.tradeWallets} trade wallets`);
        
        toast.success(`Checked ${data.totalChecked} wallets (${walletTypes.join(', ')}): ${data.withBalance} with balance, ${data.withSol} with SOL, ${data.withTokens} with tokens`);
        
        // Show time window info if trade wallets were included
        if (includeTradeWallets && data.tradeWallets > 0 && !checkAllTradeWallets) {
          toast.info(`Trade wallets filtered by ±${timeWindowHours} hours from current time`);
        } else if (checkAllTradeWallets && data.tradeWallets > 0) {
          toast.info(`All trade wallets for this bot were checked (no time filtering)`);
        }

        await refreshTradeWalletsFromApi();
      }
    } catch (error) {
      console.error('Error checking bot wallets:', error);
      toast.error('Failed to check bot wallets');
    } finally {
      setCheckingWallets(false);
    }
  };

  // Copy wallet address to clipboard
  const copyWalletAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddresses(prev => new Set([...prev, address]));
      toast.success('Wallet address copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedAddresses(prev => {
          const newSet = new Set(prev);
          newSet.delete(address);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy wallet address');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'reserved':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'snapshot':
        return <Bookmark className="h-4 w-4 text-sky-400" />;
      case 'retired':
        return <History className="h-4 w-4 text-gray-400" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'text-green-500';
      case 'closed':
        return 'text-red-500';
      case 'reserved':
        return 'text-emerald-400';
      case 'snapshot':
        return 'text-sky-400';
      case 'retired':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <Link
              href="/admin/bots"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bots
            </Link>
          </div>
        </div>
      </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/admin/bots"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bots
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Trade Wallets for{' '}
            {bot?.botName || (botRecordMissing ? `Bot ${botId} (removed)` : 'Bot')}
          </h1>
          <p className="text-gray-400">
            Bot ID: {botId}
            {bot ? ` | Owner: ${bot?.user?.username || 'Unknown'}` : ''}
            {botRecordMissing && !bot
              ? ' — database record removed; pool workers for this id are shown if still reserved.'
              : ''}
          </p>
        </div>

        {botRecordMissing && !bot && (
          <div className="mb-6 rounded-lg border border-amber-700/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-100/95">
            This bot is no longer in the database.
            {walletSource === 'v12-turbo-workers' || walletSource === 'mini-workers-pool'
              ? ' Each worker shows reserved (still in trade-wallets-pool for this bot) or retired (address kept for history, no longer held in the pool for this bot). '
              : ' If workers stayed reserved after refund, they appear below so you can verify balances (e.g. on Solscan). '}
            &quot;Check Wallets&quot; runs from the pool list even when the bot row is missing.
          </div>
        )}

        {/* Bot Info Card */}
        {bot && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-400">Bot Name</p>
                <p className="text-lg font-semibold text-white">{bot.botName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-lg font-semibold text-white capitalize">{bot.status || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Engine</p>
                <p className="text-lg font-semibold text-white">{bot.engine || 'Unknown'}</p>
              </div>
            </div>
            
            {/* Wallet Check Section */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Check Bot Wallets
                  </h3>
                  <p className="text-sm text-gray-400">
                    Check native SOL and this bot&apos;s token mint only (owner, middle, and trade / pool workers; optional time filter applies to legacy trade-wallets.json lists)
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Check Button */}
                <div className="flex justify-end">
                  <button
                    onClick={checkBotWallets}
                    disabled={checkingWallets}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  >
                    {checkingWallets ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Check Wallets
                      </>
                    )}
                  </button>
                </div>
                
                {/* Trade Wallet Filtering Options */}
                <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
                  {/* Check All Trade Wallets Option */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="checkAllTradeWallets"
                      checked={checkAllTradeWallets}
                      onChange={(e) => {
                        setCheckAllTradeWallets(e.target.checked);
                        if (e.target.checked) {
                          setIncludeTradeWallets(true);
                        }
                      }}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <label htmlFor="checkAllTradeWallets" className="text-sm font-medium text-gray-300">
                      Check ALL Trade Wallets for this Bot (no time filtering)
                    </label>
                  </div>
                  
                  {/* Time-based Filtering Option */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="includeTradeWallets"
                      checked={includeTradeWallets && !checkAllTradeWallets}
                      disabled={checkAllTradeWallets}
                      onChange={(e) => setIncludeTradeWallets(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                    />
                    <label htmlFor="includeTradeWallets" className={`text-sm font-medium ${checkAllTradeWallets ? 'text-gray-500' : 'text-gray-300'}`}>
                      Include Trade Wallets (filtered by time window)
                    </label>
                  </div>
                  
                  {includeTradeWallets && !checkAllTradeWallets && (
                    <div className="ml-7">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Time Window (hours around current time)
                      </label>
                      <select
                        value={timeWindowHours}
                        onChange={(e) => setTimeWindowHours(parseInt(e.target.value))}
                        className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value={1}>±1 hour</option>
                        <option value={6}>±6 hours</option>
                        <option value={12}>±12 hours</option>
                        <option value={24}>±24 hours</option>
                        <option value={48}>±48 hours</option>
                        <option value={72}>±72 hours</option>
                        <option value={168}>±1 week</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Trade wallets created within this time window from current time will be included
                      </p>
                    </div>
                  )}
                  
                  {checkAllTradeWallets && (
                    <div className="ml-7 bg-green-600/20 border border-green-600/30 rounded-lg p-3">
                      <p className="text-sm text-green-400 font-medium">
                        ⚠️ This will check ALL trade wallets for this bot regardless of creation time
                      </p>
                      <p className="text-xs text-green-300 mt-1">
                        This may take longer and check many wallets. Use with caution.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Check Results Display */}
              {checkResults && (
                <div className="mt-6 bg-gray-700/30 rounded-xl p-6 border border-gray-600/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">Check Results</h4>
                    <div className="ml-auto flex items-center gap-3">
                      <div className="text-sm text-gray-400">
                        {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </div>
                      <button
                        onClick={() => setCheckResults(null)}
                        className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-600/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-400">{checkResults.totalChecked || 0}</p>
                      <p className="text-sm text-gray-300">Total Checked</p>
                    </div>
                    <div className="bg-gray-600/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-400">{checkResults.withBalance || 0}</p>
                      <p className="text-sm text-gray-300">With Balance</p>
                    </div>
                    <div className="bg-gray-600/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-400">{checkResults.withSol || 0}</p>
                      <p className="text-sm text-gray-300">With SOL</p>
                    </div>
                    <div className="bg-gray-600/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-400">{checkResults.withTokens || 0}</p>
                      <p className="text-sm text-gray-300">With Tokens</p>
                    </div>
                  </div>
                  
                  {/* Wallet Type Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-600/30 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Bot Wallets</h5>
                      <p className="text-2xl font-bold text-white">{checkResults.botWallets || 0}</p>
                      <p className="text-xs text-gray-400">Owner + Middle wallets</p>
                    </div>
                    <div className="bg-gray-600/30 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Trade Wallets</h5>
                      <p className="text-2xl font-bold text-white">{checkResults.tradeWallets || 0}</p>
                      <p className="text-xs text-gray-400">
                        {checkAllTradeWallets ? 'All trade wallets' : `Filtered by ±${checkResults.timeWindow || timeWindowHours} hours`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Detailed Wallet Results */}
                  {checkResults.checkedWallets && checkResults.checkedWallets.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-3">
                        Wallet Details ({checkResults.checkedWallets.filter(w => w.hasBalance).length} with balance)
                      </h5>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {checkResults.checkedWallets.filter(wallet => wallet.hasBalance).length > 0 ? (
                          checkResults.checkedWallets
                            .filter(wallet => wallet.hasBalance)
                            .map((wallet, index) => (
                          <div key={index} className="p-3 bg-gray-600/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  wallet.hasBalance ? 'bg-green-400' : 'bg-gray-500'
                                }`}></div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-mono text-white">
                                      {wallet.address.length > 20 ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}` : wallet.address}
                                    </p>
                                    <button
                                      onClick={() => copyWalletAddress(wallet.address)}
                                      className="p-1 hover:bg-gray-500 rounded transition-colors group"
                                      title="Copy wallet address"
                                    >
                                      {copiedAddresses.has(wallet.address) ? (
                                        <CheckCircle className="h-3 w-3 text-green-400" />
                                      ) : (
                                        <Copy className="h-3 w-3 text-gray-400 group-hover:text-white" />
                                      )}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      wallet.type === 'owner' ? 'bg-blue-500/20 text-blue-400' :
                                      wallet.type === 'middle' ? 'bg-purple-500/20 text-purple-400' :
                                      'bg-green-500/20 text-green-400'
                                    }`}>
                                      {wallet.type}
                                    </span>
                                    {wallet.createdAt && (
                                      <span className="text-xs text-gray-400">
                                        {new Date(wallet.createdAt).toLocaleDateString('en-IN')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-white font-mono">
                                  {parseFloat(wallet.solBalance) > 0 ? `${parseFloat(wallet.solBalance).toFixed(6)} SOL` : '0 SOL'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {wallet.tokenTypes} token types
                                </p>
                              </div>
                            </div>
                            
                            {/* Token Details */}
                            {wallet.tokenBalances && wallet.tokenBalances.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-600/30">
                                <p className="text-xs text-gray-400 mb-2">Token Balances:</p>
                                <div className="space-y-2">
                                  {wallet.tokenBalances.map((token, tokenIndex) => (
                                    <div key={tokenIndex} className="flex items-center justify-between bg-gray-700/30 rounded p-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-blue-400">
                                            {token.token}
                                          </span>
                                          <button
                                            onClick={() => copyWalletAddress(token.mint)}
                                            className="p-1 hover:bg-gray-600 rounded transition-colors group"
                                            title="Copy token mint address"
                                          >
                                            {copiedAddresses.has(token.mint) ? (
                                              <CheckCircle className="h-3 w-3 text-green-400" />
                                            ) : (
                                              <Copy className="h-3 w-3 text-gray-400 group-hover:text-white" />
                                            )}
                                          </button>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                          {token.mint.length > 20 ? `${token.mint.slice(0, 8)}...${token.mint.slice(-8)}` : token.mint}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-white font-mono">
                                          {parseFloat(token.balance).toFixed(6)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {token.decimals} decimals
                                        </p>
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
                            <div className="text-gray-400 text-sm">
                              No wallets with balance found
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Errors if any */}
                  {checkResults.errors && checkResults.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-red-400 mb-2">Errors ({checkResults.errors.length})</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {checkResults.errors.map((error, index) => (
                          <div key={index} className="text-xs text-red-300 bg-red-500/10 rounded p-2">
                            <span className="font-mono">{error.wallet}</span> ({error.type}): {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Bot wallet addresses info */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {bot.ownerWalletAddress && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-300">Owner Wallet</p>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => copyWalletAddress(bot.ownerWalletAddress)}
                          className="p-1 hover:bg-gray-600 rounded transition-colors group"
                          title="Copy wallet address"
                        >
                          {copiedAddresses.has(bot.ownerWalletAddress) ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400 group-hover:text-white" />
                          )}
                        </button>
                        <Link
                          href={`https://solscan.io/address/${bot.ownerWalletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors"
                          title="View on Solscan"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                    <p className="text-sm text-white font-mono break-all">
                      {bot.ownerWalletAddress}
                    </p>
                  </div>
                )}
                {bot.middleWalletAddress && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-300">Middle Wallet</p>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => copyWalletAddress(bot.middleWalletAddress)}
                          className="p-1 hover:bg-gray-600 rounded transition-colors group"
                          title="Copy wallet address"
                        >
                          {copiedAddresses.has(bot.middleWalletAddress) ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400 group-hover:text-white" />
                          )}
                        </button>
                        <Link
                          href={`https://solscan.io/address/${bot.middleWalletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors"
                          title="View on Solscan"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                    <p className="text-sm text-white font-mono break-all">
                      {bot.middleWalletAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trade Wallets */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">
            {isV4EcoDbPoolSource
              ? `V4 Eco trade wallets — DB (${tradeWallets.length})`
              : walletSource === 'trade-wallets-pool'
              ? `V8 pool wallets (${tradeWallets.length})`
              : walletSource === 'mini-workers-pool'
                ? `Mini workers (${tradeWallets.length})`
                : walletSource === 'v12-turbo-workers'
                  ? `V12 Turbo workers (${tradeWallets.length})`
                  : `Trade Wallets (${tradeWallets.length})`}
          </h2>
          {walletSource === 'mini-workers-pool' && (
            <p className="text-sm text-gray-400 mb-4">
              MiniBuy / MiniBuySell worker public keys only (never private keys).{' '}
              <span className="text-emerald-400/90">Reserved</span> = still in{' '}
              <span className="font-mono text-gray-300">trade-wallets-pool.json</span> as trade workers for this bot;{' '}
              <span className="text-gray-400/90">Retired</span> = no longer in the pool for this bot (same semantics as V12 Turbo; pubkeys can remain in admin history after refund).
            </p>
          )}
          {walletSource === 'v12-turbo-workers' && (
            <p className="text-sm text-gray-400 mb-4">
              All worker public keys that have ever traded for this bot (from server lifetime registry; never private keys).{' '}
              <span className="text-emerald-400/90">Reserved</span> = still present in{' '}
              <span className="font-mono text-gray-300">trade-wallets-pool.json</span> for this bot id;{' '}
              <span className="text-gray-400/90">Retired</span> = rotated out of the pool (no longer reserved for this bot).
            </p>
          )}
          {isV4EcoDbPoolSource && (
            <p className="text-sm text-gray-400 mb-4">
              V4 Eco workers from <span className="font-mono text-gray-300">wallet_pool</span> +{' '}
              <span className="font-mono text-gray-300">wallet_pool_events</span> (DB only), filtered by bot id{' '}
              <span className="text-white font-mono">{filterBotId || botId}</span>.{' '}
              <span className="text-emerald-400/90">Reserved</span> = <span className="font-mono text-gray-400">reserved_by_bot_id</span>;{' '}
              <span className="text-amber-300/90">History</span> = prior <span className="font-mono text-gray-400">wallet_pool_events</span> for this bot. Private keys are never returned.
            </p>
          )}
          {(isV4EcoDbPoolSource || walletSource === 'trade-wallets-pool') && filterBotId && (
            <div className="mb-4 p-3 rounded-lg bg-gray-800/80 border border-gray-600/50">
              <p className="text-xs text-gray-400 mb-1">Filter bot id</p>
              <p className="text-sm text-cyan-200/90 font-mono">{filterBotId}</p>
            </div>
          )}
          {walletSource === 'trade-wallets-pool' && filterTokenMint && (
            <p className="text-sm text-gray-400 mb-4">
              Rows from <span className="text-gray-300 font-mono">trade-wallets-pool.json</span> where{' '}
              <span className="text-gray-300">lastUsedByToken</span> includes this bot mint (same schema as{' '}
              <span className="font-mono text-gray-300">docs/trade-wallets-pool.json</span>). Private keys are not returned.
            </p>
          )}
          {(walletSource === 'trade-wallets-pool' || walletSource === 'v4-eco-trade-pool') && filterTokenMint && (
            <div className="mb-4 p-3 rounded-lg bg-gray-800/80 border border-gray-600/50">
              <p className="text-xs text-gray-400 mb-1">Bot token mint (filter)</p>
              <div className="flex items-start gap-2">
                <p className="text-sm text-amber-200/90 font-mono break-all flex-1">{filterTokenMint}</p>
                <button
                  type="button"
                  onClick={() => copyWalletAddress(filterTokenMint)}
                  className="p-1 hover:bg-gray-600 rounded transition-colors shrink-0"
                  title="Copy mint"
                >
                  {copiedAddresses.has(filterTokenMint) ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {tradeWallets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {isV4EcoDbPoolSource
                  ? `No V4 Eco trade wallets in wallet_pool DB for bot id ${filterBotId || botId} yet`
                  : walletSource === 'trade-wallets-pool'
                  ? 'No pool wallets have lastUsedByToken entries for this bot mint'
                  : walletSource === 'mini-workers-pool'
                    ? botRecordMissing
                      ? 'No workers found from pool, DB snapshot, or server wallets-debug exports (bot-{id}-wallets-*.txt). Ensure the bot ran once and debug exports exist on the API host.'
                      : 'No workers found from pool, snapshot, or wallets-debug. Start the bot once, or check the server engine/miniBuy(Sell)/wallets-debug folder and trade-wallets-pool.json.'
                    : walletSource === 'v12-turbo-workers'
                      ? 'No lifetime trade-worker registry on the server for this bot id yet (and no pool-only rows). After trades run, bot-{id}-trade-workers-keys.json is populated; ensure the backend can read engine/v12-turbo/wallets-debug/.'
                      : 'No trade wallets found for this bot'}
              </p>
            </div>
          ) : isPoolGridWalletSource ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tradeWallets.map((wallet, index) => {
                const orderedKeys = Object.keys(wallet).filter((k) => k !== 'privateKey').sort();
                return (
                  <div
                    key={wallet.publicKey || index}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(wallet.status)}
                        <span className={`text-sm font-medium capitalize ${getStatusColor(wallet.status)}`}>
                          {wallet.status || 'unknown'}
                        </span>
                      </div>
                      {wallet.poolRole && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                            wallet.poolRole === 'reserved'
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                              : 'bg-amber-900/30 text-amber-200/90 border border-amber-700/40'
                          }`}
                        >
                          {wallet.poolRole}
                        </span>
                      )}
                    </div>
                    {(wallet.lastUsedAtForBot != null ||
                      wallet.lastUsedAtForBotToken != null ||
                      wallet.lastUsedIndexForBotToken != null ||
                      wallet.reservedByBotId != null) && (
                      <div className="mb-4 p-3 rounded-lg bg-amber-900/20 border border-amber-700/40 space-y-1">
                        {wallet.reservedByBotId != null && (
                          <p className="text-xs text-gray-400">
                            reservedBy: <span className="font-mono text-white">{wallet.reservedByBotId}</span>
                          </p>
                        )}
                        {wallet.lastUsedAtForBot != null && (
                          <>
                            <p className="text-xs text-amber-200/80 font-medium">Last use for this bot id</p>
                            <p className="text-sm text-white">{formatDateTime(wallet.lastUsedAtForBot)}</p>
                          </>
                        )}
                        {wallet.lastUsedAtForBotToken != null && (
                          <>
                            <p className="text-xs text-amber-200/80 font-medium">Last use for bot token mint</p>
                            <p className="text-sm text-white">{formatDateTime(wallet.lastUsedAtForBotToken)}</p>
                          </>
                        )}
                        {wallet.lastUsedIndexForBotToken != null && (
                          <p className="text-xs text-gray-400">
                            Pool index (lastUsedIndexByToken): {wallet.lastUsedIndexForBotToken}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-400">Public Key</p>
                        <div className="flex items-start gap-2 mt-1">
                          <p className="text-sm text-white font-mono break-all flex-1">{wallet.publicKey || 'N/A'}</p>
                          {wallet.publicKey && (
                            <button
                              type="button"
                              onClick={() => copyWalletAddress(wallet.publicKey)}
                              className="p-1 hover:bg-gray-600 rounded transition-colors shrink-0"
                              title="Copy public key"
                            >
                              {copiedAddresses.has(wallet.publicKey) ? (
                                <CheckCircle className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3 text-gray-400 hover:text-white" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {orderedKeys.map((key) => {
                        if (
                          [
                            'publicKey',
                            'status',
                            'lastUsedAtForBot',
                            'lastUsedAtForBotToken',
                            'lastUsedIndexForBotToken',
                            'poolRole',
                            'filterBotId',
                            'reservedByBotId'
                          ].includes(key)
                        ) {
                          return null;
                        }
                        return <PoolField key={key} label={key} value={wallet[key]} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : isWorkerGridWalletSource ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tradeWallets.map((wallet) => (
                <div
                  key={wallet.publicKey || wallet.workerIndex}
                  className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
                      Worker {wallet.workerIndex ?? '—'}
                    </span>
                    <span
                      className="flex items-center gap-1 shrink-0"
                      title={
                        wallet.status === 'reserved'
                          ? 'Reserved in pool file'
                          : wallet.status === 'retired' || wallet.status === 'snapshot'
                            ? 'No longer in pool for this bot (admin history / rotated out)'
                            : ''
                      }
                    >
                      {getStatusIcon(wallet.status)}
                      {wallet.status && (
                        <span className={`text-[10px] font-medium capitalize ${getStatusColor(wallet.status)}`}>
                          {wallet.status}
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Public key</p>
                    <div className="flex items-start gap-2">
                      <p className="text-sm text-white font-mono break-all flex-1">{wallet.publicKey || 'N/A'}</p>
                      {wallet.publicKey && wallet.publicKey !== 'N/A' && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyWalletAddress(wallet.publicKey)}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Copy public key"
                          >
                            {copiedAddresses.has(wallet.publicKey) ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400 hover:text-white" />
                            )}
                          </button>
                          <Link
                            href={`https://solscan.io/address/${wallet.publicKey}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors"
                            title="View on Solscan"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tradeWallets
                .sort((a, b) => {
                  const dateA = new Date(a.createdAt || 0);
                  const dateB = new Date(b.createdAt || 0);
                  return dateB - dateA;
                })
                .map((wallet, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(wallet.status)}
                      <span className={`text-sm font-medium capitalize ${getStatusColor(wallet.status)}`}>
                        {wallet.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">Public Key</p>
                      <p className="text-sm text-white font-mono break-all">
                        {wallet.publicKey || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Created</p>
                        <p className="text-sm text-white">
                          {wallet.createdAt ? formatDateTime(wallet.createdAt) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    
                    {wallet.closedAt && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Closed</p>
                          <p className="text-sm text-white">
                            {formatDateTime(wallet.closedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AdminLayout>
  );
} 