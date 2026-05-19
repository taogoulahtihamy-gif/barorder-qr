import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ShoppingCart, Minus, RefreshCw, AlertTriangle, Phone, CheckCircle, Percent, Globe, ChefHat, Star, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import CartDrawer from '../../components/CartDrawer';
import { useApp } from '../../context/AppContext';
import { formatPrice } from '../../utils/formatters';
import { callServer } from '../../services/serverCallService';
import { getMenuBySlug, getPromotions } from '../../services/menuService';
import api from '../../services/api';

function ProductDetailModal({ item, onClose, onAdd, onRemove, onUpdateQty, qty }) {
  const { t } = useApp();
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md bg-zinc-900 border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex-shrink-0 flex items-center justify-center text-3xl overflow-hidden">
            {item.image_url ? (
              <img src={item.image_url} alt="" className="w-full h-full object-cover" />
            ) : '🍽️'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white">{item.name}</h3>
            {item.featured && <Badge variant="ready" className="mt-1 text-[10px] px-2 py-0.5"><Star size={10} className="mr-0.5" /> {t('Popular')}</Badge>}
          </div>
        </div>
        {item.description && (
          <p className="text-sm text-white/50 mb-4 leading-relaxed">{item.description}</p>
        )}
        <p className="text-2xl font-bold text-gold-500 mb-6">{formatPrice(item.price)}</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { if (qty <= 1) onRemove(); else onUpdateQty(qty - 1); }}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-wave-500/20 text-wave-500 hover:bg-wave-500/30 transition-colors"
          >
            <Minus size={20} />
          </button>
          <span className="text-2xl font-bold text-white w-8 text-center">{qty}</span>
          <button
            onClick={() => onAdd(item)}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-wave-500/20 text-wave-500 hover:bg-wave-500/30 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        {qty > 0 && (
          <p className="text-center text-xs text-white/40 mt-3">{qty} {qty > 1 ? t('items') : t('item')} &middot; {formatPrice(item.price * qty)}</p>
        )}
        <button
          onClick={() => { onAdd(item); onClose(); }}
          className="w-full mt-6 bg-gold-500 text-black font-semibold py-3 rounded-xl hover:bg-gold-400 transition-colors"
        >
          {qty > 0 ? t('Ajouter') : t('Add to Cart')}
        </button>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { restaurantId, restaurantSlug, slug: slugParam, tableId } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, updateQuantity, cart, cartTotal, cartCount, t, locale, toggleLanguage, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant, restaurant } = useApp();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callCooldown, setCallCooldown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cooldownTimer = useRef(null);

  const effectiveSlug = slugParam || restaurantSlug || '';

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const safeTableId = Number(tableId) || 1;
    setTableId(safeTableId);
    setRestaurantSlug(effectiveSlug);

    async function load() {
      try {
        if (effectiveSlug) {
          const result = await getMenuBySlug(effectiveSlug, tableId);
          if (cancelled) return;
          if (!result || !result.products) {
            setError(t('Impossible de charger le menu'));
            setLoading(false);
            return;
          }
          if (result.restaurant) {
            setRestaurant(result.restaurant);
            setRestaurantId(result.restaurant.id);
            setRestaurantSlug(result.restaurant.slug || effectiveSlug);
          } else {
            setRestaurantId(null);
          }
          const uniqueProducts = (result.products || []).filter(
            (p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx
          );
          setItems(uniqueProducts);
          const uniqueCats = (result.categories || []).filter(
            (c, idx, arr) => arr.findIndex(x => x.name === c.name) === idx
          );
          setCategories(['Tout', ...uniqueCats.map(c => c.name)]);
        } else {
          const tid = Number(tableId);
          let rid = Number(restaurantId);
          if (!rid && tid) {
            try {
              const tableRes = await api.get(`/api/public/table/${tid}`);
              if (!cancelled && tableRes.data?.restaurant) {
                rid = tableRes.data.restaurant.id;
                const rSlug = tableRes.data.restaurant.slug;
                setRestaurant(tableRes.data.restaurant);
                setRestaurantId(rid);
                setRestaurantSlug(rSlug || '');
              }
            } catch {}
          }
          if (!rid) rid = 1;
          const menuRes = await api.get(`/api/public/menu/${rid}`);
          if (cancelled) return;
          const data = menuRes.data;
          const rawProducts = (data.products || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price,
            category: p.category_name || '',
            image_url: p.image_url || '',
            available: p.is_available,
            is_available: p.is_available,
            featured: p.is_featured || false,
          }));
          setItems(rawProducts.filter(
            (p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx
          ));
          const rawCats = data.categories || [];
          const uniqueCats = rawCats.filter(
            (c, idx, arr) => arr.findIndex(x => x.name === c.name) === idx
          );
          setCategories(['Tout', ...uniqueCats.map(c => c.name)]);
          setRestaurantId(rid);
        }
        if (effectiveSlug && !cancelled) {
          getPromotions(effectiveSlug).then(setPromotions).catch(() => {});
        }
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('[MenuPage] load error:', err);
          setError(t('Impossible de charger le menu. Vérifiez votre connexion.'));
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [restaurantId, restaurantSlug, slugParam, tableId, effectiveSlug, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant]);

  const handleCallServer = async () => {
    if (callCooldown || calling) return;
    setCalling(true);
    try {
      const rid = restaurant?.id || restaurantId || '1';
      await callServer(tableId, rid);
      toast.success(t('Un serveur arrive bientôt'));
      setCallCooldown(true);
      cooldownTimer.current = setTimeout(() => setCallCooldown(false), 30000);
    } catch (e) {
      toast.error(t('Erreur lors de l\'appel'));
    } finally {
      setCalling(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{t('Erreur de chargement')}</h2>
        <p className="text-sm text-white/50 mb-6 max-w-xs">{error}</p>
        <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
          <RefreshCw size={16} /> {t('Réessayer')}
        </Button>
      </div>
    );
  }

  const filtered = items.filter(
    (item) =>
      (activeCategory === 'Tout' || item.category === activeCategory) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const getCartQty = (id) => {
    const found = cart.find((i) => i.id === id);
    return found ? found.quantity : 0;
  };

  const restaurantName = restaurant?.name || t('Our Menu');

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-black via-black to-transparent">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <h1 className="text-lg font-bold text-white">{restaurantName}</h1>
            <p className="text-xs text-white/40">{t('Table')} {tableId}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCallServer}
              disabled={callCooldown}
              className={`p-2 rounded-xl transition-colors ${
                callCooldown ? 'text-wave-500/50' : 'text-white/60 hover:text-wave-500 hover:bg-white/5'
              }`}
              title={callCooldown ? t('Serveur appelé') : t('Appeler un serveur')}
            >
              {callCooldown ? <CheckCircle size={20} /> : <Phone size={20} />}
            </button>
            <button onClick={toggleLanguage} className="p-2 text-white/40 hover:text-gold-500 transition-colors text-xs font-medium" title={t('Language')}>
              <Globe size={18} className="inline" />
              <span className="ml-0.5">{locale === 'fr' ? 'EN' : 'FR'}</span>
            </button>
            <button onClick={() => setCartOpen(true)} className="relative p-2 text-white/60 hover:text-gold-500 transition-colors" title={t('View Cart')}>
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search menu...')}
            className="w-full bg-zinc-900/80 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 transition-colors"
          />
        </div>

        {promotions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gold-500 flex items-center gap-1.5">
              <Percent size={14} /> {t('Offres du moment')}
            </h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
              {promotions.map((promo) => (
                <div key={promo.id ?? Math.random()} className="flex-shrink-0 w-64 bg-gradient-to-br from-gold-500/10 to-zinc-900 border border-gold-500/20 rounded-xl p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm">{promo.title || t('Promotion')}</h3>
                      {promo.description && <p className="text-white/40 text-xs mt-1 line-clamp-2">{promo.description}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gold-500 font-bold text-sm">{formatPrice(promo.price)}</span>
                        {promo.old_price != null && Number(promo.old_price) > 0 && (
                          <span className="text-white/30 line-through text-[11px]">{formatPrice(promo.old_price)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          addToCart({
                            id: `promo-${promo.id ?? Date.now()}`,
                            name: promo.title || 'Promotion',
                            price: Number(promo.price) || 0,
                            description: promo.description || '',
                            is_promotion: true,
                          });
                          toast.success(t('Offre ajoutée au panier'));
                        }}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-600 transition-colors"
                      >
                        {t('Commander')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm whitespace-nowrap font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'
                  : 'bg-zinc-900/80 text-white/50 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/30">
              <Search size={32} className="mb-3 opacity-30" />
              <p className="text-sm">{t('Aucun produit')}</p>
            </div>
          )}
          {filtered.map((item) => {
            const qty = getCartQty(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-zinc-900/60 border border-white/5 rounded-2xl p-3 transition-all duration-200 hover:border-gold-500/20 active:scale-[0.99]"
              >
                <div
                  className="w-16 h-16 rounded-xl bg-zinc-800 flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProduct(item)}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : '🍽️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-medium text-white text-sm truncate cursor-pointer"
                      onClick={() => setSelectedProduct(item)}
                    >
                      {item.name}
                    </h3>
                    {item.featured && (
                      <Badge variant="ready" className="text-[9px] px-1.5 py-0 min-h-[18px]">
                        <Star size={8} className="mr-0.5" /> {t('Popular')}
                      </Badge>
                    )}
                    {!item.available && <Badge variant="cancelled" className="text-[9px] px-1.5 py-0 min-h-[18px]">{t('Unavailable')}</Badge>}
                  </div>
                  {item.description && (
                    <p className="text-xs text-white/40 truncate mt-0.5">{item.description}</p>
                  )}
                  <p className="text-sm font-bold text-gold-500 mt-1">{formatPrice(item.price)}</p>
                </div>
                {item.available && qty > 0 ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { if (qty <= 1) removeFromCart(item.id); else updateQuantity(item.id, qty - 1); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-wave-500/20 text-wave-500 hover:bg-wave-500/30 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-white font-medium text-xs w-5 text-center">{qty}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-wave-500/20 text-wave-500 hover:bg-wave-500/30 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { if (item.available) addToCart(item); }}
                    disabled={!item.available}
                    className={`p-2 rounded-xl transition-colors ${
                      item.available
                        ? 'bg-wave-500/10 text-wave-500 hover:bg-wave-500/20'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe bg-black/95 backdrop-blur-lg border-t border-white/10">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-center gap-3 bg-gold-500 text-black font-semibold py-3.5 rounded-xl hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
          >
            <ShoppingCart size={18} />
            <span>{cartCount} {cartCount > 1 ? t('items') : t('item')}</span>
            <span className="w-px h-5 bg-black/20" />
            <span className="font-bold">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      <ProductDetailModal
        item={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
        onRemove={() => removeFromCart(selectedProduct.id)}
        onUpdateQty={(q) => updateQuantity(selectedProduct.id, q)}
        qty={selectedProduct ? getCartQty(selectedProduct.id) : 0}
      />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}