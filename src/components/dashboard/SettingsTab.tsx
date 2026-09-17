import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Wallet, 
  Bell, 
  Check, 
  Save, 
  AlertCircle,
  Smartphone,
  Laptop,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';

export const SettingsTab: React.FC = () => {
  const { 
    userProfile, 
    updateUserProfile, 
    updateWalletWhitelist, 
    toggle2FA, 
    setNotification 
  } = useDashboard();
  const { theme, setTheme } = useTheme();

  // Profile form
  const [displayName, setDisplayName] = useState(userProfile.name);
  const [email] = useState(userProfile.email);

  // Whitelist wallets
  const [trc20Address, setTrc20Address] = useState(userProfile.walletWhitelist.trc20);
  const [erc20Address, setErc20Address] = useState(userProfile.walletWhitelist.erc20);
  const [polygonAddress, setPolygonAddress] = useState(userProfile.walletWhitelist.polygon);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Notification preferences
  const [notifTaskReset, setNotifTaskReset] = useState(true);
  const [notifWithdrawal, setNotifWithdrawal] = useState(true);
  const [notifReferral, setNotifReferral] = useState(true);

  const handleSaveWallets = (e: React.FormEvent) => {
    e.preventDefault();
    updateWalletWhitelist({
      trc20: trc20Address,
      erc20: erc20Address,
      polygon: polygonAddress,
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name: displayName });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          Account & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#8a91b4] mt-1">
          Manage your verified identity, payout wallet whitelist, cryptographic 2FA, and alerts.
        </p>
      </div>

      {/* Section 1: Profile & Identity Verification */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f223f] mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Profile & Identity (KYC)
            </h2>
            <p className="text-xs text-[#787f9f]">Account credentials and compliance status</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {userProfile.kycLevel}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
              Account Reference ID:
            </label>
            <input
              type="text"
              readOnly
              value={userProfile.accountId}
              className="w-full bg-[#0b0c16] border border-[#232646] rounded-xl py-2 px-3 text-white text-xs font-mono select-all outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
              Registered Email:
            </label>
            <input
              type="email"
              readOnly
              value={email}
              className="w-full bg-[#0b0c16] border border-[#232646] rounded-xl py-2 px-3 text-[#7981a5] text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
              Display Name:
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#0b0c16] border border-[#232646] rounded-xl py-2 px-3 text-white text-xs focus:border-[#7c5cfc] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
              Account Registration Date:
            </label>
            <input
              type="text"
              readOnly
              value={userProfile.memberSince}
              className="w-full bg-[#0b0c16] border border-[#232646] rounded-xl py-2 px-3 text-[#7981a5] text-xs outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] text-white text-xs font-bold transition-all shadow-md shadow-[#734eff]/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Payout Wallets Whitelist */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f223f] mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#a488ff]" />
              <span>Whitelisted Payout Wallets</span>
            </h2>
            <p className="text-xs text-[#787f9f]">
              Settlement payouts are strictly restricted to these verified destination addresses.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Whitelist Active
          </span>
        </div>

        <form onSubmit={handleSaveWallets} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
              USDT (TRON TRC-20) Destination Address:
            </label>
            <input
              type="text"
              value={trc20Address}
              onChange={(e) => setTrc20Address(e.target.value)}
              className="w-full bg-[#0b0c16] border border-[#242749] rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-[#7c5cfc] outline-none"
              placeholder="e.g. TPyM8c7h4aL89QhZk2u8vX5yNmW0eR1t3p"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
              USDT (Ethereum ERC-20) Destination Address:
            </label>
            <input
              type="text"
              value={erc20Address}
              onChange={(e) => setErc20Address(e.target.value)}
              className="w-full bg-[#0b0c16] border border-[#242749] rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-[#7c5cfc] outline-none"
              placeholder="e.g. 0x7A4b9e28D5b4C17983FcAf86c7104d4D8A92F4c8"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
              USDC (Polygon PoS) Destination Address:
            </label>
            <input
              type="text"
              value={polygonAddress}
              onChange={(e) => setPolygonAddress(e.target.value)}
              className="w-full bg-[#0b0c16] border border-[#242749] rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-[#7c5cfc] outline-none"
              placeholder="e.g. 0x3D88f219Cb0e14a7904EcB589d1b64c010A56E21"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] text-white text-xs font-bold transition-all shadow-md shadow-[#734eff]/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Whitelisted Addresses</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Security & 2FA */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f223f] mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#a488ff]" />
              <span>Security & Two-Factor Authentication</span>
            </h2>
            <p className="text-xs text-[#787f9f]">Cryptographic 2FA protects sensitive withdrawals and changes</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 2FA Toggle Switch */}
          <div className="p-4 rounded-2xl bg-[#0b0c16] border border-[#1f223f] flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block">
                Two-Factor Authentication (TOTP Authenticator App)
              </span>
              <span className="text-[11px] text-[#71789c]">
                Requires a 6-digit code from Google Authenticator or Authy to authorize payouts.
              </span>
            </div>

            <button
              type="button"
              onClick={toggle2FA}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                userProfile.twoFactorEnabled ? 'bg-[#7c5cfc]' : 'bg-[#2b2e52]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  userProfile.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Password Update Form */}
          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a589ff]">
              Change Access Password
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
                  Current Password:
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0b0c16] border border-[#242749] rounded-xl py-2 px-3 text-white text-xs focus:border-[#7c5cfc] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
                  New Password:
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  className="w-full bg-[#0b0c16] border border-[#242749] rounded-xl py-2 px-3 text-white text-xs focus:border-[#7c5cfc] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8a91b4] block mb-1">
                  Confirm New Password:
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-[#0b0c16] border border-[#242749] rounded-xl py-2 px-3 text-white text-xs focus:border-[#7c5cfc] outline-none"
                />
              </div>
            </div>

            {passwordMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === 'error'
                  ? 'bg-rose-950/50 border border-rose-800 text-rose-300'
                  : 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
              }`}>
                {passwordMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#23264b] hover:bg-[#2d3161] text-xs font-bold text-white border border-[#393d6c] transition-all cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </form>

          {/* Active Sessions */}
          <div className="pt-4 border-t border-[#1f223f] space-y-3">
            <h4 className="text-xs font-semibold text-[#8a91b4]">Active Browser Sessions</h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#0b0c16] border border-[#1f223f] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-white block">macOS Chrome (Current Session)</span>
                    <span className="text-[10px] text-[#6b7294]">IP: 197.232.xxx • Active now</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">CURRENT</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0c16] border border-[#1f223f] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#8a91b4]" />
                  <div>
                    <span className="font-semibold text-white block">iOS Mobile Safari</span>
                    <span className="text-[10px] text-[#6b7294]">IP: 105.163.xxx • 2 days ago</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotification('Device session revoked.')}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Alert Preferences */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-8 shadow-xl">
        <div className="pb-4 border-b border-[#1f223f] mb-5">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#a488ff]" />
            <span>Notification & Protocol Alerts</span>
          </h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c16] border border-[#1f223f] cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-white block">Daily Task Quota Refresh</span>
              <span className="text-[11px] text-[#71789c]">Receive an email alert when 00:00 UTC daily quota unlocks.</span>
            </div>
            <input
              type="checkbox"
              checked={notifTaskReset}
              onChange={(e) => setNotifTaskReset(e.target.checked)}
              className="rounded border-[#353966] bg-[#121326]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c16] border border-[#1f223f] cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-white block">Withdrawal Settlement Confirmation</span>
              <span className="text-[11px] text-[#71789c]">Email alert with on-chain transaction hash receipt upon blockchain dispatch.</span>
            </div>
            <input
              type="checkbox"
              checked={notifWithdrawal}
              onChange={(e) => setNotifWithdrawal(e.target.checked)}
              className="rounded border-[#353966] bg-[#121326]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c16] border border-[#1f223f] cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-white block">Referral Activity Overrides</span>
              <span className="text-[11px] text-[#71789c]">Real-time ping whenever downline member completes their daily quota.</span>
            </div>
            <input
              type="checkbox"
              checked={notifReferral}
              onChange={(e) => setNotifReferral(e.target.checked)}
              className="rounded border-[#353966] bg-[#121326]"
            />
          </label>
        </div>
      </div>

      {/* Section 5: Appearance & Theme Customization */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-8 shadow-xl">
        <div className="pb-4 border-b border-[#1f223f] mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#a488ff]" />
              <span>Appearance & Color Theme</span>
            </h2>
            <p className="text-xs text-[#787f9f] mt-0.5">
              Customize your workspace look. Your preference is automatically synchronized and preserved locally.
            </p>
          </div>
          <span className="text-xs font-mono text-[#a488ff] bg-[#1b1c35] px-2.5 py-1 rounded-lg border border-[#2a2d52] hidden sm:inline-block">
            Current: {theme === 'dark' ? 'Dark Obsidian' : 'Clean Light'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setNotification('Workspace switched to Dark Theme.');
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
              theme === 'dark'
                ? 'bg-[#181a38] border-[#7c5cfc] ring-2 ring-[#7c5cfc]/30 shadow-lg shadow-[#7c5cfc]/10'
                : 'bg-[#0e1022] border-[#222443] hover:border-[#383b68] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#232650] flex items-center justify-center text-indigo-300">
                <Moon className="w-4 h-4" />
              </div>
              {theme === 'dark' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  Active
                </span>
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Dark Obsidian Theme</span>
              <span className="text-xs text-[#8a91b4] block">
                Deep space canvas (#0b0c16) engineered for low-light trading sessions.
              </span>
            </div>
          </button>

          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setNotification('Workspace switched to Light Theme.');
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
              theme === 'light'
                ? 'bg-slate-100 border-[#7c5cfc] ring-2 ring-[#7c5cfc]/30 shadow-lg'
                : 'bg-[#0e1022] border-[#222443] hover:border-[#383b68] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Sun className="w-4 h-4" />
              </div>
              {theme === 'light' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Active
                </span>
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">Clean Light Theme</span>
              <span className="text-xs text-[#64748b] block">
                High-contrast daylight layout with crisp typography and pure white cards.
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
