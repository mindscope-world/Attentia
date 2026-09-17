import React from 'react';

export const PartnersStrip: React.FC = () => {
  const partners = [
    { name: 'TRON TRC-20', label: 'USDT TRC20' },
    { name: 'ETHEREUM', label: 'ERC-20' },
    { name: 'POLYGON', label: 'USDC Proof' },
    { name: 'CERTIK', label: 'Security Audit' },
    { name: 'CHAINLINK', label: 'Price Feeds' },
    { name: 'KUCOIN', label: 'Ecosystem' },
    { name: 'DEXTOOLS', label: 'Analytics' },
  ];

  return (
    <section className="py-10 border-b border-[#181a30] bg-[#0c0d1c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-[#696f8c] mb-6">
          Supported infrastructure & verified security ecosystem
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16 opacity-60 hover:opacity-90 transition-opacity">
          {partners.map((partner) => (
            <div key={partner.name} className="flex items-center gap-2 group">
              <span className="text-xs sm:text-sm font-bold tracking-widest text-[#a1a6c4] group-hover:text-white transition-colors">
                {partner.name}
              </span>
              <span className="text-[10px] text-[#555a75] group-hover:text-[#8b91b8] border border-[#21233d] px-1.5 py-0.5 rounded font-mono">
                {partner.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
