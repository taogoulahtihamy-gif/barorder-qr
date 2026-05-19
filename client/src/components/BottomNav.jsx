import { useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, ShoppingBag, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, cartCount, restaurantSlug, tableId } = useApp();

  const slug = restaurantSlug || '';
  const tid = tableId || '';
  const base = slug && tid ? `/r/${slug}/table/${tid}` : '';

  const isActive = (path) => location.pathname === path;
  const nav = (path) => { if (path) navigate(path); };

  const items = [
    { key: 'menu', path: `${base}/menu`, icon: ChefHat, label: t('Menu') },
    { key: 'cart', path: `${base}/cart`, icon: ShoppingBag, label: t('Cart') },
    { key: 'assistance', path: `${base}/assistance`, icon: Bell, label: t('Assistance') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-white/10 safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1">
        {items.map(({ key, path, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => nav(path)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
              isActive(path) ? 'text-gold-500' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <div className="relative">
              <Icon size={20} />
              {key === 'cart' && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-gold-500 text-[9px] font-bold text-black flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
