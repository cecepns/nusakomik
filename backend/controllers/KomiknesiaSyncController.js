/* global require, module, process */
const mysql = require('mysql2/promise');
const targetDb = require('../db');
const {
  runSync,
  upsertManga,
  syncChaptersAndImages,
  syncMangaGenres,
} = require('../scripts/cron-sync-komiknesia');
const { refreshMangaChapterActivity } = require('../utils/chapterRelease');

let invalidateContentsCaches = () => {};
try {
  const contentsCtrl = require('./ContentsController');
  if (typeof contentsCtrl.invalidateContentsCaches === 'function') {
    invalidateContentsCaches = contentsCtrl.invalidateContentsCaches;
  }
} catch {
  // ignore
}

function getSourceDbConfig() {
  return {
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
}

/**
 * Cek status koneksi ke Database Komiknesia (Source DB)
 */
const checkStatus = async (req, res) => {
  const config = getSourceDbConfig();
  let connection = null;
  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 8000,
    });

    const [[mangaCount]] = await connection.execute('SELECT COUNT(*) as total FROM manga');
    const [[chapterCount]] = await connection.execute('SELECT COUNT(*) as total FROM chapters');

    res.json({
      status: true,
      connected: true,
      host: config.host,
      database: config.database,
      user: config.user,
      totalSourceManga: mangaCount?.total || 0,
      totalSourceChapters: chapterCount?.total || 0,
    });
  } catch (error) {
    console.error('Error connecting to Komiknesia source DB:', error);
    res.json({
      status: false,
      connected: false,
      host: config.host,
      database: config.database,
      user: config.user,
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignore
      }
    }
  }
};

/**
 * Mengambil daftar manga dari Database Komiknesia (Source DB) dengan status keberadaan di Nusakomik
 */
const getSourceFeed = async (req, res) => {
  const config = getSourceDbConfig();
  let pool = null;

  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const contentType = String(req.query.contentType || '').trim().toLowerCase();
    const status = String(req.query.status || '').trim().toLowerCase();
    const sinceHours = parseFloat(req.query.sinceHours || '0');

    pool = mysql.createPool(config);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (m.title LIKE ? OR m.slug LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (contentType && contentType !== 'all') {
      whereClause += ' AND LOWER(m.content_type) = ?';
      params.push(contentType);
    }

    if (status && status !== 'all') {
      whereClause += ' AND LOWER(m.status) = ?';
      params.push(status);
    }

    if (sinceHours > 0) {
      whereClause += ' AND (c.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR) OR m.updated_at >= DATE_SUB(NOW(), INTERVAL ? HOUR))';
      params.push(sinceHours, sinceHours);
    }

    // Hitung total manga yang match
    const countQuery = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM manga m
      LEFT JOIN chapters c ON c.manga_id = m.id
      ${whereClause}
    `;
    const [[countRes]] = await pool.execute(countQuery, params);
    const total = countRes?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Ambil data manga + info chapter terbaru
    const dataQuery = `
      SELECT 
        m.id,
        m.title,
        m.slug,
        m.thumbnail,
        m.content_type,
        m.status,
        m.rating,
        m.created_at,
        m.updated_at,
        COUNT(c.id) as total_chapters,
        MAX(CAST(c.chapter_number AS DECIMAL(10,2))) as latest_chapter_num,
        COALESCE(MAX(c.created_at), m.updated_at, m.created_at) as last_activity
      FROM manga m
      LEFT JOIN chapters c ON c.manga_id = m.id
      ${whereClause}
      GROUP BY m.id
      ORDER BY last_activity DESC, m.id DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limit, offset];
    const [sourceMangaList] = await pool.execute(dataQuery, queryParams);

    // Bandingkan dengan database Nusakomik (Target DB)
    if (sourceMangaList.length > 0) {
      const slugs = sourceMangaList.map((m) => m.slug);
      const placeholders = slugs.map(() => '?').join(',');

      const [targetMangaList] = await targetDb.execute(
        `SELECT m.id, m.slug, m.title, m.status, COUNT(c.id) as target_chapters, MAX(CAST(c.chapter_number AS DECIMAL(10,2))) as target_latest_num
         FROM manga m
         LEFT JOIN chapters c ON c.manga_id = m.id
         WHERE m.slug IN (${placeholders})
         GROUP BY m.id`,
        slugs
      );

      const targetMap = new Map();
      targetMangaList.forEach((tm) => {
        targetMap.set(tm.slug, tm);
      });

      sourceMangaList.forEach((sm) => {
        const target = targetMap.get(sm.slug);
        if (target) {
          sm.in_target = true;
          sm.target_id = target.id;
          sm.target_chapters = target.target_chapters || 0;
          sm.target_latest_num = target.target_latest_num;
          sm.is_synced = Number(sm.total_chapters) <= Number(target.target_chapters);
        } else {
          sm.in_target = false;
          sm.target_id = null;
          sm.target_chapters = 0;
          sm.target_latest_num = null;
          sm.is_synced = false;
        }
      });
    }

    res.json({
      status: true,
      data: sourceMangaList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching source feed from Komiknesia:', error);
    res.status(500).json({ status: false, error: error.message });
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch {
        // ignore
      }
    }
  }
};

/**
 * Sinkronisasi N komik terbaru dari Komiknesia
 */
const syncLatest = async (req, res) => {
  try {
    const limit = parseInt(req.body.limit || '50', 10);
    const sinceHours = req.body.sinceHours ? parseFloat(req.body.sinceHours) : null;
    const latestOnly = Boolean(req.body.latestOnly);

    const stats = await runSync({
      limit,
      sinceHours,
      latestOnly,
    });

    res.json({
      status: true,
      message: `Sinkronisasi ${stats?.mangaCreated || 0} manga baru & ${stats?.chaptersCreated || 0} chapter baru berhasil.`,
      stats,
    });
  } catch (error) {
    console.error('Error running syncLatest from Komiknesia:', error);
    res.status(500).json({ status: false, error: error.message });
  }
};

/**
 * Sinkronisasi Manga tertentu berdasarkan slug
 */
const syncBySlug = async (req, res) => {
  const { slug } = req.params;
  const cleanSlug = String(slug || '').trim();
  if (!cleanSlug) {
    return res.status(400).json({ status: false, error: 'Slug manga wajib diisi' });
  }

  const latestOnly = Boolean(req.body.latestOnly);
  const config = getSourceDbConfig();
  let pool = null;

  try {
    pool = mysql.createPool(config);

    const [rows] = await pool.execute('SELECT * FROM manga WHERE slug = ? LIMIT 1', [cleanSlug]);
    if (!rows.length) {
      return res.status(404).json({ status: false, error: `Manga dengan slug "${cleanSlug}" tidak ditemukan di database Komiknesia` });
    }

    const sManga = rows[0];

    // 1. Upsert Manga
    const mangaRes = await upsertManga(sManga, targetDb);
    if (!mangaRes) {
      return res.status(400).json({ status: false, error: 'Gagal memproses data manga' });
    }

    const { targetMangaId, isCreated } = mangaRes;

    // 2. Sync Genres
    await syncMangaGenres(pool, targetDb, sManga.id, targetMangaId);

    // 3. Sync Chapters & Images
    const chRes = await syncChaptersAndImages(
      pool,
      targetDb,
      sManga.id,
      targetMangaId,
      cleanSlug,
      { latestOnly }
    );

    if (chRes.chaptersCreated > 0) {
      await targetDb.execute('UPDATE manga SET updated_at = NOW() WHERE id = ?', [targetMangaId]);
    }

    await refreshMangaChapterActivity(targetDb, targetMangaId);

    try {
      invalidateContentsCaches();
    } catch {
      // ignore
    }

    res.json({
      status: true,
      message: `Manga "${sManga.title}" berhasil disinkronkan (${isCreated ? 'Baru dibuat' : 'Diperbarui'}, +${chRes.chaptersCreated} chapter baru, +${chRes.imagesInserted} gambar).`,
      data: {
        mangaId: targetMangaId,
        title: sManga.title,
        slug: cleanSlug,
        isCreated,
        chaptersCreated: chRes.chaptersCreated,
        chaptersUpdated: chRes.chaptersUpdated,
        imagesInserted: chRes.imagesInserted,
      },
    });
  } catch (error) {
    console.error(`Error syncing manga "${cleanSlug}" from Komiknesia:`, error);
    res.status(500).json({ status: false, error: error.message });
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch {
        // ignore
      }
    }
  }
};

/**
 * Sinkronisasi batch manga yang dipilih berdasarkan list slugs
 */
const syncSelected = async (req, res) => {
  const slugs = Array.isArray(req.body.slugs) ? req.body.slugs.filter(Boolean) : [];
  if (!slugs.length) {
    return res.status(400).json({ status: false, error: 'Daftar slug tidak boleh kosong' });
  }

  const latestOnly = Boolean(req.body.latestOnly);
  const config = getSourceDbConfig();
  let pool = null;

  const stats = {
    totalRequested: slugs.length,
    mangaCreated: 0,
    mangaUpdated: 0,
    chaptersCreated: 0,
    chaptersUpdated: 0,
    imagesInserted: 0,
    errors: 0,
  };

  const details = [];

  try {
    pool = mysql.createPool(config);

    for (const slug of slugs) {
      try {
        const [rows] = await pool.execute('SELECT * FROM manga WHERE slug = ? LIMIT 1', [slug]);
        if (!rows.length) {
          stats.errors++;
          details.push({ slug, status: false, error: 'Tidak ditemukan di source DB' });
          continue;
        }

        const sManga = rows[0];
        const mangaRes = await upsertManga(sManga, targetDb);
        if (!mangaRes) {
          stats.errors++;
          details.push({ slug, status: false, error: 'Upsert gagal' });
          continue;
        }

        const { targetMangaId, isCreated } = mangaRes;
        if (isCreated) stats.mangaCreated++;
        else stats.mangaUpdated++;

        await syncMangaGenres(pool, targetDb, sManga.id, targetMangaId);

        const chRes = await syncChaptersAndImages(
          pool,
          targetDb,
          sManga.id,
          targetMangaId,
          slug,
          { latestOnly }
        );

        stats.chaptersCreated += chRes.chaptersCreated;
        stats.chaptersUpdated += chRes.chaptersUpdated;
        stats.imagesInserted += chRes.imagesInserted;

        if (chRes.chaptersCreated > 0) {
          await targetDb.execute('UPDATE manga SET updated_at = NOW() WHERE id = ?', [targetMangaId]);
        }

        await refreshMangaChapterActivity(targetDb, targetMangaId);

        details.push({
          slug,
          title: sManga.title,
          status: true,
          isCreated,
          chaptersCreated: chRes.chaptersCreated,
          imagesInserted: chRes.imagesInserted,
        });
      } catch (itemErr) {
        stats.errors++;
        details.push({ slug, status: false, error: itemErr.message });
      }
    }

    try {
      invalidateContentsCaches();
    } catch {
      // ignore
    }

    res.json({
      status: true,
      message: `Sinkronisasi selesai: ${stats.mangaCreated} dibuat, ${stats.mangaUpdated} diupdate, +${stats.chaptersCreated} chapter baru.`,
      stats,
      details,
    });
  } catch (error) {
    console.error('Error syncing selected manga from Komiknesia:', error);
    res.status(500).json({ status: false, error: error.message });
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch {
        // ignore
      }
    }
  }
};

module.exports = {
  checkStatus,
  getSourceFeed,
  syncLatest,
  syncBySlug,
  syncSelected,
};
