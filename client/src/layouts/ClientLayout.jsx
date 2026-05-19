import { ShoppingCart, Phone, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ClientLayout({ children }) {
  const navigate = useNavigate();
  const { t, locale, toggleLanguage, cartCount, restaurant, tableId } = useApp();
  const brandColor = restaurant?.primary_color || '#D4AF37';
  const brandLogo = restaurant?.logo_url || '';
  const brandName = restaurant?.name || 'BarOrder';

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {brandLogo && (
            <img src={brandLogo} alt="" className="w-7 h-7 rounded-lg object-cover" />
          )}
          <h1 className="text-lg font-bold" style={{ color: brandColor }}>{brandName || t('BarOrder')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLanguage} className="p-2 text-white/40 hover:text-wave-500 transition-colors text-xs font-medium" title={t('Language')}>
            <Globe size={16} className="inline mr-0.5" />
            {locale === 'fr' ? t('EN') : t('FR')}
          </button>
          <button onClick={() => navigate('/server-call')} className="p-2 text-white/70 hover:text-wave-500 transition-colors" title={t('Call Server')}>
            <Phone size={20} />
          </button>
          <button onClick={() => navigate(`/r/${restaurant?.slug || ''}/menu/${tableId || ''}`)} className="relative p-2 text-white/70 hover:text-gold-500 transition-colors" title={t('Menu')}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-wave-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <main className="flex-1 pb-safe">{children}</main>
    </div>
  );
}