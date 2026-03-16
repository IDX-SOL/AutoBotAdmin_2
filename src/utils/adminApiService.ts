import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface AdminUser {
  id: string;
  username?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  permissions?: Record<string, boolean>;
  isActive?: boolean;
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
  country?: string;
  totalHoldersProcessed?: number;
  totalReactionsProcessed?: number;
  volumeBotsWithRechargeAndFund?: number;
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
  gasFees?: number;
  deletedAt?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    platform?: string;
    device?: string;
    country?: string;
  };
  // Optional fields that might not be returned by the backend
  lastTradeAt?: string;
  firstRechageDate?: boolean;
  firstFundAdd?: boolean;
  lastLogs?: Array<{
    timestamp: string;
    message: string;
    level?: string;
  }>;
  lastTrades?: Array<{
    id: string;
    timestamp: string;
    tradeType: string;
    amount: number;
    token: string;
    transactionSignature?: string;
  }>;
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
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: string;
  admin: AdminUser;
}

/** Optional filter params for GET /admin/users (backend implements filtering) */
export interface UsersListFilterParams {
  recharged?: boolean;
  campaign?: boolean;
  holderGreaterThan1?: boolean;
  reactionGreaterThan1?: boolean;
  botGreaterThan1?: boolean;
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

export interface HolderBot {
  id: number;
  userId?: number;
  ownerWalletAddress: string;
  mintAddress: string;
  perHolderTokenAmount?: number;
  holdersProcessed?: number;
  totalSolSpent?: number;
  totalTokenTransferred?: number;
  totalTokenSent?: number;
  tokenName?: string;
  tokenSymbol?: string;
  status?: string;
  lastHolderWalletIndex?: number;
  botName?: string;
  fundAdded?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    platform?: string;
    device?: string;
  };
}

export interface HolderBotsResponse {
  bots: HolderBot[];
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

// export interface HolderBot {
//   id: string;
//   botName?: string;
//   status: string;
//   tokenName?: string;
//   tokenSymbol?: string;
//   ownerWalletAddress?: string;
//   mintAddress?: string;
//   holdersProcessed?: number;
//   lastHolderWalletIndex?: number;
//   fundAdded?: boolean;
//   createdAt: string;
//   updatedAt: string;
//   deletedAt?: string;
//   user?: {
//     id?: string;
//     username?: string;
//     email?: string;
//     platform?: string;
//     device?: string;
//   };
// }

export interface HolderBotsResponse {
  bots: HolderBot[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
/** Recharge record from bot.recharge.records (transaction history) */
export interface RechargeRecord {
  id: number;
  userId: number;
  botType: string;
  botId: number;
  amount: string;
  currency: string;
  rechargeType: string;
  deviceType?: string | null;
  platformFee: string;
  metadata?: {
    reactionsPlanned?: number;
    actionType?: string;
    requiredUsd?: number;
    solPriceUsd?: number;
    usedRechargePrice?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BotRecharge {
  records: RechargeRecord[];
  totalRecharged: number;
  lastRechargeDate?: string | null;
  rechargeCount: number;
}

export interface ReactionBot {
  id: string;
  botName?: string;
  status: string;
  tokenName?: string;
  tokenSymbol?: string;
  ownerWalletAddress?: string;
  middleWalletAddress?: string;
  targetUrl?: string;
  reactionsPlanned?: number;
  reactionsProcessed?: number;
  totalActions?: number;
  lastActionIndex?: number;
  pairAddress?: string;
  chain?: string;
  fundAdded?: boolean;
  FirstRechargeDone?: boolean;
  historyCount?: number;
  hasRecharge?: boolean;
  recharge?: BotRecharge;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    platform?: string;
    device?: string;
  };
}

export interface ReactionBotHistory {
  id: number;
  reactionBotId: number;
  transectionAmount: number;
  transectionDate: string;
  reactionsPlanned: number;
  reactionsProcessed: number;
  status: string;
  actionType: string;
  createdAt: string;
  updatedAt: string;
  reactionBot?: ReactionBot;
}

export interface ReactionBotsResponse {
  bots: ReactionBot[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReactionBotHistoryResponse {
  history: ReactionBotHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
    page?: number;
    pageSize?: number;
    totalPages?: number;
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

export interface CreateAdminPayload {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions?: Record<string, boolean>;
}

export interface TokenBurnRecord {
  id: number;
  walletAddress: string;
  tokenMint: string;
  tokenSymbol?: string | null;
  tokenName?: string | null;
  tokenAccount?: string | null;
  decimals?: number | null;
  amount: number;
  amountRaw?: string | null;
  txSignature: string;
  serviceFeeSol?: number | null;
  networkFeeSol?: number | null;
  totalFeeSol?: number | null;
  connectedWallet?: string | null;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
  burnedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  } | null;
}

export interface TokenBurnSummary {
  totalBurned: number;
  totalServiceFees: number;
  totalNetworkFees: number;
  uniqueWallets: number;
  uniqueTokens: number;
  lastBurnAt?: string | null;
  totalBurns?: number;
}

export interface TokenBurnListResponse {
  success: boolean;
  data: {
    burns: TokenBurnRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: TokenBurnSummary;
  };
}

// Recharge records (volume / holder / reaction bot recharges)
export interface RechargeRecordItem {
  id: number;
  userId: number;
  botType: 'volume' | 'holder' | 'reaction';
  botId: number;
  amount: number;
  currency: string;
  rechargeType: string | null;
  deviceType: string | null;
  platformFee: number | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; username: string; email: string } | null;
}

export interface RechargeRecordsListResponse {
  success: boolean;
  data: {
    records: RechargeRecordItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    summary: {
      totalRecords: number;
      totalAmount: number;
      totalPlatformFee: number;
      byBotType: { volume: number; holder: number; reaction: number };
    };
  };
}

export interface RechargeRecordsStats {
  totalRecords: number;
  totalAmount: number;
  totalPlatformFee: number;
  lastRecordAt: string | null;
  byBotType: Record<string, { count: number; totalAmount: number; totalFee: number }>;
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

// Response interceptor: on 401 try refresh token, then retry or redirect to login
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

adminAxiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/admin/login';
      }
      return Promise.reject(error);
    }

    const isRefreshRequest = originalRequest.url?.includes('/admin/refresh');
    if (isRefreshRequest) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/admin/login';
      }
      return Promise.reject(error);
    }

    if (typeof window === 'undefined' || !localStorage.getItem('adminRefreshToken')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/admin/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(adminAxiosInstance(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refresh = localStorage.getItem('adminRefreshToken');
      const res = await adminAxiosInstance.post('/admin/refresh', { refreshToken: refresh });
      const { token, refreshToken: newRefresh, admin } = res.data;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('adminToken', token);
        if (newRefresh) localStorage.setItem('adminRefreshToken', newRefresh);
        if (admin) localStorage.setItem('adminData', JSON.stringify(admin));
        onRefreshed(token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return adminAxiosInstance(originalRequest);
      }
    } catch (refreshError) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/admin/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }

    return Promise.reject(error);
  }
);

// Admin API service methods
const adminApiService = {
  // Authentication (email + OTP)
  sendOtp: (email: string): Promise<AxiosResponse<{ message: string; email?: string }>> =>
    adminAxiosInstance.post('/admin/send-otp', { email }),
  verifyOtp: (email: string, otp: string): Promise<AxiosResponse<LoginResponse>> =>
    adminAxiosInstance.post('/admin/verify-otp', { email, otp }),
  refreshToken: (): Promise<AxiosResponse<LoginResponse>> => {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('adminRefreshToken') : null;
    return adminAxiosInstance.post('/admin/refresh', { refreshToken: refresh || '' });
  },
  // Legacy username/password login (also returns access + refresh)
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
  createAdmin: (adminData: CreateAdminPayload): Promise<AxiosResponse<AdminUser>> =>
    adminAxiosInstance.post('/admin/admins', adminData),
  updateAdmin: (adminId: string, adminData: Partial<AdminUser>): Promise<AxiosResponse<AdminUser>> => 
    adminAxiosInstance.put(`/admin/admins/${adminId}`, adminData),
  deleteAdmin: (adminId: string): Promise<AxiosResponse<void>> => 
    adminAxiosInstance.delete(`/admin/admins/${adminId}`),
  
  // Bots management
  getBots: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<BotsResponse>> => 
    adminAxiosInstance.get('/admin/bots', { params }),
  getBotsWithLastData: (params?: Record<string, string | number | boolean>): Promise<AxiosResponse<BotsResponse>> => 
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
  stopRunningBot: (): Promise<AxiosResponse<{ message: string; botstoppedData: Array<{
    message: string;
    botId: string;
    botName?: string;
    tokenAddress: string;
    engine: string;
    ownerWalletAddress: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    lastLogs?: Array<{ timestamp: string; message: string }>;
    lastTrades?: Array<{
      id: string;
      timestamp: string;
      tradeType: string;
      amount: number;
      token: string;
      transactionSignature?: string;
    }>;
    tokenName?: string;
    tokenSymbol?: string;
    user?: {
      id: string;
      username: string;
      email: string;
    };
  }> }>> => 
    adminAxiosInstance.post('/admin/bots/stop-running'),
  startRunningBot: (): Promise<AxiosResponse<{ message: string; botstartedData: Array<{
    message: string;
    botId: string;
    botName?: string;
    tokenAddress: string;
    engine: string;
    ownerWalletAddress: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    lastLogs?: Array<{ timestamp: string; message: string }>;
    lastTrades?: Array<{
      id: string;
      timestamp: string;
      tradeType: string;
      amount: number;
      token: string;
      transactionSignature?: string;
    }>;
    tokenName?: string;
    tokenSymbol?: string;
    user?: {
      id: string;
      username: string;
      email: string;
    };
  }> }>> => 
    adminAxiosInstance.post('/admin/bots/start-running'),
  
  // Holder bots management
  getHolderBots: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<HolderBotsResponse>> => 
    adminAxiosInstance.get('/admin/holder-bots', { params }),
  
  // Bot logs management
  getBotLogs: (botId: string, params?: { type?: string; limit?: number; page?: number; date?: string }): Promise<AxiosResponse<BotLogsResponse>> => 
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
  getTokenBurns: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<TokenBurnListResponse>> =>
    adminAxiosInstance.get('/admin/token-burns', { params }),
  getTokenBurnStats: (): Promise<AxiosResponse<{ success: boolean; data: TokenBurnSummary }>> =>
    adminAxiosInstance.get('/admin/token-burns/stats'),

  // Recharge records (volume / holder / reaction bot recharges)
  getRechargeRecords: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<RechargeRecordsListResponse>> =>
    adminAxiosInstance.get('/admin/recharge-records', { params }),
  getRechargeRecordsStats: (): Promise<AxiosResponse<{ success: boolean; data: RechargeRecordsStats }>> =>
    adminAxiosInstance.get('/admin/recharge-records/stats'),

  // Token revocation & kill switch
  getKillSwitchStatus: (): Promise<AxiosResponse<{ success: boolean; enabled: boolean }>> =>
    adminAxiosInstance.get('/admin/kill-switch'),
  setKillSwitch: (enabled: boolean): Promise<AxiosResponse<{ success: boolean; enabled: boolean }>> =>
    adminAxiosInstance.post('/admin/kill-switch', { enabled }),
  revokeUserTokens: (userId: number): Promise<AxiosResponse<{ success: boolean; message?: string }>> =>
    adminAxiosInstance.post('/admin/revoke-user-tokens', { userId }),
  revokeToken: (token: string): Promise<AxiosResponse<{ success: boolean; message?: string }>> =>
    adminAxiosInstance.post('/admin/revoke-token', { token }),

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

  // Holder Bots management
  // getHolderBots: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<HolderBotsResponse>> =>
  //   adminAxiosInstance.get('/admin/holder-bots', { params }),
  // Reaction Bots management
  getReactionBots: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<ReactionBotsResponse>> =>
    adminAxiosInstance.get('/admin/reaction-bots', { params }),
  getReactionBotHistory: (params?: string | Record<string, string | number | boolean> | URLSearchParams): Promise<AxiosResponse<ReactionBotHistoryResponse>> =>
    adminAxiosInstance.get('/admin/reaction-bots/history', { params }),
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
      localStorage.removeItem('adminRefreshToken');
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