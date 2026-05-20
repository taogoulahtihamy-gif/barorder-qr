import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getDashboard(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getDashboard] restaurant_id:', rid);

    const todayStart = "(created_at AT TIME ZONE 'Africa/Dakar')::date = (NOW() AT TIME ZONE 'Africa/Dakar')::date";

    const [
      revenueResult,
      ordersCountResult,
      pendingResult,
      avgResult,
      activeTablesResult,
      productsResult,
      recentOrders,
      topProducts,
      serverAlerts,
      availableTablesResult,
      occupiedTablesResult,
      waitingPaymentTablesResult,
      weeklyRevenue,
    ] = await Promise.all([
      queryOne(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status IN ('paid', 'served') AND ${todayStart}`, [rid]),
      queryOne(`SELECT COUNT(*) as count FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status NOT IN ('cancelled') AND ${todayStart}`, [rid]),
      queryOne(`SELECT COUNT(*) as count FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status = 'new'`, [rid]),
      queryOne(`SELECT COALESCE(ROUND(AVG(total_amount)), 0) as avg FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status IN ('paid', 'served') AND ${todayStart}`, [rid]),
      queryOne(`SELECT COUNT(*) as count FROM restaurant_tables rt WHERE (rt.restaurant_id = $1 OR rt.restaurant_id IS NULL) AND EXISTS (SELECT 1 FROM orders o WHERE o.table_id = rt.id AND o.order_status NOT IN ('served', 'paid', 'cancelled'))`, [rid]),
      queryOne(`SELECT COUNT(*) as count FROM products WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND is_available = true`, [rid]),
      query(`
        SELECT o.id, o.order_number, rt.table_number, o.total_amount, o.order_status, o.created_at
        FROM orders o
        LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
        WHERE (o.restaurant_id = $1 OR o.restaurant_id IS NULL)
        ORDER BY o.created_at DESC LIMIT 5
      `, [rid]),
      query(`
        SELECT p.name, SUM(oi.quantity) as count, SUM(oi.total_price) as revenue
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        WHERE (o.restaurant_id = $1 OR o.restaurant_id IS NULL) AND o.order_status NOT IN ('cancelled')
        GROUP BY p.name ORDER BY count DESC LIMIT 5
      `, [rid]),
      query(`
        SELECT sc.*, rt.table_number FROM server_calls sc
        JOIN restaurant_tables rt ON rt.id = sc.table_id
        WHERE (rt.restaurant_id = $1 OR rt.restaurant_id IS NULL) AND sc.status = 'pending'
        ORDER BY sc.created_at DESC LIMIT 10
      `, [rid]),
      queryOne(`SELECT COUNT(*) as count FROM restaurant_tables WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND (status = 'available' OR status = 'active' OR status = 'free')`, [rid]),
      queryOne(`SELECT COUNT(*) as count FROM restaurant_tables WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND status = 'occupied'`, [rid]),
      queryOne(`SELECT COUNT(*) as count FROM restaurant_tables WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND status = 'waiting_payment'`, [rid]),
      query(`
        SELECT d::date as day, COALESCE(SUM(o.total_amount), 0) as revenue
        FROM generate_series(
          (NOW() AT TIME ZONE 'Africa/Dakar')::date - interval '6 days',
          (NOW() AT TIME ZONE 'Africa/Dakar')::date,
          interval '1 day'
        ) d
        LEFT JOIN orders o ON (o.restaurant_id = $1 OR o.restaurant_id IS NULL)
          AND (o.created_at AT TIME ZONE 'Africa/Dakar')::date = d::date
          AND o.order_status IN ('paid', 'served')
        GROUP BY d ORDER BY d
      `, [rid]),
    ]);

    const recentItems = await Promise.all(
      recentOrders.map(o =>
        query(`SELECT product_name FROM order_items WHERE order_id = $1`, [o.id])
          .then(r => r.map(i => i.product_name))
      )
    );

    const totalRevenue = parseInt(revenueResult.total) || 0;
    const avgOrder = parseInt(avgResult.avg) || 0;

    const weekdayRevenue = weeklyRevenue.map(r => parseInt(r.revenue));

    res.json({
      revenue: totalRevenue,
      revenueFormatted: `${totalRevenue.toLocaleString('fr-FR')} FCFA`,
      ordersCount: parseInt(ordersCountResult.count) || 0,
      pendingOrders: parseInt(pendingResult.count) || 0,
      avgOrder,
      avgOrderFormatted: `${avgOrder.toLocaleString('fr-FR')} FCFA`,
      activeTables: parseInt(activeTablesResult.count) || 0,
      availableProducts: parseInt(productsResult.count) || 0,
      availableTables: parseInt(availableTablesResult.count) || 0,
      occupiedTables: parseInt(occupiedTablesResult.count) || 0,
      waitingPaymentTables: parseInt(waitingPaymentTablesResult.count) || 0,
      dailyRevenue: weekdayRevenue,
      recentOrders: recentOrders.map((o, i) => ({
        id: o.order_number,
        table: o.table_number,
        items: recentItems[i] || [],
        total: o.total_amount,
        status: o.order_status,
        time: o.created_at,
      })),
      topProducts: topProducts.map(p => ({
        name: p.name,
        count: parseInt(p.count) || 0,
        revenue: parseInt(p.revenue) || 0,
        revenueFormatted: `${(parseInt(p.revenue) || 0).toLocaleString('fr-FR')} FCFA`,
      })),
      serverAlerts: serverAlerts.map(a => ({
        id: a.id,
        table: a.table_number || a.table_id,
        time: a.created_at,
        handled: a.status !== 'new',
      })),
    });
  } catch (err) {
    console.error('[getDashboard] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}