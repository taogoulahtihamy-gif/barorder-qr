import { useEffect, useState, useCallback, useRef } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, BarChart3, PieChart } from 'lucide-react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getStats } from '../../services/adminService';
import { connectSocket, onPaymentUpdated } from '../../services/socketService';

function MiniBar({ value, max, label, color = 'bg-wave-500' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/50 w-24 text-right truncate">{label}</span>
      <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-xs text-white/70 w-16">{value}</span>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useApp();

  const isFetchingRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const refresh = useCallback(async () => {
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchAtRef.current < 2000) return;
    isFetchingRef.current = true;
    lastFetchAtRef.current = now;
    console.log('[REFETCH TRIGGERED] stats');
    try {
      const result = await getStats();
      if (result) setStats(result);
    } catch (err) {
      console.error('[StatsPage] refresh failed:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));

    const socket = connectSocket();
    const polling = setInterval(() => {
      if (!socket?.connected) refresh();
    }, 5000);

    const unsub1 = socket ? onPaymentUpdated(refresh) : () => {};

    return () => {
      clearInterval(polling);
      unsub1();
    };
  }, [refresh]);

  if (loading) return <LoadingSpinner size="lg" />;

  const maxRevenue = Math.max(...stats.dailyRevenue, 1);
  const maxProductCount = Math.max(...stats.topProducts.map((p) => p.count), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('Statistiques')}</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <DollarSign size={20} className="text-gold-500 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalRevenueFormatted}</p>
          <p className="text-xs text-white/40 mt-1">{t('Total Revenue')}</p>
        </Card>
        <Card>
          <ShoppingBag size={20} className="text-wave-500 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
          <p className="text-xs text-white/40 mt-1">{t('Total Orders')}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="flex items-center gap-2 font-medium text-white mb-4">
            <BarChart3 size={16} className="text-gold-500" />
            {t('Daily Revenue')}
          </h3>
          <div className="space-y-2">
            {stats.dailyRevenue.map((val, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' });
              return (
                <MiniBar key={i} value={val} max={maxRevenue} label={dayLabel} color="bg-gold-500" />
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="flex items-center gap-2 font-medium text-white mb-4">
              <PieChart size={16} className="text-wave-500" />
              {t('Payment split')}
            </h3>
            <div className="space-y-3">
              <PaymentBar label="Wave" pct={stats.paymentMethodSplit.wave} color="bg-wave-500" />
              <PaymentBar label="Orange Money" pct={stats.paymentMethodSplit.orange_money} color="bg-orange-500" />
              <PaymentBar label="Cash" pct={stats.paymentMethodSplit.cash} color="bg-gold-500" />
            </div>
          </Card>

          <Card>
            <h3 className="flex items-center gap-2 font-medium text-white mb-4">
              <TrendingUp size={16} className="text-blue-400" />
              {t('Avg basket')}
            </h3>
            <p className="text-2xl font-bold text-white">{stats.avgOrderFormatted}</p>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <h3 className="font-medium text-white mb-4">{t('Top products')}</h3>
        <div className="space-y-2">
          {stats.topProducts.map((product, i) => (
            <MiniBar key={i} value={product.count} max={maxProductCount} label={product.name} color="bg-wave-500" />
          ))}
        </div>
      </Card>
    </div>
  );
}

function PaymentBar({ label, pct, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-white/70">{label}</span>
        <span className={`font-medium ${color.replace('bg-', 'text-')}`}>{pct}%</span>
      </div>
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}