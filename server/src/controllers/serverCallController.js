import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getServerCalls(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getServerCalls] restaurant_id:', rid);
    const { status } = req.query;
    let sql = `
      SELECT sc.*, rt.table_number
      FROM server_calls sc
      LEFT JOIN restaurant_tables rt ON rt.id = sc.table_id
      WHERE (sc.restaurant_id = $1 OR sc.restaurant_id IS NULL)
    `;
    const params = [rid];
    if (status) {
      sql += ` AND sc.status = $2::text`;
      params.push(status);
    }
    sql += ` ORDER BY sc.created_at DESC`;
    const calls = await query(sql, params);
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
    const validStatuses = ['pending', 'acknowledged', 'resolved'];
    const newStatus = validStatuses.includes(status) ? status : 'resolved';
    const rid = Number(getRestaurantId(req));
    console.log('[updateServerCallStatus]', { id, status: newStatus, restaurantId: rid });
    const call = await queryOne(`
      UPDATE server_calls SET status = $1::text WHERE id = $2::int AND (restaurant_id = $3 OR restaurant_id IS NULL) RETURNING *
    `, [newStatus, id, rid]);
    if (!call) return res.status(404).json({ error: 'Appel non trouvé' });
    try {
      req.app.get('io').emit('server_call_updated', call);
      req.app.get('io').emit('server_calls_updated', { serverCallId: call.id });
      console.log('[SOCKET EMIT] server_call_updated + server_calls_updated', call.id, newStatus);
    } catch (e) {
      console.warn('[updateServerCallStatus] socket emit failed:', e.message);
    }
    res.json(call);
  } catch (err) {
    console.error('[updateServerCallStatus] error:', err.message, { id: req.params.id });
    res.status(500).json({
      error: err.message,
      params: { id: Number(req.params.id) }
    });
  }
}
