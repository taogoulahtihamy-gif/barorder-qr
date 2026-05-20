import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Store, Globe, MapPin, Phone as PhoneIcon, Palette, RefreshCw, DollarSign, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { getRestaurants, createRestaurant, updateRestaurant, updateRestaurantStatus } from '../../services/adminService';

export default function RestaurantsPage() {
  const { t } = useApp();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '', currency: 'FCFA', primary_color: '#d4a843', logo_url: '' });

  const fetch = useCallback(async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data);
    } catch (err) {
      console.error('[RestaurantsPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', address: '', phone: '', currency: 'FCFA', primary_color: '#d4a843', logo_url: '' });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name, slug: r.slug || '', address: r.address || '', phone: r.phone || '', currency: r.currency || 'FCFA', primary_color: r.primary_color || '#d4a843', logo_url: r.logo_url || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateRestaurant(editing.id, form);
        toast.success(t('Restaurant modifié'));
      } else {
        await createRestaurant(form);
        toast.success(t('Restaurant créé'));
      }
      setModalOpen(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || t('Erreur'));
    }
  };

  const toggleActive = async (r) => {
    try {
      await updateRestaurantStatus(r.id, !r.is_active);
      toast.success(r.is_active ? t('Restaurant désactivé') : t('Restaurant activé'));
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || t('Erreur'));
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('Restaurants')}</h1>
        <Button variant="gold" onClick={openCreate} className="flex items-center gap-2">
          <Plus size={18} /> {t('Ajouter')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {restaurants.map((r) => (
          <Card key={r.id} className="relative overflow-hidden">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: r.primary_color || '#d4a843' }}>
                  <Store size={20} className="text-black" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">{r.name}</h3>
                  {r.slug && (
                    <p className="text-xs text-white/40 flex items-center gap-1 truncate">
                      <Globe size={11} />/{r.slug}
                    </p>
                  )}
                </div>
              </div>
              <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${r.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </div>

            <div className="space-y-1.5 text-xs text-white/50 mb-4">
              {r.address && <p className="flex items-center gap-1.5 truncate"><MapPin size={12} />{r.address}</p>}
              {r.phone && <p className="flex items-center gap-1.5 truncate"><PhoneIcon size={12} />{r.phone}</p>}
              <p className="flex items-center gap-1.5"><DollarSign size={12} />{r.currency || 'FCFA'}</p>
              {r.primary_color && (
                <p className="flex items-center gap-1.5">
                  <Palette size={12} />
                  <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: r.primary_color }} />
                  {r.primary_color}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(r)}
                className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  r.is_active !== false
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {r.is_active !== false ? t('Désactiver') : t('Activer')}
              </button>
              <button
                onClick={() => openEdit(r)}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
              >
                {t('Modifier')}
              </button>
            </div>
          </Card>
        ))}
        {restaurants.length === 0 && (
          <div className="col-span-full text-center text-white/30 py-12">{t('Aucun restaurant')}</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('Modifier le restaurant') : t('Ajouter un restaurant')}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('Nom')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('Slug (URL unique)')} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="mon-restaurant" />
          <Input label={t('Adresse')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label={t('Téléphone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={t('Devise')} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="FCFA" />
          <div className="space-y-1.5">
            <label className="text-sm text-white/60">{t('Couleur principale')}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>
          <Input label={t('URL du logo')} value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('Annuler')}</Button>
            <Button type="submit" variant="gold">{editing ? t('Enregistrer') : t('Créer')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
