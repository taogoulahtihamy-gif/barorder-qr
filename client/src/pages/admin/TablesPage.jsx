import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, QrCode, Download, Trash2, X, RefreshCw, Printer, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getTables, createTable, deleteTable, generateTableQR, updateTableStatus } from '../../services/adminService';
import { connectSocket, onTableStatusUpdated } from '../../services/socketService';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['available', 'occupied', 'reserved', 'cleaning', 'inactive'];

const STATUS_VARIANTS = {
  available: 'delivered',
  occupied: 'pending',
  waiting_payment: 'accepted',
  reserved: 'preparing',
  cleaning: 'default',
  inactive: 'cancelled',
};

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [statusDropdown, setStatusDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [mobileStatusSheet, setMobileStatusSheet] = useState(null);
  const { t } = useApp();
  const navigate = useNavigate();

  const openDropdown = (tableId, e) => {
    if (window.innerWidth < 640) {
      setMobileStatusSheet((prev) => (prev === tableId ? null : tableId));
    } else {
      if (statusDropdown === tableId) {
        setStatusDropdown(null);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
      setStatusDropdown(tableId);
    }
  };

  useEffect(() => {
    setLoading(true);
    getTables().then((result) => {
      setTables(result);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    const unsub = socket ? onTableStatusUpdated((data) => {
      setTables((prev) => prev.map(t =>
        t.id === data.tableId ? { ...t, status: data.status } : t
      ));
    }) : () => {};
    return unsub;
  }, []);

  const refreshList = useCallback(() => {
    getTables().then((result) => setTables(result));
  }, []);

  const handleAdd = async () => {
    if (!newTableName.trim()) return;
    try {
      await createTable({ name: newTableName, capacity: parseInt(newCapacity) });
      setModalOpen(false);
      setNewTableName('');
      setNewCapacity(4);
      refreshList();
      toast.success(t('Table créée'));
    } catch (e) {
      toast.error(e?.response?.data?.error || t("Erreur lors de l'ajout"));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${t('Supprimer')} ${name} ?`)) return;
    try {
      await deleteTable(id);
      refreshList();
      toast.success(t('Table supprimée'));
    } catch (e) {
      toast.error(e?.response?.data?.error || t('Erreur lors de la suppression'));
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
      toast.success(t('QR code généré'));
    } catch (e) {
      toast.error(e?.response?.data?.error || t("Erreur lors de la génération du QR"));
    }
    setGeneratingId(null);
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await updateTableStatus(tableId, newStatus);
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: newStatus } : t));
      toast.success(t('Statut mis à jour'));
    } catch (e) {
      toast.error(e?.response?.data?.error || t('Erreur de mise à jour'));
    }
    setStatusDropdown(null);
    setMobileStatusSheet(null);
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
      toast.error(t("Génère d'abord le QR code"));
      return;
    }
    const link = document.createElement('a');
    link.download = `${table.name}-qr.png`;
    link.href = src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printTableCard = (table) => {
    const src = qrImageSrc(table);
    if (!src) {
      toast.error(t("Génère d'abord le QR code"));
      return;
    }
    const restaurantName = table.restaurant_name || 'BarOrder';
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head><title>${table.name} - QR Card</title>
      <style>
        @page { margin: 0; size: 80mm 80mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; text-align: center; background: #fff; }
        .restaurant-name { font-size: 14px; font-weight: 700; color: #c5952e; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
        .scan-text { font-size: 11px; color: #666; margin-bottom: 12px; }
        .qr-img { width: 200px; height: 200px; display: block; margin-bottom: 12px; }
        .table-number { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 6px; }
        .instructions { font-size: 9px; color: #999; max-width: 220px; line-height: 1.5; }
        .branding { font-size: 8px; color: #ccc; margin-top: 12px; letter-spacing: 0.5px; }
      </style>
      </head>
      <body>
        <div class="restaurant-name">${restaurantName}</div>
        <div class="scan-text">Scannez pour commander</div>
        <img class="qr-img" src="${src}" />
        <div class="table-number">${table.name}</div>
        <div class="instructions">Ouvrez l'appareil photo de votre téléphone et scannez ce QR pour voir le menu et commander</div>
        <div class="branding">BarOrder &mdash; Commande par QR</div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map((table) => (
          <Card key={table.id}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {qrImageSrc(table) ? (
                  <img
                    src={qrImageSrc(table)}
                    alt={`QR ${table.name}`}
                    className="w-16 h-16 rounded-lg cursor-pointer hover:ring-2 hover:ring-gold-500/50 transition-all"
                    onClick={() => setQrModal(table)}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors"
                    onClick={() => setQrModal(table)}
                  >
                    <QrCode size={24} className="text-white/20" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
                  <h3 className="font-medium text-white truncate">{table.name}</h3>
                  <div className="relative flex-shrink-0 self-start sm:self-auto">
                    <button
                      onClick={(e) => openDropdown(table.id, e)}
                      className="flex items-center gap-1"
                      title={t('Status change')}
                    >
                      <Badge variant={STATUS_VARIANTS[table.status] || 'default'}>{t(table.status)}</Badge>
                      <ChevronDown size={12} className="text-white/30 flex-shrink-0" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-0.5">{t('Capacity')}: {table.capacity} {t('people')}</p>
                {table.qrUrl && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(absoluteUrl(table)); toast.success(t('Lien copié')); }}
                    className="text-[11px] text-gold-500/50 hover:text-gold-500 truncate max-w-full block mt-1 transition-colors text-left"
                  >
                    {absoluteUrl(table)}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setQrModal(table)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-white/5 rounded-lg text-white/50 hover:text-gold-500 transition-colors"
              >
                <QrCode size={12} /> QR
              </button>
              <button
                onClick={() => downloadQR(table)}
                disabled={!qrImageSrc(table)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-white/5 rounded-lg text-white/50 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download size={12} /> PNG
              </button>
              <button
                onClick={() => printTableCard(table)}
                disabled={!qrImageSrc(table)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-white/5 rounded-lg text-white/50 hover:text-gold-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Printer size={12} /> {t('Imprimer')}
              </button>
              <button
                onClick={() => handleGenerateQR(table)}
                disabled={generatingId === table.id}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-white/5 rounded-lg text-white/50 hover:text-blue-400 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={12} className={generatingId === table.id ? 'animate-spin' : ''} /> QR
              </button>
              <button
                onClick={() => handleDelete(table.id, table.name)}
                className="flex items-center justify-center px-2 py-1 text-[11px] bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
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
              toast.success(t('Lien copié'));
            }} className="w-full">
              {t('Copier le lien')}
            </Button>
          </div>
        </Modal>
      )}

      {statusDropdown && createPortal(
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setStatusDropdown(null)}
        >
          <div
            style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
            className="absolute bg-zinc-800 border border-white/10 rounded-xl py-1 shadow-2xl min-w-[160px] max-h-[320px] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map((opt) => {
              const table = tables.find(t => t.id === statusDropdown);
              return (
                <button
                  key={opt}
                  onClick={() => handleStatusChange(statusDropdown, opt)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5 flex items-center justify-between ${
                    table?.status === opt ? 'text-gold-500' : 'text-white/70'
                  }`}
                >
                  <span>{t(opt)}</span>
                  {table?.status === opt && <Check size={14} className="text-gold-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {mobileStatusSheet && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:hidden"
          onClick={() => setMobileStatusSheet(null)}
        >
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileStatusSheet(null)} />
          <div
            className="relative w-full bg-zinc-900 border-t border-white/10 rounded-t-2xl p-4 pb-safe animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="text-white font-medium text-center mb-4">
              {t('Status')} - {tables.find(t => t.id === mobileStatusSheet)?.name}
            </h3>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto safe-bottom">
              {STATUS_OPTIONS.map((opt) => {
                const table = tables.find(t => t.id === mobileStatusSheet);
                return (
                  <button
                    key={opt}
                    onClick={() => handleStatusChange(mobileStatusSheet, opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors hover:bg-white/5 flex items-center justify-between ${
                      table?.status === opt ? 'text-gold-500 bg-gold-500/5' : 'text-white/70'
                    }`}
                  >
                    <span>{t(opt)}</span>
                    {table?.status === opt && <Check size={16} className="text-gold-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setMobileStatusSheet(null)}
              className="w-full mt-4 py-3 text-sm text-white/50 hover:text-white transition-colors bg-white/5 rounded-xl text-center"
            >
              {t('Cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
