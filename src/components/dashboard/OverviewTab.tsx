import React from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const OverviewTab: React.FC = () => {
  const { 
    userProfile, 
    availableBalance, 
    todayEarned, 
    pendingWithdrawal, 
    totalReferralBonus, 
    completedToday, 
    dailyTotalQuota, 
    tasks, 
    activities, 
    setActiveTab,
    dailyTrend,
    rewardPerTask,
    referrals,
    isLoading,
  } = useDashboard();

  const remainingTasks = Math.max(0, dailyTotalQuota - completedToday);
  const progressPercent = dailyTotalQuota ? Math.min(100, Math.round((completedToday / dailyTotalQuota) * 100)) : 0;
  const availableTask = tasks.find(t => t.status === 'available') ?? null;

  // Last 7 days of verified rewards from the server (days without activity count as zero).
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: i === 6 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
      rewards: dailyTrend.find((x) => x.day === key)?.rewards ?? 0,
    };
  });
  const weekTotal = week.reduce((sum, d) => sum + d.rewards, 0);
  const maxReward = Math.max(1, ...week.map((d) => d.rewards));
  const chartPoints = week.map((d, i) => ({ x: (i / 6) * 400, y: 110 - (d.rewards / maxReward) * 90, ...d }));
  const linePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Account Tier Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#171838] via-[#14152f] to-[#1a1738] border border-[#2b2e55] p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-[#744eff]/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#a488ff] bg-[#221c4b] px-3 py-1 rounded-full border border-[#3e317d]">
                {userProfile.tier.toUpperCase()} MEMBER
              </span>
              <span className="text-xs text-[#7e85a6] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {userProfile.kycLevel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Welcome back, {userProfile.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#949bbd] mt-1 max-w-xl">
              Your daily sponsor interaction quota is active. Complete remaining tasks to claim your allocation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('deposits-withdrawals')}
              className="px-5 py-2.5 rounded-xl bg-[#23264b] hover:bg-[#2d3161] text-xs font-bold text-white border border-[#393d6c] transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Deposit Funds</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold tracking-wide shadow-md shadow-[#734eff]/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Start Tasks ({remainingTasks} left)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Available Balance */}
        <div className="rounded-2xl bg-[#121326] border border-[#232646] p-5 shadow-lg relative group hover:border-[#383d6e] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8a91b4]">Available Balance</span>
            <span className="p-2 rounded-xl bg-[#1d1f3d] text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight mb-2">
            ${availableBalance.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#1d203d]">
            <span className="text-[#72799c]">USDT / USDC Peaked</span>
            <button
              onClick={() => setActiveTab('deposits-withdrawals')}
              className="text-[#9e83fd] hover:text-white font-semibold flex items-center gap-0.5"
            >
              <span>Withdraw</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Today's Rewards */}
        <div className="rounded-2xl bg-[#121326] border border-[#232646] p-5 shadow-lg relative group hover:border-[#383d6e] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8a91b4]">Today's Rewards</span>
            <span className="p-2 rounded-xl bg-[#231b4b] text-[#a488ff]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#cbbaff] font-mono tracking-tight mb-2">
            +${todayEarned.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#1d203d]">
            <span className="text-[#72799c]">{completedToday} / {dailyTotalQuota} completed</span>
            <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
          </div>
        </div>

        {/* Card 3: Pending Settlements */}
        <div className="rounded-2xl bg-[#121326] border border-[#232646] p-5 shadow-lg relative group hover:border-[#383d6e] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8a91b4]">In Settlement</span>
            <span className="p-2 rounded-xl bg-[#2b211a] text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tracking-tight mb-2">
            ${pendingWithdrawal.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#1d203d]">
            <span className="text-[#72799c]">Auto-Dispatch queued</span>
            <button
              onClick={() => setActiveTab('deposits-withdrawals')}
              className="text-amber-400 hover:text-white font-semibold flex items-center gap-0.5"
            >
              <span>Track TX</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Network Referrals */}
        <div className="rounded-2xl bg-[#121326] border border-[#232646] p-5 shadow-lg relative group hover:border-[#383d6e] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8a91b4]">Network Bonuses</span>
            <span className="p-2 rounded-xl bg-[#18233d] text-sky-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-300 font-mono tracking-tight mb-2">
            +${totalReferralBonus.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#1d203d]">
            <span className="text-[#72799c]">{referrals.length} members (preview data)</span>
            <button
              onClick={() => setActiveTab('network')}
              className="text-sky-400 hover:text-white font-semibold flex items-center gap-0.5"
            >
              <span>Tree view</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Earnings Trend + Next Task Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 7-Day Performance & Quota (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                7-Day Activity & Earnings Trend
              </h2>
              <p className="text-xs text-[#7e85a6]">Daily verified attention rewards (USDT)</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              ${weekTotal.toFixed(2)} this week
            </span>
          </div>

          {/* SVG Visual Area Chart (verified rewards per day, from the server) */}
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 130" role="img" aria-label="Verified rewards over the last 7 days">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7852fc" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7852fc" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="20" x2="400" y2="20" stroke="#1d203a" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="#1d203a" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="400" y2="100" stroke="#1d203a" strokeDasharray="3 3" />
              <polygon fill="url(#areaGrad)" points={`0,120 ${linePoints} 400,120`} />
              <polyline fill="none" stroke="#8d6cff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={linePoints} />
              {chartPoints.map((pt) => (
                <circle key={pt.key} cx={pt.x} cy={pt.y} r="4" className="fill-[#121326] stroke-[#c0abff] stroke-2">
                  <title>{`${pt.label}: $${pt.rewards.toFixed(2)}`}</title>
                </circle>
              ))}
            </svg>

            <div className="flex justify-between text-[11px] text-[#6d7496] font-mono mt-2">
              {week.map((d, i) => (
                <span key={d.key} className={i === 6 ? 'text-[#a488ff] font-bold' : ''}>{d.label}</span>
              ))}
            </div>
          </div>

          {/* Daily Quota Progress Bar */}
          <div className="p-4 rounded-2xl bg-[#0e0f1f] border border-[#1e203c] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Daily Task Quota Progress</span>
              <span className="font-mono text-[#a589ff]">
                {completedToday} of {dailyTotalQuota} completed ({remainingTasks} remaining)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#181a33] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6943f6] to-[#a07eff] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#71789c]">
              <span>
                {userProfile.tier === 'none' ? 'No active package' : `Package: ${userProfile.tier.toUpperCase()} (${dailyTotalQuota} tasks/day)`}
              </span>
              <span>Remaining potential today: ${(remainingTasks * rewardPerTask).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right: Next Queued Task & Quick Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Spotlight Task */}
          {availableTask ? (
          <div className="rounded-3xl bg-[#121326] border border-[#272b50] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#a68aff] uppercase tracking-wider bg-[#201b44] px-2.5 py-0.5 rounded border border-[#3e317d]">
                  Next Task in Queue
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  +${availableTask.reward.toFixed(2)} USDT
                </span>
              </div>
  
              <h3 className="text-base font-bold text-white mb-1.5">
                {availableTask.title}
              </h3>
              <p className="text-xs text-[#8a91b4] leading-relaxed mb-4 line-clamp-2">
                {availableTask.description}
              </p>
  
              <div className="flex items-center gap-4 text-xs text-[#717899] mb-5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#9a7ffd]" /> {availableTask.durationSeconds}s viewing
                </span>
                <span>•</span>
                <span className="text-[#a4abcb]">{availableTask.category}</span>
              </div>
  
              <button
                onClick={() => setActiveTab('tasks')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold transition-all shadow-md shadow-[#734eff]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Engage & Claim Reward</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#121326] border border-[#272b50] p-6 shadow-xl text-xs text-[#8a91b4] space-y-3">
              <span className="text-[11px] font-bold text-[#a68aff] uppercase tracking-wider">Next Task in Queue</span>
              <p>{isLoading ? 'Loading tasks…' : tasks.length ? 'You have completed every available task today. New ones appear tomorrow.' : 'No sponsored tasks are available right now.'}</p>
              <button onClick={() => setActiveTab('tasks')} className="text-[#a488ff] hover:text-white font-semibold cursor-pointer">Open tasks</button>
            </div>
          )}

          {/* Institutional Compliance Notice */}
          <div className="p-4 rounded-2xl bg-[#0f1020] border border-[#20233e] flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-[#8288aa] leading-relaxed">
              <strong className="text-white font-semibold">Decentralized Payout Guarantee:</strong> All completed task evaluations are committed to verified validator nodes. No minimum locking periods apply to earned rewards.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Snapshot */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Recent Transaction Log
            </h2>
            <p className="text-xs text-[#7e85a6]">Live account debits, credits, and verification hashes</p>
          </div>
          <button
            onClick={() => setActiveTab('activities')}
            className="text-xs font-semibold text-[#a488ff] hover:text-white flex items-center gap-1"
          >
            <span>View All ({activities.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {activities.slice(0, 4).map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1d203b] flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  act.type === 'ad'
                    ? 'bg-[#201c44] text-[#a488ff]'
                    : act.type === 'referral'
                    ? 'bg-[#152438] text-sky-400'
                    : act.type === 'deposit'
                    ? 'bg-[#132822] text-emerald-400'
                    : 'bg-[#2c1f1f] text-rose-400'
                }`}>
                  {act.type === 'ad' ? 'AD' : act.type === 'referral' ? 'REF' : act.type === 'deposit' ? 'DEP' : 'WTH'}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">{act.title}</span>
                  <span className="text-[10px] text-[#6d7494]">{act.time} • {act.details}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs font-mono font-bold block ${
                  act.amount.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {act.amount}
                </span>
                <span className="text-[10px] text-emerald-400 capitalize">{act.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
