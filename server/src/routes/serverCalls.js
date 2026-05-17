import { Router } from 'express';
import { getServerCalls, updateServerCallStatus } from '../controllers/serverCallController.js';
import auth from '../middlewares/authMiddleware.js';
import { requirePermission, requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requirePermission('server_calls'), getServerCalls);
router.patch('/:id/status', auth, requireRole('super_admin', 'manager', 'waiter'), updateServerCallStatus);

export default router;
