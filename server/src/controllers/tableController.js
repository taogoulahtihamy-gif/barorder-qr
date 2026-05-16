import QRCode from 'qrcode';
import { query, queryOne } from '../config/database.js';
import config from '../config/index.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getTables(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getTables] restaurant_id:', rid);
    const tables = await query(`
      SELECT rt.*, o.order_number
      FROM restaurant_tables rt
      LEFT JOIN orders o ON o.table_id = rt.id AND o.order_status NOT IN ('served', 'paid', 'cancelled')
      WHERE (rt.restaurant_id = $1 OR rt.restaurant_id IS NULL)
      ORDER BY rt.table_number
    `, [rid]);
    const rest = await queryOne('SELECT name, slug FROM restaurants WHERE id = $1', [rid]);
    const slug = rest?.slug || 'restaurant';
    const restaurantName = rest?.name || '';
    res.json(tables.map(t => ({
      id: t.id,
      name: t.table_number,
      table_number: t.table_number,
      capacity: t.capacity || 4,
      status: t.order_number ? 'occupied' : 'free',
      qr_url: t.qr_code_url,
      qrUrl: `/r/${slug}/menu/${t.id}`,
      slug,
      restaurant_name: restaurantName,
      order_number: t.order_number,
    })));
  } catch (err) {
    console.error('[getTables] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createTable(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const { name, capacity } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });

    console.log('[createTable]', { name, capacity, rid });

    const table = await queryOne(`
      INSERT INTO restaurant_tables (restaurant_id, table_number, status, capacity)
      VALUES ($1::int, $2::text, 'active', $3::int)
      RETURNING *
    `, [rid, name, Number(capacity) || 4]);

    const rest = await queryOne('SELECT name, slug FROM restaurants WHERE id = $1', [rid]);
    const restaurantName = rest?.name || '';
    const slug = rest?.slug || 'restaurant';
    const appUrl = config.publicAppUrl.replace(/\/+$/, '');
    const fullUrl = `${appUrl}/r/${slug}/menu/${table.id}`;
    const qrUrl = `/r/${slug}/menu/${table.id}`;
    const qrData = `${restaurantName}\n${name} — N°${name}\n\n${fullUrl}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    const updated = await queryOne(`
      UPDATE restaurant_tables SET qr_code_url = $1 WHERE id = $2 RETURNING *
    `, [qrCodeUrl, table.id]);

    res.status(201).json({ id: updated.id, name: updated.table_number, table_number: updated.table_number, capacity: updated.capacity || 4, status: 'active', qrUrl, qr_url: updated.qr_code_url, slug });
  } catch (err) {
    console.error('[createTable] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function generateTableQR(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const tableId = Number(req.params.id);

    const table = await queryOne(`
      SELECT rt.*, r.name as restaurant_name, r.slug
      FROM restaurant_tables rt
      JOIN restaurants r ON r.id = rt.restaurant_id
      WHERE rt.id = $1 AND (rt.restaurant_id = $2 OR rt.restaurant_id IS NULL)
    `, [tableId, rid]);

    if (!table) return res.status(404).json({ error: 'Table non trouvée' });

    const restaurantName = table.restaurant_name || '';
    const slug = table.slug || 'restaurant';
    const appUrl = config.publicAppUrl.replace(/\/+$/, '');
    const fullUrl = `${appUrl}/r/${slug}/menu/${table.id}`;
    const qrUrl = `/r/${slug}/menu/${table.id}`;
    const qrData = `${restaurantName}\n${table.table_number} — N°${table.table_number}\n\n${fullUrl}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 400, margin: 2 });

    await query('UPDATE restaurant_tables SET qr_code_url = $1 WHERE id = $2', [qrCodeUrl, tableId]);

    res.json({
      id: table.id,
      qrUrl,
      qr_code_url: qrCodeUrl,
      restaurant_name: table.restaurant_name,
      table_name: table.table_number,
      table_number: table.table_number,
    });
  } catch (err) {
    console.error('[generateTableQR] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getPrintableQR(req, res) {
  try {
    const rid = Number(getRestaurantId(req));

    const restaurant = await queryOne('SELECT id, name, slug FROM restaurants WHERE id = $1', [rid]);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé' });

    const tables = await query(`
      SELECT id, table_number, capacity, qr_code_url
      FROM restaurant_tables
      WHERE restaurant_id = $1
      ORDER BY table_number
    `, [rid]);

    const slug = restaurant.slug || 'restaurant';

    const qrTables = tables.map(t => ({
      id: t.id,
      name: t.table_number,
      table_number: t.table_number,
      capacity: t.capacity || 4,
      qr_code_url: t.qr_code_url,
      qrUrl: `/r/${slug}/menu/${t.id}`,
    }));

    res.json({
      restaurant: { name: restaurant.name, slug },
      tables: qrTables,
    });
  } catch (err) {
    console.error('[getPrintableQR] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteTable(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const tableId = Number(req.params.id);
    console.log('[deleteTable]', { tableId, rid });
    await query('DELETE FROM restaurant_tables WHERE id = $1 AND (restaurant_id = $2 OR restaurant_id IS NULL)', [tableId, rid]);
    res.json({ message: 'Table supprimée' });
  } catch (err) {
    console.error('[deleteTable] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}