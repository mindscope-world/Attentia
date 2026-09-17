import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  title,
  content,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#131427] border-2 border-[#2b2e54] shadow-2xl p-6 sm:p-8 text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#7c83a4] hover:text-white hover:bg-[#1f213d] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#8b6dfc]">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Compliance Document</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>

        <div className="text-xs sm:text-sm text-[#9da3c4] leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          <p>{content}</p>
          <p>
            Attentia enforces strict anti-money laundering (AML) and know-your-customer (KYC) standards where applicable by jurisdiction. Users are responsible for reporting any reward receipts to their relevant local tax authorities.
          </p>
          <p>
            Participation tiers grant daily task quota access for the specified duration cycle. Platform deposits are utilized to secure validator bandwith and sponsor pool accessibility.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-[#1f213d] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#222549] hover:bg-[#2e3263] text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
