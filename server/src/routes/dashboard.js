import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getDashboard);

export default router;
