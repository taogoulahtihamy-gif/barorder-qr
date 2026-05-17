import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getServerCalls, updateServerCallStatus } from '../../services/adminService';
import { connectSocket, onNewServerCall, onServerCallUpdated } from '../../services/socketService';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'text-yellow-400', variant: 'pending' },
  acknowledged: { label: 'Accepté', color: 'text-blue-400', variant: 'preparing' },
  resolved: { label: 'Résolu', color: 'text-green-400', variant: 'delivered' },
};

export default function ServerCallsPage() {
  const { t } = useApp();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const refresh = useCallback(async () => {
    try {
      const result = await getServerCalls(filter || undefined);
      setCalls(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('[ServerCallsPage] refresh failed:', err);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    const socket = connectSocket();
    const unsub1 = socket ? onNewServerCall(refresh) : () => {};
    const unsub2 = socket ? onServerCallUpdated(refresh) : () => {};
    return () => {
      unsub1();
      unsub2();
    };
  }, [refresh]);

  const handleAcknowledge = async (id) => {
    try {
      await updateServerCallStatus(id, 'acknowledged');
      toast.success('Appel accepté');
      refresh();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleResolve = async (id) => {
    try {
      await updateServerCallStatus(id, 'resolved');
      toast.success('Appel résolu');
      refresh();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const filters = ['', 'pending', 'acknowledged', 'resolved'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Appels serveur</h1>
          <span className="text-sm text-white/30">{calls.length} appel{calls.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter size={16} className="text-white/30 flex-shrink-0" />
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              filter === f ? 'bg-gold-500 text-black font-medium' : 'bg-zinc-800 text-white/60 hover:text-white'
            }`}
          >
            {f ? STATUS_CONFIG[f]?.label || f : 'Tous'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {calls.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/30 text-sm">Aucun appel serveur</p>
          </div>
        ) : (
          calls.map((call) => {
            const cfg = STATUS_CONFIG[call.status] || STATUS_CONFIG.pending;
            return (
              <Card key={call.id}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    call.status === 'pending' ? 'bg-yellow-500/10' :
                    call.status === 'acknowledged' ? 'bg-blue-500/10' : 'bg-green-500/10'
                  }`}>
                    <Bell size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">Table {call.tableNumber || call.tableId}</span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    {call.message && (
                      <p className="text-xs text-white/50 mb-0.5">{call.message}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                      <Clock size={12} />
                      <span>{new Date(call.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {call.status === 'pending' && (
                      <Button
                        variant="primary"
                        className="text-xs px-3 py-1.5"
                        onClick={() => handleAcknowledge(call.id)}
                      >
                        <CheckCircle size={14} className="mr-1" /> Accepter
                      </Button>
                    )}
                    {call.status !== 'resolved' && (
                      <Button
                        variant="ghost"
                        className="text-xs px-3 py-1.5 text-white/50 hover:text-white"
                        onClick={() => handleResolve(call.id)}
                      >
                        <XCircle size={14} className="mr-1" /> Résoudre
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
