import React from 'react';
import { ApiError } from '../../lib/api';

export const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong.');

export const Card: React.FC<{ title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title,
  action,
  children,
  className = '',
}) => (
  <section className={`rounded-3xl bg-[#101224] border border-[#202341] p-5 shadow-lg ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 mb-4">
        {title && <h2 className="text-sm font-bold text-white">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);

const TONES = {
  green: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
  red: 'bg-red-950/60 text-red-300 border-red-700/50',
  amber: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
  violet: 'bg-[#221c4b] text-[#cbbaff] border-[#44358a]',
  gray: 'bg-[#161832] text-[#8e96b8] border-[#272b53]',
};

export const Badge: React.FC<{ tone?: keyof typeof TONES; children: React.ReactNode }> = ({ tone = 'gray', children }) => (
  <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${TONES[tone]}`}>{children}</span>
);

type Variant = 'primary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-[#6b45f6] to-[#8a68ff] text-white hover:brightness-110',
  ghost: 'bg-[#181a33] hover:bg-[#23264c] text-[#aab1d3] hover:text-white border border-[#282b52]',
  danger: 'bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-700/50',
};

export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }> = ({
  variant = 'ghost',
  className = '',
  ...p
}) => (
  <button
    {...p}
    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
  />
);

export const inputCls =
  'w-full px-3 py-2 rounded-xl bg-[#0b0c1c] border border-[#262a50] text-xs text-white placeholder-[#5d6388] focus:outline-none focus:border-[#7c5cfc]';

export const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-[10px] uppercase font-mono font-bold text-[#71789c] mb-1">{label}</span>
    {children}
  </label>
);

export const Table: React.FC<{ head: string[]; children: React.ReactNode; empty?: string; isEmpty?: boolean }> = ({
  head,
  children,
  empty = 'Nothing here yet.',
  isEmpty,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-[10px] uppercase font-mono text-[#71789c]">
          {head.map((h) => (
            <th key={h} className="py-2 pr-4 font-bold whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#1b1e3a] text-[#c4c9e2]">{children}</tbody>
    </table>
    {isEmpty && <p className="py-8 text-center text-[#71789c]">{empty}</p>}
  </div>
);

export const fmtMoney = (v: string | number | null | undefined) => `$${Number(v ?? 0).toFixed(2)}`;
export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');
