import React, { useState } from 'react';
import { UserPlus, Layers, Eye, LineChart, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../data/content';

interface HowItWorksProps {
  onSelectStep: (stepNumber: string) => void;
}

export const HowItWorksSection: React.FC<HowItWorksProps> = ({ onSelectStep }) => {
  const [activeStep, setActiveStep] = useState('01');

  const icons = [
    <UserPlus className="w-5 h-5 text-[#8c6dfd]" />,
    <Layers className="w-5 h-5 text-[#8c6dfd]" />,
    <Eye className="w-5 h-5 text-[#8c6dfd]" />,
    <LineChart className="w-5 h-5 text-[#8c6dfd]" />,
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181630] border border-[#302a5c] text-[#c9b7ff] text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-[#9da2bf] leading-relaxed">
            We translate complex decentralized mechanics into an intuitive, frictionless flow for everyday participants.
          </p>
        </div>

        {/* 4-Step Horizontal Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const isSelected = activeStep === step.number;
            return (
              <div
                key={step.number}
                onClick={() => {
                  setActiveStep(step.number);
                  onSelectStep(step.number);
                }}
                className={`relative rounded-2xl p-6 sm:p-7 border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#181933] border-[#6b48f6] shadow-xl shadow-[#6b48f6]/15 scale-[1.02]'
                    : 'bg-[#121325] border-[#222440] hover:border-[#383b63] hover:bg-[#15162c]'
                }`}
              >
                {/* Number & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-extrabold font-display text-[#6a46f6] tracking-tight">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#1e203c] border border-[#2d3058] flex items-center justify-center group-hover:scale-110 transition-transform">
                      {icons[idx]}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2.5">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#9aa0bd] leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>

                {/* Additional Progressive Disclosure Details */}
                <div className="pt-4 border-t border-[#1f213b]">
                  <p className="text-[11px] text-[#787e9c] leading-normal mb-3">
                    {step.details}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b8a2ff]">
                    <span>{step.badge}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progressive Disclosure Design Note */}
        <div className="mt-12 max-w-3xl mx-auto rounded-xl bg-[#121327]/60 border border-[#20223d] p-4 text-center">
          <p className="text-xs text-[#7e85a6] leading-relaxed">
            <span className="text-[#a4abcb] font-semibold">User Experience Principle:</span> Progressive disclosure keeps the landing page focused on what matters: registering, reviewing clear terms, engaging, and receiving rewards—without drowning you in raw transaction hashes or server logs.
          </p>
        </div>
      </div>
    </section>
  );
};
