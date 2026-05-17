import { Router } from 'express';
import { getStats } from '../controllers/statsController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager'), getStats);

export default router;
