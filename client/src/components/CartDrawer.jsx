import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatPrice } from '../utils/formatters';

export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart, restaurantSlug, t } = useApp();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      )}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-950 border-l border-white/10 z-50 transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-gold-500" />
            <span className="font-medium text-white">{t('Your Cart')}</span>
            {cartCount > 0 && (
              <span className="text-xs text-white/40">({cartCount} {cartCount > 1 ? t('items') : t('item')})</span>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-130px)] overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <ShoppingCart size={40} className="mb-3 opacity-30" />
              <p className="text-sm">{t('Your cart is empty')}</p>
              <p className="text-xs mt-1">{t('Browse the menu to add items')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gold-500">{formatPrice(item.price)} {t('each')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeFromCart(item.id);
                        } else {
                          updateQuantity(item.id, item.quantity - 1);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm text-white font-medium w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm text-white font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/90 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60">{t('Total')}</span>
              <span className="text-lg font-bold text-gold-500">{formatPrice(cartTotal)}</span>
            </div>
            <button
              onClick={() => { onClose(); navigate('/checkout'); }}
              className="w-full bg-gold-500 text-black font-semibold py-3 rounded-xl hover:bg-gold-400 transition-colors"
            >
              {t('Proceed to Checkout')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}