import React, { useState } from 'react';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Copy, 
  Check, 
  QrCode, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const DepositsAndWithdrawalsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  
  // Deposit Mockup State
  const [depositNetwork, setDepositNetwork] = useState<'TRC20' | 'ERC20' | 'POLYGON'>('TRC20');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Withdrawal Mockup State
  const [withdrawAmount, setWithdrawAmount] = useState('100');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('TRC20');
  const [withdrawSubmitted, setWithdrawSubmitted] = useState(false);
  const [withdrawStage, setWithdrawStage] = useState<1 | 2 | 3>(2);

  const depositAddresses = {
    TRC20: 'TPyM8c7h4aL89QhZk2u8vX5yNmW0eR1t3p',
    ERC20: '0x7A4b9e28D5b4C17983FcAf86c7104d4D8A92F4c8',
    POLYGON: '0x3D88f219Cb0e14a7904EcB589d1b64c010A56E21',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddresses[depositNetwork]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateFee = () => {
    const num = parseFloat(withdrawAmount) || 0;
    return (num * 0.015).toFixed(2); // 1.5% average
  };

  const calculateNet = () => {
    const num = parseFloat(withdrawAmount) || 0;
    const fee = parseFloat(calculateFee());
    return Math.max(0, num - fee).toFixed(2);
  };

  return (
    <section id="deposit-withdraw" className="py-20 md:py-28 bg-[#0b0c17] border-t border-[#1a1c36] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1738] border border-[#3b316d] text-[#d0c2ff] text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Treasury & Settlement</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-4">
            Deposits & Withdrawals
          </h2>

          <p className="text-base sm:text-lg text-[#9da2c2] leading-relaxed">
            High-speed on-chain settlements. Every transaction is verifiable on public block explorers with clear networks and zero ambiguous conditions.
          </p>

          {/* Toggle Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-[#141528] border border-[#25284b]">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'deposit'
                  ? 'bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] text-white shadow-md shadow-[#734eff]/30'
                  : 'text-[#848ba8] hover:text-white'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Fund Account (Deposit)</span>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'withdraw'
                  ? 'bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] text-white shadow-md shadow-[#734eff]/30'
                  : 'text-[#848ba8] hover:text-white'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Withdraw When Eligible</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Deposit Experience */}
        {activeTab === 'deposit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: 5-Step Flow Explanation */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl bg-[#131427] border border-[#26284a] p-6 sm:p-8">
                <h3 className="text-xl font-bold text-white mb-2">Fund Your Account Securely</h3>
                <p className="text-xs text-[#8f96b9] leading-relaxed mb-6">
                  Experience seamless blockchain on-ramping with automated multi-network confirmation.
                </p>

                {/* 5-Step Flow Diagram requested in prompt */}
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Select package', desc: 'Choose Starter ($25), Growth ($100), or Pro ($500).' },
                    { step: '2', title: 'Receive payment address', desc: 'Generate an isolated deposit address for your selected network.' },
                    { step: '3', title: 'Send cryptocurrency', desc: 'Transmit funds from your preferred wallet or exchange.' },
                    { step: '4', title: 'Blockchain confirmation', desc: 'Validators confirm the block receipt (12 network confirmations).' },
                    { step: '5', title: 'Account status updated', desc: 'Your tier and daily task quota unlock automatically.' },
                  ].map((item, idx) => (
                    <div key={item.step} className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-[#202242] text-[#c6b4fd] font-bold text-xs flex items-center justify-center shrink-0 border border-[#343864]">
                        {item.step}
                      </div>
                      <div className="pt-0.5">
                        <span className="text-xs font-semibold text-white block">{item.title}</span>
                        <span className="text-[11px] text-[#787f9e]">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crucial Network Safety Note */}
              <div className="p-4 rounded-2xl bg-[#181525] border border-[#3d2e1b] flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-[#b8a994] leading-relaxed">
                  <strong className="text-amber-300 font-semibold">Unmistakable Network Identification:</strong> A frequent crypto pitfall is sending tokens to the wrong chain. Always verify that your sending wallet network strictly matches the selected receiving network (TRC-20 vs ERC-20).
                </div>
              </div>
            </div>

            {/* Right: Realistic Deposit UI Mockup */}
            <div className="lg:col-span-6 rounded-3xl bg-[#131427] border-2 border-[#2b2e52] p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#222543] mb-6">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Deposit Gateway Preview
                  </span>
                  <span className="text-[11px] text-[#71789c]">Live interactive simulation</span>
                </div>
                <span className="text-xs font-semibold text-[#a88cff] bg-[#221c47] px-2.5 py-1 rounded border border-[#3f327a]">
                  Package: Growth ($100)
                </span>
              </div>

              {/* Network Selector with Visual Emphasis */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-[#8f96b9] block mb-2">
                  Select Blockchain Network & Asset:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TRC20', label: 'USDT (TRC-20)', speed: '~2 mins', tag: 'Lowest Fees' },
                    { id: 'ERC20', label: 'USDT (ERC-20)', speed: '~8 mins', tag: 'Ethereum' },
                    { id: 'POLYGON', label: 'USDC (Polygon)', speed: '~3 mins', tag: 'Fast' },
                  ].map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setDepositNetwork(net.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        depositNetwork === net.id
                          ? 'bg-[#231e4e] border-[#7d5dfc] text-white shadow-md'
                          : 'bg-[#0f1021] border-[#222440] text-[#7b81a1] hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{net.label}</span>
                      <span className="text-[10px] text-[#a488ff] block">{net.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Address Box */}
              <div className="p-4 rounded-2xl bg-[#0b0c16] border border-[#222544] mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#8a91b4]">
                    Payment Address ({depositNetwork}):
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Network Active
                  </span>
                </div>
                <div className="font-mono text-xs text-white break-all p-2.5 bg-[#141527] rounded-lg border border-[#272a4c] mb-3 select-all">
                  {depositAddresses[depositNetwork]}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#1e203c] hover:bg-[#2b2e54] text-xs font-semibold text-white border border-[#31355c] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Address Copied!' : 'Copy Address'}</span>
                  </button>
                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="py-2 px-4 rounded-lg bg-[#1e203c] hover:bg-[#2b2e54] text-xs font-semibold text-white border border-[#31355c] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#9a7ffd]" />
                    <span>{showQr ? 'Hide QR' : 'QR Code'}</span>
                  </button>
                </div>

                {/* QR Code expansion mockup */}
                {showQr && (
                  <div className="mt-4 p-4 bg-white rounded-xl text-black text-center max-w-[180px] mx-auto">
                    <div className="w-32 h-32 mx-auto bg-neutral-900 flex items-center justify-center rounded-lg p-2 text-white text-[10px] font-mono text-center">
                      [QR Code: {depositNetwork}]
                    </div>
                    <span className="text-[10px] text-neutral-600 block mt-2 font-mono">
                      Scan via Crypto Wallet
                    </span>
                  </div>
                )}
              </div>

              {/* Amount & Real-Time Blockchain Confirmation Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#0f1021] border border-[#1f213c]">
                  <span className="text-[#888ea8]">Required Amount:</span>
                  <span className="font-extrabold text-white font-mono text-sm">$100.00 USDT</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#101924] border border-[#1b344a] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                    <div>
                      <span className="text-xs font-semibold text-sky-300 block">
                        Waiting for blockchain confirmation...
                      </span>
                      <span className="text-[10px] text-sky-400/80">
                        12 of 12 block confirmations required
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-sky-400 font-bold">12 / 12</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Withdrawal Experience */}
        {activeTab === 'withdraw' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Withdrawal Conditions Breakdown */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl bg-[#131427] border border-[#26284a] p-6 sm:p-8">
                <h3 className="text-xl font-bold text-white mb-2">Withdraw When Eligible</h3>
                <p className="text-xs text-[#8f96b9] leading-relaxed mb-6">
                  Full control over your earned capital. Review the exact, honest parameters for all outbound transfers:
                </p>

                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1e203b]">
                    <span className="text-xs font-bold text-white block mb-0.5">
                      1. Minimum Withdrawal Amount
                    </span>
                    <p className="text-[11px] text-[#8187a8]">
                      $10.00 for Starter, $25.00 for Growth, and $50.00 for Pro tier accounts.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1e203b]">
                    <span className="text-xs font-bold text-white block mb-0.5">
                      2. Automated Processing Time
                    </span>
                    <p className="text-[11px] text-[#8187a8]">
                      Batch dispatches run automatically every 1 to 4 hours for Pro, up to 12 hours for Starter/Growth.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1e203b]">
                    <span className="text-xs font-bold text-white block mb-0.5">
                      3. Supported Assets & Networks
                    </span>
                    <p className="text-[11px] text-[#8187a8]">
                      USDT (TRC-20, ERC-20) and USDC (Polygon PoS). Dollar-pegged stability at all times.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1e203b]">
                    <span className="text-xs font-bold text-white block mb-0.5">
                      4. Transparent Processing Fees
                    </span>
                    <p className="text-[11px] text-[#8187a8]">
                      Starter: 2.0%, Growth: 1.5%, Pro: 1.0% plus standard network gas fee (typically &lt; $1 on TRC20).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0f1020] border border-[#1e203b]">
                    <span className="text-xs font-bold text-white block mb-0.5">
                      5. Verification & Security Checks
                    </span>
                    <p className="text-[11px] text-[#8187a8]">
                      Two-factor authentication (2FA) and task authenticity verification required to prevent bot abuse.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Withdrawal Form & Status Component */}
            <div className="lg:col-span-6 rounded-3xl bg-[#131427] border-2 border-[#2b2e52] p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#222543] mb-6">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Withdraw Funds Form Preview
                  </span>
                  <span className="text-[11px] text-[#71789c]">Member interface preview</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7e85a6] block">Available to Withdraw:</span>
                  <span className="text-base font-extrabold text-white font-mono">$245.80</span>
                </div>
              </div>

              {!withdrawSubmitted ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#8f96b9] block mb-1">
                      Withdrawal Amount (USDT):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2.5 pl-8 pr-16 text-white text-sm font-mono focus:border-[#7c5cfc] outline-none"
                      />
                      <button
                        onClick={() => setWithdrawAmount('245.80')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#a48aff] bg-[#1e1a3d] px-2 py-1 rounded"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8f96b9] block mb-1">
                      Destination Wallet Address:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TPyM8c7h4aL89QhZk2u8vX5yNmW0e..."
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2.5 px-3 text-white text-xs font-mono focus:border-[#7c5cfc] outline-none placeholder:text-[#4f5573]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8f96b9] block mb-1">
                      Payout Network:
                    </label>
                    <select
                      value={withdrawNetwork}
                      onChange={(e) => setWithdrawNetwork(e.target.value)}
                      className="w-full bg-[#0b0c16] border border-[#242747] rounded-xl py-2.5 px-3 text-white text-xs focus:border-[#7c5cfc] outline-none cursor-pointer"
                    >
                      <option value="TRC20">USDT (TRON TRC-20) — ~2 min settlement</option>
                      <option value="ERC20">USDT (Ethereum ERC-20) — ~10 min settlement</option>
                      <option value="POLYGON">USDC (Polygon PoS) — ~3 min settlement</option>
                    </select>
                  </div>

                  {/* Fee Calculation Box */}
                  <div className="p-3.5 rounded-xl bg-[#0f1021] border border-[#1e213d] text-xs space-y-1.5">
                    <div className="flex justify-between text-[#8288a7]">
                      <span>Platform Fee (1.5%):</span>
                      <span className="font-mono text-white">${calculateFee()}</span>
                    </div>
                    <div className="flex justify-between text-[#8288a7]">
                      <span>Estimated Network Gas:</span>
                      <span className="font-mono text-emerald-400">Included ($0.00)</span>
                    </div>
                    <div className="flex justify-between font-bold text-white pt-1.5 border-t border-[#20223f]">
                      <span>Estimated Net Payout:</span>
                      <span className="font-mono text-emerald-400">${calculateNet()} USDT</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setWithdrawSubmitted(true)}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#6944f6] to-[#8f6dff] hover:from-[#7752fc] hover:to-[#9f80ff] text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-[#734eff]/30 cursor-pointer"
                  >
                    Request Withdrawal (${calculateNet()} USDT)
                  </button>
                </div>
              ) : (
                /* Status Component preview requested in prompt */
                <div className="space-y-6 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-[#111326] border border-[#2b2e52]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Withdrawal Status
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        TX #WTH-99428
                      </span>
                    </div>

                    {/* Step Progression List requested by user */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-white font-medium">Request submitted</span>
                        <span className="text-[10px] text-[#6b7294] ml-auto">04:12:08 UTC</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                        <span className="text-white font-medium">Automated anti-fraud verification</span>
                        <span className="text-[10px] text-sky-400 ml-auto">In Progress</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs opacity-50">
                        <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                        <span className="text-[#8e94b8]">Dispatched to {withdrawNetwork} ledger</span>
                        <span className="text-[10px] text-[#6b7294] ml-auto">Queued</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setWithdrawSubmitted(false)}
                    className="w-full py-2.5 rounded-xl bg-[#1b1c35] text-xs font-semibold text-[#a4abcb] hover:text-white transition-colors border border-[#26284a]"
                  >
                    Reset Simulation Form
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
