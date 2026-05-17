import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import auth from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requirePermission('dashboard'), getDashboard);

export default router;
