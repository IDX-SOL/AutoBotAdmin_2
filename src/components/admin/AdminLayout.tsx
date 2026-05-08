'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
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
  Bell,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import adminApiService, { AdminUser } from '@/utils/adminApiService';
import seoTrackerService from '@/utils/seoTrackerService';
import { SeoNotification } from '@/types/seoTracker';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Admins', href: '/admin/admins', icon: Shield },
  { name: 'Campaigns', href: '/admin/campaigns', icon: TrendingUp },
  { name: 'Tokens', href: '/admin/tokens', icon: BitcoinIcon },
  { name: 'Bot Recharge Records', href: '/admin/recharge-records', icon: CreditCard },
  { name: 'Security', href: '/admin/security', icon: ShieldAlert },
  { name: 'Wallet Balances', href: '/admin/wallet-balances', icon: Wallet },
  { name: 'Emails', href: '/admin/emails', icon: Mail },
  // { name: 'Email Monitoring', href: '/admin/email-monitoring', icon: Mail },
  // { name: 'Email Automation', href: '/admin/email-automation', icon: Mail },
  { name: 'Email Marketing', href: '/admin/marketing', icon: Mail },
  { name: 'SEO', href: '/admin/seo-tracker', icon: TrendingUp, badge: 'NEW' },
  // { name: 'Analytics', href: '#', icon: TrendingUpDownIcon },
  // { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const toolsInsightsNavigation: NavItem[] = [
  { name: 'Volume bots', href: '/admin/bots', icon: Bot },
  { name: 'Holder Bots', href: '/admin/holder-bots', icon: UsersRound },
  { name: 'Reaction Bots', href: '/admin/reaction-bots', icon: Target },
  { name: 'Token Burns', href: '/admin/token-burns', icon: Flame },
  { name: 'Token Creations', href: '/admin/create-token', icon: Plus },
  { name: 'Liquidity Pools', href: '/admin/liquidity-pools', icon: Layers },
  {
    name: 'Liquidity Recharge Records',
    href: '/admin/liquidity-action-records',
    icon: CreditCard,
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [seoNotifications, setSeoNotifications] = useState<SeoNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isToolsInsightsRoute = toolsInsightsNavigation.some((item) => pathname === item.href);
  const [toolsInsightsOpen, setToolsInsightsOpen] = useState(isToolsInsightsRoute);
  const dashboardNavItem = navigation.find((item) => item.name === 'Dashboard');
  const remainingNavigation = navigation.filter((item) => item.name !== 'Dashboard');

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

  useEffect(() => {
    if (!adminData) return;
    const refresh = () => setSeoNotifications(seoTrackerService.getNotifications());
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [adminData]);

  useEffect(() => {
    if (isToolsInsightsRoute) {
      setToolsInsightsOpen(true);
    }
  }, [isToolsInsightsRoute]);

  const unreadCount = seoNotifications.filter((item) => !item.read).length;

  const handleMarkNotificationRead = (notificationId: string) => {
    setSeoNotifications(seoTrackerService.markNotificationRead(notificationId));
  };

  if (!adminData) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 border-r border-white/10 bg-[var(--panel)]/95 backdrop-blur-xl overflow-y-auto">
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
              <h1 className="text-xl font-bold text-white">AutoBot Admin</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-zinc-400 hover:text-cyan-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-4 px-4 space-y-2 pb-4">
              {dashboardNavItem ? (() => {
                const isActive = pathname === dashboardNavItem.href;
                return (
                  <a
                    key={dashboardNavItem.name}
                    href={dashboardNavItem.href}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/35'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center min-w-0">
                      <dashboardNavItem.icon className="mr-3 h-5 w-5 shrink-0" />
                      <span className="truncate">{dashboardNavItem.name}</span>
                    </span>
                  </a>
                );
              })() : null}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setToolsInsightsOpen((open) => !open)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isToolsInsightsRoute
                      ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/35'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-expanded={toolsInsightsOpen}
                  aria-controls="tools-insights-nav-mobile"
                >
                  <span className="flex min-w-0 items-center">
                    <Layers className="mr-3 h-5 w-5 shrink-0" />
                    <span className="truncate">Tools Insights</span>
                  </span>
                  {toolsInsightsOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </button>
                {toolsInsightsOpen ? (
                  <div id="tools-insights-nav-mobile" className="mt-2 space-y-1 pl-2">
                    {toolsInsightsNavigation.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/35'
                              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="flex min-w-0 items-center">
                            <item.icon className="mr-3 h-4 w-4 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              {remainingNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/35'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center min-w-0">
                      <item.icon className="mr-3 h-5 w-5 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </span>
                    {item.badge ? (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/35'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
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
          <div className="flex flex-col flex-grow border-r border-white/10 bg-[var(--panel)]/95 backdrop-blur-xl overflow-y-auto">
            <div className="flex items-center h-16 px-4 border-b border-white/10">
              <h1 className="text-xl font-bold text-white">AutoBot Admin</h1>
            </div>
            <nav className="flex-1 mt-4 px-4 space-y-2 pb-4">
              {dashboardNavItem ? (() => {
                const isActive = pathname === dashboardNavItem.href;
                return (
                  <a
                    key={dashboardNavItem.name}
                    href={dashboardNavItem.href}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/35'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center min-w-0">
                      <dashboardNavItem.icon className="mr-3 h-5 w-5 shrink-0" />
                      <span className="truncate">{dashboardNavItem.name}</span>
                    </span>
                  </a>
                );
              })() : null}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setToolsInsightsOpen((open) => !open)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isToolsInsightsRoute
                      ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/35'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-expanded={toolsInsightsOpen}
                  aria-controls="tools-insights-nav-desktop"
                >
                  <span className="flex min-w-0 items-center">
                    <Layers className="mr-3 h-5 w-5 shrink-0" />
                    <span className="truncate">Tools Insights</span>
                  </span>
                  {toolsInsightsOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </button>
                {toolsInsightsOpen ? (
                  <div id="tools-insights-nav-desktop" className="mt-2 space-y-1 pl-2">
                    {toolsInsightsNavigation.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/35'
                              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="flex min-w-0 items-center">
                            <item.icon className="mr-3 h-4 w-4 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              {remainingNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/35'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center min-w-0">
                      <item.icon className="mr-3 h-5 w-5 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </span>
                    {item.badge ? (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/35'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
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
          <div className="sticky top-0 z-40 border-b border-white/10 bg-[var(--panel)]/90 backdrop-blur-xl">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="lg:hidden p-1 rounded-md text-zinc-400 hover:bg-white/5 hover:text-cyan-300"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  className="hidden lg:inline-flex items-center justify-center p-1 rounded-md text-zinc-400 hover:bg-white/5 hover:text-cyan-300"
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((open) => !open)}
                    className="relative rounded-lg p-2 text-zinc-300 hover:bg-white/5 hover:text-cyan-200"
                    aria-label="SEO notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                    ) : null}
                  </button>
                  {notificationsOpen ? (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-[var(--panel-2)] p-3 shadow-2xl">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">SEO reminders</p>
                        <a href="/admin/seo-tracker" className="text-xs text-cyan-300 hover:text-cyan-200">
                          Open tracker
                        </a>
                      </div>
                      <div className="max-h-72 space-y-2 overflow-y-auto">
                        {seoNotifications.length ? (
                          seoNotifications.slice(0, 8).map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => handleMarkNotificationRead(notification.id)}
                              className={`w-full rounded-lg border px-3 py-2 text-left ${
                                notification.read
                                  ? 'border-white/10 bg-white/5 text-zinc-300'
                                  : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                              }`}
                            >
                              <p className="text-xs font-semibold">{notification.title}</p>
                              <p className="mt-1 text-xs">{notification.message}</p>
                            </button>
                          ))
                        ) : (
                          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-400">
                            No pending SEO reminders.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
                {/* Admin info */}
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full border border-cyan-400/35 bg-cyan-400/15 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {adminData.firstName} {adminData.lastName}
                    </p>
                    <p className="text-xs text-zinc-400 capitalize">{adminData.role}</p>
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-zinc-400 hover:text-cyan-200 transition-colors"
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