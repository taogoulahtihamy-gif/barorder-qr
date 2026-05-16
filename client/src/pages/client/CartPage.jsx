import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { formatPrice } from '../../utils/formatters';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, updateQuantity, removeFromCart, t } = useApp();

  if (cart.length === 0) {
    return (
      <div className="p-4">
        <EmptyState icon={ShoppingBag} title={t('Your cart is empty')} description={t('Browse the menu to add items')} />
        <Button onClick={() => navigate(-1)} className="w-full mt-4">
          {t('Back to Menu')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-28">
      <h1 className="text-xl font-bold text-white mb-6">{t('Your Cart')}</h1>

      <div className="space-y-3 mb-6">
        {cart.map((item) => (
          <Card key={item.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white text-sm">{item.name}</h3>
              <p className="text-xs text-white/40">{formatPrice(item.price)} {t('each')}</p>
              <p className="text-sm font-semibold text-gold-500">{formatPrice(item.price * item.quantity)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-white/40 hover:text-white transition-colors">
                <Minus size={16} />
              </button>
              <span className="text-white font-medium w-6 text-center text-sm">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-white/40 hover:text-white transition-colors">
                <Plus size={16} />
              </button>
            </div>
            <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60">{t('Subtotal')}</span>
          <span className="text-white font-medium">{formatPrice(cartTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60">{t('Total')}</span>
          <span className="text-lg font-bold text-gold-500">{formatPrice(cartTotal)}</span>
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur border-t border-white/10 space-y-2">
        <Button onClick={() => navigate('/checkout')} className="w-full">
          {t('Proceed to Checkout')}
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)} className="w-full text-sm">
          {t('Continue Shopping')}
        </Button>
      </div>
    </div>
  );
}
