import { useEffect, useState, useCallback } from 'react';
import { DollarSign, ShoppingBag, Clock, TrendingUp, Users, Package, Bell, BarChart3, Timer, CreditCard } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getDashboard, markAlertHandled } from '../../services/adminService';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated, onNewServerCall, onServerCallUpdated, onOrdersUpdated, onKitchenUpdated } from '../../services/socketService';

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

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <Card className="transition-all duration-200 hover:border-gold-500/20 hover:shadow-lg hover:shadow-gold-500/5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
        {trend != null && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await getDashboard();
      if (result) setData(result);
    } catch (err) {
      console.error('[DashboardPage] refresh:', err.message);
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
    const unsub6 = socket ? onOrdersUpdated(refresh) : () => {};
    const unsub7 = socket ? onKitchenUpdated(refresh) : () => {};

    return () => {
      clearInterval(polling);
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7();
    };
  }, [refresh]);

  if (loading) return <LoadingSpinner size="lg" />;

  const weekdayRevenue = data.dailyRevenue || [0, 0, 0, 0, 0, 0, 0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('Tableau de bord')}</h1>
        <span className="text-xs text-white/30">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Chiffre du jour" value={data.revenueFormatted} color="text-gold-500" trend={8} />
        <StatCard icon={ShoppingBag} label="Commandes aujourd'hui" value={data.ordersCount} color="text-wave-500" />
        <StatCard icon={Clock} label="En attente" value={data.pendingOrders} color="text-yellow-400" />
        <StatCard icon={TrendingUp} label="Panier moyen" value={data.avgOrderFormatted} color="text-blue-400" />
        <StatCard icon={Users} label="Tables actives" value={data.activeTables} color="text-green-400" />
        <StatCard icon={Package} label="Produits dispo." value={data.availableProducts} color="text-purple-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-gold-500" /> Revenus hebdomadaires
              </h2>
              <span className="text-xs text-white/30">Cette semaine</span>
            </div>
            <MiniBar values={weekdayRevenue} height={120} color="from-gold-500 to-amber-500" />
            <div className="flex justify-between mt-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <span key={d} className="text-[10px] text-white/30">{d}</span>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard size={18} className="text-gold-500" /> Paiements
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Wave</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-wave-500" style={{ width: `${data.paymentSplit?.wave || 40}%` }} />
                  </div>
                  <span className="text-xs text-white/50 font-mono">{data.paymentSplit?.wave || 40}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Orange Money</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-orange-500" style={{ width: `${data.paymentSplit?.orange || 35}%` }} />
                  </div>
                  <span className="text-xs text-white/50 font-mono">{data.paymentSplit?.orange || 35}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Cash</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${data.paymentSplit?.cash || 25}%` }} />
                  </div>
                  <span className="text-xs text-white/50 font-mono">{data.paymentSplit?.cash || 25}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Timer size={18} className="text-gold-500" /> {t('Last orders')}
            </h2>
          </div>
          <div className="space-y-2">
            {data.recentOrders.map((order) => {
              const badgeVariant = {
                new: 'pending', pending: 'pending', accepted: 'preparing',
                preparing: 'preparing', ready: 'ready', served: 'delivered',
                paid: 'delivered', cancelled: 'cancelled',
              };
              return (
                <Card key={order.id} className="flex flex-col gap-1.5 min-w-0 transition-all duration-200 hover:border-gold-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate min-w-0">{order.id}</span>
                    <Badge variant={badgeVariant[order.status] || 'default'}>{t(order.status)}</Badge>
                  </div>
                  <p className="text-xs text-white/40 min-w-0">{t('Table')} {order.table} &middot; {(order.items || []).slice(0, 3).join(', ')}{order.items?.length > 3 ? '...' : ''}</p>
                  <p className="text-xs text-white/30 min-w-0">{order.time}</p>
                  <p className="text-sm font-semibold text-gold-500 text-right min-w-0">{order.total}</p>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-gold-500" /> {t('Top selling products')}
            </h2>
            <Card>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-4">Aucun produit</p>
              ) : (
                <div className="space-y-3">
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
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className="text-xs text-white/60">{product.count}</span>
                            <span className="text-xs font-medium text-gold-500 ml-2">{product.revenue}</span>
                          </div>
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
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Bell size={18} className="text-gold-500" /> {t('Server alerts')}
            </h2>
            <Card>
              {data.serverAlerts.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-4">{t('No alerts')}</p>
              ) : (
                <div className="space-y-2">
                  {data.serverAlerts.map((alert, i) => (
                    <div key={alert.id || i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bell size={14} className="text-yellow-400 flex-shrink-0" />
                        <span className="text-sm text-white/80 truncate">{t('Table')} {alert.table}</span>
                        <span className="text-xs text-white/30 hidden sm:inline">{alert.time}</span>
                      </div>
                      <Button variant="ghost" className="text-xs px-2 py-1 flex-shrink-0" onClick={() => markAlertHandled(alert.id).then(refresh)}>
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
