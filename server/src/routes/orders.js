import { Router } from 'express';
import { getOrders, updateOrderStatus } from '../controllers/orderController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier'), getOrders);
router.patch('/:id/status', auth, requireRole('admin', 'super_admin', 'manager', 'waiter', 'kitchen'), updateOrderStatus);

export default router;
