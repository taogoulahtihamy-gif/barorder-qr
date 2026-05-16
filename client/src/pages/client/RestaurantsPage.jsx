import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Phone } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getRestaurants } from '../../services/menuService';
import { useApp } from '../../context/AppContext';

export default function RestaurantsPage() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRestaurants().then(data => {
      setRestaurants(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="p-4 pb-12">
      <h1 className="text-2xl font-bold text-white mb-1">Nos restaurants</h1>
      <p className="text-sm text-white/40 mb-6">Choisissez un restaurant pour voir son menu</p>

      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <p className="text-lg">Aucun restaurant trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {restaurants.map(r => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start gap-4">
                {r.logo_url && (
                  <img src={r.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white mb-1">{r.name}</h2>
                  {r.address && (
                    <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
                      <MapPin size={12} /> {r.address}
                    </div>
                  )}
                  {r.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <Phone size={12} /> {r.phone}
                    </div>
                  )}
                  <Button
                    onClick={() => navigate(`/menu/${r.slug || r.id}/1`)}
                    className="mt-3 flex items-center gap-2 text-sm"
                  >
                    Voir le menu <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}