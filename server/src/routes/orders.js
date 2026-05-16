import { Router } from 'express';
import { getOrders, updateOrderStatus } from '../controllers/orderController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getOrders);
router.patch('/:id/status', auth, updateOrderStatus);

export default router;
