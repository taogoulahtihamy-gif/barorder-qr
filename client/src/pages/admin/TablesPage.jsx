import { useEffect, useState } from 'react';
import { Plus, QrCode, Download, Trash2, X, RefreshCw, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getTables, createTable, deleteTable, generateTableQR } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const { t } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getTables().then((result) => {
      setTables(result);
      setLoading(false);
    });
  }, []);

  const refreshList = () => {
    getTables().then((result) => setTables(result));
  };

  const handleAdd = async () => {
    if (!newTableName.trim()) return;
    try {
      await createTable({ name: newTableName, capacity: parseInt(newCapacity) });
      setModalOpen(false);
      setNewTableName('');
      setNewCapacity(4);
      refreshList();
      toast.success('Table créée');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    try {
      await deleteTable(id);
      refreshList();
      toast.success('Table supprimée');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleGenerateQR = async (table) => {
    setGeneratingId(table.id);
    try {
      const result = await generateTableQR(table.id);
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, qr_url: result.qr_code_url, qrUrl: result.qrUrl } : t));
      if (qrModal?.id === table.id) {
        setQrModal(prev => ({ ...prev, qr_url: result.qr_code_url, qrUrl: result.qrUrl }));
      }
      toast.success('QR code généré');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erreur lors de la génération du QR');
    }
    setGeneratingId(null);
  };

  const absoluteUrl = (table) => {
    const path = table.qrUrl || `/r/${table.slug || 'restaurant'}/table/${table.id}`;
    return `${window.location.origin}${path}`;
  };

  const qrImageSrc = (table) => {
    if (table.qr_url && table.qr_url.startsWith('data:image/')) {
      return table.qr_url;
    }
    return '';
  };

  const downloadQR = (table) => {
    const src = qrImageSrc(table);
    if (!src) {
      toast.error('Générez d\'abord le QR code');
      return;
    }
    const link = document.createElement('a');
    link.download = `${table.name}-qr.png`;
    link.href = src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('Tables')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/tables/printable-qr')} className="flex items-center gap-1">
            <Printer size={16} /> {t('Imprimer QR')}
          </Button>
          <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1">
            <Plus size={16} /> {t('Add')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map((table) => (
          <Card key={table.id}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-white">{table.name}</h3>
              <Badge variant={table.status === 'free' ? 'delivered' : 'pending'}>{t(table.status)}</Badge>
            </div>
            <p className="text-xs text-white/40 mb-3">{t('Capacity')}: {table.capacity} {t('people')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setQrModal(table)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-white/5 rounded-lg text-white/60 hover:text-gold-500 transition-colors"
              >
                <QrCode size={14} /> {t('QR')}
              </button>
              <button
                onClick={() => handleGenerateQR(table)}
                disabled={generatingId === table.id}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-white/5 rounded-lg text-white/60 hover:text-blue-400 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={14} className={generatingId === table.id ? 'animate-spin' : ''} /> {t('Générer QR')}
              </button>
              <button
                onClick={() => handleDelete(table.id, table.name)}
                className="flex items-center justify-center px-2 py-1.5 text-xs bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <h2 className="text-lg font-bold text-white mb-4">{t('Add Table')}</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">{t('Numéro / nom de la table')}</label>
              <input placeholder={t('Exemple : Table 4, VIP 1, Terrasse 2')} value={newTableName} onChange={(e) => setNewTableName(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">{t('Capacity')}</label>
              <input placeholder={t('Nombre de personnes')} type="number" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} className="flex-1">{t('Save')}</Button>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('Cancel')}</Button>
            </div>
          </div>
        </Modal>
      )}

      {qrModal && (
        <Modal onClose={() => setQrModal(null)}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-bold text-white">{qrModal.name}</h2>
              <button onClick={() => setQrModal(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            {qrModal.restaurant_name && (
              <p className="text-sm text-gold-500 font-medium">{qrModal.restaurant_name}</p>
            )}
            <div className="bg-white rounded-2xl p-4">
              {qrImageSrc(qrModal) ? (
                <img
                  src={qrImageSrc(qrModal)}
                  alt={`QR for ${qrModal.name}`}
                  className="w-56 h-56"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-white/20 text-sm">
                  {t('Aucun QR')}
                </div>
              )}
            </div>
            <div className="text-center text-sm text-white/60 space-y-1">
              <p><span className="text-white/80">{t('Table')}:</span> {qrModal.name}</p>
              <p><span className="text-white/80">{t('Numéro')}:</span> {qrModal.table_number || qrModal.name}</p>
            </div>
            <p className="text-sm text-white/40 text-center break-all max-w-xs font-mono">
              {absoluteUrl(qrModal)}
            </p>
            <div className="flex gap-3 w-full pt-2">
              <Button
                onClick={() => handleGenerateQR(qrModal)}
                disabled={generatingId === qrModal.id}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={generatingId === qrModal.id ? 'animate-spin' : ''} /> {t('Générer QR')}
              </Button>
              <Button
                onClick={() => { downloadQR(qrModal); }}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download size={16} /> {t('Download QR')}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => {
              navigator.clipboard.writeText(absoluteUrl(qrModal));
              toast.success('Lien copié');
            }} className="w-full">
              Copier le lien
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}