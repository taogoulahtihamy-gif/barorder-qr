import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Phone, MapPin, Clock, ChefHat, ShoppingBag, Bell } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

export default function TableSlugPage() {
  const { restaurantSlug, tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
    setTableId(tableId);
    api.get(`/public/table/${tableId}`).then((res) => {
      const { table, restaurant } = res.data;
      setData({ table, restaurant });
      setRestaurant(restaurant);
      setRestaurantId(restaurant?.id || '1');
      setRestaurantSlug(restaurant?.slug || '');
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    }).catch(() => {
      setRestaurantId('1');
      setRestaurantSlug(restaurantSlug);
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    });
  }, [tableId, restaurantSlug, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant]);

  if (loading) return <LoadingSpinner size="lg" />;

  const restaurantName = data?.restaurant?.name || 'BarOrder Restaurant';
  const tableName = data?.table?.table_number || `Table ${tableId}`;
  const slug = data?.restaurant?.slug || restaurantSlug;
  const logoUrl = data?.restaurant?.logo_url || '';
  const phone = data?.restaurant?.phone || '';
  const address = data?.restaurant?.address || '';
  const menuPath = slug ? `/r/${slug}/menu/${tableId}` : `/menu/${tableId}`;

  const handleMenu = () => {
    navigate(menuPath);
  };

  const handleServerCall = () => {
    navigate('/server-call');
  };

  const handleOrders = () => {
    if (recentOrder) {
      navigate(`/r/${slug}/order/${recentOrder.orderNumber}`);
    }
  };

  const handleCart = () => {
    navigate(`/r/${slug}/menu/${tableId}?cart=1`);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201, 149, 46, 0.15); }
          50% { box-shadow: 0 0 40px rgba(201, 149, 46, 0.3); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
        .btn-premium {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .btn-premium::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.08), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .btn-premium:hover::after {
          transform: translateX(100%);
        }
        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(201, 149, 46, 0.25);
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }
        @media (max-width: 640px) {
          .hide-on-mobile { display: none; }
        }
        @media (min-width: 641px) {
          .show-on-mobile { display: none; }
        }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,149,46,0.06),_transparent_70%)]" />
      <div className="absolute inset-0 animate-shimmer pointer-events-none" />

      <div className="relative z-10 pb-24">
        <div className={`px-4 pt-12 pb-8 text-center ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-500/5 border border-gold-500/20 mb-6 animate-float animate-glow">
            {logoUrl ? (
              <img src={logoUrl} alt={restaurantName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <ChefHat size={36} className="text-gold-500" />
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
            {restaurantName}
          </h1>
          <p className="text-xl sm:text-2xl text-gold-500 font-medium">
            {t('Bienvenue à la')} <span className="text-white">{tableName}</span>
          </p>
        </div>

        {recentOrder && (
          <div className={`px-4 mb-6 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <button
              onClick={handleOrders}
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
          <Button
            onClick={handleMenu}
            className="btn-premium w-full flex items-center justify-center gap-3 py-4 text-base font-semibold bg-gold-500 text-black hover:bg-gold-600 rounded-2xl"
          >
            {t('Voir le menu')} <ArrowRight size={20} />
          </Button>
        </div>

        {phone || address ? (
          <div className={`px-4 mb-6 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <Card className="card-hover">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-wave-500 animate-pulse" />
                <span className="text-xs text-wave-400 font-medium">{t('Ouvert')}</span>
                <span className="text-xs text-white/30">·</span>
                <span className="text-xs text-white/40">{t('Préparation')}: 20-30 min</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {t('Découvrez notre menu et commandez directement depuis votre table. Plats préparés avec des ingrédients frais et de saison.')}
              </p>
              {phone && (
                <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
                  <Phone size={12} />
                  <span>{phone}</span>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-2 mt-1.5 text-xs text-white/40">
                  <MapPin size={12} />
                  <span>{address}</span>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className={`px-4 mb-6 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <Card className="card-hover">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-wave-500 animate-pulse" />
                <span className="text-xs text-wave-400 font-medium">{t('Ouvert')}</span>
                <span className="text-xs text-white/30">·</span>
                <span className="text-xs text-white/40">{t('Préparation')}: 20-30 min</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {t('Découvrez notre menu et commandez directement depuis votre table. Plats préparés avec des ingrédients frais et de saison.')}
              </p>
            </Card>
          </div>
        )}

        <div className={`px-4 space-y-3 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <button
            onClick={handleMenu}
            className="card-hover btn-premium w-full bg-zinc-900/80 border border-white/5 rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <ChefHat size={18} className="text-gold-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{t('Parcourir le menu')}</p>
              <p className="text-xs text-white/40">{t('Commandez vos plats préférés')}</p>
            </div>
            <ArrowRight size={16} className="text-gold-500 flex-shrink-0" />
          </button>

          <button
            onClick={handleServerCall}
            className="card-hover btn-premium w-full bg-zinc-900/80 border border-white/5 rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer"
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

      <div className="show-on-mobile fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-t border-white/10 px-2 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button onClick={handleMenu} className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-white/60 hover:text-gold-500 transition-colors">
            <ChefHat size={20} />
            <span className="text-[10px] font-medium">{t('Menu')}</span>
          </button>
          <button onClick={handleCart} className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-white/60 hover:text-gold-500 transition-colors relative">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 right-2 w-4 h-4 rounded-full bg-gold-500 text-[9px] font-bold text-black flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span className="text-[10px] font-medium">{t('Panier')}</span>
          </button>
          <button onClick={handleServerCall} className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-white/60 hover:text-gold-500 transition-colors">
            <Bell size={20} />
            <span className="text-[10px] font-medium">{t('Assistance')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
