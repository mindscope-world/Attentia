import React, { useState } from 'react';
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
import { PACKAGE_TIERS } from '../../data/content';

export const DepositsWithdrawalsTab: React.FC = () => {
  const { 
    userProfile, 
    availableBalance, 
    pendingWithdrawal, 
    withdrawals, 
    deposits, 
    requestWithdrawal, 
    submitDeposit 
  } = useDashboard();

  const [subTab, setSubTab] = useState<'withdraw' | 'deposit' | 'ledger'>('withdraw');

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'TRC-20' | 'ERC-20' | 'POLYGON'>('TRC-20');
  const [withdrawAddress, setWithdrawAddress] = useState<string>(userProfile.walletWhitelist.trc20);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Deposit state
  const [depositTier, setDepositTier] = useState<'starter' | 'growth' | 'pro'>(userProfile.tier);
  const [depositNetwork, setDepositNetwork] = useState<'TRC-20' | 'ERC-20' | 'POLYGON'>('TRC-20');
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [simulatingDeposit, setSimulatingDeposit] = useState<boolean>(false);

  const depositAddresses = {
    'TRC-20': 'TPyM8c7h4aL89QhZk2u8vX5yNmW0eR1t3p',
    'ERC-20': '0x7A4b9e28D5b4C17983FcAf86c7104d4D8A92F4c8',
    'POLYGON': '0x3D88f219Cb0e14a7904EcB589d1b64c010A56E21',
  };

  const minWithdrawal = userProfile.tier === 'starter' ? 10 : userProfile.tier === 'growth' ? 25 : 50;
  const feeRate = userProfile.tier === 'starter' ? 0.02 : userProfile.tier === 'growth' ? 0.015 : 0.01;

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
    navigator.clipboard.writeText(depositAddresses[depositNetwork]);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleNetworkChange = (net: 'TRC-20' | 'ERC-20' | 'POLYGON') => {
    setWithdrawNetwork(net);
    if (net === 'TRC-20') setWithdrawAddress(userProfile.walletWhitelist.trc20);
    if (net === 'ERC-20') setWithdrawAddress(userProfile.walletWhitelist.erc20);
    if (net === 'POLYGON') setWithdrawAddress(userProfile.walletWhitelist.polygon);
  };

  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const val = parseFloat(withdrawAmount) || 0;
    const res = requestWithdrawal(val, withdrawNetwork, withdrawAddress);

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setWithdrawAmount('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleSimulateDeposit = () => {
    setSimulatingDeposit(true);
    const selectedPkg = PACKAGE_TIERS.find(p => p.id === depositTier);
    const amount = selectedPkg ? selectedPkg.price : 100;

    setTimeout(() => {
      submitDeposit(amount, depositNetwork, depositTier);
      setSimulatingDeposit(false);
    }, 1500);
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
                  Minimum threshold: ${minWithdrawal}.00 USDT
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
                      onClick={() => handleNetworkChange(net.id as any)}
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
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Whitelisted
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2.5 px-3 text-white text-xs font-mono focus:border-[#7c5cfc] outline-none"
                  placeholder="Enter or confirm whitelisted address"
                />
              </div>

              {/* Fee Breakdown Calculation */}
              <div className="p-4 rounded-2xl bg-[#0b0c16] border border-[#1e213d] text-xs space-y-2">
                <div className="flex justify-between text-[#8288a7]">
                  <span>{userProfile.tier.toUpperCase()} Platform Fee ({(feeRate * 100).toFixed(1)}%):</span>
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
                disabled={availableBalance < minWithdrawal}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-[#734eff]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Request Payout of ${calculateNet()} USDT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right: Active In-Flight Tracking & Conditions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Active Withdrawal Card */}
            {withdrawals.length > 0 && withdrawals[0].status !== 'completed' ? (
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
                Fund Treasury / Upgrade Package Quota
              </span>
              <p className="text-xs text-[#7e85a6]">
                Transmitting cryptocurrency to your isolated deposit address immediately adjusts your daily task quota and fee tier.
              </p>
            </div>

            {/* Package Selection */}
            <div>
              <label className="text-xs font-semibold text-[#8f96b9] block mb-2">
                Select Desired Package Quota:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PACKAGE_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setDepositTier(tier.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      depositTier === tier.id
                        ? 'bg-[#251f50] border-[#7d5efc] text-white shadow-lg'
                        : 'bg-[#0e0f1e] border-[#1f223d] text-[#71789c] hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{tier.name}</span>
                    <span className="text-base font-extrabold font-mono text-white block my-0.5">
                      ${tier.price}
                    </span>
                    <span className="text-[10px] text-[#a488ff] block">
                      {tier.activitiesPerDay} Tasks / day
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Network Selector */}
            <div>
              <label className="text-xs font-semibold text-[#8f96b9] block mb-2">
                Select Blockchain Rail:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['TRC-20', 'ERC-20', 'POLYGON'] as const).map((net) => (
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
                    <span className="text-[10px] text-[#a488ff] block">
                      {net === 'TRC-20' ? 'Lowest Fees' : net === 'ERC-20' ? 'Ethereum' : 'Fast Polygon'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Address Box */}
            <div className="p-4 rounded-2xl bg-[#0b0c16] border border-[#212440]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[#888fae]">
                  Isolated Deposit Address ({depositNetwork}):
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Validator Ready
                </span>
              </div>
              <div className="font-mono text-xs text-white break-all p-3 bg-[#141527] rounded-xl border border-[#242747] mb-3 select-all">
                {depositAddresses[depositNetwork]}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#1e203c] hover:bg-[#2b2e54] text-xs font-semibold text-white border border-[#31355c] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAddress ? 'Copied to Clipboard!' : 'Copy Deposit Address'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="py-2 px-4 rounded-lg bg-[#1e203c] hover:bg-[#2b2e54] text-xs font-semibold text-white border border-[#31355c] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#9a7ffd]" />
                  <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
                </button>
              </div>

              {showQr && (
                <div className="mt-4 p-4 bg-white rounded-2xl text-center max-w-[190px] mx-auto animate-fade-in">
                  <div className="w-32 h-32 mx-auto bg-neutral-900 flex items-center justify-center rounded-xl p-2 text-white text-[10px] font-mono text-center">
                    [QR: {depositNetwork}]
                  </div>
                  <span className="text-[10px] text-neutral-600 block mt-2 font-mono">
                    Scan via Mobile Wallet
                  </span>
                </div>
              )}
            </div>

            {/* Test Simulation Button */}
            <div className="pt-2 border-t border-[#1d203a] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-[#71789c]">
                Testing environment simulation trigger:
              </span>
              <button
                type="button"
                onClick={handleSimulateDeposit}
                disabled={simulatingDeposit}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#201c44] hover:bg-[#2e2666] border border-[#48398b] text-xs font-bold text-[#c7b4fd] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {simulatingDeposit ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying 12/12 blocks...
                  </span>
                ) : (
                  <span>Simulate Block Receipt & Credit +${depositTier === 'starter' ? 25 : depositTier === 'growth' ? 100 : 500}</span>
                )}
              </button>
            </div>
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
                  { step: '4', title: 'Instant tier quota credit', desc: 'Account balance & daily tasks quota unlocked automatically.' },
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
                    <td className="py-3.5 font-mono text-emerald-400 font-semibold">+${d.amount.toFixed(2)}</td>
                    <td className="py-3.5 text-[#72799c]">{d.timestamp}</td>
                    <td className="py-3.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold capitalize">
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
