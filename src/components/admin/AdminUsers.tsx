import React, { useCallback, useEffect, useState } from 'react';
import { AdminUser, AdminUserDetail, adminApi } from '../../lib/adminApi';
import { Role } from '../../lib/api';
import { Badge, Btn, Card, Field, Table, errMsg, fmtDate, fmtMoney, inputCls } from './ui';

interface Props {
  currentUserId: string;
  notify: (msg: string, error?: boolean) => void;
}

export const AdminUsers: React.FC<Props> = ({ currentUserId, notify }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [bannedOnly, setBannedOnly] = useState(false);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .users({ q, role, banned: bannedOnly ? true : undefined })
      .then(setUsers)
      .catch((e) => notify(errMsg(e), true))
      .finally(() => setLoading(false));
  }, [q, role, bannedOnly]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const open = (id: string) => adminApi.userDetail(id).then(setDetail).catch((e) => notify(errMsg(e), true));
  const refreshAll = (id: string) => {
    load();
    return open(id);
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <Field label="Search" className="flex-1 min-w-[200px]">
            <input className={inputCls} placeholder="Email, username or user ID" value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
          <Field label="Role">
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All</option>
              <option value="participant">Participant</option>
              <option value="advertiser">Advertiser</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-xs text-[#aab1d3] pb-2 cursor-pointer">
            <input type="checkbox" checked={bannedOnly} onChange={(e) => setBannedOnly(e.target.checked)} /> Banned only
          </label>
        </div>
        <Table head={['User', 'Role', 'KYC', 'Balance', 'Status', 'Joined', '']} isEmpty={!loading && users.length === 0} empty="No users match.">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-[#13152b]">
              <td className="py-2.5 pr-4">
                <div className="font-semibold text-white">{u.username}</div>
                <div className="text-[#71789c]">{u.email}</div>
              </td>
              <td className="pr-4">
                <Badge tone={u.role === 'admin' ? 'violet' : 'gray'}>{u.role}</Badge>
              </td>
              <td className="pr-4">
                <Badge tone={u.kyc_status === 'verified' ? 'green' : u.kyc_status === 'rejected' ? 'red' : 'gray'}>{u.kyc_status}</Badge>
              </td>
              <td className="pr-4 font-mono">{fmtMoney(u.available)}</td>
              <td className="pr-4">{u.is_active ? <Badge tone="green">active</Badge> : <Badge tone="red">banned</Badge>}</td>
              <td className="pr-4 whitespace-nowrap">{fmtDate(u.created_at)}</td>
              <td className="text-right">
                <Btn onClick={() => open(u.id)}>Manage</Btn>
              </td>
            </tr>
          ))}
        </Table>
        {loading && <p className="text-[#71789c] text-xs mt-3">Loading…</p>}
      </Card>

      {detail && (
        <UserPanel
          key={detail.user.id}
          detail={detail}
          isSelf={detail.user.id === currentUserId}
          notify={notify}
          onChanged={() => refreshAll(detail.user.id)}
          onClose={() => setDetail(null)}
          setDetail={setDetail}
        />
      )}
    </div>
  );
};

const UserPanel: React.FC<{
  detail: AdminUserDetail;
  isSelf: boolean;
  notify: Props['notify'];
  onChanged: () => void;
  onClose: () => void;
  setDetail: (d: AdminUserDetail) => void;
}> = ({ detail, isSelf, notify, onChanged, onClose, setDetail }) => {
  const u = detail.user;
  const [banReason, setBanReason] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      notify(ok);
      onChanged();
    } catch (e) {
      notify(errMsg(e), true);
    } finally {
      setBusy(false);
    }
  };

  const adjust = async (sign: 1 | -1) => {
    const n = Number(amount);
    if (!n || n <= 0) return notify('Enter an amount greater than zero.', true);
    setBusy(true);
    try {
      const d = await adminApi.adjust(u.id, (sign * n).toFixed(2), reason);
      setDetail(d);
      setAmount('');
      setReason('');
      notify(`${sign > 0 ? 'Credited' : 'Debited'} ${fmtMoney(n)}.`);
      onChanged();
    } catch (e) {
      notify(errMsg(e), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={`${u.username} · ${u.email}`}
      action={
        <Btn onClick={onClose} aria-label="Close user panel">
          Close
        </Btn>
      }
    >
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase font-mono font-bold text-[#71789c]">Account</h3>
          <Field label="Role">
            <select
              className={inputCls}
              value={u.role}
              disabled={busy || isSelf}
              onChange={(e) => run(() => adminApi.updateUser(u.id, { role: e.target.value as Role }), 'Role updated.')}
            >
              <option value="participant">Participant</option>
              <option value="advertiser">Advertiser</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="KYC status">
            <select
              className={inputCls}
              value={u.kyc_status}
              disabled={busy}
              onChange={(e) => run(() => adminApi.updateUser(u.id, { kyc_status: e.target.value as AdminUser['kyc_status'] }), 'KYC updated.')}
            >
              {['none', 'pending', 'verified', 'rejected'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-[#8e96b8]">
            {detail.verified_tasks} verified tasks · {detail.withdrawals_pending} pending withdrawals
          </p>

          {u.is_active ? (
            <div className="space-y-2">
              <Field label="Ban account">
                <input className={inputCls} placeholder="Reason (required)" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
              </Field>
              <Btn
                variant="danger"
                disabled={busy || isSelf || banReason.trim().length < 3}
                onClick={() => run(() => adminApi.ban(u.id, banReason.trim()), 'Account banned.')}
              >
                {isSelf ? 'Cannot ban yourself' : 'Ban account'}
              </Btn>
              <p className="text-[10px] text-[#71789c]">Banned users are signed out immediately and cannot log in. Admins must be demoted first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-300">
                Banned {fmtDate(u.banned_at)}: {u.ban_reason}
              </p>
              <Btn variant="primary" disabled={busy} onClick={() => run(() => adminApi.unban(u.id), 'Account restored.')}>
                Unban account
              </Btn>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] uppercase font-mono font-bold text-[#71789c]">Funds</h3>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Available', detail.balances.rewards],
              ['Pending withdrawal', detail.balances.pending_withdrawal],
              ['Withdrawn', detail.balances.withdrawn],
              ['Deposits', detail.balances.deposits],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-[#0b0c1c] border border-[#1f223f] p-2.5">
                <dt className="text-[10px] text-[#71789c]">{k}</dt>
                <dd className="font-mono font-bold text-white">{fmtMoney(v)}</dd>
              </div>
            ))}
          </dl>
          <Field label="Adjust available balance">
            <input className={inputCls} type="number" min="0" step="0.01" placeholder="Amount (USDT)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <input className={inputCls} placeholder="Reason (recorded in ledger)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Btn variant="primary" disabled={busy || reason.trim().length < 3} onClick={() => adjust(1)}>
              Credit
            </Btn>
            <Btn variant="danger" disabled={busy || reason.trim().length < 3} onClick={() => adjust(-1)}>
              Debit
            </Btn>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] uppercase font-mono font-bold text-[#71789c] mb-3">Recent ledger</h3>
          <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {detail.recent_ledger.length === 0 && <li className="text-xs text-[#71789c]">No entries.</li>}
            {detail.recent_ledger.map((e) => (
              <li key={e.id} className="text-[11px] rounded-lg bg-[#0b0c1c] border border-[#1f223f] px-2.5 py-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-[#aab1d3]">
                    {e.entry_type} · {e.account}
                  </span>
                  <span className={Number(e.amount) < 0 ? 'text-red-300' : 'text-emerald-300'}>{Number(e.amount).toFixed(2)}</span>
                </div>
                <div className="text-[#71789c] truncate" title={e.description ?? ''}>
                  {fmtDate(e.created_at)} {e.description && `· ${e.description}`}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};
