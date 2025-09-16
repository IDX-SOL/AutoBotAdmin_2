'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Wallet, Calendar, Clock, CheckCircle, XCircle, RefreshCw, Play, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import adminApiService from '../../../../../utils/adminApiService';
import AdminLayout from '@/components/admin/AdminLayout';

export default function BotTradeWalletsPage() {
  const params = useParams();
  const botId = params.botId;
  
  const [bot, setBot] = useState(null);
  const [tradeWallets, setTradeWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingWallets, setCheckingWallets] = useState(false);
  const [includeTradeWallets, setIncludeTradeWallets] = useState(true);
  const [timeWindowHours, setTimeWindowHours] = useState(24);
  const [checkAllTradeWallets, setCheckAllTradeWallets] = useState(false);
  const [checkResults, setCheckResults] = useState(null);
  const [copiedAddresses, setCopiedAddresses] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch bot details
        const botResponse = await adminApiService.getBot(botId);
        setBot(botResponse.data);
        
        // Fetch trade wallets
        const walletsResponse = await adminApiService.getBotTradeWallets(botId);
        setTradeWallets(walletsResponse.data.botTeradeWalletsData || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 404) {
          setError('Trade wallets file not found. Please generate wallets first.');
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
            Trade Wallets for {bot?.botName || 'Bot'}
          </h1>
          <p className="text-gray-400">
            Bot ID: {botId} | Owner: {bot?.user?.username || 'Unknown'}
          </p>
        </div>

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
                    Check SOL and token balances for this bot&apos;s owner, middle, and trade wallets (with optional filtering)
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
          <h2 className="text-2xl font-semibold text-white mb-4">
            Trade Wallets ({tradeWallets.length})
          </h2>
          
          {tradeWallets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No trade wallets found for this bot</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tradeWallets
                .sort((a, b) => {
                  // Sort by createdAt in descending order (most recent first)
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
                          {wallet.createdAt ? new Date(wallet.createdAt).toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                }) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    
                    {wallet.closedAt && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Closed</p>
                          <p className="text-sm text-white">
                            {new Date(wallet.closedAt).toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
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