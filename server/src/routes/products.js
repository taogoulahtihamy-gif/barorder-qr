import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, toggleAvailability } from '../controllers/productController.js';
import auth from '../middlewares/authMiddleware.js';
import { requirePermission, requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requirePermission('products'), getProducts);
router.post('/', auth, requireRole('super_admin', 'manager'), createProduct);
router.put('/:id', auth, requireRole('super_admin', 'manager'), updateProduct);
router.delete('/:id', auth, requireRole('super_admin', 'manager'), deleteProduct);
router.patch('/:id/availability', auth, requireRole('super_admin', 'manager'), toggleAvailability);

export default router;
