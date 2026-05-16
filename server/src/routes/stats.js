import { Router } from 'express';
import { getStats } from '../controllers/statsController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getStats);

export default router;
