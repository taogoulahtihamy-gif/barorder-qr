import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager'), getSettings);
router.put('/', auth, requireRole('admin', 'super_admin', 'manager'), updateSettings);

export default router;
