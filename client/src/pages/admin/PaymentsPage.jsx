import { useEffect, useState, useCallback } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getPayments } from '../../services/adminService';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated } from '../../services/socketService';

const filters = ['all', 'wave', 'cash', 'orange_money', 'paid', 'pending'];

const filterKeys = {
  all: 'Toutes',
  wave: 'Wave',
  cash: 'Cash',
  orange_money: 'Orange Money',
  paid: 'Payé',
  pending: 'En attente',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { t } = useApp();

  const refresh = useCallback(async () => {
    try {
      const result = await getPayments();
      if (Array.isArray(result)) setPayments(result);
    } catch (err) {
      console.error('[PaymentsPage] refresh failed:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));

    const polling = setInterval(refresh, 10000);

    const socket = connectSocket();
    const unsub1 = socket ? onNewOrder(refresh) : () => {};
    const unsub2 = socket ? onOrderStatusUpdated(refresh) : () => {};
    const unsub3 = socket ? onPaymentUpdated(refresh) : () => {};

    return () => {
      clearInterval(polling);
      unsub1();
      unsub2();
      unsub3();
    };
  }, [refresh]);

  const filtered = payments.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'wave') return p.method === 'Wave';
    if (filter === 'cash') return p.method === 'Cash';
    if (filter === 'orange_money') return p.method === 'Orange Money';
    return p.status === filter;
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('Paiements')}</h1>

      <div className="flex gap-2 overflow-x-auto mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === f ? 'bg-gold-500 text-black' : 'bg-zinc-900 text-white/60 hover:text-white'
            }`}
          >
            {t(filterKeys[f])}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((payment) => (
          <Card key={payment.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{payment.order}</p>
              <p className="text-xs text-white/40">
                {t('Table')} {payment.table} &middot; {payment.method}
              </p>
              <p className="text-xs text-white/30">{payment.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gold-500">{payment.amount}</p>
              <Badge variant={payment.status === 'paid' ? 'delivered' : 'pending'}>
                {t(payment.status === 'paid' ? 'paid' : 'pending')}
              </Badge>
              {payment.ref && payment.ref !== '-' && (
                <p className="text-xs text-white/20 mt-0.5">{t('Transaction ref')}: {payment.ref}</p>
              )}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-white/30 py-8">Aucun paiement</p>
        )}
      </div>
    </div>
  );
}