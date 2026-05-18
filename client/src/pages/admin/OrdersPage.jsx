import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderTimeline from '../../components/OrderTimeline';
import { useApp } from '../../context/AppContext';
import { getOrders, updateOrderStatus, mapOrder } from '../../services/adminService';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated } from '../../services/socketService';
import { formatCurrency } from '../../utils/formatters';

const statusActions = {
  new: ['accepted', 'cancelled'],
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served'],
  served: ['paid'],
  paid: [],
  cancelled: [],
};

const statusFilters = ['all', 'new', 'accepted', 'preparing', 'ready', 'served', 'paid', 'cancelled'];

const ROLE_DEFAULT_FILTER = {
  kitchen: 'new',
  waiter: 'ready',
  cashier: 'served',
};

const actionLabels = {
  accepted: 'Accepter',
  preparing: 'En préparation',
  ready: 'Prête',
  served: 'Servie',
  paid: 'Payée',
  cancelled: 'Annuler',
};

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

function printTicket(order) {
  const ticket = `
================================
        BARORDER - TICKET
================================
Commande: ${order.orderNumber}
Table: ${order.table}
${order.customerName ? `Client: ${order.customerName}` : ''}
${order.customerPhone ? `Tél: ${order.customerPhone}` : ''}
--------------------------------
${(order.items || []).map(i => `  x${i.qty || 1}  ${i.name}`).join('\n')}
--------------------------------
${order.kitchenNote ? `Note: ${order.kitchenNote}\n` : ''}
${order.note && !order.kitchenNote ? `Note: ${order.note}\n` : ''}
Total: ${order.total}
--------------------------------
${new Date().toLocaleString('fr-FR')}
================================
  `.trim();
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`<pre style="font-family:monospace;font-size:14px;padding:16px">${ticket}</pre><script>window.print();window.close();</script>`);
    win.document.close();
  }
}

const filterLabels = {
  all: 'Toutes',
  new: 'En attente',
  accepted: 'Acceptées',
  preparing: 'En préparation',
  ready: 'Prêtes',
  served: 'Servies',
  paid: 'Payées',
  cancelled: 'Annulées',
};

const badgeVariant = {
  new: 'pending',
  pending: 'pending',
  accepted: 'accepted',
  preparing: 'preparing',
  ready: 'ready',
  served: 'served',
  paid: 'paid',
  cancelled: 'cancelled',
};

function normalizeStatus(s) {
  if (s === 'pending') return 'new';
  return s;
}

function playOrderSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 880;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.35);
    }, 150);
  } catch {}
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, user } = useApp();
  const roleDefault = ROLE_DEFAULT_FILTER[user?.role] || 'all';
  const [filter, setFilter] = useState(roleDefault);
  const prevOrdersRef = useRef([]);

  const refreshOrders = useCallback(async () => {
    try {
      const result = await getOrders();
      setOrders((prev) => {
        const prevCount = prev.length;
        const newCount = Array.isArray(result) ? result.length : 0;
        if (newCount > prevCount) {
          playOrderSound();
          toast.success('Nouvelle commande !');
        }
        return Array.isArray(result) ? result : [];
      });
    } catch (err) {
      console.error('[OrdersPage] refresh failed:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshOrders().finally(() => setLoading(false));

    const polling = setInterval(refreshOrders, 5000);

    const socket = connectSocket();
    const unsubNew = socket ? onNewOrder(() => {
      refreshOrders();
      playOrderSound();
      toast.success('Nouvelle commande !');
    }) : () => {};
    const unsubStatus = socket ? onOrderStatusUpdated(() => {
      refreshOrders();
    }) : () => {};
    const unsubPay = socket ? onPaymentUpdated(() => {
      refreshOrders();
    }) : () => {};

    return () => {
      clearInterval(polling);
      unsubNew();
      unsubStatus();
      unsubPay();
    };
  }, [refreshOrders]);

  useEffect(() => {
    prevOrdersRef.current = orders;
  }, [orders]);

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await refreshOrders();
      toast.success('Statut mis à jour');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erreur de mise à jour');
    }
  }, [refreshOrders]);

  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => normalizeStatus(o.status) === filter);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('Commandes')}</h1>

      <div className="filter-scroll mb-6">
        {statusFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full text-sm transition-colors ${
              filter === f ? 'bg-gold-500 text-black' : 'bg-zinc-900 text-white/60 hover:text-white'
            }`}
          >
            {t(filterLabels[f])}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const actions = statusActions[normalizeStatus(order.status)] || [];
          return (
            <Card key={order.id}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white">{order.orderNumber || `#${order.id}`}</span>
                      <Badge variant={badgeVariant[normalizeStatus(order.status)] || 'pending'}>
                        {t(order.status)}
                      </Badge>
                      <Badge variant={order.paymentStatus === 'paid' ? 'delivered' : 'pending'}>
                        {order.payment}
                      </Badge>
                      <span className="text-xs text-white/30 font-mono">
                        <ElapsedTime createdAt={order.createdAt} />
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      {t('Table')} {order.table}
                    </p>
                    {(order.customerName || order.customerPhone) && (
                      <div className="flex gap-3 mt-1 text-xs text-white/50">
                        {order.customerName && <span>👤 {order.customerName}</span>}
                        {order.customerPhone && <span>📞 {order.customerPhone}</span>}
                      </div>
                    )}
                    <div className="mt-2 space-y-0.5">
                      {order.items && order.items.map((item, i) => (
                        <p key={i} className="text-sm text-white/70">
                          <span className="text-white/40">x{item.qty || 1}</span> {item.name}
                        </p>
                      ))}
                    </div>
                    {order.kitchenNote && (
                      <p className="text-xs text-yellow-400/70 mt-1 italic">🍳 {order.kitchenNote}</p>
                    )}
                    {order.note && !order.kitchenNote && (
                      <p className="text-xs text-yellow-400/70 mt-1 italic">📝 {order.note}</p>
                    )}
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <OrderTimeline status={order.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                      {order.paymentStatus && <span>Paiement: {t(order.paymentStatus)}</span>}
                      <button
                        onClick={() => printTicket(order)}
                        className="text-wave-400 hover:text-wave-300 transition-colors"
                      >
                        🖨️ Imprimer
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-lg font-bold text-gold-500">{order.total}</span>
                    <div className="flex gap-1.5 flex-wrap justify-end min-w-[140px]">
                      {normalizeStatus(order.status) === 'paid' ? (
                        <span className="text-xs font-medium text-wave-500 bg-wave-500/10 px-3 py-1.5 rounded-lg">
                          Terminée
                        </span>
                      ) : (
                        actions.map((action) => (
                          <Button
                            key={action}
                            variant={action === 'cancelled' ? 'ghost' : action === 'accepted' ? 'gold' : 'primary'}
                            className="text-xs px-3 py-1"
                            onClick={() => handleStatusUpdate(order.id, action)}
                          >
                            {t(actionLabels[action])}
                          </Button>
                        ))
                      )}
                    </div>
                  </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-white/30 py-8">Aucune commande</p>
        )}
      </div>
    </div>
  );
}