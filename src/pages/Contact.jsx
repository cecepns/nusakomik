import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Mail,
  MessageCircle,
  FileText,
  Loader2,
  Send,
  Music2,
  Instagram,
  Facebook,
} from "lucide-react";
import { apiClient } from "../utils/api";
import { headerNavLinkClass } from "../components/Header";

function normalizeSocialHref(raw) {
  const s = String(raw).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return `https:${s}`;
  return `https://${s.replace(/^\/+/, "")}`;
}

const Contact = () => {
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getContactInfo(true);
      setContactInfo(data);
    } catch (error) {
      console.error("Error fetching contact info:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatWhatsAppNumber = (number) => {
    if (!number) return "";
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.startsWith("62")) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    }
    return number;
  };

  const hasEmail = Boolean(contactInfo?.email?.trim());
  const hasWhatsapp = Boolean(contactInfo?.whatsapp?.trim());

  const socialLinks = useMemo(() => {
    if (!contactInfo) return [];
    const items = [
      {
        key: "telegram",
        label: "Telegram",
        url: contactInfo.telegram_url,
        Icon: Send,
      },
      {
        key: "tiktok",
        label: "TikTok",
        url: contactInfo.tiktok_url,
        Icon: Music2,
      },
      {
        key: "instagram",
        label: "Instagram",
        url: contactInfo.instagram_url,
        Icon: Instagram,
      },
      {
        key: "facebook",
        label: "Facebook",
        url: contactInfo.facebook_url,
        Icon: Facebook,
      },
    ];
    return items.filter((x) => x.url && String(x.url).trim());
  }, [contactInfo]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-primary-950">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-sky-600 dark:text-cyan-400" />
          <p className="text-slate-600 dark:text-slate-400">Memuat informasi kontak…</p>
        </div>
      </div>
    );
  }

  if (!contactInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-primary-950">
        <div className="text-center">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Informasi kontak belum tersedia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 dark:bg-primary-950 sm:px-6 lg:px-8 lg:pt-28">
      <Helmet>
        <title>Hubungi Kami | KomikNesia</title>
        <meta
          name="description"
          content="Hubungi tim KomikNesia melalui email, WhatsApp, atau sosial media. Kami siap membantu menjawab pertanyaan dan mendengarkan saran Anda."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Hubungi kami
          </h1>
          <p className="mx-auto max-w-xl text-base text-slate-600 dark:text-slate-400">
            Kami siap membantu menjawab pertanyaan dan mendengarkan saran Anda.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_6px_0_0_#e2e8f0] dark:border-cyan-200/15 dark:bg-primary-900 dark:shadow-[0_6px_0_0_rgba(30,58,138,0.35)] sm:p-8 md:p-10">
          {contactInfo.description?.trim() && (
            <div className="mb-10 border-b border-slate-200 pb-10 text-center dark:border-primary-700">
              <FileText className="mx-auto mb-3 h-8 w-8 text-sky-600 dark:text-cyan-400" aria-hidden />
              <p className="whitespace-pre-line text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {contactInfo.description.trim()}
              </p>
            </div>
          )}

          {(hasEmail || hasWhatsapp) && (
            <div className="mb-10">
              <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kontak langsung
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {hasEmail && (
                  <a
                    href={`mailto:${contactInfo.email.trim()}`}
                    className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-sky-400/50 hover:bg-white dark:border-primary-700 dark:bg-primary-800/50 dark:hover:border-cyan-500/40 dark:hover:bg-primary-800"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-600 text-white shadow-md dark:bg-[#0b355f]">
                      <Mail className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Email
                    </span>
                    <span className="mt-1 break-all text-sm font-semibold text-sky-700 group-hover:underline dark:text-cyan-300">
                      {contactInfo.email.trim()}
                    </span>
                  </a>
                )}
                {hasWhatsapp && (
                  <a
                    href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-emerald-400/50 hover:bg-white dark:border-primary-700 dark:bg-primary-800/50 dark:hover:border-emerald-500/40 dark:hover:bg-primary-800"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md">
                      <MessageCircle className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      WhatsApp
                    </span>
                    <span className="mt-1 text-sm font-semibold text-emerald-700 group-hover:underline dark:text-emerald-300">
                      {formatWhatsAppNumber(contactInfo.whatsapp)}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sosial media
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {socialLinks.map(({ key, label, url, Icon }) => (
                  <a
                    key={key}
                    href={normalizeSocialHref(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${headerNavLinkClass} gap-2`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {(hasEmail || hasWhatsapp) && (
            <div className="border-t border-slate-200 pt-8 dark:border-primary-700">
              <p className="mb-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                Aksi cepat
              </p>
              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                {hasEmail && (
                  <a
                    href={`mailto:${contactInfo.email.trim()}?subject=Pertanyaan%20tentang%20KomikNesia`}
                    className={headerNavLinkClass}
                  >
                    <Mail className="h-4 w-4 shrink-0" aria-hidden />
                    Kirim email
                  </a>
                )}
                {hasWhatsapp && (
                  <a
                    href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Halo, saya ingin bertanya tentang KomikNesia")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={headerNavLinkClass}
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                    Chat WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-500">
          Kami biasanya merespons dalam 24 jam pada hari kerja.
        </p>
      </div>
    </div>
  );
};

export default Contact;
