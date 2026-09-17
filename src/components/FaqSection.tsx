import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, ShieldCheck } from 'lucide-react';
import { FAQ_LIST } from '../data/content';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Platform & Rewards' | 'Deposits & Withdrawals' | 'Referrals'>('All');

  const filteredFaqs = FAQ_LIST.filter((faq) => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1738] border border-[#3b316d] text-[#d0c2ff] text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-[#9a7efd]" />
            <span>Answers & Transparency</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-4">
            Frequently Asked Questions
          </h2>

          <p className="text-base text-[#9da2c2] leading-relaxed">
            Everything you need to know about attention verification, deposit handling, fees, and on-chain withdrawals before you register.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-8">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#141527] border border-[#232646] w-full sm:w-auto">
            {(['All', 'Platform & Rewards', 'Deposits & Withdrawals', 'Referrals'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  activeCategory === cat
                    ? 'bg-[#26284e] text-white shadow-sm'
                    : 'text-[#7e85a6] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#6c7394] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111222] border border-[#232646] rounded-xl py-1.5 pl-9 pr-3 text-xs text-white focus:border-[#7c5cfc] outline-none placeholder:text-[#525775]"
            />
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#15162d] border-[#383c66] shadow-lg shadow-purple-950/20'
                    : 'bg-[#111224] border-[#1e203a] hover:border-[#2f335b]'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {faq.question}
                  </span>
                  <div className={`p-1 rounded-lg bg-[#1e203d] text-[#a488ff] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-xs sm:text-sm text-[#9da3c4] leading-relaxed border-t border-[#1d1f38]/60">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional support note */}
        <div className="mt-10 text-center p-4 rounded-2xl bg-[#121327]/60 border border-[#212440] text-xs text-[#8086a6]">
          Have a question not covered here? Reach our 24/7 compliance and technical support desk inside your authenticated dashboard.
        </div>
      </div>
    </section>
  );
};
