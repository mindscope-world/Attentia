import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  X, 
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Users
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { ActivityItem } from '../../types';

export const ActivitiesTab: React.FC = () => {
  const { activities } = useDashboard();
  const [filterType, setFilterType] = useState<'all' | 'ad' | 'referral' | 'withdrawal' | 'deposit'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<ActivityItem | null>(null);

  const filteredActivities = activities.filter((act) => {
    const matchesType = filterType === 'all' || act.type === filterType;
    const matchesSearch = 
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.details && act.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Type', 'Amount', 'Status', 'Time', 'Details'];
    const rows = filteredActivities.map(a => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      a.type,
      `"${a.amount}"`,
      a.status,
      `"${a.time}"`,
      `"${(a.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attentia_statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Activity & Transaction Statement
          </h1>
          <p className="text-xs sm:text-sm text-[#8a91b4] mt-1">
            Complete cryptographic audit trail of all sponsor evaluations, referral overrides, and settlements.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-[#1d203b] hover:bg-[#282c52] text-xs font-semibold text-white border border-[#2e335b] transition-all flex items-center gap-2 cursor-pointer w-fit"
        >
          <Download className="w-3.5 h-3.5 text-[#a488ff]" />
          <span>Export CSV Statement</span>
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#121326] border border-[#212443]">
          <span className="text-[11px] text-[#787f9f] block">Total Task Rewards</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">+$241.00</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#121326] border border-[#212443]">
          <span className="text-[11px] text-[#787f9f] block">Referral Commissions</span>
          <span className="text-lg font-bold text-sky-400 font-mono">+$88.40</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#121326] border border-[#212443]">
          <span className="text-[11px] text-[#787f9f] block">Settled Withdrawals</span>
          <span className="text-lg font-bold text-white font-mono">-$180.00</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#121326] border border-[#212443]">
          <span className="text-[11px] text-[#787f9f] block">Total Logged Events</span>
          <span className="text-lg font-bold text-[#a488ff] font-mono">{activities.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[#121326] border border-[#232646] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'ad', label: 'Task Rewards' },
            { id: 'referral', label: 'Referrals' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'deposit', label: 'Deposits' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-[#25284e] text-white shadow-sm'
                  : 'text-[#7e85a6] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#6d7494] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0c16] border border-[#212440] rounded-xl py-1.5 pl-9 pr-3 text-xs text-white focus:border-[#7c5cfc] outline-none placeholder:text-[#4d5371]"
          />
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#20233f] text-[#71789c] uppercase font-mono text-[10px]">
                <th className="pb-3">Event</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Details</th>
                <th className="pb-3">Time</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1e38]">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#717899]">
                    No activities found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-[#15172c] transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          act.type === 'ad'
                            ? 'bg-[#221c4b] text-[#a488ff]'
                            : act.type === 'referral'
                            ? 'bg-[#15233a] text-sky-400'
                            : act.type === 'deposit'
                            ? 'bg-[#11241f] text-emerald-400'
                            : 'bg-[#2c1f1f] text-rose-400'
                        }`}>
                          {act.type === 'ad' && <Sparkles className="w-4 h-4" />}
                          {act.type === 'referral' && <Users className="w-4 h-4" />}
                          {act.type === 'deposit' && <ArrowDownLeft className="w-4 h-4" />}
                          {act.type === 'withdrawal' && <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <span className="font-semibold text-white">{act.title}</span>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b92b6] bg-[#0b0c16] px-2 py-0.5 rounded border border-[#20233e]">
                        {act.type}
                      </span>
                    </td>

                    <td className="py-3.5 text-[#8a91b2] max-w-xs truncate">
                      {act.details || 'Verified on-chain protocol action'}
                    </td>

                    <td className="py-3.5 text-[#6c7294] font-mono text-[11px]">
                      {act.time}
                    </td>

                    <td className="py-3.5">
                      <span className={`font-mono font-bold ${
                        act.amount.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {act.amount}
                      </span>
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceipt(act)}
                        className="px-2.5 py-1 rounded-lg bg-[#1a1c36] hover:bg-[#25284e] text-[#b0a1fe] hover:text-white transition-colors text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cryptographic Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#131427] border-2 border-[#2b2e55] p-6 shadow-2xl text-left">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-[#7e85a6] hover:text-white hover:bg-[#1f213d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Settlement Receipt</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">
              {selectedReceipt.title}
            </h3>

            <div className="space-y-3 p-4 rounded-2xl bg-[#0b0c16] border border-[#212440] text-xs font-mono mb-6">
              <div className="flex justify-between">
                <span className="text-[#6d7494]">Receipt Reference:</span>
                <span className="text-white font-bold">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6d7494]">Amount Value:</span>
                <span className="text-emerald-400 font-bold">{selectedReceipt.amount} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6d7494]">Timestamp:</span>
                <span className="text-white">{selectedReceipt.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6d7494]">Ledger Status:</span>
                <span className="text-emerald-400 uppercase">{selectedReceipt.status}</span>
              </div>
              <div className="pt-2 border-t border-[#1d203a] flex flex-col gap-1">
                <span className="text-[#6d7494]">Validation Hash:</span>
                <span className="text-[10px] text-[#a488ff] break-all bg-[#141527] p-2 rounded">
                  {selectedReceipt.txHash || '0x49f8a12e8b0932c0d89e14a2bf1894a82103e91c'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <a
                href="https://tronscan.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#a488ff] hover:text-white flex items-center gap-1 font-semibold"
              >
                <span>View on Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl bg-[#23264b] hover:bg-[#2d3161] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
