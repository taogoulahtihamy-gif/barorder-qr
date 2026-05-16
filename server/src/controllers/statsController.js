import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

export async function getStats(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    console.log('[getStats] restaurant_id:', rid);

    const dailyRevenue = await query(`
      SELECT DATE(created_at) as day, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status NOT IN ('cancelled')
      GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 7
    `, [rid]);

    const dailyOrders = await query(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status NOT IN ('cancelled')
      GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 7
    `, [rid]);

    const topProducts = await query(`
      SELECT p.name, SUM(oi.quantity) as count, SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE (o.restaurant_id = $1 OR o.restaurant_id IS NULL)
      GROUP BY p.name ORDER BY count DESC LIMIT 5
    `, [rid]);

    const paymentSplit = await query(`
      SELECT payment_method, COUNT(*) as count
      FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status NOT IN ('cancelled')
      GROUP BY payment_method
    `, [rid]);

    const totalRev = await queryOne(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status NOT IN ('cancelled')
    `, [rid]);

    const avgBasket = await queryOne(`
      SELECT COALESCE(ROUND(AVG(total_amount)), 0) as avg FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status NOT IN ('cancelled')
    `, [rid]);

    const totalOrders = await queryOne(`
      SELECT COUNT(*) as count FROM orders WHERE (restaurant_id = $1 OR restaurant_id IS NULL) AND order_status NOT IN ('cancelled')
    `, [rid]);

    const days = dailyRevenue.map(r => parseInt(r.revenue)).reverse();
    while (days.length < 7) days.push(0);

    const counts = dailyOrders.map(r => parseInt(r.count)).reverse();
    while (counts.length < 7) counts.push(0);

    let wavePct = 0, cashPct = 0, orangePct = 0;
    const totalPmt = paymentSplit.reduce((s, r) => s + parseInt(r.count), 0);
    if (totalPmt > 0) {
      const wave = paymentSplit.find(r => r.payment_method === 'wave');
      const cash = paymentSplit.find(r => r.payment_method === 'cash');
      const orange = paymentSplit.find(r => r.payment_method === 'orange_money');
      wavePct = wave ? Math.round((parseInt(wave.count) / totalPmt) * 100) : 0;
      cashPct = cash ? Math.round((parseInt(cash.count) / totalPmt) * 100) : 0;
      orangePct = orange ? Math.round((parseInt(orange.count) / totalPmt) * 100) : 0;
    }

    const totalRevenue = parseInt(totalRev.total) || 0;
    const avgOrder = parseInt(avgBasket.avg) || 0;

    res.json({
      dailyRevenue: days,
      orderCounts: counts,
      totalRevenue,
      totalRevenueFormatted: `${totalRevenue.toLocaleString('fr-FR')} FCFA`,
      totalOrders: parseInt(totalOrders.count) || 0,
      avgOrder,
      avgOrderFormatted: `${avgOrder.toLocaleString('fr-FR')} FCFA`,
      paymentMethodSplit: { wave: wavePct, cash: cashPct, orange_money: orangePct },
      topProducts: topProducts.map(p => ({
        name: p.name,
        count: parseInt(p.count) || 0,
        revenue: parseInt(p.revenue) || 0,
      })),
    });
  } catch (err) {
    console.error('[getStats] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}