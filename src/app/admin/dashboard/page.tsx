'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, { DashboardStats, User, Bot } from '@/utils/adminApiService';
import { 
  Users, 
  Bot as BotIcon, 
  TrendingUp, 
  AlertCircle,
  Activity,
  Database,
  RefreshCw,
  Mail
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
  
  const fetchDashboardData = useCallback(async () => {
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
  }, []);
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchRecentActivity = async () => {
    try {
      console.log('📊 Fetching recent activity from backend via admin service...');
      
      const response = await adminApiService.getAxiosInstance().get('/admin-dev/dashboard/recent-activity');
      if (response.status === 200) {
        const result = response.data as { success: boolean; data?: { activities: Array<{ id: string; type: string; message: string; timestamp: string; user?: string; token?: string; campaign?: string; metadata?: Record<string, unknown> }> } };
        console.log('✅ Recent activity received:', result);
        
        if (result.success && result.data?.activities) {
          // Transform the API response to match our component's expected format
          const transformedActivities = result.data.activities.map((activity: {
            id: string;
            type: string;
            message: string;
            timestamp: string;
            user?: string;
            token?: string;
            campaign?: string;
            metadata?: Record<string, unknown>;
          }) => ({
            id: parseInt(activity.id) || 0,
            type: activity.type,
            message: activity.message,
            timestamp: new Date(activity.timestamp),
            user: activity.user || undefined,
            token: activity.token || undefined,
            campaign: activity.campaign || undefined
          }));
          
          setRecentActivity(transformedActivities);
        } else {
          console.warn('⚠️ Backend returned invalid data structure:', result);
          setRecentActivity([]);
        }
      } else {
        console.warn('⚠️ Backend returned error:', response.status);
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch recent activity:', error);
      setRecentActivity([]);
    }
  };

  const fetchCampaignStats = async () => {
    try {
      console.log('📊 Fetching campaign stats from backend via admin service...');
      
      const response = await adminApiService.getCampaignsStats();
      if (response.status === 200) {
        const data = response.data as { totalCampaigns?: number; conversionRate?: number; changeFromLastMonth?: number };
        console.log('📊 Campaign stats received:', data);
        setCampaignStats({
          totalCampaigns: data.totalCampaigns || 0,
          conversionRate: data.conversionRate || 0,
          changeFromLastMonth: data.changeFromLastMonth || 0
        });
      } else {
        console.warn('⚠️ Backend returned error:', response.status);
        setCampaignStats({
          totalCampaigns: 0,
          conversionRate: 0,
          changeFromLastMonth: 0
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch campaign stats:', error);
      setCampaignStats({
        totalCampaigns: 0,
        conversionRate: 0,
        changeFromLastMonth: 0
      });
    }
  };

  const fetchTokenStats = async () => {
    try {
      console.log('🪙 Fetching token stats from backend via admin service...');
      
      const response = await adminApiService.getTokensStats();
      if (response.status === 200) {
        const data = response.data as { totalTokens?: number; changeFromLastMonth?: number };
        console.log('🪙 Token stats received:', data);
        setTokenStats({
          totalTokens: data.totalTokens || 0,
          changeFromLastMonth: data.changeFromLastMonth || 0
        });
      } else {
        console.warn('⚠️ Backend returned error:', response.status);
        setTokenStats({
          totalTokens: 0,
          changeFromLastMonth: 0
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch token stats:', error);
      setTokenStats({
        totalTokens: 0,
        changeFromLastMonth: 0
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
                {new Date(item.createdAt).toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
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
                    {new Date(item.createdAt).toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
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
                  {activity.timestamp.toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Top Campaigns</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-400 text-center py-4">
                Loading campaign data...
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Top Tokens</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-400 text-center py-4">
                Loading token data...
              </div>
            </div>
          </div>
        </div> */}

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
            <button onClick={() => router.push('/admin/emails')} className="flex items-center justify-center p-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors">
              <Mail className="h-5 w-5 mr-2" />
              Send Emails
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 