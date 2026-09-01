import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  BookOpen,
  Filter,
  Check,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../utils/api';
import LazyImage from '../../components/LazyImage';

export default function KomiknesiaSync() {
  // Connection & Feed state
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [contentType, setContentType] = useState('all');
  const [mangaStatus, setMangaStatus] = useState('all');
  const [sinceHours, setSinceHours] = useState('0');

  // Sync controls & options
  const [latestOnly, setLatestOnly] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [syncLimit, setSyncLimit] = useState('50');
  const [selectedSlugs, setSelectedSlugs] = useState([]);

  // Running status
  const [busy, setBusy] = useState(false);
  const [syncingSlug, setSyncingSlug] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);

  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await apiClient.getKomiknesiaSyncStatus();
      setConnectionStatus(res);
    } catch (err) {
      setConnectionStatus({
        status: false,
        connected: false,
        error: err.message || 'Koneksi ke server gagal',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const res = await apiClient.getKomiknesiaSourceFeed({
        page: pagination.page,
        limit: pagination.limit,
        search,
        contentType: contentType === 'all' ? '' : contentType,
        status: mangaStatus === 'all' ? '' : mangaStatus,
        sinceHours: parseFloat(sinceHours) || 0,
      });

      if (res && res.status) {
        setFeed(res.data || []);
        if (res.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.pagination.total || 0,
            totalPages: res.pagination.totalPages || 1,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching Komiknesia source feed:', err);
    } finally {
      setFeedLoading(false);
    }
  }, [pagination.page, pagination.limit, search, contentType, mangaStatus, sinceHours]);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearch(searchInput.trim());
  };

  const handleSelectToggle = (slug) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSelectAllOnPage = () => {
    const pageSlugs = feed.map((m) => m.slug);
    const allSelected = pageSlugs.every((s) => selectedSlugs.includes(s));

    if (allSelected) {
      setSelectedSlugs((prev) => prev.filter((s) => !pageSlugs.includes(s)));
    } else {
      setSelectedSlugs((prev) => [...new Set([...prev, ...pageSlugs])]);
    }
  };

  // 1. Sync Latest N Manga
  const handleSyncLatest = async () => {
    const limitNum = parseInt(syncLimit, 10) || 50;
    const hoursNum = parseFloat(sinceHours) || null;
    const confirmMsg = `Sync ${limitNum} manga terupdate dari Komiknesia?`;
    if (!window.confirm(confirmMsg)) return;

    setBusy(true);
    setSyncResult(null);
    setSyncLogs((prev) => [
      {
        type: 'info',
        text: `Memulai sync ${limitNum} manga terupdate... (latestOnly: ${latestOnly})`,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    try {
      const res = await apiClient.syncKomiknesiaLatest({
        limit: limitNum,
        sinceHours: hoursNum,
        latestOnly,
      });

      setSyncResult(res);
      setSyncLogs((prev) => [
        {
          type: res?.status ? 'success' : 'error',
          text: res?.message || 'Sync selesai.',
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      fetchFeed();
    } catch (err) {
      setSyncLogs((prev) => [
        {
          type: 'error',
          text: `Sync gagal: ${err.message || 'Unknown error'}`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } finally {
      setBusy(false);
    }
  };

  // 2. Sync Single Manga by Slug
  const handleSyncSingle = async (slugToSync) => {
    const targetSlug = slugToSync || customSlug.trim();
    if (!targetSlug) {
      alert('Masukkan slug manga yang ingin disinkronkan');
      return;
    }

    setSyncingSlug(targetSlug);
    setBusy(true);
    setSyncLogs((prev) => [
      {
        type: 'info',
        text: `Memulai sync manga "${targetSlug}"...`,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    try {
      const res = await apiClient.syncKomiknesiaBySlug(targetSlug, { latestOnly });
      setSyncResult(res);
      setSyncLogs((prev) => [
        {
          type: res?.status ? 'success' : 'error',
          text: res?.message || `Sync "${targetSlug}" selesai.`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      if (!slugToSync) setCustomSlug('');
      fetchFeed();
    } catch (err) {
      setSyncLogs((prev) => [
        {
          type: 'error',
          text: `Gagal sync "${targetSlug}": ${err.message || 'Unknown error'}`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } finally {
      setSyncingSlug(null);
      setBusy(false);
    }
  };

  // 3. Sync Selected Manga
  const handleSyncSelected = async () => {
    if (!selectedSlugs.length) {
      alert('Pilih minimal 1 komik untuk disinkronkan');
      return;
    }

    if (!window.confirm(`Yakin ingin melakukan sinkronisasi ${selectedSlugs.length} komik terpilih?`)) {
      return;
    }

    setBusy(true);
    setSyncResult(null);
    setSyncLogs((prev) => [
      {
        type: 'info',
        text: `Memulai sync ${selectedSlugs.length} komik terpilih...`,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    try {
      const res = await apiClient.syncKomiknesiaSelected(selectedSlugs, { latestOnly });
      setSyncResult(res);
      setSelectedSlugs([]);
      setSyncLogs((prev) => [
        {
          type: res?.status ? 'success' : 'error',
          text: res?.message || 'Sync selesai.',
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      fetchFeed();
    } catch (err) {
      setSyncLogs((prev) => [
        {
          type: 'error',
          text: `Gagal sync: ${err.message || 'Unknown error'}`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sinkronisasi Database Komiknesia
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Tarik data komik, chapter, dan gambar dari database pusat Komiknesia ke Nusakomik.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              checkStatus();
              fetchFeed();
            }}
            disabled={feedLoading || statusLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${feedLoading || statusLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Database Connection Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Status Koneksi Source DB</span>
            <div className="flex items-center gap-2">
              {statusLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  <span>Memeriksa koneksi...</span>
                </div>
              ) : connectionStatus?.connected ? (
                <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Terhubung ke Komiknesia</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-500 font-bold text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Gagal Terhubung</span>
                </div>
              )}
            </div>
            {connectionStatus?.database && (
              <p className="text-[11px] text-gray-400 font-mono">
                {connectionStatus.user}@{connectionStatus.host}/{connectionStatus.database}
              </p>
            )}
            {connectionStatus?.error && (
              <p className="text-[11px] text-red-400 line-clamp-1">{connectionStatus.error}</p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Database className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Komik di Komiknesia</span>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {connectionStatus?.totalSourceManga?.toLocaleString('id-ID') ?? '-'}
            </p>
            <span className="text-[11px] text-gray-400">Tersedia untuk disinkronkan</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Chapter di Komiknesia</span>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {connectionStatus?.totalSourceChapters?.toLocaleString('id-ID') ?? '-'}
            </p>
            <span className="text-[11px] text-gray-400">Termasuk gambar lengkap</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Layers className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Sync Control & Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-500" />
            Panel Aksi Sinkronisasi
          </h2>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={latestOnly}
              onChange={(e) => setLatestOnly(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
            />
            <span>Hanya chapter terbaru (Lebih Cepat)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Action: Sync N Latest */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>Sinkronisasi Batch Komik Terupdate</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Menarik komik dengan aktivitas chapter atau update terbaru dari Komiknesia secara otomatis.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={syncLimit}
                onChange={(e) => setSyncLimit(e.target.value)}
                disabled={busy}
                className="rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
              >
                <option value="10">10 Komik Terakhir</option>
                <option value="25">25 Komik Terakhir</option>
                <option value="50">50 Komik Terakhir (Default)</option>
                <option value="100">100 Komik Terakhir</option>
                <option value="200">200 Komik Terakhir</option>
              </select>

              <select
                value={sinceHours}
                onChange={(e) => setSinceHours(e.target.value)}
                disabled={busy}
                className="rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
              >
                <option value="0">Semua Waktu</option>
                <option value="12">12 Jam Terakhir</option>
                <option value="24">24 Jam Terakhir</option>
                <option value="48">48 Jam Terakhir</option>
                <option value="168">7 Hari Terakhir</option>
              </select>

              <button
                type="button"
                onClick={handleSyncLatest}
                disabled={busy || !connectionStatus?.connected}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-sm active:scale-95 disabled:opacity-50 transition-all ml-auto"
              >
                {busy && !syncingSlug ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                <span>Mulai Sync Batch</span>
              </button>
            </div>
          </div>

          {/* Quick Action: Sync by Custom Slug */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
              <Search className="h-4 w-4 text-blue-500" />
              <span>Sinkronisasi Spesifik Berdasarkan Slug</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ketik slug komik dari database Komiknesia untuk langsung mengimpor seluruh chapter & gambarnya.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSyncSingle();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Contoh: solo-leveling, martial-peak"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                disabled={busy}
                className="flex-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={busy || !customSlug.trim() || !connectionStatus?.connected}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm active:scale-95 disabled:opacity-50 transition-all shrink-0"
              >
                {syncingSlug === customSlug.trim() ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                <span>Sync Slug Ini</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sync Logs & Stats Output */}
      {syncLogs.length > 0 && (
        <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 font-mono text-xs text-gray-300 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span className="text-emerald-400 font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Log Aktivitas Sinkronisasi
            </span>
            <button
              onClick={() => setSyncLogs([])}
              className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Bersihkan Log
            </button>
          </div>

          {syncResult?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-[11px]">
              <div>
                <span className="text-gray-400">Manga Baru:</span>{' '}
                <span className="text-emerald-400 font-bold">{syncResult.stats.mangaCreated || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Manga Update:</span>{' '}
                <span className="text-blue-400 font-bold">{syncResult.stats.mangaUpdated || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Chapter Baru:</span>{' '}
                <span className="text-amber-400 font-bold">{syncResult.stats.chaptersCreated || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Gambar Baru:</span>{' '}
                <span className="text-purple-400 font-bold">{syncResult.stats.imagesInserted || 0}</span>
              </div>
            </div>
          )}

          <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
            {syncLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-gray-600 text-[10px] shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === 'error'
                      ? 'text-red-400 font-semibold'
                      : log.type === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : 'text-gray-300'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed Filter & Search */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul komik atau slug di database Komiknesia..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-20 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
            >
              Cari
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={contentType}
              onChange={(e) => {
                setContentType(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs text-gray-800 dark:text-gray-200"
            >
              <option value="all">Semua Tipe</option>
              <option value="manga">Manga</option>
              <option value="manhwa">Manhwa</option>
              <option value="manhua">Manhua</option>
            </select>

            <select
              value={mangaStatus}
              onChange={(e) => {
                setMangaStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs text-gray-800 dark:text-gray-200"
            >
              <option value="all">Semua Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>

            <button
              onClick={handleSelectAllOnPage}
              disabled={feed.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {feed.length > 0 && feed.every((m) => selectedSlugs.includes(m.slug)) ? (
                <>
                  <CheckSquare className="h-4 w-4 text-red-500" />
                  <span>Batalkan Semua</span>
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  <span>Pilih Semua di Halaman</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feed Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-600 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <span className="sr-only">Select</span>
                </th>
                <th className="p-3.5 min-w-[240px]">Manga</th>
                <th className="p-3.5">Tipe</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Source Chapters</th>
                <th className="p-3.5">Status di Nusakomik</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
              {feedLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin text-red-500 mx-auto mb-2" />
                    <span>Memuat daftar manga dari database Komiknesia...</span>
                  </td>
                </tr>
              ) : feed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <Database className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-300">Tidak ada komik ditemukan</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Coba ganti kata kunci pencarian atau filter tipe/status.
                    </p>
                  </td>
                </tr>
              ) : (
                feed.map((m) => {
                  const isSelected = selectedSlugs.includes(m.slug);
                  const isSyncingThis = syncingSlug === m.slug;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                        isSelected ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleSelectToggle(m.slug)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-red-500" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-10 shrink-0 rounded-lg overflow-hidden bg-gray-800 border border-white/10">
                            {m.thumbnail ? (
                              <LazyImage
                                src={m.thumbnail}
                                alt={m.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-500 text-[10px]">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[260px] sm:max-w-xs">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {m.title}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono truncate">{m.slug}</p>
                            <span className="text-[10px] text-gray-400">
                              Aktivitas: {new Date(m.last_activity).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {m.content_type || 'manga'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            m.status === 'completed'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}
                        >
                          {m.status || 'ongoing'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {m.total_chapters} chapter
                          </p>
                          {m.latest_chapter_num != null && (
                            <span className="text-[10px] text-gray-400">
                              Ch. {m.latest_chapter_num}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {m.in_target ? (
                          m.is_synced ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                              <Check className="h-3.5 w-3.5" />
                              Up-to-date ({m.target_chapters} ch)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Tertinggal ({m.target_chapters}/{m.total_chapters} ch)
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                            Belum Ada di Nusakomik
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleSyncSingle(m.slug)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                        >
                          {isSyncingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3 fill-current" />
                          )}
                          <span>Sync</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400">
          <div>
            Menampilkan {feed.length} dari total {pagination.total.toLocaleString('id-ID')} komik di Komiknesia
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1 || feedLoading}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
              }
              disabled={pagination.page >= pagination.totalPages || feedLoading}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Selected Toolbar */}
      {selectedSlugs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
              {selectedSlugs.length}
            </span>
            <span className="text-xs sm:text-sm font-semibold">Komik Dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncSelected}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50 transition-all"
            >
              {busy && !syncingSlug ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              <span>Sync {selectedSlugs.length} Komik Terpilih</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSlugs([])}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
