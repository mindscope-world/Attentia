import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register', defaultTier?: 'starter' | 'growth' | 'pro') => void;
  onScrollTo: (id: string) => void;
  onEnterDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onScrollTo, onEnterDashboard }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Packages', id: 'packages' },
    { label: 'Interactive Demo', id: 'ad-interaction' },
    { label: 'Dashboard', id: 'dashboard-preview' },
    { label: 'Referrals', id: 'referrals' },
    { label: 'Deposit & Withdraw', id: 'deposit-withdraw' },
    { label: 'Security', id: 'security' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0b0c16]/90 backdrop-blur-md border-b border-[#212338]/80 py-3 shadow-lg shadow-black/20'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6842f4] via-[#8c6dfd] to-[#c7b3fe] p-[1.5px] flex items-center justify-center shadow-md shadow-[#7c5cfc]/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d0e1c] rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#c7b3fe]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                Attentia
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2a2350] text-[#c0abfd] font-medium border border-[#44387d]">
                  BETA
                </span>
              </span>
              <span className="text-[10px] tracking-wider uppercase text-[#888ea8] -mt-1 font-medium">
                Attention Rewards
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onScrollTo(link.id)}
                className="text-xs font-medium text-[#a0a5be] hover:text-white transition-colors cursor-pointer py-1"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Dark/Light Theme Toggle */}
            <ThemeToggle />

            {onEnterDashboard && (
              <button
                onClick={onEnterDashboard}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#181a38] hover:bg-[#232650] text-[#cbbaff] hover:text-white border border-[#3e347d] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dashboard</span>
              </button>
            )}
            <button
              id="nav-login-btn"
              onClick={() => onOpenAuth('login')}
              className="text-xs font-medium px-4 py-2 rounded-full text-[#c7cbdf] hover:text-white hover:bg-[#18192c] border border-transparent hover:border-[#2a2c47] transition-all cursor-pointer"
            >
              Login
            </button>
            <button
              id="nav-get-started-btn"
              onClick={() => onOpenAuth('register')}
              className="group text-xs font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-[#6b46f6] to-[#8d69ff] hover:from-[#7652fc] hover:to-[#9b78ff] text-white shadow-md shadow-[#7c5cfc]/25 hover:shadow-lg hover:shadow-[#7c5cfc]/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            {onEnterDashboard && (
              <button
                onClick={onEnterDashboard}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1c183d] text-[#cbbaff] border border-[#423682]"
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => onOpenAuth('register')}
              className="sm:hidden text-xs font-semibold px-3 py-1.5 rounded-full bg-[#7c5cfc] text-white"
            >
              Start
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#9da3c3] hover:text-white hover:bg-[#17182c] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0e1022]/98 border-b border-[#212338] px-4 pt-4 pb-6 space-y-3 mt-3 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onScrollTo(link.id);
                  setMobileMenuOpen(false);
                }}
                className="text-left text-xs font-medium text-[#a0a5be] hover:text-white p-2 rounded-lg hover:bg-[#181a33] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-[#1e2038] flex items-center justify-between px-1">
            <span className="text-xs text-[#8f96b9] font-medium">Appearance</span>
            <ThemeToggle showLabel />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onOpenAuth('login');
                setMobileMenuOpen(false);
              }}
              className="flex-1 text-xs font-semibold py-2.5 rounded-xl text-center bg-[#181a33] text-white border border-[#2b2e4f]"
            >
              Login
            </button>
            <button
              onClick={() => {
                onOpenAuth('register');
                setMobileMenuOpen(false);
              }}
              className="flex-1 text-xs font-semibold py-2.5 rounded-xl text-center bg-gradient-to-r from-[#6b46f6] to-[#8d69ff] text-white shadow-md shadow-[#7c5cfc]/20"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
