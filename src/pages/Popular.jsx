import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import LazyImage from "../components/LazyImage";
import AdBanner from "../components/AdBanner";
import { useAds } from "../hooks/useAds";
import { apiClient, getImageUrl } from "../utils/api";

const TABS = [
  { id: "manhwa", label: "Manhwa", subtitle: "50 komik populer (Korea)" },
  { id: "manga", label: "Manga", subtitle: "50 komik populer (Jepang)" },
  { id: "manhua", label: "Manhua", subtitle: "50 komik populer (China)" },
];

const PER_PAGE = 50;

const tabBtnTrans = "transition-all duration-200";
const tabActiveClass = `rounded-xl border border-sky-500/25 bg-sky-600 font-semibold text-white shadow-[0_4px_0_0_#0369a1] ${tabBtnTrans} dark:border-cyan-200/20 dark:bg-[#0b355f] dark:text-cyan-50 dark:shadow-[0_4px_0_0_#42a5f5]`;
const tabInactiveClass = `rounded-xl border border-transparent font-semibold text-slate-700 hover:bg-white hover:shadow-[0_2px_0_0_#e2e8f0] ${tabBtnTrans} dark:text-cyan-200/70 dark:hover:bg-primary-800 dark:hover:text-cyan-100 dark:hover:shadow-[0_2px_0_0_#1e3a5f]`;

const Popular = () => {
  const navigate = useNavigate();
  const { ads: popularTopAds } = useAds("popular-top");
  const { ads: popularFooterAds } = useAds("popular-footer");
  const [activeTab, setActiveTab] = useState("manhwa");
  const [lists, setLists] = useState({ manhwa: [], manga: [], manhua: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [manhwaRes, mangaRes, manhuaRes] = await Promise.all(
          TABS.map(async (tab) => {
            const res = await fetch(
              `https://api-be.komiknesia.my.id/api/contents?page=1&per_page=${PER_PAGE}&type=${tab.id}&orderBy=Popular`
            );
            return res.json();
          })
        );
        if (cancelled) return;
        setLists({
          manhwa: manhwaRes.data || [],
          manga: mangaRes.data || [],
          manhua: manhuaRes.data || [],
        });
      } catch (e) {
        console.error("Popular page fetch:", e);
        if (!cancelled) {
          setError("Gagal memuat daftar populer.");
          setLists({ manhwa: [], manga: [], manhua: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeMeta = TABS.find((t) => t.id === activeTab) || TABS[0];
  const items = lists[activeTab] || [];

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-gray-100">
      <Helmet>
        <title>Populer | KomikNesia</title>
        <meta
          name="description"
          content="Daftar komik populer: Manhwa, Manga, dan Manhua — masing-masing 50 judul teratas di KomikNesia."
        />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 md:pt-8">
        <header className="mb-8 text-left">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
            Halaman populer
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 md:text-base">
            Pilih kategori: Manhwa, Manga, atau Manhua — masing-masing 50 judul populer.
          </p>
        </header>

        {popularTopAds.length > 0 && (
          <div className="mb-8">
            <AdBanner ads={popularTopAds} layout="grid" columns={2} />
          </div>
        )}

        <div className="mb-8 flex gap-1 rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1 dark:border-cyan-200/15 dark:bg-[#0a2d52]/60">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2.5 text-sm sm:py-3 sm:text-base ${
                activeTab === tab.id ? tabActiveClass : tabInactiveClass
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-500" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Memuat...</p>
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : (
          <section aria-labelledby={`popular-${activeTab}`}>
            <div className="mb-5 border-b border-gray-200 pb-3 dark:border-white/10">
              <h2
                id={`popular-${activeTab}`}
                className="text-xl font-bold text-gray-900 dark:text-gray-100 md:text-2xl"
              >
                {activeMeta.label}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {activeMeta.subtitle}
              </p>
            </div>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-gray-500 dark:border-white/20 dark:text-gray-400">
                Tidak ada data {activeMeta.label}.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map((manga) => (
                  <button
                    key={manga.id}
                    type="button"
                    onClick={() => navigate(`/komik/${manga.slug}`)}
                    className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-md transition-all hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06]"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <LazyImage
                        src={getImageUrl(manga.cover)}
                        alt={manga.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        wrapperClassName="h-full w-full"
                      />
                      {manga.rating > 0 && (
                        <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/95 text-[11px] font-bold leading-none text-white shadow-lg backdrop-blur-sm">
                          {Number(manga.rating).toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="flex min-h-[4.5rem] flex-col p-2.5 sm:p-3">
                      {!!manga.hot && (
                        <span className="mb-1 max-w-fit rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white sm:text-xs">
                          HOT
                        </span>
                      )}
                      <h3 className="line-clamp-2 text-xs font-bold text-gray-900 dark:text-gray-100 sm:text-sm">
                        {manga.title}
                      </h3>
                      <span className="mt-auto pt-1 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                        Ch. {manga.lastChapters?.[0]?.number ?? "—"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {popularFooterAds.length > 0 && (
          <div className="mt-10">
            <AdBanner ads={popularFooterAds} layout="grid" columns={2} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Popular;
