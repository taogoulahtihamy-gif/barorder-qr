import { Router } from 'express';
import { getPayments } from '../controllers/paymentController.js';
import auth from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requirePermission('payments'), getPayments);

export default router;
