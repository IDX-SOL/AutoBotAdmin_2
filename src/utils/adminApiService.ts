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
  tokenAddress?: string;
  gasFees?: number;
  deletedAt?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
  };
  // Optional fields that might not be returned by the backend
  lastTradeAt?: string;
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

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  botId: number;
  message: string;
  metadata: any;
  error?: any;
  tradeData?: any;
  walletData?: any;
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

// Create admin axios instance with different configuration
const adminAxiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apiautobot.idxsolana.io',
  timeout: 30000,
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
  getBotLogs: (botId: string, params?: { type?: string; limit?: number; date?: string }): Promise<AxiosResponse<BotLogsResponse>> => 
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