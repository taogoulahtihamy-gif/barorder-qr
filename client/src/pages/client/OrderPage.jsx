import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ChevronLeft, User, Phone, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { formatPrice } from '../../utils/formatters';
import { getOrder } from '../../services/orderService';
import { connectSocket, onOrderStatusUpdated, onPaymentUpdated } from '../../services/socketService';

const statusSteps = ['new', 'accepted', 'preparing', 'ready', 'served', 'paid'];

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

function ElapsedTime({ createdAt }) {
  const { t } = useApp();
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) setElapsed(t('Just now'));
      else if (mins < 60) setElapsed(`${mins} ${t('min')}`);
      else setElapsed(`${Math.floor(mins / 60)}h ${mins % 60}${t('min')}`);
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [createdAt, t]);
  return <span>{elapsed}</span>;
}

export default function OrderPage() {
  const { orderNumber, slug, orderId } = useParams();
  const effectiveOrderNumber = orderNumber || orderId;
  const navigate = useNavigate();
  const { t, tStatus, setRestaurantSlug } = useApp();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) setRestaurantSlug(slug);
    setLoading(true);
    setError(null);
    getOrder(effectiveOrderNumber).then((data) => {
      if (data) setOrder(data);
      else setError('Order not found');
    }).catch((err) => {
      console.error('[OrderPage] fetch error:', err);
      setError(err?.response?.data?.error || t('Order not found'));
    }).finally(() => {
      setLoading(false);
    });

    const interval = setInterval(async () => {
      try {
        const updated = await getOrder(effectiveOrderNumber);
        if (updated) setOrder(updated);
      } catch (err) {
        console.error('[OrderPage] poll error:', err);
      }
    }, 5000);

    const socket = connectSocket();
    const unsubStatus = socket ? onOrderStatusUpdated((data) => {
      const updatedStatus = data.order_status || data.status;
      setOrder((prev) => {
        if (!prev) return prev;
        if (String(prev.id) === String(data.id) || prev.orderNumber === data.order_number) {
          toast.success(t('Status updated'));
          return { ...prev, status: updatedStatus };
        }
        return prev;
      });
      getOrder(effectiveOrderNumber).then(setOrder).catch(() => {});
    }) : () => {};
    const unsubPay = socket ? onPaymentUpdated(() => {
      getOrder(effectiveOrderNumber).then(setOrder).catch(() => {});
    }) : () => {};

    return () => {
      clearInterval(interval);
      unsubStatus();
      unsubPay();
    };
  }, [effectiveOrderNumber, slug, setRestaurantSlug, t]);

  if (loading) {
    return (
      <div className="p-4 pb-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader size={40} className="text-gold-500 animate-spin mb-4" />
          <p className="text-white/50">{t('Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-4 pb-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('Order not found')}</h2>
          <p className="text-white/50 mb-6">{error}</p>
          <Button variant="outline" onClick={() => navigate(slug ? `/r/${slug}/table/1` : '/')}>
            {t('Back to Menu')}
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = order ? statusSteps.indexOf(order.status === 'pending' ? 'new' : order.status) : 0;
  const effectiveSlug = slug || order?.restaurantSlug || '';
  const orderItems = order?.items || [];
  const customerName = order?.customerName || '';
  const customerPhone = order?.customerPhone || '';
  const totalAmount = order?.totalAmount != null ? order.totalAmount : 0;

  return (
    <div className="p-4 pb-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-wave-500/10 flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-wave-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">{t('Order')} #{effectiveOrderNumber}</h1>
        <p className="text-white/50">{t('Your order has been received!')}</p>
      </div>

      {order && (
        <>
          <Card className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={20} className="text-gold-500" />
              <span className="text-sm text-white/70">
                {order.createdAt ? <><ElapsedTime createdAt={order.createdAt} /> &middot; </> : ''}
                {t('Estimated time: 20-30 min')}
              </span>
            </div>
            {(customerName || customerPhone) && (
              <div className="flex flex-wrap gap-3 mb-3 p-2 bg-white/5 rounded-xl">
                {customerName && (
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <User size={12} /> {customerName}
                  </div>
                )}
                {customerPhone && (
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <Phone size={12} /> {customerPhone}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{t('Status')}</span>
              <Badge variant={badgeVariant[order.status] || 'pending'}>
                {tStatus(order.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-white/60">{t('Payment')}</span>
              <span className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-wave-500' : 'text-yellow-400'}`}>
                {order.paymentStatus === 'paid' ? t('Paid') : t('Unpaid')}
              </span>
            </div>
            {totalAmount > 0 && (
              <div className="border-t border-white/10 mt-3 pt-3 flex items-center justify-between">
                <span className="text-sm text-white/60">{t('Total')}</span>
                <span className="text-lg font-bold text-gold-500">{formatPrice(totalAmount)}</span>
              </div>
            )}
          </Card>

          <Card className="mb-4">
            <h3 className="font-medium text-white mb-4">{t('Order tracking')}</h3>
            <div className="space-y-0">
              {statusSteps.map((key, i) => {
                const done = i <= currentStep;
                const isLast = i === statusSteps.length - 1;
                return (
                  <div key={key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        done ? 'bg-wave-500 border-wave-500' : 'border-white/20'
                      }`} />
                      {!isLast && <div className={`w-0.5 h-8 ${done ? 'bg-wave-500' : 'bg-white/10'}`} />}
                    </div>
                    <span className={`text-sm pt-0.5 ${done ? 'text-white font-medium' : 'text-white/30'}`}>
                      {tStatus(key)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      <p className="text-xs text-white/30 text-center mb-8">{t("We'll notify you when your order is ready.")}</p>

      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={() => navigate('/server-call')}>
          {t('Call a Server')}
        </Button>
        <Button variant="ghost" onClick={() => navigate(effectiveSlug ? `/r/${effectiveSlug}/menu/${order?.tableId || '1'}` : `/menu/${order?.tableId || '1'}`)}>
          <ChevronLeft size={16} className="mr-1" /> {t('Back to Menu')}
        </Button>
      </div>
    </div>
  );
}