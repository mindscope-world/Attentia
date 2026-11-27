import React, { useEffect, useState } from 'react';
import { AdDefaults, AdLink, adminApi } from '../../lib/adminApi';
import { ApiError } from '../../lib/api';
import { Badge, Btn, Card, Field, errMsg, inputCls } from './ui';

type Notify = (msg: string, error?: boolean) => void;

export const fmtDuration = (s: number | null) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);

export const AdminDiscover: React.FC<{ notify: Notify; onChanged: () => void }> = ({ notify, onChanged }) => {
  const [queue, setQueue] = useState<AdLink[]>([]);
  const [fetching, setFetching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<AdDefaults>({ reward_rate: '0.50', budget_total: '100', is_demo: true });
  const [confirm, setConfirm] = useState<{ id: string; message: string } | null>(null);

  const loadQueue = () =>
    adminApi
      .adLinks({ status: 'pending' })
      .then(setQueue)
      .catch((e) => notify(errMsg(e), true));
  useEffect(() => {
    loadQueue();
  }, []);

  const fetchMore = async () => {
    setFetching(true);
    try {
      const res = await adminApi.fetchAds(20);
      notify(res.added >= 20 ? `Fetched ${res.added} new ads.` : `Only ${res.added} new ads found; try again for more.`, res.added === 0);
      await loadQueue();
      onChanged();
    } catch (e) {
      notify(errMsg(e), true);
    } finally {
      setFetching(false);
    }
  };

  const decide = async (link: AdLink, kind: 'approve' | 'pause' | 'decline', force = false) => {
    setBusy(link.id);
    try {
      if (kind === 'approve') await adminApi.approveLink(link.id, defaults);
      else if (kind === 'pause') await adminApi.pauseLink(link.id, defaults);
      else await adminApi.declineLink(link.id, force);
      setQueue((q) => q.filter((x) => x.id !== link.id));
      setConfirm(null);
      if (playing === link.id) setPlaying(null);
      notify(kind === 'approve' ? 'Approved and live.' : kind === 'pause' ? 'Saved as hidden (paused).' : 'Declined and removed.');
      onChanged();
    } catch (e) {
      if (kind === 'decline' && e instanceof ApiError && e.status === 409 && !force) setConfirm({ id: link.id, message: e.message });
      else notify(errMsg(e), true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card
        title="Discover ads"
        action={
          <Btn variant="primary" onClick={fetchMore} disabled={fetching}>
            {fetching ? 'Fetching…' : 'Fetch 20 new ads'}
          </Btn>
        }
      >
        <p className="text-xs text-[#8e96b8] mb-4">
          Searches YouTube for embeddable commercials across several industries, skips every link already stored, and queues the rest for your decision.
          <b className="text-[#c4c9e2]"> Approve</b> publishes it, <b className="text-[#c4c9e2]">Pause</b> keeps it hidden to show later, <b className="text-[#c4c9e2]">Decline</b> removes it
          completely (the link stays in the library so it's never fetched again).
        </p>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Reward per view (USDT)">
            <input className={inputCls} type="number" min="0.01" step="0.01" value={defaults.reward_rate} onChange={(e) => setDefaults({ ...defaults, reward_rate: e.target.value })} />
          </Field>
          <Field label="Budget per approved ad (USDT)">
            <input className={inputCls} type="number" min="1" step="0.01" value={defaults.budget_total} onChange={(e) => setDefaults({ ...defaults, budget_total: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-xs text-[#aab1d3] pb-2 cursor-pointer">
            <input type="checkbox" checked={defaults.is_demo} onChange={(e) => setDefaults({ ...defaults, is_demo: e.target.checked })} /> Mark as demonstration content
          </label>
        </div>
      </Card>

      <Card title={`Review queue (${queue.length})`}>
        {queue.length === 0 && <p className="py-8 text-center text-xs text-[#71789c]">Nothing waiting. Click “Fetch 20 new ads”.</p>}
        <div className="grid md:grid-cols-2 gap-4">
          {queue.map((l) => (
            <article key={l.id} className="rounded-2xl bg-[#0b0c1c] border border-[#1f223f] overflow-hidden">
              <div className="aspect-video bg-black relative">
                {playing === l.id ? (
                  <iframe className="w-full h-full" src={`${l.embed_url}?autoplay=1&rel=0&playsinline=1`} title={l.title ?? 'Ad preview'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : (
                  <button onClick={() => setPlaying(l.id)} className="group w-full h-full cursor-pointer" aria-label={`Preview ${l.title ?? 'ad'}`}>
                    {l.thumbnail_url && <img src={l.thumbnail_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 text-white text-xs font-bold">▶ Preview</span>
                  </button>
                )}
              </div>
              <div className="p-3 space-y-2">
                <h3 className="text-xs font-bold text-white line-clamp-2" title={l.title ?? ''}>{l.title}</h3>
                <p className="text-[11px] text-[#71789c] flex flex-wrap items-center gap-2">
                  <span>{l.channel_title}</span>
                  <Badge tone="violet">{l.category}</Badge>
                  <span className="font-mono">{fmtDuration(l.duration_seconds)}</span>
                  <a href={l.url} target="_blank" rel="noreferrer" className="underline hover:text-white">YouTube ↗</a>
                </p>
                {confirm?.id === l.id ? (
                  <div className="rounded-xl bg-red-950/30 border border-red-700/40 p-2 text-[11px] text-red-200 space-y-2">
                    <p>{confirm.message}</p>
                    <div className="flex gap-2">
                      <Btn variant="danger" onClick={() => decide(l, 'decline', true)}>Delete with history</Btn>
                      <Btn onClick={() => setConfirm(null)}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Btn variant="primary" disabled={busy === l.id} onClick={() => decide(l, 'approve')}>Approve</Btn>
                    <Btn disabled={busy === l.id} onClick={() => decide(l, 'pause')}>Pause</Btn>
                    <Btn variant="danger" disabled={busy === l.id} onClick={() => decide(l, 'decline')}>Decline</Btn>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
};
