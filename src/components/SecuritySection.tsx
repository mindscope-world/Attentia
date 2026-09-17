import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  FileText, 
  Eye, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Database
} from 'lucide-react';
import templeBankImg from '../assets/images/bloom_temple_bank_1789643643827.jpg';

export const SecuritySection: React.FC = () => {
  const securityControls = [
    {
      icon: <Lock className="w-4 h-4 text-[#8c6dfd]" />,
      title: 'Encrypted Communication',
      desc: 'Enforced TLS 1.3 encryption with strict HTTP Strict Transport Security (HSTS) across all API endpoints.',
    },
    {
      icon: <Key className="w-4 h-4 text-[#8c6dfd]" />,
      title: 'Account Authentication',
      desc: 'Mandatory Time-based One-Time Password (TOTP 2FA), hardware security key support, and IP session binds.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-[#8c6dfd]" />,
      title: 'Transaction Verification',
      desc: 'Automated cryptographic signature validation matching address whitelists before any fund dispatch.',
    },
    {
      icon: <Database className="w-4 h-4 text-[#8c6dfd]" />,
      title: 'Deposit Confirmation Tracking',
      desc: 'Real-time multi-node block listeners ensuring strict decentralized validator consensus (12 confirmations).',
    },
    {
      icon: <Layers className="w-4 h-4 text-[#8c6dfd]" />,
      title: 'Withdrawal Status Tracking',
      desc: 'Granular status milestones (Submitted → Verified → Queued → Dispatched) with public tx hash receipts.',
    },
    {
      icon: <Eye className="w-4 h-4 text-[#8c6dfd]" />,
      title: 'Transparent Fees & Terms',
      desc: 'Zero concealed spreads, upfront platform rates, explicit withdrawal eligibility, and published privacy terms.',
    },
  ];

  return (
    <section id="security" className="py-20 md:py-28 bg-[#0d0e1e] border-t border-[#1a1c36] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Visual Split inspired by reference image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1839] border border-[#3b316f] text-[#d0c2ff] text-xs font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9a7efd]" />
              <span>Institutional Safeguards</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-6">
              Trust Built on Concrete Controls, Not Slogans
            </h2>

            <p className="text-base text-[#9fa5c7] leading-relaxed mb-6">
              Rather than making empty promises like “100% impenetrable,” Attentia operates under systematic risk architecture, automated cryptographic verification, and auditable on-chain accounting.
            </p>

            <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#8b6dfc]">
              <span className="flex items-center gap-1.5 bg-[#171830] px-3.5 py-1.5 rounded-full border border-[#2b2e53]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cold Treasury Isolation
              </span>
              <span className="flex items-center gap-1.5 bg-[#171830] px-3.5 py-1.5 rounded-full border border-[#2b2e53]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Public Block Explorer Receipts
              </span>
              <span className="flex items-center gap-1.5 bg-[#171830] px-3.5 py-1.5 rounded-full border border-[#2b2e53]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Strict Anti-Sybil Defense
              </span>
            </div>
          </div>

          {/* Neoclassical Temple Bank artwork from reference screenshot */}
          <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-[#2c2f54] bg-[#121326] relative shadow-2xl group">
            <div className="h-[280px] sm:h-[320px] w-full relative overflow-hidden">
              <img
                src={templeBankImg}
                alt="Institutional security bank visual"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121326] via-[#121326]/30 to-transparent" />
            </div>
            <div className="p-5 bg-[#121326] border-t border-[#20223d]">
              <span className="text-xs font-bold text-white block">Multi-Signature Treasury Reserve</span>
              <p className="text-[11px] text-[#8187aa] mt-1">
                Reward pools are locked in multi-signature cold vaults with automated batch release upon verified engagement metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Concrete Controls 6-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {securityControls.map((ctrl, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#121325] border border-[#222440] hover:border-[#383b63] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#1d1f3b] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {ctrl.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{ctrl.title}</h3>
                <p className="text-xs text-[#8e94b7] leading-relaxed">{ctrl.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Verifiable Explorer Banner */}
        <div className="rounded-2xl bg-[#14162e] border border-[#282c55] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#212347] flex items-center justify-center text-[#9c82fc] shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Public Transaction Verification</h4>
              <p className="text-xs text-[#8288aa]">
                Verify recent platform batch disbursements on TRONSCAN or Etherscan in real-time.
              </p>
            </div>
          </div>
          <a
            href="https://tronscan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full bg-[#1d1f3c] hover:bg-[#2b2e57] text-xs font-semibold text-[#c7b7fd] border border-[#353866] transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>View Public Ledger</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
};
