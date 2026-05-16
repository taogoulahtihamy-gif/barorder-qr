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
          <Printer size={16} /> Imprimer
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.tables.map((table) => (
          <div
            key={table.id}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3"
          >
            <div className="text-center">
              <p className="text-gold-500 text-xs font-medium uppercase tracking-wider">{data.restaurant.name}</p>
              <h3 className="text-white font-bold text-lg mt-1">{table.name}</h3>
              <p className="text-white/40 text-xs">N° {table.table_number}</p>
            </div>
            <div className="bg-white rounded-xl p-2">
              {table.qr_code_url ? (
                <img
                  src={table.qr_code_url}
                  alt={`QR ${table.name}`}
                  className="w-32 h-32 md:w-40 md:h-40"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center text-zinc-400 text-xs">
                  QR non généré
                </div>
              )}
            </div>
            <p className="text-white/20 text-[10px] text-center break-all font-mono max-w-full">
              {table.qrUrl}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { background: #09090b !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
