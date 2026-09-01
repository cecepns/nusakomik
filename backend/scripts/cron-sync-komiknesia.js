/* eslint-disable no-undef */
/* eslint-env node */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
let cron = null;
try {
  cron = require('node-cron');
} catch {
  // Fallback ke built-in timer jika node-cron belum di-install di server
}
const targetDb = require('../db');
const { refreshMangaChapterActivity } = require('../utils/chapterRelease');

let invalidateContentsCaches = () => { };
try {
  const contentsCtrl = require('../controllers/ContentsController');
  if (typeof contentsCtrl.invalidateContentsCaches === 'function') {
    invalidateContentsCaches = contentsCtrl.invalidateContentsCaches;
  }
} catch {
  // Standalone execution fallback
}

// Konfigurasi Database Sumber (Scrapper DB)
const SOURCE_DB_CONFIG = {
  host: process.env.SCRAPPER_DB_HOST || process.env.SOURCE_DB_HOST || 'localhost',
  port: parseInt(process.env.SCRAPPER_DB_PORT || process.env.SOURCE_DB_PORT || '3306', 10),
  user: process.env.SCRAPPER_DB_USER || process.env.SOURCE_DB_USER || 'dev-komiknesia_komiknesia',
  password: process.env.SCRAPPER_DB_PASSWORD || process.env.SOURCE_DB_PASSWORD || '@Komiknesia123',
  database: process.env.SCRAPPER_DB_NAME || process.env.SOURCE_DB_NAME || 'dev-komiknesia_komiknesia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
  connectTimeout: 15000,
};

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function normalizeContentType(raw) {
  const normalized = cleanText(raw).toLowerCase();
  if (!normalized) return 'manga';
  if (normalized.includes('manhwa') || normalized.includes('webtoon')) return 'manhwa';
  if (normalized.includes('manhua')) return 'manhua';
  if (normalized.includes('comic')) return 'comic';
  if (normalized.includes('manga')) return 'manga';
  return 'manga';
}

function normalizeChapterTitle(rawTitle, chapterNumber) {
  const t = cleanText(rawTitle);
  if (!t) return chapterNumber ? `Chapter ${chapterNumber}` : 'Chapter';
  const match = t.match(/chapter\s+([\d.]+)/i);
  if (match) return `Chapter ${match[1]}`;
  return t.split(/\s+\d+\s+\d+$/).shift() || t;
}

function buildLocalChapterSlug(mangaSlug, rawChapterSlug) {
  const cleanManga = cleanText(mangaSlug).toLowerCase();
  const cleanChapter = cleanText(rawChapterSlug).toLowerCase();
  if (cleanChapter.startsWith(cleanManga + '-')) {
    return cleanChapter;
  }
  return `${cleanManga}-${cleanChapter}`;
}

/**
 * Sync genres/categories from source to target without duplicate
 */
async function syncMangaGenres(sourceDb, targetDb, sourceMangaId, targetMangaId) {
  try {
    const [sourceGenres] = await sourceDb.execute(
      `
      SELECT c.name, c.slug
      FROM manga_genres mg
      JOIN categories c ON mg.category_id = c.id
      WHERE mg.manga_id = ?
      `,
      [sourceMangaId]
    );

    if (!sourceGenres.length) return;

    for (const g of sourceGenres) {
      if (!g.slug && !g.name) continue;
      const slug = cleanText(g.slug || g.name).toLowerCase();
      const name = cleanText(g.name || g.slug);

      // Cari atau buat kategori di target DB
      let categoryId;
      const [existingCategory] = await targetDb.execute(
        'SELECT id FROM categories WHERE slug = ? OR name = ? LIMIT 1',
        [slug, name]
      );

      if (existingCategory.length) {
        categoryId = existingCategory[0].id;
      } else {
        const [insertedCat] = await targetDb.execute(
          'INSERT INTO categories (name, slug) VALUES (?, ?)',
          [name, slug]
        );
        categoryId = insertedCat.insertId;
      }

      // Hubungkan ke manga_genres target (hindari duplikat)
      const [existsLink] = await targetDb.execute(
        'SELECT 1 FROM manga_genres WHERE manga_id = ? AND category_id = ? LIMIT 1',
        [targetMangaId, categoryId]
      );

      if (!existsLink.length) {
        await targetDb.execute(
          'INSERT INTO manga_genres (manga_id, category_id) VALUES (?, ?)',
          [targetMangaId, categoryId]
        );
      }
    }
  } catch (err) {
    console.warn(`[WARN] Gagal sync genres untuk manga ${targetMangaId}:`, err.message);
  }
}

/**
 * Upsert Manga dari Source ke Target (Anti-Duplicate by Slug)
 */
async function upsertManga(sourceManga, targetDb) {
  const slug = cleanText(sourceManga.slug);
  if (!slug) return null;

  const [existingManga] = await targetDb.execute(
    'SELECT * FROM manga WHERE slug = ? LIMIT 1',
    [slug]
  );

  let targetMangaId;
  let isCreated = false;

  const contentType = normalizeContentType(sourceManga.content_type);
  const rating = sourceManga.rating != null && Number.isFinite(Number(sourceManga.rating)) && Number(sourceManga.rating) > 0
    ? Number(sourceManga.rating)
    : null;

  if (existingManga.length > 0) {
    const existing = existingManga[0];
    targetMangaId = existing.id;

    // Update field jika di target masih kosong atau source punya data baru
    const setClauses = [];
    const values = [];

    if ((!existing.alternative_name || String(existing.alternative_name).trim() === '') && sourceManga.alternative_name) {
      setClauses.push('alternative_name = ?');
      values.push(sourceManga.alternative_name);
    }

    if ((!existing.synopsis || String(existing.synopsis).trim() === '') && sourceManga.synopsis) {
      setClauses.push('synopsis = ?');
      values.push(sourceManga.synopsis);
    }

    if ((!existing.thumbnail || String(existing.thumbnail).trim() === '') && sourceManga.thumbnail) {
      setClauses.push('thumbnail = ?');
      values.push(sourceManga.thumbnail);
    }

    if ((!existing.cover_background || String(existing.cover_background).trim() === '') && sourceManga.cover_background) {
      setClauses.push('cover_background = ?');
      values.push(sourceManga.cover_background);
    }

    if (sourceManga.status && sourceManga.status !== existing.status) {
      setClauses.push('status = ?');
      values.push(sourceManga.status);
    }

    if (rating && (!existing.rating || existing.rating <= 0)) {
      setClauses.push('rating = ?');
      values.push(rating);
    }

    if (setClauses.length > 0) {
      values.push(targetMangaId);
      await targetDb.execute(`UPDATE manga SET ${setClauses.join(', ')} WHERE id = ?`, values);
    }
  } else {
    // Insert baru
    const [insertRes] = await targetDb.execute(
      `INSERT INTO manga (
        title, slug, author, synopsis, category_id, thumbnail, cover_background,
        alternative_name, content_type, country_id, \`release\`, status, rating, color, source, is_input_manual
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sourceManga.title || 'Untitled',
        slug,
        sourceManga.author || 'Unknown',
        sourceManga.synopsis || null,
        null,
        sourceManga.thumbnail || null,
        sourceManga.cover_background || null,
        sourceManga.alternative_name || null,
        contentType,
        sourceManga.country_id || null,
        sourceManga.release || null,
        sourceManga.status || 'ongoing',
        rating,
        Boolean(sourceManga.color),
        sourceManga.source || 'scrapper',
        true,
      ]
    );

    targetMangaId = insertRes.insertId;
    isCreated = true;
  }

  return { targetMangaId, isCreated, slug };
}

/**
 * Upsert Chapters and Chapter Images from Source to Target
 */
async function syncChaptersAndImages(sourceDb, targetDb, sourceMangaId, targetMangaId, mangaSlug, options = {}) {
  let chaptersCreated = 0;
  let chaptersUpdated = 0;
  let imagesInserted = 0;

  // 1. Ambil list chapters dari Source DB
  let query = 'SELECT * FROM chapters WHERE manga_id = ? ORDER BY CAST(chapter_number AS DECIMAL(10,2)) ASC, id ASC';
  if (options.latestOnly) {
    query = 'SELECT * FROM chapters WHERE manga_id = ? ORDER BY CAST(chapter_number AS DECIMAL(10,2)) DESC, id DESC LIMIT 1';
  }

  const [sourceChapters] = await sourceDb.execute(query, [sourceMangaId]);

  if (!sourceChapters.length) {
    return { chaptersCreated, chaptersUpdated, imagesInserted };
  }

  for (const sCh of sourceChapters) {
    const rawChapterSlug = sCh.slug || `chapter-${sCh.chapter_number}`;
    const localSlug = buildLocalChapterSlug(mangaSlug, rawChapterSlug);
    const chapterTitle = normalizeChapterTitle(sCh.title, sCh.chapter_number);
    const chapterNumber = sCh.chapter_number !== null && sCh.chapter_number !== undefined ? String(sCh.chapter_number) : null;

    // Cek keberadaan chapter di target DB (Anti-Duplicate by localSlug atau manga_id + chapter_number)
    let [existingCh] = await targetDb.execute(
      'SELECT id, slug, chapter_number FROM chapters WHERE slug = ? LIMIT 1',
      [localSlug]
    );

    if (!existingCh.length && chapterNumber !== null) {
      [existingCh] = await targetDb.execute(
        'SELECT id, slug, chapter_number FROM chapters WHERE manga_id = ? AND chapter_number = ? LIMIT 1',
        [targetMangaId, chapterNumber]
      );
    }

    let targetChapterId;
    let isNewChapter = false;

    if (existingCh.length) {
      targetChapterId = existingCh[0].id;
      // Update chapter_number jika sebelumnya berbeda
      if (chapterNumber && existingCh[0].chapter_number !== chapterNumber) {
        await targetDb.execute(
          'UPDATE chapters SET chapter_number = ? WHERE id = ?',
          [chapterNumber, targetChapterId]
        );
      }
      chaptersUpdated++;
    } else {
      const [resCh] = await targetDb.execute(
        `INSERT INTO chapters (
          manga_id, title, chapter_number, slug, cover, scheduled_release_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetMangaId,
          chapterTitle,
          chapterNumber,
          localSlug,
          sCh.cover || null,
          sCh.scheduled_release_at || null,
          sCh.created_at || new Date(),
          sCh.updated_at || new Date(),
        ]
      );
      targetChapterId = resCh.insertId;
      isNewChapter = true;
      chaptersCreated++;
    }

    // 2. Sync Chapter Images
    // Ambil images dari Source DB
    const [sourceImages] = await sourceDb.execute(
      'SELECT image_path, page_number FROM chapter_images WHERE chapter_id = ? ORDER BY page_number ASC',
      [sCh.id]
    );

    if (sourceImages.length > 0) {
      // Ambil existing images di target DB untuk chapter ini
      const [targetExistingImages] = await targetDb.execute(
        'SELECT image_path, page_number FROM chapter_images WHERE chapter_id = ?',
        [targetChapterId]
      );

      // Jika chapter baru atau gambar di target masih kosong/belum lengkap
      if (isNewChapter || targetExistingImages.length === 0) {
        if (!isNewChapter) {
          // Bersihkan data lama jika tidak lengkap agar urutan page_number konsisten
          await targetDb.execute('DELETE FROM chapter_images WHERE chapter_id = ?', [targetChapterId]);
        }

        for (let i = 0; i < sourceImages.length; i++) {
          const img = sourceImages[i];
          const pageNum = img.page_number || (i + 1);
          await targetDb.execute(
            'INSERT INTO chapter_images (chapter_id, image_path, page_number) VALUES (?, ?, ?)',
            [targetChapterId, img.image_path, pageNum]
          );
          imagesInserted++;
        }
      } else if (targetExistingImages.length < sourceImages.length) {
        // Jika ada penambahan page baru di source
        const existingPages = new Set(targetExistingImages.map((img) => img.page_number));
        const existingPaths = new Set(targetExistingImages.map((img) => img.image_path));

        for (let i = 0; i < sourceImages.length; i++) {
          const img = sourceImages[i];
          const pageNum = img.page_number || (i + 1);

          if (!existingPages.has(pageNum) && !existingPaths.has(img.image_path)) {
            await targetDb.execute(
              'INSERT INTO chapter_images (chapter_id, image_path, page_number) VALUES (?, ?, ?)',
              [targetChapterId, img.image_path, pageNum]
            );
            imagesInserted++;
          }
        }
      }
    }
  }

  return { chaptersCreated, chaptersUpdated, imagesInserted };
}

/**
 * Main Sync Runner
 */
async function runSync(options = {}) {
  const startTime = Date.now();
  console.log('====================================================');
  console.log(`[${new Date().toISOString()}] 🚀 Memulai Sinkronisasi Data Manga...`);
  console.log(`Target DB: Nusakomik (@db/index.js)`);
  console.log(`Source DB: ${SOURCE_DB_CONFIG.user}@${SOURCE_DB_CONFIG.host}/${SOURCE_DB_CONFIG.database}`);
  if (options.slug) console.log(`Filter Slug: ${options.slug}`);
  if (options.limit) console.log(`Limit: ${options.limit}`);
  if (options.sinceHours) console.log(`Sync data yang diperbarui dalam ${options.sinceHours} jam terakhir`);
  console.log('====================================================');

  const sourceDb = mysql.createPool(SOURCE_DB_CONFIG);

  const stats = {
    totalSourceManga: 0,
    mangaCreated: 0,
    mangaUpdated: 0,
    chaptersCreated: 0,
    chaptersUpdated: 0,
    imagesInserted: 0,
    errors: 0,
  };

  try {
    // 1. Ambil list manga dari source DB berdasarkan aktivitas chapter terbaru atau manga terbaru
    let query = `
      SELECT m.*, COALESCE(MAX(c.created_at), m.updated_at, m.created_at) AS last_activity
      FROM manga m
      LEFT JOIN chapters c ON c.manga_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (options.slug) {
      query += ' AND m.slug = ?';
      params.push(options.slug);
    }

    if (options.sinceHours) {
      query += ' AND (c.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR) OR m.updated_at >= DATE_SUB(NOW(), INTERVAL ? HOUR) OR m.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR))';
      params.push(Number(options.sinceHours), Number(options.sinceHours), Number(options.sinceHours));
    }

    query += ' GROUP BY m.id ORDER BY last_activity DESC, m.id DESC';

    const limit = options.limit !== undefined ? options.limit : 50;
    if (limit && Number(limit) > 0) {
      query += ' LIMIT ?';
      params.push(Number(limit));
    }

    const [sourceMangaList] = await sourceDb.execute(query, params);
    stats.totalSourceManga = sourceMangaList.length;

    console.log(`📦 Ditemukan ${sourceMangaList.length} manga (limit: ${limit}) dari Source DB untuk diproses.`);

    for (let i = 0; i < sourceMangaList.length; i++) {
      const sManga = sourceMangaList[i];
      const progress = `[${i + 1}/${sourceMangaList.length}]`;

      try {
        // 2. Upsert Manga
        const mangaRes = await upsertManga(sManga, targetDb);
        if (!mangaRes) {
          console.warn(`${progress} ⚠️ Dilewati (slug kosong): ${sManga.title}`);
          continue;
        }

        const { targetMangaId, isCreated, slug } = mangaRes;
        if (isCreated) {
          stats.mangaCreated++;
          console.log(`${progress} ➕ [BARU] Manga: "${sManga.title}" (Slug: ${slug}, Target ID: ${targetMangaId})`);
        } else {
          stats.mangaUpdated++;
          console.log(`${progress} 🔄 [UPDATE] Manga: "${sManga.title}" (Slug: ${slug}, Target ID: ${targetMangaId})`);
        }

        // 3. Sync Genres
        await syncMangaGenres(sourceDb, targetDb, sManga.id, targetMangaId);

        // 4. Sync Chapters & Chapter Images
        const chRes = await syncChaptersAndImages(
          sourceDb,
          targetDb,
          sManga.id,
          targetMangaId,
          slug,
          options
        );

        stats.chaptersCreated += chRes.chaptersCreated;
        stats.chaptersUpdated += chRes.chaptersUpdated;
        stats.imagesInserted += chRes.imagesInserted;

        if (chRes.chaptersCreated > 0 || chRes.imagesInserted > 0) {
          console.log(
            `    ↳ +${chRes.chaptersCreated} chapter baru, ${chRes.chaptersUpdated} chapter dicek, +${chRes.imagesInserted} gambar baru.`
          );
          // Touch target manga updated_at jika ada chapter baru agar langsung naik ke ranking teratas update
          if (chRes.chaptersCreated > 0) {
            await targetDb.execute('UPDATE manga SET updated_at = NOW() WHERE id = ?', [targetMangaId]);
          }
        }

        // 5. Refresh activity cache manga di target
        await refreshMangaChapterActivity(targetDb, targetMangaId);

      } catch (errManga) {
        stats.errors++;
        console.error(`${progress} ❌ Error memproses manga "${sManga.title || sManga.slug}":`, errManga.message);
      }
    }

    // Invalidate frontend cache jika ada
    try {
      invalidateContentsCaches();
    } catch {
      // ignore
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log(`[${new Date().toISOString()}] ✅ SINKRONISASI SELESAI dalam ${duration} detik`);
    console.log(`📊 Statistik:`);
    console.log(`   - Total Manga Diperiksa: ${stats.totalSourceManga}`);
    console.log(`   - Manga Baru Dibuat:     ${stats.mangaCreated}`);
    console.log(`   - Manga Diperbarui:      ${stats.mangaUpdated}`);
    console.log(`   - Chapter Baru Ditambah: ${stats.chaptersCreated}`);
    console.log(`   - Chapter Terverifikasi: ${stats.chaptersUpdated}`);
    console.log(`   - Gambar Baru Dimasukkan:${stats.imagesInserted}`);
    console.log(`   - Error:                 ${stats.errors}`);
    console.log('====================================================');

  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
  } finally {
    try {
      await sourceDb.end();
    } catch {
      // ignore
    }
  }

  return stats;
}

// Parse Command Line Arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 50, // Default 50 manga terakhir
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg.startsWith('--slug=')) {
      options.slug = arg.split('=')[1].trim();
    } else if (arg === '--slug' && args[i + 1]) {
      options.slug = args[++i].trim();
    } else if (arg.startsWith('--since=')) {
      options.sinceHours = parseFloat(arg.split('=')[1]);
    } else if (arg === '--since' && args[i + 1]) {
      options.sinceHours = parseFloat(args[++i]);
    } else if (arg === '--latest-only') {
      options.latestOnly = true;
    } else if (arg === '--once') {
      options.once = true;
    } else if (arg.startsWith('--cron=')) {
      options.cronSchedule = arg.split('=')[1].trim();
    } else if (arg === '--cron' && args[i + 1]) {
      options.cronSchedule = args[++i].trim();
    }
  }

  return options;
}

let isSyncRunning = false;

async function safeRunSync(options) {
  if (isSyncRunning) {
    console.warn(`[${new Date().toISOString()}] ⚠️ Sync sebelumnya masih berjalan, melewati jadwal ini.`);
    return;
  }
  isSyncRunning = true;
  try {
    await runSync(options);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error saat sinkronisasi:`, err);
  } finally {
    isSyncRunning = false;
  }
}

// Eksekusi jika dipanggil langsung via CLI / PM2
if (require.main === module) {
  const options = parseArgs();

  if (options.once) {
    // Mode sekali jalan (One-off execution)
    console.log('🏁 Mode --once: Menjalankan sinkronisasi 1 kali lalu selesai.');
    runSync(options)
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('Execution failed:', err);
        process.exit(1);
      });
  } else {
    // Mode Background / PM2 dengan node-cron (default tiap 30 menit)
    const cronSchedule = options.cronSchedule || '*/30 * * * *';
    console.log(`🤖 [PM2 / Daemon Mode Aktif]`);
    console.log(`⏰ Jadwal cronjob: "${cronSchedule}" (Tiap 30 Menit)`);
    console.log(`📑 Limit data: ${options.limit} manga terakhir (ORDER BY last_activity DESC)`);

    // 1. Jalankan langsung saat pertama kali start PM2
    console.log(`▶️ Menjalankan sync awal saat inisialisasi...`);
    safeRunSync(options);

    // 2. Jadwalkan berjalan otomatis setiap 30 menit
    if (cron && typeof cron.schedule === 'function') {
      cron.schedule(cronSchedule, () => {
        console.log(`\n⏰ [CRON TRIGGER] Memulai sync terjadwal (${cronSchedule})...`);
        safeRunSync(options);
      });
    } else {
      const intervalMs = 30 * 60 * 1000;
      console.log(`ℹ️ [INFO] Library node-cron belum terinstall di server, menggunakan built-in interval timer (${intervalMs / 1000 / 60} menit).`);
      setInterval(() => {
        console.log(`\n⏰ [TIMER TRIGGER] Memulai sync terjadwal (setiap 30 menit)...`);
        safeRunSync(options);
      }, intervalMs);
    }
  }
}

module.exports = {
  runSync,
  upsertManga,
  syncChaptersAndImages,
  syncMangaGenres,
};

