import { Router } from 'express';
import {
  getPromotions, createPromotion, updatePromotion,
  togglePromotionStatus, deletePromotion,
} from '../controllers/promotionController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager'), getPromotions);
router.post('/', auth, requireRole('admin', 'super_admin', 'manager'), createPromotion);
router.patch('/:id', auth, requireRole('admin', 'super_admin', 'manager'), updatePromotion);
router.patch('/:id/status', auth, requireRole('admin', 'super_admin', 'manager'), togglePromotionStatus);
router.delete('/:id', auth, requireRole('admin', 'super_admin', 'manager'), deletePromotion);

export default router;
