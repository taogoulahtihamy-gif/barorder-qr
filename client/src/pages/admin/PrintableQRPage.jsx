import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getPrintableQR } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

export default function PrintableQRPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getPrintableQR()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Erreur lors du chargement des QR codes');
        setLoading(false);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner size="lg" />;

  if (!data || !data.tables || data.tables.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40">Aucune table trouvée</p>
        <Button onClick={() => navigate('/admin/tables')} className="mt-4" variant="outline">
          <ArrowLeft size={16} className="mr-1" /> Retour aux tables
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/tables')} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">{data.restaurant.name} - QR Codes</h1>
        </div>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer size={16} /> Imprimer tous les QR
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print-cards-grid">
        {data.tables.map((table) => (
          <div
            key={table.id}
            className="qr-card bg-zinc-900 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3"
          >
            <div className="text-center">
              <p className="text-gold-500 text-xs font-bold uppercase tracking-widest">{data.restaurant.name}</p>
              <p className="text-white/50 text-[10px] mt-0.5 uppercase tracking-wide">Scannez pour commander</p>
            </div>
            <div className="bg-white rounded-xl p-2 shadow-lg">
              {table.qr_code_url ? (
                <img
                  src={table.qr_code_url}
                  alt={`QR ${table.name}`}
                  className="w-36 h-36 md:w-44 md:h-44"
                />
              ) : (
                <div className="w-36 h-36 md:w-44 md:h-44 flex items-center justify-center text-zinc-400 text-xs">
                  QR non généré
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-2xl">{table.name}</h3>
              <p className="text-white/30 text-[10px] mt-1 max-w-[180px] leading-relaxed">
                Ouvrez l'appareil photo de votre téléphone et scannez ce QR pour voir le menu et commander
              </p>
            </div>
            <p className="text-white/10 text-[8px] tracking-wider uppercase">BarOrder — Commande par QR</p>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body { background: #ffffff !important; }
          .print\\:hidden { display: none !important; }
          .print-cards-grid { gap: 0.5cm !important; }
          .qr-card {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .qr-card img { max-width: 160px !important; max-height: 160px !important; }
          .qr-card .text-gold-500 { color: #c5952e !important; }
          .qr-card .text-white { color: #111111 !important; }
          .qr-card .text-white\\/50 { color: #888888 !important; }
          .qr-card .text-white\\/30 { color: #aaaaaa !important; }
          .qr-card .text-white\\/10 { color: #cccccc !important; }
          .qr-card .bg-zinc-900 { background: #ffffff !important; }
        }
      `}</style>
    </div>
  );
}
