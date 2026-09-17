import React, { useState } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Sparkles, 
  TrendingUp, 
  Award, 
  ChevronRight,
  ShieldCheck,
  Send,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const NetworkTab: React.FC = () => {
  const { 
    referrals, 
    totalReferralBonus, 
    referralCode, 
    referralLink, 
    setNotification 
  } = useDashboard();

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 1 | 2 | 3>('all');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setNotification('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setNotification('Referral code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredReferrals = referrals.filter(r => 
    filterLevel === 'all' || r.level === filterLevel
  );

  const directCount = referrals.filter(r => r.level === 1).length;
  const level2Count = referrals.filter(r => r.level === 2).length;
  const level3Count = referrals.filter(r => r.level === 3).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e173d] border border-[#3f317b] text-[#d1c2ff] text-xs font-semibold uppercase tracking-wider mb-2">
          <Users className="w-3.5 h-3.5 text-[#9a7ffd]" />
          <span>Team & Multi-Tier Overrides</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          Grow Your Network
        </h1>
        <p className="text-xs sm:text-sm text-[#8a91b4] mt-1 max-w-2xl">
          Earn multi-level activity overrides from sponsored campaigns completed by your invitees. Payouts are funded directly by advertiser budgets.
        </p>
      </div>

      {/* Referral Link & Share Box */}
      <div className="rounded-3xl bg-gradient-to-r from-[#171838] via-[#14152f] to-[#1d173c] border-2 border-[#2f3361] p-6 sm:p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a589ff] block">
              Your Personal Invitation Credentials
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Share Attentia & Earn Up To 14% Cumulative Commissions
            </h2>
            <p className="text-xs text-[#8f96b9] leading-relaxed">
              Whenever your referrals complete their daily sponsor task quota, an automatic percentage reward credits directly to your available balance.
            </p>

            {/* Link Box */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#8a91b4]">
                Direct Referral URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-[#0b0c16] border border-[#26294d] rounded-xl py-2.5 px-3 text-white text-xs font-mono select-all outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold transition-all shadow-md shadow-[#734eff]/30 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Quick Share Icons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleCopyCode}
                className="py-2 px-3 rounded-lg bg-[#191b35] hover:bg-[#25284e] text-xs text-white border border-[#2b2e54] flex items-center gap-1.5 cursor-pointer"
              >
                <span className="text-[#848ba8]">Code:</span>
                <strong className="font-mono text-[#a589ff]">{referralCode}</strong>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#787f9f]" />}
              </button>

              <button
                onClick={() => setShowQr(!showQr)}
                className="py-2 px-3 rounded-lg bg-[#191b35] hover:bg-[#25284e] text-xs text-white border border-[#2b2e54] flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[#9a7ffd]" />
                <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Join me on Attentia and earn rewards by engaging with verified sponsor campaigns: ${referralLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-lg bg-[#132822] hover:bg-[#1a3830] text-xs text-emerald-400 border border-emerald-900/60 flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join Attentia and turn your attention into crypto rewards.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-lg bg-[#122336] hover:bg-[#19324d] text-xs text-sky-400 border border-sky-900/60 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* Right: Quick QR or Stats Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0b0c16]/80 border border-[#242749]">
            {showQr ? (
              <div className="text-center p-4 bg-white rounded-2xl max-w-[180px] text-black">
                <div className="w-32 h-32 bg-neutral-900 rounded-xl flex items-center justify-center text-white text-[10px] font-mono text-center p-2">
                  [QR: {referralCode}]
                </div>
                <span className="text-[10px] text-neutral-600 block mt-2 font-mono">
                  Scan to Register
                </span>
              </div>
            ) : (
              <div className="w-full space-y-4 text-center sm:text-left">
                <div className="flex items-center justify-between pb-3 border-b border-[#1f223f]">
                  <span className="text-xs text-[#8087a8]">Total Network Earnings</span>
                  <span className="text-xl font-bold font-mono text-sky-400">
                    +${totalReferralBonus.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8087a8]">Direct Recruits (Tier 1):</span>
                  <span className="font-mono text-white font-bold">{directCount} members</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8087a8]">Extended Team (Tiers 2 & 3):</span>
                  <span className="font-mono text-white font-bold">{level2Count + level3Count} members</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8087a8]">Active Task Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    All 6 Active Today
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-Tier Override Structure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-[#121326] border border-[#272a4e] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#a488ff] bg-[#221c4b] px-2.5 py-0.5 rounded border border-[#3e317d]">
              Level 1 (Direct)
            </span>
            <span className="text-lg font-mono font-extrabold text-white">8%</span>
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Directly Referred Members</h3>
          <p className="text-xs text-[#8288aa] leading-relaxed mb-4">
            Earn 8% of all task rewards completed daily by users who register using your referral link.
          </p>
          <div className="text-[11px] text-[#71789c] pt-2 border-t border-[#1d203a] flex justify-between">
            <span>Your Network:</span>
            <strong className="text-white font-mono">{directCount} Partners</strong>
          </div>
        </div>

        <div className="rounded-2xl bg-[#121326] border border-[#272a4e] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#a488ff] bg-[#221c4b] px-2.5 py-0.5 rounded border border-[#3e317d]">
              Level 2 (Indirect)
            </span>
            <span className="text-lg font-mono font-extrabold text-white">4%</span>
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Second-Generation Recruits</h3>
          <p className="text-xs text-[#8288aa] leading-relaxed mb-4">
            Earn 4% daily override on tasks completed by partners invited by your direct referrals.
          </p>
          <div className="text-[11px] text-[#71789c] pt-2 border-t border-[#1d203a] flex justify-between">
            <span>Your Network:</span>
            <strong className="text-white font-mono">{level2Count} Partners</strong>
          </div>
        </div>

        <div className="rounded-2xl bg-[#121326] border border-[#272a4e] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#a488ff] bg-[#221c4b] px-2.5 py-0.5 rounded border border-[#3e317d]">
              Level 3 (Extended)
            </span>
            <span className="text-lg font-mono font-extrabold text-white">2%</span>
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Third-Generation Team</h3>
          <p className="text-xs text-[#8288aa] leading-relaxed mb-4">
            Earn 2% passive override on all campaign evaluations submitted across your third-tier network.
          </p>
          <div className="text-[11px] text-[#71789c] pt-2 border-t border-[#1d203a] flex justify-between">
            <span>Your Network:</span>
            <strong className="text-white font-mono">{level3Count} Partners</strong>
          </div>
        </div>
      </div>

      {/* Downline Partners Table */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Network Member Performance
            </h2>
            <p className="text-xs text-[#7e85a6]">Real-time audit of partner task volume and commission yields</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0b0c16] border border-[#212440] w-fit">
            {(['all', 1, 2, 3] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-[#25284e] text-white shadow-sm'
                    : 'text-[#7e85a6] hover:text-white'
                }`}
              >
                {lvl === 'all' ? 'All Tiers' : `Level ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#20233f] text-[#71789c] uppercase font-mono text-[10px]">
                <th className="pb-3">Partner Username</th>
                <th className="pb-3">Network Tier</th>
                <th className="pb-3">Package Quota</th>
                <th className="pb-3">Tasks Today</th>
                <th className="pb-3">Commission Earned</th>
                <th className="pb-3 text-right">Activity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1e38]">
              {filteredReferrals.map((partner) => (
                <tr key={partner.id} className="hover:bg-[#15172c] transition-colors">
                  <td className="py-3.5 font-medium text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1e213e] flex items-center justify-center text-[10px] font-bold text-[#a488ff]">
                      {partner.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{partner.username}</span>
                  </td>

                  <td className="py-3.5">
                    <span className="text-[10px] font-mono font-bold text-[#a488ff] bg-[#221c4b] px-2 py-0.5 rounded border border-[#3e317d]">
                      Level {partner.level} ({partner.level === 1 ? '8%' : partner.level === 2 ? '4%' : '2%'})
                    </span>
                  </td>

                  <td className="py-3.5 text-[#959cb9]">
                    {partner.tier} Tier
                  </td>

                  <td className="py-3.5 font-mono text-white">
                    {partner.tasksCompletedToday} completed
                  </td>

                  <td className="py-3.5 font-mono font-bold text-sky-400">
                    +${partner.commissionGenerated.toFixed(2)} USDT
                  </td>

                  <td className="py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
