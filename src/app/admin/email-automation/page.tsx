'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApiService from '@/utils/adminApiService';
import emailService, { EmailSchedulerStatus } from '@/utils/emailService';
import JoditEditor from 'jodit-react';
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
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { EmailLog, EmailTemplate } from '@/utils/adminApiService';

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
  
  // Template management state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'custom' as 'welcome' | 'notification' | 'marketing' | 'maintenance' | 'custom',
    tags: [] as string[],
    isActive: true
  });
  const [templateLoading, setTemplateLoading] = useState(false);

  // Jodit Editor configuration
  const joditConfig = {
    readonly: false,
    height: 400,
    theme: 'dark',
    toolbar: true,
    toolbarButtonSize: 'middle' as const,
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html' as const,
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', '|',
      'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'symbol', 'fullsize', 'print', 'about'
    ],
    removeButtons: ['brush', 'file'],
    zIndex: 0,
    maxHeight: 500,
    direction: 'ltr' as const,
    language: 'en',
    debugLanguage: false,
    i18n: {
      'en': {
        'Type something': 'Type something...',
        'Advanced': 'Advanced',
        'Source': 'Source',
        'Bold': 'Bold',
        'Italic': 'Italic',
        'Underline': 'Underline',
        'Strikethrough': 'Strikethrough',
        'Superscript': 'Superscript',
        'Subscript': 'Subscript',
        'Align Left': 'Align Left',
        'Center': 'Center',
        'Align Right': 'Align Right',
        'Justify': 'Justify',
        'Ordered List': 'Ordered List',
        'Unordered List': 'Unordered List',
        'Indent': 'Indent',
        'Outdent': 'Outdent',
        'Font': 'Font',
        'Font Size': 'Font Size',
        'Text Color': 'Text Color',
        'Background Color': 'Background Color',
        'Insert Link': 'Insert Link',
        'Insert Image': 'Insert Image',
        'Insert Table': 'Insert Table',
        'Undo': 'Undo',
        'Redo': 'Redo',
        'Cut': 'Cut',
        'Copy': 'Copy',
        'Paste': 'Paste',
        'Select All': 'Select All',
        'Remove Format': 'Remove Format',
        'Full Screen': 'Full Screen',
        'Print': 'Print',
        'About': 'About'
      }
    }
  };

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
          schedulerStatus: {
            emailServiceReady: statusResponse?.emailServiceReady || false,
            schedulerRunning: statusResponse?.schedulerRunning || false,
            lastRun: statusResponse?.lastRun || null,
            nextRun: statusResponse?.nextRun || null,
            activeJobs: statusResponse?.activeJobs || []
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

  // Template management functions
  const fetchTemplates = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const response = await emailService.getTemplates();
      setTemplates(response);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showNotification('error', 'Failed to fetch templates');
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  const openTemplateModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category,
        tags: template.tags,
        isActive: template.isActive
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        subject: '',
        content: '',
        category: 'custom' as 'welcome' | 'notification' | 'marketing' | 'maintenance' | 'custom',
        tags: [],
        isActive: true
      });
    }
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      subject: '',
      content: '',
        category: 'custom' as 'welcome' | 'notification' | 'marketing' | 'maintenance' | 'custom',
      tags: [],
      isActive: true
    });
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.subject.trim() || !templateForm.content.trim()) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    setTemplateLoading(true);
    try {
      if (editingTemplate) {
        // Update existing template
        const response = await emailService.updateTemplate(editingTemplate.id, templateForm);
        if (response.success) {
          showNotification('success', 'Template updated successfully');
          fetchTemplates();
          closeTemplateModal();
        } else {
          showNotification('error', response.message || 'Failed to update template');
        }
      } else {
        // Create new template
        const templateData = {
          ...templateForm,
          createdBy: 1, // Admin user ID
          updatedAt: new Date().toISOString()
        };
        const response = await emailService.saveTemplate(templateData);
        if (response.success) {
          showNotification('success', 'Template created successfully');
          fetchTemplates();
          closeTemplateModal();
        } else {
          showNotification('error', response.message || 'Failed to create template');
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showNotification('error', 'Failed to save template');
    } finally {
      setTemplateLoading(false);
    }
  };

  const deleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setTemplateLoading(true);
    try {
      const response = await emailService.deleteTemplate(templateId);
      if (response.success) {
        showNotification('success', 'Template deleted successfully');
        fetchTemplates();
      } else {
        showNotification('error', response.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showNotification('error', 'Failed to delete template');
    } finally {
      setTemplateLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !templateForm.tags.includes(tag.trim())) {
      setTemplateForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
    fetchTemplates();
  }, [fetchStats, fetchTemplates]);

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
          <TabsTrigger value="templates">Templates</TabsTrigger>
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold text-white">Scheduled Jobs</CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    Manage automated email campaigns and their execution schedules
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${stats?.schedulerStatus.schedulerRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-300">
                      {stats?.schedulerStatus.schedulerRunning ? 'Scheduler Active' : 'Scheduler Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats?.schedulerStatus.activeJobs || []).map((jobName) => (
                  <div key={jobName} className="group bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 hover:border-gray-600 rounded-xl p-6 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {jobName.includes('welcome') ? (
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                              <Mail className="h-6 w-6 text-green-400" />
                            </div>
                          ) : jobName.includes('follow-up') ? (
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                              <Users className="h-6 w-6 text-blue-400" />
                            </div>
                          ) : jobName.includes('recharge') ? (
                            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-orange-400" />
                            </div>
                          ) : jobName.includes('bot-stopped') ? (
                            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                              <Bot className="h-6 w-6 text-red-400" />
                            </div>
                          ) : jobName.includes('success') ? (
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-purple-400" />
                            </div>
                          ) : jobName.includes('nitro') ? (
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                              <Settings className="h-6 w-6 text-yellow-400" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center">
                              <Clock className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {jobName.replace(/-/g, ' ')}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Schedule: {jobSchedules[jobName as keyof typeof jobSchedules] || 'Custom schedule'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge 
                              variant={stats?.schedulerStatus.schedulerRunning ? 'default' : 'secondary'}
                              className={stats?.schedulerStatus.schedulerRunning ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                              {stats?.schedulerStatus.schedulerRunning ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Last run: {stats?.schedulerStatus.lastRun ? new Date(stats.schedulerStatus.lastRun).toLocaleString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runJob(jobName)}
                          disabled={actionLoading === jobName}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          {actionLoading === jobName ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Run Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!stats?.schedulerStatus.activeJobs || stats.schedulerStatus.activeJobs.length === 0) && (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No Active Jobs</h3>
                    <p className="text-gray-500">No scheduled email jobs are currently active.</p>
                  </div>
                )}
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold text-white">Email Templates</CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    Create and manage email templates for automated campaigns
                  </CardDescription>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    onClick={initializeTemplates} 
                    disabled={actionLoading === 'init-templates'} 
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    {actionLoading === 'init-templates' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Initialize Templates
                  </Button>
                  <Button 
                    onClick={() => openTemplateModal()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {templateLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-10 w-10 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Templates Found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Get started by creating your first email template or initialize the default templates.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Button 
                      onClick={() => openTemplateModal()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                    <Button 
                      onClick={initializeTemplates}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Initialize Defaults
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div key={template.id} className="group bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 hover:border-gray-600 rounded-xl p-6 transition-all duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                          <p className="text-sm text-gray-400 line-clamp-2">{template.subject}</p>
                        </div>
                        <div className="flex space-x-1 ml-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTemplateModal(template)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTemplate(template.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={template.isActive ? 'default' : 'secondary'}
                            className={template.isActive ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="border-gray-600 text-gray-300"
                          >
                            {template.category}
                          </Badge>
                        </div>
                        
                        {template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map((tag, index) => (
                              <span key={index} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </h3>
              <Button variant="outline" size="sm" onClick={closeTemplateModal} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Template Name *</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as 'welcome' | 'notification' | 'marketing' | 'maintenance' | 'custom' }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="custom">Custom</option>
                    <option value="welcome">Welcome</option>
                    <option value="notification">Notification</option>
                    <option value="marketing">Marketing</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Subject *</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Content *</label>
                <div className="border border-gray-600 rounded-md overflow-hidden">
                  <JoditEditor
                    value={templateForm.content}
                    config={joditConfig}
                    onBlur={(newContent) => setTemplateForm(prev => ({ ...prev, content: newContent }))}
                    onChange={(newContent) => setTemplateForm(prev => ({ ...prev, content: newContent }))}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {templateForm.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-sm flex items-center">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-200 hover:text-blue-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add a tag and press Enter"
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                  Active (template can be used for sending emails)
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={closeTemplateModal} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Cancel
              </Button>
              <Button 
                onClick={saveTemplate} 
                disabled={templateLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {templateLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingTemplate ? 'Update Template' : 'Create Template'}
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
