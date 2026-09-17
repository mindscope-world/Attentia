import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface CtaSectionProps {
  onOpenRegister: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenRegister }) => {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#6744e8]/20 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-[#181a38] via-[#14152e] to-[#0f1022] border-2 border-[#363964] p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle top decoration badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#241f4f] text-[#c9b7ff] border border-[#443888] text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#9e80ff]" />
            <span>Registration is currently open</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-4">
            Ready to Turn Your Attention <br className="hidden sm:inline" />
            Into Verifiable Rewards?
          </h2>

          <p className="text-sm sm:text-base text-[#a2a8ca] max-w-xl mx-auto mb-8 leading-relaxed">
            Create your account in under a minute, select an entry package, and start participating in sponsored content campaigns today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#6b45f6] to-[#9270ff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-sm font-bold tracking-wide shadow-xl shadow-[#734eff]/35 hover:shadow-[#734eff]/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#797f9f]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Transparent blockchain settlement
            </span>
            <span>•</span>
            <span>No hidden lockup periods</span>
            <span>•</span>
            <span>USDT & USDC compatible</span>
          </div>
        </div>
      </div>
    </section>
  );
};
