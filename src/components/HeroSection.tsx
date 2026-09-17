import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, Wallet, Award, Users } from 'lucide-react';
import heroCoinsImg from '../assets/images/bloom_hero_coins_1789643628945.jpg';

interface HeroSectionProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onExploreDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuth, onExploreDemo }) => {
  return (
    <section id="hero" className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#6744e8]/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-[#9e76fa]/10 rounded-full blur-[90px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Centered Header & Copy */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          {/* Subtle Sparkle Badge inspired by reference image */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181533] border border-[#372f65] text-[#d4c6ff] text-xs font-medium mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#a88dff]" />
            <span>A utility-driven attention network</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-6 font-display">
            Turn Your Attention <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#ded7ff] to-[#a88cff]">
              Into Rewards.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#a9aec4] leading-relaxed max-w-2xl mx-auto mb-8">
            Engage with sponsored content, complete simple interactions, and track your rewards from one secure dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              id="hero-get-started-btn"
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#6944f6] to-[#8d69ff] hover:from-[#7551fc] hover:to-[#9976ff] text-white text-sm font-semibold shadow-lg shadow-[#734eff]/30 hover:shadow-[#734eff]/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-login-btn"
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#151629] hover:bg-[#1f2038] text-white text-sm font-semibold border border-[#2b2e4f] hover:border-[#404470] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Login</span>
            </button>
            <button
              id="hero-live-demo-btn"
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-5 py-3.5 rounded-full text-xs font-semibold text-[#b8b3db] hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#8e6bfa]" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>
        </div>

        {/* Visual Hero Banner with 3D lavender coins and live dashboard overlay */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Visual Container */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#272948] bg-[#111222] shadow-2xl shadow-purple-950/40">
            {/* 3D Ethereal Coin Meadow Artwork */}
            <div className="relative h-[240px] sm:h-[340px] md:h-[420px] w-full overflow-hidden">
              <img
                src={heroCoinsImg}
                alt="Attentia attention rewards 3D landscape"
                className="w-full h-full object-cover object-center transform scale-[1.02] filter brightness-[0.88] contrast-[1.05]"
                referrerPolicy="no-referrer"
              />
              {/* Ethereal Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e1c] via-[#0d0e1c]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e1c]/70 via-transparent to-[#0d0e1c]/70" />

              {/* Tagline on image matching the reference banner */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center w-full px-4 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-[#d6cdfa] font-semibold bg-[#111026]/70 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#44387d]/50">
                  ✦ Where Money Grows
                </span>
              </div>
            </div>

            {/* Prominent Fintech Dashboard Mockup Overlay */}
            <div className="relative -mt-16 sm:-mt-24 md:-mt-28 px-4 sm:px-8 pb-8">
              <div className="bg-[#14162a]/95 backdrop-blur-xl rounded-2xl border border-[#2b2e52] p-5 sm:p-7 shadow-2xl">
                {/* Dashboard Header Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#232542]">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-xs font-semibold text-white tracking-wide uppercase">
                        Active Dashboard Mockup
                      </span>
                      <p className="text-[11px] text-[#868c9f]">
                        Simulated user view for verified tier participation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#a9aec4]">Current Tier:</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#251e4d] text-[#c9b4fe] border border-[#493a8c]">
                      PRO TIER
                    </span>
                  </div>
                </div>

                {/* 4 Key Metrics explicitly asked by user */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-5">
                  {/* Metric 1: Available Balance */}
                  <div className="p-4 rounded-xl bg-[#0f1021] border border-[#222440] hover:border-[#383b63] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#8f95ae]">Available Balance</span>
                      <Wallet className="w-3.5 h-3.5 text-[#8a68fa]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      $245.80
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        Eligible
                      </span>
                      <span className="text-[11px] text-[#717791]">Ready for withdrawal</span>
                    </div>
                  </div>

                  {/* Metric 2: Today's Rewards */}
                  <div className="p-4 rounded-xl bg-[#0f1021] border border-[#222440] hover:border-[#383b63] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#8f95ae]">Today's Rewards</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
                      +$12.50
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-[#717791]">From 24 verified activities</span>
                    </div>
                  </div>

                  {/* Metric 3: Ads Completed */}
                  <div className="p-4 rounded-xl bg-[#0f1021] border border-[#222440] hover:border-[#383b63] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#8f95ae]">Ads Completed</span>
                      <Award className="w-3.5 h-3.5 text-[#8a68fa]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      24
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-full bg-[#1b1c34] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#7c5cfc] h-full rounded-full w-[80%]" />
                      </div>
                      <span className="text-[10px] text-[#868c9f] whitespace-nowrap">24 / 30</span>
                    </div>
                  </div>

                  {/* Metric 4: Referral Rewards */}
                  <div className="p-4 rounded-xl bg-[#0f1021] border border-[#222440] hover:border-[#383b63] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#8f95ae]">Referral Rewards</span>
                      <Users className="w-3.5 h-3.5 text-[#c4b5fd]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#c4b5fd] tracking-tight">
                      +$8.00
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-[#717791]">8 active network members</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Explicit Compliance & Economics Notice */}
          <div className="mt-4 p-3.5 rounded-xl bg-[#131427]/80 border border-[#22243d] flex items-start sm:items-center gap-3 text-xs text-[#8f94ab]">
            <ShieldCheck className="w-4 h-4 text-[#8a68fa] shrink-0 mt-0.5 sm:mt-0" />
            <p className="leading-normal">
              <strong className="text-[#c6cbdf] font-semibold">Important regulatory notice:</strong> Attentia does not offer or imply guaranteed investment returns or guaranteed profits. Package pricing, daily quotas, eligibility requirements, transparent fees, and withdrawal conditions are strictly defined in accordance with advertiser engagement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
