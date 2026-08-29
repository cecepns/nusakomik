import { useState, useEffect } from "react";
import {
  ExternalLink,
  Flame,
  BookOpen,
  Crown,
  Smartphone,
  Moon,
  Sun,
  ChevronDown,
  Sparkles,
  Heart,
  Share2,
  Download,
  CheckCircle2,
  Zap,
  Globe,
  ShieldCheck,
  Star
} from "lucide-react";
import logo from "../assets/logo.png";
import discordIcon from "../assets/discord.svg";
import { apiClient } from "../utils/api";

const defaultCtaItems = [
  {
    id: "read_manga",
    title: "Baca Manga",
    subtitle: "Ribuan judul manga, manhwa & manhua gratis",
    href: "https://id.nusakomik.com/",
    icon: "BookOpen",
    badge: "Hot",
  },
  {
    id: "premium",
    title: "Upgrade ke Premium",
    subtitle: "Baca tanpa iklan & fitur eksklusif",
    href: "https://id.nusakomik.com/premium",
    icon: "Crown",
    badge: "Pro",
  },
  {
    id: "discord",
    title: "Join Discord",
    subtitle: "Komunitas pembaca & update info terbaru",
    href: "https://discord.gg/dgC22PSm9h",
    icon: "Discord",
  },
  {
    id: "facebook",
    title: "Facebook",
    subtitle: "Halaman resmi Nusakomik di Facebook",
    href: "https://facebook.com",
    icon: "Facebook",
  },
  {
    id: "tiktok",
    title: "TikTok",
    subtitle: "Follow TikTok Nusakomik",
    href: "https://tiktok.com",
    icon: "TikTok",
  },
  {
    id: "instagram",
    title: "Instagram",
    subtitle: "Follow Instagram Nusakomik",
    href: "https://instagram.com",
    icon: "Instagram",
  },
  {
    id: "download_app",
    title: "Download App",
    subtitle: "Baca manga lebih nyaman di aplikasi",
    href: "https://id.nusakomik.com/",
    icon: "Download",
    badge: "App",
  }
];

const renderIcon = (iconName) => {
  if (iconName === 'Discord') {
    return <img src={discordIcon} alt="" aria-hidden="true" className="h-5 w-5 drop-shadow" />;
  }
  if (iconName === 'Facebook') {
    return (
      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (iconName === 'TikTok') {
    return (
      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.34 6.34 0 0 0 6.34-6.34V9.37a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.85-.8z" />
      </svg>
    );
  }
  if (iconName === 'Instagram') {
    return (
      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }

  let IconComp = BookOpen;
  if (iconName === 'Crown') IconComp = Crown;
  if (iconName === 'Download') IconComp = Download;
  if (iconName === 'Smartphone') IconComp = Smartphone;
  if (iconName === 'Heart') IconComp = Heart;
  if (iconName === 'Share2') IconComp = Share2;
  if (iconName === 'ExternalLink') IconComp = ExternalLink;

  return <IconComp className="h-5 w-5" />;
};

const getItemGradient = (id, iconName) => {
  if (id === 'read_manga' || iconName === 'BookOpen') return 'from-sky-400 to-blue-600 text-white shadow-sky-500/25';
  if (id === 'premium' || iconName === 'Crown') return 'from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-amber-500/25';
  if (id === 'discord' || iconName === 'Discord') return 'from-[#5865F2] to-indigo-600 text-white shadow-indigo-500/25';
  if (id === 'facebook' || iconName === 'Facebook') return 'from-[#1877F2] to-blue-600 text-white shadow-blue-500/25';
  if (id === 'tiktok' || iconName === 'TikTok') return 'from-slate-900 to-black text-white ring-1 ring-white/20 shadow-slate-950/40';
  if (id === 'instagram' || iconName === 'Instagram') return 'from-amber-500 via-rose-500 to-purple-600 text-white shadow-rose-500/25';
  if (id === 'download_app' || iconName === 'Download') return 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/25';
  return 'from-sky-400 to-blue-600 text-white shadow-sky-500/20';
};

const stats = [
  { value: "5000+", label: "Judul Komik", icon: BookOpen },
  { value: "100K+", label: "Chapter", icon: Zap },
  { value: "24/7", label: "Update Harian", icon: Flame },
];

const genreItems = [
  "Action", "Romance", "Fantasy", "Comedy", "Adventure",
  "Martial Arts", "Shounen", "Seinen", "Isekai", "Slice of Life",
  "Horror", "School Life", "Drama", "Harem", "Supernatural", "Ecchi"
];

const faqItems = [
  {
    question: "Apa itu Nusakomik?",
    answer: "Nusakomik adalah platform baca komik online yang menyediakan manga (Jepang), manhwa (Korea), dan manhua (China) dalam bahasa Indonesia secara gratis. Nusakomik telah dipercaya oleh ratusan ribu pembaca di seluruh Indonesia.",
  },
  {
    question: "Apakah Nusakomik gratis?",
    answer: "Ya! Kamu bisa membaca semua manga, manhwa, dan manhua di Nusakomik secara gratis. Tersedia juga opsi Premium untuk pengalaman tanpa iklan dan fitur eksklusif lainnya.",
  },
  {
    question: "Apa domain resmi Nusakomik?",
    answer: "Domain utama Nusakomik untuk baca manga adalah id.nusakomik.com. Hati-hati dengan domain lain yang mengatasnamakan Nusakomik dan pastikan kamu selalu mengakses domain resmi.",
  },
  {
    question: "Genre apa saja yang tersedia?",
    answer: "Nusakomik menyediakan banyak genre termasuk Action, Romance, Fantasy, Comedy, Slice of Life, Martial Arts, Isekai, Horror, Seinen, Shounen, dan masih banyak lagi.",
  },
  {
    question: "Bagaimana cara baca manga di Nusakomik?",
    answer: 'Sangat mudah! Klik tombol "Baca Manga" di atas, cari judul manga yang kamu inginkan, pilih chapter, dan mulai membaca. Kamu juga bisa memakai aplikasi Android untuk pengalaman membaca yang lebih nyaman.',
  },
];

const Landing = () => {
  const [isLightMode, setIsLightMode] = useState(false);
  const [ctaItems, setCtaItems] = useState(defaultCtaItems);
  const [openFaqItems, setOpenFaqItems] = useState(() => new Set([faqItems[0]?.question]));

  useEffect(() => {
    apiClient.getSettings()
      .then((s) => {
        if (s && Array.isArray(s.quick_links) && s.quick_links.length > 0) {
          const landingLinks = s.quick_links.filter(item => item.is_active === true && item.is_landing === true);
          if (landingLinks.length > 0) setCtaItems(landingLinks);
        }
      })
      .catch((err) => console.error("Error loading quick links for Landing:", err));
  }, []);

  const allFaqOpen = openFaqItems.size === faqItems.length;

  const toggleFaq = (question) => {
    setOpenFaqItems((prev) => {
      const next = new Set(prev);
      if (next.has(question)) {
        next.delete(question);
      } else {
        next.add(question);
      }
      return next;
    });
  };

  const toggleAllFaq = () => {
    setOpenFaqItems(() => {
      if (allFaqOpen) return new Set();
      return new Set(faqItems.map((item) => item.question));
    });
  };

  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 font-sans ${isLightMode ? "bg-slate-50 text-slate-900" : "bg-[#05070c] text-gray-100"
        }`}
    >
      {/* Background Lighting Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div
          className={`absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[120px] opacity-40 transition-opacity ${isLightMode
              ? "bg-gradient-to-tr from-sky-200 via-blue-300 to-indigo-200"
              : "bg-gradient-to-tr from-sky-950/60 via-blue-900/40 to-indigo-950/30"
            }`}
        />
        <div
          className={`absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-30 transition-opacity ${isLightMode ? "bg-sky-300/30" : "bg-blue-900/30"
            }`}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 opacity-[0.07] ${isLightMode
            ? "[background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]"
            : "[background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]"
          } [background-size:32px_32px]`}
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center px-4 pb-16 pt-8 sm:px-6">
        {/* Top Header Switcher */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Online • Live
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsLightMode((prev) => !prev)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-all duration-200 ${isLightMode
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-slate-200 hover:scale-105"
                : "border-gray-800 bg-gray-900/90 text-gray-200 hover:bg-gray-800 shadow-black hover:scale-105"
              }`}
            aria-label={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            title={isLightMode ? "Mode Gelap" : "Mode Terang"}
          >
            {isLightMode ? (
              <Moon className="h-4 w-4 text-slate-700" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>
        </div>

        {/* Brand Logo & Headline */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-sky-400 to-blue-600 opacity-40 blur-lg transition duration-300 group-hover:opacity-75" />
            <img src={logo} alt="Nusakomik" className="relative w-44 sm:w-56 object-contain" />
          </div>

          <div
            className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold shadow-sm transition-all ${isLightMode
                ? "bg-sky-50 text-sky-700 border border-sky-200/80"
                : "bg-sky-950/60 text-sky-400 border border-sky-900/60 backdrop-blur-md"
              }`}
          >
            <Flame className="h-4 w-4 text-sky-400 animate-bounce" />
            Baca Manga, Manhwa & Manhua Bahasa Indonesia
          </div>
        </div>

        {/* Action Link Cards (CTAs) */}
        <div className="mt-8 w-full space-y-3.5">
          {ctaItems.map((item) => {
            const iconBgGradient = getItemGradient(item.id, item.icon);
            return (
              <a
                key={item.title + item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex w-full items-center justify-between rounded-2xl border p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isLightMode
                    ? "border-slate-200/90 bg-white hover:border-sky-400/60 hover:shadow-sky-500/10"
                    : "border-gray-800/80 bg-gray-900/80 backdrop-blur-xl hover:border-sky-500/60 hover:shadow-sky-950/20"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${iconBgGradient}`}
                  >
                    {renderIcon(item.icon)}
                  </span>

                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-base font-extrabold sm:text-lg transition-colors group-hover:text-sky-400 ${isLightMode ? "text-slate-900" : "text-gray-100"
                          }`}
                      >
                        {item.title}
                      </p>
                      {item.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${item.badge.toLowerCase() === 'pro' || item.badge.toLowerCase() === 'hot'
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm'
                              : 'bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-sm'
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p
                        className={`text-xs font-medium mt-0.5 line-clamp-1 ${isLightMode ? "text-slate-500" : "text-gray-400"
                          }`}
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${isLightMode
                      ? "bg-slate-100 text-slate-600 group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-blue-600 group-hover:text-white"
                      : "bg-gray-800 text-gray-400 group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-blue-600 group-hover:text-white"
                    }`}
                >
                  <ExternalLink className="h-4 w-4" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div
          className={`mt-8 grid w-full grid-cols-3 gap-3 rounded-2xl border p-4 shadow-lg ${isLightMode
              ? "border-slate-200 bg-white"
              : "border-gray-800 bg-gray-900/70 backdrop-blur-md"
            }`}
        >
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition-transform hover:scale-105 ${isLightMode ? "bg-slate-50" : "bg-gray-800/60"
                  }`}
              >
                <IconComponent className="h-5 w-5 text-sky-400 mb-1.5" />
                <p className="text-base font-extrabold text-sky-400 sm:text-xl font-mono">
                  {stat.value}
                </p>
                <p className={`text-[11px] font-semibold mt-0.5 ${isLightMode ? "text-slate-600" : "text-gray-400"}`}>
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Informational Cards & Accordions */}
        <div className="mt-8 w-full space-y-4">
          {/* About Section */}
          <section
            className={`rounded-2xl border p-6 shadow-md transition-colors ${isLightMode ? "border-slate-200 bg-white" : "border-gray-800 bg-gray-900/70 backdrop-blur-md"
              }`}
          >
            <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-sky-400">
              <BookOpen className="h-5 w-5" /> Apa itu Nusakomik?
            </h2>
            <p className={`mt-3 text-sm leading-relaxed ${isLightMode ? "text-slate-600" : "text-gray-300"}`}>
              Nusakomik adalah platform baca manga, manhwa, dan manhua online berbahasa Indonesia yang paling
              lengkap dan terupdate. Dengan ribuan judul dari berbagai genre, Nusakomik menjadi pilihan utama para
              pecinta komik Jepang, Korea, dan China di Indonesia.
            </p>
            <p className={`mt-3 text-sm leading-relaxed ${isLightMode ? "text-slate-600" : "text-gray-300"}`}>
              Nikmati pengalaman membaca yang nyaman dengan update chapter terbaru setiap hari, tampilan modern yang
              responsif di semua perangkat, dan fitur bookmark untuk menyimpan manga favoritmu. Semua bisa kamu akses
              secara gratis!
            </p>
          </section>

          {/* Genre Section */}
          <section
            className={`rounded-2xl border p-6 shadow-md transition-colors ${isLightMode ? "border-slate-200 bg-white" : "border-gray-800 bg-gray-900/70 backdrop-blur-md"
              }`}
          >
            <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-sky-400">
              <Sparkles className="h-5 w-5" /> Jelajahi Genre Komik
            </h2>
            <p className={`mt-2 text-xs sm:text-sm ${isLightMode ? "text-slate-500" : "text-gray-400"}`}>
              Temukan ribuan manga, manhwa, dan manhua sesuai genre favoritmu:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {genreItems.map((genre) => (
                <span
                  key={genre}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all duration-200 hover:scale-105 cursor-pointer ${isLightMode
                      ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-sky-400 hover:bg-gradient-to-r hover:from-sky-400 hover:to-blue-600 hover:text-white"
                      : "border-gray-800 bg-gray-800/80 text-gray-300 hover:border-sky-400 hover:bg-gradient-to-r hover:from-sky-400 hover:to-blue-600 hover:text-white"
                    }`}
                >
                  {genre}
                </span>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section
            className={`rounded-2xl border p-6 shadow-md transition-colors ${isLightMode ? "border-slate-200 bg-white" : "border-gray-800 bg-gray-900/70 backdrop-blur-md"
              }`}
          >
            <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-sky-400">
              <Zap className="h-5 w-5" /> Keunggulan Nusakomik
            </h2>
            <ul className="mt-4 space-y-3 text-xs sm:text-sm">
              {[
                { title: "Koleksi Terlengkap", desc: "Ribuan judul manga, manhwa, dan manhua dalam bahasa Indonesia." },
                { title: "Update Tercepat", desc: "Chapter terbaru rilis setiap hari tanpa terlambat." },
                { title: "Akses Perangkat", desc: "Tampilan responsif di HP, tablet, dan aplikasi Android." },
                { title: "Bookmark & Riwayat", desc: "Simpan judul favorit dan lanjutkan dari halaman terakhir." },
                { title: "Mode Gelap & Terang", desc: "Tampilan visual nyaman untuk mata kapan pun dibaca." },
                { title: "Fitur Premium", desc: "Pengalaman baca bebas dari gangguan iklan." },
              ].map((feat) => (
                <li key={feat.title} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
                  <div>
                    <span className={`font-bold ${isLightMode ? "text-slate-900" : "text-gray-100"}`}>
                      {feat.title}
                    </span>{" "}
                    —{" "}
                    <span className={isLightMode ? "text-slate-600" : "text-gray-400"}>
                      {feat.desc}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* FAQ Accordion */}
          <section
            className={`rounded-2xl border p-6 shadow-md transition-colors ${isLightMode ? "border-slate-200 bg-white" : "border-gray-800 bg-gray-900/70 backdrop-blur-md"
              }`}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-sky-400">
                <Globe className="h-5 w-5" /> Pertanyaan Umum (FAQ)
              </h2>
              <button
                type="button"
                onClick={toggleAllFaq}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${isLightMode
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                {allFaqOpen ? "Tutup Semua" : "Buka Semua"}
              </button>
            </div>

            <div className="space-y-3">
              {faqItems.map((item) => {
                const isOpen = openFaqItems.has(item.question);
                return (
                  <div
                    key={item.question}
                    className={`rounded-xl border transition-colors overflow-hidden ${isLightMode
                        ? isOpen ? "border-sky-300 bg-sky-50/50" : "border-slate-200 bg-slate-50"
                        : isOpen ? "border-sky-900/80 bg-sky-950/20" : "border-gray-800/80 bg-gray-800/40"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(item.question)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left font-bold text-sm"
                      aria-expanded={isOpen}
                    >
                      <span className={isLightMode ? "text-slate-900" : "text-gray-100"}>
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 text-sky-400 ${isOpen ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0 text-xs sm:text-sm leading-relaxed border-t border-sky-500/10 mt-1">
                        <p className={isLightMode ? "text-slate-600" : "text-gray-300"}>
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer Info */}
          <section
            className={`rounded-2xl border p-6 shadow-md transition-colors text-center ${isLightMode ? "border-slate-200 bg-white" : "border-gray-800 bg-gray-900/70 backdrop-blur-md"
              }`}
          >
            <h2 className="text-lg font-extrabold text-sky-400 mb-2">
              Nusakomik Indonesia
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed max-w-lg mx-auto ${isLightMode ? "text-slate-600" : "text-gray-400"}`}>
              Platform utama baca komik manga, manhwa, dan manhua bahasa Indonesia tercepat, terlengkap, dan gratis.
            </p>
            <p className="mt-4 text-xs font-semibold text-gray-500">
              © {new Date().getFullYear()} Nusakomik. All rights reserved.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
};

export default Landing;
