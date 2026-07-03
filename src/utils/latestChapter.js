/** Chapter terbaru wajib login selama 2 jam pertama setelah publish. */
export const CHAPTER_LOGIN_LOCK_MS = 2 * 60 * 60 * 1000;

/** @param {Array<{ slug?: string, number?: number|string, chapter_number?: number|string }>} chapters */
export function findLatestChapter(chapters) {
  if (!chapters?.length) return null;
  return chapters.reduce((latest, ch) => {
    const latestNum = parseFloat(latest.number ?? latest.chapter_number ?? 0);
    const chNum = parseFloat(ch.number ?? ch.chapter_number ?? 0);
    return chNum > latestNum ? ch : latest;
  });
}

export function isLatestChapter(chapter, chapters) {
  if (!chapter || !chapters?.length) return false;
  const latest = findLatestChapter(chapters);
  return latest?.slug === chapter.slug;
}

/** @returns {number|null} Waktu publish chapter dalam milliseconds. */
export function getChapterPublishedMs(chapter) {
  if (!chapter) return null;

  if (chapter.uploadedAt != null && !Number.isNaN(Number(chapter.uploadedAt))) {
    return Number(chapter.uploadedAt);
  }

  const time = chapter.created_at?.time;
  if (time != null) {
    const n = Number(time);
    if (!Number.isNaN(n)) return n < 1e12 ? n * 1000 : n;
  }

  if (chapter.created_at?.formatted) {
    const parsed = new Date(chapter.created_at.formatted);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  if (typeof chapter.created_at === 'string') {
    const parsed = new Date(chapter.created_at);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  return null;
}

/** True jika chapter masih dalam window 2 jam pertama sejak publish. */
export function isChapterWithinLoginLockWindow(chapter, nowMs = Date.now()) {
  const publishedMs = getChapterPublishedMs(chapter);
  if (publishedMs == null) return false;
  const ageMs = nowMs - publishedMs;
  if (ageMs < 0) return true;
  return ageMs < CHAPTER_LOGIN_LOCK_MS;
}

/**
 * Chapter terbaru + belum lewat 2 jam + belum login → wajib login.
 * @param {number} [nowMs]
 */
export function requiresLoginForChapter(chapter, chapters, isAuthenticated, nowMs = Date.now()) {
  if (isAuthenticated) return false;
  if (!isLatestChapter(chapter, chapters)) return false;
  return isChapterWithinLoginLockWindow(chapter, nowMs);
}

/** Sisa waktu lock (ms) hingga chapter bisa dibaca tanpa login. */
export function getChapterLoginLockRemainingMs(chapter, nowMs = Date.now()) {
  const publishedMs = getChapterPublishedMs(chapter);
  if (publishedMs == null) return 0;
  const unlockAt = publishedMs + CHAPTER_LOGIN_LOCK_MS;
  return Math.max(0, unlockAt - nowMs);
}

/** Format sisa waktu lock → HH:MM:SS */
export function formatLockCountdown(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export const CHAPTER_LOGIN_LOCK_MESSAGE =
  'Chapter terbaru (kurang dari 2 jam) hanya bisa dibaca setelah login. Setelah 2 jam, bisa dibaca tanpa login.';
