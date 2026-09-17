import React, { useState } from 'react';
import { Check, ShieldCheck, HelpCircle, ArrowRight, Zap, Clock, Info } from 'lucide-react';
import { PACKAGE_TIERS } from '../data/content';
import { PackageTier } from '../types';

interface PackagesSectionProps {
  onSelectTier: (tierId: 'starter' | 'growth' | 'pro') => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({ onSelectTier }) => {
  const [selectedTier, setSelectedTier] = useState<'starter' | 'growth' | 'pro'>('growth');
  const [showDetailedComparison, setShowDetailedComparison] = useState(false);

  return (
    <section id="packages" className="py-20 md:py-28 bg-[#0d0e1e] border-t border-[#1a1c36] relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#5330e6]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1738] border border-[#3b316d] text-[#d0c2ff] text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5 text-[#9a7efd]" />
            <span>Participation Tiers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-4">
            Transparent Package Tiers
          </h2>

          <p className="text-base sm:text-lg text-[#9da2c2] leading-relaxed">
            Choose an entry tier that fits your daily availability. All platform terms, quotas, withdrawal criteria, and fees are explicitly disclosed below.
          </p>
        </div>

        {/* 3 Tier Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PACKAGE_TIERS.map((tier) => {
            const isPopular = tier.popular;
            const isSelected = selectedTier === tier.id;

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                  isPopular
                    ? 'bg-[#15162f] border-2 border-[#7652fc] shadow-2xl shadow-[#7652fc]/20 lg:-translate-y-2'
                    : 'bg-[#121325] border border-[#232544] hover:border-[#3a3e6b] shadow-xl'
                }`}
              >
                {/* Popular / Tier Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-[#6944f6] to-[#9974ff] text-white shadow-md shadow-[#704cf8]/30">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Title & Entry Amount */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{tier.name}</h3>
                    <span className="text-xs font-mono text-[#8b91b5] bg-[#1a1c35] px-2.5 py-0.5 rounded-md border border-[#272a4c]">
                      {tier.cycleDuration} Cycle
                    </span>
                  </div>

                  <p className="text-xs text-[#8f95b5] mb-6 min-h-[36px]">{tier.tagline}</p>

                  {/* Price Block */}
                  <div className="p-4 rounded-2xl bg-[#0b0c18] border border-[#1f213d] mb-6">
                    <span className="text-xs font-semibold text-[#8b91b5] block mb-1">
                      Entry Participation Amount
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
                        ${tier.price}
                      </span>
                      <span className="text-xs text-[#717796] font-mono">/ one-time deposit</span>
                    </div>
                  </div>

                  {/* Explicit Specifications Required by User */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-[#1e213b]">
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-[#888ea8]">Daily Activity Limit</span>
                      <span className="font-semibold text-white bg-[#191b35] px-2 py-0.5 rounded border border-[#272a4e]">
                        {tier.activitiesPerDay} tasks/day
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-[#888ea8]">Activity Rewards</span>
                      <span className="font-semibold text-emerald-400">{tier.rewardPerActivity}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-[#888ea8]">Referral Structure</span>
                      <span className="font-semibold text-[#bdaaff]">{tier.referralRewardTier}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-[#888ea8]">Min. Withdrawal</span>
                      <span className="font-semibold text-white">${tier.minWithdrawal}.00 USDT</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-[#888ea8]">Platform Fee</span>
                      <span className="font-semibold text-[#a0a6c7]">{tier.platformFee}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-[#888ea8]">Eligibility</span>
                      <span className="font-semibold text-[#a0a6c7] text-right truncate max-w-[150px]">
                        {tier.eligibility}
                      </span>
                    </div>
                  </div>

                  {/* Included features list */}
                  <div className="space-y-2.5 mb-8">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e7596] block mb-2">
                      Package Inclusions:
                    </span>
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#9ea4c4]">
                        <Check className="w-3.5 h-3.5 text-[#8b6dfc] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <button
                  id={`select-tier-${tier.id}-btn`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTier(tier.id);
                  }}
                  className={`w-full py-3.5 px-5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isPopular
                      ? 'bg-gradient-to-r from-[#6a45f6] to-[#916eff] hover:from-[#7854fd] hover:to-[#a181ff] text-white shadow-lg shadow-[#734eff]/30'
                      : 'bg-[#1a1c35] hover:bg-[#25284b] text-white border border-[#2b2e53]'
                  }`}
                >
                  <span>Select {tier.name} (${tier.price})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Anti-hype regulatory disclaimer */}
        <div className="mt-10 p-4 rounded-2xl bg-[#121428] border border-[#202341] max-w-3xl mx-auto flex items-center gap-3">
          <Info className="w-4 h-4 text-[#8b6dfc] shrink-0" />
          <p className="text-xs text-[#8288a7] leading-relaxed">
            <strong className="text-[#aab0d0]">Transparent Economics:</strong> We reject misleading claims such as "invest $100 and get $200 guaranteed." Rewards correspond strictly to completed, verified advertiser content engagements and are not risk-free financial returns.
          </p>
        </div>
      </div>
    </section>
  );
};
