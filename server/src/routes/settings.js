import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getSettings);
router.put('/', auth, updateSettings);

export default router;
