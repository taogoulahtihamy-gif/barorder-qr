import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ShoppingCart, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import CartDrawer from '../../components/CartDrawer';
import { useApp } from '../../context/AppContext';
import { formatPrice } from '../../utils/formatters';
import { getMenuBySlug } from '../../services/menuService';
import api from '../../services/api';

export default function MenuPage() {
  const { restaurantId, restaurantSlug, slug: slugParam, tableId } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, updateQuantity, cart, cartTotal, cartCount, t, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant } = useApp();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const effectiveSlug = slugParam || restaurantSlug || '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTableId(tableId);
    setRestaurantSlug(effectiveSlug);

    async function load() {
      try {
        if (effectiveSlug) {
          const result = await getMenuBySlug(effectiveSlug);
          if (cancelled) return;
          if (!result || !result.products) {
            setError('Impossible de charger le menu');
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
              const tableRes = await api.get(`/public/table/${tid}`);
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
          const menuRes = await api.get(`/public/menu/${rid}`);
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
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('[MenuPage] load error:', err);
          setError('Impossible de charger le menu. Vérifiez votre connexion.');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [restaurantId, restaurantSlug, slugParam, tableId, effectiveSlug, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant]);

  if (loading) return <LoadingSpinner size="lg" />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Erreur de chargement</h2>
        <p className="text-sm text-white/50 mb-6 max-w-xs">{error}</p>
        <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
          <RefreshCw size={16} /> Réessayer
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

  return (
    <div className="p-4 pb-28">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">{t('Our Menu')}</h1>
        <p className="text-sm text-white/40">{t('Table')} {tableId}</p>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search menu...')}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold-500/50"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeCategory === cat ? 'bg-gold-500 text-black' : 'bg-zinc-900 text-white/60 hover:text-white'
            }`}
          >
            {t(cat)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item) => {
          const qty = getCartQty(item.id);
          return (
            <Card key={item.id} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-zinc-800 flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = '🍽️'; }} />
                ) : '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-white text-sm">{item.name}</h3>
                  {!item.available && <Badge variant="cancelled">{t('Unavailable')}</Badge>}
                </div>
                <p className="text-xs text-white/40 truncate">{item.description}</p>
                <p className="text-sm font-semibold text-gold-500 mt-1">{formatPrice(item.price)}</p>
              </div>
              {item.available && qty > 0 ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { if (qty <= 1) removeFromCart(item.id); else updateQuantity(item.id, qty - 1); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-wave-500/20 text-wave-500 hover:bg-wave-500/30 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-white font-medium text-sm w-5 text-center">{qty}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-wave-500/20 text-wave-500 hover:bg-wave-500/30 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { addToCart(item); }}
                  disabled={!item.available}
                  className={`p-2 rounded-xl transition-colors ${
                    item.available
                      ? 'bg-wave-500/10 text-wave-500 hover:bg-wave-500/20'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  <Plus size={20} />
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur border-t border-white/10">
          <Button onClick={() => setCartOpen(true)} className="w-full flex items-center justify-center gap-3">
            <ShoppingCart size={18} />
            <span>{cartCount} {cartCount > 1 ? t('items') : t('item')}</span>
            <span className="w-px h-5 bg-white/20" />
            <span className="font-bold">{formatPrice(cartTotal)}</span>
          </Button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}