import React, { useCallback, useEffect, useState } from 'react';
import { AdminCampaign, adminApi } from '../../lib/adminApi';
import { ApiAsset, ApiError } from '../../lib/api';
import { Badge, Btn, Card, Field, Table, errMsg, fmtMoney, inputCls } from './ui';

/** Plays the creative exactly as stored, with normal controls. It never records a view or pays a reward. */
const PreviewModal: React.FC<{ ad: AdminCampaign; onClose: () => void }> = ({ ad, onClose }) => {
  const [asset, setAsset] = useState<ApiAsset | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ad.asset_id) return setError('This ad has no creative attached.');
    adminApi.asset(ad.asset_id).then(setAsset).catch((e) => setError(errMsg(e)));
  }, [ad.asset_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Preview of ${ad.name}`}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#101224] border border-[#202341] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-white">{ad.name}</h2>
            <p className="text-xs text-[#71789c]">{ad.brand} · {ad.category}</p>
          </div>
          <Btn onClick={onClose}>Close</Btn>
        </div>

        <div className="aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
          {error && <p className="text-xs text-red-300 px-4 text-center">{error}</p>}
          {!error && !asset && <p className="text-xs text-[#71789c]">Loading…</p>}
          {asset?.kind === 'youtube' && asset.embed_url && (
            <iframe
              className="w-full h-full"
              src={`${asset.embed_url}?rel=0&playsinline=1`}
              title={`Preview of ${ad.name}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          )}
          {asset?.kind === 'video' && asset.media_url && <video className="w-full h-full" src={asset.media_url} controls />}
          {asset?.kind === 'image' && asset.media_url && <img className="w-full h-full object-contain" src={asset.media_url} alt={ad.name} />}
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <p className="text-[#c4c9e2]">{ad.description}</p>
          <div className="rounded-2xl bg-[#0b0c1c] border border-[#1f223f] p-3 space-y-2">
            <p className="text-[10px] uppercase font-mono font-bold text-[#71789c]">What the viewer is asked</p>
            <p className="text-[#aab1d3]">{ad.rating_prompt}</p>
            <p className="font-semibold text-white">{ad.question}</p>
            <ul className="flex flex-wrap gap-2">
              {ad.options.map((o) => (
                <li key={o} className={`px-2.5 py-1 rounded-full border ${o === ad.correct_option ? 'border-emerald-700/60 text-emerald-300' : 'border-[#272b53] text-[#aab1d3]'}`}>
                  {o}{o === ad.correct_option && ' ✓'}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[#71789c]">
            Reward {fmtMoney(ad.reward_rate)} per view · must watch {Math.round(ad.min_watch_pct * 100)}% · status {ad.status === 'paused' ? 'hidden' : ad.status}
          </p>
          <p className="text-[10px] text-[#71789c]">Preview only: viewing here does not count as a task and pays no reward.</p>
        </div>
      </div>
    </div>
  );
};

const EMPTY = {
  url: '',
  duration: '',
  name: '',
  brand: '',
  category: 'Technology',
  description: '',
  rewardRate: '0.50',
  budget: '100',
  question: 'What was this ad promoting?',
  options: '',
  isDemo: false,
};

export const AdminLiveAds: React.FC<{ notify: (msg: string, error?: boolean) => void }> = ({ notify }) => {
  const [ads, setAds] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<AdminCampaign | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; message?: string; force: boolean } | null>(null);

  const load = useCallback(() => {
    adminApi
      .campaigns()
      .then(setAds)
      .catch((e) => notify(errMsg(e), true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const options = form.options.split(',').map((o) => o.trim()).filter(Boolean);
  const missing = [
    !form.url.trim() && 'YouTube URL',
    !form.name.trim() && 'ad name',
    !form.brand.trim() && 'brand',
    !form.description.trim() && 'description',
    !form.question.trim() && 'viewer question',
    options.length < 2 && 'at least 2 answer options (comma separated)',
  ].filter(Boolean) as string[];
  const valid = missing.length === 0;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createAd({
        url: form.url.trim(),
        durationSeconds: form.duration ? Number(form.duration) : undefined,
        name: form.name,
        brand: form.brand,
        category: form.category,
        description: form.description,
        rewardRate: form.rewardRate,
        budget: form.budget,
        question: form.question,
        options,
        isDemo: form.isDemo,
      });
      notify('Ad published.');
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      notify(errMsg(err), true);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (a: AdminCampaign) => {
    try {
      await adminApi.setCampaignStatus(a.id, a.status === 'active' ? 'paused' : 'active');
      notify(a.status === 'active' ? 'Ad hidden from users.' : 'Ad is visible again.');
      load();
    } catch (e) {
      notify(errMsg(e), true);
    }
  };

  const remove = async (id: string, force: boolean) => {
    try {
      await adminApi.deleteCampaign(id, force);
      notify('Ad deleted.');
      setConfirm(null);
      load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && !force) setConfirm({ id, message: e.message, force: true });
      else {
        notify(errMsg(e), true);
        setConfirm(null);
      }
    }
  };

  const tone = (s: string) => (s === 'active' ? 'green' : s === 'paused' ? 'amber' : s === 'draft' ? 'gray' : 'red');

  return (
    <div className="space-y-5">
      {preview && <PreviewModal ad={preview} onClose={() => setPreview(null)} />}
      <Card
        title="Ads"
        action={
          <Btn variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New ad'}
          </Btn>
        }
      >
        {showForm && (
          <form onSubmit={create} className="grid sm:grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-[#0b0c1c] border border-[#1f223f]">
            <Field label="YouTube URL" className="sm:col-span-2">
              <input className={inputCls} required placeholder="https://www.youtube.com/watch?v=…" value={form.url} onChange={set('url')} />
            </Field>
            <Field label="Ad name">
              <input className={inputCls} required value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Brand">
              <input className={inputCls} required value={form.brand} onChange={set('brand')} />
            </Field>
            <Field label="Category">
              <input className={inputCls} required value={form.category} onChange={set('category')} />
            </Field>
            <Field label="Video length (seconds, if API key not set)">
              <input className={inputCls} type="number" min="1" value={form.duration} onChange={set('duration')} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea className={inputCls} required rows={2} value={form.description} onChange={set('description')} />
            </Field>
            <Field label="Reward rate (USDT per view)">
              <input className={inputCls} type="number" min="0.01" step="0.01" required value={form.rewardRate} onChange={set('rewardRate')} />
            </Field>
            <Field label="Total budget (USDT)">
              <input className={inputCls} type="number" min="1" step="0.01" required value={form.budget} onChange={set('budget')} />
            </Field>
            <Field label="Viewer question">
              <input className={inputCls} required value={form.question} onChange={set('question')} />
            </Field>
            <Field label="Answer options (comma separated, min 2)">
              <input className={inputCls} required placeholder="e.g. A phone, A car, A drink" value={form.options} onChange={set('options')} />
              <span className="block text-[10px] text-[#71789c] mt-1">Type the options yourself, separated by commas.</span>
            </Field>
            <label className="flex items-center gap-2 text-xs text-[#aab1d3] cursor-pointer">
              <input type="checkbox" checked={form.isDemo} onChange={set('isDemo')} /> Mark as demonstration content
            </label>
            <div className="flex items-center justify-end gap-3 sm:col-span-2">
              {!valid && <span className="text-[11px] text-amber-300">Still needed: {missing.join(', ')}</span>}
              <Btn variant="primary" type="submit" disabled={!valid || saving}>
                {saving ? 'Publishing…' : 'Publish ad'}
              </Btn>
            </div>
          </form>
        )}

        <Table head={['Ad', 'Status', 'Reward', 'Budget used', '']} isEmpty={!loading && ads.length === 0} empty="No ads yet.">
          {ads.map((a) => (
            <React.Fragment key={a.id}>
              <tr>
                <td className="py-2.5 pr-4">
                  <div className="font-semibold text-white">
                    {a.name} {a.is_demo && <Badge tone="violet">demo</Badge>}
                  </div>
                  <div className="text-[#71789c]">
                    {a.brand} · {a.category}
                  </div>
                </td>
                <td className="pr-4">
                  <Badge tone={tone(a.status)}>{a.status === 'paused' ? 'hidden' : a.status}</Badge>
                </td>
                <td className="pr-4 font-mono">{fmtMoney(a.reward_rate)}</td>
                <td className="pr-4 font-mono">
                  {fmtMoney(a.budget_spent)} / {fmtMoney(a.budget_total)}
                </td>
                <td className="text-right whitespace-nowrap">
                  <div className="flex gap-2 justify-end">
                    <Btn onClick={() => setPreview(a)}>Preview</Btn>
                    {(a.status === 'active' || a.status === 'paused' || a.status === 'draft') && (
                      <Btn onClick={() => toggle(a)}>{a.status === 'active' ? 'Hide' : 'Show'}</Btn>
                    )}
                    <Btn variant="danger" onClick={() => setConfirm({ id: a.id, force: false })}>
                      Delete
                    </Btn>
                  </div>
                </td>
              </tr>
              {confirm?.id === a.id && (
                <tr>
                  <td colSpan={5} className="py-3">
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-950/30 border border-red-700/40 px-3 py-2 text-xs text-red-200">
                      <span className="flex-1">{confirm.message ?? `Permanently delete “${a.name}”? This cannot be undone.`}</span>
                      <Btn variant="danger" onClick={() => remove(a.id, confirm.force)}>
                        {confirm.force ? 'Delete with history' : 'Yes, delete'}
                      </Btn>
                      <Btn onClick={() => setConfirm(null)}>Cancel</Btn>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </Table>
        <p className="text-[10px] text-[#71789c] mt-3">Hidden ads stay in the system but are removed from every user's task feed.</p>
      </Card>
    </div>
  );
};
