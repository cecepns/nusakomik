const db = require('../db');

function nullIfEmpty(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

const show = async (req, res) => {
  try {
    const { active } = req.query;

    let query = 'SELECT * FROM contact_info WHERE 1=1';
    const params = [];

    if (active !== undefined && active !== '') {
      query += ' AND is_active = ?';
      params.push(active === 'true');
    }

    query += ' ORDER BY created_at DESC LIMIT 1';

    const [contactInfo] = await db.execute(query, params);

    if (contactInfo.length === 0) {
      return res.json(null);
    }

    res.json(contactInfo[0]);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const store = async (req, res) => {
  try {
    const {
      email,
      whatsapp,
      description,
      telegram_url,
      tiktok_url,
      instagram_url,
      facebook_url,
      is_active = true,
    } = req.body;

    if (!email || !whatsapp) {
      return res.status(400).json({ error: 'Email and WhatsApp are required' });
    }

    await db.execute('UPDATE contact_info SET is_active = FALSE WHERE is_active = TRUE');

    const [result] = await db.execute(
      'INSERT INTO contact_info (email, whatsapp, description, telegram_url, tiktok_url, instagram_url, facebook_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        email,
        whatsapp,
        description || null,
        nullIfEmpty(telegram_url),
        nullIfEmpty(tiktok_url),
        nullIfEmpty(instagram_url),
        nullIfEmpty(facebook_url),
        is_active,
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Contact info created successfully' });
  } catch (error) {
    console.error('Error creating contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      whatsapp,
      description,
      telegram_url,
      tiktok_url,
      instagram_url,
      facebook_url,
      is_active,
    } = req.body;

    const updates = [];
    const params = [];

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }

    if (whatsapp !== undefined) {
      updates.push('whatsapp = ?');
      params.push(whatsapp);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (telegram_url !== undefined) {
      updates.push('telegram_url = ?');
      params.push(nullIfEmpty(telegram_url));
    }

    if (tiktok_url !== undefined) {
      updates.push('tiktok_url = ?');
      params.push(nullIfEmpty(tiktok_url));
    }

    if (instagram_url !== undefined) {
      updates.push('instagram_url = ?');
      params.push(nullIfEmpty(instagram_url));
    }

    if (facebook_url !== undefined) {
      updates.push('facebook_url = ?');
      params.push(nullIfEmpty(facebook_url));
    }

    if (is_active !== undefined) {
      if (is_active) {
        await db.execute('UPDATE contact_info SET is_active = FALSE WHERE id != ?', [id]);
      }
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    await db.execute(`UPDATE contact_info SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Contact info updated successfully' });
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM contact_info WHERE id = ?', [id]);
    res.json({ message: 'Contact info deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  show,
  store,
  update,
  destroy,
};

