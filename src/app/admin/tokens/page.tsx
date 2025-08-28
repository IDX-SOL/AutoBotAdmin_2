'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService from '@/utils/adminApiService';
import { 
  Database, 
  TrendingUp, 
  Search, 
  Download, 
  Eye, 
  BarChart3,
  ExternalLink,
  CheckCircle
} from 'lucide-react';

interface Token {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  price: string;
  priceUsd?: number;
  marketCap?: number;
  volume24h?: number;
  liquidity?: number;
  dexId?: string;
  pairAddress?: string;
  baseToken?: string;
  quoteToken?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [tokenFilter, setTokenFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'overview', name: 'Token Overview', icon: Database },
    { id: 'tokens', name: 'Token List', icon: Eye },
    { id: 'analytics', name: 'Token Analytics', icon: BarChart3 },
    { id: 'validation', name: 'Validation Stats', icon: TrendingUp },
  ];

  const dateRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  const tokenFilters = [
    { value: 'all', label: 'All Tokens' },
    { value: 'active', label: 'Active Tokens' },
    { value: 'inactive', label: 'Inactive Tokens' },
    { value: 'validated', label: 'Recently Validated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  useEffect(() => {
    fetchTokens();
  }, []);

  const filterTokens = useCallback(() => {
    let filtered = [...tokens];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(token =>
        token.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.tokenAddress.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply token type filter
    if (tokenFilter !== 'all') {
      switch (tokenFilter) {
        case 'active':
          filtered = filtered.filter(t => t.priceUsd && t.priceUsd > 0);
          break;
        case 'inactive':
          filtered = filtered.filter(t => !t.priceUsd || t.priceUsd <= 0);
          break;
        case 'validated':
          // Show recently validated tokens (last 7 days)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(t => new Date(t.createdAt) > weekAgo);
          break;
        case 'popular':
          // Show tokens with highest volume
          filtered = filtered.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
          break;
      }
    }

    setFilteredTokens(filtered);
  }, [tokens, searchTerm, tokenFilter]);

  useEffect(() => {
    filterTokens();
  }, [filterTokens]);

  const fetchTokens = async () => {
    try {
      console.log('🪙 Fetching tokens from backend via admin service...');
      
      const response = await adminApiService.getTokensList();
      if (response.status === 200) {
        const result = response.data as { success: boolean; data?: { tokens: Token[] } };
        console.log('✅ Tokens received:', result);
        
        if (result.success && result.data?.tokens) {
          setTokens(result.data.tokens);
        } else {
          console.warn('⚠️ Backend returned invalid data structure:', result);
          setTokens([]);
        }
      } else {
        console.warn('⚠️ Backend returned error:', response.status);
        setTokens([]);
      }
    } catch (error) {
      console.error('❌ Error fetching tokens:', error);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  const getTokenStats = () => {
    const total = tokens.length;
    const active = tokens.filter(t => t.priceUsd && t.priceUsd > 0).length;
    const totalMarketCap = tokens.reduce((sum, t) => sum + (Number(t.marketCap) || 0), 0);
    const totalVolume = tokens.reduce((sum, t) => sum + (Number(t.volume24h) || 0), 0);
    const avgPrice = total > 0 ? tokens.reduce((sum, t) => sum + (Number(t.priceUsd) || 0), 0) / total : 0;

    return { total, active, totalMarketCap, totalVolume, avgPrice };
  };

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const formatCurrency = (value: number | string | undefined | null) => {
    // Convert to number and handle invalid values
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    // Check if the value is a valid number
    if (isNaN(numValue) || numValue === 0) {
      return '$0.00';
    }
    
    if (numValue >= 1e9) return `$${(numValue / 1e9).toFixed(2)}B`;
    if (numValue >= 1e6) return `$${(numValue / 1e6).toFixed(2)}M`;
    if (numValue >= 1e3) return `$${(numValue / 1e3).toFixed(2)}K`;
    return `$${numValue.toFixed(2)}`;
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

  const stats = getTokenStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Token Management</h1>
          <p className="text-gray-400 mt-2">Manage and analyze validated Solana tokens</p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dateRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <select
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tokenFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Tokens"
                  value={stats.total}
                  icon={Database}
                  color="bg-blue-600"
                />
                <StatCard
                  title="Active Tokens"
                  value={stats.active}
                  icon={CheckCircle}
                  color="bg-green-600"
                />
                <StatCard
                  title="Total Market Cap"
                  value={formatCurrency(stats.totalMarketCap)}
                  icon={TrendingUp}
                  color="bg-purple-600"
                />
                <StatCard
                  title="Total Volume (24h)"
                  value={formatCurrency(stats.totalVolume)}
                  icon={BarChart3}
                  color="bg-orange-600"
                />
              </div>

              {/* Token List Preview */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Tokens</h3>
                <div className="space-y-3">
                  {filteredTokens.slice(0, 5).map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                          <Database className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{token.tokenName}</p>
                          <p className="text-xs text-gray-400">
                            {token.tokenSymbol} • {token.price}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-400">
                          {formatCurrency(token.marketCap || 0)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatCurrency(token.volume24h || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'tokens' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">All Tokens</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3">Token</th>
                      <th className="px-6 py-3">Address</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Market Cap</th>
                      <th className="px-6 py-3">Volume (24h)</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Created</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredTokens.map((token) => (
                      <tr key={token.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{token.tokenName}</p>
                            <p className="text-gray-400 text-xs">{token.tokenSymbol}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300 font-mono text-xs">
                              {token.tokenAddress.slice(0, 8)}...{token.tokenAddress.slice(-8)}
                            </span>
                            <button className="text-blue-400 hover:text-blue-300">
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{token.price}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatCurrency(token.marketCap || 0)}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatCurrency(token.volume24h || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            token.priceUsd && token.priceUsd > 0
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {token.priceUsd && token.priceUsd > 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {new Date(token.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-400 hover:text-blue-300">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Token Analytics</h3>
              <p className="text-gray-400">Token analytics component will be implemented here</p>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Validation Statistics</h3>
              <p className="text-gray-400">Validation stats component will be implemented here</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 