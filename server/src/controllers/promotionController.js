import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getPromotions(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const promotions = await query(
      'SELECT * FROM promotions WHERE restaurant_id = $1 ORDER BY created_at DESC',
      [rid]
    );
    res.json(promotions);
  } catch (err) {
    console.error('[getPromotions] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createPromotion(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const { title, description, price, old_price, start_date, end_date, is_active } = req.body;
    if (!title || price === undefined) {
      return res.status(400).json({ error: 'title and price required' });
    }
    const promo = await queryOne(
      `INSERT INTO promotions (restaurant_id, title, description, price, old_price, start_date, end_date, is_active)
       VALUES ($1::int, $2::text, $3::text, $4::int, $5::int, $6::date, $7::date, $8::boolean)
       RETURNING *`,
      [rid, title, description || '', Number(price), old_price ? Number(old_price) : null, start_date || null, end_date || null, is_active !== undefined ? Boolean(is_active) : true]
    );
    res.status(201).json(promo);
  } catch (err) {
    console.error('[createPromotion] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updatePromotion(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const id = Number(req.params.id);
    const { title, description, price, old_price, start_date, end_date, is_active } = req.body;
    const existing = await queryOne('SELECT id FROM promotions WHERE id = $1 AND restaurant_id = $2', [id, rid]);
    if (!existing) return res.status(404).json({ error: 'Promotion not found' });
    const sets = [];
    const vals = [];
    let i = 1;
    if (title !== undefined) { sets.push(`title = $${i++}::text`); vals.push(title); }
    if (description !== undefined) { sets.push(`description = $${i++}::text`); vals.push(description); }
    if (price !== undefined) { sets.push(`price = $${i++}::int`); vals.push(Number(price)); }
    if (old_price !== undefined) { sets.push(`old_price = $${i++}::int`); vals.push(old_price ? Number(old_price) : null); }
    if (start_date !== undefined) { sets.push(`start_date = $${i++}::date`); vals.push(start_date || null); }
    if (end_date !== undefined) { sets.push(`end_date = $${i++}::date`); vals.push(end_date || null); }
    if (is_active !== undefined) { sets.push(`is_active = $${i++}::boolean`); vals.push(Boolean(is_active)); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(id, rid);
    const promo = await queryOne(
      `UPDATE promotions SET ${sets.join(', ')} WHERE id = $${i++}::int AND restaurant_id = $${i}::int RETURNING *`,
      vals
    );
    res.json(promo);
  } catch (err) {
    console.error('[updatePromotion] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function togglePromotionStatus(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const id = Number(req.params.id);
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ error: 'is_active required' });
    const promo = await queryOne(
      'UPDATE promotions SET is_active = $1::boolean WHERE id = $2::int AND restaurant_id = $3::int RETURNING *',
      [Boolean(is_active), id, rid]
    );
    if (!promo) return res.status(404).json({ error: 'Promotion not found' });
    res.json(promo);
  } catch (err) {
    console.error('[togglePromotionStatus] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function deletePromotion(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const id = Number(req.params.id);
    await query('DELETE FROM promotions WHERE id = $1::int AND restaurant_id = $2::int', [id, rid]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[deletePromotion] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getPublicPromotions(req, res) {
  try {
    const { slug } = req.params;
    let restaurant;
    try {
      restaurant = await queryOne('SELECT id FROM restaurants WHERE slug = $1', [slug]);
    } catch (err) {
      if (err.message?.includes('slug')) {
        restaurant = await queryOne('SELECT id FROM restaurants WHERE id = $1', [1]);
      } else {
        throw err;
      }
    }
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    const today = new Date().toISOString().split('T')[0];
    const promotions = await query(
      `SELECT * FROM promotions
       WHERE restaurant_id = $1::int AND is_active = true
       AND (start_date IS NULL OR start_date <= $2::date)
       AND (end_date IS NULL OR end_date >= $2::date)
       ORDER BY created_at DESC`,
      [Number(restaurant.id), today]
    );
    res.json(promotions);
  } catch (err) {
    console.error('[getPublicPromotions] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
