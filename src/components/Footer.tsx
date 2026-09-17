import React from 'react';
import { Sparkles, Shield, ArrowUp } from 'lucide-react';

interface FooterProps {
  onScrollTo: (id: string) => void;
  onOpenLegal: (title: string, content: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollTo, onOpenLegal }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#080913] border-t border-[#16182c] pt-16 pb-12 text-[#7f86a7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#17192d]">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6842f4] via-[#8c6dfd] to-[#c7b3fe] p-[1.5px] flex items-center justify-center">
                <div className="w-full h-full bg-[#0d0e1c] rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#c7b3fe]" />
                </div>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Attentia</span>
            </div>
            <p className="text-xs text-[#737a9b] leading-relaxed max-w-sm">
              An attention-driven marketing protocol connecting verified participants with leading sponsor brands through structured qualitative interaction rewards.
            </p>
            <div className="text-[11px] text-[#555a79]">
              Decentralized settlement supported across TRON (TRC-20), Ethereum (ERC-20), and Polygon PoS.
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Platform
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onScrollTo('how-it-works')}
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('packages')}
                  className="hover:text-white transition-colors"
                >
                  Package Tiers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('ad-interaction')}
                  className="hover:text-white transition-colors"
                >
                  Ad Interaction Demo
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('dashboard-preview')}
                  className="hover:text-white transition-colors"
                >
                  Dashboard Preview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('referrals')}
                  className="hover:text-white transition-colors"
                >
                  Referral System
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Financial & Governance */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Transparency
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onScrollTo('deposit-withdraw')}
                  className="hover:text-white transition-colors"
                >
                  Deposit & Withdrawal Rules
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('security')}
                  className="hover:text-white transition-colors"
                >
                  Security Controls
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('faq')}
                  className="hover:text-white transition-colors"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('Terms of Service', 'Terms & Conditions: Participation packages represent access quotas to verified sponsored tasks. All rewards require active, verified user engagement and submission of compliant feedback. Attentia makes no representations or warranties regarding guaranteed returns, fixed investment yields, or capital multiplication.')}
                  className="hover:text-white transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('Privacy Policy', 'Privacy Policy: Attentia protects user confidentiality. We do not sell personally identifiable data to advertisers. Feedback provided on sponsored creatives is aggregated and anonymized to protect participant privacy.')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Status & Back to Top */}
          <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white block mb-2">
                System Status
              </span>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#101b1a] border border-emerald-900/60 text-emerald-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </div>
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-xs text-[#838ba9] hover:text-white p-2 rounded-lg bg-[#111222] border border-[#21233d] w-fit transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Legal & Anti-Fraud Disclaimer */}
        <div className="pt-8 space-y-4 text-[11px] text-[#555a79] leading-relaxed">
          <p>
            <strong className="text-[#848ba8]">Regulatory Disclosure:</strong> Attentia is an attention-rewards technology service. Participation packages involve access to daily marketing evaluation quotas. Rewards are strictly non-guaranteed and are determined exclusively by active, completed sponsor campaign evaluations. This platform does not provide securities trading, investment advice, lending yields, or guaranteed financial returns.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#121324]">
            <p>© {new Date().getFullYear()} Attentia Protocol. All rights reserved.</p>
            <p className="font-mono text-[10px]">Version 2.4.0 (Production Release)</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
