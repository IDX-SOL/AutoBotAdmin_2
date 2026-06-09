'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  Bot,
  LogOut,
  Menu,
  X,
  Shield,
  ShieldAlert,
  TrendingUp,
  User,
  BitcoinIcon,
  Mail,
  Wallet,
  UsersRound,
  Flame,
  Target,
  CreditCard,
  Plus,
  Layers,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
} from 'lucide-react';
import adminApiService, { AdminUser } from '@/utils/adminApiService';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'AI Support', href: '/admin/ai-support', icon: MessageSquare },
  { name: 'Bots', href: '/admin/bots', icon: Bot },
  { name: 'Holder Bots', href: '/admin/holder-bots', icon: UsersRound },
  { name: 'Reaction Bots', href: '/admin/reaction-bots', icon: Target },
  { name: 'Admins', href: '/admin/admins', icon: Shield },
  { name: 'Campaigns', href: '/admin/campaigns', icon: TrendingUp },
  { name: 'Tokens', href: '/admin/tokens', icon: BitcoinIcon },
  { name: 'Token Burns', href: '/admin/token-burns', icon: Flame },
  { name: 'Token Creations', href: '/admin/create-token', icon: Plus },
  { name: 'Liquidity Pools', href: '/admin/liquidity-pools', icon: Layers },
  {
    name: 'Liquidity Recharge Records',
    href: '/admin/liquidity-action-records',
    icon: CreditCard,
  },
  { name: 'Bot Recharge Records', href: '/admin/recharge-records', icon: CreditCard },
  { name: 'Security', href: '/admin/security', icon: ShieldAlert },
  { name: 'Wallet Balances', href: '/admin/wallet-balances', icon: Wallet },
  { name: 'Emails', href: '/admin/emails', icon: Mail },
  // { name: 'Email Monitoring', href: '/admin/email-monitoring', icon: Mail },
  // { name: 'Email Automation', href: '/admin/email-automation', icon: Mail },
  { name: 'Email Marketing', href: '/admin/marketing', icon: Mail },
  // { name: 'Analytics', href: '#', icon: TrendingUpDownIcon },
  // { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminData');

    if (!token || !admin) {
      router.push('/admin/login');
      return;
    }

    try {
      setAdminData(JSON.parse(admin));
    } catch {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    adminApiService.logout();
  };

  if (!adminData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 border-r border-gray-700">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
              <h1 className="text-xl font-bold text-white">AutoBot Admin</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-4 px-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div
          className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col transition-transform duration-200 ease-out ${
            desktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'
          }`}
        >
          <div className="flex flex-col flex-grow bg-gray-800 border-r border-gray-700">
            <div className="flex items-center h-16 px-4 border-b border-gray-700">
              <h1 className="text-xl font-bold text-white">AutoBot Admin</h1>
            </div>
            <nav className="flex-1 mt-4 px-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div
          className={`transition-[padding] duration-200 ease-out ${
            desktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
          }`}
        >
          {/* Top header */}
          <div className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="lg:hidden text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700/80"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  className="hidden lg:inline-flex items-center justify-center text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700/80"
                  onClick={() => setDesktopSidebarOpen((open) => !open)}
                  aria-label={desktopSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                  aria-expanded={desktopSidebarOpen}
                >
                  {desktopSidebarOpen ? (
                    <PanelLeftClose className="h-6 w-6" />
                  ) : (
                    <PanelLeft className="h-6 w-6" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {/* Admin info */}
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {adminData.firstName} {adminData.lastName}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{adminData.role}</p>
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    );
}  