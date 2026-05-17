import { Router } from 'express';
import { getServerCalls, updateServerCallStatus } from '../controllers/serverCallController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager', 'waiter'), getServerCalls);
router.patch('/:id/status', auth, requireRole('admin', 'super_admin', 'manager', 'waiter'), updateServerCallStatus);

export default router;
