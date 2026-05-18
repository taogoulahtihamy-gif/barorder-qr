import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Clock, Maximize, Minimize, Bell, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getOrders, updateOrderStatus } from '../../services/adminService';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated, onNewServerCall } from '../../services/socketService';
import { printKitchenTicket } from '../../utils/printService';

const KANBAN_COLUMNS = [
  { key: 'new', label: 'Nouvelle', color: 'from-rose-500/20 to-rose-500/5', border: 'border-rose-500/30' },
  { key: 'accepted', label: 'Acceptée', color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/30' },
  { key: 'preparing', label: 'En préparation', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/30' },
];

const columnActions = {
  new: [{ label: 'Accepter', status: 'accepted', variant: 'gold' }],
  accepted: [{ label: 'En préparation', status: 'preparing', variant: 'primary' }],
  preparing: [{ label: 'Prête', status: 'ready', variant: 'primary' }],
};

function normalizeStatus(s) {
  if (s === 'pending') return 'new';
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
    const iv = setInterval(update, 30000);
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

export default function KitchenPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('autoPrintKitchen') === 'true');
  const { t } = useApp();
  const glowTimeouts = useRef({});

  useEffect(() => {
    localStorage.setItem('autoPrintKitchen', autoPrint);
  }, [autoPrint]);

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

    const polling = setInterval(refreshOrders, 5000);

    const socket = connectSocket();
    const unsubNew = socket ? onNewOrder((data) => {
      refreshOrders();
      playSound();
      toast.success('Nouvelle commande !');
      if (autoPrint) {
        const order = {
          orderNumber: data?.order_number || data?.orderNumber || '',
          table: data?.table_number || data?.table_id || '',
          items: (data?.items || []).map(i => ({ name: i.product_name || i.name, qty: i.quantity })),
          kitchenNote: data?.kitchen_note || data?.kitchenNote || '',
          createdAt: data?.created_at || data?.createdAt,
        };
        printKitchenTicket(order);
      }
    }) : () => {};
    const unsubStatus = socket ? onOrderStatusUpdated(() => {
      refreshOrders();
    }) : () => {};
    const unsubPay = socket ? onPaymentUpdated(() => {
      refreshOrders();
    }) : () => {};
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
      clearInterval(polling);
      unsubNew();
      unsubStatus();
      unsubPay();
      unsubServerCall();
      Object.values(glowTimeouts.current).forEach(clearTimeout);
    };
  }, [refreshOrders, navigate]);

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await refreshOrders();
      toast.success('Statut mis à jour');
    } catch (e) {
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
          <span className="text-sm text-white/30">
            {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/20 bg-zinc-800 text-gold-500 focus:ring-gold-500/30"
            />
            Auto-print
          </label>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/70 hover:text-white transition-colors text-sm"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? 'Quitter' : 'Plein écran'}
          </button>
        </div>
      </div>

      <div className={`flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4 ${isFullscreen ? 'md:h-[calc(100vh-64px)] px-4' : ''}`}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
      >
        {KANBAN_COLUMNS.map((column) => {
          const colOrders = grouped[column.key] || [];
          return (
            <div
              key={column.key}
              className={`w-full md:w-[360px] md:flex-shrink-0 rounded-xl border ${column.border} bg-gradient-to-b ${column.color} backdrop-blur-sm flex flex-col ${isFullscreen ? 'md:h-full' : 'md:max-h-[calc(100vh-200px)]'}`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 bg-black/20 backdrop-blur-sm rounded-t-xl">
                <h2 className="font-semibold text-white text-sm">{column.label}</h2>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{colOrders.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
              >
                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl bg-zinc-900/80 border border-white/5 overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{order.orderNumber || `#${order.id}`}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/40 text-xs">
                          <Clock size={12} />
                          <ElapsedTime createdAt={order.createdAt} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/50">Table</span>
                        <span className="font-semibold text-white bg-white/5 px-2 py-0.5 rounded-md">{order.table}</span>
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                          order.payment === 'Wave' ? 'bg-blue-500/10 text-blue-400' :
                          order.payment === 'Orange Money' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {order.payment}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-white/5">
                        {order.items && order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-white/30 font-mono text-xs w-6 text-right flex-shrink-0">x{item.qty || 1}</span>
                            <span className="text-white/80 truncate">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {order.kitchenNote && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                          <p className="text-xs text-yellow-400/80 italic">Note: {order.kitchenNote}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        <button
                          onClick={() => printKitchenTicket(order)}
                          className="text-white/30 hover:text-wave-400 transition-colors"
                          title="Imprimer ticket"
                        >
                          <Printer size={14} />
                        </button>
                        <span className="text-sm font-bold text-gold-500 ml-auto">{order.total}</span>
                        <div className="flex gap-1">
                          {(columnActions[column.key] || []).map((action) => (
                            <Button
                              key={action.status}
                              variant={action.variant}
                              className="text-xs px-3 py-1"
                              onClick={() => handleStatusUpdate(order.id, action.status)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <div className="text-center py-8 text-white/20 text-sm">Aucune commande</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
