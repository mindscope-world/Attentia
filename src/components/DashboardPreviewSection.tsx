import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  Layers, 
  Wallet, 
  Users, 
  ShieldCheck, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { INITIAL_ACTIVITY_LOG } from '../data/content';
import { ActivityItem } from '../types';

interface DashboardPreviewSectionProps {
  onOpenFullDashboard?: () => void;
}

export const DashboardPreviewSection: React.FC<DashboardPreviewSectionProps> = ({ onOpenFullDashboard }) => {
  const [filter, setFilter] = useState<'all' | 'ad' | 'referral' | 'withdrawal'>('all');
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITY_LOG);

  const filteredActivities = activities.filter((act) => {
    if (filter === 'all') return true;
    return act.type === filter;
  });

  return (
    <section id="dashboard-preview" className="py-20 md:py-28 bg-[#0c0d1c] border-t border-[#1a1c36] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1738] border border-[#3b316d] text-[#d0c2ff] text-xs font-semibold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5 text-[#9a7efd]" />
            <span>Product Preview</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-4">
            A Live Window Into Your Dashboard
          </h2>

          <p className="text-base sm:text-lg text-[#9da2c2] leading-relaxed">
            See exactly what your members-only area looks like before registering. High-contrast financial telemetry, activity history, and one-click withdrawal status.
          </p>
        </div>

        {/* Dashboard Shell Container */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-[#131427] border-2 border-[#26284b] shadow-2xl shadow-purple-950/30 overflow-hidden">
          {/* Top Window Bar */}
          <div className="bg-[#181932] px-6 py-4 border-b border-[#252749] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-white font-mono ml-2">
                MY DASHBOARD
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#7e85a6]">Status:</span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                KYC Verified
              </span>
              <span className="font-mono text-[#8f96b7] bg-[#0d0e1b] px-2.5 py-1 rounded-md border border-[#232543]">
                ID: 0x884...7F
              </span>
              {onOpenFullDashboard && (
                <button
                  onClick={onOpenFullDashboard}
                  className="ml-2 px-3 py-1 rounded-lg bg-gradient-to-r from-[#6842f4] to-[#8d69ff] text-white font-bold text-xs shadow-md shadow-[#7c5cfc]/30 hover:brightness-110 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Live Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Top Balance & Package Banner */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-gradient-to-r from-[#171936] via-[#15162f] to-[#1a1538] border border-[#2e3158]">
              {/* Balance */}
              <div className="md:col-span-6 flex flex-col justify-center">
                <span className="text-xs uppercase font-semibold tracking-wider text-[#8a91b4] mb-1">
                  Available Balance
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
                  $245.80
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+$12.50 earned today</span>
                  <span className="text-[#646b8c]">• Ready to withdraw</span>
                </div>
              </div>

              {/* Package Details */}
              <div className="md:col-span-6 flex flex-col justify-center md:items-end border-t md:border-t-0 md:border-l border-[#292c50] pt-4 md:pt-0 md:pl-6">
                <div className="text-left md:text-right">
                  <span className="text-xs uppercase font-semibold tracking-wider text-[#8a91b4] block mb-1">
                    Current Package
                  </span>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#271f54] text-[#cfbcfd] font-bold text-sm border border-[#48398e]">
                    <span>PRO ($500)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8c6dfd]" />
                  </div>
                  <p className="text-xs text-[#7e85a6] mt-2">
                    30 activities/day quota • 1.0% fee • Priority dispatch
                  </p>
                </div>
              </div>
            </div>

            {/* Today's Activity 4-Stat Grid */}
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-[#7e85a6] mb-4">
                Today's Activity
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#0f1021] border border-[#21233f]">
                  <span className="text-xs text-[#7e85a6] block mb-1">Ads Completed</span>
                  <div className="text-2xl font-bold text-white">24</div>
                  <span className="text-[11px] text-[#636a8d]">Quota: 24 / 30</span>
                </div>

                <div className="p-4 rounded-xl bg-[#0f1021] border border-[#21233f]">
                  <span className="text-xs text-[#7e85a6] block mb-1">Rewards</span>
                  <div className="text-2xl font-bold text-emerald-400">+$12.50</div>
                  <span className="text-[11px] text-[#636a8d]">Credited to balance</span>
                </div>

                <div className="p-4 rounded-xl bg-[#0f1021] border border-[#21233f]">
                  <span className="text-xs text-[#7e85a6] block mb-1">Referrals</span>
                  <div className="text-2xl font-bold text-[#cfbcfd]">8 Active</div>
                  <span className="text-[11px] text-[#636a8d]">+$8.00 commissions</span>
                </div>

                <div className="p-4 rounded-xl bg-[#0f1021] border border-[#21233f]">
                  <span className="text-xs text-[#7e85a6] block mb-1">Pending Withdrawal</span>
                  <div className="text-2xl font-bold text-amber-300">$35.00</div>
                  <span className="text-[11px] text-[#636a8d]">USDT TRC-20 dispatch</span>
                </div>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-[#7e85a6]">
                  Recent Activity Log
                </h4>
                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-[#0e0f1e] p-1 rounded-lg border border-[#21233f]">
                  {(['all', 'ad', 'referral', 'withdrawal'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all capitalize ${
                        filter === f
                          ? 'bg-[#222444] text-white shadow-sm'
                          : 'text-[#6e7596] hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#21233f] overflow-hidden divide-y divide-[#1c1d35] bg-[#0f1021]">
                {filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-[#15162c] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                          act.status === 'completed'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {act.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-white">
                          {act.title}
                        </p>
                        <span className="text-[11px] text-[#6d7494]">{act.time}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-bold font-mono ${
                          act.amount.startsWith('+')
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {act.amount}
                      </span>
                      <span className="text-[10px] block text-[#656b8a] uppercase tracking-wider font-mono">
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer explanation */}
          <div className="bg-[#0f1021] px-6 py-3.5 border-t border-[#1e203c] text-center text-xs text-[#7e85a6]">
            Every metric and log entry updates dynamically with automated, verifiable on-chain transparency.
          </div>
        </div>
      </div>
    </section>
  );
};
