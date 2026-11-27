import React, { useEffect, useState } from 'react';
import { AdminStats, adminApi } from '../../lib/adminApi';
import { Card, errMsg, fmtMoney } from './ui';

export const AdminOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [s, setS] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then(setS).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <p className="text-red-300 text-xs">{error}</p>;
  if (!s) return <p className="text-[#71789c] text-xs">Loading…</p>;

  const tiles: [string, string | number, string?][] = [
    ['Registered users', s.registered_users],
    ['Active (7d)', s.active_participants_7d],
    ['Live ads', s.active_campaigns],
    ['Verified tasks', s.verified_tasks],
    ['Rejected tasks', s.rejected_tasks],
    ['Suspicious events', s.suspicious_playback_events],
    ['Deposits', fmtMoney(s.deposit_volume)],
    ['Withdrawals paid', fmtMoney(s.withdrawal_volume)],
    ['Rewards credited', fmtMoney(s.rewards_credited)],
    ['Reward liabilities', fmtMoney(s.reward_liabilities)],
    ['Ad spend', fmtMoney(s.campaign_spend)],
  ];

  return (
    <div className="space-y-5">
      {s.withdrawals_awaiting_review > 0 && (
        <button
          onClick={() => onNavigate('funds')}
          className="w-full text-left rounded-2xl bg-amber-950/40 border border-amber-700/50 px-4 py-3 text-xs text-amber-200 cursor-pointer hover:bg-amber-950/60"
        >
          <b>{s.withdrawals_awaiting_review}</b> withdrawal{s.withdrawals_awaiting_review === 1 ? '' : 's'} awaiting review →
        </button>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(([label, value]) => (
          <Card key={label} className="!p-4">
            <p className="text-[10px] uppercase font-mono text-[#71789c]">{label}</p>
            <p className="text-xl font-extrabold text-white font-mono mt-1">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
