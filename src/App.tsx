import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { StatementSection } from './components/StatementSection';
import { PartnersStrip } from './components/PartnersStrip';
import { HowItWorksSection } from './components/HowItWorksSection';
import { PackagesSection } from './components/PackagesSection';
import { AdInteractionSection } from './components/AdInteractionSection';
import { DashboardPreviewSection } from './components/DashboardPreviewSection';
import { ReferralSystemSection } from './components/ReferralSystemSection';
import { DepositsAndWithdrawalsSection } from './components/DepositsAndWithdrawalsSection';
import { SecuritySection } from './components/SecuritySection';
import { FaqSection } from './components/FaqSection';
import { CtaSection } from './components/CtaSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { LegalModal } from './components/LegalModal';
import { CheckCircle2, Sparkles, X, ArrowRight } from 'lucide-react';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './components/dashboard/DashboardLayout';

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedTier, setSelectedTier] = useState<'starter' | 'growth' | 'pro'>('growth');

  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTitle, setLegalTitle] = useState('');
  const [legalContent, setLegalContent] = useState('');

  const [toastMessage, setToastMessage] = useState<{ text: string; showAction?: boolean } | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register', defaultTier: 'starter' | 'growth' | 'pro' = 'growth') => {
    setAuthMode(mode);
    setSelectedTier(defaultTier);
    setAuthModalOpen(true);
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthSuccess = (email: string, tier: string) => {
    setToastMessage({
      text: `Welcome ${email}! Account configured with ${tier.toUpperCase()} tier quota.`,
      showAction: true
    });
    // Switch to authenticated dashboard
    setViewMode('dashboard');
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleOpenLegal = (title: string, content: string) => {
    setLegalTitle(title);
    setLegalContent(content);
    setLegalModalOpen(true);
  };

  return (
    <ThemeProvider>
      <DashboardProvider>
        {viewMode === 'dashboard' ? (
          <DashboardLayout onBackToLanding={() => setViewMode('landing')} />
        ) : (
          <div className="min-h-screen bg-[#0b0c16] text-[#e2e4f0] selection:bg-[#7c5cfc]/30 selection:text-[#d3c9ff] flex flex-col font-sans transition-colors duration-200">
            {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#181a38] border-2 border-[#7652fc] text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block mb-0.5">Session Updated</span>
                <p className="text-[#a4abcb] mb-2">{toastMessage.text}</p>
                {toastMessage.showAction && (
                  <button
                    onClick={() => setViewMode('dashboard')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c7b4fd] hover:text-white underline cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="p-1 rounded-lg text-[#7b81a4] hover:text-white ml-auto cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sticky Header Navbar */}
          <Navbar 
            onOpenAuth={handleOpenAuth} 
            onScrollTo={handleScrollTo} 
            onEnterDashboard={() => setViewMode('dashboard')}
          />

          {/* Main Content Area */}
          <main className="flex-1">
            {/* 1. Hero Section */}
            <HeroSection
              onOpenAuth={handleOpenAuth}
              onExploreDemo={() => handleScrollTo('ad-interaction')}
            />

            {/* 2. Statement / "What is Attentia?" & 3 Bento Cards */}
            <StatementSection onExplore={() => handleScrollTo('how-it-works')} />

            {/* Institutional Partners Strip */}
            <PartnersStrip />

            {/* 3. How It Works (4-Step Progressive Disclosure) */}
            <HowItWorksSection onSelectStep={(step) => {
              if (step === '02') handleScrollTo('packages');
              if (step === '03') handleScrollTo('ad-interaction');
              if (step === '04') handleScrollTo('dashboard-preview');
            }} />

            {/* 4. Package/Tier Section */}
            <PackagesSection
              onSelectTier={(tierId) => handleOpenAuth('register', tierId)}
            />

            {/* 5. Core User Ad-Interaction Demonstration */}
            <AdInteractionSection />

            {/* 6. Dashboard Preview (Authenticated Experience) */}
            <DashboardPreviewSection 
              onOpenFullDashboard={() => setViewMode('dashboard')} 
            />

            {/* 7. Referral System Visual Network Tree & Rules */}
            <ReferralSystemSection />

            {/* 8. Deposits & Withdrawals Infrastructure */}
            <DepositsAndWithdrawalsSection />

            {/* 9. Trust & Concrete Security Controls */}
            <SecuritySection />

            {/* 10. Frequently Asked Questions Accordion */}
            <FaqSection />

            {/* Conversion CTA */}
            <CtaSection onOpenRegister={() => handleOpenAuth('register', 'growth')} />
          </main>

          {/* Footer */}
          <Footer onScrollTo={handleScrollTo} onOpenLegal={handleOpenLegal} />

          {/* Modals */}
          <AuthModal
            isOpen={authModalOpen}
            mode={authMode}
            defaultTier={selectedTier}
            onClose={() => setAuthModalOpen(false)}
            onSuccess={handleAuthSuccess}
          />

          <LegalModal
            isOpen={legalModalOpen}
            title={legalTitle}
            content={legalContent}
            onClose={() => setLegalModalOpen(false)}
          />
        </div>
      )}
      </DashboardProvider>
    </ThemeProvider>
  );
}
