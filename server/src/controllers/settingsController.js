import { queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getSettings(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getSettings] restaurant_id:', rid);
    const restaurant = await queryOne('SELECT * FROM restaurants WHERE id = $1', [rid]);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé' });
    res.json(restaurant);
  } catch (err) {
    console.error('[getSettings] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const { name, slug, logo_url, address, phone, currency, primary_color } = req.body;
    console.log('[updateSettings]', { rid, name, slug });
    const restaurant = await queryOne(`
      UPDATE restaurants SET
        name = COALESCE($1::text, name),
        slug = COALESCE($2::text, slug),
        logo_url = COALESCE($3::text, logo_url),
        address = COALESCE($4::text, address),
        phone = COALESCE($5::text, phone),
        currency = COALESCE($6::text, currency),
        primary_color = COALESCE($7::text, primary_color)
      WHERE id = $8 RETURNING *
    `, [name || null, slug || null, logo_url || null, address || null, phone || null, currency || null, primary_color || null, rid]);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé' });
    res.json(restaurant);
  } catch (err) {
    console.error('[updateSettings] error:', err.message);
    res.status(500).json({ error: err.message, params: { rid: Number(getRestaurantId(req)) } });
  }
}