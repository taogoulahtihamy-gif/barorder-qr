import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, ArrowRight, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { callServer } from '../../services/serverCallService';
import api from '../../services/api';

export default function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { t, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [calling, setCalling] = useState(false);
  const [callCooldown, setCallCooldown] = useState(false);
  const cooldownTimer = useRef(null);

  useEffect(() => {
    setTableId(tableId);
    api.get(`/api/public/table/${tableId}`).then((res) => {
      const { table, restaurant } = res.data;
      setData({ table, restaurant });
      setRestaurant(restaurant);
      setRestaurantId(restaurant?.id || '1');
      setRestaurantSlug(restaurant?.slug || '');
      setLoading(false);
    }).catch(() => {
      setRestaurantId('1');
      setLoading(false);
    });
  }, [tableId, setTableId, setRestaurantId, setRestaurantSlug, setRestaurant]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const restaurantName = data?.restaurant?.name || 'BarOrder';
  const slug = data?.restaurant?.slug || '';
  const menuPath = slug ? `/menu/${slug}/${tableId}` : `/menu/${tableId}`;

  const handleCallServer = async () => {
    if (callCooldown) return;
    setCalling(true);
    try {
      const rid = data?.restaurant?.id || '1';
      await callServer(tableId, rid);
      toast.success('Un serveur arrive bientôt');
      setCallCooldown(true);
      cooldownTimer.current = setTimeout(() => setCallCooldown(false), 30000);
    } catch (e) {
      toast.error('Erreur lors de l\'appel');
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gold-500/10 flex items-center justify-center mb-6">
        <QrCode size={40} className="text-gold-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">{restaurantName}</h1>
      <p className="text-white/50 mb-8">{t('Table')} {tableId}</p>
      <Button onClick={() => navigate(menuPath)} className="flex items-center gap-2">
        {t('View Menu')} <ArrowRight size={18} />
      </Button>
      <div className="mt-12 space-y-3 w-full max-w-xs">
        <Card className="text-center" onClick={() => navigate(menuPath)}>
          <p className="text-sm text-white/70">🍕 {t('Browse Menu & Order')}</p>
        </Card>
        <Card
          className={`text-center ${callCooldown ? 'opacity-50' : ''}`}
          onClick={handleCallServer}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCallServer(); }}
        >
          <p className="text-sm text-white/70 flex items-center justify-center gap-2">
            <Phone size={16} />
            {calling ? '...' : t('Appeler un serveur')}
          </p>
        </Card>
      </div>
    </div>
  );
}
