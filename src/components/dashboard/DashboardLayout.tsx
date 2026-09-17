import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  ArrowDownUp, 
  History, 
  Users, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Plus, 
  Bell,
  CheckCircle2
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { DashboardTab } from '../../types';
import { OverviewTab } from './OverviewTab';
import { TasksTab } from './TasksTab';
import { DepositsWithdrawalsTab } from './DepositsWithdrawalsTab';
import { ActivitiesTab } from './ActivitiesTab';
import { NetworkTab } from './NetworkTab';
import { SettingsTab } from './SettingsTab';
import { ThemeToggle } from '../ThemeToggle';

interface DashboardLayoutProps {
  onBackToLanding: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onBackToLanding }) => {
  const { 
    activeTab, 
    setActiveTab, 
    availableBalance, 
    userProfile, 
    completedToday, 
    dailyTotalQuota, 
    notification, 
    setNotification 
  } = useDashboard();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const remainingTasks = Math.max(0, dailyTotalQuota - completedToday);

  const navItems: { id: DashboardTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      icon: <CheckSquare className="w-4 h-4" />, 
      badge: remainingTasks > 0 ? `${remainingTasks} left` : undefined 
    },
    { id: 'deposits-withdrawals', label: 'Deposits & Withdrawals', icon: <ArrowDownUp className="w-4 h-4" /> },
    { id: 'activities', label: 'Activities', icon: <History className="w-4 h-4" /> },
    { id: 'network', label: 'Grow Your Network', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleTabClick = (tabId: DashboardTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#090a16] text-[#c4c9e2] font-sans antialiased flex flex-col selection:bg-[#7d5efc]/30 selection:text-white">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-bounce-short">
          <div className="rounded-2xl bg-emerald-950/90 border border-emerald-700/60 shadow-2xl p-4 text-emerald-200 text-xs font-semibold flex items-center gap-3 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-400 hover:text-white ml-2 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c0d1e]/90 backdrop-blur-md border-b border-[#1f223f] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#171933] text-[#8e96b8] hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6b45f6] to-[#a082ff] flex items-center justify-center text-white font-black shadow-md shadow-[#734eff]/30">
              A
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight font-display">
                Attentia
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono font-bold text-[#a488ff] bg-[#221c4b] px-2 py-0.5 rounded border border-[#3f317e]">
                Portal
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Tools */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Real-time Balance Metric Pill */}
          <div
            onClick={() => setActiveTab('deposits-withdrawals')}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#12142a] border border-[#262a50] hover:border-[#3d437e] cursor-pointer transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-right">
              <span className="text-[10px] text-[#71789c] block leading-none">Balance</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-white leading-tight">
                ${availableBalance.toFixed(2)} <span className="text-[10px] text-[#9581ec]">USDT</span>
              </span>
            </div>
          </div>

          {/* Switch to Landing Page button */}
          <button
            onClick={onBackToLanding}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181a33] hover:bg-[#23264c] text-xs font-semibold text-[#8f96b9] hover:text-white border border-[#282b52] transition-colors cursor-pointer"
            title="View public landing page"
          >
            <span>Landing Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#a488ff]" />
          </button>

          {/* User Profile Pill */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 p-1 sm:pr-3 rounded-full bg-[#161832] border border-[#272b53] hover:border-[#404683] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7c5cfc] to-[#a38aff] flex items-center justify-center text-white text-xs font-bold">
              {userProfile.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-white block leading-none">{userProfile.name}</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> {userProfile.tier}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Body container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-8">
        {/* Desktop Sidebar (56 / 64 width) */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-6">
          {/* Navigation Items List */}
          <div className="rounded-3xl bg-[#101224] border border-[#202341] p-3 space-y-1 shadow-lg">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#6b45f6] to-[#8a68ff] text-white shadow-md shadow-[#734eff]/30'
                      : 'text-[#848ba8] hover:text-white hover:bg-[#181a33]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#221c4b] text-[#cbbaff] border border-[#44358a]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Tier Card */}
          <div className="rounded-3xl bg-[#121326] border border-[#25284b] p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a488ff]">
                Current Tier
              </span>
              <span className="text-xs font-mono font-bold text-white bg-[#1e2140] px-2 py-0.5 rounded">
                ${userProfile.tier === 'starter' ? '25' : userProfile.tier === 'growth' ? '100' : '500'}
              </span>
            </div>

            <div className="text-sm font-bold text-white capitalize">
              {userProfile.tier} Package
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-[#71789c]">
                <span>Today's Quota:</span>
                <span className="text-white font-mono">{completedToday} / {dailyTotalQuota}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#181b36] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6b45f6] to-[#9977ff]"
                  style={{ width: `${Math.min(100, (completedToday / dailyTotalQuota) * 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setActiveTab('deposits-withdrawals')}
              className="w-full py-2 rounded-xl bg-[#1b1e3b] hover:bg-[#252952] border border-[#303566] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Upgrade Tier</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#a488ff]" />
            </button>
          </div>

          {/* Network validator status */}
          <div className="px-3 text-[11px] text-[#5f6688] font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Mainnet Live • Block 48,291,102</span>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-fade-in p-4">
            <div className="rounded-3xl bg-[#121326] border border-[#2b2e55] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#212443]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#6b45f6] flex items-center justify-center text-white font-bold text-xs">
                    A
                  </div>
                  <span className="font-bold text-white text-sm font-display">Attentia Navigation</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#7c83a4] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                      activeTab === item.id
                        ? 'bg-[#6b45f6] text-white'
                        : 'text-[#848ba8] hover:text-white hover:bg-[#181a33]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono bg-white/20 text-white px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-[#1f223f] flex items-center justify-between px-2">
                <span className="text-xs text-[#848ba8] font-semibold">Appearance</span>
                <ThemeToggle showLabel />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBackToLanding();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#181a33] text-xs font-semibold text-white flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#a488ff]" />
                  <span>Return to Public Landing Page</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'tasks' && <TasksTab />}
          {activeTab === 'deposits-withdrawals' && <DepositsWithdrawalsTab />}
          {activeTab === 'activities' && <ActivitiesTab />}
          {activeTab === 'network' && <NetworkTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>

      {/* Footer / Decentralized Node Status */}
      <footer className="border-t border-[#181a33] bg-[#0b0c1a] py-4 px-4 sm:px-8 text-center sm:text-left text-xs text-[#5e6587] flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2">
          <span>Attentia Decentralized Proof-of-Attention Protocol</span>
          <span>•</span>
          <span className="font-mono text-[#71789c]">Node Latency: 22ms</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('settings')}
            className="hover:text-white transition-colors"
          >
            Security & KYC
          </button>
          <button
            onClick={onBackToLanding}
            className="text-[#a488ff] hover:text-white transition-colors font-semibold"
          >
            Marketing Landing Page
          </button>
        </div>
      </footer>
    </div>
  );
};
