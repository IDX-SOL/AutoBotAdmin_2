'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, { DashboardStats, User, Bot } from '@/utils/adminApiService';
import { 
  Users, 
  Bot as BotIcon, 
  TrendingUp, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatCardProps {
  title: string;
  value: number;
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
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change }: StatCardProps) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
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
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Overview of AutoBot platform statistics</p>
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

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => router.push('/admin/users')} className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
              <Users className="h-5 w-5 mr-2" />
              View All Users
            </button>
            <button onClick={() => router.push('/admin/bots')} className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors">
              <BotIcon className="h-5 w-5 mr-2" />
              Manage Bots
            </button>
            <button onClick={() => router.push('#')} className="flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
              <TrendingUp className="h-5 w-5 mr-2" />
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 