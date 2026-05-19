import { useNavigate } from 'react-router-dom';
import { Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/Button';
import BottomNav from '../../components/BottomNav';
import { useApp } from '../../context/AppContext';
import { callServer } from '../../services/serverCallService';

export default function ServerCallPage() {
  const navigate = useNavigate();
  const { tableId, restaurantId, t, restaurantSlug } = useApp();
  const [called, setCalled] = useState(false);
  const [loading, setLoading] = useState(false);
  const base = restaurantSlug && tableId ? `/r/${restaurantSlug}/table/${tableId}` : '';

  const handleCall = async () => {
    setLoading(true);
    try {
      await callServer(tableId || '1', restaurantId || '1');
    } catch (e) {
      setLoading(false);
      return;
    }
    setLoading(false);
    setCalled(true);
    setTimeout(() => setCalled(false), 5000);
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        {called ? (
          <>
            <div className="w-20 h-20 rounded-full bg-wave-500/10 flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-wave-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{t('Un serveur a été appelé')}</h1>
            <p className="text-white/50 mb-8">{t('A server has been called to your table.')}</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-gold-500/10 flex items-center justify-center mb-6">
              <Phone size={40} className="text-gold-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{t('Need Assistance?')}</h1>
            <p className="text-white/50 mb-8">{t('Call a server to your table.')}</p>
            <Button onClick={handleCall} disabled={loading} className="flex items-center gap-2 text-lg px-8 py-3">
              <Phone size={20} /> {loading ? t('Calling...') : t('Call Server')}
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={() => { if (base) navigate(`${base}/menu`); else navigate(-1); }} className="mt-6">
          <ArrowLeft size={16} className="mr-1" /> {t('Go Back')}
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
