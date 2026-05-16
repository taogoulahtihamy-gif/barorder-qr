import { query } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getPayments(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getPayments] restaurant_id:', rid);
    const payments = await query(`
      SELECT p.*, o.order_number, rt.table_number
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
      WHERE (o.restaurant_id = $1 OR o.restaurant_id IS NULL)
      ORDER BY p.created_at DESC
    `, [rid]);
    res.json(payments);
  } catch (err) {
    console.error('[getPayments] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}