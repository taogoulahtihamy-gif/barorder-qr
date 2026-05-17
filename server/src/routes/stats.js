import { Router } from 'express';
import { getStats } from '../controllers/statsController.js';
import auth from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requirePermission('stats'), getStats);

export default router;
