import { Router } from 'express';
import authRoutes from './auth.js';
import publicRoutes from './public.js';
import orderRoutes from './orders.js';
import productRoutes from './products.js';
import categoryRoutes from './categories.js';
import tableRoutes from './tables.js';
import paymentRoutes from './payments.js';
import dashboardRoutes from './dashboard.js';
import serverCallRoutes from './serverCalls.js';
import settingsRoutes from './settings.js';
import statsRoutes from './stats.js';
import { query } from '../config/database.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/admin/orders', orderRoutes);
router.use('/admin/products', productRoutes);
router.use('/admin/categories', categoryRoutes);
router.use('/admin/tables', tableRoutes);
router.use('/admin/payments', paymentRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/admin/server-calls', serverCallRoutes);
router.use('/admin/server-alerts', serverCallRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/stats', statsRoutes);

router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await query('SELECT id, name, slug, address, phone FROM restaurants ORDER BY name');
    res.json(restaurants);
  } catch (err) {
    console.error('[GET /restaurants] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
