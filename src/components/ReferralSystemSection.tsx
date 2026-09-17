import React, { useState } from 'react';
import { Users, GitFork, ShieldCheck, CheckCircle2, Info, ArrowRight } from 'lucide-react';

export const ReferralSystemSection: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<'you' | 't1' | 't2'>('t1');

  return (
    <section id="referrals" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1738] border border-[#3b316d] text-[#d0c2ff] text-xs font-semibold uppercase tracking-wider mb-4">
            <Users className="w-3.5 h-3.5 text-[#9a7efd]" />
            <span>Multi-Tier Network Structure</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-4">
            Grow Your Network
          </h2>

          <p className="text-base sm:text-lg text-[#9da2c2] leading-relaxed">
            Expand your earning potential by introducing new active participants. Our multi-tier referral tree provides transparent commissions derived strictly from completed sponsor tasks.
          </p>
        </div>

        {/* 2-Column Layout: Visual Tree Diagram on Left, Rules & Mechanism on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Referral Tree Diagram */}
          <div className="lg:col-span-7 rounded-3xl bg-[#121326] border-2 border-[#26284a] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#21233f]">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-[#8b6dfc]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Network Architecture Visualizer
                </span>
              </div>
              <span className="text-[11px] text-[#717799] font-mono">
                Three-Level Distribution
              </span>
            </div>

            {/* Tree Visualization */}
            <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 select-none py-2">
              {/* YOU (Root Node) */}
              <div
                onClick={() => setSelectedNode('you')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-center min-w-[140px] shadow-lg ${
                  selectedNode === 'you'
                    ? 'bg-[#291f5e] border-[#8b6dfc] shadow-[#8b6dfc]/30 scale-105'
                    : 'bg-[#181932] border-[#2c2f54] hover:border-[#424775]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6a46f6] to-[#a488ff] text-white font-extrabold text-xs flex items-center justify-center mx-auto mb-1">
                  YOU
                </div>
                <span className="text-xs font-bold text-white block">Account Holder</span>
                <span className="text-[10px] text-[#9ca3c9] font-mono">Base Dashboard</span>
              </div>

              {/* Vertical Branch */}
              <div className="w-0.5 h-6 bg-[#393c66]" />

              {/* Tier 1 Level (A, B, C) */}
              <div className="w-full relative">
                {/* Horizontal branch line */}
                <div className="absolute top-0 left-1/6 right-1/6 h-0.5 bg-[#393c66] -translate-y-3" />
                
                <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
                  {[
                    { id: 'A', name: 'Member A', stat: '5% Tier 1' },
                    { id: 'B', name: 'Member B', stat: '5% Tier 1' },
                    { id: 'C', name: 'Member C', stat: '5% Tier 1' },
                  ].map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode('t1')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedNode === 't1'
                          ? 'bg-[#211f44] border-[#7d5ef9] scale-105'
                          : 'bg-[#15162c] border-[#252847] hover:border-[#3a3f6a]'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#27294d] text-[#c9b7ff] font-bold text-xs flex items-center justify-center mx-auto mb-1 border border-[#3e4275]">
                        {node.id}
                      </div>
                      <span className="text-xs font-semibold text-white block">{node.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-medium">{node.stat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vertical Branches to Tier 2 */}
              <div className="w-full flex justify-around px-8">
                <div className="w-0.5 h-5 bg-[#2d3054]" />
                <div className="w-0.5 h-5 bg-[#2d3054]" />
                <div className="w-0.5 h-5 bg-[#2d3054]" />
              </div>

              {/* Tier 2 Level (D, E, F, G, H) */}
              <div className="w-full">
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { id: 'D', name: 'D' },
                    { id: 'E', name: 'E' },
                    { id: 'F', name: 'F' },
                    { id: 'G', name: 'G' },
                    { id: 'H', name: 'H' },
                  ].map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedNode('t2')}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedNode === 't2'
                          ? 'bg-[#1f1b40] border-[#8b6dfc]'
                          : 'bg-[#111222] border-[#1f213b] hover:border-[#2f335b]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#1b1c34] text-[#8e95be] font-bold text-[10px] flex items-center justify-center mx-auto mb-0.5">
                        {sub.name}
                      </div>
                      <span className="text-[10px] text-[#71789c] block font-mono">2% Tier 2</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tree status caption */}
            <div className="mt-6 pt-4 border-t border-[#1e203c] text-center text-xs text-[#71789c]">
              Interactive visual preview. Your live referral links, QR codes, and real-time genealogy tree reside inside the authenticated dashboard.
            </div>
          </div>

          {/* Rules & Responsible Mechanics on Right */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#141529] border border-[#26284b]">
              <h3 className="text-xl font-bold text-white mb-2">Transparent Referral Rules</h3>
              <p className="text-xs text-[#8f96b9] leading-relaxed mb-6">
                Commissions are calculated strictly on active task completion, not passive recruitment. Here is the verifiable schedule:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1f223d]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">Tier 1: Direct Referrals (A, B, C)</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">3% to 7%</span>
                  </div>
                  <p className="text-[11px] text-[#747b9d]">
                    Earned whenever direct invites view and submit verified ratings on sponsored campaigns.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1f223d]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">Tier 2: Secondary Network (D, E, F, G, H)</span>
                    <span className="text-xs font-mono font-bold text-[#bca5ff]">2% to 3%</span>
                  </div>
                  <p className="text-[11px] text-[#747b9d]">
                    Available on Growth and Pro packages when your extended network actively completes daily tasks.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1f223d]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">Tier 3: Enterprise Depth</span>
                    <span className="text-xs font-mono font-bold text-[#8a68fa]">1% (Pro Only)</span>
                  </div>
                  <p className="text-[11px] text-[#747b9d]">
                    Extended depth reward reserved exclusively for verified Pro tier accounts.
                  </p>
                </div>
              </div>
            </div>

            {/* Anti-hype compliance box */}
            <div className="p-4 rounded-2xl bg-[#111222] border border-[#20223e] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#8b6dfc] shrink-0 mt-0.5" />
              <div className="text-xs text-[#8288a7] leading-relaxed">
                <strong className="text-[#c1c6e2] font-semibold">Responsible Fintech Standards:</strong> We do not promote "passive income empires" or guaranteed wealth. Commissions are performance-backed incentives distributed from advertiser marketing budgets, strictly matching verified human ad reviews.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
