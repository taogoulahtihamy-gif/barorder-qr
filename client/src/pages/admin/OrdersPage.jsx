import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Eye, Printer, ChefHat } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderTimeline from '../../components/OrderTimeline';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import { useApp } from '../../context/AppContext';
import { getOrders, updateOrderStatus, mapOrder } from '../../services/adminService';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated } from '../../services/socketService';
import { formatCurrency } from '../../utils/formatters';
import { printKitchenTicket, printCustomerReceipt, printCashierInvoice } from '../../utils/printService';
import { playNewOrderSound, vibrateIfSupported } from '../../utils/notificationService';

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
      if (mins < 1) setElapsed('à l\'instant');
      else if (mins < 60) setElapsed(`${mins} min`);
      else setElapsed(`${Math.floor(mins / 60)}h ${mins % 60}min`);
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [createdAt]);
  return <>{elapsed}</>;
}

function PrintButtons({ order }) {
  const { t } = useApp();
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); printKitchenTicket(order); }}
        className="text-wave-400 hover:text-wave-300 transition-colors"
        title={t('Kitchen ticket')}
      >
        <ChefHat size={14} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); printCustomerReceipt(order); }}
        className="text-gold-500 hover:text-gold-400 transition-colors"
        title={t('Customer receipt')}
      >
        <Printer size={14} />
      </button>
      {(order.paymentStatus === 'paid' || order.status === 'paid') && (
        <button
          onClick={(e) => { e.stopPropagation(); printCashierInvoice(order); }}
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
          title={t('Paid invoice')}
        >
          <Printer size={14} className="opacity-70" />
        </button>
      )}
    </div>
  );
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
  playNewOrderSound();
  vibrateIfSupported();
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { t, user } = useApp();
  const roleDefault = ROLE_DEFAULT_FILTER[user?.role] || 'all';
  const [filter, setFilter] = useState(roleDefault);
  const isFetchingRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const refreshOrders = useCallback(async () => {
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchAtRef.current < 2000) return;
    isFetchingRef.current = true;
    lastFetchAtRef.current = now;
    if (import.meta.env.DEV) console.log('[REFETCH TRIGGERED] orders');
    try {
      const result = await getOrders();
      setOrders(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('[OrdersPage] refresh failed:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshOrders().finally(() => setLoading(false));

    const socket = connectSocket();
    const polling = setInterval(() => {
      if (!socket?.connected) refreshOrders();
    }, 5000);

    const unsubNew = socket ? onNewOrder(() => {
      refreshOrders();
      playOrderSound();
      toast.success(t('Nouvelle commande !'));
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
  }, [refreshOrders, t]);

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await refreshOrders();
      toast.success(t('Statut mis à jour'));
    } catch (e) {
      toast.error(e?.response?.data?.error || t('Erreur de mise à jour'));
    }
  }, [refreshOrders, t]);

  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => normalizeStatus(o.status) === filter);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('Orders')}</h1>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="filter-scroll flex-1 min-w-0">
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

        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((order, idx) => {
          const actions = statusActions[normalizeStatus(order.status)] || [];
          return (
            <Card key={order.id} className="transition-all duration-200 hover:border-gold-500/20 hover:shadow-lg hover:shadow-gold-500/5 animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
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
                      {order.paymentStatus && <span>{t('Payment')}: {t(order.paymentStatus)}</span>}
                      <PrintButtons order={order} />
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-wave-400 hover:text-wave-300 transition-colors flex items-center gap-1"
                      >
                        <Eye size={14} /> {t('Details')}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-lg font-bold text-gold-500">{order.total}</span>
                    <div className="flex gap-1.5 flex-wrap justify-end min-w-[140px]">
                      {normalizeStatus(order.status) === 'paid' ? (
                        <span className="text-xs font-medium text-wave-500 bg-wave-500/10 px-3 py-1.5 rounded-lg">
                          {t('Terminée')}
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
          <p className="text-center text-white/30 py-8">{t('Aucune commande')}</p>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          restaurant={{}}
          userRole={user?.role}
          cashierName={user?.name || ''}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
