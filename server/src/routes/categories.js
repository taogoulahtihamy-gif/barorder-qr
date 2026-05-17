import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager', 'waiter'), getCategories);
router.post('/', auth, requireRole('admin', 'super_admin', 'manager'), createCategory);
router.put('/:id', auth, requireRole('admin', 'super_admin', 'manager'), updateCategory);
router.delete('/:id', auth, requireRole('admin', 'super_admin', 'manager'), deleteCategory);

export default router;
