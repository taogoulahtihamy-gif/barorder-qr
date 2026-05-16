import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Clock, MapPin, Smartphone } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/formatters';
import { getRestaurants, getMenuBySlug } from '../../services/menuService';
import { useApp } from '../../context/AppContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const restaurants = await getRestaurants();
      if (cancelled) return;
      if (restaurants.length > 0) {
        const r = restaurants[0];
        setRestaurant(r);
        const slug = r.slug;
        if (slug) {
          const menu = await getMenuBySlug(slug);
          if (!cancelled && menu) {
            setProducts(menu.products || []);
            setCategories(menu.categories || []);
          }
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const brandColor = restaurant?.primary_color || '#D4AF37';
  const brandName = restaurant?.name || 'BarOrder';
  const featured = products.filter(p => p.featured);
  const catNames = categories.map(c => c.name);

  return (
    <div className="text-white">
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/5 via-transparent to-black pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-wave-500/5 blur-3xl pointer-events-none" />

        {restaurant?.logo_url && (
          <img src={restaurant.logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover mb-6 shadow-lg shadow-gold-500/10" />
        )}

        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Bienvenue chez{' '}
          <span style={{ color: brandColor }}>{brandName}</span>
        </h1>
        <p className="text-white/50 text-lg max-w-md mb-8">
          Découvrez notre menu et commandez directement depuis votre téléphone. Frais, rapide et délicieux.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/restaurants')} className="flex items-center gap-2 px-8 py-3">
            Commander maintenant <ArrowRight size={18} />
          </Button>
          <Button variant="outline" onClick={() => { const el = document.getElementById('menu-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="px-8 py-3">
            Voir le menu
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm">
          <div className="flex items-center gap-2 text-white/40">
            <Star size={16} className="text-gold-500" /> Plats frais
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Clock size={16} className="text-gold-500" /> Service rapide
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Smartphone size={16} className="text-gold-500" /> Paiement mobile
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="px-6 py-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Nos plats populaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {featured.slice(0, 4).map(item => (
              <Card key={item.id} className="text-center p-4">
                <div className="w-16 h-16 rounded-xl bg-zinc-800 mx-auto mb-3 flex items-center justify-center text-2xl overflow-hidden">
                  {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = '🍽️'; }} /> : '🍽️'}
                </div>
                <h3 className="font-medium text-sm text-white mb-1">{item.name}</h3>
                <p className="text-xs text-white/40 truncate">{item.description}</p>
                <p className="text-sm font-semibold text-gold-500 mt-2">{formatPrice(item.price)}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {catNames.length > 0 && (
        <section className="px-6 py-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Nos catégories</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {catNames.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  const slug = restaurant?.slug;
                  if (slug) navigate(`/menu/${slug}/1`);
                }}
                className="px-5 py-2 rounded-full bg-zinc-900 text-white/70 hover:text-white hover:bg-zinc-800 border border-white/10 transition-all text-sm"
              >
                {t(cat)}
              </button>
            ))}
          </div>
        </section>
      )}

      {restaurant && (
        <section className="px-6 py-12 text-center border-t border-white/5">
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm mb-2">
            <MapPin size={14} />
            <span>{restaurant.address || 'Dakar, Sénégal'}</span>
          </div>
          <p className="text-white/30 text-xs">{restaurant.phone || ''}</p>
          <Button onClick={() => navigate('/restaurants')} variant="ghost" className="mt-4">
            Voir tous les restaurants <ArrowRight size={14} className="ml-1 inline" />
          </Button>
        </section>
      )}

      <div id="menu-section" />
    </div>
  );
}