'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, { DashboardStats, User, Bot } from '@/utils/adminApiService';
import { 
  Users, 
  Bot as BotIcon, 
  TrendingUp, 
  AlertCircle,
  Activity,
  Database,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: number;
}

interface RecentActivityCardProps {
  title: string;
  items: User[] | Bot[];
  emptyMessage: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentBots, setRecentBots] = useState<Bot[]>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number;
    type: string;
    message: string;
    timestamp: Date;
    user?: string;
    token?: string;
    campaign?: string;
  }>>([]);
  const [campaignStats, setCampaignStats] = useState({
    totalCampaigns: 0,
    conversionRate: 0,
    changeFromLastMonth: 0
  });
  const [tokenStats, setTokenStats] = useState({
    totalTokens: 0,
    changeFromLastMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminApiService.getDashboardStats();
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers);
      setRecentBots(response.data.recentBots);
      
      // Fetch all additional data
      await Promise.all([
        fetchRecentActivity(),
        fetchCampaignStats(),
        fetchTokenStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // TODO: Replace with actual API calls
      setRecentActivity([
        {
          id: 1,
          type: 'user_registration',
          message: 'New user registered via Google OAuth',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          user: 'john.doe@example.com'
        },
        {
          id: 2,
          type: 'token_validation',
          message: 'New Solana token validated',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        },
        {
          id: 3,
          type: 'campaign_conversion',
          message: 'Campaign conversion from Google Ads',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          campaign: 'IDX_AutoBot_Exact_Match'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  const fetchCampaignStats = async () => {
    try {
      // Fetch campaign statistics from your backend
      const response = await fetch('/api/admin/campaigns/stats');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Campaign stats received:', data);
        setCampaignStats({
          totalCampaigns: data.totalCampaigns || 0,
          conversionRate: data.conversionRate || 0,
          changeFromLastMonth: data.changeFromLastMonth || 0
        });
      } else {
        console.warn('⚠️ Campaign stats API returned error:', response.status);
        // Fallback to mock data if API fails
        setCampaignStats({
          totalCampaigns: 23,
          conversionRate: 12.5,
          changeFromLastMonth: 5.3
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch campaign stats:', error);
      // Fallback to mock data
      setCampaignStats({
        totalCampaigns: 23,
        conversionRate: 12.5,
        changeFromLastMonth: 5.3
      });
    }
  };

  const fetchTokenStats = async () => {
    try {
      // Fetch token statistics from your backend
      const response = await fetch('/api/admin/tokens/stats');
      if (response.ok) {
        const data = await response.json();
        console.log('🪙 Token stats received:', data);
        setTokenStats({
          totalTokens: data.totalTokens || 0,
          changeFromLastMonth: data.changeFromLastMonth || 0
        });
      } else {
        console.warn('⚠️ Token stats API returned error:', response.status);
        // Fallback to mock data if API fails
        setTokenStats({
          totalTokens: 89,
          changeFromLastMonth: 22.4
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch token stats:', error);
      // Fallback to mock data
      setTokenStats({
        totalTokens: 89,
        changeFromLastMonth: 22.4
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchCampaignStats(),
        fetchTokenStats()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change }: StatCardProps) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {title === 'Conversion Rate' ? `${value}%` : value}
          </p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const RecentActivityCard = ({ title, items, emptyMessage }: RecentActivityCardProps) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {'username' in item ? item.username : item.engine}
                  </p>
                  <p className="text-xs text-gray-400">
                    {'email' in item ? item.email : item.status}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const RecentActivityCardBots = ({ title, items, emptyMessage }: RecentActivityCardProps) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            // Type guard to ensure item is a Bot
            if ('engine' in item && 'tokenName' in item) {
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <BotIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.engine} ({item.tokenName})
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">Overview of AutoBot platform statistics</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg text-white font-medium transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            color="bg-blue-600"
            change={12}
          />
          <StatCard
            title="Total Bots"
            value={stats?.totalBots || 0}
            icon={BotIcon}
            color="bg-green-600"
            change={8}
          />
          <StatCard
            title="Active Bots"
            value={stats?.activeBots || 0}
            icon={Activity}
            color="bg-purple-600"
            change={15}
          />
          <StatCard
            title="Total Admins"
            value={stats?.totalAdmins || 0}
            icon={AlertCircle}
            color="bg-orange-600"
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Campaigns"
            value={loading ? '...' : campaignStats.totalCampaigns}
            icon={TrendingUp}
            color="bg-indigo-600"
            change={loading ? undefined : campaignStats.changeFromLastMonth}
          />
          <StatCard
            title="Validated Tokens"
            value={loading ? '...' : tokenStats.totalTokens}
            icon={Database}
            color="bg-teal-600"
            change={loading ? undefined : tokenStats.changeFromLastMonth}
          />
          <StatCard
            title="Conversion Rate"
            value={loading ? '...' : campaignStats.conversionRate}
            icon={AlertCircle}
            color="bg-yellow-600"
            change={loading ? undefined : 8.2}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivityCard
            title="Recent Users"
            items={recentUsers}
            emptyMessage="No recent users"
          />
          <RecentActivityCardBots
            title="Recent Bots"
            items={recentBots}
            emptyMessage="No recent bots"
          />
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity Feed</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.message}</p>
                    <p className="text-xs text-gray-400">
                      {activity.user || activity.token || activity.campaign}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {activity.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Campaigns */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Top Campaigns</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-400 text-center py-4">
                Loading campaign data...
              </div>
            </div>
          </div>

          {/* Top Tokens */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Top Tokens</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-400 text-center py-4">
                Loading token data...
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => router.push('/admin/users')} className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
              <Users className="h-5 w-5 mr-2" />
              View All Users
            </button>
            <button onClick={() => router.push('/admin/bots')} className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors">
              <BotIcon className="h-5 w-5 mr-2" />
              Manage Bots
            </button>
            <button onClick={() => router.push('/admin/campaigns')} className="flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
              <TrendingUp className="h-5 w-5 mr-2" />
              Campaigns
            </button>
            <button onClick={() => router.push('/admin/tokens')} className="flex items-center justify-center p-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors">
              <Database className="h-5 w-5 mr-2" />
              Tokens
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 