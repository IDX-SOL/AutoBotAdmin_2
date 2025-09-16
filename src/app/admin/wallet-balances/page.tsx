'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Wallet, Coins, TrendingUp, Calendar, AlertCircle, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import adminApiService, { 
  WalletBalance, 
  WalletBalanceSummary, 
  CronStatus 
} from '@/utils/adminApiService';
import AdminLayout from '@/components/admin/AdminLayout';

export default function WalletBalancesPage() {
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [summary, setSummary] = useState<WalletBalanceSummary | null>(null);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('today');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  
  // Date range state
  const [startDateTime, setStartDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [endDateTime, setEndDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [rangeResults, setRangeResults] = useState<any>(null);
  const [checkingRange, setCheckingRange] = useState(false);

  // Fetch wallet balances for today
  const fetchTodayBalances = async () => {
    try {
      const response = await adminApiService.getWalletBalancesToday();
      setWalletBalances(response.data.data.wallets);
    } catch (error) {
      console.error('Error fetching today\'s balances:', error);
      toast.error('Failed to fetch today\'s wallet balances');
    }
  };

  // Fetch wallet balances for specific date
  const fetchDateBalances = async (date: string) => {
    try {
      const response = await adminApiService.getWalletBalancesByDate(date, true);
      setWalletBalances(response.data.data.wallets);
    } catch (error) {
      console.error('Error fetching date balances:', error);
      toast.error('Failed to fetch wallet balances for selected date');
    }
  };

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const response = await adminApiService.getWalletBalanceSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch cron status
  const fetchCronStatus = async () => {
    try {
      const response = await adminApiService.getWalletBalanceCronStatus();
      setCronStatus(response.data);
    } catch (error) {
      console.error('Error fetching cron status:', error);
    }
  };

  // Manual balance check
  const triggerManualCheck = async () => {
    setRefreshing(true);
    try {
      await adminApiService.triggerWalletBalanceCheck();
      toast.success('Manual balance check completed successfully');
      
      // Refresh data
      await Promise.all([
        fetchTodayBalances(),
        fetchSummary(),
        fetchCronStatus()
      ]);
    } catch (error) {
      console.error('Error triggering manual check:', error);
      toast.error('Failed to trigger manual balance check');
    } finally {
      setRefreshing(false);
    }
  };

  // Check wallets in date range
  const checkWalletsInRange = async () => {
    if (!startDateTime || !endDateTime) {
      toast.error('Please select both start and end date/time');
      return;
    }

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      toast.error('End date/time must be after start date/time');
      return;
    }

    setCheckingRange(true);
    try {
      const response = await adminApiService.checkWalletsInDateRange(startDateTime, endDateTime);
      setRangeResults((response.data as any).data);
      toast.success(`Wallet check completed for range: ${new Date(startDateTime).toLocaleString('en-IN')} - ${new Date(endDateTime).toLocaleString('en-IN')}`);
    } catch (error) {
      console.error('Error checking wallets in range:', error);
      toast.error('Failed to check wallets in date range');
    } finally {
      setCheckingRange(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTodayBalances(),
          fetchSummary(),
          fetchCronStatus()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date === new Date().toISOString().split('T')[0]) {
      fetchTodayBalances();
    } else {
      fetchDateBalances(date);
    }
  };

  // Copy to clipboard functions
  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      toast.success('Copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyWalletAddress = (address: string) => {
    copyToClipboard(address, `wallet-${address}`);
  };

  const copyTokenAddress = (token: string) => {
    copyToClipboard(token, `token-${token}`);
  };

  // Format SOL balance
  const formatSolBalance = (balance: number) => {
    if (balance === 0) return '0.000000';
    if (balance < 0.000001) return '< 0.000001';
    return balance.toFixed(6);
  };

  // Format wallet address
  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
        <AdminLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading wallet balances...</p>
        </div>
      </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Wallet Balances</h1>
            <p className="text-gray-400 text-lg">Monitor daily trade wallet balances and token holdings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-white font-medium">{new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
            <button
              onClick={triggerManualCheck}
              disabled={refreshing}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-800 disabled:to-green-900 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Checking...' : 'Check Now'}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Wallets</p>
                  <p className="text-3xl font-bold mt-2">{summary?.today?.totalWallets}</p>
                  <p className="text-blue-200 text-xs mt-1">
                    {summary?.changes?.walletCountChange > 0 ? '+' : ''}
                    {summary?.changes?.walletCountChange} from yesterday
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Wallet className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Total SOL</p>
                  <p className="text-3xl font-bold mt-2">
                    {summary?.today?.totalSolBalance.toFixed(4)} SOL
                  </p>
                  <p className="text-yellow-200 text-xs mt-1">
                    {summary?.changes?.solBalanceChange > 0 ? '+' : ''}
                    {summary?.changes?.solBalanceChange.toFixed(4)} from yesterday
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Coins className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Token Types</p>
                  <p className="text-3xl font-bold mt-2">{summary?.today?.totalTokenTypes}</p>
                  <p className="text-purple-200 text-xs mt-1">
                    {summary?.changes?.tokenTypesChange > 0 ? '+' : ''}
                    {summary?.changes?.tokenTypesChange} from yesterday
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Cron Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${cronStatus?.running ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-lg font-bold">
                      {cronStatus?.running ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <p className="text-green-200 text-xs mt-1">
                    Next: {cronStatus?.nextRun ? new Date(cronStatus?.nextRun).toLocaleString('en-IN') : 'N/A'}     
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="today" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Today&apos;s Balances</TabsTrigger>
            <TabsTrigger value="by-date" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">By Date</TabsTrigger>
            <TabsTrigger value="date-range" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Date Range</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Wallet className="h-5 w-5" />
                      </div>
                      Today&apos;s Wallet Balances
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Wallets with balances as of {new Date().toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                      {walletBalances.length} Active
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {walletBalances.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-white mb-2">No Active Wallets</h3>
                    <p className="text-gray-400">No wallets with balances found for today.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {walletBalances.map((wallet) => (
                      <div key={wallet.id} className="bg-gray-700/30 hover:bg-gray-700/50 rounded-xl p-6 border border-gray-600/50 transition-all duration-200 hover:border-gray-500/50 hover:shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-600 rounded-lg">
                              <Wallet className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-lg font-semibold text-white">
                                  {formatWalletAddress(wallet?.walletAddress)}
                                </span>
                                <button
                                  onClick={() => copyWalletAddress(wallet?.walletAddress)}
                                  className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors group"
                                  title="Copy wallet address"
                                >
                                  {copiedItems.has(`wallet-${wallet?.walletAddress}`) ? (
                                    <Check className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-gray-400 group-hover:text-white" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  wallet?.hasAnyBalance 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {wallet?.hasAnyBalance ? 'ACTIVE' : 'EMPTY'}
                                </span>
                                <span className="text-sm text-gray-400">
                                  {format(new Date(wallet?.checkTimestamp), 'HH:mm:ss')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gray-600/30 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-300 mb-2">SOL Balance</p>
                            <p className="text-2xl font-bold text-yellow-400 font-mono">
                              {formatSolBalance(wallet?.solBalance)} SOL
                            </p>
                          </div>
                          
                          <div className="bg-gray-600/30 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-300 mb-2">Token Types</p>
                            <p className="text-2xl font-bold text-purple-400">
                              {wallet?.totalTokenTypes} types
                            </p>
                          </div>
                          
                          <div className="bg-gray-600/30 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-300 mb-2">Status</p>
                            <div className="flex gap-2">
                              {wallet?.hasSolBalance && (
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">
                                  SOL
                                </span>
                              )}
                              {wallet?.hasTokens && (
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium border border-purple-500/30">
                                  Tokens
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {wallet?.tokenBalances?.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <Coins className="h-5 w-5" />
                              Token Holdings
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {wallet?.tokenBalances?.map((token, index) => (
                                <div key={index} className="flex justify-between items-center p-4 bg-gray-600/30 rounded-lg border border-gray-500/30">
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="font-medium text-white font-mono text-sm">
                                      {token.mint.length > 20 ? `${token.mint.slice(0, 8)}...${token.mint.slice(-8)}` : token.mint}
                                    </span>
                                    <button
                                      onClick={() => copyTokenAddress(token.mint)}
                                      className="p-1 hover:bg-gray-500 rounded transition-colors group"
                                      title="Copy token address"
                                    >
                                      {copiedItems.has(`token-${token.mint}`) ? (
                                        <Check className="h-3 w-3 text-green-400" />
                                      ) : (
                                        <Copy className="h-3 w-3 text-gray-400 group-hover:text-white" />
                                      )}
                                    </button>
                                  </div>
                                  <span className="text-sm font-mono text-gray-300">
                                    {token.balance.toFixed(6)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {wallet?.errorMessage && (
                          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                              <AlertCircle className="h-4 w-4" />
                              Error Details
                            </div>
                            <p className="text-red-300 text-sm">{wallet?.errorMessage}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="by-date" className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Calendar className="h-5 w-5" />
                      </div>
                      Wallet Balances by Date
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Select a date to view wallet balances
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => fetchDateBalances(selectedDate)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Load Date
                  </button>
                </div>

                {walletBalances.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-white mb-2">No Data Found</h3>
                    <p className="text-gray-400">No wallet balance data found for the selected date.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {walletBalances.map((wallet) => (
                      <div key={wallet.id} className="bg-gray-700/30 hover:bg-gray-700/50 rounded-xl p-6 border border-gray-600/50 transition-all duration-200 hover:border-gray-500/50 hover:shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-600 rounded-lg">
                              <Wallet className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-lg font-semibold text-white">
                                  {formatWalletAddress(wallet?.walletAddress)}
                                </span>
                                <button
                                  onClick={() => copyWalletAddress(wallet?.walletAddress)}
                                  className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors group"
                                  title="Copy wallet address"
                                >
                                  {copiedItems.has(`wallet-${wallet?.walletAddress}`) ? (
                                    <Check className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-gray-400 group-hover:text-white" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  wallet?.hasAnyBalance 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {wallet?.hasAnyBalance ? 'ACTIVE' : 'EMPTY'}
                                </span>
                                <span className="text-sm text-gray-400">
                                  {format(new Date(wallet?.checkTimestamp), 'HH:mm:ss')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gray-600/30 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-300 mb-2">SOL Balance</p>
                            <p className="text-2xl font-bold text-yellow-400 font-mono">
                              {formatSolBalance(wallet?.solBalance)} SOL
                            </p>
                          </div>
                          
                          <div className="bg-gray-600/30 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-300 mb-2">Token Types</p>
                            <p className="text-2xl font-bold text-purple-400">
                              {wallet?.totalTokenTypes} types
                            </p>
                          </div>
                          
                          <div className="bg-gray-600/30 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-300 mb-2">Status</p>
                            <div className="flex gap-2">
                              {wallet?.hasSolBalance && (
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">
                                  SOL
                                </span>
                              )}
                              {wallet?.hasTokens && (
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium border border-purple-500/30">
                                  Tokens
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {wallet?.tokenBalances?.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <Coins className="h-5 w-5" />
                              Token Holdings
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {wallet?.tokenBalances?.map((token, index) => (
                                <div key={index} className="flex justify-between items-center p-4 bg-gray-600/30 rounded-lg border border-gray-500/30">
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="font-medium text-white font-mono text-sm">
                                      {token.mint.length > 20 ? `${token.mint.slice(0, 8)}...${token.mint.slice(-8)}` : token.mint}
                                    </span>
                                    <button
                                      onClick={() => copyTokenAddress(token.mint)}
                                      className="p-1 hover:bg-gray-500 rounded transition-colors group"
                                      title="Copy token address"
                                    >
                                      {copiedItems.has(`token-${token.mint}`) ? (
                                        <Check className="h-3 w-3 text-green-400" />
                                      ) : (
                                        <Copy className="h-3 w-3 text-gray-400 group-hover:text-white" />
                                      )}
                                    </button>
                                  </div>
                                  <span className="text-sm font-mono text-gray-300">
                                    {token.balance.toFixed(6)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {wallet?.errorMessage && (
                          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                              <AlertCircle className="h-4 w-4" />
                              Error Details
                            </div>
                            <p className="text-red-300 text-sm">{wallet?.errorMessage}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="date-range" className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Calendar className="h-5 w-5" />
                      </div>
                      Wallet Check by Date Range
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Check wallet balances within a specific date and time range
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                      Range Check
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-green-500 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-green-500 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={checkWalletsInRange}
                    disabled={checkingRange}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${checkingRange ? 'animate-spin' : ''}`} />
                    {checkingRange ? 'Checking...' : 'Check Wallets in Range'}
                  </button>
                  <button
                    onClick={() => setRangeResults(null)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Clear Results
                  </button>
                </div>

                {/* Range Results */}
                {rangeResults && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      Range Check Results
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-300 mb-1">Total Checked</p>
                        <p className="text-2xl font-bold text-white">{rangeResults.totalChecked || 0}</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-300 mb-1">With Balance</p>
                        <p className="text-2xl font-bold text-green-400">{rangeResults.withBalance || 0}</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-300 mb-1">With SOL</p>
                        <p className="text-2xl font-bold text-yellow-400">{rangeResults.withSol || 0}</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-300 mb-1">With Tokens</p>
                        <p className="text-2xl font-bold text-purple-400">{rangeResults.withTokens || 0}</p>
                      </div>
                    </div>

                    {rangeResults.checkedWallets && rangeResults.checkedWallets.length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-md font-medium text-gray-300">
                          Wallet Details ({rangeResults.checkedWallets.filter((w: any) => w.hasBalance).length} with balance)
                        </h5>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {rangeResults.checkedWallets
                            .filter((wallet: any) => wallet.hasBalance)
                            .map((wallet: any, index: number) => (
                            <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    wallet.hasBalance ? 'bg-green-400' : 'bg-gray-500'
                                  }`}></div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm text-white">
                                        {wallet.address.length > 20 ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}` : wallet.address}
                                      </span>
                                      <button
                                        onClick={() => copyWalletAddress(wallet.address)}
                                        className="p-1 hover:bg-gray-500 rounded transition-colors group"
                                        title="Copy wallet address"
                                      >
                                        {copiedItems.has(`wallet-${wallet.address}`) ? (
                                          <Check className="h-3 w-3 text-green-400" />
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
                                    {wallet.tokenBalances.map((token: any, tokenIndex: number) => (
                                      <div key={tokenIndex} className="flex items-center justify-between bg-gray-600/30 rounded p-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-blue-400">
                                              {token.token}
                                            </span>
                                            <button
                                              onClick={() => copyWalletAddress(token.mint)}
                                              className="p-1 hover:bg-gray-500 rounded transition-colors group"
                                              title="Copy token mint address"
                                            >
                                              {copiedItems.has(token.mint) ? (
                                                <Check className="h-3 w-3 text-green-400" />
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
                          ))}
                        </div>
                      </div>
                    )}

                    {rangeResults.errors && rangeResults.errors.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-red-400 mb-2">Errors ({rangeResults.errors.length})</h5>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {rangeResults.errors.map((error: any, index: number) => (
                            <div key={index} className="text-xs text-red-300 bg-red-500/10 rounded p-2">
                              <span className="font-mono">{error.wallet}</span> ({error.type}): {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!rangeResults && (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-white mb-2">No Range Check Performed</h3>
                    <p className="text-gray-400">Select a date range and click "Check Wallets in Range" to see results.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}