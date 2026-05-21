import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, MapPin, Clock, ChefHat, ShoppingBag, Bell } from 'lucide-react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import BottomNav from '../../components/BottomNav';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

export default function TableWelcome() {
  const { slug: slugParam, tableId } = useParams();
  const navigate = useNavigate();
  const { t, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant, cartCount } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [visible, setVisible] = useState(false);

  const recentOrder = (() => {
    try {
      const order = localStorage.getItem('lastOrder');
      if (order) {
        const parsed = JSON.parse(order);
        if (parsed.orderNumber) return parsed;
      }
    } catch {}
    return null;
  })();

  useEffect(() => {
    if (!tableId || isNaN(Number(tableId))) return;
    const tid = Number(tableId);
    setTableId(tid);
    api.get(`/api/public/table/${tid}`).then((res) => {
      const { table, restaurant } = res.data;
      setData({ table, restaurant });
      setRestaurant(restaurant);
      setRestaurantId(restaurant?.id || '1');
      setRestaurantSlug(restaurant?.slug || slugParam || '');
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    }).catch(() => {
      setRestaurantId('1');
      setRestaurantSlug(slugParam || '');
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    });
  }, [tableId, slugParam, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant]);

  if (!tableId || isNaN(Number(tableId))) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
            <span className="text-red-400 text-3xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('Table introuvable')}</h2>
          <p className="text-white/50">{t('Table not found')}</p>
        </div>
      </div>
    );
  }
  if (loading || !data?.table) return <LoadingSpinner size="lg" />;

  const restaurantName = data?.restaurant?.name || 'BarOrder';
  const tableName = data?.table?.table_number || tableId;
  const slug = data?.restaurant?.slug || slugParam;
  const logoUrl = data?.restaurant?.logo_url || '';
  const primaryColor = data?.restaurant?.primary_color || '#D4AF37';
  const phone = data?.restaurant?.phone || '';
  const address = data?.restaurant?.address || '';
  const base = slug && tableId ? `/r/${slug}/table/${tableId}` : '';
  const monogram = restaurantName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="relative min-h-screen bg-black overflow-hidden pb-32">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(201, 149, 46, 0.15); } 50% { box-shadow: 0 0 40px rgba(201, 149, 46, 0.3); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent); background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4); }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,149,46,0.06),_transparent_70%)]" />
      <div className="absolute inset-0 animate-shimmer pointer-events-none" />

      <div className="relative z-10 pb-24">
        <div className={`px-4 pt-12 pb-8 text-center ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-500/5 border border-gold-500/20 mb-6 animate-float" style={{ borderColor: primaryColor + '33' }}>
            {logoUrl ? (
              <img src={logoUrl} alt={restaurantName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-3xl font-bold" style={{ color: primaryColor }}>{monogram}</span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
            {t('Bienvenue chez')} {restaurantName}
          </h1>
          <p className="text-xl sm:text-2xl font-medium" style={{ color: primaryColor }}>
            {t('Table')} <span className="text-white">{tableName}</span>
          </p>
        </div>

        {recentOrder && (
          <div className={`px-4 mb-6 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => { if (slug && recentOrder.orderNumber) navigate(`/r/${slug}/order/${recentOrder.orderNumber}`); }}
              className="card-hover w-full bg-gradient-to-r from-wave-500/10 to-wave-500/5 border border-wave-500/20 rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-wave-500/20 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={18} className="text-wave-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-wave-400">{t('Reprendre ma commande')}</p>
                <p className="text-xs text-white/40 truncate">#{recentOrder.orderNumber}</p>
              </div>
              <ArrowRight size={16} className="text-wave-500 flex-shrink-0" />
            </button>
          </div>
        )}

        <div className={`px-4 mb-8 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => { if (base) navigate(`${base}/menu`); }}
            className="w-full flex items-center justify-center gap-3 py-4 text-base font-semibold bg-gold-500 text-black hover:bg-gold-600 rounded-2xl transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-gold-500/25"
          >
            {t('View Menu')} <ArrowRight size={20} />
          </button>
        </div>

        <div className={`px-4 mb-6 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <Card className="card-hover">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-wave-500 animate-pulse" />
              <span className="text-xs text-wave-400 font-medium">{t('Ouvert')}</span>
              <span className="text-xs text-white/30">·</span>
              <span className="text-xs text-white/40">{t('Estimated time: 20-30 min')}</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{t('Browse our menu and order directly from your phone.')}</p>
            {phone && (
              <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
                <Phone size={12} /> <span>{phone}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2 mt-1.5 text-xs text-white/40">
                <MapPin size={12} /> <span>{address}</span>
              </div>
            )}
          </Card>
        </div>

        <div className={`px-4 space-y-3 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => { if (base) navigate(`${base}/cart`); }}
            className="card-hover w-full bg-zinc-900/80 border border-white/5 rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={18} className="text-gold-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{t('Voir mon panier')}</p>
              <p className="text-xs text-white/40">{cartCount > 0 ? `${cartCount} ${t('items')}` : t('Your cart is empty')}</p>
            </div>
            <ArrowRight size={16} className="text-gold-500 flex-shrink-0" />
          </button>

          <button
            onClick={() => { if (base) navigate(`${base}/assistance`); }}
            className="card-hover w-full bg-zinc-900/80 border border-white/5 rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-wave-500/10 flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-wave-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{t('Appeler un serveur')}</p>
              <p className="text-xs text-white/40">{t("Besoin d'aide ?")}</p>
            </div>
            <ArrowRight size={16} className="text-wave-500 flex-shrink-0" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
