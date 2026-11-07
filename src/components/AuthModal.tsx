import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Check, ArrowRight, User, Mail, Lock, Key, AlertCircle } from 'lucide-react';
import { PACKAGE_TIERS } from '../data/content';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  defaultTier?: 'starter' | 'growth' | 'pro';
  onClose: () => void;
  onSuccess: (email: string, tier: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode: initialMode,
  defaultTier = 'growth',
  onClose,
  onSuccess,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'growth' | 'pro'>(defaultTier);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = mode === 'register' ? await register(email, password) : await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message ?? 'Invalid username/email or password.');
      return;
    }

    setSuccessNotice(true);
    setTimeout(() => {
      onSuccess(result.user?.email ?? email, selectedTier);
      onClose();
      setSuccessNotice(false);
    }, 1000);
  };

  // Development seed account (backend/app/seed.py). Hidden in production builds.
  const handleDemoFill = () => {
    setMode('login');
    setEmail('demo');
    setPassword('demo-password');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#131427] border-2 border-[#2b2e54] shadow-2xl p-6 sm:p-8 overflow-hidden text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#7c83a4] hover:text-white hover:bg-[#1f213d] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6842f4] to-[#c7b3fe] p-[1.5px] flex items-center justify-center">
            <div className="w-full h-full bg-[#0d0e1c] rounded-[6px] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#c7b3fe]" />
            </div>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">Attentia Access Gateway</span>
        </div>

        <h3 className="text-2xl font-extrabold text-white tracking-tight font-display mb-1">
          {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
        </h3>
        <p className="text-xs text-[#8c93b6] mb-6">
          {mode === 'register'
            ? 'Select an entry package and start earning from verified sponsor interactions.'
            : 'Access your balance, daily tasks, and withdrawal history.'}
        </p>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0b0c16] border border-[#212440] mb-6">
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-[#25284e] text-white shadow-sm'
                : 'text-[#7e85a6] hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-[#25284e] text-white shadow-sm'
                : 'text-[#7e85a6] hover:text-white'
            }`}
          >
            Login
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-[#8f96b9] block mb-1.5">
                Select Participation Tier:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PACKAGE_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedTier === tier.id
                        ? 'bg-[#261f52] border-[#7d5ef9] text-white shadow-md'
                        : 'bg-[#0f1021] border-[#222440] text-[#747a9b] hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{tier.name}</span>
                    <span className="text-[11px] font-mono text-[#a589ff] block">${tier.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#8f96b9] block mb-1">
              {mode === 'register' ? 'Email Address:' : 'Username or Email Address:'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#5e6587] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={mode === 'register' ? 'email' : 'text'}
                required
                autoComplete={mode === 'register' ? 'email' : 'username'}
                placeholder={mode === 'register' ? 'you@example.com' : 'username or you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2.5 pl-9 pr-3 text-white text-xs focus:border-[#7c5cfc] outline-none placeholder:text-[#4d5371]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8f96b9] block mb-1">
              Password:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#5e6587] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                minLength={mode === 'register' ? 8 : undefined}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2.5 pl-9 pr-3 text-white text-xs focus:border-[#7c5cfc] outline-none placeholder:text-[#4d5371]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-[#8f96b9] block mb-1">
                Referral Code (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. ATTENTIA-7821"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-[#7c5cfc] outline-none placeholder:text-[#4d5371]"
              />
            </div>
          )}

          {mode === 'register' && (
            <label className="flex items-start gap-2 text-xs text-[#7e85a6] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded mt-0.5 border-[#32365e] bg-[#0b0c16]"
              />
              <span>
                I agree to the Terms of Service & acknowledge that rewards depend on verified ad interactions with no guaranteed returns.
              </span>
            </label>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (mode === 'register' && !agreeTerms)}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#6b45f6] to-[#916eff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-[#734eff]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : successNotice ? (
              <span className="flex items-center gap-1.5 text-white">
                <Check className="w-4 h-4" /> Success! Redirecting...
              </span>
            ) : (
              <>
                <span>{mode === 'register' ? `Register & Access Dashboard` : 'Login to Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Button */}
        <div className="mt-4 pt-4 border-t border-[#1c1e36] flex items-center justify-between">
          {import.meta.env.DEV ? (
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[11px] text-[#9b80ff] hover:underline"
            >
              Fill Demo Credentials
            </button>
          ) : <span />}
          <span className="text-[11px] text-[#61688b]">256-bit TLS Encrypted</span>
        </div>
      </div>
    </div>
  );
};
