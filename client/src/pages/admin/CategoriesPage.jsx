import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/adminService';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0, active: true });
  const { t } = useApp();

  useEffect(() => {
    setLoading(true);
    getCategories().then((result) => {
      setCategories(result);
      setLoading(false);
    });
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', sort_order: 0, active: true });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ ...cat, sort_order: cat.sort_order || 0 });
    setModalOpen(true);
  };

  const refreshList = () => {
    getCategories().then((result) => setCategories(result));
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 };
      if (editing) {
        await updateCategory(editing.id, payload);
      } else {
        await createCategory(payload);
      }
      setModalOpen(false);
      refreshList();
      toast.success(editing ? t('Catégorie modifiée') : t('Catégorie créée'));
    } catch (e) {
      toast.error(e?.response?.data?.error || t('Erreur lors de l\'enregistrement'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('Supprimer cette catégorie ?'))) return;
    try {
      await deleteCategory(id);
      refreshList();
      toast.success(t('Catégorie supprimée'));
    } catch (e) {
      toast.error(e?.response?.data?.error || t('Erreur lors de la suppression'));
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('Categories')}</h1>
        <Button onClick={openAdd} className="flex items-center gap-1">
          <Plus size={16} /> {t('Add')}
        </Button>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white text-sm">{cat.name}</h3>
                {!cat.active && <span className="text-xs text-white/30">({t('Inactive')})</span>}
              </div>
              <p className="text-xs text-white/40">{cat.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(cat)} className="p-1.5 text-white/40 hover:text-wave-500 transition-colors">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <h2 className="text-lg font-bold text-white mb-4">{editing ? t('Edit Category') : t('Add Category')}</h2>
          <div className="space-y-3">
            <input placeholder={t('Name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
            <input placeholder={t('Description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
            <input placeholder={t('Sort order')} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded bg-zinc-900 border-white/20 text-wave-500" />
              {t('Active')}
            </label>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">{t('Save')}</Button>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('Cancel')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
