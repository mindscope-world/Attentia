import React from 'react';
import { ArrowRight, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import flowerCoinImg from '../assets/images/bloom_flower_coin_1789643657759.jpg';

interface StatementSectionProps {
  onExplore: () => void;
}

export const StatementSection: React.FC<StatementSectionProps> = ({ onExplore }) => {
  return (
    <section id="statement" className="py-16 md:py-24 border-t border-[#1a1c33] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top split block matching reference image */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div className="max-w-md">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-display mb-4">
              What is Attentia?
            </h2>
            <button
              onClick={onExplore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#181533] hover:bg-[#251f4f] text-[#d4c6ff] text-xs font-semibold border border-[#3b326d] transition-all cursor-pointer shadow-sm group"
            >
              <span>Explore how it works</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#9f85ff]" />
            </button>
          </div>

          <div className="max-w-xl">
            <p className="text-lg sm:text-xl text-[#b8bdde] font-normal leading-relaxed">
              Attentia is a transparent attention-rewards protocol that directly converts genuine user attention into stable digital rewards, funded by verified sponsor campaigns.
            </p>
          </div>
        </div>

        {/* 3 Bento Cards matching the visual hierarchy in the reference screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Bento Card 1: Capital that grows (with 3D flower and coin artwork) */}
          <div className="md:col-span-6 rounded-2xl md:rounded-3xl bg-[#141527] border border-[#272948] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[340px] group hover:border-[#3d406b] transition-all">
            <div className="relative z-10 max-w-xs">
              <h3 className="text-2xl font-bold text-white mb-2">Attention that pays</h3>
              <p className="text-sm text-[#9da3c3] leading-relaxed">
                Earn real balance rewards as you engage with high-relevance sponsored brand content and complete concise qualitative evaluations.
              </p>
            </div>

            {/* Visual asset in the corner */}
            <div className="absolute right-0 bottom-0 w-3/5 h-4/5 pointer-events-none overflow-hidden opacity-90 group-hover:scale-105 transition-transform duration-500">
              <img
                src={flowerCoinImg}
                alt="Flower and coin visual"
                className="w-full h-full object-cover object-left-top filter brightness-[0.95]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141527] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141527] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 pt-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#a88cff]">
                <span>Advertiser-backed reward pools</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Bento Card 2: Always liquid, always stable */}
          <div className="md:col-span-3 rounded-2xl md:rounded-3xl bg-[#17182f] border border-[#2b2e50] p-6 sm:p-8 flex flex-col justify-between group hover:border-[#424675] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#232448] flex items-center justify-center text-[#9f85ff] mb-6">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Always liquid, always stable</h3>
              <p className="text-xs sm:text-sm text-[#9da3c3] leading-relaxed">
                Stay fully dollar-pegged in USDT and USDC with direct access to your eligible funds once minimum withdrawal threshold is met—no arbitrary lockups.
              </p>
            </div>

            <div className="pt-6 border-t border-[#232644] mt-6">
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                USDT & USDC Supported
              </span>
            </div>
          </div>

          {/* Bento Card 3: 100% verified interactions */}
          <div className="md:col-span-3 rounded-2xl md:rounded-3xl bg-[#17182f] border border-[#2b2e50] p-6 sm:p-8 flex flex-col justify-between group hover:border-[#424675] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#232448] flex items-center justify-center text-[#9f85ff] mb-6">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">100% verified interactions</h3>
              <p className="text-xs sm:text-sm text-[#9da3c3] leading-relaxed">
                Our verification engine ensures authentic human evaluations. No bot rings or synthetic click schemes; advertisers receive genuine insights.
              </p>
            </div>

            <div className="pt-6 border-t border-[#232644] mt-6">
              <span className="text-xs font-medium text-[#c4b5fd] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9f85ff]" />
                Strict anti-fraud engine
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
