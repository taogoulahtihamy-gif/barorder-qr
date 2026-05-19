import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useApp } from '../../context/AppContext';
import { getSettings, updateSettings } from '../../services/adminService';

export default function SettingsPage() {
  const { t } = useApp();
  const [settings, setSettings] = useState({
    name: '',
    slug: '',
    logo_url: '',
    address: '',
    phone: '',
    currency: 'FCFA',
    primary_color: '#D4AF37',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSettings().then((data) => {
      if (data && data.id) {
        setSettings({
          name: data.name || '',
          slug: data.slug || '',
          logo_url: data.logo_url || '',
          address: data.address || '',
          phone: data.phone || '',
          currency: data.currency || 'FCFA',
          primary_color: data.primary_color || '#D4AF37',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success(t('Paramètres enregistrés'));
    } catch (e) {
      toast.error(e?.response?.data?.error || t('Erreur lors de la sauvegarde'));
    }
    setSaving(false);
  };

  if (loading) return <div className="text-white/40 text-center py-8">{t('Chargement...')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('Settings')}</h1>

      <div className="space-y-4 max-w-lg">
        <Card>
          <h3 className="font-medium text-white mb-4">{t('Profil du restaurant')}</h3>
          <div className="space-y-4">
            <Input label={t('Nom du restaurant')} value={settings.name} onChange={(e) => handleChange('name', e.target.value)} />
            <Input label={t('Slug (URL unique)')} value={settings.slug} onChange={(e) => handleChange('slug', e.target.value)} placeholder="mon-restaurant" />
            <label className="text-sm text-white/60">{t('Logo')}</label>
            <div className="flex gap-2">
              <input placeholder={t('URL du logo')} value={settings.logo_url} onChange={(e) => handleChange('logo_url', e.target.value)} className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50" />
              <label className="flex items-center gap-1.5 px-3 bg-zinc-800 border border-white/10 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors text-xs text-white/70 whitespace-nowrap">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error(t('Image trop lourde. Choisissez une image de moins de 2 Mo.'));
                    e.target.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (ev) => handleChange('logo_url', ev.target.result);
                  reader.readAsDataURL(file);
                }} />
                <Upload size={14} />
                {t('Choisir un logo')}
              </label>
            </div>
            {settings.logo_url && (
              <img src={settings.logo_url} alt="logo preview" className="w-20 h-20 rounded-lg object-cover border border-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <Input label={t('Adresse')} value={settings.address} onChange={(e) => handleChange('address', e.target.value)} />
            <Input label={t('Téléphone')} value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">{t('Devise')}</label>
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50"
              >
                <option value="FCFA">FCFA</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">{t('Couleur principale')}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 cursor-pointer"
                />
                <span className="text-sm text-white/50">{settings.primary_color}</span>
              </div>
            </div>
          </div>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? t('Enregistrement...') : t('Enregistrer les paramètres')}
        </Button>
      </div>
    </div>
  );
}
