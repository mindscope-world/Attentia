import React, { useCallback, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Film, LayoutDashboard, LogOut, Users, Wallet, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminFunds } from './AdminFunds';
import { AdminAds } from './AdminAds';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'funds', label: 'Funds', icon: Wallet },
  { id: 'ads', label: 'Ads', icon: Film },
] as const;

export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { user } = useAuth();
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const notify = useCallback((text: string, error = false) => {
    setToast({ text, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (!TABS.some((t) => t.id === tab)) return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen bg-[#090a16] text-[#c4c9e2] font-sans antialiased">
      {toast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-3 ${
            toast.error ? 'bg-red-950/90 border-red-700/60 text-red-200' : 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200'
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#0c0d1e]/90 backdrop-blur-md border-b border-[#1f223f] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6b45f6] to-[#a082ff] flex items-center justify-center text-white font-black">A</div>
          <span className="font-extrabold text-white text-base tracking-tight">Attentia</span>
          <span className="text-[10px] uppercase font-mono font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-700/50">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181a33] hover:bg-[#23264c] text-xs font-semibold text-[#8f96b9] hover:text-white border border-[#282b52] cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">User dashboard</span>
          </button>
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181a33] hover:bg-[#2c1a2e] text-xs font-semibold text-[#8f96b9] hover:text-red-300 border border-[#282b52] cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex gap-1 mb-6 p-1.5 rounded-2xl bg-[#101224] border border-[#202341] overflow-x-auto" aria-label="Admin sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(`/admin/${id}`)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                tab === id ? 'bg-gradient-to-r from-[#6b45f6] to-[#8a68ff] text-white shadow-md shadow-[#734eff]/30' : 'text-[#848ba8] hover:text-white hover:bg-[#181a33]'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && <AdminOverview onNavigate={(t) => navigate(`/admin/${t}`)} />}
        {tab === 'users' && <AdminUsers currentUserId={user.id} notify={notify} />}
        {tab === 'funds' && <AdminFunds notify={notify} />}
        {tab === 'ads' && <AdminAds notify={notify} />}
      </div>
    </div>
  );
};
