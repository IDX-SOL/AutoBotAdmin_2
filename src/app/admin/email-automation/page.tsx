'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApiService from '@/utils/adminApiService';
import emailService, { EmailSchedulerStatus } from '@/utils/emailService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Mail, 
  Clock, 
  TrendingUp, 
  Users, 
  Bot,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
  Settings,
  FileText,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { EmailLog } from '@/utils/adminApiService';

interface EmailStats {
  totalEmails: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  statusBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  openRate?: number;
  clickRate?: number;
  schedulerStatus: EmailSchedulerStatus;
}


const EmailAutomationPage = () => {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Fetch email automation statistics
  const fetchStats = useCallback(async () => {
    try {
      const [statsResponse, statusResponse] = await Promise.all([
        adminApiService.getEmailStats(),
        emailService.getEmailSchedulerStatus()
      ]);
      
      const statsData = statsResponse.data as { success: boolean; stats?: { totalSent?: number; totalOpened?: number; totalClicked?: number; openRate?: number; clickRate?: number; }; message?: string };
      
      if (statsData.success && statsData.stats) {
        // Transform the response to match EmailStats interface
        const emailStats: EmailStats = {
          totalEmails: statsData.stats.totalSent || 0,
          last24Hours: 0, // Not available in current backend
          last7Days: 0, // Not available in current backend
          last30Days: 0, // Not available in current backend
          statusBreakdown: {
            sent: statsData.stats.totalSent || 0,
            opened: statsData.stats.totalOpened || 0,
            clicked: statsData.stats.totalClicked || 0,
            failed: 0 // Not available in current backend
          },
          typeBreakdown: {
            individual: 0, // Not available in current backend
            bulk: 0, // Not available in current backend
            all: statsData.stats.totalSent || 0
          },
          openRate: statsData.stats.openRate || 0,
          clickRate: statsData.stats.clickRate || 0,
          schedulerStatus: statusResponse || {
            emailServiceReady: false,
            schedulerRunning: false,
            lastRun: null,
            nextRun: null,
            activeJobs: []
          }
        };
        setStats(emailStats);
      } else {
        console.warn('API returned error:', statsData.message);
        setStats(null);
        showNotification('error', statsData.message || 'Failed to fetch email statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
      showNotification('error', 'Failed to fetch email statistics. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle scheduler actions
  const handleSchedulerAction = async (action: 'start' | 'stop') => {
    setActionLoading(action);
    try {
      let response;
      if (action === 'start') {
        response = await emailService.startEmailScheduler();
      } else {
        response = await emailService.stopEmailScheduler();
      }
      
      if (response.success) {
        showNotification('success', response.message);
        // Refresh stats after scheduler action
        fetchStats();
      } else {
        showNotification('error', response.message || `Failed to ${action} scheduler`);
      }
    } catch (error) {
      console.error(`Error ${action}ing scheduler:`, error);
      showNotification('error', `Failed to ${action} scheduler`);
    } finally {
      setActionLoading(null);
    }
  };

  // Run specific job
  const runJob = async (jobName: string) => {
    setActionLoading(jobName);
    try {
      const response = await emailService.runEmailJob(jobName);
      
      if (response.success) {
        showNotification('success', response.message);
        // Refresh stats after job execution
        fetchStats();
      } else {
        showNotification('error', response.message || `Failed to run job: ${jobName}`);
      }
    } catch (error) {
      console.error(`Error running job ${jobName}:`, error);
      showNotification('error', `Failed to run job: ${jobName}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Send welcome email
  const sendWelcomeEmail = async () => {
    const userId = prompt('Enter User ID to send welcome email:');
    if (!userId) return;

    setActionLoading('welcome');
    try {
      const response = await adminApiService.sendWelcomeEmail(parseInt(userId));
      
      if (response.data.success) {
        showNotification('success', response.data.message);
        // Refresh stats after sending welcome email
        fetchStats();
      } else {
        showNotification('error', response.data.message || 'Failed to send welcome email');
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      showNotification('error', 'Failed to send welcome email');
    } finally {
      setActionLoading(null);
    }
  };

  // Run all automations
  const runAllAutomations = async () => {
    setActionLoading('all');
    try {
      const response = await emailService.runAllEmailAutomations();
      
      if (response.success) {
        showNotification('success', response.message);
        // Refresh stats after running all automations
        fetchStats();
      } else {
        showNotification('error', response.message || 'Failed to run all automations');
      }
    } catch (error) {
      console.error('Error running all automations:', error);
      showNotification('error', 'Failed to run all automations');
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch email history
  const fetchEmailHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await emailService.getEmailHistory(1, 50);
      if (response.success) {
        setEmailHistory(response.emails);
      } else {
        showNotification('error', 'Failed to fetch email history');
      }
    } catch (error) {
      console.error('Error fetching email history:', error);
      showNotification('error', 'Failed to fetch email history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // View email content
  const viewEmailContent = async (emailId: number) => {
    try {
      const email = await emailService.getEmailLogDetails(emailId);
      if (email) {
        setSelectedEmail(email);
        setShowEmailModal(true);
      } else {
        showNotification('error', 'Failed to load email details');
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
      showNotification('error', 'Failed to load email details');
    }
  };

  // Resend email
  const resendEmail = async (emailId: number) => {
    try {
      const response = await emailService.resendEmail(emailId);
      if (response.success) {
        showNotification('success', response.message);
        fetchEmailHistory();
      } else {
        showNotification('error', response.message);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      showNotification('error', 'Failed to resend email');
    }
  };

  // Initialize templates
  const initializeTemplates = async () => {
    setActionLoading('init-templates');
    try {
      const response = await emailService.initializeEmailTemplates();
      if (response.success) {
        showNotification('success', response.message);
        fetchStats();
      } else {
        showNotification('error', response.message);
      }
    } catch (error) {
      console.error('Error initializing templates:', error);
      showNotification('error', 'Failed to initialize templates');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div></AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h3 className="text-lg font-medium">Unable to load email statistics</h3>
            <p className="text-sm">Please check if the backend server is running and try again.</p>
          </div>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div></AdminLayout>
    );
  }

  const jobSchedules = {
    'welcome-emails': 'Every 5 minutes',
    'follow-up-emails': 'Daily at 10 AM IST',
    'recharge-reminders': 'Daily at 2 PM IST',
    'bot-stopped-emails': 'Every 30 minutes',
    'success-stories': 'Weekly on Monday at 9 AM IST',
    'nitro-promotion': 'Every 3 days at 11 AM IST'
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Email Automation</h1>
            <p className="text-gray-400 mt-2">Manage automated email campaigns and scheduling</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSchedulerAction('start')}
              disabled={actionLoading === 'start' || stats?.schedulerStatus.schedulerRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg text-white font-medium transition-colors"
            >
              {actionLoading === 'start' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Start Scheduler</span>
            </button>
            <button
              onClick={() => handleSchedulerAction('stop')}
              disabled={actionLoading === 'stop' || !stats?.schedulerStatus.schedulerRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 rounded-lg text-white font-medium transition-colors"
            >
              {actionLoading === 'stop' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              <span>Stop Scheduler</span>
            </button>
            <button
              onClick={initializeTemplates}
              disabled={actionLoading === 'init-templates'}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg text-white font-medium transition-colors"
            >
              {actionLoading === 'init-templates' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              <span>Init Templates</span>
            </button>
          </div>
        </div>

      {notification && (
        <Alert className={
          notification.type === 'success' ? 'border-green-500' : 
          notification.type === 'error' ? 'border-red-500' : 
          'border-blue-500'
        }>
          <AlertDescription className={
            notification.type === 'success' ? 'text-green-700' : 
            notification.type === 'error' ? 'text-red-700' : 
            'text-blue-700'
          }>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
          <TabsTrigger value="history">Email History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="actions">Manual Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Emails</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.totalEmails || 0}</p>
                  <p className="text-sm text-gray-400 mt-1">All time</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-600">
                  <Mail className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Last 24 Hours</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.last24Hours || 0}</p>
                  <p className="text-sm text-gray-400 mt-1">Recent activity</p>
                </div>
                <div className="p-3 rounded-lg bg-green-600">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Open Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.openRate?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-400 mt-1">Email engagement</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-600">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Click Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.clickRate?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-400 mt-1">Link engagement</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-600">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Email Status Breakdown</h3>
              <div className="space-y-3">
                {stats?.statusBreakdown && Object.entries(stats.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'sent' ? 'bg-green-500' :
                        status === 'opened' ? 'bg-blue-500' :
                        status === 'clicked' ? 'bg-purple-500' :
                        status === 'failed' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="capitalize text-white font-medium">{status}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-300 bg-gray-700 px-2 py-1 rounded">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Email Type Breakdown</h3>
              <div className="space-y-3">
                {stats?.typeBreakdown && Object.entries(stats.typeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        type === 'individual' ? 'bg-emerald-500' :
                        type === 'bulk' ? 'bg-teal-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="capitalize text-white font-medium">{type.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-300 bg-gray-700 px-2 py-1 rounded">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Jobs</CardTitle>
              <CardDescription>Manage automated email jobs and their schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.schedulerStatus.activeJobs.map((jobName) => (
                  <div key={jobName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {jobName.includes('welcome') ? (
                        <Mail className="h-5 w-5 text-green-500" />
                      ) : jobName.includes('follow-up') ? (
                        <Users className="h-5 w-5 text-blue-500" />
                      ) : jobName.includes('recharge') ? (
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                      ) : jobName.includes('bot-stopped') ? (
                        <Bot className="h-5 w-5 text-red-500" />
                      ) : jobName.includes('success') ? (
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                      ) : jobName.includes('nitro') ? (
                        <TrendingUp className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Mail className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="font-medium capitalize">
                          {jobName.replace(/-/g, ' ')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {jobSchedules[jobName as keyof typeof jobSchedules] || 'Custom schedule'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={stats?.schedulerStatus.schedulerRunning ? 'default' : 'secondary'}>
                        {stats?.schedulerStatus.schedulerRunning ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runJob(jobName)}
                        disabled={actionLoading === jobName}
                      >
                        {actionLoading === jobName ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email History</CardTitle>
              <CardDescription>View sent emails and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button onClick={fetchEmailHistory} disabled={historyLoading}>
                    {historyLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh History
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {emailHistory.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          email.status === 'sent' ? 'bg-green-500' :
                          email.status === 'delivered' ? 'bg-blue-500' :
                          email.status === 'opened' ? 'bg-purple-500' :
                          email.status === 'clicked' ? 'bg-yellow-500' :
                          email.status === 'failed' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></div>
                        <div>
                          <h4 className="font-medium">{email.subject}</h4>
                          <p className="text-sm text-gray-500">
                            To: {email.user?.email || 'Unknown'} | 
                            Type: {email.type} | 
                            Status: {email.status} |
                            Sent: {new Date(email.sentAt || email.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewEmailContent(email.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {email.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendEmail(email.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage email templates for automated campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button onClick={initializeTemplates} disabled={actionLoading === 'init-templates'}>
                    {actionLoading === 'init-templates' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Initialize Templates
                  </Button>
                </div>
                
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Email templates will be loaded here once initialized.</p>
                  <p className="text-sm">Click &quot;Initialize Templates&quot; to create the default email templates.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Statistics</CardTitle>
              <CardDescription>Detailed email performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats?.last24Hours || 0}</div>
                  <p className="text-sm text-muted-foreground">Last 24 Hours</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats?.last7Days || 0}</div>
                  <p className="text-sm text-muted-foreground">Last 7 Days</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats?.last30Days || 0}</div>
                  <p className="text-sm text-muted-foreground">Last 30 Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Actions</CardTitle>
              <CardDescription>Execute email automation tasks manually</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={sendWelcomeEmail}
                  disabled={actionLoading === 'welcome'}
                  className="h-20"
                >
                  {actionLoading === 'welcome' ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Welcome Email
                </Button>

                <Button
                  onClick={runAllAutomations}
                  disabled={actionLoading === 'all'}
                  variant="outline"
                  className="h-20"
                >
                  {actionLoading === 'all' ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Run All Automations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Content Modal */}
      {showEmailModal && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Email Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmailModal(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="font-medium">Subject:</label>
                <p className="text-gray-700">{selectedEmail.subject}</p>
              </div>
              
              <div>
                <label className="font-medium">To:</label>
                <p className="text-gray-700">{selectedEmail.user?.email || 'Unknown'}</p>
              </div>
              
              <div>
                <label className="font-medium">Status:</label>
                <Badge variant={selectedEmail.status === 'sent' ? 'default' : 'secondary'}>
                  {selectedEmail.status}
                </Badge>
              </div>
              
              <div>
                <label className="font-medium">Type:</label>
                <p className="text-gray-700">{selectedEmail.type}</p>
              </div>
              
              <div>
                <label className="font-medium">Sent At:</label>
                <p className="text-gray-700">{new Date(selectedEmail.sentAt || selectedEmail.createdAt).toLocaleString()}</p>
              </div>
              
              {selectedEmail.error && (
                <div>
                  <label className="font-medium text-red-600">Error:</label>
                  <p className="text-red-600 text-sm">{selectedEmail.error}</p>
                </div>
              )}
              
              <div>
                <label className="font-medium">Content:</label>
                <div 
                  className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              {selectedEmail.status === 'failed' && (
                <Button
                  onClick={() => {
                    resendEmail(selectedEmail.id);
                    setShowEmailModal(false);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Resend Email
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default EmailAutomationPage;
