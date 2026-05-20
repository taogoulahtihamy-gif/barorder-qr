import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useApp } from '../../context/AppContext';
import { login } from '../../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, setUser } = useApp();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(t('Veuillez entrer votre email et mot de passe'));
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      localStorage.setItem('token', result.token);
      if (result.user) { setUser(result.user); }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || t('Email ou mot de passe incorrect'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900/60 backdrop-blur-sm rounded-3xl border border-white/5 p-8 md:p-10 shadow-2xl shadow-gold-500/5">
          <div className="text-center mb-8 md:mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold-500/20">
              <span className="text-2xl font-bold text-black">B</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">BarOrder</h1>
            <p className="text-white/40 text-sm">{t('Connexion administration')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label={t('Email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Adresse email')}
            />
            <div className="space-y-1.5">
              <label className="text-sm text-white/60">{t('Password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Mot de passe')}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/50 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-gold-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <span className="animate-pulse">{t('Sign In')}...</span>
              ) : (
                <><LogIn size={18} /> {t('Sign In')}</>
              )}
            </Button>
          </form>
        </div>
        <p className="text-center text-white/[0.04] text-xs mt-6 select-none">&copy; {new Date().getFullYear()} BarOrder</p>
      </div>
    </div>
  );
}
