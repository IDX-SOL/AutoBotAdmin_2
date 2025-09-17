'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, { User } from '@/utils/adminApiService';
import {
  User as UserIcon,
  ArrowLeft,
  Mail,
  Calendar,
  Bot,
  Activity,
  CheckCircle2,
  X,
  Smartphone,
  Monitor,
  Settings,
  RefreshCw,
  Award,
  AlertTriangle,
  Clock,
  BarChart3,
  Eye
} from 'lucide-react';
import { useToast } from '@/components/Toast/ToastContext';
import Link from 'next/link';

interface UserDetailData extends User {
  totalBots?: number;
  runningBots?: number;
  stoppedBots?: number;
  errorBots?: number;
  bots?: Array<{
    id: string;
    botName?: string;
    status: string;
    tokenName?: string;
    tokenSymbol?: string;
    engine?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  }>;
  campaignName?: string;
  campaignId?: number;
  authProvider?: string;
  emailVerified?: boolean;
  userBotsLimit?: number;
  onboardingCompleted?: boolean;
}

export default function UserDetailPage() {
  const params = useParams();
  const { showSuccess, showError } = useToast();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getUser(userId);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      showError('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  }, [userId, showError]);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId, fetchUserDetails]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserDetails();
    setRefreshing(false);
    showSuccess('User data refreshed');
  };


  const getStatusBadge = (status: string | undefined) => {
    const statusConfig: Record<string, { color: string; icon: string; bgColor: string }> = {
      active: { color: 'text-green-400', icon: '✓', bgColor: 'bg-green-500/20 border-green-500/30' },
      inactive: { color: 'text-red-400', icon: '✗', bgColor: 'bg-red-500/20 border-red-500/30' },
      pending: { color: 'text-yellow-400', icon: '⏳', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
      suspended: { color: 'text-orange-400', icon: '⚠', bgColor: 'bg-orange-500/20 border-orange-500/30' }
    };

    const config = statusConfig[status || 'active'] || statusConfig.active;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.color}`}>
        <span className="text-sm">{config.icon}</span>
        <span className="capitalize">{status || "active"}</span>
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
    { id: 'bots', name: 'Bots', icon: Bot },
    // { id: 'activity', name: 'Activity', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">User not found</h3>
          <p className="text-gray-400 mb-4">The user you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
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
              href="/admin/users"
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <UserIcon className="h-8 w-8 text-blue-400" />
                {user.username}
              </h1>
              <p className="text-gray-400 mt-1">User ID: {user.id}</p>
            </div>
            {getStatusBadge(user.isActive ? 'active' : 'inactive')}
          </div>
          <div className="flex items-center gap-3">
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
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Total Bots</p>
                <p className="text-xl font-bold text-white">{user.totalBots || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Running Bots</p>
                <p className="text-xl font-bold text-white">{user.runningBots || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-600 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Error Bots</p>
                <p className="text-xl font-bold text-white">{user.errorBots || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Joined</p>
                <p className="text-xl font-bold text-white">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
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
                {/* User Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      User Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Username:</span>
                        <span className="text-white">{user.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`flex items-center gap-1 ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {user.isActive ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Auth Provider:</span>
                        <span className="text-white capitalize">{user.authProvider || 'Local'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email Verified:</span>
                        <span className={`flex items-center gap-1 ${user.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                          {user.emailVerified ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          {user.emailVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Account Settings
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bot Limit:</span>
                        <span className="text-white">{user.userBotsLimit || 3}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Onboarding:</span>
                        <span className={`flex items-center gap-1 ${user.onboardingCompleted ? 'text-green-400' : 'text-yellow-400'}`}>
                          {user.onboardingCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          {user.onboardingCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform:</span>
                        <span className="text-white flex items-center gap-1">
                          {user.platform === 'mobile' ? (
                            <Smartphone className="h-4 w-4" />
                          ) : (
                            <Monitor className="h-4 w-4" />
                          )}
                          {user.platform || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Device:</span>
                        <span className="text-white">{user.device || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Information */}
                {user.campaignName && (
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Campaign Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Campaign Name:</span>
                        <span className="text-white">{user.campaignName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Campaign ID:</span>
                        <span className="text-white">{user.campaignId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Statistics */}
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Account Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-600/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Total Bots</p>
                      <p className="text-xl font-bold text-white">{user.totalBots || 0}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-600/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Running</p>
                      <p className="text-xl font-bold text-green-400">{user.runningBots || 0}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-600/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Stopped</p>
                      <p className="text-xl font-bold text-orange-400">{user.stoppedBots || 0}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-600/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Errors</p>
                      <p className="text-xl font-bold text-red-400">{user.errorBots || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bots Tab */}
            {activeTab === 'bots' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    User&apos;s Bots ({user.bots?.length || 0})
                  </h3>
                </div>

                {user.bots && user.bots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.bots.map((bot) => (
                      <div key={bot.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 hover:bg-gray-700/70 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">{bot.botName || 'Unnamed Bot'}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            bot.status === 'running' ? 'bg-green-500/20 text-green-400' :
                            bot.status === 'stopped' ? 'bg-gray-500/20 text-gray-400' :
                            bot.status === 'error' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {bot.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Token:</span>
                            <span className="text-white">{bot.tokenSymbol || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Engine:</span>
                            <span className="text-white">{bot.engine || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Created:</span>
                            <span className="text-white text-xs">
                              {new Date(bot.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-600/50">
                          <Link
                            href={`/admin/bots/${bot.id}`}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            <Eye className="h-3 w-3" />
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No bots found</p>
                    <p className="text-sm text-gray-500 mt-2">This user hasn&apos;t created any bots yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-600/30 rounded-lg">
                      <div className="p-2 bg-blue-500/20 rounded">
                        <UserIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">User account created</p>
                        <p className="text-gray-400 text-xs">{formatTimestamp(user.createdAt)}</p>
                      </div>
                    </div>
                    
                    {user.updatedAt !== user.createdAt && (
                      <div className="flex items-center gap-3 p-3 bg-gray-600/30 rounded-lg">
                        <div className="p-2 bg-green-500/20 rounded">
                          <Settings className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">Account last updated</p>
                          <p className="text-gray-400 text-xs">{formatTimestamp(user.updatedAt)}</p>
                        </div>
                      </div>
                    )}

                    {user.onboardingCompleted && (
                      <div className="flex items-center gap-3 p-3 bg-gray-600/30 rounded-lg">
                        <div className="p-2 bg-purple-500/20 rounded">
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">Onboarding completed</p>
                          <p className="text-gray-400 text-xs">User completed the setup process</p>
                        </div>
                      </div>
                    )}

                    {user.emailVerified && (
                      <div className="flex items-center gap-3 p-3 bg-gray-600/30 rounded-lg">
                        <div className="p-2 bg-green-500/20 rounded">
                          <Mail className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">Email verified</p>
                          <p className="text-gray-400 text-xs">User verified their email address</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-600/30 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2">Bot Limits</h4>
                        <p className="text-xs text-gray-400">Maximum number of bots this user can create</p>
                        <p className="text-lg font-semibold text-white mt-1">{user.userBotsLimit || 3} bots</p>
                      </div>
                      
                      <div className="p-4 bg-gray-600/30 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2">Account Status</h4>
                        <p className="text-xs text-gray-400">Current account status</p>
                        <div className="mt-1">
                          {getStatusBadge(user.isActive ? 'active' : 'inactive')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-600/30 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2">Authentication</h4>
                        <p className="text-xs text-gray-400">Login method used</p>
                        <p className="text-sm text-white mt-1 capitalize">{user.authProvider || 'Local'}</p>
                      </div>
                      
                      <div className="p-4 bg-gray-600/30 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2">Email Verification</h4>
                        <p className="text-xs text-gray-400">Email verification status</p>
                        <div className="mt-1 flex items-center gap-1">
                          {user.emailVerified ? (
                            <span className="text-green-400 text-sm">✓ Verified</span>
                          ) : (
                            <span className="text-red-400 text-sm">✗ Not Verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {/* <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                      Edit User
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                      <Settings className="h-4 w-4" />
                      Reset Password
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                      Delete User
                    </button>
                  </div>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
