import { Router } from 'express';
import { getPayments } from '../controllers/paymentController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager', 'cashier'), getPayments);

export default router;
