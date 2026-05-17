import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager'), getDashboard);

export default router;
