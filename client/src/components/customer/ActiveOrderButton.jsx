import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, ChevronRight, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const STATUS_COLORS = {
  new: { dot: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10' },
  pending: { dot: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10' },
  accepted: { dot: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  preparing: { dot: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  ready: { dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  served: { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
  paid: { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  cancelled: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
};

const TERMINAL_STATUSES = ['paid', 'cancelled'];

function loadActive() {
  try {
    const id = localStorage.getItem('activeOrderId');
    if (!id) return null;
    return {
      id,
      number: localStorage.getItem('activeOrderNumber') || id,
      slug: localStorage.getItem('activeRestaurantSlug') || '',
      tableId: localStorage.getItem('activeTableId') || '',
      status: localStorage.getItem('activeOrderStatus') || 'new',
    };
  } catch { return null; }
}

export default function ActiveOrderButton() {
  const navigate = useNavigate();
  const { t, tStatus } = useApp();
  const [active, setActive] = useState(loadActive);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const cleanupTimer = useRef(null);

  const cleanup = useCallback(() => {
    localStorage.removeItem('activeOrderId');
    localStorage.removeItem('activeOrderNumber');
    localStorage.removeItem('activeRestaurantSlug');
    localStorage.removeItem('activeTableId');
    localStorage.removeItem('activeOrderStatus');
    setActive(null);
    setOpen(false);
  }, []);

  const refresh = useCallback(() => {
    const a = loadActive();
    setActive(a);
  }, []);

  useEffect(() => {
    window.addEventListener('storage', refresh);
    window.addEventListener('order-status-changed', refresh);
    const iv = setInterval(refresh, 2000);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('order-status-changed', refresh);
      clearInterval(iv);
    };
  }, [refresh]);

  useEffect(() => {
    if (!active) return;
    if (TERMINAL_STATUSES.includes(active.status)) {
      cleanupTimer.current = setTimeout(cleanup, 5000);
      return () => { if (cleanupTimer.current) clearTimeout(cleanupTimer.current); };
    }
  }, [active, cleanup]);

  useEffect(() => {
    function onPulse() { setPulse(true); setTimeout(() => setPulse(false), 1500); }
    window.addEventListener('order-status-changed', onPulse);
    return () => window.removeEventListener('order-status-changed', onPulse);
  }, []);

  if (!active) return null;

  const colors = STATUS_COLORS[active.status] || STATUS_COLORS.new;
  const isTerminal = TERMINAL_STATUSES.includes(active.status);

  const targetPath = active.slug
    ? `/r/${active.slug}/order/${active.number}`
    : `/order/${active.number}`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      <div
        className="fixed z-50 transition-all duration-300"
        style={{ right: 'max(16px, env(safe-area-inset-right))', bottom: 'max(80px, calc(env(safe-area-inset-bottom) + 64px))' }}
      >
        {open && (
          <div className="mb-3 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-64">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{t('Order')}</span>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">#{active.number}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {tStatus(active.status)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/30">
                <Clock size={12} />
                <span>{t('Estimated time: 20-30 min')}</span>
              </div>
            </div>
            <button
              onClick={() => { navigate(targetPath); setOpen(false); }}
              className="w-full p-3 bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 text-sm font-medium flex items-center justify-between transition-colors"
            >
              <span>{t('Track my order')}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        <button
          onClick={() => isTerminal ? cleanup() : setOpen(o => !o)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg backdrop-blur-xl border transition-all duration-300 ${
            pulse ? 'border-gold-500/50 scale-105' : 'border-white/10'
          } bg-zinc-900/90 hover:bg-zinc-800/90`}
        >
          <div className="relative">
            <ShoppingBag size={18} className="text-gold-500" />
            <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${colors.dot} ${pulse ? 'animate-ping' : ''}`} />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-medium text-white truncate max-w-[120px]">
              {t('Track my order')}
            </div>
            <div className={`text-[10px] font-medium ${colors.text}`}>
              #{active.number}
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${active.status === 'ready' ? 'bg-emerald-400 animate-pulse' : colors.dot}`} />
        </button>
      </div>
    </>
  );
}
