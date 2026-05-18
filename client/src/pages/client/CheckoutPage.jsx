import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Banknote, ArrowLeft, Smartphone as OrangeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { formatPrice } from '../../utils/formatters';
import { createOrder } from '../../services/orderService';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, tableId, restaurantId, restaurantSlug, clearCart, t } = useApp();
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [kitchenNote, setKitchenNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast.error('Veuillez sélectionner un moyen de paiement');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Veuillez entrer votre nom');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    setLoading(true);
    try {
      for (const item of cart) {
        const qty = Number(item.quantity);
        const price = Number(item.price);
        if (!item.quantity || isNaN(qty) || qty < 1) {
          toast.error(`Quantité invalide pour ${item.name || 'un article'}`);
          setLoading(false);
          return;
        }
        if (item.price == null || isNaN(price) || price < 0) {
          toast.error(`Prix invalide pour ${item.name || 'un article'}`);
          setLoading(false);
          return;
        }
      }
      const total = Number(cartTotal);
      if (isNaN(total) || total < 0) {
        toast.error('Erreur de calcul du total');
        setLoading(false);
        return;
      }
      const safeTableId = tableId || null;
      const safeRestaurantId = restaurantId || '1';
      const items = cart.map((i) => ({
        id: i.id,
        name: i.name,
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
      }));
      const orderData = {
        restaurantId: safeRestaurantId,
        tableId: safeTableId,
        items,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        kitchenNote,
        totalAmount: total,
        paymentMethod,
        paymentStatus: paymentMethod === 'wave' || paymentMethod === 'orange_money' ? 'paid' : 'pending',
      };
      console.log('[CheckoutPage] order payload:', JSON.stringify(orderData));
      const order = await createOrder(orderData);
      clearCart();
      toast.success('Commande confirmée !');
      const slug = order.restaurantSlug || restaurantSlug;
      localStorage.setItem('lastOrder', JSON.stringify({
        orderNumber: order.orderNumber || order.id,
        slug: slug || '',
      }));
      if (slug) {
        navigate(`/r/${slug}/order/${order.orderNumber || order.id}`);
      } else {
        navigate(`/order/${order.orderNumber || order.id}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = [
    { method: 'wave', label: 'Wave', desc: t('Pay with mobile money'), icon: Smartphone, color: 'text-wave-500', bgColor: 'border-wave-500 bg-wave-500/5' },
    { method: 'orange_money', label: 'Orange Money', desc: 'Payer avec Orange Money', icon: OrangeIcon, color: 'text-orange-500', bgColor: 'border-orange-500 bg-orange-500/5' },
    { method: 'cash', label: t('Cash à la livraison'), desc: t('Pay at the counter'), icon: Banknote, color: 'text-gold-500', bgColor: 'border-wave-500 bg-wave-500/5' },
  ];

  return (
    <div className="p-4 pb-28">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors">
        <ArrowLeft size={18} /> Retour
      </button>

      <h1 className="text-xl font-bold text-white mb-6">{t('Checkout')}</h1>

      <div className="space-y-4 mb-6">
        <Card>
          <h3 className="font-medium text-white mb-3">Informations client</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">Nom *</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Votre nom"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">Téléphone *</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="77 123 45 67"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium text-white mb-3">{t('Order Summary')}</h3>
          <p className="text-xs text-white/40 mb-3">{t('Table')} {tableId || '1'}</p>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-white/70">
                  <span className="text-white/40 mr-1">x{item.quantity}</span>
                  {item.name}
                </span>
                <span className="text-white font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-3 pt-3 flex items-center justify-between">
            <span className="text-white font-medium">{t('Total')}</span>
            <span className="text-lg font-bold text-gold-500">{formatPrice(cartTotal)}</span>
          </div>
        </Card>

        <Card>
          <label className="block text-sm font-medium text-white mb-2">Note pour la cuisine</label>
          <textarea
            value={kitchenNote}
            onChange={(e) => setKitchenNote(e.target.value)}
            placeholder="Ex: sans glaçon, bien cuit, allergies..."
            rows={3}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold-500/50 resize-none"
          />
        </Card>

        <Card>
          <h3 className="font-medium text-white mb-3">{t('Payment Method')}</h3>
          <div className="space-y-3">
            {paymentOptions.map(({ method, label, desc, icon: Icon, color, bgColor }) => (
              <div
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === method ? bgColor : 'border-white/10 hover:border-white/20'
                }`}
              >
                <Icon size={24} className={color} />
                <div>
                  <p className="font-medium text-white">{label}</p>
                  <p className="text-xs text-white/40">{desc}</p>
                </div>
                {paymentMethod === method && <div className="ml-auto w-5 h-5 rounded-full bg-wave-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-black" /></div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur border-t border-white/10 space-y-2">
        <Button
          onClick={handlePlaceOrder}
          disabled={!paymentMethod || loading}
          className="w-full"
        >
          {loading ? 'En cours...' : 'Confirmer la commande'}
        </Button>
      </div>
    </div>
  );
}