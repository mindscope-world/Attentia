import React, { useEffect, useState } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ListOrdered
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { ApiNetwork } from '../../lib/api';

export const DepositsWithdrawalsTab: React.FC = () => {
  const { 
    userProfile, 
    availableBalance, 
    withdrawals, 
    deposits, 
    requestWithdrawal, 
    packages,
    pendingDeposit,
    createDeposit,
    simulateDeposit,
    canSimulateDeposits,
    minWithdrawal,
    withdrawalFeeRate: feeRate,
    hasActivePackage,
    refresh,
  } = useDashboard();

  const [subTab, setSubTab] = useState<'withdraw' | 'deposit' | 'ledger'>('withdraw');

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawNetwork, setWithdrawNetwork] = useState<ApiNetwork>('TRC-20');
  const [withdrawAddress, setWithdrawAddress] = useState<string>(userProfile.walletWhitelist.trc20);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  // Deposit state
  const [depositPackageId, setDepositPackageId] = useState<string>('');
  const [depositNetwork, setDepositNetwork] = useState<ApiNetwork>('TRC-20');
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [depositBusy, setDepositBusy] = useState<boolean>(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Default to the package the participant already has, else the first one on offer.
  useEffect(() => {
    if (!depositPackageId && packages.length) {
      setDepositPackageId((packages.find((p) => p.code === userProfile.tier) ?? packages[0]).id);
    }
  }, [packages, userProfile.tier, depositPackageId]);

  // The server confirms deposits in the background; keep the open deposit fresh.
  useEffect(() => {
    if (!pendingDeposit) return;
    const t = setInterval(() => void refresh(), 15000);
    return () => clearInterval(t);
  }, [pendingDeposit?.id, refresh]);

  const walletFor = (net: ApiNetwork) =>
    net === 'TRC-20' ? userProfile.walletWhitelist.trc20 : net === 'ERC-20' ? userProfile.walletWhitelist.erc20 : userProfile.walletWhitelist.polygon;

  const calculateFee = () => {
    const val = parseFloat(withdrawAmount) || 0;
    return (val * feeRate).toFixed(2);
  };

  const calculateNet = () => {
    const val = parseFloat(withdrawAmount) || 0;
    const fee = parseFloat(calculateFee());
    return Math.max(0, val - fee).toFixed(2);
  };

  const handleCopy = () => {
    if (!pendingDeposit) return;
    navigator.clipboard.writeText(pendingDeposit.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleNetworkChange = (net: ApiNetwork) => {
    setWithdrawNetwork(net);
    setWithdrawAddress(walletFor(net));
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    setSubmittingWithdrawal(true);
    const res = await requestWithdrawal(parseFloat(withdrawAmount) || 0, withdrawNetwork, withdrawAddress);
    setSubmittingWithdrawal(false);
    setFeedbackMsg({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) setWithdrawAmount('');
  };

  const handleCreateDeposit = async () => {
    setDepositBusy(true);
    setDepositError(null);
    try {
      await createDeposit(depositPackageId, depositNetwork);
    } catch (e) {
      setDepositError(e instanceof Error ? e.message : 'Could not create a deposit address.');
    } finally {
      setDepositBusy(false);
    }
  };

  const handleSimulateDeposit = async () => {
    if (!pendingDeposit) return;
    setDepositBusy(true);
    setDepositError(null);
    try {
      await simulateDeposit(pendingDeposit);
    } catch (e) {
      setDepositError(e instanceof Error ? e.message : 'Simulation is not available here.');
    } finally {
      setDepositBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Treasury & Settlements
          </h1>
          <p className="text-xs sm:text-sm text-[#8a91b4] mt-1">
            Deposit crypto to configure package quotas or request on-chain settlement to your whitelisted address.
          </p>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#121326] border border-[#242749] w-fit">
          <button
            onClick={() => setSubTab('withdraw')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'withdraw'
                ? 'bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] text-white shadow-md'
                : 'text-[#7e85a6] hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
          <button
            onClick={() => setSubTab('deposit')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'deposit'
                ? 'bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] text-white shadow-md'
                : 'text-[#7e85a6] hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Deposit / Upgrade</span>
          </button>
          <button
            onClick={() => setSubTab('ledger')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'ledger'
                ? 'bg-[#25284e] text-white border border-[#484f88]'
                : 'text-[#7e85a6] hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Withdraw Funds */}
      {subTab === 'withdraw' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Withdrawal Form (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-[#121326] border border-[#262a4d] p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#20233e] mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white block">
                  Request Settlement
                </span>
                <span className="text-[11px] text-[#71789c]">
                  Minimum threshold: ${minWithdrawal.toFixed(2)} USDT
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#787f9f] block">Available to Withdraw:</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  ${availableBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-[#8f96b9] block mb-1.5">
                  Withdrawal Amount (USDT):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={minWithdrawal}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2.5 pl-8 pr-16 text-white text-sm font-mono focus:border-[#7c5cfc] outline-none"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(availableBalance.toFixed(2))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#a48aff] bg-[#1e1a3d] hover:bg-[#2c2459] px-2.5 py-1 rounded transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Network */}
              <div>
                <label className="text-xs font-semibold text-[#8f96b9] block mb-1.5">
                  Select Payout Blockchain Network:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TRC-20', label: 'TRON (TRC-20)', sub: '~2 min dispatch' },
                    { id: 'ERC-20', label: 'Ethereum (ERC-20)', sub: '~10 min dispatch' },
                    { id: 'POLYGON', label: 'Polygon PoS', sub: '~3 min dispatch' },
                  ].map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => handleNetworkChange(net.id as ApiNetwork)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        withdrawNetwork === net.id
                          ? 'bg-[#251f50] border-[#7d5efc] text-white shadow-md'
                          : 'bg-[#0e0f1e] border-[#1f223d] text-[#71789c] hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{net.label}</span>
                      <span className="text-[10px] text-[#a488ff] block">{net.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination Address */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#8f96b9]">
                    Destination {withdrawNetwork} Address:
                  </label>
                  {withdrawAddress && withdrawAddress === walletFor(withdrawNetwork) && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Saved address
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2.5 px-3 text-white text-xs font-mono focus:border-[#7c5cfc] outline-none"
                  placeholder="Enter your payout address"
                />
              </div>

              {/* Fee Breakdown Calculation */}
              <div className="p-4 rounded-2xl bg-[#0b0c16] border border-[#1e213d] text-xs space-y-2">
                <div className="flex justify-between text-[#8288a7]">
                  <span>{userProfile.tier === 'none' ? 'Platform' : userProfile.tier.toUpperCase()} Fee ({(feeRate * 100).toFixed(1)}%):</span>
                  <span className="font-mono text-white">${calculateFee()} USDT</span>
                </div>
                <div className="flex justify-between text-[#8288a7]">
                  <span>Network Gas Surcharge:</span>
                  <span className="font-mono text-emerald-400">Sponsored ($0.00)</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-[#1d203a]">
                  <span>Net Expected Receipt:</span>
                  <span className="font-mono text-emerald-400 text-sm">${calculateNet()} USDT</span>
                </div>
              </div>

              {feedbackMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedbackMsg.type === 'error'
                    ? 'bg-rose-950/50 border border-rose-800 text-rose-300'
                    : 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                }`}>
                  {feedbackMsg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingWithdrawal || !hasActivePackage || availableBalance < minWithdrawal}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-[#734eff]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{submittingWithdrawal ? 'Submitting…' : `Request Payout of $${calculateNet()} USDT`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right: Active In-Flight Tracking & Conditions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Active Withdrawal Card */}
            {withdrawals.length > 0 && withdrawals[0].status === 'verifying' ? (
              <div className="rounded-3xl bg-[#121326] border border-[#2b2e55] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Active Settlement Status
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    #{withdrawals[0].id}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0b0c16] border border-[#1e203b] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7d84a5]">Requested:</span>
                    <span className="font-mono font-bold text-white">${withdrawals[0].amount.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7d84a5]">Target Network:</span>
                    <span className="font-mono text-white">{withdrawals[0].network}</span>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-white font-medium">Request submitted</span>
                    <span className="text-[10px] text-[#6b7294] ml-auto">Verified</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                    <span className="text-white font-medium">Automated anti-fraud audit</span>
                    <span className="text-[10px] text-sky-400 ml-auto">In Progress</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs opacity-50">
                    <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-[#7e85a6]">Validator ledger broadcast</span>
                    <span className="text-[10px] text-[#6b7294] ml-auto">Queued</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Platform Rules Summary */}
            <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white mb-2">Settlement Policy Guidelines</h3>
              <ul className="space-y-2.5 text-xs text-[#8a91b2] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7d5efc] mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-white">Batch Windows:</strong> Payout batches execute continuously every 1 to 4 hours.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7d5efc] mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-white">Network Match:</strong> Ensure destination exchange supports direct TRC20/ERC20 credits.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7d5efc] mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-white">Zero Hidden Hold:</strong> No rolling reserves or artificial cooling periods are applied to eligible earnings.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Deposit / Upgrade */}
      {subTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Package Selector & Address Generator (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-[#121326] border border-[#262a4d] p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white block mb-1">
                Activate or Upgrade a Participation Package
              </span>
              <p className="text-xs text-[#7e85a6]">
                Each deposit address is unique to one package purchase. Once the transfer is confirmed, the package and its daily task quota activate automatically.
              </p>
            </div>

            {pendingDeposit ? (
              <div className="p-4 rounded-2xl bg-[#0b0c16] border border-[#212440] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#888fae]">
                    Send exactly ${Number(pendingDeposit.expected_amount).toFixed(2)} {pendingDeposit.asset} on {pendingDeposit.network}
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {pendingDeposit.status === 'pending'
                      ? `${pendingDeposit.confirmations}/${pendingDeposit.required_confirmations} confirmations`
                      : 'Awaiting payment'}
                  </span>
                </div>
                <div className="font-mono text-xs text-white break-all p-3 bg-[#141527] rounded-xl border border-[#242747] select-all">
                  {pendingDeposit.address}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#1e203c] hover:bg-[#2b2e54] text-xs font-semibold text-white border border-[#31355c] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAddress ? 'Copied to Clipboard!' : 'Copy Deposit Address'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="py-2 px-4 rounded-lg bg-[#1e203c] hover:bg-[#2b2e54] text-xs font-semibold text-white border border-[#31355c] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#9a7ffd]" />
                    <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
                  </button>
                </div>
                {showQr && (
                  <div className="p-4 bg-white rounded-2xl text-center max-w-[190px] mx-auto animate-fade-in">
                    <div className="w-32 h-32 mx-auto bg-neutral-900 flex items-center justify-center rounded-xl p-2 text-white text-[10px] font-mono text-center">
                      [QR: {pendingDeposit.network}]
                    </div>
                    <span className="text-[10px] text-neutral-600 block mt-2 font-mono">Scan via Mobile Wallet</span>
                  </div>
                )}
                <p className="text-[11px] text-[#71789c]">
                  This address expires {new Date(pendingDeposit.expires_at).toLocaleString()}. Status refreshes automatically.
                </p>
                {canSimulateDeposits && (
                  <div className="pt-3 border-t border-[#1d203a] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[11px] text-[#71789c]">Development only: pretend the transfer was broadcast.</span>
                    <button
                      type="button"
                      onClick={handleSimulateDeposit}
                      disabled={depositBusy}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#201c44] hover:bg-[#2e2666] border border-[#48398b] text-xs font-bold text-[#c7b4fd] transition-all cursor-pointer disabled:opacity-60"
                    >
                      {depositBusy ? 'Working…' : `Simulate transfer of $${Number(pendingDeposit.expected_amount).toFixed(2)}`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Package Selection */}
                <div>
                  <label className="text-xs font-semibold text-[#8f96b9] block mb-2">Select package:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setDepositPackageId(pkg.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          depositPackageId === pkg.id
                            ? 'bg-[#251f50] border-[#7d5efc] text-white shadow-lg'
                            : 'bg-[#0e0f1e] border-[#1f223d] text-[#71789c] hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">
                          {pkg.name} {pkg.code === userProfile.tier && <span className="text-emerald-400">(current)</span>}
                        </span>
                        <span className="text-base font-extrabold font-mono text-white block my-0.5">${Number(pkg.price).toFixed(0)}</span>
                        <span className="text-[10px] text-[#a488ff] block">{pkg.daily_quota} tasks / day</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Network Selector */}
                <div>
                  <label className="text-xs font-semibold text-[#8f96b9] block mb-2">Select blockchain rail:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([['TRC-20', 'USDT · Lowest fees'], ['ERC-20', 'USDT · Ethereum'], ['POLYGON', 'USDC · Polygon']] as const).map(([net, sub]) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setDepositNetwork(net)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          depositNetwork === net
                            ? 'bg-[#251f50] border-[#7d5efc] text-white'
                            : 'bg-[#0e0f1e] border-[#1f223d] text-[#71789c] hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{net}</span>
                        <span className="text-[10px] text-[#a488ff] block">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateDeposit}
                  disabled={depositBusy || !depositPackageId}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-[#734eff]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{depositBusy ? 'Generating…' : 'Generate my deposit address'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {depositError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{depositError}</span>
              </div>
            )}
          </div>

          {/* Right: Confirmation Status & Instructions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white">Blockchain Ingress Flow</h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Transmit from wallet', desc: 'Transfer exact amount to the specified receiving address.' },
                  { step: '2', title: 'Mempool detection', desc: 'Node listeners detect transaction broadcast within 5–15 seconds.' },
                  { step: '3', title: '12 Confirmations', desc: 'Immutable ledger finality achieved across blockchain nodes.' },
                  { step: '4', title: 'Package activated', desc: 'Your daily task quota unlocks automatically once the deposit is confirmed.' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-[#1e1c3c] text-[#a488ff] font-bold flex items-center justify-center shrink-0 border border-[#343063]">
                      {s.step}
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{s.title}</span>
                      <span className="text-[11px] text-[#71789c]">{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1a1727] border border-[#3f3120] flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-[#b8a792] leading-relaxed">
                <strong className="text-amber-300">Network Matching Notice:</strong> Transmitting USDT via Ethereum ERC-20 to a TRON address will result in permanent capital loss. Always check your sending network.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Ledger History */}
      {subTab === 'ledger' && (
        <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Historical Treasury Ledger
              </h2>
              <p className="text-xs text-[#7e85a6]">All deposits, package activations, and verified outbound withdrawals</p>
            </div>
            <span className="text-xs font-mono text-[#a488ff]">
              {withdrawals.length + deposits.length} Total Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#20233f] text-[#71789c] uppercase font-mono text-[10px]">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">TX / Order ID</th>
                  <th className="pb-3">Network</th>
                  <th className="pb-3">Gross Amount</th>
                  <th className="pb-3">Net Settled</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1e38]">
                {/* Withdrawals rows */}
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[#15172c] transition-colors">
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40 text-[10px] font-bold uppercase">
                        Withdrawal
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-white font-semibold">#{w.id}</td>
                    <td className="py-3.5 text-[#8c94b7]">{w.network}</td>
                    <td className="py-3.5 font-mono text-white">${w.amount.toFixed(2)}</td>
                    <td className="py-3.5 font-mono text-emerald-400 font-semibold">${w.netAmount.toFixed(2)}</td>
                    <td className="py-3.5 text-[#72799c]">{w.requestedAt}</td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        w.status === 'completed'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : w.status === 'rejected'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                      }`}>
                        {w.status === 'verifying' && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Deposits rows */}
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-[#15172c] transition-colors">
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold uppercase">
                        Deposit
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-white font-semibold">#{d.id}</td>
                    <td className="py-3.5 text-[#8c94b7]">{d.network}</td>
                    <td className="py-3.5 font-mono text-white">${d.amount.toFixed(2)}</td>
                    <td className="py-3.5 font-mono text-emerald-400 font-semibold">${d.amount.toFixed(2)}</td>
                    <td className="py-3.5 text-[#72799c]">{d.timestamp}</td>
                    <td className="py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize border ${
                        d.status === 'confirmed'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                          : d.status === 'expired' || d.status === 'failed'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
