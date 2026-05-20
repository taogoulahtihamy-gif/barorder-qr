import { useEffect, useState, useCallback, useRef } from 'react';
import { DollarSign, ShoppingBag, Clock, TrendingUp, Users, Package, Bell, BarChart3, Timer } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getDashboard, markAlertHandled } from '../../services/adminService';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated, onNewServerCall, onServerCallUpdated } from '../../services/socketService';

function MiniBar({ values, height = 60, color = 'from-gold-500 to-amber-500' }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t bg-gradient-to-t ${color} opacity-80 hover:opacity-100 transition-opacity`}
          style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 4 : 0 }}
        />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card>
      <Icon size={18} className={`${color} mb-2`} />
      <p className="text-xl sm:text-2xl font-bold text-white leading-tight">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isFetchingRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const refresh = useCallback(async () => {
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchAtRef.current < 2000) return;
    isFetchingRef.current = true;
    lastFetchAtRef.current = now;
    console.log('[REFETCH TRIGGERED] dashboard');
    try {
      const result = await getDashboard();
      if (result) setData(result);
    } catch (err) {
      console.error('[DashboardPage] refresh:', err.message);
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
    const unsub1 = socket ? onNewOrder(refresh) : () => {};
    const unsub2 = socket ? onOrderStatusUpdated(refresh) : () => {};
    const unsub3 = socket ? onPaymentUpdated(refresh) : () => {};
    const unsub4 = socket ? onNewServerCall(refresh) : () => {};
    const unsub5 = socket ? onServerCallUpdated(refresh) : () => {};

    return () => {
      clearInterval(polling);
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5();
    };
  }, [refresh]);

  if (loading) return <LoadingSpinner size="lg" />;

  const weekdayRevenue = data.dailyRevenue || [0, 0, 0, 0, 0, 0, 0];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white">{t('Dashboard')}</h1>
        <span className="text-[11px] text-white/30">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        <StatCard icon={DollarSign} label={t("Chiffre d'affaires du jour")} value={data.revenueFormatted} color="text-gold-500" sub={data.revenue === 0 ? t("Aucune vente aujourd'hui") : undefined} />
        <StatCard icon={ShoppingBag} label={t("Commandes aujourd'hui")} value={data.ordersCount} color="text-wave-500" />
        <StatCard icon={Clock} label={t('Commandes en attente')} value={data.pendingOrders} color="text-yellow-400" />
        <StatCard icon={TrendingUp} label={t('Panier moyen')} value={data.avgOrderFormatted} color="text-blue-400" />
        <StatCard icon={Users} label={t('Tables actives')} value={data.activeTables} color="text-green-400" />
        <StatCard icon={Package} label={t('Produits disponibles')} value={data.availableProducts} color="text-purple-400" />
      </div>

      <div className="space-y-4 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-gold-500" /> {t('Daily Revenue')}
            </h2>
            <span className="text-[11px] text-white/30">{t('Cette semaine')}</span>
          </div>
          <MiniBar values={weekdayRevenue} height={80} color="from-gold-500 to-amber-500" />
          <div className="flex justify-between mt-1.5">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <span key={d} className="text-[10px] text-white/30">{d}</span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="lg:col-span-1 xl:col-span-2">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              <Timer size={16} className="text-gold-500" /> {t('Last orders')}
            </h2>
          </div>
          <div className="space-y-1.5">
            {data.recentOrders.map((order) => {
              const status = order.status || 'new';
              const badgeVariant = {
                new: 'pending', pending: 'pending', accepted: 'preparing',
                preparing: 'preparing', ready: 'ready', served: 'delivered',
                paid: 'delivered', cancelled: 'cancelled',
              };
              return (
                <Card key={order.id} className="flex items-center gap-3 min-w-0 !p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{order.id}</span>
                      <Badge variant={badgeVariant[status] || 'default'} className="flex-shrink-0 text-[10px]">{t(status)}</Badge>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{t('Table')} {order.table} &middot; {(order.items || []).slice(0, 3).join(', ')}{order.items?.length > 3 ? '...' : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gold-500">{order.total}</p>
                    <p className="text-[10px] text-white/30">{order.time}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white mb-2.5 flex items-center gap-2">
              <TrendingUp size={16} className="text-gold-500" /> {t('Top selling products')}
            </h2>
            <Card>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-3">{t('Aucun produit')}</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topProducts.map((product, i) => {
                    const maxCount = Math.max(...data.topProducts.map(p => p.count), 1);
                    const barWidth = (product.count / maxCount) * 100;
                    return (
                      <div key={product.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-xs font-bold ${i === 0 ? 'text-gold-500' : 'text-white/40'}`}>#{i + 1}</span>
                            <span className="text-sm text-white truncate">{product.name}</span>
                          </div>
                          <span className="text-xs text-white/60 flex-shrink-0 ml-2">{product.count}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white mb-2.5 flex items-center gap-2">
              <Bell size={16} className="text-gold-500" /> {t('Server alerts')}
            </h2>
            <Card>
              {data.serverAlerts.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-3">{t('No alerts')}</p>
              ) : (
                <div className="space-y-1">
                  {data.serverAlerts.map((alert, i) => (
                    <div key={alert.id || i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bell size={14} className="text-yellow-400 flex-shrink-0" />
                        <span className="text-sm text-white/80 truncate">{t('Table')} {alert.table}</span>
                      </div>
                      <Button variant="ghost" className="text-[11px] px-2 py-0.5 flex-shrink-0 h-auto min-h-0" onClick={() => markAlertHandled(alert.id).then(refresh)}>
                        {t('Mark as handled')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
