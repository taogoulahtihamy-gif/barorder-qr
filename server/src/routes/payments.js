import { Router } from 'express';
import { getPayments } from '../controllers/paymentController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getPayments);

export default router;
