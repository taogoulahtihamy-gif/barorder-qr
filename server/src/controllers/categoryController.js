import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getCategories(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getCategories] restaurant_id:', rid);
    const categories = await query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      WHERE (c.restaurant_id = $1 OR c.restaurant_id IS NULL)
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `, [rid]);
    res.json(categories.map(c => ({
      ...c,
      active: c.is_active,
    })));
  } catch (err) {
    console.error('[getCategories] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createCategory(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const { name, description, sort_order, is_active, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const effectiveActive = is_active !== undefined ? is_active : (active !== undefined ? active : true);
    console.log('[createCategory]', { name, rid });
    const category = await queryOne(`
      INSERT INTO categories (restaurant_id, name, description, sort_order, is_active)
      VALUES ($1::int, $2::text, $3::text, $4::int, $5::boolean)
      RETURNING *
    `, [rid, name, description || '', Number(sort_order) || 0, Boolean(effectiveActive)]);
    res.status(201).json({ ...category, active: category.is_active });
  } catch (err) {
    console.error('[createCategory] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateCategory(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const categoryId = Number(req.params.id);
    const { name, description, sort_order, is_active, active } = req.body;
    const effectiveActive = is_active !== undefined ? is_active : active;

    console.log('[updateCategory]', { categoryId, name, rid });

    const sql = `
      UPDATE categories SET
        name = COALESCE($1::text, name),
        description = COALESCE($2::text, description),
        sort_order = COALESCE($3::int, sort_order),
        is_active = COALESCE($4::boolean, is_active)
      WHERE id = $5 AND (restaurant_id = $6 OR restaurant_id IS NULL) RETURNING *
    `;
    const params = [
      name || null,
      description !== undefined ? description : null,
      sort_order !== undefined ? Number(sort_order) : null,
      effectiveActive !== undefined ? Boolean(effectiveActive) : null,
      categoryId,
      rid
    ];
    console.log('[updateCategory] SQL params:', params);

    const category = await queryOne(sql, params);
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json({ ...category, active: category.is_active });
  } catch (err) {
    console.error('[updateCategory] error:', err.message, { id: req.params.id });
    res.status(500).json({
      error: err.message,
      params: { id: Number(req.params.id) }
    });
  }
}

export async function deleteCategory(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const categoryId = Number(req.params.id);
    console.log('[deleteCategory]', { categoryId, rid });
    await query('DELETE FROM categories WHERE id = $1 AND (restaurant_id = $2 OR restaurant_id IS NULL)', [categoryId, rid]);
    res.json({ message: 'Catégorie supprimée' });
  } catch (err) {
    console.error('[deleteCategory] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}