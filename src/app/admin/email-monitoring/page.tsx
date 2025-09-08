'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApiService from '@/utils/adminApiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  AlertCircle,
  Eye,
  RotateCcw,
  Calendar,
  User,
  FileText,
  TrendingUp
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface EmailLog {
  id: number;
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  type: 'individual' | 'bulk' | 'all';
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
  emailProvider?: string;
  messageId?: string;
  metadata?: { emailType?: string; [key: string]: unknown };
  user: {
    id: number;
    username: string;
    email: string;
  };
  template?: {
    id: number;
    name: string;
    category: string;
  };
  sender: {
    id: number;
    username: string;
    email: string;
  };
}

interface EmailLogsResponse {
  emailLogs: EmailLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    statusCounts: Record<string, number>;
    typeCounts: Record<string, number>;
    emailTypeCounts: Record<string, number>;
  };
}

const EmailMonitoringPage = () => {
  const [emailLogs, setEmailLogs] = useState<EmailLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showEmailDetails, setShowEmailDetails] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    type: '',
    emailType: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Fetch email logs
  const fetchEmailLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getEmailLogs(filters);
      const data = response.data as { success: boolean; data: EmailLogsResponse; message?: string };
      
      if (data.success) {
        setEmailLogs(data.data);
      } else {
        console.warn('API returned error:', data.message);
        setEmailLogs(null); // Set to null to show no data state
        showNotification('error', data.message || 'Failed to fetch email logs');      
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      setEmailLogs(null); // Set to null to show no data state
      showNotification('error', 'Failed to fetch email logs. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
      page: 1 // Reset to first page when filtering
    }));
  };

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  // View email details
  const viewEmailDetails = async (emailId: number) => {
    try {
      setActionLoading(`view-${emailId}`);
      const response = await adminApiService.getEmailLogDetails(emailId);
      const data = response.data as { success: boolean; data: EmailLog; message?: string };
      
      if (data.success) {
        setSelectedEmail(data.data);
        setShowEmailDetails(true);
      } else {
        showNotification('error', data.message || 'Failed to fetch email details');
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
      showNotification('error', 'Failed to fetch email details. Please check if the backend server is running.');
    } finally {
      setActionLoading(null);
    }
  };

  // Resend email
  const resendEmail = async (emailId: number) => {
    try {
      setActionLoading(`resend-${emailId}`);
      const response = await adminApiService.resendEmail(emailId);
      const data = response.data as { success: boolean; message: string };
      
      if (data.success) {
        showNotification('success', data.message);
        fetchEmailLogs(); // Refresh the list
      } else {
        showNotification('error', data.message);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      showNotification('error', 'Failed to resend email. Please check if the backend server is running.');
    } finally {
      setActionLoading(null);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'opened':
      case 'clicked':
        return 'default';
      case 'failed':
      case 'bounced':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'opened':
      case 'clicked':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // Format email type
  const formatEmailType = (emailType: string | undefined) => {
    if (!emailType) return 'Unknown';
    return emailType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  useEffect(() => {
    fetchEmailLogs();
  }, [fetchEmailLogs]);

  if (loading && !emailLogs) {
    return (
        <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div></AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Email Monitoring</h1>
            <p className="text-gray-400 text-lg">Monitor all sent emails, their status, and content</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-white font-medium">{new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
            <button
              onClick={fetchEmailLogs}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-800 disabled:to-blue-900 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        {emailLogs && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Emails</p>
                  <p className="text-3xl font-bold mt-2">{emailLogs.pagination.total}</p>
                  <p className="text-blue-200 text-xs mt-1">All time</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Mail className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold mt-2">
                    {Math.round((emailLogs.filters.statusCounts.sent || 0) / emailLogs.pagination.total * 100)}%
                  </p>
                  <p className="text-green-200 text-xs mt-1">Successfully sent</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Failed</p>
                  <p className="text-3xl font-bold mt-2">{emailLogs.filters.statusCounts.failed || 0}</p>
                  <p className="text-red-200 text-xs mt-1">Failed emails</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <XCircle className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold mt-2">{emailLogs.filters.statusCounts.pending || 0}</p>
                  <p className="text-yellow-200 text-xs mt-1">Pending emails</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Clock className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        )}

      {notification && (
        <Alert className={notification.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription className={notification.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Enhanced Filters */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Filters & Search</h3>
                  <p className="text-sm text-gray-400 font-normal">Refine your email monitoring data</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search subject or content..."
                      value={filters.search}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <Select value={filters.status || 'all'} onValueChange={(value: string) => handleFilterChange('status', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">All statuses</SelectItem>
                      {emailLogs?.filters.statusCounts && Object.entries(emailLogs.filters.statusCounts).map(([status, count]) => (
                        <SelectItem key={status} value={status} className="text-white hover:bg-gray-700">
                          {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Type</label>
                  <Select value={filters.type || 'all'} onValueChange={(value: string) => handleFilterChange('type', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">All types</SelectItem>
                      {emailLogs?.filters.typeCounts && Object.entries(emailLogs.filters.typeCounts).map(([type, count]) => (
                        <SelectItem key={type} value={type} className="text-white hover:bg-gray-700">
                          {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Email Type</label>
                  <Select value={filters.emailType || 'all'} onValueChange={(value: string) => handleFilterChange('emailType', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="All email types" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">All email types</SelectItem>
                      {emailLogs?.filters.emailTypeCounts && Object.entries(emailLogs.filters.emailTypeCounts).map(([emailType, count]) => (
                        <SelectItem key={emailType} value={emailType} className="text-white hover:bg-gray-700">
                          {emailType.charAt(0).toUpperCase() + emailType.slice(1)} ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">User ID</label>
                  <Input
                    placeholder="Enter user ID"
                    value={filters.userId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('userId', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('startDate', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('endDate', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Email Logs Display */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Mail className="h-5 w-5" />
                    </div>
                    Email Logs
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Showing {emailLogs?.pagination.total || 0} emails
                    {emailLogs?.pagination && (
                      <span> (Page {emailLogs.pagination.page} of {emailLogs.pagination.pages})</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                    {emailLogs?.filters.statusCounts.sent || 0} Sent
                  </div>
                  <div className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm font-medium">
                    {emailLogs?.filters.statusCounts.failed || 0} Failed
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {emailLogs?.emailLogs.map((email) => (
                  <div key={email.id} className="bg-gray-700/30 hover:bg-gray-700/50 rounded-xl p-6 border border-gray-600/50 transition-all duration-200 hover:border-gray-500/50 hover:shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(email.status)}
                            <h3 className="font-semibold text-white text-lg">{email.subject}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              email.status === 'sent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              email.status === 'opened' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              email.status === 'clicked' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              email.status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              email.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {email.status.toUpperCase()}
                            </span>
                            {email.metadata?.emailType && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-600/50 text-gray-300 border border-gray-500/50">
                                {formatEmailType(email.metadata.emailType)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <User className="h-4 w-4 text-blue-400" />
                            <span className="font-medium">{email.user.username}</span>
                            <span className="text-gray-500">({email.user.email})</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="h-4 w-4 text-green-400" />
                            <span>{formatDate(email.createdAt)}</span>
                          </div>
                          {email.template && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <FileText className="h-4 w-4 text-purple-400" />
                              <span>{email.template.name}</span>
                            </div>
                          )}
                        </div>

                        {email.error && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                              <AlertCircle className="h-4 w-4" />
                              Error Details
                            </div>
                            <p className="text-red-300 text-sm">{email.error}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 ml-6">
                        <button
                          onClick={() => viewEmailDetails(email.id)}
                          disabled={actionLoading === `view-${email.id}`}
                          className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-xl text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                          title="View Details"
                        >
                          {actionLoading === `view-${email.id}` ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        
                        {email.status === 'failed' && (
                          <button
                            onClick={() => resendEmail(email.id)}
                            disabled={actionLoading === `resend-${email.id}`}
                            className="p-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 rounded-xl text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                            title="Resend Email"
                          >
                            {actionLoading === `resend-${email.id}` ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {!emailLogs && !loading && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                      <h3 className="text-lg font-medium text-white">Unable to load email logs</h3>
                      <p className="text-sm text-gray-400">Please check if the backend server is running and try again.</p>
                    </div>
                    <button 
                      onClick={fetchEmailLogs} 
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors mx-auto"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}

                {emailLogs?.emailLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No emails found matching your filters.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {emailLogs?.pagination && emailLogs.pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    Showing {((emailLogs.pagination.page - 1) * emailLogs.pagination.limit) + 1} to{' '}
                    {Math.min(emailLogs.pagination.page * emailLogs.pagination.limit, emailLogs.pagination.total)} of{' '}
                    {emailLogs.pagination.total} emails
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFilterChange('page', (emailLogs.pagination.page - 1).toString())}
                      disabled={emailLogs.pagination.page <= 1}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-300 px-3">
                      Page {emailLogs.pagination.page} of {emailLogs.pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => handleFilterChange('page', (emailLogs.pagination.page + 1).toString())}
                      disabled={emailLogs.pagination.page >= emailLogs.pagination.pages}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          {/* Enhanced Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Emails</p>
                  <p className="text-3xl font-bold mt-2">{emailLogs?.pagination.total || 0}</p>
                  <p className="text-blue-200 text-xs mt-1">All time</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Mail className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold mt-2">
                    {emailLogs?.filters.statusCounts ? 
                      Math.round((emailLogs.filters.statusCounts.sent || 0) / emailLogs.pagination.total * 100) : 0}%
                  </p>
                  <p className="text-green-200 text-xs mt-1">Successfully sent</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Failed</p>
                  <p className="text-3xl font-bold mt-2">{emailLogs?.filters.statusCounts.failed || 0}</p>
                  <p className="text-red-200 text-xs mt-1">Failed emails</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <XCircle className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold mt-2">{emailLogs?.filters.statusCounts.pending || 0}</p>
                  <p className="text-yellow-200 text-xs mt-1">Pending emails</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Clock className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-600 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Status Breakdown</h3>
              </div>
              <div className="space-y-4">
                {emailLogs?.filters.statusCounts && Object.entries(emailLogs.filters.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600/50 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${
                        status === 'sent' ? 'bg-green-500' :
                        status === 'opened' ? 'bg-blue-500' :
                        status === 'clicked' ? 'bg-purple-500' :
                        status === 'failed' ? 'bg-red-500' :
                        status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="capitalize text-white font-medium text-lg">{status}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-300 bg-gray-600/50 px-4 py-2 rounded-lg">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Email Type Breakdown</h3>
              </div>
              <div className="space-y-4">
                {emailLogs?.filters.emailTypeCounts && Object.entries(emailLogs.filters.emailTypeCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600/50 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${
                        type.includes('welcome') ? 'bg-emerald-500' :
                        type.includes('followup') ? 'bg-teal-500' :
                        type.includes('promotion') ? 'bg-cyan-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="capitalize text-white font-medium text-lg">{type.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-300 bg-gray-600/50 px-4 py-2 rounded-lg">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Details Dialog */}
      <Dialog open={showEmailDetails} onOpenChange={setShowEmailDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              Complete details and content of the selected email
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-6">
              {/* Email Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedEmail.status)}
                  <h3 className="text-lg font-semibold">{selectedEmail.subject}</h3>
                    <Badge variant={getStatusBadgeVariant(selectedEmail.status)}>
                      {selectedEmail.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>To:</strong> {selectedEmail.user.username} ({selectedEmail.user.email})
                  </div>
                  <div>
                    <strong>From:</strong> {selectedEmail.sender.username} ({selectedEmail.sender.email})
                  </div>
                  <div>
                    <strong>Created:</strong> {formatDate(selectedEmail.createdAt)}
                  </div>
                  {selectedEmail.sentAt && (
                    <div>
                      <strong>Sent:</strong> {formatDate(selectedEmail.sentAt)}
                    </div>
                  )}
                  {selectedEmail.template && (
                    <div>
                      <strong>Template:</strong> {selectedEmail.template.name} ({selectedEmail.template.category})
                    </div>
                  )}
                  {selectedEmail.messageId && (
                    <div>
                      <strong>Message ID:</strong> {selectedEmail.messageId}
                    </div>
                  )}
                </div>

                {selectedEmail.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <strong className="text-red-800">Error:</strong>
                    <p className="text-red-700 mt-1">{selectedEmail.error}</p>
                  </div>
                )}
              </div>

              {/* Email Content */}
              <div className="space-y-2">
                <h4 className="font-medium">Email Content:</h4>
                <div 
                  className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                />
              </div>

              {/* Metadata */}
              {selectedEmail.metadata && (
                <div className="space-y-2">
                  <h4 className="font-medium">Metadata:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedEmail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default EmailMonitoringPage;
