import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getOrders(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getOrders] restaurant_id:', rid);
    const orders = await query(`
      SELECT o.*, rt.table_number
      FROM orders o
      LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
      WHERE (o.restaurant_id = $1 OR o.restaurant_id IS NULL)
      ORDER BY o.created_at DESC
    `, [rid]);
    for (const order of orders) {
      order.items = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    }
    res.json(orders);
  } catch (err) {
    console.error('[getOrders] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

const ROLE_TRANSITIONS = {
  waiter: ['served'],
  kitchen: ['preparing', 'ready'],
  cashier: ['paid'],
};

export async function updateOrderStatus(req, res) {
  try {
    const orderId = Number(req.params.id);
    const restaurantId = Number(getRestaurantId(req));
    const { status } = req.body;
    const validStatuses = ['new', 'accepted', 'preparing', 'ready', 'served', 'paid', 'cancelled'];

    console.log('[updateOrderStatus]', { orderId, restaurantId, status, role: req.user?.role });

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide', status });
    }

    const userRole = req.user?.role || '';

    if (!['admin', 'super_admin', 'manager'].includes(userRole)) {
      const allowed = ROLE_TRANSITIONS[userRole] || [];
      if (!allowed.includes(status)) {
        return res.status(403).json({ error: 'Action non autorisée pour ce rôle' });
      }
    }

    const timestampCol = status === 'cancelled' ? 'cancelled_at'
      : status === 'accepted' ? 'accepted_at'
      : status === 'preparing' ? 'preparing_at'
      : status === 'ready' ? 'ready_at'
      : status === 'served' ? 'served_at'
      : status === 'paid' ? 'paid_at'
      : null;

    const sql = `
      UPDATE orders SET
        order_status = $1::text,
        payment_status = CASE WHEN $2::text = 'paid' THEN 'paid'::text ELSE payment_status END
        ${timestampCol ? `, ${timestampCol} = NOW()` : ''}
      WHERE id = $3 AND (restaurant_id = $4 OR restaurant_id IS NULL)
      RETURNING *
    `;
    console.log('[updateOrderStatus] SQL:', sql, { params: [status, status, orderId, restaurantId] });

    const order = await queryOne(sql, [status, status, orderId, restaurantId]);
    if (!order) {
      console.error('[updateOrderStatus] Order not found:', orderId);
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (status === 'paid') {
      const existingPay = await queryOne('SELECT id FROM payments WHERE order_id = $1', [orderId]);
      if (existingPay) {
        const paySql = `UPDATE payments SET status = 'paid'::text WHERE order_id = $1`;
        console.log('[updateOrderStatus] payment update SQL:', paySql, { params: [orderId] });
        await query(paySql, [orderId]);
      } else {
        const paySql = `INSERT INTO payments (order_id, method, amount, status, transaction_reference) VALUES ($1, COALESCE((SELECT payment_method FROM orders WHERE id = $1), 'Cash'), $2, 'paid', 'PAID-' || $1) RETURNING *`;
        console.log('[updateOrderStatus] payment insert SQL:', paySql, { params: [orderId, Number(order.total_amount) || 0] });
        await queryOne(paySql, [orderId, Number(order.total_amount) || 0]);
      }
      try {
        req.app.get('io').emit('payment_updated', { orderId, status: 'paid' });
        console.log('EMITTING payment_updated', orderId);
      } catch (socketErr) {
        console.warn('[updateOrderStatus] payment socket emit failed:', socketErr.message);
      }
    }

    try {
      req.app.get('io').emit('order_status_updated', order);
      console.log('EMITTING order_status_updated', order.order_number, status);
    } catch (socketErr) {
      console.warn('[updateOrderStatus] socket emit failed:', socketErr.message);
    }

    console.log('[updateOrderStatus] success:', order.order_number, '->', status);
    res.json(order);
  } catch (err) {
    console.error('[updateOrderStatus] error:', err.message, { params: { id: req.params.id, status: req.body?.status } });
    res.status(500).json({
      error: err.message,
      query: 'UPDATE orders SET order_status = $1::text, payment_status = CASE WHEN $2::text = \'paid\' THEN \'paid\'::text ELSE payment_status END WHERE id = $3 AND (restaurant_id = $4 OR restaurant_id IS NULL) RETURNING *',
      params: { status: req.body?.status, orderId: Number(req.params.id), restaurantId: Number(getRestaurantId(req)) }
    });
  }
}