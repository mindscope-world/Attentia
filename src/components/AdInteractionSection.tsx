import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Star, ArrowRight, Eye, RefreshCw, Send, Check } from 'lucide-react';

export const AdInteractionSection: React.FC = () => {
  const [rating, setRating] = useState<number | null>(4);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoBalance, setDemoBalance] = useState(245.80);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setDemoBalance((prev) => +(prev + 0.50).toFixed(2));
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    setRating(null);
  };

  return (
    <section id="ad-interaction" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1738] border border-[#3b316d] text-[#d0c2ff] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#9a7efd]" />
            <span>Core User Interaction</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-4">
            Interactive Ad Verification
          </h2>

          <p className="text-base sm:text-lg text-[#9da2c2] leading-relaxed">
            Experience how fast and frictionless earning is. View sponsored campaigns, submit qualitative relevance feedback, and watch rewards update in real-time.
          </p>

          {/* UX Flow diagram: View -> Interact -> Submit -> Account updates */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-full bg-[#121326] border border-[#232646] text-xs font-medium text-[#abb0d0]">
            <span className="px-3 py-1 rounded-full bg-[#1b1c36] text-white flex items-center gap-1">
              <Eye className="w-3 h-3 text-[#8b6dfc]" /> 1. View
            </span>
            <span className="text-[#555a7a]">→</span>
            <span className="px-3 py-1 rounded-full bg-[#1b1c36] text-white flex items-center gap-1">
              <Star className="w-3 h-3 text-[#8b6dfc]" /> 2. Interact
            </span>
            <span className="text-[#555a7a]">→</span>
            <span className="px-3 py-1 rounded-full bg-[#1b1c36] text-white flex items-center gap-1">
              <Send className="w-3 h-3 text-[#8b6dfc]" /> 3. Submit
            </span>
            <span className="text-[#555a7a]">→</span>
            <span className="px-3 py-1 rounded-full bg-[#1a2f26] text-emerald-400 border border-emerald-800/50 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> 4. Account Updates
            </span>
          </div>
        </div>

        {/* The Interactive Mockup Box requested in prompt */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl bg-[#131427] border-2 border-[#2c2f54] shadow-2xl overflow-hidden">
            {/* Mockup Title Bar */}
            <div className="bg-[#191b35] px-6 py-3.5 border-b border-[#26294a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs font-mono text-[#8b91b4]">Sponsored Content Demo</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
                <span>Demo Balance:</span>
                <span className="bg-[#0b0c16] px-2 py-0.5 rounded border border-[#21233d]">
                  ${demoBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Sponsored Creative Simulation Banner */}
              <div className="rounded-2xl bg-gradient-to-br from-[#1d1f3d] via-[#16172d] to-[#121323] border border-[#2c2e52] p-5 sm:p-6 mb-6 relative overflow-hidden">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#a085ff] bg-[#292454] px-2.5 py-0.5 rounded border border-[#483d8a]">
                      Verified Advertiser Campaign
                    </span>
                    <h4 className="text-lg sm:text-xl font-bold text-white mt-2">
                      Apex Cloud Infrastructure: High-Velocity AI Clusters
                    </h4>
                    <p className="text-xs text-[#8e94b7] mt-1">
                      Deploy enterprise-grade GPU instances with sub-millisecond latency worldwide.
                    </p>
                  </div>
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6944f6] to-[#a88dff] flex items-center justify-center text-white font-bold shadow-md shadow-[#7c5cfc]/30">
                    APEX
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#71789c] pt-3 border-t border-[#25284b]">
                  <span>Duration: 15s verified view</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Reward: +$0.50 upon rating</span>
                </div>
              </div>

              {/* Rating Question & Selector */}
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white mb-3">
                      How relevant is this advertisement to your interests?
                    </p>

                    {/* 1 to 5 radio buttons with clear hover & active states */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const active = rating === val;
                        return (
                          <label
                            key={val}
                            className={`flex flex-col items-center gap-1.5 cursor-pointer p-2 rounded-xl transition-all ${
                              active
                                ? 'bg-[#25214d] text-white scale-110'
                                : 'text-[#7e85a6] hover:text-white hover:bg-[#191a33]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="ad-relevance"
                              value={val}
                              checked={active}
                              onChange={() => setRating(val)}
                              className="sr-only"
                            />
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                                active
                                  ? 'bg-[#704cf7] text-white border-[#8f70fe] shadow-lg shadow-[#704cf7]/40'
                                  : 'bg-[#181932] border-[#2b2e50]'
                              }`}
                            >
                              {val}
                            </div>
                            <span className="text-[10px] text-[#6b7294]">
                              {val === 1 ? 'Poor' : val === 5 ? 'High' : ''}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="flex items-center justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting || rating === null}
                      className="px-8 py-3 rounded-full bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] disabled:opacity-50 text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-[#734eff]/25 flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying interaction...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Interaction</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Success State */
                <div className="py-6 text-center space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-white">
                      Interaction Verified & Recorded!
                    </h5>
                    <p className="text-xs text-emerald-400 font-semibold mt-1">
                      +$0.50 credited to your available balance
                    </p>
                    <p className="text-xs text-[#7e85a6] mt-2 max-w-sm mx-auto">
                      View → Interact → Submit → Account updates completed seamlessly without complex manual transaction hashes.
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1b1c36] hover:bg-[#25284b] text-xs text-[#a4abcb] hover:text-white transition-colors border border-[#2b2e50]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try another sample interaction</span>
                  </button>
                </div>
              )}
            </div>

            {/* Human-Centered UX Disclaimer footer */}
            <div className="bg-[#0e0f1e] px-6 py-3 border-t border-[#1d1f3b] text-center">
              <span className="text-[11px] text-[#6d7394]">
                Clean, progressive UX designed for humans rather than raw terminal endpoints.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
