import { query, queryOne } from '../config/database.js';

export async function getRestaurants(req, res) {
  try {
    const restaurants = await query('SELECT * FROM restaurants ORDER BY name');
    res.json(restaurants);
  } catch (err) {
    console.error('[getRestaurants] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getRestaurant(req, res) {
  try {
    const id = Number(req.params.id);
    const restaurant = await queryOne('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé' });
    res.json(restaurant);
  } catch (err) {
    console.error('[getRestaurant] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createRestaurant(req, res) {
  try {
    const { name, slug, address, phone, currency, primary_color, logo_url } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const existing = await queryOne('SELECT id FROM restaurants WHERE slug = $1', [slug || '']);
    if (existing) return res.status(400).json({ error: 'Ce slug est déjà utilisé' });
    const restaurant = await queryOne(`
      INSERT INTO restaurants (name, slug, address, phone, currency, primary_color, logo_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `, [name, slug || null, address || null, phone || null, currency || 'FCFA', primary_color || '#d4a843', logo_url || null]);
    res.status(201).json(restaurant);
  } catch (err) {
    console.error('[createRestaurant] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateRestaurant(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, slug, address, phone, currency, primary_color, logo_url } = req.body;
    const existing = await queryOne('SELECT id FROM restaurants WHERE id = $1', [id]);
    if (!existing) return res.status(404).json({ error: 'Restaurant non trouvé' });
    if (slug) {
      const slugExists = await queryOne('SELECT id FROM restaurants WHERE slug = $1 AND id != $2', [slug, id]);
      if (slugExists) return res.status(400).json({ error: 'Ce slug est déjà utilisé' });
    }
    const sets = [];
    const vals = [];
    let i = 1;
    if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name); }
    if (slug !== undefined) { sets.push(`slug = $${i++}`); vals.push(slug); }
    if (address !== undefined) { sets.push(`address = $${i++}`); vals.push(address); }
    if (phone !== undefined) { sets.push(`phone = $${i++}`); vals.push(phone); }
    if (currency !== undefined) { sets.push(`currency = $${i++}`); vals.push(currency); }
    if (primary_color !== undefined) { sets.push(`primary_color = $${i++}`); vals.push(primary_color); }
    if (logo_url !== undefined) { sets.push(`logo_url = $${i++}`); vals.push(logo_url); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(id);
    const restaurant = await queryOne(
      `UPDATE restaurants SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    );
    res.json(restaurant);
  } catch (err) {
    console.error('[updateRestaurant] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateRestaurantStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ error: 'is_active required' });
    const restaurant = await queryOne(
      'UPDATE restaurants SET is_active = $1 WHERE id = $2 RETURNING *',
      [Boolean(is_active), id]
    );
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé' });
    res.json(restaurant);
  } catch (err) {
    console.error('[updateRestaurantStatus] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
