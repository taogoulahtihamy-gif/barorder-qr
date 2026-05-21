import { Phone, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const MONOGRAM_CACHE = {};

function getMonogram(name) {
  if (!name) return 'BO';
  if (MONOGRAM_CACHE[name]) return MONOGRAM_CACHE[name];
  const m = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  MONOGRAM_CACHE[name] = m;
  return m;
}

export default function ClientLayout({ children }) {
  const navigate = useNavigate();
  const { t, locale, toggleLanguage, restaurant } = useApp();
  const brandColor = restaurant?.primary_color || '#D4AF37';
  const brandLogo = restaurant?.logo_url || '';
  const brandName = restaurant?.name || '';

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {brandLogo ? (
            <img src={brandLogo} alt="" className="w-7 h-7 rounded-lg object-cover" />
          ) : brandName ? (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: brandColor + '22', color: brandColor }}>
              {getMonogram(brandName)}
            </div>
          ) : null}
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
        </div>
      </header>
      <main className="flex-1 pb-safe overflow-x-hidden max-w-full">{children}</main>
    </div>
  );
}
