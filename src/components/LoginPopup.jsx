import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, Loader2, X, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { CHAPTER_LOGIN_LOCK_MESSAGE } from '../utils/latestChapter';

const TAB_ACTIVE_CLASS =
  'bg-[#0b355f] text-cyan-50 shadow-[0_4px_0_0_#42a5f5]';
const TAB_INACTIVE_CLASS =
  'text-cyan-200/70 hover:text-cyan-100';
const SUBMIT_BTN_CLASS =
  'flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/20 bg-[#0a2d52] py-3.5 text-[15px] font-semibold text-cyan-50 shadow-[0_7px_0_0_#42a5f5] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#60a5fa] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_4px_0_0_#3b82f6] disabled:pointer-events-none disabled:opacity-55';
const INPUT_CLASS =
  'w-full rounded-xl border border-cyan-200/20 bg-[#0a2d52]/90 px-4 py-3 text-sm text-cyan-50 shadow-sm outline-none transition-all placeholder:text-cyan-200/40 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20';
const LABEL_CLASS =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cyan-100/85';

const LoginPopup = ({ open, onClose, onSuccess, message, lockCountdown }) => {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('login');
      setUsername('');
      setName('');
      setPassword('');
      setEmail('');
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && isAuthenticated) {
      onSuccess?.();
      onClose?.();
    }
  }, [open, isAuthenticated, onClose, onSuccess]);

  useEffect(() => {
    if (!open) return undefined;

    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        toast.success('Berhasil masuk.');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(result.error || 'Login gagal');
      }
    } catch (err) {
      toast.error(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }
    if (!username.trim()) {
      toast.error('Username wajib diisi');
      return;
    }
    const usernameNormalized = username.trim().toLowerCase().replace(/\s+/g, '');
    if (usernameNormalized.length < 3) {
      toast.error('Username minimal 3 karakter');
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(usernameNormalized)) {
      toast.error('Username hanya boleh huruf kecil, angka, titik, underscore, atau dash.');
      return;
    }
    if (!password) {
      toast.error('Password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('username', usernameNormalized);
      formData.append('password', password);
      if (email.trim()) formData.append('email', email.trim());
      const result = await register(formData);
      if (result.success) {
        toast.success('Registrasi berhasil. Anda sudah masuk.');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(result.error || 'Registrasi gagal');
      }
    } catch (err) {
      toast.error(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden overscroll-none bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Login diperlukan"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className="max-h-[min(90dvh,calc(100vh-2rem))] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-cyan-200/25 bg-[#0b355f]/95 p-5 shadow-[0_7px_0_0_#facc15] backdrop-blur-sm sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <Lock className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Login diperlukan</h3>
              {/* <p className="mt-1 text-sm text-slate-400">
                {message || CHAPTER_LOGIN_LOCK_MESSAGE}
              </p> */}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {lockCountdown && (
          <div className="mb-5 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-4 text-center">
            <p className="text-sm font-semibold text-cyan-100">Bebas Baca Tanpa Login</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums tracking-wider text-white">
              {lockCountdown}
            </p>
          </div>
        )}

        <div className="mb-5 flex gap-1 rounded-2xl border border-cyan-200/15 bg-[#0a2d52]/60 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              mode === 'login' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
            }`}
          >
            <LogIn className="h-4 w-4 shrink-0" />
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              mode === 'register' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
            }`}
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            Daftar
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="popup-login-username" className={LABEL_CLASS}>
                Username atau email
              </label>
              <input
                id="popup-login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Username atau email"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="popup-login-password" className={LABEL_CLASS}>
                Password
              </label>
              <input
                id="popup-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <p className="text-center text-xs text-slate-400">
              Lupa sandi?{' '}
              <Link to="/contact" className="font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-2 transition-colors hover:text-cyan-200" onClick={onClose}>
                Hubungi admin
              </Link>
            </p>
            <button
              type="submit"
              disabled={loading}
              className={SUBMIT_BTN_CLASS}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              Masuk
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="popup-reg-name" className={LABEL_CLASS}>
                Nama
              </label>
              <input
                id="popup-reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Nama lengkap"
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="popup-reg-username" className={LABEL_CLASS}>
                Username
              </label>
              <input
                id="popup-reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className={INPUT_CLASS}
                placeholder="username_unik"
                required
                minLength={3}
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="popup-reg-email" className={LABEL_CLASS}>
                Email (opsional)
              </label>
              <input
                id="popup-reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                placeholder="email@contoh.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="popup-reg-password" className={LABEL_CLASS}>
                Password
              </label>
              <input
                id="popup-reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={SUBMIT_BTN_CLASS}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
              Daftar & masuk
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default LoginPopup;
