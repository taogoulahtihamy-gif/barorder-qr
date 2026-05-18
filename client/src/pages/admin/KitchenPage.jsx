import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Clock, Maximize, Minimize, Bell, Printer, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getOrders, updateOrderStatus } from '../../services/adminService';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated, onNewServerCall, onOrdersUpdated, onKitchenUpdated } from '../../services/socketService';
import { printKitchenTicket } from '../../utils/printService';

const KANBAN_COLUMNS = [
  { key: 'new', label: 'Nouvelle', color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/30', headerBg: 'bg-amber-500/10' },
  { key: 'preparing', label: 'En préparation', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/30', headerBg: 'bg-blue-500/10' },
  { key: 'ready', label: 'Prête', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30', headerBg: 'bg-emerald-500/10' },
];

const columnActions = {
  new: [{ label: 'Commencer', status: 'preparing', variant: 'gold' }],
  preparing: [{ label: 'Prête', status: 'ready', variant: 'primary' }],
  ready: [],
};

function normalizeStatus(s) {
  if (s === 'pending') return 'new';
  if (s === 'accepted') return 'new';
  return s;
}

function ElapsedTime({ createdAt }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      if (!createdAt) { setElapsed(''); return; }
      const diff = Date.now() - new Date(createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) setElapsed("à l'instant");
      else if (mins < 60) setElapsed(`${mins} min`);
      else setElapsed(`${Math.floor(mins / 60)}h ${mins % 60}min`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [createdAt]);
  return <>{elapsed}</>;
}

function playSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function UrgencyBadge({ createdAt }) {
  if (!createdAt) return null;
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 20) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full animate-pulse">
      <AlertTriangle size={10} />
      URGENT
    </span>
  );
}

export default function KitchenPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { t } = useApp();
  const refreshInterval = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const result = await getOrders();
      setOrders(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('[KitchenPage] refresh failed:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshOrders().finally(() => setLoading(false));

    refreshInterval.current = setInterval(refreshOrders, 5000);

    const socket = connectSocket();
    const unsubNew = socket ? onNewOrder(() => {
      refreshOrders();
      playSound();
      toast.success('Nouvelle commande !');
    }) : () => {};
    const unsubStatus = socket ? onOrderStatusUpdated(() => refreshOrders()) : () => {};
    const unsubPay = socket ? onPaymentUpdated(() => refreshOrders()) : () => {};
    const unsubOrdersUpdated = socket ? onOrdersUpdated(() => refreshOrders()) : () => {};
    const unsubKitchenUpdated = socket ? onKitchenUpdated(() => refreshOrders()) : () => {};
    const unsubServerCall = socket ? onNewServerCall((call) => {
      playSound();
      toast.custom((tInstance) => (
        <div
          onClick={() => { toast.dismiss(tInstance.id); navigate('/admin/server-calls'); }}
          className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-4 shadow-2xl cursor-pointer hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Bell size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Appel serveur</p>
              <p className="text-xs text-white/50">Table {call.table_number || call.table_id}</p>
            </div>
          </div>
        </div>
      ), { duration: 6000, position: 'top-right' });
    }) : () => {};

    return () => {
      clearInterval(refreshInterval.current);
      unsubNew();
      unsubStatus();
      unsubPay();
      unsubOrdersUpdated();
      unsubKitchenUpdated();
      unsubServerCall();
    };
  }, [refreshOrders, navigate]);

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Statut mis à jour');
    } catch (e) {
      refreshOrders();
      toast.error(e?.response?.data?.error || 'Erreur de mise à jour');
    }
  }, [refreshOrders]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const grouped = {};
  KANBAN_COLUMNS.forEach((col) => { grouped[col.key] = []; });
  orders.forEach((o) => {
    const key = normalizeStatus(o.status);
    if (grouped[key]) grouped[key].push(o);
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className={isFullscreen ? 'h-screen overflow-hidden bg-black' : ''}>
      <div className={`flex items-center justify-between mb-6 flex-wrap gap-2 ${isFullscreen ? 'px-4 pt-4' : ''}`}>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Cuisine</h1>
          <span className="text-sm text-white/40 font-mono">
            {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/70 hover:text-white transition-colors text-sm"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? 'Quitter' : 'Plein écran'}
          </button>
        </div>
      </div>

      <div className={`flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4 ${isFullscreen ? 'md:h-[calc(100vh-64px)] px-4' : ''}`}>
        {KANBAN_COLUMNS.map((column) => {
          const colOrders = grouped[column.key] || [];
          return (
            <div
              key={column.key}
              className={`w-full md:w-[420px] md:flex-shrink-0 rounded-2xl border ${column.border} bg-gradient-to-b ${column.color} backdrop-blur-sm flex flex-col ${isFullscreen ? 'md:h-full' : 'md:max-h-[calc(100vh-200px)]'}`}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-black/40 backdrop-blur-lg rounded-t-2xl`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${column.key === 'new' ? 'bg-amber-400' : column.key === 'preparing' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                  <h2 className="font-bold text-white text-base">{column.label}</h2>
                </div>
                <span className="text-sm font-bold text-white/50 bg-white/10 px-2.5 py-0.5 rounded-full">{colOrders.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {colOrders.map((order) => {
                  const isUrgent = order.createdAt && (Date.now() - new Date(order.createdAt).getTime()) > 1200000;
                  return (
                    <div
                      key={order.id}
                      className={`rounded-2xl bg-zinc-900/90 border overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                        isUrgent ? 'border-red-500/40 shadow-lg shadow-red-500/10' : 'border-white/10'
                      }`}
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-bold text-white text-lg">{order.orderNumber || `#${order.id}`}</span>
                            <UrgencyBadge createdAt={order.createdAt} />
                          </div>
                          <div className="flex items-center gap-1.5 text-white/50 text-sm font-mono whitespace-nowrap">
                            <Clock size={14} />
                            <span className={isUrgent ? 'text-red-400 font-bold' : ''}>
                              <ElapsedTime createdAt={order.createdAt} />
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-white/40 text-sm">Table</span>
                          <span className="font-bold text-white bg-white/10 px-3 py-1 rounded-lg text-base">{order.table}</span>
                          {order.customerName && (
                            <span className="text-white/50 text-sm">👤 {order.customerName}</span>
                          )}
                          <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
                            order.payment === 'Wave' ? 'bg-blue-500/15 text-blue-400' :
                            order.payment === 'Orange Money' ? 'bg-orange-500/15 text-orange-400' :
                            'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {order.payment}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-3 border-t border-white/10">
                          {order.items && order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-base">
                              <span className="text-white/40 font-mono text-sm w-8 text-right flex-shrink-0 font-bold">x{item.qty || 1}</span>
                              <span className="text-white/90 font-medium">{item.name}</span>
                            </div>
                          ))}
                        </div>

                        {order.kitchenNote && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                            <p className="text-sm text-amber-400/90 font-medium">🍳 {order.kitchenNote}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => printKitchenTicket(order)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-wave-400 transition-all text-sm font-medium"
                            title="Imprimer ticket"
                          >
                            <Printer size={16} /> Imprimer
                          </button>
                          <span className="text-lg font-bold text-gold-500 ml-auto">{order.total}</span>
                          <div className="flex gap-2">
                            {(columnActions[column.key] || []).map((action) => (
                              <Button
                                key={action.status}
                                variant={action.variant}
                                className="text-sm px-5 py-2 font-bold"
                                onClick={() => handleStatusUpdate(order.id, action.status)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {colOrders.length === 0 && (
                  <div className="text-center py-12 text-white/20 text-base">Aucune commande</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
