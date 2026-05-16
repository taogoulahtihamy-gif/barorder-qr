import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getServerCalls(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getServerCalls] restaurant_id:', rid);
    const calls = await query(`
      SELECT sc.*, rt.table_number
      FROM server_calls sc
      LEFT JOIN restaurant_tables rt ON rt.id = sc.table_id
      WHERE (rt.restaurant_id = $1 OR rt.restaurant_id IS NULL)
      ORDER BY sc.created_at DESC
    `, [rid]);
    res.json(calls);
  } catch (err) {
    console.error('[getServerCalls] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateServerCallStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    console.log('[updateServerCallStatus]', { id, status });
    const call = await queryOne(`
      UPDATE server_calls SET status = $1::text WHERE id = $2 RETURNING *
    `, [status || 'handled', id]);
    if (!call) return res.status(404).json({ error: 'Appel non trouvé' });
    try {
      req.app.get('io').emit('server_call_updated', call);
    } catch {}
    res.json(call);
  } catch (err) {
    console.error('[updateServerCallStatus] error:', err.message, { id: req.params.id });
    res.status(500).json({
      error: err.message,
      params: { id: Number(req.params.id) }
    });
  }
}