import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Shield, UserCheck, UserX, Calendar, Key, Trash2, Mail, Eye, EyeOff, Store } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { getRestaurants } from '../../services/adminService';

const ALL_ROLES = ['admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier'];

const ROLE_COLORS = {
  admin: 'text-rose-400 bg-rose-500/10',
  super_admin: 'text-red-400 bg-red-500/10',
  manager: 'text-amber-400 bg-amber-500/10',
  waiter: 'text-blue-400 bg-blue-500/10',
  kitchen: 'text-emerald-400 bg-emerald-500/10',
  cashier: 'text-purple-400 bg-purple-500/10',
};

export default function UsersPage() {
  const { t, user } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'waiter', restaurant_id: '' });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [restaurants, setRestaurants] = useState([]);

  const isSuper = user?.role === 'super_admin';
  const availableRoles = isSuper ? ALL_ROLES : ALL_ROLES.filter(r => r !== 'super_admin');

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[UsersPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (isSuper) {
      getRestaurants().then(setRestaurants).catch(console.error);
    }
  }, [isSuper]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'waiter', restaurant_id: isSuper ? String(restaurants[0]?.id || '') : '' });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, restaurant_id: String(u.restaurant_id || '') });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        if (isSuper && form.restaurant_id) payload.restaurant_id = Number(form.restaurant_id);
        await api.put(`/api/admin/users/${editing.id}`, payload);
        toast.success(t('Utilisateur mis à jour'));
      } else {
        const payload = { ...form };
        if (payload.restaurant_id) payload.restaurant_id = Number(payload.restaurant_id);
        await api.post('/api/admin/users', payload);
        toast.success(t('Utilisateur créé'));
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(`/api/admin/users/${u.id}/status`, { is_active: !u.is_active });
      toast.success(u.is_active ? t('Utilisateur désactivé') : t('Utilisateur activé'));
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const openPasswordReset = (u) => {
    setPwTarget(u);
    setPwValue('');
    setPwModalOpen(true);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!pwValue) { toast.error(t('Mot de passe requis')); return; }
    try {
      await api.patch(`/api/admin/users/${pwTarget.id}/password`, { password: pwValue });
      toast.success(t('Mot de passe réinitialisé'));
      setPwModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer l'utilisateur ${u.name} (${u.email}) ?`)) return;
    try {
      await api.delete(`/api/admin/users/${u.id}`);
      toast.success(t('Utilisateur supprimé'));
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('Utilisateurs')}</h1>
        <Button variant="gold" onClick={openCreate} className="flex items-center gap-2">
          <Plus size={18} /> {t('Ajouter')}
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-sm text-white/40">
                <th className="pb-3 pt-3 px-4 font-medium">{t('Nom')}</th>
                <th className="pb-3 pt-3 px-4 font-medium">{t('Email')}</th>
                <th className="pb-3 pt-3 px-4 font-medium">{t('Rôle')}</th>
                {isSuper && <th className="pb-3 pt-3 px-4 font-medium">{t('Restaurant')}</th>}
                <th className="pb-3 pt-3 px-4 font-medium">{t('Statut')}</th>
                <th className="pb-3 pt-3 px-4 font-medium hidden md:table-cell">{t('Créé le')}</th>
                <th className="pb-3 pt-3 px-4 font-medium text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 px-4 text-white font-medium overflow-safe max-w-[120px]">{u.name}</td>
                  <td className="py-3 px-4 text-white/60 text-sm overflow-safe max-w-[180px]">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'text-white/40 bg-white/5'}`}>
                      <Shield size={12} />
                      {u.role}
                    </span>
                  </td>
                  {isSuper && <td className="py-3 px-4 text-white/60 text-sm overflow-safe max-w-[120px]">{u.restaurant_name || '-'}</td>}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-sm ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                      {u.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
                      {u.is_active ? t('Actif') : t('Inactif')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/40 text-sm hidden md:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} />
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {u.is_active ? t('Désactiver') : t('Activer')}
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                      >
                        {t('Modifier')}
                      </button>
                      <button
                        onClick={() => openPasswordReset(u)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                        title={t('Réinitialiser le mot de passe')}
                      >
                        <Key size={14} />
                      </button>
                      {isSuper && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title={t('Supprimer')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/30">{t('Aucun utilisateur')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3 p-4">
          {users.map((u) => (
            <div key={u.id} className="bg-zinc-900/80 rounded-2xl border border-white/5 p-4 w-full max-w-full overflow-hidden">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm overflow-safe">{u.name}</h3>
                  <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5 overflow-safe">
                    <Mail size={12} className="flex-shrink-0" />
                    {u.email}
                  </p>
                  {isSuper && u.restaurant_name && (
                    <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                      <Store size={11} />{u.restaurant_name}
                    </p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${ROLE_COLORS[u.role] || 'text-white/40 bg-white/5'}`}>
                  <Shield size={12} />
                  {u.role}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 text-xs ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                  {u.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                  {u.is_active ? t('Actif') : t('Inactif')}
                </span>
                {u.created_at && (
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 w-full">
                <button
                  onClick={() => toggleActive(u)}
                  className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors btn-mobile ${
                    u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {u.is_active ? t('Désactiver') : t('Activer')}
                </button>
                <button
                  onClick={() => openEdit(u)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors btn-mobile"
                >
                  {t('Modifier')}
                </button>
                <button
                  onClick={() => openPasswordReset(u)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors btn-mobile"
                >
                  <Key size={14} className="inline mr-1" />
                  {t('Mot de passe')}
                </button>
                {isSuper && (
                  <button
                    onClick={() => handleDelete(u)}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors btn-mobile"
                  >
                    <Trash2 size={14} className="inline mr-1" />
                    {t('Supprimer')}
                  </button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-center text-white/30 py-8">{t('Aucun utilisateur')}</p>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t("Modifier l'utilisateur") : t('Ajouter un utilisateur')}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('Nom')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('Email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <div className="space-y-1.5">
            <label className="text-sm text-white/60">{editing ? t('Nouveau mot de passe (laisser vide pour conserver)') : t('Mot de passe')}</label>
            <div className="relative">
              <input
                type={showFormPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/50"
              />
              <button
                type="button"
                onClick={() => setShowFormPassword(!showFormPassword)}
                aria-label={showFormPassword ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                {showFormPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-white/60">{t('Rôle')}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {isSuper && (
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">{t('Restaurant')}</label>
              <select
                value={form.restaurant_id}
                onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50"
              >
                <option value="">{t('Sélectionner un restaurant')}</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={String(r.id)}>{r.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('Annuler')}</Button>
            <Button type="submit" variant="gold">{editing ? t('Enregistrer') : t('Créer')}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={pwModalOpen} onClose={() => setPwModalOpen(false)} title={t('Réinitialiser le mot de passe')}>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <p className="text-sm text-white/60">{t('Nouveau mot de passe pour')} <span className="text-white font-medium">{pwTarget?.email}</span></p>
          <div className="space-y-1.5">
            <label className="text-sm text-white/60">{t('Nouveau mot de passe')}</label>
            <div className="relative">
              <input
                type={showResetPassword ? 'text' : 'password'}
                value={pwValue}
                onChange={(e) => setPwValue(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/50"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                aria-label={showResetPassword ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setPwModalOpen(false)}>{t('Annuler')}</Button>
            <Button type="submit" variant="gold">{t('Réinitialiser')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
