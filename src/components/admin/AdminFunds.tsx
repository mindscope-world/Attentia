import React, { useCallback, useEffect, useState } from 'react';
import { AdminDeposit, AdminUser, AdminWithdrawal, adminApi } from '../../lib/adminApi';
import { Badge, Btn, Card, Table, errMsg, fmtDate, fmtMoney, inputCls } from './ui';

export const AdminFunds: React.FC<{ notify: (msg: string, error?: boolean) => void }> = ({ notify }) => {
  const [filter, setFilter] = useState<'requested' | 'completed' | 'rejected' | ''>('requested');
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [action, setAction] = useState<{ id: string; kind: 'approve' | 'reject' } | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([adminApi.withdrawals(filter || undefined), adminApi.deposits(), adminApi.users()])
      .then(([w, d, u]) => {
        setWithdrawals(w);
        setDeposits(d);
        setNames(Object.fromEntries(u.map((x: AdminUser) => [x.id, x.username])));
      })
      .catch((e) => notify(errMsg(e), true));
  }, [filter]);

  useEffect(load, [load]);

  const who = (id: string) => names[id] ?? id.slice(0, 8);

  const submit = async () => {
    if (!action) return;
    setBusy(true);
    try {
      if (action.kind === 'approve') await adminApi.approveWithdrawal(action.id, text.trim());
      else await adminApi.rejectWithdrawal(action.id, text.trim());
      notify(action.kind === 'approve' ? 'Withdrawal approved.' : 'Withdrawal rejected and funds returned.');
      setAction(null);
      setText('');
      load();
    } catch (e) {
      notify(errMsg(e), true);
    } finally {
      setBusy(false);
    }
  };

  const tone = (s: string) => (s === 'completed' || s === 'confirmed' ? 'green' : s === 'rejected' || s === 'failed' || s === 'expired' ? 'red' : 'amber');

  return (
    <div className="space-y-5">
      <Card
        title="Withdrawals"
        action={
          <select className={`${inputCls} !w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="requested">Awaiting review</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        }
      >
        <Table head={['User', 'Amount', 'Net', 'Destination', 'Status', 'Requested', '']} isEmpty={withdrawals.length === 0} empty="No withdrawals.">
          {withdrawals.map((w) => (
            <React.Fragment key={w.id}>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">{who(w.user_id)}</td>
                <td className="pr-4 font-mono">{fmtMoney(w.amount)}</td>
                <td className="pr-4 font-mono">{fmtMoney(w.net_amount)}</td>
                <td className="pr-4 font-mono">
                  <span className="text-[#71789c]">{w.network}</span> {w.address.slice(0, 10)}…{w.address.slice(-6)}
                </td>
                <td className="pr-4">
                  <Badge tone={tone(w.status)}>{w.status}</Badge>
                </td>
                <td className="pr-4 whitespace-nowrap">{fmtDate(w.created_at)}</td>
                <td className="text-right whitespace-nowrap">
                  {w.status === 'requested' && (
                    <div className="flex gap-2 justify-end">
                      <Btn variant="primary" onClick={() => { setAction({ id: w.id, kind: 'approve' }); setText(''); }}>
                        Approve
                      </Btn>
                      <Btn variant="danger" onClick={() => { setAction({ id: w.id, kind: 'reject' }); setText(''); }}>
                        Reject
                      </Btn>
                    </div>
                  )}
                </td>
              </tr>
              {action?.id === w.id && (
                <tr>
                  <td colSpan={7} className="py-3">
                    <div className="flex gap-2 items-center">
                      <input
                        autoFocus
                        className={inputCls}
                        placeholder={action.kind === 'approve' ? 'Payout transaction hash' : 'Rejection reason'}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                      <Btn
                        variant={action.kind === 'approve' ? 'primary' : 'danger'}
                        disabled={busy || text.trim().length < (action.kind === 'approve' ? 8 : 3)}
                        onClick={submit}
                      >
                        Confirm {action.kind}
                      </Btn>
                      <Btn onClick={() => setAction(null)}>Cancel</Btn>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </Table>
      </Card>

      <Card title="Deposits">
        <Table head={['User', 'Network', 'Expected', 'Received', 'Status', 'Created']} isEmpty={deposits.length === 0} empty="No deposits.">
          {deposits.map((d) => (
            <tr key={d.id}>
              <td className="py-2.5 pr-4 font-semibold text-white">{who(d.user_id)}</td>
              <td className="pr-4">
                {d.network} <span className="text-[#71789c]">{d.asset}</span>
              </td>
              <td className="pr-4 font-mono">{fmtMoney(d.expected_amount)}</td>
              <td className="pr-4 font-mono">{d.received_amount ? fmtMoney(d.received_amount) : '—'}</td>
              <td className="pr-4">
                <Badge tone={tone(d.status)}>{d.status.replace('_', ' ')}</Badge>
              </td>
              <td className="whitespace-nowrap">{fmtDate(d.created_at)}</td>
            </tr>
          ))}
        </Table>
        <p className="text-[10px] text-[#71789c] mt-3">To credit or debit a balance manually, open the user under Users → Manage.</p>
      </Card>
    </div>
  );
};
