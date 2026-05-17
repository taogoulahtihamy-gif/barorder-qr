import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getProducts, createProduct, updateProduct, deleteProduct, toggleProductAvailability, getCategories } from '../../services/adminService';
import { formatCurrency } from '../../utils/formatters';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', category_id: '', image_url: '', available: true, featured: false });
  const { t } = useApp();

  useEffect(() => {
    setLoading(true);
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(Array.isArray(prods) ? prods : []);
        setCategories(Array.isArray(cats) ? cats : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[ProductsPage] Failed to load:', err);
        setLoading(false);
      });
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category: '', category_id: '', image_url: '', available: true, featured: false });
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({ ...product, category_id: product.category_id || '', price: String(product.price) });
    setModalOpen(true);
  };

  const refreshList = () => {
    getProducts().then((result) => setProducts(result));
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      setModalOpen(false);
      refreshList();
      toast.success(editing ? 'Produit modifié' : 'Produit créé');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await deleteProduct(id);
      refreshList();
      toast.success('Produit supprimé');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await toggleProductAvailability(id);
      refreshList();
      toast.success('Disponibilité modifiée');
    } catch (e) {
      toast.error('Erreur lors du changement de disponibilité');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde. Choisissez une image de moins de 2 Mo.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm({ ...form, image_url: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('Produits')}</h1>
        <Button onClick={openAdd} className="flex items-center gap-1">
          <Plus size={16} /> {t('Add')}
        </Button>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <Card key={product.id} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = '🍽️'; }} />
              ) : '🍽️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white text-sm">{product.name}</h3>
                {!product.available && <span className="text-xs text-red-400">({t('Unavailable')})</span>}
              </div>
              <p className="text-xs text-white/40">{product.category}</p>
              <p className="text-sm font-semibold text-gold-500">{formatCurrency(product.price)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleToggleAvailability(product.id)} className="p-1.5 text-white/40 hover:text-wave-500 transition-colors" title={product.available ? 'Désactiver' : 'Activer'}>
                {product.available ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button onClick={() => openEdit(product)} className="p-1.5 text-white/40 hover:text-wave-500 transition-colors">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(product.id)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <h2 className="text-lg font-bold text-white mb-4">{editing ? t('Edit Product') : t('Add Product')}</h2>
          <div className="space-y-3">
            <input placeholder={t('Name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
            <input placeholder={t('Description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
            <input placeholder={t('Price')} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">{t('Category')}</label>
              {categories.length === 0 ? (
                <p className="text-xs text-yellow-400">{t('Veuillez d\'abord créer une catégorie')}</p>
              ) : (
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value, category: '' })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">{t('Sélectionner une catégorie')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/60">{t('Image du produit')}</label>
              <div className="flex gap-2">
                <input placeholder={t('Chemin ou image locale')} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
                <label className="flex-shrink-0 flex items-center justify-center w-10 bg-zinc-800 border border-white/10 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <Upload size={16} className="text-white/60" />
                </label>
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="preview" className="w-20 h-20 rounded-lg object-cover border border-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded bg-zinc-900 border-white/20 text-wave-500" />
                {t('Available')}
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded bg-zinc-900 border-white/20 text-wave-500" />
                {t('Featured')}
              </label>
            </div>
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
