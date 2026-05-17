import { Router } from 'express';
import { getOrders, updateOrderStatus } from '../controllers/orderController.js';
import auth from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requirePermission('orders'), getOrders);
router.patch('/:id/status', auth, requirePermission('orders'), updateOrderStatus);

export default router;
