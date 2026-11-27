import React, { useState } from 'react';
import { AdminLiveAds } from './AdminLiveAds';
import { AdminDiscover } from './AdminDiscover';
import { AdminLinkLibrary } from './AdminLinkLibrary';

const SECTIONS = [
  { id: 'live', label: 'Live ads' },
  { id: 'discover', label: 'Discover' },
  { id: 'library', label: 'Link library' },
] as const;

export const AdminAds: React.FC<{ notify: (msg: string, error?: boolean) => void }> = ({ notify }) => {
  const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>('live');
  // Bumped whenever a decision changes ads, so the other sections reload when opened.
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  return (
    <div className="space-y-5">
      <div className="flex gap-2" role="tablist" aria-label="Ad sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${section === s.id ? 'bg-[#221c4b] text-white border-[#44358a]' : 'bg-[#161832] text-[#8e96b8] border-[#272b53] hover:text-white'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === 'live' && <AdminLiveAds key={version} notify={notify} />}
      {section === 'discover' && <AdminDiscover notify={notify} onChanged={bump} />}
      {section === 'library' && <AdminLinkLibrary notify={notify} refreshKey={version} />}
    </div>
  );
};
