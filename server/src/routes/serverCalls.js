import { Router } from 'express';
import { getServerCalls, updateServerCallStatus } from '../controllers/serverCallController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getServerCalls);
router.patch('/:id/status', auth, updateServerCallStatus);

export default router;
