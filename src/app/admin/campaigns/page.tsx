'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Eye, 
  Target, 
  Download,
  Search
} from 'lucide-react';

interface Campaign {
  id: string;
  sessionId: string;
  userId?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmCampaignId?: string;
  utmAdgroup?: string;
  utmAdgroupId?: string;
  utmTerm?: string;
  utmMatchtype?: string;
  utmContent?: string;
  device?: string;
  network?: string;
  placement?: string;
  searchterm?: string;
  targetid?: string;
  locPhysicalMs?: string;
  locInterestMs?: string;
  gclid?: string;
  gadSource?: string;
  gadCampaignId?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  landingPage: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  conversionEvents: Array<{
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  isConverted: boolean;
  conversionDate?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'overview', name: 'Campaign Overview', icon: BarChart3 },
    { id: 'campaigns', name: 'Campaign List', icon: Users },
    { id: 'conversions', name: 'Conversions', icon: Target },
    { id: 'sources', name: 'Traffic Sources', icon: TrendingUp },
  ];

  const dateRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  const campaignFilters = [
    { value: 'all', label: 'All Campaigns' },
    { value: 'google', label: 'Google Ads' },
    { value: 'social', label: 'Social Media' },
    { value: 'direct', label: 'Direct Traffic' },
    { value: 'converted', label: 'Converted' },
    { value: 'active', label: 'Active' },
  ];

  const filterCampaigns = useCallback(() => {
    let filtered = [...campaigns];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.utmCampaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.utmSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.utmMedium.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply campaign type filter
    if (campaignFilter !== 'all') {
      switch (campaignFilter) {
        case 'google':
          filtered = filtered.filter(c => c.utmSource === 'google');
          break;
        case 'social':
          filtered = filtered.filter(c => ['twitter', 'facebook', 'instagram', 'linkedin'].includes(c.utmSource));
          break;
        case 'direct':
          filtered = filtered.filter(c => !c.utmSource);
          break;
        case 'converted':
          filtered = filtered.filter(c => c.isConverted);
          break;
        case 'active':
          filtered = filtered.filter(c => c.visitCount > 1);
          break;
      }
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, campaignFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [filterCampaigns]);

  const fetchCampaigns = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          sessionId: 'idx_1756215793840_6td15m1zl',
          utmSource: 'google',
          utmMedium: 'cpc',
          utmCampaign: 'IDX_AutoBot_Exact_Match',
          utmCampaignId: '22866602874',
          utmAdgroup: 'Ad_Group2',
          utmAdgroupId: '178796882770',
          utmTerm: 'market maker bot solana',
          utmMatchtype: 'e',
          utmContent: '768201400920',
          device: 'm',
          network: 'g',
          landingPage: '/',
          firstVisit: '2025-08-26T14:22:09.894Z',
          lastVisit: '2025-08-26T14:22:09.894Z',
          visitCount: 1,
          conversionEvents: [],
          isConverted: false,
          metadata: {},
          createdAt: '2025-08-26T14:22:09.895Z',
          updatedAt: '2025-08-26T14:22:09.895Z'
        },
        {
          id: '2',
          sessionId: 'idx_1756215793841_7td16m2zl',
          userId: 'user123',
          utmSource: 'twitter',
          utmMedium: 'social',
          utmCampaign: 'organic_dm',
          landingPage: '/create-bot',
          firstVisit: '2025-08-26T13:00:00.000Z',
          lastVisit: '2025-08-26T14:00:00.000Z',
          visitCount: 3,
          conversionEvents: [
            {
              type: 'user_registered',
              data: { userId: 'user123', email: 'user@example.com' },
              timestamp: '2025-08-26T14:00:00.000Z'
            }
          ],
          isConverted: true,
          conversionDate: '2025-08-26T14:00:00.000Z',
          metadata: {},
          createdAt: '2025-08-26T13:00:00.000Z',
          updatedAt: '2025-08-26T14:00:00.000Z'
        }
      ];
      
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCampaignStats = () => {
    const total = campaigns.length;
    const converted = campaigns.filter(c => c.isConverted).length;
    const conversionRate = total > 0 ? (converted / total * 100).toFixed(1) : 0;
    const totalVisits = campaigns.reduce((sum, c) => sum + c.visitCount, 0);
    const avgVisits = total > 0 ? (totalVisits / total).toFixed(1) : 0;

    return { total, converted, conversionRate, totalVisits, avgVisits };
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  const stats = getCampaignStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Campaign Management</h1>
          <p className="text-gray-400 mt-2">Track and analyze marketing campaign performance</p>
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
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {campaignFilters.map((filter) => (
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
                  placeholder="Search campaigns..."
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
                  title="Total Campaigns"
                  value={stats.total}
                  icon={BarChart3}
                  color="bg-blue-600"
                />
                <StatCard
                  title="Conversions"
                  value={stats.converted}
                  icon={Target}
                  color="bg-green-600"
                />
                <StatCard
                  title="Conversion Rate"
                  value={`${stats.conversionRate}%`}
                  icon={TrendingUp}
                  color="bg-purple-600"
                />
                <StatCard
                  title="Avg Visits"
                  value={stats.avgVisits}
                  icon={Eye}
                  color="bg-orange-600"
                />
              </div>

              {/* Campaign List Preview */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Campaigns</h3>
                <div className="space-y-3">
                  {filteredCampaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{campaign.utmCampaign}</p>
                          <p className="text-xs text-gray-400">
                            {campaign.utmSource} • {campaign.utmMedium}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          campaign.isConverted 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {campaign.isConverted ? 'Converted' : 'Active'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {campaign.visitCount} visits
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'campaigns' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">All Campaigns</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3">Campaign</th>
                      <th className="px-6 py-3">Source</th>
                      <th className="px-6 py-3">Medium</th>
                      <th className="px-6 py-3">Visits</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Created</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{campaign.utmCampaign}</p>
                            <p className="text-gray-400 text-xs">{campaign.utmCampaignId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{campaign.utmSource || 'Direct'}</td>
                        <td className="px-6 py-4 text-gray-300">{campaign.utmMedium || 'None'}</td>
                        <td className="px-6 py-4 text-gray-300">{campaign.visitCount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            campaign.isConverted 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {campaign.isConverted ? 'Converted' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {new Date(campaign.createdAt).toLocaleDateString()}
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

          {activeTab === 'conversions' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Conversion Tracking</h3>
              <p className="text-gray-400">Conversion tracking component will be implemented here</p>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
              <p className="text-gray-400">Traffic sources component will be implemented here</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 