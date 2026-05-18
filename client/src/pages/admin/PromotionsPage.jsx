import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Tag, Check, X, Calendar, DollarSign } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', price: '', old_price: '',
    start_date: '', end_date: '', is_active: true,
  });

  const fetchPromotions = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/promotions');
      setPromotions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[PromotionsPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', price: '', old_price: '', start_date: '', end_date: '', is_active: true });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description || '',
      price: String(p.price),
      old_price: p.old_price ? String(p.old_price) : '',
      start_date: p.start_date ? p.start_date.slice(0, 10) : '',
      end_date: p.end_date ? p.end_date.slice(0, 10) : '',
      is_active: p.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
    };
    if (!payload.title || !payload.price) { toast.error('Titre et prix requis'); return; }
    try {
      if (editing) {
        await api.patch(`/api/admin/promotions/${editing.id}`, payload);
        toast.success('Promotion mise a jour');
      } else {
        await api.post('/api/admin/promotions', payload);
        toast.success('Promotion creee');
      }
      setModalOpen(false);
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const toggleActive = async (p) => {
    try {
      await api.patch(`/api/admin/promotions/${p.id}/status`, { is_active: !p.is_active });
      toast.success(p.is_active ? 'Promotion desactivee' : 'Promotion activee');
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer la promotion "${p.title}" ?`)) return;
    try {
      await api.delete(`/api/admin/promotions/${p.id}`);
      toast.success('Promotion supprimee');
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Promotions</h1>
        <Button variant="gold" onClick={openCreate} className="flex items-center gap-2">
          <Plus size={18} /> Ajouter
        </Button>
      </div>

      <div className="grid gap-4">
        {promotions.length === 0 && (
          <Card><p className="text-white/30 text-center py-8">Aucune promotion</p></Card>
        )}
        {promotions.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={16} className="text-gold-500 flex-shrink-0" />
                  <h3 className="text-white font-semibold truncate">{p.title}</h3>
                  {p.is_active ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Actif</span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Inactif</span>
                  )}
                </div>
                {p.description && <p className="text-white/50 text-sm mb-2">{p.description}</p>}
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="text-white/80 font-medium">{Number(p.price).toLocaleString('fr-FR')} FCFA</span>
                  {p.old_price && (
                    <span className="text-white/30 line-through text-xs">{Number(p.old_price).toLocaleString('fr-FR')} FCFA</span>
                  )}
                  {(p.start_date || p.end_date) && (
                    <span className="text-white/30 text-xs flex items-center gap-1">
                      <Calendar size={12} />
                      {p.start_date ? p.start_date.slice(0, 10) : '...'} → {p.end_date ? p.end_date.slice(0, 10) : '...'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => toggleActive(p)}
                  className={`p-2 rounded-lg transition-colors ${p.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                  title={p.is_active ? 'Desactiver' : 'Activer'}
                >
                  {p.is_active ? <X size={14} /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                  title="Modifier"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Supprimer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier la promotion" : 'Ajouter une promotion'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="space-y-1.5">
            <label className="text-sm text-white/60">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white resize-none focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prix (FCFA)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input label="Ancien prix" type="number" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date debut" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="Date fin" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/60">Active</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-emerald-500' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="gold">{editing ? 'Enregistrer' : 'Creer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
