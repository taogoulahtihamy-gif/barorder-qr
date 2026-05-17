import { useEffect, useState, useCallback } from 'react';
import { DollarSign, ShoppingBag, Clock, TrendingUp, Users, Package, Bell } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getDashboard, markAlertHandled } from '../../services/adminService';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated, onNewServerCall, onServerCallUpdated } from '../../services/socketService';

export default function DashboardPage() {
  const { t } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await getDashboard();
      if (result) setData(result);
    } catch (err) {
      console.error('[DashboardPage] refresh failed:', err);
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
    const unsub4 = socket ? onNewServerCall(refresh) : () => {};
    const unsub5 = socket ? onServerCallUpdated(refresh) : () => {};

    return () => {
      clearInterval(polling);
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [refresh]);

  if (loading) return <LoadingSpinner size="lg" />;

  const kpis = [
    { label: t('Revenue Today'), value: data.revenueFormatted, icon: DollarSign, color: 'text-gold-500' },
    { label: t('Orders Count'), value: data.ordersCount, icon: ShoppingBag, color: 'text-wave-500' },
    { label: t('Pending Orders'), value: data.pendingOrders, icon: Clock, color: 'text-yellow-400' },
    { label: t('Avg. Order'), value: data.avgOrderFormatted, icon: TrendingUp, color: 'text-blue-400' },
    { label: t('Active Tables'), value: data.activeTables, icon: Users, color: 'text-green-400' },
    { label: t('Available Products'), value: data.availableProducts, icon: Package, color: 'text-purple-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('Tableau de bord')}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} className={kpi.color} />
              </div>
              <p className="text-xl lg:text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-xs text-white/40 mt-1">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-3">{t('Last orders')}</h2>
          <div className="space-y-2">
            {data.recentOrders.map((order) => {
              const badgeVariant = {
                new: 'pending',
                pending: 'pending',
                accepted: 'preparing',
                preparing: 'preparing',
                ready: 'ready',
                served: 'delivered',
                paid: 'delivered',
                cancelled: 'cancelled',
              };
              return (
                <Card key={order.id} className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate min-w-0">{order.id}</span>
                    <Badge variant={badgeVariant[order.status] || 'default'}>
                      {t(order.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40 min-w-0">{t('Table')} {order.table} &middot; {(order.items || []).slice(0, 3).join(', ')}{order.items?.length > 3 ? '...' : ''}</p>
                  <p className="text-xs text-white/40 min-w-0">{order.time}</p>
                  <p className="text-sm font-semibold text-gold-500 text-right min-w-0">{order.total}</p>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">{t('Top selling products')}</h2>
          <Card className="mb-6">
            <div className="space-y-3">
              {data.topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gold-500">#{i + 1}</span>
                    <span className="text-sm text-white">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">{product.count}</p>
                    <p className="text-xs font-medium text-gold-500">{product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <h2 className="text-lg font-semibold text-white mb-3">{t('Server alerts')}</h2>
          <Card>
            {data.serverAlerts.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">{t('No alerts')}</p>
            ) : (
              <div className="space-y-2">
                {data.serverAlerts.map((alert, i) => (
                  <div key={alert.id || i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-yellow-400" />
                      <span className="text-xs text-white/40 capitalize">{alert.status}</span>
                    <span className="text-sm text-white/80">{t('Table')} {alert.table}</span>
                      <span className="text-xs text-white/30">{alert.time}</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-xs px-2 py-1"
                      onClick={() => markAlertHandled(alert.id).then(refresh)}
                    >
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
  );
}