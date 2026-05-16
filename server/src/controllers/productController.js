import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category_name || '',
    category_id: p.category_id,
    category_name: p.category_name || '',
    image_url: p.image_url || '',
    available: p.is_available,
    is_available: p.is_available,
    featured: p.is_featured || false,
    is_featured: p.is_featured || false,
    created_at: p.created_at,
  };
}

async function resolveCategoryId(category, category_id, restaurant_id) {
  if (category_id) return Number(category_id);
  if (!category) return null;
  const cat = await queryOne('SELECT id FROM categories WHERE (name = $1 OR id::text = $1) AND restaurant_id = $2', [category, restaurant_id]);
  return cat ? cat.id : null;
}

export async function getProducts(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getProducts] restaurant_id:', rid);
    const products = await query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE (p.restaurant_id = $1 OR p.restaurant_id IS NULL)
      ORDER BY p.created_at DESC
    `, [rid]);
    res.json(products.map(mapProduct));
  } catch (err) {
    console.error('[getProducts] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createProduct(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    let { name, description, price, category, category_id, image_url, is_available, is_featured, available, featured } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nom et prix requis' });
    }
    const resolvedCategoryId = await resolveCategoryId(category, category_id, rid);
    const effectiveAvailable = is_available !== undefined ? is_available : (available !== undefined ? available : true);
    const effectiveFeatured = is_featured !== undefined ? is_featured : (featured || false);
    console.log('[createProduct]', { name, price, category_id, rid });
    const product = await queryOne(`
      INSERT INTO products (restaurant_id, category_id, name, description, price, image_url, is_available, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [rid, resolvedCategoryId, name, description || '', Math.round(Number(price)), image_url || '', effectiveAvailable, effectiveFeatured]);

    const cat = resolvedCategoryId ? await queryOne('SELECT name FROM categories WHERE id = $1', [resolvedCategoryId]) : null;
    const full = { ...product, category_name: cat ? cat.name : '' };
    res.status(201).json(mapProduct(full));
  } catch (err) {
    console.error('[createProduct] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const productId = Number(req.params.id);
    let { name, description, price, category, category_id, image_url, is_available, is_featured, available, featured } = req.body;
    const resolvedCategoryId = await resolveCategoryId(category, category_id, rid);
    const effectiveAvailable = is_available !== undefined ? is_available : available;
    const effectiveFeatured = is_featured !== undefined ? is_featured : featured;

    console.log('[updateProduct]', { productId, name, price, rid });

    const sql = `
      UPDATE products SET
        name = COALESCE($1::text, name),
        description = COALESCE($2::text, description),
        price = COALESCE($3::int, price),
        category_id = COALESCE($4::int, category_id),
        image_url = COALESCE($5::text, image_url),
        is_available = COALESCE($6::boolean, is_available),
        is_featured = COALESCE($7::boolean, is_featured)
      WHERE id = $8 AND (restaurant_id = $9 OR restaurant_id IS NULL) RETURNING *
    `;
    const params = [
      name || null,
      description !== undefined ? description : null,
      price !== undefined ? Math.round(Number(price)) : null,
      resolvedCategoryId !== null ? Number(resolvedCategoryId) : null,
      image_url !== undefined ? image_url : null,
      effectiveAvailable !== undefined ? Boolean(effectiveAvailable) : null,
      effectiveFeatured !== undefined ? Boolean(effectiveFeatured) : null,
      productId,
      rid
    ];
    console.log('[updateProduct] SQL params:', params);

    const product = await queryOne(sql, params);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const cat = product.category_id ? await queryOne('SELECT name FROM categories WHERE id = $1', [product.category_id]) : null;
    const full = { ...product, category_name: cat ? cat.name : '' };
    res.json(mapProduct(full));
  } catch (err) {
    console.error('[updateProduct] error:', err.message, { id: req.params.id });
    res.status(500).json({
      error: err.message,
      params: { id: Number(req.params.id) }
    });
  }
}

export async function deleteProduct(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const productId = Number(req.params.id);
    console.log('[deleteProduct]', { productId, rid });
    await query('DELETE FROM products WHERE id = $1 AND (restaurant_id = $2 OR restaurant_id IS NULL)', [productId, rid]);
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    console.error('[deleteProduct] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function toggleAvailability(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const productId = Number(req.params.id);
    console.log('[toggleAvailability]', { productId, rid });
    const product = await queryOne(`
      UPDATE products SET is_available = NOT is_available WHERE id = $1 AND (restaurant_id = $2 OR restaurant_id IS NULL) RETURNING *
    `, [productId, rid]);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    const cat = product.category_id ? await queryOne('SELECT name FROM categories WHERE id = $1', [product.category_id]) : null;
    const full = { ...product, category_name: cat ? cat.name : '' };
    res.json(mapProduct(full));
  } catch (err) {
    console.error('[toggleAvailability] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}