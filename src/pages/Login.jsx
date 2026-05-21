import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, MessageCircle } from 'lucide-react';
import { apiClient } from '../utils/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const data = await apiClient.getContactInfo(true);
        if (data?.whatsapp) {
          setAdminWhatsapp(String(data.whatsapp));
        }
      } catch {
        // Silent fail: fallback without forgot-password CTA.
      }
    };
    fetchContactInfo();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        const from = location.state?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Login gagal');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const whatsappHref = adminWhatsapp
    ? `https://wa.me/${adminWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        'Halo admin, saya lupa password akun KomikNesia.'
      )}`
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-gray-950 dark:text-gray-100">
      <Helmet>
        <title>Login | KomikNesia</title>
        <meta
          name="description"
          content="Masuk ke panel administrasi KomikNesia untuk mengelola konten dan pengaturan website."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-45"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(14,165,233,0.12),transparent_42%),radial-gradient(circle_at_88%_78%,rgba(250,204,21,0.1),transparent_40%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.14),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(250,204,21,0.08),transparent_38%)]" />
        <div
          className="absolute inset-0 [--grid:rgba(14,165,233,0.07)] [background-image:linear-gradient(var(--grid)_1px,transparent_1px),linear-gradient(90deg,var(--grid)_1px,transparent_1px)] [background-size:40px_40px] dark:[--grid:rgba(56,189,248,0.1)]"
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[420px]">
          <div
            className="rounded-3xl border border-sky-200/80 bg-white/95 p-8 shadow-[0_7px_0_0_#38bdf8] backdrop-blur-sm dark:border-cyan-200/25 dark:bg-[#0b355f]/95 dark:shadow-[0_7px_0_0_#facc15] sm:p-10"
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 ring-1 ring-sky-200/80 dark:bg-cyan-400/15 dark:ring-cyan-200/30">
                <LogIn className="h-8 w-8 text-sky-600 dark:text-cyan-200" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#163a5f] dark:text-cyan-50 sm:text-3xl">
                Nusakomik Admin
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-sky-900/75 dark:text-cyan-100/80">
                Masuk ke panel administrasi dengan akun yang terdaftar.
              </p>
            </div>

            {error && (
              <div
                className="mb-6 rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3.5 text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-300"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-sky-800/90 dark:text-cyan-100/85"
                >
                  Username atau email
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3.5 text-[15px] text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25 dark:border-cyan-200/20 dark:bg-[#0a2d52]/90 dark:text-cyan-50 dark:placeholder:text-cyan-200/40 dark:focus:border-cyan-300/50 dark:focus:ring-cyan-400/20"
                  placeholder="contoh@email.com atau username"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-sky-800/90 dark:text-cyan-100/85"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3.5 text-[15px] text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25 dark:border-cyan-200/20 dark:bg-[#0a2d52]/90 dark:text-cyan-50 dark:placeholder:text-cyan-200/40 dark:focus:border-cyan-300/50 dark:focus:ring-cyan-400/20"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-500/25 bg-sky-600 py-3.5 text-[15px] font-semibold text-white shadow-[0_7px_0_0_#0369a1] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#0369a1] active:translate-y-0.5 active:shadow-[0_4px_0_0_#0369a1] disabled:pointer-events-none disabled:opacity-55 dark:border-cyan-200/20 dark:bg-[#0a2d52] dark:text-cyan-50 dark:shadow-[0_7px_0_0_#42a5f5] dark:hover:shadow-[0_8px_0_0_#60a5fa] dark:active:shadow-[0_4px_0_0_#3b82f6] dark:hover:brightness-110"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    Memproses…
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 shrink-0" />
                    Masuk
                  </>
                )}
              </button>
            </form>

            {whatsappHref && (
              <div className="mt-6">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-50 py-3 text-sm font-semibold text-emerald-800 shadow-[0_6px_0_0_#059669] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100/90 hover:shadow-[0_7px_0_0_#059669] active:translate-y-0.5 active:shadow-[0_3px_0_0_#059669] dark:border-emerald-400/25 dark:bg-emerald-950/50 dark:text-emerald-200 dark:shadow-[0_6px_0_0_#34d399] dark:hover:bg-emerald-900/45 dark:hover:shadow-[0_7px_0_0_#34d399] dark:active:shadow-[0_3px_0_0_#10b981]"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  Lupa sandi? Hubungi admin
                </a>
              </div>
            )}

            <div className="mt-8 border-t border-slate-200/90 pt-6 text-center dark:border-cyan-200/15">
              <a
                href="/"
                className="text-sm font-medium text-sky-700 underline-offset-4 transition-colors hover:text-sky-900 hover:underline dark:text-cyan-200 dark:hover:text-white"
              >
                ← Kembali ke halaman utama
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
