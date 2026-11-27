import React, { useEffect, useState } from 'react';
import { AdLink, adminApi } from '../../lib/adminApi';
import { Badge, Card, Table, errMsg, fmtDate, inputCls } from './ui';
import { fmtDuration } from './AdminDiscover';

const TONES: Record<string, 'green' | 'amber' | 'red' | 'gray' | 'violet'> = {
  active: 'green', paused: 'amber', pending: 'violet', declined: 'red', removed: 'gray', completed: 'gray', expired: 'gray',
};
const STATUSES = ['pending', 'active', 'paused', 'declined', 'removed'];

export const AdminLinkLibrary: React.FC<{ notify: (m: string, e?: boolean) => void; refreshKey: number }> = ({ notify, refreshKey }) => {
  const [links, setLinks] = useState<AdLink[]>([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi
        .adLinks({ q })
        .then(setLinks)
        .catch((e) => notify(errMsg(e), true))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, refreshKey]);

  const counts = links.reduce<Record<string, number>>((m, l) => ((m[l.status] = (m[l.status] ?? 0) + 1), m), {});
  const shown = status ? links.filter((l) => l.status === status) : links;

  return (
    <Card title={`Link library (${links.length})`}>
      <p className="text-xs text-[#8e96b8] mb-4">Every ad link the platform has seen — pre-existing, added by hand or fetched. Links are kept permanently, so nothing is fetched twice.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {['', ...STATUSES].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${status === s ? 'bg-[#221c4b] text-white border-[#44358a]' : 'bg-[#161832] text-[#8e96b8] border-[#272b53] hover:text-white'}`}
          >
            {s || 'all'} {s ? counts[s] ?? 0 : links.length}
          </button>
        ))}
        <input className={`${inputCls} !w-64 ml-auto`} placeholder="Search title, channel or video ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Table head={['Ad', 'Category', 'Length', 'Status', 'Source', 'Added', 'Link']} isEmpty={!loading && shown.length === 0} empty="No links.">
        {shown.map((l) => (
          <tr key={l.id}>
            <td className="py-2.5 pr-4 max-w-xs">
              <div className="font-semibold text-white truncate" title={l.title ?? ''}>{l.title ?? l.youtube_id}</div>
              <div className="text-[#71789c] truncate">{l.channel_title}</div>
            </td>
            <td className="pr-4">{l.category ?? '—'}</td>
            <td className="pr-4 font-mono">{fmtDuration(l.duration_seconds)}</td>
            <td className="pr-4"><Badge tone={TONES[l.status] ?? 'gray'}>{l.status}</Badge></td>
            <td className="pr-4">{l.source}</td>
            <td className="pr-4 whitespace-nowrap">{fmtDate(l.created_at)}</td>
            <td><a href={l.url} target="_blank" rel="noreferrer" className="underline text-[#a488ff] hover:text-white">Open ↗</a></td>
          </tr>
        ))}
      </Table>
    </Card>
  );
};
