import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { login } from '../../services/authService';
import api from '../../services/api';

function FloatingInput({ id, label, type, value, onChange, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const float = focused || value?.length > 0;

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        autoComplete={autoComplete}
        className="peer w-full bg-transparent border border-white/10 rounded-xl px-4 pt-5 pb-2 text-white placeholder-transparent focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all duration-200"
      />
      <label
        htmlFor={id}
        className={`absolute left-4 transition-all duration-200 cursor-text pointer-events-none ${
          float
            ? '-top-2.5 text-xs text-gold-400'
            : 'top-4 text-sm text-white/40'
        }`}
      >
        {label}
      </label>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState(null);
  const { t, setUser } = useApp();
  const errorRef = useRef(null);

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data } = await api.get('/api/public/restaurants');
        if (data && data.length > 0) {
          setBranding(data[0]);
        }
      } catch {
        // fallback to BarOrder
      }
    }
    loadBranding();
  }, []);

  const triggerError = (msg) => {
    setError(msg);
    if (errorRef.current) {
      errorRef.current.style.animation = 'none';
      void errorRef.current.offsetHeight;
      errorRef.current.style.animation = 'shakeX 0.4s ease-out';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      triggerError(t('Veuillez entrer votre email et mot de passe'));
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      localStorage.setItem('token', result.token);
      if (result.user) { setUser(result.user); }
      navigate('/admin/dashboard');
    } catch (err) {
      triggerError(err.message || t('Email ou mot de passe incorrect'));
    } finally {
      setLoading(false);
    }
  };

  const logo = branding?.logo_url;
  const name = branding?.name || 'BarOrder';
  const color = branding?.primary_color || '#c9952e';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-blob" style={{ background: `${color}15` }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-blob animation-delay-2000" style={{ background: '#10b98115' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl animate-blob animation-delay-4000" style={{ background: `${color}08` }} />

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-2xl bg-zinc-900/30 rounded-3xl border border-white/[0.06] p-8 md:p-10 shadow-[0_0_60px_rgba(201,149,46,0.06)] animate-fade-in-up">
          <div className="text-center mb-8 md:mb-10">
            <div className="relative inline-flex mb-5">
              <div className="absolute inset-0 rounded-2xl" style={{ background: `linear-gradient(135deg, ${color}40, #10b98140)`, filter: 'blur(16px)' }} />
              {logo ? (
                <img
                  src={logo}
                  alt={name}
                  className="relative w-20 h-20 rounded-2xl object-cover shadow-lg ring-2 ring-white/10"
                />
              ) : (
                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${color}, #10b981)`, boxShadow: `0 8px 32px ${color}30` }}
                >
                  <span className="text-3xl font-bold text-black">B</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight" style={branding?.name ? { color } : {}}>
              {name}
            </h1>
            <p className="text-white/35 text-sm">{t('Connexion administration')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <FloatingInput
              id="login-email"
              label={t('Email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => {}}
                onBlur={() => {}}
                placeholder={t('Password')}
                autoComplete="current-password"
                className="peer w-full bg-transparent border border-white/10 rounded-xl px-4 pt-5 pb-2 pr-12 text-white placeholder-transparent focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all duration-200"
              />
              <label
                htmlFor="login-password"
                className={`absolute left-4 transition-all duration-200 cursor-text pointer-events-none ${
                  showPassword || password?.length > 0
                    ? '-top-2.5 text-xs text-gold-400'
                    : 'top-4 text-sm text-white/40'
                }`}
              >
                {t('Password')}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-gold-400 transition-colors z-10"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div
              ref={errorRef}
              className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl font-medium text-base transition-all duration-200 overflow-hidden group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                color: '#000',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.filter = 'brightness(1.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.filter = 'brightness(1)';
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="animate-pulse">{t('Sign In')}...</span>
                  </>
                ) : (
                  <><LogIn size={18} /> {t('Sign In')}</>
                )}
              </span>
            </button>
          </form>
        </div>
        <p className="text-center text-white/[0.03] text-xs mt-6 select-none">&copy; {new Date().getFullYear()} BarOrder</p>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        .animate-blob { animation: blob 10s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out both; }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
