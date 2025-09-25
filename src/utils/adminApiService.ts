import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Additional properties for detailed user view
  campaignName?: string;
  totalBots?: number;
  isActive?: boolean;
  platform?: string;
  device?: string;
}

export interface Bot {
  id: string;
  engine: string;
  tokenName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Additional properties used by the admin bots page
  botName?: string;
  tokenSymbol?: string;
  userWallet?: string;
  ownerWalletAddress?: string;
  middleWalletAddress?: string;
  tokenAddress?: string;
  gasFees?: Record<string, unknown>;
  deletedAt?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    platform?: string;
    device?: string;
  };
  // Optional fields that might not be returned by the backend
  lastTradeAt?: string;
  firstRechageDate?: boolean;
  firstFundAdd?: boolean;
  // Enhanced fields for bot detail page
  lastLogs?: Array<Record<string, unknown>>;
  lastTrades?: Array<Record<string, unknown>>;
  warnings?: Array<Record<string, unknown>>;
  errors?: Array<Record<string, unknown>>;
  balanceInfo?: {
    sol: number;  
    token: number;
    lastUpdated: string | null;
    critical: boolean;
  };
  notificationStates?: {
    lowBalance1_5: boolean;
    lowBalance2_25: boolean;
    lowBalance2_5: boolean;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalBots: number;
  activeBots: number;
  totalAdmins: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentUsers: User[];
  recentBots: Bot[];
}

export interface LoginCredentials {
  username: string; // Changed from email to username to match the form
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminUser;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BotsResponse {
  bots: Bot[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminsResponse {
  admins: AdminUser[];
}

export interface WalletBalance {
  id: number;
  walletAddress: string;
  solBalance: number;
  solBalanceRaw: number;
  hasSolBalance: boolean;
  tokenBalances: Array<{
    mint: string;
    token: string;
    balance: number;
    balanceRaw: string;
    decimals: number;
    tokenAccount: string;
  }>;
  hasTokens: boolean;
  totalTokenTypes: number;
  hasAnyBalance: boolean;
  checkTimestamp: string;
  errorMessage?: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  data: {
    date: string;
    totalWallets: number;
    wallets: WalletBalance[];
  };
}

export interface WalletBalanceSummary {
  today: {
    date: string;
    totalWallets: number;
    totalSolBalance: number;
    totalTokenTypes: number;
    walletsWithSol: number;
    walletsWithTokens: number;
  };
  yesterday: {
    date: string;
    totalWallets: number;
    totalSolBalance: number;
    totalTokenTypes: number;
    walletsWithSol: number;
    walletsWithTokens: number;
  };
  changes: {
    walletCountChange: number;
    solBalanceChange: number;
    tokenTypesChange: number;
  };
}

export interface CronStatus {
  running: boolean;
  scheduled: boolean;
  nextRun: string;
  timezone: string;
  schedule: string;
}

// Email-related interfaces
export interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

export interface EmailStatus {
  emailServiceReady: boolean;
  schedulerRunning: boolean;
  lastRun: string | null;
  nextRun: string | null;
  activeJobs: string[];
}

export interface EmailSchedulerResponse {
  success: boolean;
  message: string;
  timestamp: string;
  results?: Array<{ job: string; status: string; error?: string }>;
  templatesCreated?: number;
  templates?: Array<{ id: number; name: string; category: string }>;
}

export interface EmailJobResponse {
  success: boolean;
  message: string;
  jobName?: string;
  timestamp: string;
  results?: Array<{ job: string; status: string; error?: string }>;
}

export interface WelcomeEmailResponse {
  success: boolean;
  message: string;
  userId: number;
  timestamp: string;
}
export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  botId: number;
  message: string;
  metadata: Record<string, unknown>;
  error?: Record<string, unknown>;
  tradeData?: Record<string, unknown>;
  walletData?: Record<string, unknown>;
}

export interface BotLogsResponse {
  success: boolean;
  data: {
    logs: LogEntry[];
    total: number;
    botId: number;
    logType: string;
    availableDates: string[];
    summary: {
      total: number;
      byLevel: Record<string, number>;
      dateRange: {
        earliest: string;
        latest: string;
      } | null;
    };
  };
}

export interface EmailLog {
  id: number;
  userId: number;
  subject: string;
  content: string;
  templateId?: number;
  type: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentBy: number;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
  emailProvider?: string;
  messageId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  sender?: {
    id: number;
    username: string;
  };
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  createdBy: number;
  isActive: boolean;
  category: 'welcome' | 'notification' | 'marketing' | 'maintenance' | 'custom';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailHistoryResponse {
  success: boolean;
  emails: EmailLog[];
  total: number;
  page: number;
  totalPages: number;
}

// Create admin axios instance with different configuration
const adminAxiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://autobot-back-dev.idxsolana.io',
  timeout: 0, // No timeout - allow operations to complete
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Create a separate instance for wallet operations with no timeout
const walletAxiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://autobot-back-dev.idxsolana.io',
  timeout: 0, // No timeout - allow wallet operations to complete
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add admin token
adminAxiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add same interceptor to wallet instance
walletAxiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle admin authentication
adminAxiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Admin token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        // Redirect to admin login
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Admin API service methods
const adminApiService = {
  // Authentication
  login: (credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> => 
    adminAxiosInstance.post('/admin/login', credentials),
  
  // Dashboard
  getDashboardStats: (): Promise<AxiosResponse<DashboardData>> => 
    adminAxiosInstance.get('/admin/dashboard/stats'),
  
  // Users management
  getUsers: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<UsersResponse>> => 
    adminAxiosInstance.get('/admin/users', { params }),
  getUser: (userId: string): Promise<AxiosResponse<User>> => 
    adminAxiosInstance.get(`/admin/users/${userId}`),
  updateUser: (userId: string, userData: Partial<User>): Promise<AxiosResponse<User>> => 
    adminAxiosInstance.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId: string): Promise<AxiosResponse<void>> => 
    adminAxiosInstance.delete(`/admin/users/${userId}`),
  
  // Admins management
  getAdmins: (): Promise<AxiosResponse<AdminsResponse>> => 
    adminAxiosInstance.get('/admin/admins'),
  createAdmin: (adminData: Partial<AdminUser>): Promise<AxiosResponse<AdminUser>> => 
    adminAxiosInstance.post('/admin/admins', adminData),
  updateAdmin: (adminId: string, adminData: Partial<AdminUser>): Promise<AxiosResponse<AdminUser>> => 
    adminAxiosInstance.put(`/admin/admins/${adminId}`, adminData),
  deleteAdmin: (adminId: string): Promise<AxiosResponse<void>> => 
    adminAxiosInstance.delete(`/admin/admins/${adminId}`),
  
  // Bots management
  getBots: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<BotsResponse>> => 
    adminAxiosInstance.get('/admin/bots', { params }),
  getBot: (botId: string): Promise<AxiosResponse<Bot>> => 
    adminAxiosInstance.get(`/admin/bots/${botId}`),
  updateBot: (botId: string, botData: Partial<Bot>): Promise<AxiosResponse<Bot>> => 
    adminAxiosInstance.put(`/admin/bots/${botId}`, botData),
  deleteBot: (botId: string): Promise<AxiosResponse<void>> => 
    adminAxiosInstance.delete(`/admin/bots/${botId}`),
  getBotTradeWallets: (botId: string): Promise<AxiosResponse<string>> => 
    adminAxiosInstance.get(`/admin/bots/${botId}/trade-wallets`),
  restoreBot: (botId: string): Promise<AxiosResponse<Bot>> => 
    adminAxiosInstance.post(`/admin/bots/${botId}/restore`),
  
  // Bot logs management
  getBotLogs: (botId: string, params?: { type?: string; limit?: number; date?: string; page?: number }): Promise<AxiosResponse<BotLogsResponse>> => 
    adminAxiosInstance.get(`/admin/bots/${botId}/logs`, { params }),
  clearBotLogs: (botId: string): Promise<AxiosResponse<void>> => 
    adminAxiosInstance.delete(`/admin/bots/${botId}/logs`),
  
  // Analytics and reports
  getAnalytics: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<string>> => 
    adminAxiosInstance.get('/admin/analytics', { params }),
  getReports: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<string>> => 
    adminAxiosInstance.get('/admin/reports', { params }),
  
  // System management
  getSystemStatus: (): Promise<AxiosResponse<string>> => 
    adminAxiosInstance.get('/admin/system/status'),
  getLogs: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<string>> => 
    adminAxiosInstance.get('/admin/system/logs', { params }),
  
  // Campaigns management
  getCampaignsList: (): Promise<AxiosResponse<unknown>> => 
    adminAxiosInstance.get('/admin-dev/campaigns/list'),
  getCampaignsStats: (): Promise<AxiosResponse<unknown>> => 
    adminAxiosInstance.get('/admin-dev/campaigns/stats'),
  
  // Tokens management
  getTokensList: (): Promise<AxiosResponse<unknown>> => 
    adminAxiosInstance.get('/admin-dev/tokens/list'),
  getTokensStats: (): Promise<AxiosResponse<unknown>> => 
    adminAxiosInstance.get('/admin-dev/tokens/stats'),
  
  // Email Automation
  getEmailStats: (): Promise<AxiosResponse<{ success: boolean; stats: EmailStats }>> => 
    adminAxiosInstance.get('/admin/emails/stats'),
  getEmailStatus: (): Promise<AxiosResponse<{ success: boolean; status: EmailStatus }>> => 
    adminAxiosInstance.get('/admin/emails/status'),
  startEmailScheduler: (): Promise<AxiosResponse<EmailSchedulerResponse>> => 
    adminAxiosInstance.post('/admin/emails/start'),
  stopEmailScheduler: (): Promise<AxiosResponse<EmailSchedulerResponse>> => 
    adminAxiosInstance.post('/admin/emails/stop'),
  runEmailJob: (jobName: string): Promise<AxiosResponse<EmailJobResponse>> => 
    adminAxiosInstance.post('/admin/emails/run-job', { jobName }),
  sendWelcomeEmail: (userId: number): Promise<AxiosResponse<WelcomeEmailResponse>> => 
    adminAxiosInstance.post('/admin/emails/send-welcome', { userId }),
  runAllEmailAutomations: (): Promise<AxiosResponse<EmailSchedulerResponse>> => 
    adminAxiosInstance.post('/admin/emails/run-all'),
  initializeEmailTemplates: (): Promise<AxiosResponse<EmailSchedulerResponse>> => 
    adminAxiosInstance.post('/admin/emails/init-templates'),
  
  // Email Monitoring
  getEmailLogs: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<EmailHistoryResponse>> => 
    adminAxiosInstance.get('/admin/emails/history', { params }),
  getEmailLogDetails: (emailId: number): Promise<AxiosResponse<{ success: boolean; email: EmailLog }>> => 
    adminAxiosInstance.get(`/admin/emails/history/${emailId}`),
  resendEmail: (emailId: number): Promise<AxiosResponse<{ success: boolean; message: string; emailId: number; timestamp: string }>> => 
    adminAxiosInstance.post(`/admin/emails/history/${emailId}/resend`),
  
  // Email Templates
  getEmailTemplates: (): Promise<AxiosResponse<{ success: boolean; templates: EmailTemplate[] }>> => 
    adminAxiosInstance.get('/admin/emails/templates'),
  createEmailTemplate: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse<{ success: boolean; templateId: number; message: string }>> => 
    adminAxiosInstance.post('/admin/emails/templates', template),
  updateEmailTemplate: (templateId: number, template: Partial<EmailTemplate>): Promise<AxiosResponse<{ success: boolean; message: string }>> => 
    adminAxiosInstance.put(`/admin/emails/templates/${templateId}`, template),
  deleteEmailTemplate: (templateId: number): Promise<AxiosResponse<{ success: boolean; message: string }>> => 
    adminAxiosInstance.delete(`/admin/emails/templates/${templateId}`),
  
  // Wallet Balance Management
  getWalletBalancesToday: (): Promise<AxiosResponse<WalletBalanceResponse>> => 
    adminAxiosInstance.get('/wallet-balance/today'),
  getWalletBalancesByDate: (date: string, onlyWithBalance: boolean = true): Promise<AxiosResponse<WalletBalanceResponse>> => 
    adminAxiosInstance.get(`/wallet-balance/date/${date}`, { params: { onlyWithBalance } }),
  getWalletBalanceStats: (startDate: string, endDate: string): Promise<AxiosResponse<unknown>> => 
    adminAxiosInstance.get('/wallet-balance/stats', { params: { startDate, endDate } }),
  getWalletBalanceSummary: (): Promise<AxiosResponse<WalletBalanceSummary>> => 
    adminAxiosInstance.get('/wallet-balance/summary'),
  getWalletBalanceRecent: (limit: number = 7): Promise<AxiosResponse<unknown>> => 
    adminAxiosInstance.get('/wallet-balance/recent', { params: { limit } }),
  triggerWalletBalanceCheck: (): Promise<AxiosResponse<unknown>> => 
    adminAxiosInstance.post('/wallet-balance/check-now'),
  getWalletBalanceCronStatus: (): Promise<AxiosResponse<CronStatus>> => 
    adminAxiosInstance.get('/wallet-balance/cron-status'),
  
  // New wallet balance features
  checkBotWallets: (botId: number, checkDate?: string, includeTradeWallets?: boolean, timeWindowHours?: number): Promise<AxiosResponse<unknown>> => 
    walletAxiosInstance.post(`/wallet-balance/check-bot/${botId}`, { checkDate, includeTradeWallets, timeWindowHours }),
  checkWalletsAtDateTime: (checkDateTime: string, walletAddresses?: string[]): Promise<AxiosResponse<unknown>> => 
    walletAxiosInstance.post('/wallet-balance/check-datetime', { checkDateTime, walletAddresses }),
  checkWalletsInDateRange: (startDateTime: string, endDateTime: string): Promise<AxiosResponse<unknown>> => 
    walletAxiosInstance.post('/wallet-balance/check-date-range', { startDateTime, endDateTime }),
  checkWalletsInDateRangeStream: (startDateTime: string, endDateTime: string): EventSource => {
    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://autobot-back-dev.idxsolana.io';
    
    // Create EventSource for Server-Sent Events
    // Note: EventSource doesn't support custom headers, so we'll need to handle auth differently
    const eventSource = new EventSource(`${baseURL}/api/wallet-balance/check-date-range-stream?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}`);
    
    return eventSource;
  },
  getLastCheckedWallet: (): Promise<AxiosResponse<{ success: boolean; data: { lastCheckedWallet: string | null; hasLastChecked: boolean } }>> => 
    adminAxiosInstance.get('/wallet-balance/last-checked'),
  
  // Utility methods
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('adminToken');
    return !!token;
  },
  
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/admin/login';
    }
  },
  
  // Get admin data
  getAdminData: (): AdminUser | null => {
    if (typeof window === 'undefined') return null;
    const adminData = localStorage.getItem('adminData');
    return adminData ? JSON.parse(adminData) : null;
  },
  
  // Get axios instance for advanced usage
  getAxiosInstance: (): AxiosInstance => adminAxiosInstance
};

export default adminApiService;